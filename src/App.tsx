import React, { useEffect, useState } from 'react';
import { StyleSelector } from './components/StyleSelector';
import { InputForm } from './components/InputForm';
import GraffitiDisplay from './components/GraffitiDisplay';
import { CustomizationToolbar } from './components/CustomizationToolbar';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';
// Note: There are multiple logo files with slightly different names (stizack-wh.svg and stizak-wh.svg)
import stizakLogo from './assets/logos/stizack-wh.svg';
import { OverlapDebugPanel } from './components/OverlapDebugPanel';
import { cn } from './lib/utils';
import { useDevStore } from './store/useDevStore';
import { isDevelopment } from './lib/env';
import { debugLog, isDebugPanelEnabled } from './lib/debug';
import logger from './lib/logger';
import { AuthProvider, AuthHeader, VerificationBanner } from './components/Auth';
import useAuthStore from './store/useAuthStore';
import usePreferencesStore from './store/usePreferencesStore';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/Auth';
import { showSuccess, showError, showInfo } from './lib/toast';

function App() {
  const { showValueOverlays, toggleValueOverlays } = useDevStore();
  const isDev = isDevelopment();
  const { status, initialize, user } = useAuthStore();
  const { setLastUsedEmail, setRememberMe } = usePreferencesStore();
  
  // Modal state for verification success
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot-password' | 'verification-code'>('signin');
  
  // State for resuming verification
  const [pendingVerification, setPendingVerification] = useState(false);

  // Get all state and actions from our Zustand-powered hook
  const {
    displayInputText,
    isGenerating,
    error,
    selectedStyle,
    processedSvgs,
    positions,
    contentWidth,
    contentHeight,
    containerScale,
    customizationOptions,
    history,
    currentHistoryIndex,
    generateGraffiti,
    handleCustomizationChange,
    handleInputTextChange,
    handleStyleChange,
    handleUndoRedo
  } = useGraffitiGeneratorWithZustand();
  
  // Flag to track if we've had at least one successful generation
  const hasInitialGeneration = React.useRef(false);

  // Handle email verification
  useEffect(() => {
    const checkForVerification = async () => {
      // First check for hash fragments in the URL (Supabase uses these for email verification)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Get URL parameters - from either query string or hash fragment
      const token = hashParams.get('access_token') || 
                   new URLSearchParams(window.location.search).get('token');
      const type = hashParams.get('type') || 
                  new URLSearchParams(window.location.search).get('type');
      const email = hashParams.get('email') || 
                   new URLSearchParams(window.location.search).get('email');
                   
      logger.info('Checking for verification params:', { token: token?.substring(0, 8), type, email });
      
      // Handle callback from Supabase with #access_token in URL
      if (hashParams.get('access_token')) {
        setIsVerifying(true);
        try {
          // Supabase automatically handles the session when it detects the access_token in URL
          // We just need to refresh the auth state
          logger.info('Detected Supabase auth redirect with access_token');
          
          // Refresh auth state to confirm the user is logged in
          await initialize();
          
          // Check if the user is authenticated after initialization
          const { user, status } = useAuthStore.getState();
          logger.info('Auth state after handling Supabase redirect:', { status, hasUser: !!user });
          
          // Show success modal and clean up the URL
          setShowVerificationModal(true);
          window.history.replaceState({}, document.title, '/');
        } catch (error) {
          logger.error('Failed to process Supabase auth redirect:', error);
          setVerificationError('Failed to complete authentication');
        } finally {
          setIsVerifying(false);
        }
        return;
      }
      
      // Check if this is our custom verification request with token param
      if (token && (type === 'verification' || type === 'signup') && email) {
        logger.info('Detected verification parameters in URL:', { token: token.substring(0, 8), type, email });
        setIsVerifying(true);
        setVerificationEmail(email);
        
        try {
          // Save email for login form in case they need to sign in manually later
          setLastUsedEmail(email);
          setRememberMe(true);
          
          // The correct way to handle email verification in Supabase v2
          logger.info('Verifying email with token');
          
          // First try exchangeCodeForSession which is the recommended method
          try {
            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
            if (sessionError) {
              logger.error('Error exchanging code for session, falling back to verifyOtp:', sessionError);
              
              // Fallback to verifyOtp if exchangeCodeForSession fails
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup'
              });
              
              if (verifyError) {
                logger.error('Error verifying email with verifyOtp:', verifyError);
                setVerificationError(verifyError.message);
                throw verifyError;
              }
            }
            
            logger.info('Email verified successfully!');
            
            // Refresh auth state to confirm the user is logged in
            await initialize();
            
            // Check if the user is authenticated after initialization
            const { user, status } = useAuthStore.getState();
            logger.info('Auth state after verification:', { status, hasUser: !!user });
            
            // Show success modal - don't show sign-in modal
            setShowVerificationModal(true);
          } catch (exchangeError) {
            logger.error('Failed to exchange token:', exchangeError);
            throw exchangeError;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          logger.error('Exception during verification:', errorMessage);
          setVerificationError(errorMessage);
        } finally {
          setIsVerifying(false);
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, '/');
        }
      }
    };
    
    checkForVerification();
  }, [initialize, setLastUsedEmail, setRememberMe]);

  // Effect to update the hasInitialGeneration ref when we have processed SVGs
  useEffect(() => {
    if (processedSvgs.length > 0) {
      hasInitialGeneration.current = true;
    }
  }, [processedSvgs]);

  // Update debug logging to use secure logger
  useEffect(() => {
    debugLog('App history state:', {
      historyLength: history.length,
      currentHistoryIndex,
      hasHistory: history.length > 0
    });
  }, [history.length, currentHistoryIndex]);

  // Log errors when they occur
  useEffect(() => {
    if (error) {
      logger.error('Application error occurred:', error);
    }
  }, [error]);

  // Inside the App component, after any existing useEffect hooks
  // Add a new useEffect to handle verification status from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const verificationStatus = url.searchParams.get('verification');
    const needsLogin = url.searchParams.get('needsLogin');
    const authStatus = url.searchParams.get('auth');
    const errorMessage = url.searchParams.get('error');
    
    // Clear the URL parameters without reloading the page
    const cleanUrl = () => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verification');
      newUrl.searchParams.delete('needsLogin');
      newUrl.searchParams.delete('auth');
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, document.title, newUrl.toString());
    };
    
    if (verificationStatus === 'success') {
      logger.info('Email verification successful, showing confirmation');
      
      if (needsLogin === 'true') {
        // Email verified but user needs to sign in
        showSuccess('Your email has been verified. Please sign in to continue.');
        
        // Open the auth modal in sign-in mode
        setAuthModalMode('signin');
        setShowAuthModal(true);
      } else {
        // Email verified and user already signed in
        showSuccess('Your email has been verified and you are now signed in.');
      }
      
      cleanUrl();
    } else if (verificationStatus === 'failed') {
      // Verification failed
      showError(errorMessage || 'There was a problem verifying your email. Please try again.');
      
      cleanUrl();
    } else if (authStatus && authStatus !== 'success') {
      // Handle other auth issues
      showError(errorMessage || 'There was a problem with authentication.');
      
      cleanUrl();
    }
  }, []);

  // Handle resuming verification from banner
  const handleResumeVerification = () => {
    try {
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        if (parsedState.email) {
          logger.info('Resuming verification process for email:', parsedState.email);
          
          // Set verification email directly instead of trying to show signup modal
          setVerificationEmail(parsedState.email);
          
          // Set pendingVerification to true to ensure banner shows
          setPendingVerification(true);
          
          // No need to set AuthModalMode since having verificationEmail set will
          // automatically render the verification component in the modal
          setShowAuthModal(true);
          
          // Update the state to show it's been resumed
          const updatedState = {
            ...parsedState,
            resumed: true,
            resumeTime: Date.now()
          };
          localStorage.setItem('verificationState', JSON.stringify(updatedState));
          
          // Debug log to check state
          logger.debug('Updated verification state in localStorage', updatedState);
        }
      }
    } catch (error) {
      logger.error('Error resuming verification:', error);
    }
  };

  // Check for pending verification on component mount
  useEffect(() => {
    try {
      const storedState = localStorage.getItem('verificationState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        const currentTime = Date.now();
        const expirationTime = parsedState.startTime + (30 * 60 * 1000); // 30 minutes
        
        if (currentTime < expirationTime) {
          setPendingVerification(true);
        } else {
          // Clear expired state
          localStorage.removeItem('verificationState');
          setPendingVerification(false);
        }
      }
    } catch (error) {
      logger.error('Error checking pending verification:', error);
    }
  }, []);

  // Add an effect to show the banner whenever the verificationEmail is set
  useEffect(() => {
    if (verificationEmail) {
      setPendingVerification(true);
    } else {
      // Clear the pending verification state when email is null
      setPendingVerification(false);
    }
  }, [verificationEmail]);

  // Add this effect to clear verificationEmail when user becomes authenticated
  useEffect(() => {
    if (user) {
      // User is authenticated, clear verification email state
      setVerificationEmail(null);
      setPendingVerification(false);
      logger.info('User authenticated, cleared verification email state');
    }
  }, [user]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-900 text-white">
        {/* Verification Banner */}
        <VerificationBanner 
          onResumeVerification={handleResumeVerification} 
          forceShow={!!verificationEmail} 
          email={verificationEmail || undefined}
          isAuthenticated={!!user} 
        />
        
        {/* Main App Content */}
        <div className={cn("min-h-screen", (!!verificationEmail || pendingVerification) && "pt-14")}>
          {/* Header Section */}
          <header>
            {/* Auth Section */}
            <div className="w-full bg-zinc-900">
              <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
                <div className="flex justify-end">
                  <AuthHeader />
                </div>
              </div>
            </div>
            
            {/* Logo Section */}
            <div className="bg-zinc-900">
              <div className="max-w-[800px] mx-auto py-0 px-2 sm:px-3">
                <div className="bg-zinc-800 shadow-md rounded-md p-1">
                  <div className="flex justify-center">
                    <img 
                      src={stizakLogo} 
                      alt="STIZAK"
                      className="h-[120px] w-auto" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-grow">
            <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
              <div className="space-y-2">
                {/* Top section: Input and Style Selection */}
                <div className="bg-zinc-800 shadow-md rounded-md p-1.5 sm:p-2 animate-fade-in">
                  <InputForm 
                    inputText={displayInputText}
                    setInputText={handleInputTextChange}
                    isGenerating={isGenerating}
                    onGenerate={generateGraffiti}
                  />
                  
                  {error && (
                    <div className="mt-1 text-red-400 text-xs bg-red-900 bg-opacity-50 p-1 rounded animate-pulse-once">
                      {error}
                    </div>
                  )}
                  
                  {/* Style Selector - removed extra top margin for better alignment */}
                  <div className="mt-1.5">
                    <StyleSelector 
                      styles={GRAFFITI_STYLES}
                      selectedStyle={selectedStyle}
                      onSelectStyle={handleStyleChange}
                    />
                  </div>
                </div>
                
                {/* Preview Section */}
                <div className="bg-zinc-800 shadow-md rounded-md p-1.5 sm:p-2 animate-slide-up">
                  {/* This div maintains the 16:9 aspect ratio with no vertical gaps */}
                  <div className="w-full relative bg-zinc-700 rounded-md overflow-hidden">
                    <div className="w-full pb-[56.25%] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {processedSvgs.length > 0 ? (
                          <GraffitiDisplay 
                            isGenerating={isGenerating}
                            processedSvgs={processedSvgs}
                            positions={positions}
                            contentWidth={contentWidth}
                            contentHeight={contentHeight}
                            containerScale={containerScale}
                            customizationOptions={customizationOptions}
                            customizationHistory={history}
                            currentHistoryIndex={currentHistoryIndex}
                            onUndoRedo={handleUndoRedo}
                            inputText={displayInputText}
                          />
                        ) : (
                          <div className="text-zinc-400 text-center p-3">
                            {hasInitialGeneration.current ? (
                              <p className="text-sm">No text to display. Enter some text and click Create.</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-zinc-400 text-sm">Enter text above and click Create to generate your graffiti</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customization Section */}
                <div className="bg-zinc-800 shadow-md rounded-md p-0.5 sm:p-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <CustomizationToolbar 
                    options={customizationOptions}
                    onChange={handleCustomizationChange}
                  />
                </div>
              </div>
            </div>
          </main>
          
          <footer className="shadow-inner mt-2">
            <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
              <p className="text-center text-zinc-400 text-xs">
                STIZAK &copy;{new Date().getFullYear()} | 
                <a href="/privacy-policy" className="ml-2 text-zinc-400 hover:text-zinc-300">Privacy Policy</a> | 
                <a href="/terms-of-service" className="ml-2 text-zinc-400 hover:text-zinc-300">Terms of Service</a>
              </p>
            </div>
          </footer>
          
          {/* Add the debug panel - only when debug panels are enabled */}
          {isDev && isDebugPanelEnabled() && <OverlapDebugPanel />}
        </div>

        {/* Dev Mode Buttons - only visible when debug panels are enabled */}
        {isDev && isDebugPanelEnabled() && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] flex gap-2 opacity-[0.25]">
            <button
              onClick={toggleValueOverlays}
              className={cn(
                "px-2 py-1 text-xs rounded border",
                showValueOverlays
                  ? "bg-pink-700 border-pink-500 text-white"
                  : "bg-zinc-700 border-zinc-500 text-zinc-300"
              )}
            >
              {showValueOverlays ? 'Hide Values' : 'Show Values'}
            </button>
          </div>
        )}
        
        {/* Email Verification Success Modal - Custom version instead of AuthModal */}
        {showVerificationModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-green-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Email Verified!</h2>
              </div>
              
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Your account has been verified successfully</p>
                <p className="mt-1">You are now signed in and can start using the application.</p>
              </div>
              
              <button
                onClick={() => setShowVerificationModal(false)}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white
                  bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
              >
                Continue to App
              </button>
            </div>
          </div>
        )}
        
        {/* Verification Error Display */}
        {verificationError && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <h2 className="text-xl font-bold text-red-600 mb-4">Verification Failed</h2>
              <p className="text-gray-700 mb-4">{verificationError}</p>
              <p className="text-gray-700 mb-4">Please try signing in directly or contact support for assistance.</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setVerificationError(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator during verification */}
        {isVerifying && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          </div>
        )}
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;