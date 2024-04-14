import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CompileResultProps {
  className?: string;
  result: [string, string][];
  errors: Error[];
}

const CompileResult: React.FC<CompileResultProps> = ({
  className,
  result,
  errors,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  return (
    <div className={className}>
      <div className={`${className}-tabs playground-tabs`}>
        {
          result.map(([filename], index) => (
            <span
              key={filename}
              className={`playground-tabs-tab ${currentIndex === index ? 'playground-tabs-tab-active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              {filename}
            </span>
          ))
        }
      </div>
      <Highlight
        theme={themes.oneLight}
        code={result[currentIndex] ? result[currentIndex][1] : '// No result'}
        language="tsx"
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
            <pre><b>Error while resolving.</b></pre>
            {errors.map((error, index) => (
              <pre key={index}>{error.stack}</pre>
            ))}
          </div>
        ) : null
      }
    </div>
  );
};

export default CompileResult;
