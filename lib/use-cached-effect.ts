import { useEffect, useRef } from 'react';

export function useCachedEffect(fn: () => void, inputs: any[], cacheKey: string) {
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Ensure the side effect runs only once per cache key
    if (sessionStorage.getItem(cacheKey)) {
      return;
    }

    if (isMountedRef.current) {
      fn();
      sessionStorage.setItem(cacheKey, 'executed'); // Cache the execution
    } else {
      isMountedRef.current = true;
    }
  }, inputs);
}
