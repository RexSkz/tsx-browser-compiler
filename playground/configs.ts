export const defaultCodeSet: [string, string][] = [
  [
    'index.tsx',
    `
import React from 'react';
import ForkMeOnGithub from 'fork-me-on-github';

import { repo } from './constants';
import dataJson from './data.json';

import './style.less';

export default () => {
  const [count, setCount] = React.useState(0);
  return (
    <div className="container">
      <h1>Hello, {dataJson.name}!</h1>
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
@container-prefix-cls: ~'container';

:root {
  --button-outline-color: rgba(0, 0, 0, 0.3);
  --button-border-color: #333;
  --button-background-color: rgba(0, 0, 0, 0.04);
  --button-background-color-active: rgba(0, 0, 0, 0.08);
  --button-color: #000;
}

@media (prefers-color-scheme: dark) {
  :root {
    --button-outline-color: rgba(255, 255, 255, 0.3);
    --button-border-color: #ccc;
    --button-background-color: rgba(255, 255, 255, 0.08);
    --button-background-color-active: rgba(255, 255, 255, 0.2);
    --button-color: #fff;
  }
}

.@{container-prefix-cls} {
  padding: 0 24px;

  button {
    padding: 4px 8px;
    background: var(--button-background-color);
    border: 1px solid var(--button-border-color);
    border-radius: 4px;
    color: var(--button-color);
    font-size: 14px;
    cursor: pointer;

    &:hover,
    &:focus {
      outline: var(--button-outline-color) solid 4px;
    }

    &:active {
      background: var(--button-background-color-active);
    }
  }
}
    `.trim(),
  ],
  [
    'data.json',
    `
{
  "name": "Rex Zeng",
}
    `.trim(),
  ],
];
