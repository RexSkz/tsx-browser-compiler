import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import FileName from './filename';

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
    if (sources.some(([filename], i) => filename === newFileName && i !== index)) {
      alert(`File "${newFileName}" already exists!`);
      return;
    }
    if (!newFileName) {
      alert('File name cannot be empty!');
      return;
    }
    const newSources = [...sources];
    newSources[index][0] = newFileName;
    onSourceChange(newSources);
    focusTab(index);
  };

  const closeTab = (index: number) => {
    const confirmClose = confirm(`Are you sure to close "${sources[index][0]}"?\nThis action cannot be undone!`);
    if (!confirmClose) {
      return;
    }
    focusTab(index - 1);
    onSourceChange(sources.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div
        className={`${className}-tabs playground-tabs`}
        onDoubleClick={(e) => e.target === e.currentTarget && addTab()}
      >
        <button className={`playground-tabs-tab ${className}-tabs-add`} onClick={addTab}>
          +
        </button>
        {sources.map(([filename], index) => (
          <FileName
            key={index}
            focusTab={focusTab}
            renameTab={renameTab}
            closeTab={closeTab}
            filename={filename}
            index={index}
            currentIndex={currentIndex}
            className={className}
          />
        ))}
      </div>
      <div className={`${className}-code`}>
        <div className={`${className}-code-inner`}>
          {
            currentCode ? null : (
              <div className={`${className}-code-placeholder`}>
                {'// Type some code to start...'}
              </div>
            )
          }
          <Highlight theme={themes.oneLight} code={currentCode} language="tsx">
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
            onChange={(e) => {
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
