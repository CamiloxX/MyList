"use client";

import { useEffect, useState } from "react";

/**
 * Returns a value that only updates after `delay` ms of stability.
 * Useful for debouncing user input before triggering side effects.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
