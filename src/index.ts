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
  6054,
  7026,
];

const noop = () => { };

export const asyncTsxToElement = async({
  sources,
  entryFile = '/index.js',
  resolve,
  requireFn,
  displayName = 'TsxToElement',
}: Config): Promise<ReturnValue> => {
  const codeMap: [string, string][] = [];
  const closureMap = createClosureMap();
  const cleanupFiles: string[] = [];
  const parsedSources = Object.entries(sources).reduce((acc, [key, value]) => {
    if (!key.startsWith('/')) {
      key = '/' + key;
    }
    key = normalizePath(key, '/index.js');
    if (/\.[jt]sx?$/.test(key)) {
      acc[key] = value;
    } else if (/\.(c|le)ss$/.test(key)) {
      // Types for non-ts files, see:
      // https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions
      acc[`${key}.d.ts`] = `declare const result: any;\nexport default result;`;
      acc[key] = `
// @ts-nocheck
const styleString = \`${value.trim()}\`;
const existed = document.head.querySelector('style[data-tsx-browser-compiler-filename="${key}"]');
if (existed) {
  existed.textContent = styleString;
  return;
}
const style = document.createElement('style');
style.setAttribute('data-tsx-browser-compiler-filename', '${key}');
style.textContent = styleString;
document.head.appendChild(style);
      `;
      cleanupFiles.push(key);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unsupported file type: ${key}.`);
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  const fsMap = await createFsMap(parsedSources);
  const env = createTsEnv(fsMap);
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
      cleanup: noop,
    };
  }
  try {
    const parsedEntryFile = normalizePath(entryFile, '/index.js');
    const closure = closureMap[parsedEntryFile];
    if (!closure) {
      errors.push(new Error(`No entry file emitted: '${parsedEntryFile}'.`));
      return {
        component: null,
        defaultExport: null,
        compiled: codeMap,
        errors,
        cleanup: noop,
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
      cleanup: () => {
        for (const filename of cleanupFiles) {
          const style = document.head.querySelector(`style[data-tsx-browser-compiler-filename="${filename}"]`);
          style?.remove();
        }
      },
    };
  } catch (e) {
    errors.push(e);
    return {
      component: null,
      defaultExport: null,
      compiled: codeMap,
      errors,
      cleanup: noop,
    };
  }
};
