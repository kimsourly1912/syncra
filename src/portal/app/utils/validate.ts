import {
  HAS_MIN_LENGTH,
  HAS_DIGIT,
  HAS_SYMBOL,
  HAS_LOWERCASE,
  HAS_UPPERCASE,
  NO_WHITESPACE,
  REGX_AWS_PASSWORD,
} from '@/constants/regx'

export function validateMinLength(password: string): boolean {
  return HAS_MIN_LENGTH.test(password)
}

export function validateHasDigit(password: string): boolean {
  return HAS_DIGIT.test(password)
}

export function validateHasSymbol(password: string): boolean {
  return HAS_SYMBOL.test(password)
}

export function validateHasLowercase(password: string): boolean {
  return HAS_LOWERCASE.test(password)
}

export function validateHasUppercase(password: string): boolean {
  return HAS_UPPERCASE.test(password)
}

export function validateNoWhitespace(password: string): boolean {
  return NO_WHITESPACE.test(password)
}

// Comprehensive validation with detailed results
export function validatePasswordDetailed(password: string) {
  const validations = {
    minLength: validateMinLength(password),
    hasDigit: validateHasDigit(password),
    hasSymbol: validateHasSymbol(password),
    hasLowercase: validateHasLowercase(password),
    hasUppercase: validateHasUppercase(password),
    noWhitespace: validateNoWhitespace(password),
  }

  const isValid = Object.values(validations).every(Boolean)
  const errors = Object.entries(validations)
    .filter(([_, isValid]) => !isValid)
    .map(([key]) => key)

  return { isValid, validations, errors }
};

// Simple validation (like your original)
export function validatePassword(password: string): boolean {
  return REGX_AWS_PASSWORD.test(password)
}

export interface PasswordValidationMessage {
  text: string
  valid: boolean
}

export function getPasswordValidationMessages(password: string): PasswordValidationMessage[] {
  return [
    {
      text: 'No spaces',
      valid: validateNoWhitespace(password),
    },
    {
      text: 'Contains at least 8 characters',
      valid: validateMinLength(password),
    },
    {
      text: 'Contains both lower (a-z) and upper case letters (A-Z)',
      valid: validateHasLowercase(password) && validateHasUppercase(password),
    },
    {
      text: 'Contains both number (0-9) and symbol',
      valid: validateHasDigit(password) && validateHasSymbol(password),
    },
  ]
}
