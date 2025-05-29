import React, { useState, useReducer, useCallback } from 'react';
import { Minimize2, Maximize2, Play, Pause, Square, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProcessedSvg } from '../../types';
import { getLetterSvg } from '../../utils/letterUtils';
import { processSvg } from '../../utils/dev/svgProcessing';
import { validateProcessedSvg, ValidationResult, ValidationSummary, createValidationSummary, detectSymmetry } from '../../utils/dev/svgValidation';
import { generateLookupTable, exportLookupToFile, createMetadataFile, DEFAULT_GENERATION_OPTIONS, LookupGenerationOptions, saveMultipleFilesWithPicker } from '../../utils/dev/lookupGeneration';

// Types for the processing state
interface ProcessedSvgData {
  letter: string;
  style: string;
  variant: 'standard' | 'alternate' | 'first' | 'last';
  bounds: { left: number; right: number; top: number; bottom: number };
  width: number;
  height: number;
  viewBox: string;
  svgContent: string;
  metadata: {
    hasContent: boolean;
    isSymmetric: boolean;
    processingTime: number;
    fileSize: number;
  };
}

interface ProcessingError {
  letter: string;
  error: string;
  timestamp: number;
}

interface ProcessingState {
  isProcessing: boolean;
  isPaused: boolean;
  canCancel: boolean;
  currentLetter: string | null;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  results: Record<string, ProcessedSvgData>;
  errors: ProcessingError[];
  validationResults: ValidationSummary | null;
  startTime: number | null;
  estimatedTimeRemaining: number;
  processingSpeed: number; // letters per second
}

// Processing actions
type ProcessingAction =
  | { type: 'START_PROCESSING'; total: number }
  | { type: 'UPDATE_PROGRESS'; current: number; letter: string }
  | { type: 'ADD_RESULT'; letter: string; data: ProcessedSvgData }
  | { type: 'ADD_ERROR'; error: ProcessingError }
  | { type: 'PAUSE_PROCESSING' }
  | { type: 'RESUME_PROCESSING' }
  | { type: 'CANCEL_PROCESSING' }
  | { type: 'COMPLETE_PROCESSING'; validationResults: ValidationSummary }
  | { type: 'CLEAR_RESULTS' };

// Reducer for processing state
const processingReducer = (state: ProcessingState, action: ProcessingAction): ProcessingState => {
  switch (action.type) {
    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        isPaused: false,
        canCancel: true,
        progress: { current: 0, total: action.total, percentage: 0 },
        results: {},
        errors: [],
        validationResults: null,
        startTime: Date.now(),
        estimatedTimeRemaining: 0,
        processingSpeed: 0
      };
      
    case 'UPDATE_PROGRESS':
      const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
      const speed = action.current > 0 ? action.current / elapsed : 0;
      const remaining = speed > 0 ? (state.progress.total - action.current) / speed : 0;
      
      return {
        ...state,
        currentLetter: action.letter,
        progress: {
          ...state.progress,
          current: action.current,
          percentage: Math.round((action.current / state.progress.total) * 100)
        },
        estimatedTimeRemaining: remaining,
        processingSpeed: speed
      };
      
    case 'ADD_RESULT':
      return {
        ...state,
        results: {
          ...state.results,
          [action.letter]: action.data
        }
      };
      
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.error]
      };
      
    case 'PAUSE_PROCESSING':
      return { ...state, isPaused: true };
      
    case 'RESUME_PROCESSING':
      return { ...state, isPaused: false };
      
    case 'CANCEL_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        isPaused: false,
        canCancel: false,
        currentLetter: null
      };
      
    case 'COMPLETE_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        isPaused: false,
        canCancel: false,
        currentLetter: null,
        validationResults: action.validationResults
      };
      
    case 'CLEAR_RESULTS':
      return {
        ...state,
        results: {},
        errors: [],
        validationResults: null,
        progress: { current: 0, total: 0, percentage: 0 }
      };
      
    default:
      return state;
  }
};

