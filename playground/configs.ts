export const defaultCodeSet: [string, string][] = [
  [
    'index.tsx',
    `
import React from 'react';
import ForkMeOnGithub from 'fork-me-on-github';

import { repo } from './constants';

import './style.less';

export default () => {
  const [count, setCount] = React.useState(0);
  return (
    <div className="container">
      <h1>Hello, world!</h1>
      <p>This is an example React App.</p>
      <p>Repo URL: <a href={repo} target="_blank">{repo}</a></p>
      <button onClick={() => setCount(count + 1)}>
        You clicked me {count} time(s).
      </button>
      <ForkMeOnGithub repo={repo} />
    </div>
  );
);
`.trim(),
  ],
  [
    'constants.ts',
    `export const repo = 'https://github.com/rexskz/tsx-browser-compiler';`,
  ],
  [
    'style.less',
    `
:root {
  --button-outline-color: rgba(0, 0, 0, 0.3);
}

.container {
  padding: 0 24px;

  button {
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:hover,
    &:focus {
      outline: var(--button-outline-color) solid 4px;
    }

    &:active {
      background: rgba(0, 0, 0, 0.08);
    }
  }
}
`.trim(),
  ],
];
