import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';

interface VerificationCodeInputProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({ 
  email, 
  onSuccess,
  onCancel 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get verifyOtp method from auth store
  const { verifyOtp } = useAuthStore();
  
  // Auto-focus the input field when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      logger.info('Verifying OTP code', { email });
      
      // Use the auth store method instead of direct Supabase call
      const result = await verifyOtp(email, code);

      if (!result) {
        throw new Error('Verification failed');
      }

      // Successfully verified
      logger.info('Email verified successfully', { user: result.user?.id });
      
      // Call success callback
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Verification error:', err);
      setError(`Failed to verify code: ${errorMessage}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const inputValue = e.target.value.replace(/\D/g, '').substring(0, 6);
    setCode(inputValue);
    
    // Clear error when user is typing
    if (error) {
      setError(null);
    }
  };
  
  // Handle keydown to support Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code.length === 6 && !isVerifying) {
      handleVerify();
    }
  };
  
  // Function to handle clipboard paste
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      // Extract digits only (in case user copied the whole message with other text)
      const digits = clipboardText.replace(/\D/g, '');
      // Use first 6 digits if available
      const verificationCode = digits.substring(0, 6);
      
      if (verificationCode && verificationCode.length > 0) {
        setCode(verificationCode);
        setError(null);
        
        // Auto-verify if we get a 6-digit code
        if (verificationCode.length === 6) {
          setTimeout(() => {
            handleVerify();
          }, 100);
        }
      }
    } catch (err) {
      logger.error('Failed to read clipboard:', err);
    }
  };
  
  // Copy code from email (this is just a placeholder UI feature)
  const copyCodeFromEmail = () => {
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 3000);
  };

  // Input class matching AuthModal styles
  const getInputClasses = () => {
    return cn(
      "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-gray-900 placeholder-gray-400",
      error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : 
      "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-indigo-900 tracking-tight mb-2">Verify Your Email</h2>
        <p className="text-gray-500 text-sm">
          We've sent a verification code to <strong>{email}</strong>
        </p>
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
            />
            <button
              type="button"
              onClick={handlePaste}
              className="ml-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              title="Paste from clipboard"
            >
              <Copy size={18} />
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              Check your inbox & spam folder
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || code.length < 6}
            className={cn(
              "flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              "transition-all duration-200 ease-in-out transform hover:scale-[1.01]",
              (isVerifying || code.length < 6) ? "opacity-70 cursor-not-allowed" : ""
            )}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>

      <div className="text-center text-sm">
        <p className="text-gray-600">
          Didn't receive a code?{' '}
          <button
            type="button"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
            onClick={() => {
              // Resend verification email (OTP)
              logger.info('Resending verification code', { email });
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