import React from 'react';
import { useDevStore } from '../../store/useDevStore';

interface DevValueDisplayProps {
  value: number;
  displayValue?: number;
}

export const DevValueDisplay: React.FC<DevValueDisplayProps> = ({ 
  value, 
  displayValue 
}) => {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  const { showValueOverlays } = useDevStore();
  
  if (!isDev || !showValueOverlays) return null;
  
  return (
    <div className="absolute right-0 top-0 bg-black/70 text-xs text-white/70 px-1 rounded pointer-events-none translate-y-[-50%]">
      {displayValue !== undefined ? `${displayValue} (${value})` : value}
    </div>
  );
}; 