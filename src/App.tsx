import React from 'react';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';
import { cn } from './lib/utils';
import { useDevStore } from './store/useDevStore';
import { isDevelopment } from './lib/env';
import logger from './lib/logger';
import { AuthProvider, VerificationBanner } from './components/Auth';
import useAuthStore from './store/useAuthStore';
import { AuthModal } from './components/Auth';
import { useEmailVerification } from './hooks/auth/useEmailVerification';
import { useAuthModalState } from './hooks/auth/useAuthModalState';
import { AppHeader, AppFooter, AppDevTools, AppMainContent } from './components/app';
// Import all modals from the centralized modals directory
import { 
  VerificationSuccessModal, 
  VerificationErrorModal, 
  VerificationLoadingModal 
} from './components/modals';

/**
 * Main Application Component
 * 
 * App structure follows a modular component architecture:
 * - AppHeader: Contains logo and authentication header
 * - AppMainContent: Holds the main graffiti generator UI
 * - AppFooter: Contains copyright and links
 * - AppDevTools: Developer tools (only visible in development)
 */
function App() {
  // Get developer tools state from store
  const { showValueOverlays, toggleValueOverlays, showColorPanel, toggleColorPanel } = useDevStore();
  const isDev = isDevelopment();
  const { user } = useAuthStore();
  
  // Authentication and verification state management
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
    setAuthModalMode
  } = useAuthModalState();

  // Graffiti generator state from Zustand store
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
  
  // Track if we've had at least one successful generation
  const hasInitialGeneration = React.useRef(false);

  // Update ref when we have processed SVGs
  React.useEffect(() => {
    if (processedSvgs.length > 0) {
      hasInitialGeneration.current = true;
    }
  }, [processedSvgs]);

  // Log errors when they occur
  React.useEffect(() => {
    if (error) {
      logger.error('Application error occurred:', error);
    }
  }, [error]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-app text-primary">
        {/* Email verification banner - appears when a user is in the verification process */}
        <VerificationBanner 
          onResumeVerification={handleResumeVerification} 
          forceShow={!!verificationEmail} 
          email={verificationEmail || undefined}
          isAuthenticated={!!user} 
        />
        
        {/* Main Application Layout */}
        <div className={cn("min-h-screen", (!!verificationEmail || pendingVerification) && "pt-14")}>
          {/* Application Header - contains authentication controls and logo */}
            <AppHeader 
              hasVerificationBanner={!!verificationEmail || pendingVerification}
            />
          
          {/* Main Content Area - contains graffiti generator UI */}
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
          
          {/* Application Footer - contains copyright and links */}
            <AppFooter />
          
          {/* Developer Tools - only visible in development mode */}
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
      </div>
    </AuthProvider>
  );
}

export default App;