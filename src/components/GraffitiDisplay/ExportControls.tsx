import React from 'react';

interface ExportControlsProps {
  onCopyToPngClipboard: () => void;
  onSaveAsPng?: () => void;
  onSaveAsSvg?: () => void;
  onShare?: () => void;
  isExporting: boolean;
  showAllButtons?: boolean;
}

/**
 * Component for export controls (copy to clipboard, save as PNG, save as SVG)
 */
const ExportControls: React.FC<ExportControlsProps> = ({
  onCopyToPngClipboard,
  onSaveAsPng,
  onSaveAsSvg,
  onShare,
  isExporting,
  showAllButtons = false
}) => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';
  
  return (
    <div className="absolute top-2 left-2 z-50 flex space-x-1">
      {/* Share Button - Hidden for now */}
      {false && onShare && (
        <button
          onClick={onShare}
          disabled={isExporting}
          className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Share"
          style={{ width: '32px', height: '32px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      )}

      {/* Copy to Clipboard Button */}
      <button
        onClick={onCopyToPngClipboard}
        disabled={isExporting}
        className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
        title="Copy to Clipboard"
        style={{ width: '32px', height: '32px' }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </button>
      
      {/* PNG Export Button - Only shown if showAllButtons is true */}
      {showAllButtons && onSaveAsPng && (
        <button
          onClick={onSaveAsPng}
          disabled={isExporting}
          className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Save as PNG"
          style={{ width: '32px', height: '32px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
        </button>
      )}
      
      {/* SVG Export Button - Shown if showAllButtons is true OR in development mode */}
      {(showAllButtons || isDev) && onSaveAsSvg && (
        <button
          onClick={onSaveAsSvg}
          disabled={isExporting}
          className="bg-purple-600 hover:bg-purple-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
          title="Save as SVG"
          style={{ width: '32px', height: '32px' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ExportControls; 