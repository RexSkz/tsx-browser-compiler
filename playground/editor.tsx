import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface EditorProps {
  className?: string;
  sources: [string, string][];
  onSourceChange: (sources: [string, string][]) => void;
}

const Editor: React.FC<EditorProps> = ({ className, sources, onSourceChange }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentCode = (sources[currentIndex] ?? sources[0])[1];
  const newFileIndex = React.useRef(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const focusTab = (index: number) => {
    setCurrentIndex(index);
    setTimeout(() => textareaRef.current?.focus());
  };

  const addTab = () => {
    const fileNameMap = new Set<string>();
    for (const [filename] of sources) {
      fileNameMap.add(filename);
    }
    let newFileName = `/new-file-${newFileIndex.current++}.tsx`;
    while (fileNameMap.has(newFileName)) {
      newFileName = `/new-file-${newFileIndex.current++}.tsx`;
    }
    onSourceChange([...sources, [newFileName, '']]);
    focusTab(sources.length);
  };

  const renameTab = (index: number, newFileName: string) => {
    const newSources = [...sources];
    newSources[index][0] = newFileName;
    onSourceChange(newSources);
    focusTab(index);
  };

  const closeTab = (index: number) => {
    focusTab(index - 1);
    onSourceChange(sources.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div className={`${className}-tabs playground-tabs`} onDoubleClick={e => e.target === e.currentTarget && addTab()}>
        <button className={`playground-tabs-tab ${className}-tabs-add`} onClick={addTab}>+</button>
        {
          sources.map(([filename], index) => (
            <span
              key={filename}
              onClick={() => focusTab(index)}
              onMouseDown={e => index > 0 && e.button === 1 && closeTab(index)}
              className={[
                'playground-tabs-tab',
                index > 0 && 'playground-tabs-tab-with-suffix',
                currentIndex === index && 'playground-tabs-tab-active',
              ].filter(Boolean).join(' ')}
            >
              {filename}
              {index > 0 ? <button className={`${className}-tabs-close`} onClick={() => closeTab(index)}>×</button> : null}
            </span>
          ))
        }
      </div>
      <div className={`${className}-code`}>
        <div className={`${className}-code-inner`}>
          {
            currentCode ? null : (
              <div className={`${className}-code-placeholder`}>
                // Type some code to start...
              </div>
            )
          }
          <Highlight
            theme={themes.oneLight}
            code={currentCode}
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
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={e => {
              const newSources = [...sources];
              newSources[currentIndex][1] = e.target.value;
              onSourceChange(newSources);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
