import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const changePassword = useAuthStore(state => state.changePassword);

  // On mount, attempt to process session from URL fragment
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Cast auth client to any to call getSessionFromUrl
        const { error: urlError } = await (supabase.auth as any).getSessionFromUrl();
        if (urlError) {
          throw urlError;
        }
        setIsTokenValid(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired reset link');
      } finally {
        setIsVerifying(false);
      }
    };
    verifySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isTokenValid) {
      setError('Invalid or expired reset link.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await changePassword(newPassword);
      // On success, redirect to home with query param for success
      window.location.href = '/?passwordReset=success';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-brand-neutral-900 mb-2">Processing reset link</h2>
          <p className="text-brand-neutral-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-brand-neutral-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/auth/request-password-reset" className="text-brand-primary-600 hover:underline">
            Request a new password reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-brand-neutral-900 mb-4">Set a New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-neutral-600">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-neutral-600">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 