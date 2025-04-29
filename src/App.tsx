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
import { AuthModal } from './components/Auth';
import { DevColorPanel } from './components/ui/dev-color-panel';
import { FeatureFlagControls } from './components/dev/FeatureFlagControls';
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
  
  // Feature flag usage
  const [useNewComponents] = useFeatureFlag('USE_NEW_COMPONENTS');

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