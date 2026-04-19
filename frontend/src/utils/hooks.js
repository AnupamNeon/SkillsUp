import { useRef, useEffect, useCallback, useState } from "react";
import { exponentialDelay } from "./helpers";

/**
 * Track if component is mounted
 */
export function useMounted() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

/**
 * Safe state setter (prevents updates after unmount)
 */
export function useSafeState(initialState) {
  const [state, setState] = useState(initialState);
  const isMountedRef = useMounted();

  const setSafeState = useCallback((value) => {
    if (!isMountedRef.current) return;

    setState((prev) =>
      typeof value === "function" ? value(prev) : value
    );
  }, [isMountedRef]);

  return [state, setSafeState];
}

/**
 * Polling hook (safe + no overlapping calls)
 */
export function usePolling(callback, interval = 1000, maxAttempts = Infinity) {
  const isMountedRef = useMounted();
  const timeoutRef = useRef(null);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const run = useCallback(async () => {
    if (!isMountedRef.current) return;

    attemptRef.current += 1;
    setAttempt(attemptRef.current);

    try {
      const shouldStop = await callback(attemptRef.current);

      if (
        shouldStop ||
        attemptRef.current >= maxAttempts ||
        !isMountedRef.current
      ) {
        stopPolling();
        return;
      }

      timeoutRef.current = setTimeout(run, interval);
    } catch {
      stopPolling();
    }
  }, [callback, interval, maxAttempts, stopPolling, isMountedRef]);

  const startPolling = useCallback(() => {
    if (timeoutRef.current) return; // prevent duplicates
    attemptRef.current = 0;
    setAttempt(0);
    run();
  }, [run]);

  useEffect(() => stopPolling, [stopPolling]);

  return { startPolling, stopPolling, attempt };
}

/**
 * Timer hook (accurate countdown)
 */
export function useTimer(endTime, onComplete) {
  const [timeLeft, setTimeLeft] = useState(null);
  const isMountedRef = useMounted();

  useEffect(() => {
    if (!endTime) return;

    let timeout;

    const tick = () => {
      if (!isMountedRef.current) return;

      const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        onComplete?.();
        return;
      }

      timeout = setTimeout(tick, 1000);
    };

    tick();

    return () => clearTimeout(timeout);
  }, [endTime, onComplete]);

  return timeLeft;
}

/**
 * API hook with retry + cancellation safety
 */
export function useApiWithRetry(apiFn, maxRetries = 3, baseDelay = 1000) {
  const isMountedRef = useMounted();
  const abortRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      abortRef.current = false;

      setLoading(true);
      setError(null);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!isMountedRef.current || abortRef.current) return;

        try {
          const result = await apiFn(...args);

          if (isMountedRef.current && !abortRef.current) {
            const finalData = result?.data ?? result;
            setData(finalData);
            setLoading(false);
          }

          return result?.data ?? result;
        } catch (err) {
          if (attempt === maxRetries) {
            if (isMountedRef.current && !abortRef.current) {
              setError(err);
              setLoading(false);
            }
            throw err;
          }

          await new Promise((resolve) => {
            const delay = exponentialDelay(attempt, baseDelay);
            const timeout = setTimeout(resolve, delay);

            // cancel delay if unmounted
            if (abortRef.current) clearTimeout(timeout);
          });
        }
      }
    },
    [apiFn, maxRetries, baseDelay, isMountedRef]
  );

  return { execute, loading, error, data };
}

/**
 * Debounce hook
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * LocalStorage hook (SSR-safe + functional updates)
 */
export function useLocalStorage(key, initialValue) {
  const isBrowser = typeof window !== "undefined";

  const [storedValue, setStoredValue] = useState(() => {
    if (!isBrowser) return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      if (!isBrowser) return;

      try {
        const newValue =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, isBrowser]
  );

  return [storedValue, setValue];
}