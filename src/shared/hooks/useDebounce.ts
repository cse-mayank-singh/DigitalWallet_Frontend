import { useState, useEffect } from 'react';

/**
 * Delays updating a value until after the specified delay has passed
 * without the value changing. Prevents excessive API calls on rapid input.
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
