import React, { useEffect } from 'react';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';
import { cn } from './lib/utils';
import { useDevStore } from './store/useDevStore';
import { isDevelopment } from './lib/env';
import { debugLog } from './lib/debug';
import logger from './lib/logger';
import { AuthProvider, VerificationBanner } from './components/Auth';
import useAuthStore from './store/useAuthStore';
import { AuthModal } from './components/Auth';
import { FeatureFlagControls } from './components/dev/FeatureFlagControls';
import { useEmailVerification } from './hooks/auth/useEmailVerification';
import { useAuthModalState } from './hooks/auth/useAuthModalState';
import { AppHeader, AppFooter, AppDevTools, AppMainContent } from './components/app';
// Import all modals from the centralized modals directory
import { 
  VerificationSuccessModal, 
  VerificationErrorModal, 
  VerificationLoadingModal 
} from './components/modals';

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
  
  // Use auth hooks
  const {
    showVerificationModal,
    setShowVerificationModal,
    verificationEmail,
    verificationError,
    setVerificationError,
    isVerifying,
    pendingVerification,
    handleResumeVerification
  } = useEmailVerification();

  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode, 
    setAuthModalMode,
    checkUrlParams
  } = useAuthModalState();

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
          {/* Header */}
          <AppHeader 
            hasVerificationBanner={!!verificationEmail || pendingVerification}
          />
          
          {/* Main Content */}
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
          
          {/* Footer */}
          <AppFooter />
          
          {/* Developer Tools */}
          <AppDevTools
            isDev={isDev}
            showValueOverlays={showValueOverlays}
            showColorPanel={showColorPanel}
            toggleValueOverlays={toggleValueOverlays}
            toggleColorPanel={toggleColorPanel}
          />
        </div>
        
        {/* ===== Modal Components ===== */}
        {/* Verification Success Modal - Shown after successful email verification */}
        {showVerificationModal && (
          <VerificationSuccessModal 
            isOpen={showVerificationModal} 
            onClose={() => setShowVerificationModal(false)} 
          />
        )}
        
        {/* Verification Error Modal - Shown when verification fails */}
        {verificationError && (
          <VerificationErrorModal 
            isOpen={!!verificationError} 
            errorMessage={verificationError} 
            onClose={() => setVerificationError(null)} 
          />
        )}
        
        {/* Verification Loading Modal - Shown during verification process */}
        <VerificationLoadingModal isOpen={isVerifying} />
        
        {/* Authentication Modal - Used for login, signup, and password reset */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialView={authModalMode}
            verificationEmail={verificationEmail}
          />
        )}

        {/* Feature Flag Controls - Only visible in development */}
        {process.env.NODE_ENV === 'development' && <FeatureFlagControls />}
      </div>
    </AuthProvider>
  );
}

export default App;