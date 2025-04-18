import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

const RequestPasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestPasswordReset = useAuthStore(state => state.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      await requestPasswordReset(email);
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        {status === 'sent' ? (
          <>            
            <h2 className="text-2xl font-bold text-brand-neutral-900 mb-4">Check Your Email</h2>
            <p className="text-brand-neutral-600">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the link.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-brand-neutral-900 mb-4">Reset Your Password</h2>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-brand-neutral-600">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-brand-neutral-300 rounded-md shadow-sm placeholder-brand-neutral-400 focus:outline-none focus:ring-brand-primary-500 focus:border-brand-primary-500 text-brand-neutral-900"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestPasswordReset; 