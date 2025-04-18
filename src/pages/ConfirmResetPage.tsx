import React, { useEffect, useState } from 'react';
import logger from '../lib/logger';

const ConfirmResetPage: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<{
    token: string | null;
    type: string | null;
  }>({
    token: null,
    type: null
  });

  useEffect(() => {
    // Extract token information from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const type = params.get('type') || 'recovery';

    logger.info('ConfirmReset page loaded with params:', {
      hasToken: !!token,
      type,
      url: window.location.href
    });

    // Store the token
    setTokenInfo({
      token,
      type
    });
  }, []);

  const handleProceedToReset = () => {
    // Build the URL for the actual reset page with the token
    if (tokenInfo.token) {
      const resetUrl = `/reset-password?token_hash=${tokenInfo.token}&type=${tokenInfo.type || 'recovery'}`;
      logger.info('Redirecting to reset password page:', resetUrl);
      window.location.href = resetUrl;
    } else {
      logger.error('No token found when attempting to proceed to reset');
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-neutral-900">Reset Your Password</h2>
          {tokenInfo.token ? (
            <>
              <p className="mt-4 text-brand-neutral-600">
                To protect your security, please click the button below to continue with your password reset.
              </p>
              <button
                onClick={handleProceedToReset}
                className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
              >
                Continue to Password Reset
              </button>
            </>
          ) : (
            <p className="mt-4 text-red-600">
              No valid reset token found. Please check your reset link or request a new password reset email.
            </p>
          )}
          <div className="mt-6 text-sm">
            <a href="/" className="text-brand-primary-600 hover:text-brand-primary-500 hover:underline">
              Return to home page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetPage; 