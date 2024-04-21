# TSX Browser Compiler

Transform a set of `.tsx` (as well as other extensions) files into React elements, extremely useful for the "live edit" feature in component library documents. [Try it out in the playground!](https://rexskz.github.io/tsx-browser-compiler/)

## Install

You can install `tsx-browser-compiler` via various package managers.

```sh
# using npm
npm i tsx-browser-compiler --save

# using yarn
yarn add tsx-browser-compiler

# using pnpm
pnpm add tsx-browser-compiler
```

## Quick Start

To transform the TSX codes to React elements, just provide them to `asyncTsxToElement` and render the `component` field (or `errors` field if you'd like to display errors) in the returned value.

CSS is also supported and will be auto-injected into the document head. You may use the `cleanup` field to remove them (e.g. use a `useEffect` with a dependency `component`).

```tsx
// Transforming can be slow, so it's recommended to debounce this call.
// e.g. use `useDebouncedEffect` written in `playground/hooks/use-debounced-effect.ts`.
const { component, errors, cleanup } = await asyncTsxToElement({
  sources: {
    'index.tsx': `
      import React from 'react';
      import './style.css';

      export default function MyComponent() {
        return <div className="my-component">Hello, world!</div>;
      }
    `,
    'style.css': `
      .my-component {
        color: red;
      }
    `,
  },
});
```

## Advanced Usage

There are more options you can provide to `asyncTsxToElement`.

### `entryFile`

- `string`
- The entry file of the project. By default, it's the first file in the `sources` object.

### `resolve`

- `Partial<ResolveConfig>`
- Provide custom resolution options: `extensions`, `externals`, `cdnPrefix`.

#### Extensions

The `resolve.extensions` field is an array of strings that will be appended to the generated file path when resolving modules. By default, it's `['.js']`. Note that `.tsx`, `.ts` and `.json` files will all be converted to `.js` files, please see the playground example.

#### Externals

The `resolve.externals` field is an object that maps module names to global variables. There are several types of externals:

- Window: if `window[value]` exists, it will be treated as the module.
- URL: if the value starts with `https://` or `http://`, it will be treated as a UMD file URL. The resolver will load the file and get its exports.
- Semver: the resolver will try to load the library from a CDN with the given version. You can specify which CDN to use in the `cdnPrefix` field (we use UNPKG by default).

Note that if you specify the `cdnPrefix` field, your CDN must support returning the correct UMD file like UNPKG, e.g. `${cdnPrefix}/axios` should be redirected to `${cdnPrefix}/axios@[a.b.c]/dist/axios.min.js` or return the file directly without redirection.

Here are some examples.

```tsx
const { component, cleanup } = await asyncTsxToElement({
  resolve: {
    externals: {
      // assume `window.React` exists
      'react': 'React',
      // load `axios` UMD file from URL
      'axios': 'https://unpkg.com/axios',
      // load `antd` from CDN with the version `5.16.2`
      'antd': '5.16.2',
    },
    // jsDelivr is a CDN service that returns the correct UMD file directly
    cdnPrefix: 'https://cdn.jsdelivr.net/npm/',
  },
});
```

### `requireFn`

- `(absolutePath: string) => any`
- Provide a custom `require` function to fully control the module resolution.

### `rules`

- `ModuleRule[]`
- Like Webpack's module rules, you can provide custom rules to transform the source code.

#### Module Rules

Sometimes you may want to transform the source code before it's executed, or you have to use the non-js files. The `rules` field provides a way to do this.

```tsx
import less from 'less';

const { component, cleanup } = await asyncTsxToElement({
  rules: [
    {
      test: /\.less$/,
      use: [
        /**
         * @param content The content of the file
         * @param meta Meta information, including `filename`, `options` and other custom fields
         * @param callback The callback function to return the transformed content
         */
        (content, meta, callback) => {
          less.render(
            content,
            { filename: meta.filename },
            (err: Error, result: { css: string }) => {
              if (err) {
                callback(err, '', meta);
              } else {
                callback(null, result.css, meta);
              }
            },
          );
        },
      ],
    },
  ],
});
```

Here is an example of passing `options` to the rule.

```tsx
import less from 'less';

const { component, cleanup } = await asyncTsxToElement({
  rules: [
    {
      test: /\.less$/,
      use: [
        {
          loader: (content, meta, callback) => { ... },
          // will be passwd to the `meta` parameter
          options: { ... },
        },
      ],
    },
  ],
});
```

#### Adjust the Order of Rules and Loaders

//

### `displayName`

- `string`
- The display name of the transformed component. By default, it's `/index.js`.
