import type { ModuleRule } from '../types';

import { normalizePath } from './normalize-path';

const cssRe = /\.(?:c|le|sa|sc)ss|stylus$/i;
const jsRe = /\.m?[jt]sx?$/i;
const jsonRe = /\.json$/i;

const enforceOrderMap = {
  pre: 1,
  default: 0,
  post: -1,
};

const normalizeRules = (rules: ModuleRule[]) => {
  const normalizedRules = rules.map((rule, index) => ({
    test: rule.test instanceof RegExp ? rule.test : new RegExp(rule.test),
    use: rule.use.map(loader => {
      if (typeof loader === 'function') {
        return {
          loader,
          options: {},
        };
      }
      return {
        ...loader,
        options: loader.options || {},
      };
    }),
    enforce: rule.enforce || 'default',
    _originalOrder: index,
  }));
  normalizedRules.sort((a, b) => {
    if (a.enforce === b.enforce) {
      return a._originalOrder - b._originalOrder;
    }
    return enforceOrderMap[a.enforce] - enforceOrderMap[b.enforce];
  });
  return normalizedRules;
};

const applyRules = (rules: ModuleRule[], filename: string, content: string): {
  content: string;
  error: Error | null;
} => {
  let result = content;
  let error: Error | null = null;
  const currentMeta = { filename, options: {} };
  for (const rule of normalizeRules(rules)) {
    if (rule.test.test(filename)) {
      // forward: pitch
      let pitchLoaderIndex = 0;
      for (; pitchLoaderIndex < rule.use.length; pitchLoaderIndex++) {
        const { loader, options } = rule.use[pitchLoaderIndex];
        currentMeta.options = options;
        if (loader.pitch) {
          try {
            const newContent = loader.pitch(result, currentMeta);
            if (typeof newContent !== 'undefined') {
              result = newContent;
              break;
            }
          } catch (e) {
            return { content: result, error: e };
          }
        }
      }
      // backward: normal
      for (let i = Math.min(pitchLoaderIndex, rule.use.length - 1); i >= 0; i--) {
        const { loader, options } = rule.use[i];
        currentMeta.options = options;
        loader(result, currentMeta, (err, newContent) => {
          if (err) {
            error = err;
            return;
          }
          result = newContent;
        });
        if (error) {
          return { content: result, error };
        }
      }
    }
  }
  return { content: result, error: null };
};

export const parseSources = (
  sources: Record<string, string>,
  rules: ModuleRule[],
  errors: Error[],
) => {
  const cleanupFiles: string[] = [];
  const parsedSources: Record<string, string> = {};
  for (const [_filename, _content] of Object.entries(sources)) {
    const filename = normalizePath(
      _filename.startsWith('/') ? _filename : `/${_filename}`,
      '/index.js',
    );
    const { content, error } = applyRules(rules, filename, _content);
    if (error) {
      error.message = `${filename}: ${error.message}`;
      errors.push(error);
      continue;
    }
    if (jsRe.test(filename)) {
      parsedSources[filename] = content;
      continue;
    }
    if (jsonRe.test(filename)) {
      parsedSources[`${filename}.js`] = `export default ${content};`;
    } else if (cssRe.test(filename)) {
      parsedSources[filename] = `
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
      parsedSources[filename] = content;
    }
  };
  return { parsedSources, cleanupFiles };
};
