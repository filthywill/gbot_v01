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
        // First check URL parameters to see if it's a password reset flow
        const url = new URL(window.location.href)
        const token = url.searchParams.get('token')
        const type = url.searchParams.get('type')
        
        // If this is a password recovery flow with a token
        if (token && type === 'recovery') {
          setMessage('Verifying your password reset link...')
          console.log('Password recovery flow detected, verifying token')
          
          try {
            // Verify the token and establish a session
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            })
            
            if (verifyError) {
              throw verifyError
            }
            
            // If the verification was successful, we should have a session
            if (data.session) {
              console.log('Recovery token verified successfully with session')
              // Redirect to reset password page with verification flag
              window.location.href = '/auth/reset-password?from_callback=true&verified=true'
              return
            } else {
              console.log('Token verified but no session established')
              throw new Error('Authentication session could not be established')
            }
          } catch (err) {
            console.error('Error verifying recovery token:', err)
            setError('Recovery link verification failed. Please request a new password reset link.')
            return
          }
        }
        
        // For other auth flows, check for an established session
        const { data, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (data.session) {
          // Success! Redirect to app
          window.location.href = '/'
        } else {
          // If we need to go to reset password page with the session
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