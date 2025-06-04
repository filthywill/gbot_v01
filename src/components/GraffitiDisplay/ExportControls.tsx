import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import { AUTH_VIEWS } from '../../lib/auth/constants';
import { Image, ArrowDown } from 'lucide-react';

interface ExportControlsProps {
  onCopyToPngClipboard: () => void;
  onSaveAsSvg?: () => void;
  onShare?: () => void;
  isExporting: boolean;
  showAllButtons?: boolean;
}

/**
 * Component for export controls (Save PNG via clipboard, Save as SVG)
 * Uses z-40 to stay below modals (z-50) but above regular content
 */
const ExportControls: React.FC<ExportControlsProps> = ({
  onCopyToPngClipboard,
  onSaveAsSvg,
  onShare,
  isExporting,
  showAllButtons = false
}) => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';
  
  // Get authentication status
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  
  // Handle click on disabled SVG export button
  const handleDisabledSvgClick = () => {
    if (!isAuthenticated) {
      // Dispatch custom event to trigger auth modal
      window.dispatchEvent(new CustomEvent('auth:trigger-modal', {
        detail: {
          view: AUTH_VIEWS.SIGN_IN,
          reason: 'svg_export'
        }
      }));
    }
  };
  
  return (
    <div className="absolute top-2 left-2 z-40 flex space-x-1">
      {/* Share Button - Hidden for now */}
      {false && onShare && (
        <button
          onClick={onShare}
          disabled={isExporting}
          className="bg-brand-primary-600 hover:bg-brand-primary-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
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

      {/* Save PNG Button (via clipboard - better functionality) */}
      <button
        onClick={onCopyToPngClipboard}
        disabled={isExporting}
        className="bg-brand-primary-600 hover:bg-brand-primary-700 text-white p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center"
        title="Save PNG"
        style={{ width: '32px', height: '32px' }}
      >
        <Image className="h-5 w-5"/>
      </button>
      
      {/* SVG Export Button - Shown if (showAllButtons is true OR in development mode) AND user is authenticated */}
      {(showAllButtons || isDev) && onSaveAsSvg && (
        <button
          onClick={isAuthenticated ? onSaveAsSvg : handleDisabledSvgClick}
          disabled={isExporting}
          className={`p-1 rounded-md shadow-md transition-colors duration-200 flex items-center justify-center ${
            isAuthenticated 
              ? 'bg-brand-primary-600 hover:bg-brand-primary-700 text-white' 
              : 'bg-gray-400 hover:bg-gray-500 text-gray-200 cursor-pointer'
          }`}
          title={isAuthenticated ? "Save as SVG" : "Sign in to save as SVG"}
          style={{ width: '32px', height: '32px' }}
        >
          <ArrowDown className="h-5 w-5"/>
        </button>
      )}
    </div>
  );
};

export default ExportControls; 