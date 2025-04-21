import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from '../lib/supabase'
import '../index.css'

const AuthCallback = () => {
  const [message, setMessage] = useState('Processing your authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the callback from the OAuth provider
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (data.session) {
          // Success! Redirect to app
          window.location.href = '/'
        } else {
          // If we need to go to reset password page with the session
          const url = new URL(window.location.href)
          const isPasswordReset = url.searchParams.get('type') === 'recovery'
          
          if (isPasswordReset) {
            // Redirect to reset password page with verification flag
            window.location.href = '/auth/reset-password?from_callback=true&verified=true'
          } else {
            // There was a problem with the session
            throw new Error('No session established')
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {error ? (
          <div>
            <div className="text-status-error mb-4 text-xl">Authentication Failed</div>
            <p className="text-brand-neutral-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-brand-gradient text-white py-2 px-4 rounded"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
            <p className="text-brand-neutral-600">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthCallback />
  </React.StrictMode>
) 