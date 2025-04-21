import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'

const ResetPasswordPage = () => {
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    // Clear any leftover password reset data from localStorage
    localStorage.removeItem('password_reset_verified')
    localStorage.removeItem('password_reset_timestamp')
    localStorage.removeItem('password_reset_token')
    
    // Set up countdown for redirect
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-primary-600 mb-2">Password Reset Link Expired</h1>
          <p className="text-brand-neutral-600">
            This password reset link has expired or is invalid.
            Please request a new password reset from the login page.
          </p>
        </div>
        
        <div className="mt-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-brand-gradient text-white font-medium py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Login Page ({redirectCountdown})
          </button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResetPasswordPage />
  </React.StrictMode>,
) 