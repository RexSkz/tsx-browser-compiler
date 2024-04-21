import React from 'react';
import ReactDOM from 'react-dom/client';

import { asyncTsxToElement, VERSION } from '../src';

import CompileResult from './components/compile-result';
import { defaultCodeSet } from './configs';
import Editor from './components/editor';
import Previewer from './components/previewer';
import useDebouncedEffect from './hooks/use-debounced-effect';
import BuildTimeMeasurementLoader from './loaders/build-time-measurement-loader';
import LessLoader from './loaders/less-loader';

import './index.less';

const localStorageKey = 'tsx-browser-compiler-playground-sources';

const IconSplit = (props: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" {...props}>
    <rect x="15" y="4" width="2" height="24" />
    <path d="M10,7V25H4V7h6m0-2H4A2,2,0,0,0,2,7V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z" />
    <path d="M28,7V25H22V7h6m0-2H22a2,2,0,0,0-2,2V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z" />
  </svg>
);

const Playground: React.FC = () => {
  const [sources, setSources] = React.useState<[string, string][]>(defaultCodeSet);
  const [loading, setLoading] = React.useState(false);
  const [layout, setLayout] = React.useState(window.innerWidth < 960 ? 'vertical' : 'horizontal');
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

  React.useEffect(() => {
    setLoading(true);
  }, [sources]);

  useDebouncedEffect(async() => {
    const { component, compiled, errors, cleanup } = await asyncTsxToElement({
      sources: Object.fromEntries(sources),
      resolve: {
        externals: {
          'fork-me-on-github': '1.0.6',
        },
      },
      rules: [
        {
          test: /\.less$/,
          use: [BuildTimeMeasurementLoader, LessLoader],
        },
      ],
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
    setLoading(false);

    return cleanup;
  }, [sources], 1000);

  const resetDemo = () => {
    if (confirm('Are you sure to reset the demo?\nThis will clear all your changes.')) {
      setSources(defaultCodeSet);
    }
  };

  return (
    <div className="app">
      <div className="controls">
        <h1>
          TSX Browser Compiler
          <small>v{VERSION}</small>
        </h1>
        <div className="controls-buttons">
          <button onClick={resetDemo}>Reset demo</button>
          <label htmlFor="horizontal" className={layout === 'horizontal' ? 'checked' : ''}>
            <IconSplit className="icon icon-split-horizontal" />
            <input type="radio"
              name="layout"
              id="horizontal"
              checked={layout === 'horizontal'}
              onChange={() => setLayout('horizontal')}
            />
          </label>
          <label htmlFor="vertical" className={layout === 'vertical' ? 'checked' : ''}>
            <IconSplit
              className="icon icon-split-vertical"
              style={{ transform: 'rotate(90deg)' }}
            />
            <input
              type="radio"
              id="vertical"
              name="layout"
              checked={layout === 'vertical'}
              onChange={() => setLayout('vertical')}
            />
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
          loading={loading}
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
