import type { ModuleRule } from '../types';

export const applyRules = (rules: ModuleRule[], filename: string, content: string) => {
  let result = content;
  let error: Error | null = null;
  for (const rule of rules) {
    if (rule.test.test(filename)) {
      for (let i = rule.use.length - 1; i >= 0; i--) {
        const loader = rule.use[i];
        loader(result, { filename }, (err, newContent) => {
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
