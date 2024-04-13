import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  createSystem,
  createDefaultMapFromCDN,
  createVirtualCompilerHost,
} from '@typescript/vfs';
import ts from 'typescript';
import { debounce } from 'throttle-debounce';

const compilerOptions: ts.CompilerOptions = {
  allowSyntheticDefaultImports: true,
  declaration: false,
  emitHelpers: false,
  esModuleInterop: true,
  jsx: ts.JsxEmit.React,
  module: ts.ModuleKind.CommonJS,
  noEmitOnError: false,
  outDir: '/',
  skipLibCheck: true,
  skipDefaultLibCheck: true,
  target: ts.ScriptTarget.ES2021,
};

const createFsMap = async (sources: Record<string, string>) => {
  const fsMap = await createDefaultMapFromCDN({ target: ts.ScriptTarget.ES2021 }, ts.version, true, ts);
  for (const filename in sources) {
    if (/\.[jt]sx?$/.test(filename) || filename === '_') {
      fsMap.set(
        filename === '_' ? 'index.tsx' : filename,
        '// @ts-nocheck\n' + sources[filename],
      );
    }
  }
  return fsMap;
};

const createTsProgram = (fsMap: Map<string, string>) => {
  const system = createSystem(fsMap);
  const host = createVirtualCompilerHost(system, compilerOptions, ts)
  const program = ts.createProgram({
    rootNames: [...fsMap.keys()],
    options: compilerOptions,
    host: host.compilerHost,
  });
  return program;
}

const codeToClosure = (code: string) => {
  return eval(`(require) => {
    const exports = {};
    ${code}
    return exports;
  }`)
};

export type RequireFn = (path: string) => any;
export type ClosureFn = (require: RequireFn) => any;

// TODO: support object-type config like `resolve` in webpack
const createRequireFn = (
  closureMap: Map<string, ClosureFn>,
  customRequireFn?: RequireFn,
): RequireFn => {
  const fn = (path: string) => {
    if (customRequireFn) {
      try {
        return customRequireFn(path);
      } catch { }
    }
    if (path === 'react') return React;
    if (path === 'react-dom') return ReactDOM;
    if (path.endsWith('.css') || path.endsWith('.less')) {
      return EMPTY_EXPORT;
    }
    const closure = closureMap[path] ?? closureMap[`${path}.js`];
    if (!closure) {
      throw new Error(`Cannot find module '${path}'`);
    }
    return closure(fn);
  };
  return fn;
};

const ALL_SOURCE_CODE = undefined;
const EMPTY_EXPORT = {};

export interface Config {
  sources: Record<string, string>,
  entryFile: string,
  requireFn?: (path: string) => any,
  displayName?: string,
};

const tsxToElement = async ({
  sources,
  entryFile,
  requireFn,
  displayName = 'TsxToElement',
}: Config) => {
  const fsMap = await createFsMap(sources);
  const program = createTsProgram(fsMap);
  const closureMap = new Map<string, ClosureFn>();
  program.emit(ALL_SOURCE_CODE, (filename, code) => {
    closureMap.set(`.${filename}`, codeToClosure(code));
  });
  if (!closureMap) {
    return { component: null, error: 'No code found' };
  }
  try {
    const closure = closureMap.get(entryFile);
    if (!closure) {
      return { component: null, error: `Cannot find entry file '${entryFile}'` };
    }
    const result = closure(createRequireFn(closureMap, requireFn));
    result.default.displayName = displayName;
    return {
      component: React.createElement(result.default),
      error: null,
    };
  } catch (e) {
    return { component: null, error: e as Error };
  }
};

export default tsxToElement;
