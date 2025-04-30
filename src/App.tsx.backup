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
import { DevColorPanel } from './components/ui/dev-color-panel';
import { AUTH_VIEWS } from './lib/auth/constants';
import { clearAllVerificationState } from './lib/auth/utils';
import { FeatureFlagControls } from './components/dev/FeatureFlagControls';
import { FLAGS } from './lib/flags';
import { useEmailVerification } from './hooks/auth/useEmailVerification';
import { useAuthModalState } from './hooks/auth/useAuthModalState';
import { useFeatureFlag } from './hooks/useFeatureFlag';
import { AppHeader, AppFooter, AppDevTools, AppMainContent } from './components/app';
// Import modals from the modals directory
import { VerificationSuccessModal, VerificationErrorModal, VerificationLoadingModal } from './components/modals';

function App() {
   // Add this debugging code at the top of your App component
   useEffect(() => {
    console.log('SUPABASE URL BEING USED:', import.meta.env.VITE_SUPABASE_URL);
    // You can also check other environment variables
    console.log('APP ENV:', import.meta.env.VITE_APP_ENV);
    console.log('NODE ENV:', process.env.NODE_ENV);
  }, []);
 
  const { showValueOverlays, toggleValueOverlays, showColorPanel, toggleColorPanel } = useDevStore();
  const isDev = isDevelopment();
  const { user } = useAuthStore();
  
  // Use new auth hooks based on feature flag
  const {
    showVerificationModal,
    setShowVerificationModal,
    verificationEmail,
    verificationError,
    setVerificationError,
    isVerifying,
    pendingVerification,
    handleResumeVerification
  } = FLAGS.USE_NEW_AUTH_HOOKS ? useEmailVerification() : useOldVerificationState();

  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode, 
    setAuthModalMode,
    checkUrlParams
  } = FLAGS.USE_NEW_AUTH_HOOKS ? useAuthModalState() : useOldAuthModalState();

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

  // Environment variable logging
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    isProd: process.env.NODE_ENV === 'production',
    isDev
  });
  
  // Log feature flag values on initialization
  useEffect(() => {
    console.log('🚩 Feature Flags:', {
      USE_NEW_AUTH_HOOKS: FLAGS.USE_NEW_AUTH_HOOKS,
      USE_NEW_COMPONENTS: FLAGS.USE_NEW_COMPONENTS,
      DEBUG_AUTH_STATE: FLAGS.DEBUG_AUTH_STATE
    });
  }, []);
  
  // Feature flag for new hooks
  const [useNewAuthHooks] = useFeatureFlag('USE_NEW_AUTH_HOOKS');

  // Feature flag usage
  const [useNewComponents] = useFeatureFlag('USE_NEW_COMPONENTS');

  // Legacy hook implementations for when feature flag is disabled
  function useOldVerificationState() {
    // Debug logging to confirm old implementation is used
    console.log('🔄 [OLD IMPLEMENTATION] Using old email verification state');
    
    const { initialize, user } = useAuthStore();
    const { setLastUsedEmail, setRememberMe } = usePreferencesStore();
    
    // State for verification modal
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);

    // Handle email verification
    useEffect(() => {
      const checkForVerification = async () => {
        // First check for hash fragments in the URL (Supabase uses these for email verification)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Get URL parameters - from either query string or hash fragment
        const tokenFromSearch = new URLSearchParams(window.location.search).get('token');
        const typeFromSearch = new URLSearchParams(window.location.search).get('type');
        const emailFromSearch = new URLSearchParams(window.location.search).get('email');
        const tokenFromHash = hashParams.get('access_token');
        const typeFromHash = hashParams.get('type');

        // Combine parameters (prefer hash if available)
        const token = tokenFromHash || tokenFromSearch;
        const type = typeFromHash || typeFromSearch;
        const email = emailFromSearch; // Email usually comes in search params for our custom flows

        logger.info('Checking for verification params:', { 
          token: token?.substring(0, 8), 
          type, 
          email 
        });

        // Check if this is our custom verification request with token param (non-Supabase magic link)
        if (tokenFromSearch && (typeFromSearch === 'verification' || typeFromSearch === 'signup') && emailFromSearch) {
          logger.info('Detected CUSTOM verification parameters in SEARCH URL:', { token: tokenFromSearch.substring(0, 8), type: typeFromSearch, email: emailFromSearch });
          setIsVerifying(true);
          setVerificationEmail(emailFromSearch);
          
          try {
            // Save email for login form in case they need to sign in manually later
            setLastUsedEmail(emailFromSearch);
            setRememberMe(true);
            
            // The correct way to handle email verification in Supabase v2
            logger.info('Verifying email with token');
            
            // First try exchangeCodeForSession which is the recommended method
            try {
              const { error: sessionError } = await supabase.auth.exchangeCodeForSession(tokenFromSearch);
              if (sessionError) {
                logger.error('Error exchanging code for session, falling back to verifyOtp:', sessionError);
                
                // Fallback to verifyOtp if exchangeCodeForSession fails
                const { error: verifyError } = await supabase.auth.verifyOtp({
                  token_hash: tokenFromSearch,
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
              
              // Clear verification state now that user is verified
              setVerificationEmail(null);
              setPendingVerification(false);
              
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

    // Define the handleResumeVerification function
    const handleResumeVerificationFn = (verificationEmail: string) => {
      console.log('Resuming verification for email:', verificationEmail);
      
      // Save the verification state in localStorage
      const verificationState = {
        email: verificationEmail,
        startTime: Date.now(),
        resumed: true,
        resumeTime: Date.now()
      };
      
      // Store both in localStorage to ensure consistency
      localStorage.setItem('verificationState', JSON.stringify(verificationState));
      localStorage.setItem('verificationEmail', verificationEmail);
      
      // Set the verification email to show the banner
      setVerificationEmail(verificationEmail);
    };

    return {
      showVerificationModal,
      setShowVerificationModal,
      verificationEmail,
      verificationError,
      setVerificationError,
      isVerifying,
      pendingVerification,
      handleResumeVerification: handleResumeVerificationFn,
    };
  }

  function useOldAuthModalState() {
    // Debug logging to confirm old implementation is used
    console.log('🔄 [OLD IMPLEMENTATION] Using old auth modal state');
    
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<typeof AUTH_VIEWS[keyof typeof AUTH_VIEWS]>(AUTH_VIEWS.SIGN_IN);
    
    // Function to check URL parameters and set modal state accordingly
    const checkUrlParams = () => {
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for reset=true to trigger reset password flow
      if (urlParams.has('reset')) {
        setAuthModalMode(AUTH_VIEWS.FORGOT_PASSWORD);
        setShowAuthModal(true);
      }
      
      // Check for successful password reset
      if (urlParams.has('passwordReset') && urlParams.get('passwordReset') === 'success') {
        showSuccess("Password updated successfully! You can now sign in with your new password.", 5000);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, '/');
      }
    };
    
    // Process URL parameters on initial load
    useEffect(() => {
      checkUrlParams();
    }, []);

    return {
      showAuthModal,
      setShowAuthModal,
      authModalMode,
      setAuthModalMode,
      checkUrlParams
    };
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-app text-primary">
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
          {useNewComponents ? (
            <AppHeader 
              hasVerificationBanner={!!verificationEmail || pendingVerification}
            />
          ) : (
            <header>
              {/* Auth Section */}
              <div className="w-full bg-app">
                <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
                  <div className="flex justify-end">
                    <AuthHeader />
                  </div>
                </div>
              </div>
              
              {/* Logo Section */}
              <div className="bg-app">
                <div className="max-w-[800px] mx-auto py-0 px-2 sm:px-3">
                  <div className="bg-container shadow-md rounded-md p-1">
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
          )}
          
          {useNewComponents ? (
            <AppMainContent 
              displayInputText={displayInputText}
              setInputText={handleInputTextChange}
              isGenerating={isGenerating}
              generateGraffiti={generateGraffiti}
              error={error}
              styles={GRAFFITI_STYLES}
              selectedStyle={selectedStyle}
              handleStyleChange={handleStyleChange}
              processedSvgs={processedSvgs}
              positions={positions}
              contentWidth={contentWidth}
              contentHeight={contentHeight}
              containerScale={containerScale}
              customizationOptions={customizationOptions}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              handleUndoRedo={handleUndoRedo}
              hasInitialGeneration={hasInitialGeneration}
              handleCustomizationChange={handleCustomizationChange}
            />
          ) : (
            <main className="flex-grow">
              <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
                <div className="space-y-2">
                  {/* Top section: Input and Style Selection */}
                  <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-fade-in">
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
                  <div className="bg-container shadow-md rounded-md p-1.5 sm:p-2 animate-slide-up">
                    {/* This div maintains the 16:9 aspect ratio with no vertical gaps */}
                    <div className="w-full relative bg-panel rounded-md overflow-hidden">
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
                            <div className="text-tertiary text-center p-3">
                              {hasInitialGeneration.current ? (
                                <p className="text-sm">No text to display. Enter some text and click Create.</p>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-tertiary text-sm">Enter text above and click Create to generate your graffiti</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customization Section */}
                  <div className="bg-container shadow-md rounded-md p-0.5 sm:p-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CustomizationToolbar 
                      options={customizationOptions}
                      onChange={handleCustomizationChange}
                    />
                  </div>
                </div>
              </div>
            </main>
          )}
          
          {/* Footer Section */}
          {useNewComponents ? (
            <AppFooter />
          ) : (
            <footer className="shadow-inner mt-2">
              <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
                <p className="text-center text-tertiary text-xs">
                  STIZAK &copy;{new Date().getFullYear()} | 
                  <a href="/privacy-policy" className="ml-2 text-tertiary hover:text-secondary">Privacy Policy</a> | 
                  <a href="/terms-of-service" className="ml-2 text-tertiary hover:text-secondary">Terms of Service</a>
                </p>
              </div>
            </footer>
          )}
          
          {/* Developer Tools */}
          {useNewComponents ? (
            <AppDevTools
              isDev={isDev}
              showValueOverlays={showValueOverlays}
              showColorPanel={showColorPanel}
              toggleValueOverlays={toggleValueOverlays}
              toggleColorPanel={toggleColorPanel}
            />
          ) : (
            <>
              {/* Add the debug panel - only when debug panels are enabled */}
              {isDev && isDebugPanelEnabled() && <OverlapDebugPanel />}
              
              {/* Add the color panel - only in development mode */}
              {isDev && showColorPanel && <DevColorPanel />}
            </>
          )}
        </div>

        {/* Dev Mode Buttons - only visible when debug panels are enabled */}
        {!useNewComponents && isDev && isDebugPanelEnabled() && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] flex gap-2 opacity-[0.25]">
            <button
              onClick={toggleValueOverlays}
              className={cn(
                "px-2 py-1 text-xs rounded border",
                showValueOverlays
                  ? "bg-pink-700 border-pink-500 text-white"
                  : "bg-panel border-app text-secondary"
              )}
            >
              {showValueOverlays ? 'Hide Values' : 'Show Values'}
            </button>
            <button
              onClick={toggleColorPanel}
              className={cn(
                "px-2 py-1 text-xs rounded border",
                showColorPanel
                  ? "bg-pink-700 border-pink-500 text-white"
                  : "bg-panel border-app text-secondary"
              )}
            >
              {showColorPanel ? 'Hide Colors' : 'Edit Colors'}
            </button>
          </div>
        )}
        
        {/* Email Verification Success Modal */}
        {showVerificationModal && <VerificationSuccessModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />}
        
        {/* Verification Error Modal */}
        {verificationError && (
          <VerificationErrorModal 
            isOpen={!!verificationError} 
            errorMessage={verificationError} 
            onClose={() => setVerificationError(null)} 
          />
        )}
        
        {/* Verification Loading Modal */}
        <VerificationLoadingModal isOpen={isVerifying} />
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialView={authModalMode}
            verificationEmail={verificationEmail}
          />
        )}

        {/* Feature Flag Controls */}
        {process.env.NODE_ENV === 'development' && <FeatureFlagControls />}
      </div>
    </AuthProvider>
  );
}

export default App;