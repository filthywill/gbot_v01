import zxcvbn from 'zxcvbn';

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const result = zxcvbn(password);
  
  // Convert zxcvbn feedback into a simpler format
  const feedback = [
    ...(result.feedback.warning ? [result.feedback.warning] : []),
    ...result.feedback.suggestions
  ];
  
  return {
    score: result.score, // 0-4 (0 = weak, 4 = strong)
    feedback
  };
}; 