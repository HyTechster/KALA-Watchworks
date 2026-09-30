import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { StrapSize } from '../../data/configurator-options';

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}' .-]*[\p{L}.]$/u;
// Local part, @, domain labels and a TLD of at least two letters.
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** A person's name: 2–60 characters, letters with spaces, hyphens, apostrophes or dots. */
export function personNameValidator(): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const raw = control.value ?? '';
    const value = raw.trim();
    if (!value) return null; // `required` reports emptiness.
    if (value.length < 2 || value.length > 60 || !NAME_PATTERN.test(value)) {
      return { personName: { actual: raw } };
    }
    return null;
  };
}

/**
 * Stricter than Angular's built-in email validator: it requires a dotted domain with a
 * real top-level domain, so `name@host` is rejected.
 */
export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    if (value.length > 254 || !EMAIL_PATTERN.test(value) || value.includes('..')) {
      return { strictEmail: { actual: control.value } };
    }
    return null;
  };
}

/** Accepts only one of the offered strap sizes. */
export function strapSizeValidator(allowed: readonly StrapSize[]): ValidatorFn {
  return (control: AbstractControl<StrapSize | '' | null>): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') return null;
    return allowed.includes(value) ? null : { strapSize: { allowed, actual: value } };
  };
}