const initialProcessingState: ProcessingState = {
  isProcessing: false,
  isPaused: false,
  canCancel: false,
  currentLetter: null,
  progress: { current: 0, total: 0, percentage: 0 },
  results: {},
  errors: [],
  validationResults: null,
  startTime: null,
  estimatedTimeRemaining: 0,
  processingSpeed: 0
};

export function SvgProcessingPanel() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('straight');
  const [selectedVariant, setSelectedVariant] = useState<'standard' | 'alternate' | 'first' | 'last'>('standard');
  const [resolution, setResolution] = useState(200);
  const [validationLevel, setValidationLevel] = useState<'strict' | 'normal' | 'minimal'>('normal');
  const [isExporting, setIsExporting] = useState(false);

  const [processingState, dispatch] = useReducer(processingReducer, initialProcessingState);

  // Letters to process (alphanumeric)
  const availableLetters = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (speed: number): string => {
    return `${speed.toFixed(1)} letters/sec`;
  };

  // Main processing function
  const startProcessing = useCallback(async () => {
    const lettersToProcess = availableLetters;
    dispatch({ type: 'START_PROCESSING', total: lettersToProcess.length });

    let cancelled = false;
    const results: Array<{ letter: string; validation: ValidationResult }> = [];

    try {
      for (let i = 0; i < lettersToProcess.length && !cancelled; i++) {
        const letter = lettersToProcess[i];
        
        // Check for cancellation
        if (!processingState.isProcessing || processingState.isPaused) {
          await new Promise(resolve => {
            const checkResume = () => {
              if (!processingState.isPaused || !processingState.isProcessing) {
                resolve(void 0);
              } else {
                setTimeout(checkResume, 100);
              }
            };
            checkResume();
          });
        }

        dispatch({ type: 'UPDATE_PROGRESS', current: i + 1, letter });

        try {
          const startTime = performance.now();

          // Get SVG content - this might return a URL or actual content
          const svgContentOrUrl = await getLetterSvg(letter, false, false, false, selectedStyle);
          if (!svgContentOrUrl) {
            throw new Error(`No SVG content found for letter "${letter}"`);
          }

          // Check if it's a URL (starts with / or http) and fetch if needed
          let svgContent = svgContentOrUrl;
          if (svgContentOrUrl.startsWith('/') || svgContentOrUrl.startsWith('http')) {
            // It's a URL, we need to fetch the actual content
            const response = await fetch(svgContentOrUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch SVG from ${svgContentOrUrl}: ${response.statusText}`);
            }
            svgContent = await response.text();
          }

          // Validate that we have actual SVG content
          if (!svgContent || !svgContent.includes('<svg')) {
            throw new Error(`Invalid SVG content for letter "${letter}": ${svgContent.substring(0, 100)}...`);
          }

          // Process SVG
          const processed = await processSvg(svgContent, letter, 0, resolution);

          // Validate result
          const validation = validateProcessedSvg(processed, letter);
          results.push({ letter, validation });

          if (validation.isValid || validationLevel === 'minimal') {
            const processingTime = performance.now() - startTime;

            const processedData: ProcessedSvgData = {
              letter,
              style: selectedStyle,
              variant: selectedVariant,
              bounds: processed.bounds,
              width: processed.width,
              height: processed.height,
              viewBox: `0 0 ${processed.width} ${processed.height}`,
              svgContent: processed.svg,
              metadata: {
                hasContent: validation.metadata.hasContent,
                isSymmetric: detectSymmetry(processed),
                processingTime,
                fileSize: validation.metadata.fileSize
              }
            };

            dispatch({ type: 'ADD_RESULT', letter, data: processedData });
          } else if (validationLevel === 'strict') {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }

        } catch (error) {
          const processingError: ProcessingError = {
            letter,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          };
          dispatch({ type: 'ADD_ERROR', error: processingError });

          if (validationLevel === 'strict') {
            // In strict mode, stop processing on errors
            cancelled = true;
          }
        }
      }

      // Create validation summary
      const validationSummary = createValidationSummary(results);
      dispatch({ type: 'COMPLETE_PROCESSING', validationResults: validationSummary });

    } catch (error) {
      console.error('Processing failed:', error);
      dispatch({ type: 'CANCEL_PROCESSING' });
    }
  }, [selectedStyle, selectedVariant, resolution, validationLevel, availableLetters, processingState.isProcessing, processingState.isPaused]);

  const pauseProcessing = () => {
    dispatch({ type: 'PAUSE_PROCESSING' });
  };

  const resumeProcessing = () => {
    dispatch({ type: 'RESUME_PROCESSING' });
  };

  const cancelProcessing = () => {
    dispatch({ type: 'CANCEL_PROCESSING' });
  };

  const clearResults = () => {
    dispatch({ type: 'CLEAR_RESULTS' });
  };

  const exportResults = async () => {
    if (Object.keys(processingState.results).length === 0) {
      console.warn('No results to export');
      return;
    }

    setIsExporting(true);
    try {
      console.log('🎨 Generating lookup table from processing results...');
      
      // Generate lookup table using our processed results
      const generationOptions: LookupGenerationOptions = {
        style: selectedStyle,
        variants: [selectedVariant],
        includeMetadata: true,
        optimizeContent: true,
        resolution: resolution,
        validationLevel: validationLevel
      };

      // Convert our processing results to the lookup table format
      const lookupData = await generateLookupTable(
        generationOptions,
        (progress, letter) => {
          console.log(`📊 Generation progress: ${progress}% (${letter})`);
        }
      );

      // Generate the two files
      const lookupFileContent = exportLookupToFile(lookupData, `svg-lookup-${selectedStyle}.ts`);
      const metadataFileContent = createMetadataFile(lookupData);

      console.log('📁 Generated files ready for export');

      // Let user choose save locations for both files
      const filesToSave = [
        {
          content: lookupFileContent,
          filename: `svg-lookup-${selectedStyle}.ts`,
          type: 'typescript' as const
        },
        {
          content: metadataFileContent,
          filename: `svg-lookup-metadata-${selectedStyle}.ts`,
          type: 'typescript' as const
        }
      ];

      console.log('📂 Opening file save dialogs...');
      const { saved, failed } = await saveMultipleFilesWithPicker(filesToSave);

      if (saved > 0) {
        console.log(`✅ Successfully saved ${saved} file(s)`);
      }
      if (failed > 0) {
        console.warn(`⚠️ Failed to save ${failed} file(s)`);
      }

      // Show completion message
      if (saved === filesToSave.length) {
        console.log('🎉 All lookup table files exported successfully!');
      } else if (saved > 0) {
        console.log(`📋 Partial export completed: ${saved}/${filesToSave.length} files saved`);
      } else {
        console.log('❌ Export cancelled or failed');
      }

    } catch (error) {
      console.error('💥 Failed to export lookup table:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary-600 hover:bg-brand-primary-700 text-white rounded-lg shadow-lg transition-colors"
        >
          <Maximize2 size={16} />
          SVG Processing
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-panel border border-app rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-app">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-brand-primary-600 rounded-full" />
          <h2 className="text-lg font-semibold text-primary">SVG Processing Panel</h2>
          <span className="px-2 py-1 bg-status-info text-status-info text-xs rounded">
            Development Tool
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-control-hover rounded text-control-icon transition-colors"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Configuration Panel */}
        <div className="w-80 border-r border-app p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Style</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-app rounded text-brand-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-500"
              disabled={processingState.isProcessing}
            >
              <option value="straight">Straight</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Variant</label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value as any)}
              className="w-full px-3 py-2 bg-input border border-app rounded text-brand-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-500"
              disabled={processingState.isProcessing}
            >
              <option value="standard">Standard</option>
              <option value="alternate">Alternate</option>
              <option value="first">First</option>
              <option value="last">Last</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="w-full px-3 py-2 bg-input border border-app rounded text-brand-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-500"
              disabled={processingState.isProcessing}
            >
              <option value={100}>100x100 (Fast)</option>
              <option value={200}>200x200 (Standard)</option>
              <option value={400}>400x400 (High Quality)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Validation Level</label>
            <select
              value={validationLevel}
              onChange={(e) => setValidationLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-input border border-app rounded text-brand-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-500"
              disabled={processingState.isProcessing}
            >
              <option value="minimal">Minimal</option>
              <option value="normal">Normal</option>
              <option value="strict">Strict</option>
            </select>
          </div>

          {/* Control Buttons */}
          <div className="space-y-2 pt-4">
            {!processingState.isProcessing ? (
              <button
                onClick={startProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary-600 hover:bg-brand-primary-700 text-white rounded transition-colors"
              >
                <Play size={16} />
                Start Processing
              </button>
            ) : (
              <div className="space-y-2">
                {!processingState.isPaused ? (
                  <button
                    onClick={pauseProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                  >
                    <Pause size={16} />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    <Play size={16} />
                    Resume
                  </button>
                )}
                <button
                  onClick={cancelProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <Square size={16} />
                  Cancel
                </button>
              </div>
            )}

            {Object.keys(processingState.results).length > 0 && (
              <>
                <button
                  onClick={exportResults}
                  disabled={Object.keys(processingState.results).length === 0 || isExporting}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    Object.keys(processingState.results).length === 0 || isExporting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  )}
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  {isExporting ? 'Choosing Save Location...' : 'Export Results'}
                </button>
                <button
                  onClick={clearResults}
                  disabled={processingState.isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded transition-colors"
                >
                  <X size={16} />
                  Clear Results
                </button>
              </>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Progress Bar */}
          {processingState.isProcessing && (
            <div className="mb-4 p-4 bg-container rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  Processing: {processingState.currentLetter || '...'}
                </span>
                <span className="text-sm text-secondary">
                  {processingState.progress.current} / {processingState.progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-brand-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingState.progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-secondary">
                <span>{processingState.progress.percentage}% complete</span>
                {processingState.estimatedTimeRemaining > 0 && (
                  <span>ETA: {formatTime(processingState.estimatedTimeRemaining)}</span>
                )}
              </div>
              {processingState.processingSpeed > 0 && (
                <div className="text-xs text-secondary mt-1">
                  Speed: {formatSpeed(processingState.processingSpeed)}
                </div>
              )}
            </div>
          )}

          {/* Validation Summary */}
          {processingState.validationResults && (
            <div className="mb-4 p-4 bg-container rounded-lg">
              <h3 className="font-medium text-primary mb-2">Validation Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Valid Letters: {processingState.validationResults.validLetters}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span>Invalid Letters: {processingState.validationResults.invalidLetters.length}</span>
                  </div>
                </div>
                <div>
                  <div>Total Processed: {processingState.validationResults.totalProcessed}</div>
                  <div>Average File Size: {(processingState.validationResults.averageFileSize / 1024).toFixed(1)}KB</div>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {Object.keys(processingState.results).length > 0 && (
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(processingState.results).map(([letter, data]) => (
                <div
                  key={letter}
                  className="p-2 bg-container rounded border hover:border-brand-primary-600 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold text-primary mb-1">{letter}</div>
                    <div className="text-xs text-secondary">
                      {data.metadata.processingTime.toFixed(1)}ms
                    </div>
                    <div className="text-xs text-secondary">
                      {(data.metadata.fileSize / 1024).toFixed(1)}KB
                    </div>
                    {data.metadata.isSymmetric && (
                      <div className="text-xs text-blue-500">Symmetric</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {processingState.errors.length > 0 && (
            <div className="mt-4 p-4 bg-status-error-light border border-status-error rounded-lg">
              <h3 className="font-medium text-status-error mb-2">Processing Errors</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {processingState.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono font-bold">{error.letter}:</span> {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 