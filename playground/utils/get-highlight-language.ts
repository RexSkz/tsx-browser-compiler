const getHighlightLanguage = (filename: string) => {
  const ext = filename.split('.').pop();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return 'tsx';
    case 'json':
      return 'json';
    case 'css':
    case 'less':
    case 'sass':
    case 'scss':
    case 'stylus':
      return 'css';
    case 'html':
      return 'html';
    default:
      return 'plaintext';
  }
};

export default getHighlightLanguage;
