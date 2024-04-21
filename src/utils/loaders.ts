import type { ModuleRule } from '../types';

import { normalizePath } from './normalize-path';

const cssRe = /\.(?:c|le|sa|sc)ss|stylus$/i;
const jsRe = /\.m?[jt]sx?$/i;
const jsonRe = /\.json$/i;

const enforceOrderMap = {
  pre: -1,
  default: 0,
  post: 1,
};

const normalizeRules = (rules: ModuleRule[]) => {
  const normalizedRules = rules.map(rule => ({
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
    enforce: 'default',
  }));
  normalizedRules.sort((a, b) => enforceOrderMap[a.enforce] - enforceOrderMap[b.enforce]);
  return normalizedRules;
};

const applyRules = (rules: ModuleRule[], filename: string, content: string): {
  content: string;
  error: Error | null;
} => {
  let result = content;
  let error: Error | null = null;
  for (const rule of normalizeRules(rules)) {
    if (rule.test.test(filename)) {
      // forward: pitch
      for (let i = 0; i < rule.use.length; i++) {
        const { loader, options } = rule.use[i];
        if (loader.pitch) {
          loader.pitch(result, { filename, options }, (err, newContent) => {
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
      // backward: normal
      for (let i = rule.use.length - 1; i >= 0; i--) {
        const { loader, options } = rule.use[i];
        loader(result, { filename, options }, (err, newContent) => {
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
    // Types for non-ts files, see:
    // https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions
    parsedSources[`${filename}.d.ts`] = `declare const result: any;\nexport default result;`;
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
