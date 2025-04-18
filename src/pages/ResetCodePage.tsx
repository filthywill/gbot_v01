import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

const ResetCodePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);

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
      
      // Verify the OTP code
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      });
      
      if (verifyError) {
        logger.error('Code verification error:', verifyError);
        throw new Error(verifyError.message);
      }
      
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
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });
      
      if (updateError) {
        logger.error('Password update error:', updateError);
        throw new Error(updateError.message);
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
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        ) : (
          // Step 2: Reset the password
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-neutral-600">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Enter your new password"
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-600">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
                placeholder="Confirm your new password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isResetting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              {isResetting ? 'Updating Password...' : 'Update Password'}
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