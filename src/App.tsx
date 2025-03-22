import { useEffect, useRef } from 'react';
import { ModernStyleSelector } from './components/ModernStyleSelector';
import { ModernInputForm } from './components/ModernInputForm';
import GraffitiDisplay from './components/GraffitiDisplay';
import { ModernCustomizationToolbar } from './components/ModernCustomizationToolbar';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';
import stizakLogo from './assets/logos/stizak-wh.svg';
import { OverlapDebugPanel } from './components/OverlapDebugPanel';

function App() {
  // Get all state and actions from our Zustand-powered hook
  const {
    inputText,
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
  const hasInitialGeneration = useRef(false);

  // Effect to update the hasInitialGeneration ref when we have processed SVGs
  useEffect(() => {
    if (processedSvgs.length > 0) {
      hasInitialGeneration.current = true;
    }
  }, [processedSvgs]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayInputText.trim()) return;
    
    await generateGraffiti(displayInputText);
  };

  // Add debug logging for history state
  useEffect(() => {
    console.log('App history state:', {
      historyLength: history.length,
      currentHistoryIndex,
      hasHistory: history.length > 0
    });
  }, [history.length, currentHistoryIndex]);

  // Handle undo button click
  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      handleUndoRedo(currentHistoryIndex - 1);
    }
  };

  // Handle redo button click
  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      handleUndoRedo(currentHistoryIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      <header className="bg-zinc-800 shadow-sm">
        <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3 flex justify-center items-center">
          <img 
            src={stizakLogo} 
            alt="GraffitiSOFT"
            className="h-[130px] w-auto" 
          />
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
          <div className="space-y-2">
            {/* Top section: Input and Style Selection */}
            <div className="bg-zinc-800 shadow-md rounded-md p-1.5 sm:p-2 animate-fade-in">
              <ModernInputForm 
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
                <ModernStyleSelector 
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
            <div className="bg-zinc-800 shadow-md rounded-md p-1.5 sm:p-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <ModernCustomizationToolbar 
                options={customizationOptions}
                onChange={handleCustomizationChange}
              />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-zinc-800 shadow-inner mt-2">
        <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
          <p className="text-center text-zinc-400 text-xs">
            Graffiti Generator &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
      
      {/* Add the debug panel */}
      {process.env.NODE_ENV === 'development' && <OverlapDebugPanel />}
    </div>
  );
}

export default App;