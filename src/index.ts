import * as React from 'react';

import { createRequireFn } from './resolving';
import { createFsMap, createTsEnv } from './ts-vfs';
import type {
  Config,
  ClosureFn,
  ReturnValue,
} from './types';

export type * from './types';

const codeToClosure = (code: string) => {
  // Is there a better way to do this?
  // eslint-disable-next-line no-eval
  return eval(`(require) => {
    const exports = {};
    ${code}
    return exports;
  }`);
};

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
  const fsMap = await createFsMap(sources);
  const env = createTsEnv(fsMap);
  const codeMap: [string, string][] = [];
  const closureMap: Record<string, ClosureFn> = {};
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
        closureMap[filename] = codeToClosure(code);
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
    const result = closure(createRequireFn(closureMap, resolve, requireFn));
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
