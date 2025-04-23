import React, { useState, useEffect } from 'react';
import { MailIcon, AlertTriangleIcon, CheckIcon } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePreferencesStore from '../../store/usePreferencesStore';
import logger from '../../lib/logger';

interface MagicLinkFormProps {
  onRequestSent?: () => void;
}

const MagicLinkForm: React.FC<MagicLinkFormProps> = ({ onRequestSent }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithMagicLink } = useAuthStore();
  const { lastUsedEmail } = usePreferencesStore();
  
  // Pre-populate with last used email if available
  useEffect(() => {
    if (lastUsedEmail) {
      setEmail(lastUsedEmail);
      logger.debug('Pre-populated email address from preferences', { email: lastUsedEmail });
    }
  }, [lastUsedEmail]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      logger.info('Submitting magic link request', { email });
      const result = await signInWithMagicLink(email);
      
      if (result) {
        setSuccess(true);
        logger.info('Magic link request successful', { email });
        if (onRequestSent) onRequestSent();
      } else {
        setError('Failed to send the login link. Please try again.');
        logger.warn('Magic link request failed', { email });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send login link';
      setError(errorMessage);
      logger.error('Error sending magic link', { error: errorMessage, email });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
        <div className="flex items-start">
          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-700 font-medium">Login link sent!</p>
            <p className="text-sm text-green-600 mt-1">
              We've sent a magic login link to <strong>{email}</strong>. Please check your email and click the link to sign in.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            We'll send you a secure link to log in instantly without a password.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isSubmitting || !email 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brand-primary-600 hover:bg-brand-primary-700'
          }`}
        >
          {isSubmitting ? 'Sending Link...' : 'Send Login Link'}
        </button>
      </form>
    </div>
  );
};

export default MagicLinkForm; 