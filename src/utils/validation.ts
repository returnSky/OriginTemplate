/** Validators return a localized message, or undefined for a valid value. */
export type Validator = (value: string) => string | undefined;

export const required =
  (message: string): Validator =>
  value =>
    value.trim().length > 0 ? undefined : message;

/** Basic email shape validation; server validation remains authoritative. */
export const email =
  (message: string): Validator =>
  value => {
    const normalized = value.trim();

    return !normalized || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
      ? undefined
      : message;
  };

/** Length checks preserve whitespace, which may be meaningful in passwords. */
export const minLength =
  (length: number, message: string): Validator =>
  value =>
    !value || value.length >= length ? undefined : message;

export const maxLength =
  (length: number, message: string): Validator =>
  value =>
    value.length <= length ? undefined : message;

export const matches =
  (other: string, message: string): Validator =>
  value =>
    value === other ? undefined : message;

/** Return the first error so required checks can precede format checks. */
export const validate = (
  value: string,
  validators: readonly Validator[],
): string | undefined => {
  for (const validator of validators) {
    const error = validator(value);

    if (error) {
      return error;
    }
  }

  return undefined;
};
