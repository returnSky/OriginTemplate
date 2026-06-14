type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const write = (level: LogLevel, message: string, payload?: unknown) => {
  if (!__DEV__ && level !== 'error') {
    return;
  }

  const args = payload === undefined ? [message] : [message, payload];

  if (level === 'debug') {
    console.debug(...args);
    return;
  }

  if (level === 'info') {
    console.info(...args);
    return;
  }

  if (level === 'warn') {
    console.warn(...args);
    return;
  }

  console.error(...args);
};

export const logger = {
  debug: (message: string, payload?: unknown) =>
    write('debug', message, payload),
  info: (message: string, payload?: unknown) => write('info', message, payload),
  warn: (message: string, payload?: unknown) => write('warn', message, payload),
  error: (message: string, payload?: unknown) =>
    write('error', message, payload),
};
