import React from 'react';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';
import { cn } from './lib/utils';
import { useDevStore } from './store/useDevStore';
import { isDevelopment } from './lib/env';
import logger from './lib/logger';
import { AuthProvider, VerificationBanner } from './components/Auth';
import useAuthStore from './store/useAuthStore';
// Lazy load AuthModal for better bundle splitting
const AuthModal = React.lazy(() => import('./components/Auth/AuthModal'));
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
 * 
 * Protected Routes Usage Example:
 * When using React Router, protect auth-required routes like:
 * 
 * import { ProtectedRoute } from './components/Auth';
 * 
 * <Routes>
 *   <Route path="/" element={<PublicPage />} />
 *   <Route 
 *     path="/dashboard" 
 *     element={
 *       <ProtectedRoute redirectTo="/auth/login">
 *         <DashboardPage />
 *       </ProtectedRoute>
 *     } 
 *   />
 * </Routes>
 */
function App() {
  // Get developer tools state from store
  const { showValueOverlays, toggleValueOverlays, showColorPanel, toggleColorPanel } = useDevStore();
  const isDev = isDevelopment();
  const { user } = useAuthStore();
  
  // Authentication and modal state management
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode, 
    setAuthModalMode
  } = useAuthModalState();
  
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
  } = useEmailVerification({
    // Pass the auth modal control functions to enable the resume verification feature
    setShowAuthModal,
    setAuthModalMode
  });

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

  // Memoize modal close handlers to prevent unnecessary re-renders
  const handleCloseVerificationModal = React.useCallback(() => {
    setShowVerificationModal(false);
  }, [setShowVerificationModal]);

  const handleCloseVerificationError = React.useCallback(() => {
    setVerificationError(null);
  }, [setVerificationError]);

  const handleCloseAuthModal = React.useCallback(() => {
    setShowAuthModal(false);
  }, [setShowAuthModal]);

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
            onClose={handleCloseVerificationModal} 
          />
        )}
        
        {/* Verification Error Modal - Shown when verification fails */}
        {verificationError && (
          <VerificationErrorModal 
            isOpen={!!verificationError} 
            errorMessage={verificationError} 
            onClose={handleCloseVerificationError} 
          />
        )}
        
        {/* Verification Loading Modal - Shown during verification process */}
        <VerificationLoadingModal isOpen={isVerifying} />
        
        {/* Authentication Modal - Used for login, signup, and password reset */}
        {showAuthModal && (
          <React.Suspense 
            fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-container rounded-lg p-6 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-primary">Loading...</span>
                  </div>
                </div>
              </div>
            }
          >
            <AuthModal
              isOpen={showAuthModal}
              onClose={handleCloseAuthModal}
              initialView={authModalMode}
              verificationEmail={verificationEmail}
            />
          </React.Suspense>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;