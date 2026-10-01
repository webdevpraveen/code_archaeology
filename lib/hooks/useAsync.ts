import { useCallback, useEffect, useState } from 'react';

interface UsePollOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePoll<T>(
  fetcher: () => Promise<T>,
  options: UsePollOptions = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { interval = 5000, enabled = true, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, enabled, onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, refetch]);

  // Set up polling
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, refetch]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook for loading data from an async function
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
): {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: E | null;
} {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  useEffect(() => {
    if (!immediate) {
      return;
    }

    let cancelled = false;

    setStatus('pending');

    asyncFunction()
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setStatus('success');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asyncFunction, immediate]);

  return { status, data, error };
}

/**
 * Hook to track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const [previous, setPrevious] = useState<T | undefined>();

  useEffect(() => {
    setPrevious(value);
  }, [value]);

  return previous;
}
