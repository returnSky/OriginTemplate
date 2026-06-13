import {useCallback, useState} from 'react';

interface AsyncTaskState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export const useAsyncTask = <TArgs extends unknown[], TResult>(
  task: (...args: TArgs) => Promise<TResult>,
) => {
  const [state, setState] = useState<AsyncTaskState<TResult>>({
    data: null,
    error: null,
    loading: false,
  });

  const run = useCallback(
    async (...args: TArgs) => {
      setState(current => ({...current, error: null, loading: true}));

      try {
        const data = await task(...args);
        setState({data, error: null, loading: false});
        return data;
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error(String(error));
        setState({data: null, error: normalizedError, loading: false});
        throw normalizedError;
      }
    },
    [task],
  );

  const reset = useCallback(() => {
    setState({data: null, error: null, loading: false});
  }, []);

  return {
    ...state,
    run,
    reset,
  };
};
