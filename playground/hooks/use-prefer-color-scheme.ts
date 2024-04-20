import React from 'react';

const usePreferColorScheme = () => {
  const [theme, setTheme] = React.useState(() => (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  ));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    setTheme(event.matches ? 'dark' : 'light');
  });
  return theme;
};

export default usePreferColorScheme;
