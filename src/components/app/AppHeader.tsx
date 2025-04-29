import React from 'react';
import { cn } from '../../lib/utils';
import { AuthHeader } from '../Auth';
import stizakLogo from '../../assets/logos/stizack-wh.svg';

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
}

export function AppHeader({ 
  hasVerificationBanner = false,
  className,
  customLogo,
  logoAlt = "STIZAK",
  hideAuthHeader = false
}: AppHeaderProps) {
  const logoSrc = customLogo || stizakLogo;
  
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
            <div className="flex justify-center">
              <img 
                src={logoSrc} 
                alt={logoAlt}
                className="h-[120px] w-auto" 
                onError={(e) => {
                  // Fallback if image fails to load
                  console.error('Failed to load logo image', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader; 