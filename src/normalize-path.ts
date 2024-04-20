export const normalizePath = (path: string, baseFileName: string) => {
  if (path.startsWith('/')) {
    return path;
  }
  if (path.startsWith('.')) {
    const currentPath = baseFileName.split('/');
    currentPath.pop();
    while (1) {
      if (path.startsWith('../')) {
        currentPath.pop();
        path = path.substring(3);
      } else if (path.startsWith('./')) {
        path = path.substring(2);
      } else {
        break;
      }
    }
    currentPath.push(path);
    return currentPath.join('/');
  }
  return path;
};
