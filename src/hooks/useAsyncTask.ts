import {useCallback, useEffect, useRef, useState} from 'react';

interface AsyncTaskState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Track the latest invocation of a local async task. Use TanStack Query for
 * server state. Obsolete invocations still settle for their original callers.
 */
export const useAsyncTask = <TArgs extends unknown[], TResult>(
  task: (...args: TArgs) => Promise<TResult>,
) => {
  const mounted = useRef(true);
  const invocation = useRef(0);
  const [state, setState] = useState<AsyncTaskState<TResult>>({
    data: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      invocation.current += 1;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs) => {
      const currentInvocation = ++invocation.current;

      if (mounted.current) {
        setState(current => ({...current, error: null, loading: true}));
      }

      try {
        const data = await task(...args);

        if (mounted.current && currentInvocation === invocation.current) {
          setState({data, error: null, loading: false});
        }

        return data;
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error(String(error));

        if (mounted.current && currentInvocation === invocation.current) {
          setState({data: null, error: normalizedError, loading: false});
        }

        throw normalizedError;
      }
    },
    [task],
  );

  /** Stop tracking pending results; this does not abort the underlying task. */
  const cancel = useCallback(() => {
    invocation.current += 1;

    if (mounted.current) {
      setState(current => ({...current, loading: false}));
    }
  }, []);

  const reset = useCallback(() => {
    invocation.current += 1;

    if (mounted.current) {
      setState({data: null, error: null, loading: false});
    }
  }, []);

  return {
    ...state,
    run,
    cancel,
    reset,
  };
};
