// EmptyState.tsx
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-zinc-400 text-center">
      <p className="text-xl mb-2">Your graffiti will appear here</p>
      <p className="text-sm">Enter some text and hit generate!</p>
    </div>
  );
};

export default EmptyState;