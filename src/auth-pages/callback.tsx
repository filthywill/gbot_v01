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
        
        console.log('Processing auth callback:', { 
          isRecovery, 
          hasToken: !!token, 
          type,
          urlHash: !!window.location.hash
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
          
          console.log('Recovery verified successfully, redirecting to reset password page')
          
          // Redirect to reset-password page with verification status
          window.location.href = '/auth/reset-password?from_callback=true&verified=true'
          return
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
            console.error('No session found and no URL hash to process')
            throw new Error('Authentication failed - no session or URL parameters found')
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
        <h1 className="text-2xl font-bold text-brand-primary-600 mb-6 text-center">Authentication Error</h1>
        <div className="mb-4 p-3 bg-status-error-light text-status-error rounded">
          {error || 'Failed to complete authentication process'}
        </div>
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