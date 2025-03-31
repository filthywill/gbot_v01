import logger from './logger';

// Input validation rules
const INPUT_RULES = {
  maxLength: 50,
  minLength: 1,
  // Allowed characters (letters, numbers, basic punctuation)
  allowedPattern: /^[a-zA-Z0-9 ]*$/,
};

// Input validation error types
export type ValidationError = {
  code: 'EMPTY' | 'TOO_LONG' | 'INVALID_CHARS';
  message: string;
};

// Validate and sanitize input text
export const validateAndSanitizeInput = (input: string): { 
  isValid: boolean; 
  sanitizedValue: string; 
  error?: ValidationError;
} => {
  try {
    // Trim whitespace
    const trimmedInput = input.trim();

    // Check for empty input
    if (!trimmedInput) {
      return {
        isValid: false,
        sanitizedValue: '',
        error: {
          code: 'EMPTY',
          message: 'Input text cannot be empty'
        }
      };
    }

    // Check length
    if (trimmedInput.length > INPUT_RULES.maxLength) {
      return {
        isValid: false,
        sanitizedValue: trimmedInput.slice(0, INPUT_RULES.maxLength),
        error: {
          code: 'TOO_LONG',
          message: `Input text cannot be longer than ${INPUT_RULES.maxLength} characters`
        }
      };
    }

    // Check for invalid characters
    if (!INPUT_RULES.allowedPattern.test(trimmedInput)) {
      // Sanitize by removing invalid characters
      const sanitized = trimmedInput.replace(/[^a-zA-Z0-9\s.,!?-]/g, '');
      return {
        isValid: false,
        sanitizedValue: sanitized,
        error: {
          code: 'INVALID_CHARS',
          message: 'Input contains invalid characters'
        }
      };
    }

    // Input is valid
    return {
      isValid: true,
      sanitizedValue: trimmedInput
    };
  } catch (error) {
    // Log any unexpected errors
    logger.error('Input validation error:', error);
    return {
      isValid: false,
      sanitizedValue: '',
      error: {
        code: 'INVALID_CHARS',
        message: 'Invalid input'
      }
    };
  }
};

// Validate customization options
export const validateCustomizationOption = (
  value: number,
  min: number,
  max: number,
  defaultValue: number
): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.min(Math.max(value, min), max);
}; 