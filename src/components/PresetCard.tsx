import { memo, useMemo } from 'react';
import { cn } from '../lib/utils';
import { StylePreset } from '../data/stylePresets';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PresetCardProps {
  preset: StylePreset;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (presetId: string) => void;
  isDeletable?: boolean;
}

const PresetCard: React.FC<PresetCardProps> = memo(({ 
  preset, 
  isActive, 
  onClick,
  onDelete,
  isDeletable = false,
}) => {
  // State for copy success feedback
  const [hasCopied, setHasCopied] = useState(false);
  
  // Memoize thumbnail path generation
  const thumbnailPath = useMemo(() => 
    `/assets/preset-thumbs/th-${preset.id.toLowerCase().replace(/\s+/g, '-')}.svg`,
    [preset.id]
  );

  // Check if it's a user preset (for custom thumbnail fallback)
  const isUserPreset = useMemo(() => 
    !["CLASSIC", "SLAP", "IGLOO", "SUNKIST", "CONCRETE"].includes(preset.id),
    [preset.id]
  );
  
  // Check if in dev mode
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

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

  // Handler for the delete button to prevent event propagation
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(preset.id);
    }
  };
  
  // Handler for the copy to clipboard button
  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      // Format the preset as TypeScript code ready to paste into stylePresets.ts
      const { settings } = preset;
      
      // Create an object with just the non-default values to be more concise
      const nonDefaultSettings: Record<string, any> = {};
      
      // Add each property that's not the default value
      for (const [key, value] of Object.entries(settings)) {
        // Skip special props
        if (key.startsWith('__')) continue;
        
        // Add to our non-default settings
        nonDefaultSettings[key] = value;
      }
      
      // Format the code snippet
      const code = `{
  id: '${preset.id}',
  name: '${preset.name}',
  settings: {
    ...baseSettings,
${Object.entries(nonDefaultSettings)
  .map(([key, value]) => {
    // Format the value based on its type
    const formattedValue = typeof value === 'string' 
      ? `'${value}'` 
      : value;
    return `    ${key}: ${formattedValue},`;
  })
  .join('\n')}
  }
},`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(code).then(() => {
        // Show success feedback
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      });
    } catch (error) {
      console.error('Failed to copy preset to clipboard:', error);
      alert('Failed to copy preset. See console for details.');
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full max-w-[150px] mx-auto rounded overflow-hidden relative',
        'bg-gray-300/50 shadow-[0_2px_3px_0_rgba(0,0,0,0.2)]',
        'focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-0',
        'transition-all duration-150 ease-in-out',
        'cursor-pointer',
        isActive 
          ? 'shadow-[0_3px_5px_-1px_rgba(0,0,0,0.3)]'
          : 'hover:bg-gray-300/90 hover:z-10'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      
      {/* Delete button for user presets */}
      {isDeletable && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 z-10 w-5 h-5 bg-red-500/80 text-white rounded-bl-md flex items-center justify-center transition-colors hover:bg-red-600"
          aria-label={`Delete ${preset.name} preset`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      
      {/* Copy to clipboard button (Dev Mode Only) */}
      {isDev && (
        <button
          onClick={handleCopyToClipboard}
          className={cn(
            "absolute top-0 left-0 z-10 w-5 h-5 text-white rounded-br-md flex items-center justify-center transition-colors",
            hasCopied 
              ? "bg-green-500/80 hover:bg-green-600" 
              : "bg-blue-500/80 hover:bg-blue-600"
          )}
          aria-label={`Copy ${preset.name} preset code`}
          title="Copy preset code for stylePresets.ts"
        >
          {hasCopied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      )}
      
      {/* Thumbnail container with reduced padding and scaled up image */}
      <div className="p-0.1 flex items-center justify-center">
        <div className="w-full overflow-hidden rounded relative">
          {/* Checkerboard pattern background */}
          <div 
            className="absolute inset-0 bg-[length:16px_16px]" 
            style={checkerboardStyle}
          />
          <img 
            src={thumbnailPath}
            alt={`${preset.name} style preview`}
            className="w-full h-auto scale-[1.4] transform origin-center relative"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              
              // For user presets, show a fallback with color instead
              if (isUserPreset) {
                const parent = target.parentNode as HTMLElement;
                const fallback = document.createElement('div');
                fallback.className = "w-full h-20 flex items-center justify-center";
                fallback.style.backgroundColor = preset.settings.fillColor || '#ffffff';
                fallback.style.color = preset.settings.stampColor || '#000000';
                fallback.style.fontWeight = 'bold';
                fallback.style.fontSize = '12px';
                fallback.innerText = preset.name;
                parent.appendChild(fallback);
              }
            }}
          />
          
          {/* Overlay label */}
          {/*}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px] px-1 py-0.2">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[11px] font-medium text-white truncate text-center">
                {preset.name}
              </span>
              {isActive && (
                <span className="shrink-0 w-1 h-1 rounded-full bg-purple-400" />
              )}
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
});

PresetCard.displayName = 'PresetCard';

// Grid container with reduced spacing
export const PresetGrid: React.FC<{
  presets: StylePreset[];
  activePresetId?: string;
  onPresetSelect: (preset: StylePreset) => void;
  onPresetDelete?: (presetId: string) => void;
  areDeletable?: boolean;
}> = memo(({ presets, activePresetId, onPresetSelect, onPresetDelete, areDeletable = false }) => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

  return (
    <div className="p-0.5 grid gap-1.5 auto-rows-max justify-center" 
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
      }}
    >
      {presets.map(preset => (
        <PresetCard
          key={preset.id}
          preset={preset}
          isActive={preset.id === activePresetId}
          onClick={() => onPresetSelect(preset)}
          onDelete={isDev && areDeletable ? onPresetDelete : undefined}
          isDeletable={isDev && areDeletable}
        />
      ))}
    </div>
  );
});

PresetGrid.displayName = 'PresetGrid'; 