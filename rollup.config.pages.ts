import commonjs from '@rollup/plugin-commonjs';
import externalGlobals from 'rollup-plugin-external-globals';
import html from '@rollup/plugin-html';
import less from 'rollup-plugin-less';
import livereload from 'rollup-plugin-livereload';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import styles from 'rollup-plugin-styles';
import swc from 'rollup-plugin-swc';
import ts from 'typescript';

import packageJson from './package.json';

const BASEDIR = process.env.BASEDIR || '.cache';

const plugins = [
  less({
    output: `${BASEDIR}/index.css`,
    insert: true,
  }),
  styles(),
  html({
    template: options => {
      return `<!DOCTYPE html>
<html>
<head>
  <title>TSX Browser Compiler Playground</title>
  <meta charset="utf-8" />
</head>
<body>
  <script>
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.setAttribute('data-theme', 'dark');
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      document.body.setAttribute('data-theme', event.matches ? 'dark' : 'light');
    });
  </script>
  <div id="root"></div>
  <script src="https://www.unpkg.com/typescript@${ts.version}/lib/typescript.js"></script>
  <script src="https://unpkg.com/prettier@3.2.5/standalone.js"></script>
  <script src="https://unpkg.com/prettier@3.2.5/plugins/estree.js"></script>
  <script src="https://unpkg.com/prettier@3.2.5/plugins/babel.js"></script>
  <script src="https://unpkg.com/less@4.2.0/dist/less.js"></script>
  ${options?.files.js.map(({ fileName }) => `<script src="${fileName}"></script>`)}
</body>
</html>
`;
    },
  }),
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
    jsc: {
      parser: {
        syntax: 'typescript',
      },
      transform: {
        react: { runtime: 'automatic' },
      },
      target: 'es2020',
      loose: true,
      keepClassNames: true,
    },
  }),
  externalGlobals({
    typescript: 'ts',
  }),
];

if (process.env.NODE_ENV !== 'production') {
  plugins.push(
    serve({
      contentBase: BASEDIR,
      open: true,
      openPage: '/index.html',
      port: 3000,
    }),
    livereload({
      watch: BASEDIR,
      delay: 300,
    }),
  );
}

export default {
  input: 'playground/index.tsx',
  output: {
    file: `${BASEDIR}/index.js`,
    name: 'Playground',
    format: 'umd',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  plugins,
};
