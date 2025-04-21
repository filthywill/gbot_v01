import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from '../lib/supabase'
import '../index.css'

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Check if we have a verified token from callback page
  useEffect(() => {
    const checkSession = async () => {
      console.log('Reset password page loaded, checking params and session')
      
      // Check URL parameters
      const url = new URL(window.location.href)
      const isFromCallback = url.searchParams.get('from_callback') === 'true'
      const isVerified = url.searchParams.get('verified') === 'true'
      
      console.log('URL params:', { 
        isFromCallback, 
        isVerified,
        searchParams: Object.fromEntries(url.searchParams.entries())
      })
      
      // Check for localStorage verification (this is set by the callback page)
      const localVerified = localStorage.getItem('password_reset_verified') === 'true'
      const resetTimestamp = localStorage.getItem('password_reset_timestamp')
      const isRecentReset = resetTimestamp && 
        (Date.now() - parseInt(resetTimestamp)) < 5 * 60 * 1000; // 5 minutes
      
      console.log('Checking localStorage verification:', {
        localVerified,
        resetTimestamp,
        isRecentReset,
        timeSinceReset: resetTimestamp ? (Date.now() - parseInt(resetTimestamp)) / 1000 + ' seconds' : 'N/A'
      })
      
      // If we have local verification that's recent, we're good to go
      if (localVerified && isRecentReset) {
        console.log('Found valid local verification, proceeding with password reset')
        setVerified(true)
        setSessionChecked(true)
        return
      }
      
      // If we're coming from the callback with verification
      if (isFromCallback && isVerified) {
        console.log('Coming from callback with verified status')
        setVerified(true)
        setSessionChecked(true)
        return
      }
      
      // Check if we have recovery token in the URL (direct reset password link)
      const token = url.searchParams.get('token')
      const type = url.searchParams.get('type')
      
      if (token && type === 'recovery') {
        console.log('Found recovery token in URL, attempting to verify directly')
        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          })
          
          console.log('Direct token verification result:', { 
            hasData: !!data, 
            hasSession: !!(data && data.session),
            hasError: !!verifyError
          })
          
          if (verifyError) {
            console.error('Direct token verification failed:', verifyError)
            setError('Your password reset link is invalid or has expired. Please request a new one.')
          } else if (data && data.session) {
            console.log('Token verified directly, enabling password reset')
            
            // Save verification status to localStorage
            localStorage.setItem('password_reset_verified', 'true')
            localStorage.setItem('password_reset_timestamp', new Date().getTime().toString())
            
            setVerified(true)
          } else {
            console.log('No session created from direct token verification')
            setError('Unable to verify your password reset request. Please try again.')
          }
          
          setSessionChecked(true)
          return
        } catch (err) {
          console.error('Error during direct token verification:', err)
        }
      }
      
      // Otherwise, check if we have a valid session
      try {
        console.log('Checking for a valid auth session')
        const { data, error } = await supabase.auth.getSession()
        
        console.log('Session check result:', { 
          hasData: !!data, 
          hasSession: !!(data && data.session),
          hasError: !!error
        })
        
        if (error) {
          console.error('Session check error:', error)
          setError('Unable to verify your authentication session')
        } else if (data && data.session) {
          console.log('Valid session found')
          setVerified(true)
        } else {
          console.log('No valid session found')
          
          // Try to see if we're in the middle of a PKCE auth flow
          if (url.searchParams.has('code')) {
            console.log('Found auth code, waiting for session to be established')
            
            // Wait a short time for the session to be established by the Supabase client
            setTimeout(async () => {
              const { data: delayedData } = await supabase.auth.getSession()
              
              console.log('Delayed session check result:', {
                hasSession: !!(delayedData && delayedData.session)
              })
              
              if (delayedData && delayedData.session) {
                console.log('Session established after delay')
                setVerified(true)
              } else {
                setError('No valid authentication session found. Please request a new password reset link.')
              }
              
              setSessionChecked(true)
            }, 1500) // Wait 1.5 seconds
            return
          } else {
            setError('No valid authentication session found. Please request a new password reset link.')
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('Failed to verify your authentication status')
      }
      
      setSessionChecked(true)
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setError(null)
    setLoading(true)
    
    try {
      console.log('Attempting to update password')
      
      // Special handling for password reset without active session
      const hasLocalVerification = localStorage.getItem('password_reset_verified') === 'true'
      
      if (hasLocalVerification) {
        try {
          // Use Supabase's REST API directly to update the password
          // This approach bypasses the session requirement
          
          // Get user's email from localStorage if available
          const userDataStr = localStorage.getItem('supabase.auth.token')
          let userEmail = '';
          
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              userEmail = userData?.currentSession?.user?.email || '';
              console.log('Retrieved user email from localStorage:', { 
                hasEmail: !!userEmail,
                email: userEmail ? userEmail.substring(0, 3) + '***' : 'none' 
              });
            } catch (e) {
              console.error('Error parsing user data from localStorage', e);
            }
          }
          
          // If no email is found, try to use a different approach
          if (!userEmail) {
            console.log('No user email found in localStorage, using alternative approach');
            
            // Try to use the reset token directly - this is a workaround
            // Reset password directly using Supabase's password recovery endpoint
            const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/recover`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ 
                password: password,
                type: 'recovery',
                token_hash: localStorage.getItem('password_reset_token') || '',
              }),
            });
            
            if (!result.ok) {
              const errorData = await result.json();
              console.error('Error in alternate password reset approach:', errorData);
              throw new Error(errorData.message || 'Failed to update password');
            }
            
            console.log('Password updated successfully using alternate approach');
          } else {
            // Try the standard update password API using the user's email
            const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ 
                email: userEmail,
                password: password,
              }),
            });
            
            if (!result.ok) {
              const errorData = await result.json();
              console.error('Error in direct password update:', errorData);
              
              // If first approach fails, try the email-based password reset flow instead
              console.log('Falling back to email-based password reset flow');
              const recoverResult = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ email: userEmail }),
              });
              
              if (!recoverResult.ok) {
                const recoverErrorData = await recoverResult.json();
                console.error('Error in email recovery fallback:', recoverErrorData);
                throw new Error(recoverErrorData.message || 'Failed to update password');
              }
              
              console.log('Sent new password reset email as fallback');
              setMessage('We were unable to update your password directly. A new password reset link has been sent to your email.');
              // Add a slight delay before redirecting to show the success message
              setTimeout(() => {
                window.location.href = '/'
              }, 5000);
              return;
            }
            
            console.log('Password updated successfully via direct API call');
          }
        } catch (apiError) {
          console.error('Error in direct API password update:', apiError);
          throw apiError;
        }
      } else {
        // Standard approach using Supabase client
        const { error } = await supabase.auth.updateUser({ password })
        
        if (error) {
          console.error('Password update error:', error)
          throw error
        }
      }
      
      // Clear localStorage verification data
      localStorage.removeItem('password_reset_verified')
      localStorage.removeItem('password_reset_timestamp')
      localStorage.removeItem('password_reset_token')
      
      console.log('Password updated successfully')
      setMessage('Your password has been updated successfully! Redirecting to login...')
      
      // Add a slight delay before redirecting to show the success message
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state until session check completes
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary-600 mx-auto mb-4"></div>
            <p className="text-brand-neutral-600">Verifying your session...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-brand-primary-600 mb-6 text-center">Reset Your Password</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-status-error-light text-status-error rounded">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-status-success-light text-status-success rounded">
            {message}
          </div>
        )}
        
        {verified ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-brand-neutral-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-brand-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary-400"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-brand-neutral-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-brand-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gradient text-white py-2 rounded hover:bg-opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-brand-neutral-600 mb-4">
              {error || 'Your reset link appears to be invalid or has expired.'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-brand-gradient text-white py-2 px-4 rounded"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResetPasswordPage />
  </React.StrictMode>,
) 