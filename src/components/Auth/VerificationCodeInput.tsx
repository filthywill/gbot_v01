import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, Copy, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';
import { clearAllVerificationState } from '../../lib/auth/utils';

interface VerificationCodeInputProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
  onClose?: () => void;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({ 
  email, 
  onSuccess,
  onCancel,
  onClose 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeBeforeVerifyRef = useRef('');
  
  // Get verifyOtp method from auth store
  const { verifyOtp } = useAuthStore();
  
  // Auto-focus the input field when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Memoize the verify function to avoid recreation on each render
  const handleVerify = useCallback(async () => {
    // Store the current code value to ensure we use the most up-to-date version
    const currentCode = codeBeforeVerifyRef.current || code;
    
    if (!currentCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    // Ensure we only have digits
    const cleanCode = currentCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      logger.info('Verifying OTP code', { email, codeLength: cleanCode.length });
      
      // Use the auth store method instead of direct Supabase call
      const result = await verifyOtp(email, cleanCode);

      if (!result) {
        throw new Error('Verification failed');
      }

      // Successfully verified - clear ALL verification-related data
      logger.info('Email verified successfully', { user: result.user?.id });
      
      // Clear any verification state in localStorage
      clearAllVerificationState();
      
      // Call success callback
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Verification error:', err);
      
      // Handle specific error cases
      if (errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        setError('Network timeout - please try again or check your connection');
      } 
      // Special case for the ambiguous "Token has expired or is invalid" error
      else if (errorMessage === 'Token has expired or is invalid') {
        // The code was just entered, so it's more likely invalid than expired
        setError('Incorrect verification code - please check and try again');
      }
      else if (errorMessage.toLowerCase().includes('invalid') || 
               errorMessage.toLowerCase().includes('incorrect') || 
               errorMessage.toLowerCase().includes('not found')) {
        setError('Incorrect verification code - please check and try again');
      } else if (errorMessage.toLowerCase().includes('expired')) {
        setError('Verification code has expired - please request a new one');
      } else {
        setError(`Failed to verify: ${errorMessage}`);
      }
    } finally {
      setIsVerifying(false);
      setIsPasting(false);
    }
  }, [code, email, onSuccess, verifyOtp]);

  // Effect to run verification after state updates when auto-verifying
  useEffect(() => {
    // Only proceed if we're in pasting mode and not already verifying
    if (isPasting && !isVerifying && code.length === 6) {
      codeBeforeVerifyRef.current = code;
      
      // Use a longer timeout to ensure state is properly updated
      const timer = setTimeout(() => {
        logger.debug('Auto-verifying after paste', { code, storedCode: codeBeforeVerifyRef.current });
        handleVerify();
      }, 800); // Increased timeout to allow for state updates
      
      return () => clearTimeout(timer);
    }
  }, [code, isPasting, isVerifying, handleVerify]);

  // Handle input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const inputValue = e.target.value.replace(/\D/g, '').substring(0, 6);
    setCode(inputValue);
    
    // Clear error when user is typing
    if (error) {
      setError(null);
    }
    
    // Turn off pasting mode when user manually types
    if (isPasting) {
      setIsPasting(false);
    }
  };
  
  // Handle keydown to support Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.length === 6 && !isVerifying) {
      codeBeforeVerifyRef.current = code;
      handleVerify();
    }
  };
  
  // Function to handle clipboard paste
  const handlePaste = async () => {
    try {
      setError(null);
      
      const clipboardText = await navigator.clipboard.readText();
      // Extract digits only (in case user copied the whole message with other text)
      const digits = clipboardText.replace(/\D/g, '');
      
      if (digits.length > 0) {
        // Use first 6 digits if available
        const verificationCode = digits.substring(0, 6);
        
        // Set pasting flag to trigger auto-verification
        setIsPasting(true);
        
        // Update the code state
        setCode(verificationCode);
        
        // Also store in ref for immediate access
        codeBeforeVerifyRef.current = verificationCode;
        
        logger.debug('Pasted verification code', { 
          codeLength: verificationCode.length,
          isPasting: true 
        });
      } else {
        logger.debug('No digits found in clipboard content');
        setError('No valid verification code found in clipboard');
      }
    } catch (err) {
      logger.error('Failed to read clipboard:', err);
      setError('Could not read from clipboard. Please enter the code manually.');
    }
  };

  // Input class matching AuthModal styles
  const getInputClasses = () => {
    return cn(
      "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400",
      error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : 
      isPasting && code.length === 6 ? "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500" :
      "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    );
  };

  return (
    <div>
      <div className="relative mb-6">
        <div className="text-center w-full">
          <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight -mb-2">Verify Your Email</h2>
          <p className="mt-3 text-sm text-gray-500">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>
        
        <button 
          type="button"
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              onCancel();
            }
          }}
          className="absolute -top-2 -right-2 text-gray-400 hover:text-indigo-500 transition-colors p-1 hover:bg-gray-100 rounded-full"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
            Enter Verification Code
          </label>
          <div className="flex">
            <input
              ref={inputRef}
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="123456"
              className={getInputClasses()}
              maxLength={6}
              disabled={isVerifying}
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={isVerifying || isPasting}
              className={cn(
                "ml-2 px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md flex items-center",
                (isVerifying || isPasting) ? "opacity-50 cursor-not-allowed" : ""
              )}
              title="Paste from clipboard"
            >
              <Copy size={18} className="mr-1" />
              <span className="text-sm">Paste</span>
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Check your inbox & spam folder
            </span>
            {isPasting && code.length === 6 && !error && !isVerifying && (
              <span className="text-xs text-yellow-600">
                Verifying code...
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {isPasting && !error && !isVerifying && code.length === 6 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded flex items-center">
            <span className="animate-pulse">Automatically verifying pasted code...</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className={cn(
              "flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              isVerifying ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              codeBeforeVerifyRef.current = code;
              handleVerify();
            }}
            disabled={isVerifying || code.length < 6 || isPasting}
            className={cn(
              "flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "transition-all duration-200 ease-in-out transform hover:scale-[1.01]",
              (isVerifying || code.length < 6 || isPasting) ? "opacity-70 cursor-not-allowed" : ""
            )}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>

      <div className="text-center text-sm mt-4 pt-4 border-t border-gray-200">
        <p className="text-gray-600">
          Didn't receive a code?{' '}
          <button
            type="button"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => {
              // Resend verification email (OTP)
              logger.info('Resending verification code', { email });
              setError(null);
              
              // Disable any ongoing verification
              setIsVerifying(false);
              setIsPasting(false);
              
              supabase.auth.signUp({
                email,
                password: 'PLACEHOLDER-PASSWORD' // Password is required by API but will be ignored for resending
              }).then(({error}) => {
                if (error) {
                  logger.error('Error resending code:', error);
                  setError(`Failed to resend code: ${error.message}`);
                } else {
                  logger.info('Verification code resent');
                  setError(null);
                }
              });
            }}
          >
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerificationCodeInput; 