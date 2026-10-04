import {useEffect, useState} from 'react';

/** Useful for search inputs; clear the pending update on changes and unmount. */
export const useDebouncedValue = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedValue(value),
      Math.max(0, delay),
    );

    return () => clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
};
