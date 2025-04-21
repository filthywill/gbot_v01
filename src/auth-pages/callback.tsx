import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from '../lib/supabase'
import '../index.css'

const AuthCallback = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback triggered')
      const url = new URL(window.location.href)
      
      try {
        // Check for password recovery flow
        const type = url.searchParams.get('type')
        const token = url.searchParams.get('token')
        const isRecovery = type === 'recovery' && token
        const hasCode = url.searchParams.get('code') !== null
        
        console.log('Processing auth callback:', { 
          isRecovery, 
          hasToken: !!token, 
          type,
          hasCode,
          urlHash: !!window.location.hash,
          searchParams: Object.fromEntries(url.searchParams.entries())
        })

        // Handle recovery token verification
        if (isRecovery) {
          console.log('Handling password recovery flow')
          
          // Verify the recovery token
          console.log('Attempting to verify recovery token')
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          })
          
          console.log('Recovery token verification result:', { 
            success: !!data && !verifyError,
            hasData: !!data,
            hasSession: !!(data?.session),
            hasUser: !!(data?.user),
            hasError: !!verifyError
          })
          
          if (verifyError) {
            console.error('Recovery token verification error:', verifyError)
            throw new Error(verifyError.message || 'Failed to verify recovery token')
          }
          
          if (!data || !data.session) {
            console.error('No session established after recovery token verification')
            throw new Error('Authentication failed - no session established')
          }
          
          // Store the auth session data explicitly in localStorage to ensure it persists across page navigation
          try {
            // Save the current time to track when this session was established
            localStorage.setItem('password_reset_verified', 'true')
            localStorage.setItem('password_reset_timestamp', new Date().getTime().toString())
            
            // Store the access token for session recovery
            if (data?.session?.access_token) {
              localStorage.setItem('supabase.auth.token', JSON.stringify({
                currentSession: {
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token || '',
                  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                  user: data.user,
                },
                expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
              }))
              console.log('Stored auth token in localStorage for session recovery')
            } else {
              console.warn('No access token available to store')
            }
            
            // We need to ensure the auth session is properly stored
            // This is usually handled by Supabase but we'll make sure it's stored with the correct key
            const authSession = supabase.auth.getSession()
            console.log('Auth session retrieved and stored', { 
              hasSession: !!(authSession),
              hasAccessToken: !!(data?.session?.access_token)
            })
          } catch (storageError) {
            console.error('Error storing session data:', storageError)
          }
          
          console.log('Recovery verified successfully, redirecting to reset password page')
          
          // Redirect to reset-password page with verification status
          window.location.href = '/auth/reset-password?from_callback=true&verified=true'
          return
        }
        
        // Handle PKCE authentication flows with code parameter
        if (hasCode) {
          const code = url.searchParams.get('code')
          console.log('Found PKCE auth code, exchanging for session')
          
          try {
            // Exchange the code for a session (Supabase JS SDK handles this automatically)
            // But we'll manually check if the session was established
            const { data, error: sessionError } = await supabase.auth.getSession()
            
            console.log('Code exchange result:', {
              hasData: !!data,
              hasSession: !!(data?.session),
              hasError: !!sessionError
            })
            
            if (sessionError) {
              throw sessionError
            }
            
            if (data?.session) {
              console.log('Session established from code, redirecting to app')
              window.location.href = '/'
              return
            } else {
              console.error('No session established from auth code')
              // Continue to try other auth methods
            }
          } catch (err) {
            console.error('Error processing auth code:', err)
            // Continue to try other auth methods
          }
        }
        
        // Handle other authentication flows (signup, login, etc.)
        console.log('Checking for session from auth hash')
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session check result:', {
          hasData: !!data,
          hasSession: !!(data?.session),
          hasError: !!sessionError
        })
        
        if (sessionError) {
          console.error('Session check error:', sessionError)
          throw sessionError
        }
        
        if (!data || !data.session) {
          console.log('No session found, attempting to parse hash')
          
          // Try to get session from URL hash
          if (window.location.hash) {
            console.log('Processing auth hash from URL')
            const { data: hashData, error: hashError } = await supabase.auth.getSession()
            
            console.log('Hash processing result:', {
              success: !!hashData && !hashError,
              hasData: !!hashData,
              hasSession: !!(hashData?.session),
              hasError: !!hashError
            })
            
            if (hashError) {
              console.error('Hash processing error:', hashError)
              throw hashError
            }
            
            if (!hashData || !hashData.session) {
              console.error('No session established from URL hash')
              throw new Error('Authentication failed - no session established from URL')
            }
            
            console.log('Session established from URL hash, redirecting to app')
          } else {
            // Check if there's a pending email confirmation
            const isPendingConfirmation = url.searchParams.has('confirmation') || 
                                          type === 'signup' || 
                                          type === 'magiclink'
            
            if (isPendingConfirmation) {
              console.log('Email confirmation pending, showing message')
              setError('Please check your email to confirm your account.')
              setLoading(false)
              return
            }
            
            console.error('No session found and no URL hash or code to process')
            throw new Error('Authentication failed. Please try signing in again.')
          }
        } else {
          console.log('Valid session found, redirecting to app')
        }
        
        // Redirect to the main app
        window.location.href = '/'
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setLoading(false)
      }
    }

    handleCallback()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
            <p className="text-brand-neutral-600">Completing authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-brand-primary-600 mb-6 text-center">Authentication Status</h1>
        {error ? (
          <div className="mb-4 p-3 bg-status-error-light text-status-error rounded">
            {error}
          </div>
        ) : (
          <div className="mb-4 p-3 bg-status-success-light text-status-success rounded">
            Authentication successful! Redirecting...
          </div>
        )}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-brand-gradient text-white py-2 px-4 rounded"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthCallback />
  </React.StrictMode>,
) 