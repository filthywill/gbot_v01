import { PasswordStrength } from '../components/Auth/PasswordStrengthMeter';
import logger from '../lib/logger';

/**
 * Checks password strength and returns a score and feedback.
 * This is a basic implementation that could be replaced with a library like zxcvbn in production.
 * 
 * @param password - The password to check
 * @returns Object with score (0-4) and feedback array
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, feedback: ['Enter a password'] };
  }
  
  // Initialize score and feedback
  let score = 0;
  const feedback: string[] = [];
  
  // Check password length
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  } else if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 0.5;
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }
  
  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Add special characters (!@#$%, etc.)');
  } else {
    score += 1.5;
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
    score -= 0.5;
  }
  
  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/.test(password.toLowerCase())) {
    feedback.push('Avoid sequential characters');
    score -= 0.5;
  }
  
  // Check for common passwords or patterns
  const commonPatterns = ['password', 'qwerty', '123456', 'admin', 'welcome', 'letmein'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    feedback.push('Avoid common password patterns');
    score -= 1;
  }
  
  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, Math.round(score)));
  
  // For high scores with no feedback, add a positive message
  if (score >= 3 && feedback.length === 0) {
    feedback.push('Great password!');
  }
  
  return { score, feedback };
}

/**
 * Validates a password against basic requirements
 * @param password - The password to validate
 * @returns Object with isValid status and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Require at least one of each: uppercase, lowercase, number, special char
  // Can be adjusted based on your security requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const missingRequirements = [];
  if (!hasUppercase) missingRequirements.push('uppercase letter');
  if (!hasLowercase) missingRequirements.push('lowercase letter');
  if (!hasNumber) missingRequirements.push('number');
  if (!hasSpecial) missingRequirements.push('special character');
  
  if (missingRequirements.length > 0) {
    return { 
      isValid: false, 
      message: `Password must include at least one ${missingRequirements.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Masks a password for display
 * @param password - The password to mask
 * @returns Masked password
 */
export function maskPassword(password: string): string {
  return '•'.repeat(password.length);
}

/**
 * Verifies if the provided password is the current password for the given email
 * @param email - The user's email
 * @param password - The password to verify
 * @returns Promise resolving to true if password is valid, false otherwise
 */
export async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  try {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('../lib/supabase');
    
    // Attempt to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If there's an error or no session, the password is incorrect
    if (error || !data.session) {
      logger.debug('Password verification failed:', error?.message || 'No session returned');
      return false;
    }
    
    // Password is correct if we got a valid session
    return true;
  } catch (error) {
    console.error('Error during password verification:', error);
    return false;
  }
} 