import React from 'react';
// Phase 4.1: Use the new optimized hook with React 18 concurrent features
import { useGraffitiGenerator } from './hooks/useGraffitiGeneratorOptimized';
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
import { AppHeader, AppFooter, AppMainContent, AppDevTools } from './components/app';
// Import all modals from the centralized modals directory
import { 
  VerificationSuccessModal, 
  VerificationErrorModal, 
  VerificationLoadingModal 
} from './components/modals';
import { useGraffitiDisplay } from './hooks/useGraffitiDisplay';
// Phase 4.1: Import Error Boundaries
import { AppErrorBoundary, AuthErrorBoundary } from './components/ErrorBoundary';

/**
 * Main Application Component
 * 
 * Phase 4.1: Enhanced with React 18 Concurrent Features + Error Boundaries
 * - Uses optimized graffiti generator with useTransition for non-blocking SVG generation
 * - Input remains responsive during heavy SVG processing
 * - History operations are properly safeguarded to remain synchronous
 * - Comprehensive error handling with graceful recovery options
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

  // Phase 4.1: Graffiti generator state with React 18 concurrent features
  const {
    customizationOptions,
    generateGraffiti,
    handleCustomizationChange,
    isPending // New: Shows when transitions are in progress
  } = useGraffitiGenerator();
  
  // Track if we've had at least one successful generation
  const hasInitialGeneration = React.useRef(false);

  // Phase 3.1: Get processedSvgs from optimized hook for this specific check
  // We still need this for the hasInitialGeneration logic
  const { processedSvgs } = useGraffitiDisplay();

  // Update ref when we have processed SVGs
  React.useEffect(() => {
    if (processedSvgs.length > 0) {
      hasInitialGeneration.current = true;
    }
  }, [processedSvgs]);

  // Phase 4.1: Log concurrent features status in development
  React.useEffect(() => {
    if (isDev && isPending) {
      logger.debug('React 18 transition active - SVG generation in progress');
    }
  }, [isDev, isPending]);

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

  // Phase 4.1: Error handler for application-level errors
  const handleAppError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Application error caught by boundary', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }, []);

  // Listen for custom auth modal trigger events
  React.useEffect(() => {
    const handleAuthTrigger = (event: CustomEvent) => {
      const { view, reason } = event.detail;
      logger.debug('Auth modal triggered via custom event', { view, reason });
      
      // Set the modal view and open it
      setAuthModalMode(view);
      setShowAuthModal(true);
    };

    // Add event listener
    window.addEventListener('auth:trigger-modal', handleAuthTrigger as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('auth:trigger-modal', handleAuthTrigger as EventListener);
    };
  }, [setAuthModalMode, setShowAuthModal]);

  return (
    <AppErrorBoundary onError={handleAppError}>
    <AuthProvider>
      <div className="min-h-screen bg-app text-primary">
        {/* Email verification banner - appears when a user is in the verification process */}
        <VerificationBanner 
          onResumeVerification={handleResumeVerification} 
          forceShow={!!verificationEmail} 
          {...(verificationEmail && { email: verificationEmail })}
          isAuthenticated={!!user} 
        />
        
        {/* Main Application Layout */}
        <div className={cn("min-h-screen", (!!verificationEmail || pendingVerification) && "pt-14")}>
          {/* Application Header - contains authentication controls and logo */}
            <AppHeader 
              hasVerificationBanner={!!verificationEmail || pendingVerification}
            />
          
            {/* Main Content Area - Phase 3.3: CustomizationToolbar is now self-contained
                Phase 4.1: Enhanced with concurrent features for better responsiveness */}
            <AppMainContent 
                styles={GRAFFITI_STYLES}
              generateGraffiti={generateGraffiti}
              hasInitialGeneration={hasInitialGeneration}
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
        
          {/* Authentication Modal - Phase 4.1: Wrapped with AuthErrorBoundary */}
        {showAuthModal && (
            <AuthErrorBoundary>
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
            </AuthErrorBoundary>
        )}
      </div>
    </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;