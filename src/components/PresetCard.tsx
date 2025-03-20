import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { StylePreset } from '../data/stylePresets';

interface PresetCardProps {
  preset: StylePreset;
  isActive: boolean;
  onClick: () => void;
}

const PresetCard: React.FC<PresetCardProps> = memo(({ 
  preset, 
  isActive, 
  onClick,
}) => {
  // Memoize thumbnail path generation
  const thumbnailPath = useMemo(() => 
    `/assets/preset-thumbs/th-${preset.id.toLowerCase().replace(/\s+/g, '-')}.svg`,
    [preset.id]
  );

  // Memoize checkerboard pattern style
  const checkerboardStyle = useMemo(() => ({
    backgroundImage: `
      linear-gradient(45deg, #c3c3c3 25%, transparent 25%),
      linear-gradient(-45deg, #c3c3c3 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #c3c3c3 75%),
      linear-gradient(-45deg, transparent 75%, #c3c3c3 75%)
    `,
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  }), []);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full max-w-[150px] mx-auto rounded-md overflow-hidden relative',
        'bg-gray-300/50 shadow-[0_2px_4px_0_rgba(0,0,0,0.15)]',
        'focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-0',
        'transition-all duration-150 ease-in-out',
        isActive 
          ? 'shadow-[0_4px_8px_0_rgba(0,0,0,0.2)]' 
          : 'hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.2)]'
      )}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      {/* Thumbnail container with reduced padding and scaled up image */}
      <div className="p-0.5 flex items-center justify-center">
        <div className="w-full overflow-hidden rounded-md relative">
          {/* Checkerboard pattern background */}
          <div 
            className="absolute inset-0 bg-[length:16px_16px]" 
            style={checkerboardStyle}
          />
          <img 
            src={thumbnailPath}
            alt={`${preset.name} style preview`}
            className="w-full h-auto scale-[1.2] transform origin-center relative"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>
      
      {/* Preset name - minimal padding */}
      <div className="px-1.5 py-1 relative">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs font-medium text-gray-700 truncate text-center">
            {preset.name}
          </span>
          {isActive && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500" />
          )}
        </div>
      </div>
    </button>
  );
});

PresetCard.displayName = 'PresetCard';

// Grid container with reduced spacing
export const PresetGrid: React.FC<{
  presets: StylePreset[];
  activePresetId?: string;
  onPresetSelect: (preset: StylePreset) => void;
}> = memo(({ presets, activePresetId, onPresetSelect }) => {
  return (
    <div className="p-0.5 grid gap-1 auto-rows-max justify-center" 
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))',
      }}
    >
      {presets.map(preset => (
        <PresetCard
          key={preset.id}
          preset={preset}
          isActive={preset.id === activePresetId}
          onClick={() => onPresetSelect(preset)}
        />
      ))}
    </div>
  );
});

PresetGrid.displayName = 'PresetGrid'; 