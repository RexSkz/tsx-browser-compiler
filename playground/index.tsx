import React from 'react';
import ReactDOM from 'react-dom/client';

import { asyncTsxToElement } from '../src';

import CompileResult from './compile-result';
import Editor from './editor';
import Previewer from './previewer';
import useDebouncedEffect from './use-debounced-effect';

import './index.less';

const defaultCodeSet: [string, string][] = [
  [
    '/index.tsx',
    `
import React from 'react';
import ForkMeOnGithub from 'fork-me-on-github';

import { repo } from '/constants';

export default () => {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ padding: '0 24px' }}>
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
    '/constants.ts',
    `export const repo = 'https://github.com/rexskz/tsx-browser-compiler';`,
  ],
];

const localStorageKey = 'tsx-browser-compiler-playground-sources';

const Playground: React.FC = () => {
  const [sources, setSources] = React.useState<[string, string][]>(defaultCodeSet);
  const [layout, setLayout] = React.useState('horizontal');
  const [displayedChildren, setDisplayedChildren] = React.useState<React.ReactNode>(null);
  const [displayedCompiled, setDisplayedCompiled] = React.useState<[string, string][]>([]);
  const [displayedErrors, setDisplayedErrors] = React.useState<Error[]>([]);

  React.useEffect(() => {
    const storedSources = localStorage.getItem(localStorageKey);
    if (storedSources !== null) {
      try {
        setSources(JSON.parse(storedSources));
      } catch { }
    }
  }, []);

  useDebouncedEffect(async() => {
    const { component, compiled, errors } = await asyncTsxToElement({
      sources: Object.fromEntries(sources),
      resolve: {
        externals: {
          'fork-me-on-github': 'https://unpkg.com/fork-me-on-github@1.0.6/lib/index.js',
        },
      },
    });
    if (component !== null) {
      setDisplayedChildren(component);
      setDisplayedErrors([]);
    }
    setDisplayedCompiled(compiled);
    if (errors !== null) {
      setDisplayedErrors(errors);
    }
    localStorage.setItem(localStorageKey, JSON.stringify(sources));
  }, [sources], 1000);

  return (
    <div className="app">
      <div className="controls">
        <h1>TSX Browser Compiler</h1>
        <div>
          <label htmlFor="horizontal" className={layout === 'horizontal' ? 'checked' : ''}>
            <input type="radio"
              name="layout"
              id="horizontal"
              defaultChecked
              onChange={() => setLayout('horizontal')}
            />
            <span>Horizontal</span>
          </label>
          <label htmlFor="vertical" className={layout === 'vertical' ? 'checked' : ''}>
            <input
              type="radio"
              id="vertical"
              name="layout"
              onChange={() => setLayout('vertical')}
            />
            <span>Vertical</span>
          </label>
        </div>
      </div>
      <div className={`playground playground-layout-${layout}`}>
        <Editor
          className="playground-editor"
          sources={sources}
          onSourceChange={setSources}
        />
        <CompileResult
          className="playground-compile-result"
          result={displayedCompiled}
          errors={displayedErrors}
        />
        <Previewer className="playground-previewer">
          {displayedChildren}
        </Previewer>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><Playground /></React.StrictMode>);
