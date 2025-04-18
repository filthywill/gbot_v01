import React, { useState } from 'react';
import logger from '../lib/logger';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const ResetCodePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code) {
      setError('Please enter both email and reset code');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      
      logger.info('Verifying password reset code', { email });
      
      // Directly verify the OTP code with Supabase for more control
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      });
      
      if (verifyError) {
        logger.error('Code verification error:', verifyError);
        throw new Error(verifyError.message);
      }
      
      // Store the verification result for later use
      setVerificationResult(data);
      
      // If we got here, the code is valid
      logger.info('Reset code verified successfully', {
        hasUser: !!data?.user,
        hasSession: !!data?.session
      });
      
      setCodeVerified(true);
    } catch (err) {
      logger.error('Error verifying reset code:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify reset code');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsResetting(true);
      setError(null);
      
      logger.info('Updating password after code verification');
      
      // If we have a session from the verification, use it for the password update
      if (verificationResult?.session) {
        // Apply the session from verification first
        await supabase.auth.setSession({
          access_token: verificationResult.session.access_token,
          refresh_token: verificationResult.session.refresh_token
        });
        
        // Now update the password directly
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });
        
        if (updateError) {
          logger.error('Password update error:', updateError);
          throw new Error(updateError.message);
        }
      } else {
        // Use a two-step approach to bypass type issues
        // First verify the OTP again
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'recovery'
        });
        
        if (verifyError) {
          logger.error('Reset verification error:', verifyError);
          throw new Error(verifyError.message);
        }
        
        // Then update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });
        
        if (updateError) {
          logger.error('Password update error:', updateError);
          throw new Error(updateError.message);
        }
      }
      
      // Password updated successfully
      logger.info('Password updated successfully');
      setIsSuccess(true);
      
      // Sign out to clear the session
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleBackToSignIn = () => {
    window.location.href = '/?passwordReset=success';
  };
  
  // If the password was successfully reset, show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-neutral-900">Password Updated</h2>
            <p className="mt-2 text-brand-neutral-600">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          
          <button
            onClick={handleBackToSignIn}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-neutral-900">
            {codeVerified ? 'Create New Password' : 'Enter Reset Code'}
          </h2>
          <p className="mt-2 text-brand-neutral-600">
            {codeVerified 
              ? 'Please enter your new password below.'
              : 'Enter the reset code that was sent to your email.'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        {!codeVerified ? (
          // Step 1: Verify the reset code
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-neutral-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Your email address"
                required
              />
            </div>
            
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-brand-neutral-600">
                Reset Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Enter the code from your email"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              {isVerifying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify Code'}
            </button>
          </form>
        ) : (
          // Step 2: Reset the password
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-neutral-600">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-600">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none",
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-brand-neutral-300 focus:ring-brand-primary-500 focus:border-brand-primary-500"
                  )}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-neutral-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isResetting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              {isResetting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Password...
                </span>
              ) : 'Update Password'}
            </button>
          </form>
        )}
        
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-brand-primary-600 hover:text-brand-primary-500">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetCodePage; 