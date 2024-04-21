import React from 'react';
import ReactDOM from 'react-dom/client';

import { asyncTsxToElement } from '../src';

import CompileResult from './components/compile-result';
import { defaultCodeSet } from './configs';
import Editor from './components/editor';
import Previewer from './components/previewer';
import useDebouncedEffect from './hooks/use-debounced-effect';

import './index.less';

const localStorageKey = 'tsx-browser-compiler-playground-sources';

const Playground: React.FC = () => {
  const [sources, setSources] = React.useState<[string, string][]>(defaultCodeSet);
  const [loading, setLoading] = React.useState(false);
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
          use: [
            (content, meta, callback) => {
              (window as any).less.render(
                content,
                {
                  filename: meta.filename,
                  minimize: true,
                },
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
        <h1>TSX Browser Compiler</h1>
        <div>
          <button onClick={resetDemo}>Reset demo</button>
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
