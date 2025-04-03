import React, { useEffect } from 'react';
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
import { AuthProvider, AuthHeader } from './components/Auth';
import useAuthStore from './store/useAuthStore';

function App() {
  const { showValueOverlays, toggleValueOverlays } = useDevStore();
  const isDev = isDevelopment();

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

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-900 text-white">
        {/* Main App Content */}
        <div className="min-h-screen">
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
      </div>
    </AuthProvider>
  );
}

export default App;