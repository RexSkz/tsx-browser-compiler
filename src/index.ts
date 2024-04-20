import * as React from 'react';

import { loadExternalsToClosureMap } from './utils/externals';
import { normalizePath } from './utils/normalize-path';
import { codeToClosure, createClosureMap, createRequireFn, mergeResolve } from './utils/resolving';
import { applyRules } from './utils/rules';
import { createFsMap, createTsEnv } from './utils/ts-vfs';
import type { Config, ReturnValue } from './types';

export type * from './types';

const errNoCode = new Error('No code emitted.');
const ignoredCode = [
  2307,
  6054,
  7026,
];

const cssRe = /\.(?:c|le|sa|sc)ss|stylus$/i;
const jsRe = /\.m?[jt]sx?$/i;
const jsonRe = /\.json$/i;

const noop = () => { };

export const asyncTsxToElement = async({
  sources,
  entryFile = '/index.js',
  resolve,
  requireFn,
  rules = [],
  displayName = 'TsxToElement',
}: Config): Promise<ReturnValue> => {
  const codeMap: [string, string][] = [];
  const closureMap = createClosureMap();
  const cleanupFiles: string[] = [];
  const errors: Error[] = [];
  const parsedSources = Object.entries(sources).reduce((acc, [_filename, _content]) => {
    if (!_filename.startsWith('/')) {
      _filename = '/' + _filename;
    }
    const filename = normalizePath(_filename, '/index.js');
    const { content, error } = applyRules(rules, filename, _content);
    if (error) {
      errors.push(error);
      return acc;
    }
    if (jsRe.test(filename)) {
      acc[filename] = content;
    } else {
      // Types for non-ts files, see:
      // https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions
      acc[`${filename}.d.ts`] = `declare const result: any;\nexport default result;`;
      if (jsonRe.test(filename)) {
        acc[`${filename}.js`] = `export default ${content};`;
      } else if (cssRe.test(filename)) {
        acc[filename] = `
const s = \`${content.trim()}\`;
let el = document.head.querySelector('style[data-tsx-browser-compiler-filename="${filename}"]');
if (!el) {
  el = document.createElement('style');
  el.setAttribute('data-tsx-browser-compiler-filename', '${filename}');
  document.head.appendChild(el);
}
el.textContent = s;
        `;
        cleanupFiles.push(filename);
      } else {
        errors.push(new Error(`${filename}: you may need a custom rule for this file type.`));
        acc[filename] = content;
      }
    }
    return acc;
  }, {} as Record<string, string>);
  const fsMap = await createFsMap(parsedSources);
  const env = createTsEnv(fsMap);
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
