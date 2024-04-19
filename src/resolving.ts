import * as React from 'react';
import * as ReactDOM from 'react-dom';
import jsxRuntime from 'react/jsx-runtime';

import type { ClosureFn, RequireFn, ResolveConfig } from './types';

const emptyExport = {};

export const createClosureMap = (): Record<string, ClosureFn> => {
  const closureMap: Record<string, ClosureFn> = {
    'react': () => React,
    'react-dom': () => ReactDOM,
    'react/jsx-runtime': () => jsxRuntime,
  };
  return closureMap;
};

export const codeToClosure = (code: string) => {
  // Is there a better way to do this?
  // eslint-disable-next-line no-eval
  return eval(`(require) => {
    const module = {};
    const exports = {};
    ${code}
    return module.exports ?? exports;
  }`);
};

const loadUMDModule = async(url: string) => {
  const res = await fetch(url);
  const code = await res.text();
  return codeToClosure(code);
};

export const loadExternalsToClosureMap = async(
  resolve: Partial<ResolveConfig> | undefined,
  closureMap: Record<string, ClosureFn>,
) => {
  // TODO: parallelise
  for (const [name, value] of Object.entries(resolve?.externals || {})) {
    if (value.startsWith('http')) {
      closureMap[name] = await loadUMDModule(value);
    } else {
      closureMap[name] = () => window[value];
    }
  }
};

export const createRequireFn = (
  closureMap: Record<string, ClosureFn | undefined>,
  requireFn: RequireFn | undefined,
  extensions: string[] = ['.js'],
): RequireFn => {
  const fn = (path: string) => {
    if (requireFn) {
      return requireFn(path);
    }
    if (/\.(?:css|less|s[ac]ss|stylus)$/.test(path)) {
      return emptyExport;
    }
    const tried: string[] = [path];
    let closure = closureMap[path];
    for (const extension of extensions) {
      if (closure) {
        break;
      }
      const pathWithExtension = `${path}${extension}`;
      closure = closureMap[pathWithExtension];
      tried.push(pathWithExtension);
    }
    if (!closure) {
      throw new Error(`Cannot find module '${path}' (tried ${tried.join(', ')})`);
    }
    return closure(fn);
  };

  return fn;
};
