import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AlertTriangleIcon } from 'lucide-react'
import '../index.css'

const AuthError = () => {
  const [errorMessage, setErrorMessage] = useState('Authentication failed')

  useEffect(() => {
    // Get error message from URL parameters
    const url = new URL(window.location.href)
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    
    if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription))
    } else if (error) {
      setErrorMessage(decodeURIComponent(error))
    }
  }, [])

  return (
    <div className="min-h-screen bg-brand-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-status-error-light rounded-full flex items-center justify-center mb-4">
            <AlertTriangleIcon className="h-8 w-8 text-status-error" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Authentication Error</h1>
          <p className="text-brand-neutral-600 text-center mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-4 bg-brand-gradient text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500"
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
    <AuthError />
  </React.StrictMode>
) 