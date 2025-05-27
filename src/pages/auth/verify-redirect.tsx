import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import AUTH_CONFIG from '../../lib/auth/config';
import logger from '../../lib/logger';

/**
 * VerifyRedirect component
 * 
 * This component creates an intermediary step between the email verification link
 * and the actual token verification. This protects against email scanners that
 * click links in emails, which would invalidate the token before the user gets
 * a chance to use it.
 */
const VerifyRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get the encoded verification link from URL params
  const encodedLink = searchParams.get('link');
  const decodedLink = encodedLink ? decodeURIComponent(encodedLink) : null;
  
  // Extract the token from the decoded link
  const getTokenFromLink = (link: string | null) => {
    if (!link) return null;
    
    try {
      const url = new URL(link);
      return url.searchParams.get('token') || url.hash.match(/token=([^&]*)/)?.[1] || null;
    } catch (err) {
      logger.error('Failed to parse verification link:', err);
      return null;
    }
  };
  
  // Store token in state only, not in sessionStorage, for security
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from URL only once on component mount
  useEffect(() => {
    const extractedToken = decodedLink ? getTokenFromLink(decodedLink) : null;
    if (extractedToken) {
      setToken(extractedToken);
    }
  }, [decodedLink]);
  
  // Handle manual verification click
  const handleVerify = async () => {
    if (!token) {
      setError('Invalid verification link. Please try again or request a new link.');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Use the retry logic for token exchange
      let success = false;
      let attempts = 0;
      const maxAttempts = AUTH_CONFIG.maxTokenExchangeRetries;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
          
          if (sessionError) {
            logger.warn(`Token exchange attempt ${attempts} failed:`, sessionError);
            
            if (attempts < maxAttempts) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.tokenExchangeRetryDelay));
              continue;
            }
            
            throw sessionError;
          }
          
          success = true;
          logger.info('Email verified successfully!');
        } catch (exchangeError) {
          if (attempts >= maxAttempts) {
            logger.error('Failed to exchange token after multiple attempts:', exchangeError);
            throw exchangeError;
          }
        }
      }
      
      if (success) {
        // Initialize auth state after successful verification
        await useAuthStore.getState().initialize();
        navigate('/auth/verification-success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception during verification:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Invalid Verification Link</h1>
          <p className="text-center text-red-600 mb-6">
            The verification link appears to be invalid. Please try again or request a new verification email.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/')}
              variant="default"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-4">Complete Your Email Verification</h1>
          <p className="mb-6">
            To protect your security, please click the button below to complete the email verification process.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying}
            variant="default"
            className="w-full py-2 px-4"
          >
            {isVerifying ? 'Verifying...' : 'Complete Verification'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyRedirect; 