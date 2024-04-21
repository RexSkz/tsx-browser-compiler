import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

import getHighlightLanguage from '../utils/get-highlight-language';
import usePreferColorScheme from '../hooks/use-prefer-color-scheme';

interface CompileResultProps {
  className?: string;
  result: [string, string][];
  errors: Error[];
  loading: boolean;
}

const CompileResult: React.FC<CompileResultProps> = ({
  className,
  result,
  errors,
  loading,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const currentFilename = result[currentIndex]?.[0] ?? '';
  const code = result[currentIndex] ? result[currentIndex][1] : '';
  const [formattedCode, setFormattedCode] = React.useState(code);
  React.useEffect(() => {
    if (!code) {
      return;
    }
    (window as any).prettier.format(code, {
      parser: 'babel',
      plugins: [
        (window as any).prettierPlugins.estree,
        (window as any).prettierPlugins.babel,
      ],
    }).then((formatted: string) => {
      setFormattedCode(formatted);
    });
  }, [code]);

  const preferColorScheme = usePreferColorScheme();

  return (
    <div className={className}>
      <div className={`${className}-tabs playground-tabs`}>
        {result.length ? null : <div className="playground-tabs-tab">No file</div>}
        {
          result.map(([filename], index) => (
            <span
              key={filename}
              className={`playground-tabs-tab ${currentIndex === index ? 'playground-tabs-tab-active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              {filename.startsWith('/') ? filename.slice(1) : filename}
            </span>
          ))
        }
      </div>
      {loading ? <div className={`${className}-loading`}>Compiling...</div> : null}
      <Highlight
        theme={preferColorScheme === 'light' ? themes.oneLight : themes.vsDark}
        code={formattedCode}
        language={getHighlightLanguage(currentFilename)}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      {
        errors.length ? (
          <div className={`${className}-error`}>
            <pre><b>Error while compiling.</b></pre>
            {errors.map((error, index) => (
              <pre key={index}>{error.message}</pre>
            ))}
          </div>
        ) : null
      }
    </div>
  );
};

export default CompileResult;
