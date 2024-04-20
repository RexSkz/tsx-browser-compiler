import type { ClosureFn, ResolveConfig } from '../types';

import { codeToClosure } from './resolving';

const loadUMDModule = async(url: string) => {
  const res = await fetch(url);
  const code = await res.text();
  return codeToClosure(code, url);
};

export const loadExternalsToClosureMap = async(
  resolve: ResolveConfig,
  closureMap: Record<string, ClosureFn>,
) => {
  // TODO: parallelise
  for (const [name, value] of Object.entries(resolve.externals)) {
    if (/^https?:\/\//.test(value)) {
      closureMap[name] = await loadUMDModule(value);
    } else if (window[value]) {
      closureMap[name] = () => window[value];
    } else {
      // CDN will read the "brower" field in `package.json`
      // and return the UMD bundle
      closureMap[name] = await loadUMDModule(`${resolve.cdnPrefix}/${name}@${value}`);
    }
  }
};
