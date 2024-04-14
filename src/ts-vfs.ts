import {
  createSystem,
  createDefaultMapFromCDN,
  createVirtualCompilerHost,
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

export const createFsMap = async (sources: Record<string, string>) => {
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

export const createTsProgram = (fsMap: Map<string, string>) => {
  const system = createSystem(fsMap);
  const host = createVirtualCompilerHost(system, compilerOptions, ts)
  const program = ts.createProgram({
    rootNames: [...fsMap.keys()],
    options: compilerOptions,
    host: host.compilerHost,
  });
  return program;
}
