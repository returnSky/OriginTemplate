import {
  email,
  matches,
  maxLength,
  minLength,
  required,
  validate,
} from '@/utils/validation';

describe('form validation', () => {
  test('reports required errors before email format errors', () => {
    const rules = [required('required'), email('invalid email')];

    expect(validate('  ', rules)).toBe('required');
    expect(validate('bad-address', rules)).toBe('invalid email');
    expect(validate(' user@example.com ', rules)).toBeUndefined();
  });

  test.each(['', 'user@example.com', 'first.last+tag@example.co.uk'])(
    'allows optional or valid email: %s',
    value => {
      expect(email('invalid')(value)).toBeUndefined();
    },
  );

  test.each(['user@', '@example.com', 'user@example', 'a b@example.com'])(
    'rejects an invalid email: %s',
    value => {
      expect(email('invalid')(value)).toBe('invalid');
    },
  );

  test('preserves meaningful password whitespace in length checks', () => {
    expect(minLength(8, 'short')(' pass123')).toBeUndefined();
    expect(minLength(8, 'short')('pass123')).toBe('short');
    expect(
      validate('        ', [required('required'), minLength(8, 'short')]),
    ).toBe('required');
    expect(maxLength(8, 'long')('password1')).toBe('long');
    expect(matches('password', 'mismatch')('password')).toBeUndefined();
    expect(matches('password', 'mismatch')('PASSWORD')).toBe('mismatch');
  });
});
