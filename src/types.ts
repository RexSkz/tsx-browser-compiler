import type React from 'react';

export type RequireFn = (path: string) => any;

export type ClosureFn = (require: RequireFn) => any;

export interface ResolveConfig {
  extensions: string[];
  externals: Record<string, string>;
};

export interface Config {
  sources: Record<string, string>;
  entryFile?: string;
  resolve?: Partial<ResolveConfig>;
  requireFn?: (path: string) => any;
  displayName?: string;
};

export interface ReturnValue {
  component: React.ReactElement | null;
  defaultExport: any;
  compiled: [string, string][];
  errors: Error[];
}
