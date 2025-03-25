import React from 'react';

interface DevValueDisplayProps {
  value: number;
}

export const DevValueDisplay: React.FC<DevValueDisplayProps> = ({ value }) => {
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  
  if (!isDev) return null;
  
  return (
    <span className="ml-1 text-xs text-zinc-500 font-mono">
      {value}
    </span>
  );
}; 