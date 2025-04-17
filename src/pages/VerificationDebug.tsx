import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import { checkEmailVerificationStatus } from '../store/useAuthStore';
import logger from '../lib/logger';

const VerificationDebug: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      setSessionInfo({
        hasSession: !!data?.session,
        user: data?.session?.user,
        error
      });
    } catch (error) {
      setSessionInfo({ error: String(error) });
    }
  };

  const checkVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const result = await checkEmailVerificationStatus(email);
      setTestResults({ ...result, timestamp: new Date().toISOString() });
    } catch (error) {
      setTestResults({ error: String(error), timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const attemptSignIn = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      setTestResults({
        signInAttempt: true,
        success: !error,
        data,
        error,
        timestamp: new Date().toISOString()
      });
      
      // If successful, refresh session info
      if (!error) {
        await checkSession();
      }
    } catch (error) {
      setTestResults({
        signInAttempt: true,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setTestResults({
        signOutAttempt: true,
        success: !error,
        error,
        timestamp: new Date().toISOString()
      });
      
      // Refresh session info
      await checkSession();
    } catch (error) {
      setTestResults({
        signOutAttempt: true,
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize: check session on load
  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold mb-4">Verification Debug Tool</h1>
        
        <div className="mb-6 p-4 bg-brand-neutral-100 rounded">
          <h2 className="font-medium mb-2">Current Session</h2>
          {sessionInfo ? (
            <>
              <div className="mb-2">
                <span className="font-semibold">Status:</span> 
                {sessionInfo.hasSession ? (
                  <span className="text-status-success ml-2">Authenticated</span>
                ) : (
                  <span className="text-status-error ml-2">No active session</span>
                )}
              </div>
              
              {sessionInfo.user && (
                <div className="mb-2">
                  <span className="font-semibold">User:</span> 
                  <span className="ml-2">{sessionInfo.user.email}</span>
                </div>
              )}
              
              {sessionInfo.error && (
                <div className="text-status-error">
                  <span className="font-semibold">Error:</span> {sessionInfo.error}
                </div>
              )}
            </>
          ) : (
            <p>Loading session information...</p>
          )}
          
          <button 
            onClick={checkSession}
            className="mt-2 px-3 py-1 bg-brand-primary-100 text-brand-primary-800 rounded text-sm"
          >
            Refresh
          </button>
          
          {sessionInfo?.hasSession && (
            <button 
              onClick={signOut}
              className="mt-2 ml-2 px-3 py-1 bg-status-error-light text-status-error rounded text-sm"
            >
              Sign Out
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email to check</label>
          <input 
            type="email"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-primary-500 text-brand-neutral-900 placeholder-brand-neutral-400 border-brand-neutral-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password (for sign-in test)</label>
          <input 
            type="password"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-primary-500 text-brand-neutral-900 placeholder-brand-neutral-400 border-brand-neutral-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to test sign-in"
          />
        </div>
        
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={checkVerification}
            disabled={loading || !email}
            className="px-4 py-2 bg-brand-primary-600 text-white rounded hover:bg-brand-primary-700 flex-1 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Verification Status'}
          </button>
          
          <button 
            onClick={attemptSignIn}
            disabled={loading || !email || !password}
            className="px-4 py-2 bg-status-success text-white rounded hover:bg-status-success flex-1 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Test Sign In'}
          </button>
        </div>
        
        {testResults && (
          <div className="mt-4 p-4 bg-brand-neutral-100 rounded">
            <h3 className="font-medium mb-2">Test Results</h3>
            <div className="text-xs text-brand-neutral-500 mb-2">
              {testResults.timestamp}
            </div>
            
            {testResults.signInAttempt ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Sign-in:</span> 
                  {testResults.success ? (
                    <span className="text-status-success ml-2">Success</span>
                  ) : (
                    <span className="text-status-error ml-2">Failed</span>
                  )}
                </div>
                
                {testResults.error && (
                  <div className="text-status-error mb-2">
                    <span className="font-semibold">Error:</span> {testResults.error.message || testResults.error}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Verification Status:</span> 
                  {testResults.verified === true ? (
                    <span className="text-status-success ml-2">Verified</span>
                  ) : testResults.verified === false ? (
                    <span className="text-status-error ml-2">Not Verified</span>
                  ) : (
                    <span className="text-status-warning ml-2">Unknown</span>
                  )}
                </div>
                
                {testResults.error && (
                  <div className="text-status-error mb-2">
                    <span className="font-semibold">Error:</span> {testResults.error}
                  </div>
                )}
                
                {testResults.confirmedAt && (
                  <div className="mb-2">
                    <span className="font-semibold">Confirmed At:</span> {new Date(testResults.confirmedAt).toLocaleString()}
                  </div>
                )}
              </>
            )}
            
            <pre className="mt-2 text-xs bg-brand-neutral-200 p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-brand-primary-600 hover:text-brand-primary-500 hover:underline">Return to Home</a>
        </div>
      </div>
    </div>
  );
};

export default VerificationDebug; 