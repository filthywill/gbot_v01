// LoadingIndicator.tsx
import React from 'react';

// Invisible loading indicator that maintains the same structure but is not visible to users
const LoadingIndicator: React.FC = () => {
  return (
    <div 
      style={{
        width: '100%',
        paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
        position: 'relative',
        backgroundColor: 'transparent'
      }}
    >
      {/* This div maintains the structure but is completely invisible */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          opacity: 0 // Make completely invisible
        }}
      >
        <div 
          style={{
            backgroundColor: 'transparent',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              color: 'transparent',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {/* Keep the spinner for structure but make it invisible */}
            <svg 
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{
                marginRight: '0.75rem',
                animation: 'spin 1s linear infinite',
                color: 'transparent'
              }}
            >
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                fill="none"
                stroke="transparent" 
                strokeWidth="4"
                opacity="0" 
              />
              <path 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="transparent"
                opacity="0"
              />
            </svg>
            <span style={{ color: 'transparent', opacity: 0 }}>Generating...</span>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LoadingIndicator);