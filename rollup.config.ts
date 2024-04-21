import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import swc from 'rollup-plugin-swc';

import packageJson from './package.json';

const plugins = [
  resolve({
    preferBuiltins: true,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  }),
  commonjs(),
  replace({
    values: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      __VERSION__: JSON.stringify(packageJson.version),
    },
    preventAssignment: true,
  }),
  swc({
    minify: process.env.NODE_ENV === 'production',
    sourceMaps: process.env.NODE_ENV !== 'production',
  }),
];

const globals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'jsx',
  'typescript': 'ts',
};

export default {
  input: {
    index: 'src/index.ts',
  },
  output: [
    { dir: './dist', format: 'esm', globals, exports: 'auto' },
    { dir: './dist/cjs', format: 'cjs', globals, exports: 'auto' },
  ],
  external: Object.keys(globals),
  plugins,
};
