import {logger} from '@/utils/logger';

test('redacts nested credentials and handles circular diagnostic payloads', () => {
  const output = jest.spyOn(console, 'error').mockImplementation(() => {});
  const payload: Record<string, unknown> = {
    status: 401,
    headers: {Authorization: 'Bearer private-token'},
    session: {accessToken: 'private-token', password: 'private-password'},
  };
  payload.self = payload;

  try {
    logger.error('Request failed', payload);
    const diagnostic = JSON.stringify(output.mock.calls[0]);
    expect(diagnostic).toContain('401');
    expect(diagnostic).toContain('[REDACTED]');
    expect(diagnostic).toContain('[Circular]');
    expect(diagnostic).not.toContain('private-token');
    expect(diagnostic).not.toContain('private-password');
    expect(payload.headers).toEqual({Authorization: 'Bearer private-token'});
  } finally {
    output.mockRestore();
  }
});

test('does not log request config attached to an Error instance', () => {
  const output = jest.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(new Error('Request failed'), {
    config: {headers: {Authorization: 'Bearer private-token'}},
  });
  try {
    logger.error('Request failed', error);
    expect(output).toHaveBeenCalledWith('Request failed', {
      name: 'Error',
      message: 'Request failed',
    });
  } finally {
    output.mockRestore();
  }
});
