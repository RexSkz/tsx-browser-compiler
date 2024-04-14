import * as React from 'react';
import * as ReactDOM from 'react-dom';
import jsxRuntime from 'react/jsx-runtime';

import type { ClosureFn, RequireFn, ResolveConfig } from './types';

const emptyExport = {};
const defaultExternalsMap = {
  'react': React,
  'react-dom': ReactDOM,
  'react/jsx-runtime': jsxRuntime,
};

export const createRequireFn = (
  closureMap: Record<string, ClosureFn | undefined>,
  resolve: Partial<ResolveConfig> | undefined,
  requireFn: RequireFn | undefined,
): RequireFn => {
  const mergedResolve: ResolveConfig = {
    extensions: ['.js'],
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'react/jsx-runtime': 'jsxRuntime',
    },
    ...resolve,
  };

  for (const key in mergedResolve.externals) {
    const value = mergedResolve.externals[key];
    closureMap[key] = () => window[value] ?? defaultExternalsMap[key] ?? emptyExport;
  }

  const fn = (path: string) => {
    if (requireFn) {
      return requireFn(path);
    }
    if (/\.(?:css|less|s[ac]ss|stylus)$/.test(path)) {
      return emptyExport;
    }
    const tried: string[] = [path];
    let closure = closureMap[path];
    for (const extension of mergedResolve.extensions) {
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
