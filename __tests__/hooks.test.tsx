import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {useAsyncTask, useDebouncedValue} from '@/hooks';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {promise, resolve, reject};
};

describe('useAsyncTask', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const renderTask = async (task: () => Promise<string>) => {
    let result!: ReturnType<typeof useAsyncTask<[], string>>;
    let renderCount = 0;

    const TestHook = () => {
      result = useAsyncTask(task);
      renderCount += 1;
      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<TestHook />);
    });

    return {
      get result() {
        return result;
      },
      get renderCount() {
        return renderCount;
      },
    };
  };

  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
    renderer = undefined;
  });

  test('only the newest invocation updates state, while callers receive their own results', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const task = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const hook = await renderTask(task);
    let firstRun!: Promise<string>;
    let secondRun!: Promise<string>;

    await ReactTestRenderer.act(async () => {
      firstRun = hook.result.run();
      secondRun = hook.result.run();
    });

    await ReactTestRenderer.act(async () => {
      first.resolve('obsolete');
      await firstRun;
    });
    expect(hook.result.loading).toBe(true);
    expect(hook.result.data).toBeNull();

    await ReactTestRenderer.act(async () => {
      second.resolve('current');
      await secondRun;
    });
    expect(hook.result.data).toBe('current');
    expect(hook.result.loading).toBe(false);
    await expect(firstRun).resolves.toBe('obsolete');
  });

  test('an obsolete failure cannot overwrite a newer successful result', async () => {
    const obsolete = deferred<string>();
    const current = deferred<string>();
    const task = jest
      .fn()
      .mockReturnValueOnce(obsolete.promise)
      .mockReturnValueOnce(current.promise);
    const hook = await renderTask(task);
    let obsoleteRun!: Promise<string>;
    let currentRun!: Promise<string>;

    await ReactTestRenderer.act(async () => {
      obsoleteRun = hook.result.run();
      currentRun = hook.result.run();
    });
    await ReactTestRenderer.act(async () => {
      current.resolve('current');
      await currentRun;
    });
    await ReactTestRenderer.act(async () => {
      obsolete.reject(new Error('obsolete failure'));
      await expect(obsoleteRun).rejects.toThrow('obsolete failure');
    });

    expect(hook.result.data).toBe('current');
    expect(hook.result.error).toBeNull();
    expect(hook.result.loading).toBe(false);
  });

  test('reset prevents a pending completion from repopulating cleared state', async () => {
    const pending = deferred<string>();
    const hook = await renderTask(() => pending.promise);
    let run!: Promise<string>;

    await ReactTestRenderer.act(async () => {
      run = hook.result.run();
    });
    await ReactTestRenderer.act(async () => {
      hook.result.reset();
      pending.resolve('late');
      await run;
    });

    expect(hook.result.data).toBeNull();
    expect(hook.result.error).toBeNull();
    expect(hook.result.loading).toBe(false);
  });

  test('cancel stops tracking results without aborting the original promise', async () => {
    const pending = deferred<string>();
    const hook = await renderTask(() => pending.promise);
    let run!: Promise<string>;

    await ReactTestRenderer.act(async () => {
      run = hook.result.run();
      hook.result.cancel();
    });
    expect(hook.result.loading).toBe(false);

    await ReactTestRenderer.act(async () => {
      pending.resolve('still completed');
      await expect(run).resolves.toBe('still completed');
    });
    expect(hook.result.data).toBeNull();
  });

  test('normalizes rejection values and clears loading', async () => {
    const hook = await renderTask(async () => {
      throw 'failed task';
    });

    await ReactTestRenderer.act(async () => {
      await expect(hook.result.run()).rejects.toThrow('failed task');
    });

    expect(hook.result.error?.message).toBe('failed task');
    expect(hook.result.loading).toBe(false);
  });

  test('a task settling after unmount does not render again', async () => {
    const pending = deferred<string>();
    const hook = await renderTask(() => pending.promise);
    let run!: Promise<string>;

    await ReactTestRenderer.act(async () => {
      run = hook.result.run();
    });
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
    renderer = undefined;
    const previousRenderCount = hook.renderCount;

    await ReactTestRenderer.act(async () => {
      pending.resolve('late');
      await run;
    });
    expect(hook.renderCount).toBe(previousRenderCount);
  });
});

describe('useDebouncedValue', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  let currentValue: string;

  const TestHook = ({value, delay = 300}: {value: string; delay?: number}) => {
    currentValue = useDebouncedValue(value, delay);
    return null;
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    ReactTestRenderer.act(() => renderer?.unmount());
    jest.useRealTimers();
  });

  test('publishes only the latest input after its full delay', () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TestHook value="initial" />);
    });
    expect(currentValue).toBe('initial');

    ReactTestRenderer.act(() => {
      renderer.update(<TestHook value="first" />);
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(200);
    });
    ReactTestRenderer.act(() => {
      renderer.update(<TestHook value="second" />);
    });
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(currentValue).toBe('initial');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(currentValue).toBe('second');
  });

  test('clears the pending timer when unmounted', () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TestHook value="initial" />);
    });
    ReactTestRenderer.act(() => {
      renderer.update(<TestHook value="changed" />);
    });
    ReactTestRenderer.act(() => renderer.unmount());

    expect(jest.getTimerCount()).toBe(0);
    ReactTestRenderer.act(() => jest.runOnlyPendingTimers());
    expect(currentValue).toBe('initial');
  });
});
