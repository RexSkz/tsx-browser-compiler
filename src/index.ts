import * as React from 'react';

import { loadExternalsToClosureMap } from './externals';
import { normalizePath } from './normalize-path';
import { codeToClosure, createClosureMap, createRequireFn, mergeResolve } from './resolving';
import { createFsMap, createTsEnv } from './ts-vfs';
import type { Config, ReturnValue } from './types';

export type * from './types';

const errNoCode = new Error('No code emitted.');
const ignoredCode = [
  2307,
  7026,
];

export const asyncTsxToElement = async({
  sources,
  entryFile = '/index.js',
  resolve,
  requireFn,
  displayName = 'TsxToElement',
}: Config): Promise<ReturnValue> => {
  const sourcesWithNormalizedPath = Object.entries(sources).reduce((acc, [key, value]) => {
    if (!key.startsWith('/')) {
      key = '/' + key;
    }
    key = normalizePath(key, '/index.js');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  entryFile = normalizePath(entryFile, '/index.js');
  const fsMap = await createFsMap(sourcesWithNormalizedPath);
  const env = createTsEnv(fsMap);
  const codeMap: [string, string][] = [];
  const closureMap = createClosureMap();
  const errors: Error[] = [];
  for (const filename of fsMap.keys()) {
    const emitOutput = env.languageService.getEmitOutput(filename);
    if (!emitOutput) {
      continue;
    }
    const diagnostics = env.languageService.getSemanticDiagnostics(filename);
    for (const diagnostic of diagnostics) {
      if (!ignoredCode.includes(diagnostic.code)) {
        errors.push(new Error(`${diagnostic.file?.fileName}: ${diagnostic.messageText} ts(${diagnostic.code})`));
      }
    }
    if (emitOutput.outputFiles.length) {
      const code = emitOutput.outputFiles[0].text;
      const filename = emitOutput.outputFiles[0].name;
      codeMap.push([filename, code]);
      try {
        closureMap[filename] = codeToClosure(code, filename);
      } catch (e) {
        e.message = `${filename}: ${e.message}`;
        errors.push(e);
      }
    }
  }
  if (!Object.keys(closureMap).length) {
    errors.push(errNoCode);
    return {
      component: null,
      defaultExport: null,
      compiled: codeMap,
      errors,
    };
  }
  try {
    const closure = closureMap[entryFile];
    if (!closure) {
      errors.push(new Error(`No entry file emitted: '${entryFile}'.`));
      return {
        component: null,
        defaultExport: null,
        compiled: codeMap,
        errors,
      };
    }
    const mergedResolve = mergeResolve(resolve);
    await loadExternalsToClosureMap(mergedResolve, closureMap);
    const result = closure(createRequireFn(closureMap, requireFn, mergedResolve));
    result.default.displayName = displayName;
    return {
      component: React.createElement(result.default),
      defaultExport: result.default,
      compiled: codeMap,
      errors,
    };
  } catch (e) {
    errors.push(e);
    return {
      component: null,
      defaultExport: null,
      compiled: codeMap,
      errors,
    };
  }
};
