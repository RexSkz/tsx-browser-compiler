import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

import getHighlightLanguage from '../utils/get-highlight-language';
import usePreferColorScheme from '../hooks/use-prefer-color-scheme';

import FileNameTab from './filename-tab';

interface EditorProps {
	className?: string;
	sources: [string, string][];
	onSourceChange: (sources: [string, string][]) => void;
}

const Editor: React.FC<EditorProps> = ({ className, sources, onSourceChange }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentFilename = sources[currentIndex]?.[0] ?? '';
  const currentCode = (sources[currentIndex] ?? sources[0])[1];
  const newFileIndex = React.useRef(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const focusTab = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => textareaRef.current?.setSelectionRange(0, 0));
    }
  };

  React.useEffect(() => {
    focusTab();
  }, []);

  const switchToTab = (index: number) => {
    setCurrentIndex(index);
    focusTab();
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
    switchToTab(sources.length);
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
    switchToTab(index);
  };

  const closeTab = (index: number) => {
    if (index === 0) {
      return;
    }
    const confirmClose = confirm(`Are you sure to close "${sources[index][0]}"?\nThis action cannot be undone!`);
    if (!confirmClose) {
      return;
    }
    switchToTab(index - 1);
    onSourceChange(sources.filter((_, i) => i !== index));
  };

  const onEditorKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = e => {
    if (e.key === 'Home') {
      e.preventDefault();
      const el = e.currentTarget;
      if (e.ctrlKey) {
        el.setSelectionRange(0, 0);
      } else {
        const currentPosition = el.selectionStart;
        const isSelection = el.selectionEnd !== currentPosition;
        const lineStart = currentCode.lastIndexOf('\n', currentPosition - 1) + 1;
        const firstNonSpace = Math.max(currentCode.slice(lineStart, currentPosition + 1).search(/\S/), 0) + lineStart;
        const targetPosition = currentPosition === firstNonSpace ? lineStart : firstNonSpace;
        if (e.shiftKey) {
          el.setSelectionRange(targetPosition, isSelection ? el.selectionEnd : currentPosition, 'backward');
        } else {
          el.setSelectionRange(targetPosition, targetPosition, 'backward');
        }
      }
    }
  };

  const preferColorScheme = usePreferColorScheme();

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
          <FileNameTab
            key={index}
            switchToTab={switchToTab}
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
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => {
              const newSources = [...sources];
              newSources[currentIndex][1] = e.target.value;
              onSourceChange(newSources);
            }}
            onKeyDown={onEditorKeyDown}
          />
          <Highlight
            theme={preferColorScheme === 'light' ? themes.oneLight : themes.vsDark}
            code={currentCode}
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
        </div>
      </div>
    </div>
  );
};

export default Editor;
