import React from 'react';
import { debounce } from 'throttle-debounce';

const useDebouncedEffect = <T>(
  factory: () => T,
  deps: React.DependencyList,
  timeMs: number,
) => {
  const debouncedFactory = React.useRef(factory);
  const debounced = React.useRef(debounce(timeMs, () => {
    return debouncedFactory.current();
  }));
  React.useEffect(() => {
    debouncedFactory.current = factory;
    return debounced.current();
  }, deps);
};

export default useDebouncedEffect;
