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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GraffitiSOFT</h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleUndo}
              disabled={currentHistoryIndex <= 0}
              className={`px-3 py-1 rounded ${
                currentHistoryIndex <= 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Undo
            </button>
            
            <button 
              onClick={handleRedo}
              disabled={currentHistoryIndex >= history.length - 1}
              className={`px-3 py-1 rounded ${
                currentHistoryIndex >= history.length - 1 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Redo
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex flex-col gap-6">
              {/* Top section: Input and Preview */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Text Input</h2>
                
                <InputForm 
                  inputText={displayInputText}
                  setInputText={handleInputTextChange}
                  isGenerating={isGenerating}
                  onGenerate={generateGraffiti}
                />
                
                {error && (
                  <div className="mt-2 text-red-500 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Preview directly under the input form */}
                <div className="mt-6">
                  
                  
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                    {processedSvgs.length > 0 ? (
                      <GraffitiDisplay 
                        isGenerating={isGenerating}
                        processedSvgs={processedSvgs}
                        positions={positions}
                        contentWidth={contentWidth}
                        contentHeight={contentHeight}
                        containerScale={containerScale}
                        customizationOptions={customizationOptions}
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
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
              
              {/* Bottom section: Style and Customization in a row */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="bg-white shadow rounded-lg p-6 h-full">
                    <h2 className="text-lg font-medium mb-4">Style</h2>
                    
                    <StyleSelector 
                      styles={GRAFFITI_STYLES}
                      selectedStyle={selectedStyle}
                      onSelectStyle={handleStyleChange}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="bg-white shadow rounded-lg p-6 h-full">
                    <h2 className="text-lg font-medium mb-4">Customization</h2>
                    
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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Graffiti Generator &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;