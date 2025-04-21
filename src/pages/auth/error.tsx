import React, { useEffect, useState } from 'react';
import { AlertTriangleIcon, ArrowLeftIcon, RefreshCw } from 'lucide-react';
import logger from '../../lib/logger';

const AuthErrorPage: React.FC = () => {
  const [error, setError] = useState<string>('An authentication error occurred');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Get error from URL
      const url = new URL(window.location.href);
      const errorParam = url.searchParams.get('error');
      const errorType = url.searchParams.get('type') || 'auth';
      
      if (errorParam) {
        logger.error('Auth error page loaded with error:', errorParam);
        
        // Set an appropriate user-friendly error message
        if (errorParam.toLowerCase().includes('invalid') && errorParam.toLowerCase().includes('link')) {
          setError('Invalid or Expired Link');
          setErrorDetails('The authentication link you used is invalid or has expired.');
        } else if (errorParam.toLowerCase().includes('expire')) {
          setError('Link Expired');
          setErrorDetails('The authentication link you used has expired. Please request a new one.');
        } else if (errorParam.toLowerCase().includes('email')) {
          setError('Email Verification Issue');
          setErrorDetails('There was a problem verifying your email. Please try again or contact support.');
        } else if (errorParam.toLowerCase().includes('password')) {
          setError('Password Reset Issue');
          setErrorDetails('There was a problem with your password reset. Please request a new password reset link.');
        } else {
          setError('Authentication Error');
          setErrorDetails(decodeURIComponent(errorParam));
        }
      } else {
        // Generic error when no specific message is provided
        setError('Authentication Error');
        setErrorDetails('An unexpected error occurred during authentication.');
      }
    } catch (err) {
      logger.error('Error processing auth error page:', err);
      setError('Authentication Error');
      setErrorDetails('An unexpected error occurred.');
    }
  }, []);
  
  const goToHome = () => {
    window.location.href = '/';
  };
  
  const requestPasswordReset = () => {
    window.location.href = '/?reset=true';
  };
  
  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-status-error-light rounded-full flex items-center justify-center mb-4">
            <AlertTriangleIcon className="h-8 w-8 text-status-error" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">{error}</h1>
          
          {errorDetails && (
            <p className="text-brand-neutral-600 text-center mb-6">
              {errorDetails}
            </p>
          )}
          
          <div className="w-full space-y-4">
            <button
              type="button"
              onClick={goToHome}
              className="w-full flex items-center justify-center py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Return to Home
            </button>
            
            <button
              type="button"
              onClick={requestPasswordReset}
              className="w-full flex items-center justify-center py-3 px-4 border border-brand-neutral-300 text-brand-neutral-700 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 hover:bg-brand-neutral-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Request Password Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage; 