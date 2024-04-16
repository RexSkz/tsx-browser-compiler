import React from 'react';

interface FileNameProps {
	focusTab: (index: number) => void;
	renameTab: (index: number, newFileName: string) => void;
	closeTab: (index: number) => void;
	filename: string;
	index: number;
	currentIndex: number;
	className?: string;
}

const FileName: React.FC<FileNameProps> = ({
	focusTab,
	renameTab,
	closeTab,
	filename,
	index,
	currentIndex,
	className
}) => {
	const [edit, setEdit] = React.useState<boolean>(false);

	const inputRef = React.useRef<HTMLInputElement>(null);

	const dbTab = () => {
		setEdit(true);
		setTimeout(() => {
			inputRef.current?.focus();
		}, 0);
	};

	return (
		<span
			key={filename}
			onClick={() => focusTab(index)}
			onDoubleClick={dbTab}
			className={[
				'playground-tabs-tab',
				index > 0 && 'playground-tabs-tab-with-suffix',
				currentIndex === index && 'playground-tabs-tab-active'
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

export default FileName;
