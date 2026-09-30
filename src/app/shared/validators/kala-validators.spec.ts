import { FormControl } from '@angular/forms';
import { StrapSize } from '../../data/configurator-options';
import { personNameValidator, strapSizeValidator, strictEmailValidator } from './kala-validators';

describe('personNameValidator', () => {
  const validate = (value: string) => personNameValidator()(new FormControl(value));

  it('accepts ordinary names with spaces, hyphens, apostrophes and accents', () => {
    for (const name of ['Amirul', 'Nur Afiqah', "O'Neill", 'Anne-Marie', 'Zoë Østergaard', 'Dr. Tan']) {
      expect(validate(name), name).toBeNull();
    }
  });

  it('leaves empty values to the required validator', () => {
    expect(validate('')).toBeNull();
    expect(validate('   ')).toBeNull();
  });

  it('rejects names that are too short, too long or contain digits and symbols', () => {
    for (const bad of ['A', 'x'.repeat(61), 'R2-D2', 'hello@there', '-Dash', "Trailing'"]) {
      expect(validate(bad), bad).toEqual({ personName: { actual: bad } });
    }
  });
});

describe('strictEmailValidator', () => {
  const validate = (value: string) => strictEmailValidator()(new FormControl(value));

  it('accepts complete addresses', () => {
    for (const email of ['hello@kala.example', 'first.last+watch@mail.co.uk', 'a_b@sub.domain.io']) {
      expect(validate(email), email).toBeNull();
    }
  });

  it('rejects addresses without a real top-level domain or with broken parts', () => {
    for (const bad of ['name@host', 'name@', '@kala.com', 'name@kala.c', 'na..me@kala.com', 'name kala@x.com']) {
      expect(validate(bad), bad).not.toBeNull();
    }
  });

  it('leaves empty values to the required validator', () => {
    expect(validate('')).toBeNull();
  });
});

describe('strapSizeValidator', () => {
  const allowed: StrapSize[] = ['S', 'M', 'L'];
  const validate = (value: StrapSize | '' | null) =>
    strapSizeValidator(allowed)(new FormControl<StrapSize | '' | null>(value));

  it('accepts offered sizes', () => {
    expect(validate('S')).toBeNull();
    expect(validate('L')).toBeNull();
  });

  it('rejects sizes that are not offered', () => {
    expect(validate('XL' as StrapSize)).toEqual({ strapSize: { allowed, actual: 'XL' } });
  });

  it('leaves an empty selection to the required validator', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
  });
});
