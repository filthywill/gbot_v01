import { useEffect, useRef } from 'react';
import { StyleSelector } from './components/StyleSelector';
import { InputForm } from './components/InputForm';
import GraffitiDisplay from './components/GraffitiDisplay';
import { CustomizationToolbar } from './components/CustomizationToolbar';
import { useGraffitiGeneratorWithZustand } from './hooks/useGraffitiGeneratorWithZustand';
import { GRAFFITI_STYLES } from './data/styles';

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-[800px] mx-auto py-2 sm:py-4 px-2 sm:px-4 lg:px-6 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">GraffitiSOFT</h1>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-[800px] mx-auto py-1 sm:py-4 px-1 sm:px-2 lg:px-4">
          <div className="px-0 py-0 sm:py-2">
            <div className="flex flex-col gap-1 sm:gap-4">
              {/* Top section: Input and Preview */}
              <div className="bg-white shadow rounded-lg p-2 sm:p-3 md:p-4">
                <h2 className="text-base sm:text-lg font-medium mb-1 sm:mb-3">Text Input</h2>
                
                <InputForm 
                  inputText={displayInputText}
                  setInputText={handleInputTextChange}
                  isGenerating={isGenerating}
                  onGenerate={generateGraffiti}
                />
                
                {error && (
                  <div className="mt-1 sm:mt-2 text-red-500 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Style Selector moved here, below the input form */}
                <div className="mt-3 sm:mt-4">
                  <h2 className="text-base sm:text-lg font-medium mb-2">Style</h2>
                  <StyleSelector 
                    styles={GRAFFITI_STYLES}
                    selectedStyle={selectedStyle}
                    onSelectStyle={handleStyleChange}
                  />
                </div>
                
                {/* Preview below the style selector */}
                <div className="mt-3 sm:mt-4">
                  {/* This div maintains the 16:9 aspect ratio with no vertical gaps */}
                  <div className="w-full relative">
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
                          />
                        ) : (
                          <div className="text-gray-400 text-center p-4">
                            {hasInitialGeneration.current ? (
                              <p>No text to display. Enter some text and click Generate.</p>
                            ) : (
                              <p>Enter text above and click Generate to create your graffiti.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom section: Customization only (Style moved up) */}
              <div className="flex flex-col gap-2 sm:gap-4">
                <div className="w-full">
                  <div className="bg-white shadow rounded-lg p-2 sm:p-3 md:p-4 h-full">
                    <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Customization</h2>
                    
                    <CustomizationToolbar 
                      options={customizationOptions}
                      onChange={handleCustomizationChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white shadow-inner">
        <div className="max-w-[800px] mx-auto py-2 sm:py-3 px-2 sm:px-4 lg:px-6">
          <p className="text-center text-gray-500 text-sm">
            Graffiti Generator &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;