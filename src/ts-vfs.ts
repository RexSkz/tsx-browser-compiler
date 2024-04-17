import {
  createSystem,
  createDefaultMapFromCDN,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs';
import ts from 'typescript';

const compilerOptions: ts.CompilerOptions = {
  allowSyntheticDefaultImports: true,
  emitHelpers: false,
  esModuleInterop: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.CommonJS,
  noEmitOnError: false,
  outDir: '/',
  skipLibCheck: true,
  skipDefaultLibCheck: true,
  target: ts.ScriptTarget.ES2020,
};

export const createFsMap = async(sources: Record<string, string>) => {
  const fsMap = await createDefaultMapFromCDN({ target: compilerOptions.target }, ts.version, true, ts);
  for (const filename in sources) {
    if (/\.[jt]sx?$/.test(filename) || filename === '_') {
      fsMap.set(
        filename === '_' ? 'index.tsx' : filename,
        sources[filename],
      );
    }
  }
  return fsMap;
};

export const createTsEnv = (fsMap: Map<string, string>) => {
  const files = [...fsMap.keys()];
  const system = createSystem(fsMap);
  return createVirtualTypeScriptEnvironment(system, files, ts, compilerOptions);
};
