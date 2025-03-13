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
          linear-gradient(45deg, #ccc 25%, transparent 45%), 
          linear-gradient(-45deg, #ccc 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #ccc 75%), 
          linear-gradient(-45deg, transparent 75%, #ccc 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#efefef'
      };

  return (
    <div 
      style={{ 
        ...backgroundStyle,
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      }}
      className="border-2 border-dashed border-gray-200 rounded-xl p-4 w-full flex items-center justify-center"
    >
      {children}
    </div>
  );
};

export default GraffitiContainer;