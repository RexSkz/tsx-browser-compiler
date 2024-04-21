import type React from 'react';

export type RequireFn = (absolutePath: string, curentFileName: string) => any;

export type ClosureFn = (require: RequireFn) => any;

export interface ResolveConfig {
  extensions: string[];
  externals: Record<string, string>;
  cdnPrefix: string;
};

export interface LoaderMeta {
  filename: string;
  options: Record<string, unknown>;
  [key: string]: unknown;
};

export type LoaderCallback = (err: Error | null, content: string, meta: LoaderMeta) => void;

export interface LoaderFn {
  (content: string, meta: LoaderMeta, cb: LoaderCallback): void;
  pitch?: (content: string, meta: LoaderMeta) => string;
}

export interface ModuleRule {
  test: RegExp;
  use: (LoaderFn | {
    loader: LoaderFn;
    options?: Record<string, unknown>;
  })[];
  enforce?: 'pre' | 'post';
}

export interface Config {
  sources: Record<string, string>;
  entryFile?: string;
  resolve?: Partial<ResolveConfig>;
  requireFn?: (absolutePath: string) => any;
  rules?: ModuleRule[];
  displayName?: string;
};

export interface ReturnValue {
  component: React.ReactElement | null;
  defaultExport: any;
  compiled: [string, string][];
  errors: Error[];
  cleanup: () => void;
}
