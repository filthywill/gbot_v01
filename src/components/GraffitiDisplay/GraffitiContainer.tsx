// GraffitiContainer.tsx
import React from 'react';
import { CustomizationOptions } from '../../types';

interface GraffitiContainerProps {
  customizationOptions: CustomizationOptions;
  children: React.ReactNode;
}

const GraffitiContainer: React.FC<GraffitiContainerProps> = ({ 
  customizationOptions, 
  children 
}) => {
  // Background styles based on customization options
  const backgroundStyle = customizationOptions.backgroundEnabled
    ? { backgroundColor: customizationOptions.backgroundColor }
    : {
        backgroundImage: `
          linear-gradient(45deg, #d4c6e9 25%, transparent 45%), 
          linear-gradient(-45deg, #d4c6e9 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #d4c6e9 75%), 
          linear-gradient(-45deg, transparent 75%, #d4c6e9 75%)
        `,
        backgroundSize: '10px 10px',
        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
        backgroundColor: '#f5f0ff'
      };

  return (
    <div className="w-full h-full relative">
      {/* This inner div contains the actual content */}
      <div 
        style={{ 
          ...backgroundStyle,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden'
        }}
        className="border border-gray-300 sm:border-2 md:border-4 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
};

export default GraffitiContainer;