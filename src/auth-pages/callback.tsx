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
      
      try {
        // Check if we have a valid session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session check error:', sessionError)
          throw sessionError
        }
        
        if (data?.session) {
          console.log('Valid session found, redirecting to app')
          window.location.href = '/'
          return
        }
        
        // If no session, check for PKCE auth code
        const url = new URL(window.location.href)
        const hasCode = url.searchParams.get('code') !== null
        
        if (hasCode) {
          console.log('Found auth code, will be processed by Supabase client')
          
          // Wait a short time for Supabase client to process the auth code
          setTimeout(async () => {
            const { data: delayedData } = await supabase.auth.getSession()
            
            if (delayedData?.session) {
              console.log('Session established after processing auth code')
              window.location.href = '/'
            } else {
              setError('Unable to complete authentication. Please try again.')
              setLoading(false)
            }
          }, 1500)
          return
        }
        
        // For any other flow (like email confirmation)
        const isPendingConfirmation = url.searchParams.has('confirmation') || 
                                     url.searchParams.get('type') === 'signup' || 
                                     url.searchParams.get('type') === 'magiclink'
        
        if (isPendingConfirmation) {
          console.log('Email confirmation pending, showing message')
          setError('Please check your email to confirm your account.')
          setLoading(false)
          return
        }
        
        // For any other unhandled situations
        setError('Authentication process could not be completed. Please try again.')
        setLoading(false)
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