import * as React from 'react';

import { createRequireFn } from './resolving';
import { createFsMap, createTsProgram } from './ts-vfs';
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

const allSourceCode = undefined;
const errNoCode = new Error('No code found');

export const asyncTsxToElement = async({
  sources,
  entryFile = '/index.js',
  resolve,
  requireFn,
  displayName = 'TsxToElement',
}: Config): Promise<ReturnValue> => {
  const fsMap = await createFsMap(sources);
  const program = createTsProgram(fsMap);
  const codeMap: [string, string][] = [];
  const closureMap: Record<string, ClosureFn> = {};
  const errors: Error[] = [];
  // TODO: add ts diagnostics errors
  program.emit(allSourceCode, (filename, code) => {
    codeMap.push([filename, code]);
    try {
      closureMap[filename] = codeToClosure(code);
    } catch (e) {
      errors.push(e);
    }
  });
  if (!Object.keys(closureMap).length) {
    return {
      component: null,
      defaultExport: null,
      compiled: codeMap,
      errors: [errNoCode],
    };
  }
  try {
    const closure = closureMap[entryFile];
    if (!closure) {
      return {
        component: null,
        defaultExport: null,
        compiled: codeMap,
        errors: [new Error(`Cannot find entry file '${entryFile}'`)],
      };
    }
    const result = closure(createRequireFn(closureMap, resolve, requireFn));
    result.default.displayName = displayName;
    return {
      component: React.createElement(result.default),
      defaultExport: result.default,
      compiled: codeMap,
      errors: [],
    };
  } catch (e) {
    return {
      component: null,
      defaultExport: null,
      compiled: codeMap,
      errors: [e as Error],
    };
  }
};
