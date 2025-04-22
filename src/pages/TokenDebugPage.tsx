import React, { useEffect, useState } from 'react';
import logger from '../lib/logger';

const TokenDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({
    url: '',
    query: {},
    tokenHash: '',
    tokenLength: 0,
    type: '',
    fullUrl: '',
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Gather all possible debugging information
    const url = new URL(window.location.href);
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type') || 'recovery';
    const hash = window.location.hash;
    
    // Check for hash fragment parameters (sometimes auth tokens come in hash)
    const hashParams: Record<string, string> = {};
    if (hash && hash.length > 1) {
      hash.substring(1).split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          hashParams[key] = decodeURIComponent(value);
        }
      });
    }

    // Try to extract all possible parameters from URL and hash
    const allPossibleTokens = {
      tokenHash,
      confirmationUrl: params.get('confirmation_url'),
      token: params.get('token'),
      hashToken: hashParams.token,
      hashTokenHash: hashParams.token_hash,
      accessToken: hashParams.access_token,
      hashLength: hash.length
    };
    
    // Log all the information
    logger.info('TokenDebug page loaded with params:', {
      url: window.location.pathname,
      search: window.location.search,
      hash,
      allPossibleTokens,
      fullUrl: window.location.href
    });
    
    // Update state with debugging info
    setDebugInfo({
      url: window.location.pathname,
      query: Object.fromEntries(params.entries()),
      tokenHash: tokenHash || '',
      tokenLength: tokenHash ? tokenHash.length : 0,
      type,
      hash,
      hashParams,
      allPossibleTokens,
      fullUrl: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-neutral-900">Token Debug Page</h2>
          <p className="mt-2 text-brand-neutral-600">
            This page helps diagnose token-related issues.
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[400px]">
          <h3 className="font-semibold text-lg mb-2">Debug Information:</h3>
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="mt-6 flex gap-4">
          <a 
            href={`/reset-password?token_hash=${debugInfo.tokenHash}&type=${debugInfo.type}`}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 text-center"
          >
            Try Reset Password
          </a>
          <a 
            href="/"
            className="flex-1 py-2 px-4 border border-brand-neutral-300 rounded-md shadow-sm text-sm font-medium text-brand-neutral-700 bg-white hover:bg-brand-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500 text-center"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default TokenDebugPage; 