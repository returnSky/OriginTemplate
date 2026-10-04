type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const sensitiveKey =
  /authorization|cookie|password|token|secret|credential|api[-_]?key/i;

const sanitizePayload = (
  value: unknown,
  seen = new WeakSet<object>(),
  depth = 0,
): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  if (depth >= 6) {
    return '[Truncated]';
  }
  seen.add(value);

  if (value instanceof Error) {
    // Axios errors can contain complete request headers and credentials.
    return {name: value.name, message: value.message};
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizePayload(item, seen, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key)
        ? '[REDACTED]'
        : sanitizePayload(item, seen, depth + 1),
    ]),
  );
};

const write = (level: LogLevel, message: string, payload?: unknown) => {
  if (!__DEV__ && level !== 'error') {
    return;
  }

  const args =
    payload === undefined ? [message] : [message, sanitizePayload(payload)];

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
