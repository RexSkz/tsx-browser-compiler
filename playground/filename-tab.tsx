import React from 'react';

interface FileNameTabProps {
	focusTab: (index: number) => void;
	renameTab: (index: number, newFileName: string) => void;
	closeTab: (index: number) => void;
	filename: string;
	index: number;
	currentIndex: number;
  className?: string;
}

const FileNameTab: React.FC<FileNameTabProps> = ({
  focusTab,
  renameTab,
  closeTab,
  filename,
  index,
  currentIndex,
  className,
}) => {
  const [edit, setEdit] = React.useState<boolean>(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const showRename = () => {
    if (index === 0) {
      return;
    }
    setEdit(true);
    setTimeout(() => inputRef.current?.focus());
  };

  return (
    <span
      onClick={() => focusTab(index)}
      onMouseDown={e => e.button === 1 && !edit && closeTab(index)}
      onDoubleClick={showRename}
      className={[
        'playground-tabs-tab',
        index > 0 && 'playground-tabs-tab-with-suffix',
        currentIndex === index && 'playground-tabs-tab-active',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {edit ? (
        <input
          ref={inputRef}
          defaultValue={filename}
          onBlur={(e) => {
            renameTab(index, e.target.value);
            setEdit(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              renameTab(index, e.currentTarget.value);
              setEdit(false);
            }
          }}
        />
      ) : (
        filename
      )}
      {index > 0 ? (
        <button className={`${className}-tabs-close`} onClick={() => closeTab(index)}>
          ×
        </button>
      ) : null}
    </span>
  );
};

export default FileNameTab;
