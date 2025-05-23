import React from 'react';
import { cn } from '../../lib/utils';
import { AuthHeader } from '../Auth';
import stizakLogo from '../../assets/logos/stizack-wh.svg';
import { ArrowLeftIcon } from 'lucide-react';

/**
 * AppHeader component that displays the application header
 * Extracted from App.tsx for better component separation
 */
interface AppHeaderProps {
  // Flag to indicate if there's a verification banner above the header
  hasVerificationBanner?: boolean;
  // Optional classNames to apply to the header container
  className?: string;
  // Optional custom logo to display
  customLogo?: string;
  // Optional alt text for the logo
  logoAlt?: string;
  // Optional flag to hide the auth header
  hideAuthHeader?: boolean;
  // Optional flag to show back button instead of logo navigation
  showBackButton?: boolean;
  // Optional back button text
  backButtonText?: string;
  // Optional callback for back button click
  onBackClick?: () => void;
}

export const AppHeader = React.memo<AppHeaderProps>(({ 
  hasVerificationBanner = false,
  className,
  customLogo,
  logoAlt = "STIZAK",
  hideAuthHeader = false,
  showBackButton = false,
  backButtonText = "← Back to App",
  onBackClick
}) => {
  const logoSrc = customLogo || stizakLogo;
  
  const handleLogoClick = () => {
    // Navigate to home page using your router
    (window as any).navigateTo('/');
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      (window as any).navigateTo('/');
    }
  };
  
  return (
    <header className={className}>
      {/* Auth Section */}
      {!hideAuthHeader && (
        <div className="w-full bg-app">
          <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
            <div className="flex justify-end">
              <AuthHeader />
            </div>
          </div>
        </div>
      )}
      
      {/* Logo Section */}
      <div className="bg-app">
        <div className="max-w-[800px] mx-auto py-0 px-2 sm:px-3">
          <div className="bg-container shadow-md rounded-md p-1">
            <div className="flex justify-center relative">
              {/* Back button - positioned absolute to not affect logo centering */}
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 
                           flex items-center space-x-2 text-secondary hover:text-primary 
                           transition-colors duration-200 text-sm font-medium
                           focus:outline-none focus:ring-2 focus:ring-brand-primary-500 
                           focus:ring-offset-2 rounded-md px-2 py-1"
                  aria-label="Return to main app"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{backButtonText.replace('← ', '')}</span>
                  <span className="sm:hidden">Back</span>
                </button>
              )}
              
              {/* Clickable Logo */}
              <button
                onClick={handleLogoClick}
                className="hover:opacity-80 transition-opacity duration-200 focus:outline-none 
                         focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2 rounded-md p-1"
                aria-label="Return to home page"
                title="Click to return to home page"
              >
                <img 
                  src={logoSrc} 
                  alt={logoAlt}
                  className="h-[120px] w-auto" 
                  onError={(e) => {
                    // Only log in development
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Failed to load logo image');
                    }
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader; 