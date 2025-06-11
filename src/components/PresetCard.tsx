import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { StylePreset } from '../data/stylePresets';
import { X, Copy, Check } from 'lucide-react';

interface PresetCardProps {
  preset: StylePreset;
  isActive: boolean;
  onClick: () => void;
  onDelete?: ((presetId: string) => void) | undefined;
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
  const thumbnailPath = useMemo(() => {
    // We have these specific thumbnails in public/assets/preset-thumbs
    const availableThumbnails: Record<string, string> = {
      'CLASSIC': 'classic',
      'BW': 'bw',
      'REDECHO': 'redecho',
      'SLAP': 'slap', 
      'IGLOO': 'igloo',
      'SUNKIST': 'sunkist', // Fallback to slap if sunkist is missing
      'CONCRETE': 'concrete',
      'SEAFOAM': 'seafoam',
      'PURP': 'purp',
      'PINKY': 'pinky',
      'KEYLIME': 'keylime',
    };
    
    // Use the mapped name if available, otherwise normalize the preset ID
    const thumbnailName = availableThumbnails[preset.id] || 
      preset.id.toLowerCase().replace(/[_\s]+/g, '-');
      
    return `/assets/preset-thumbs/th-${thumbnailName}.svg`;
  }, [preset.id]);

  // Check if it's a user preset (for custom thumbnail fallback)
  const isUserPreset = useMemo(() => {
    // List of known preset IDs that have thumbnails
    const knownPresets = ["CLASSIC", "BW", "REDECHO", "SLAP", "IGLOO", "SUNKIST", "CONCRETE", "SEAFOAM", "PURP", "PINKY", "KEYLIME"];
    return !knownPresets.includes(preset.id);
  }, [preset.id]);
  
  // Check if in dev mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';

  // Memoize checkerboard pattern style
  const checkerboardStyle = useMemo(() => ({
    backgroundImage: `
      linear-gradient(45deg, #c3c3c3 25%, transparent 25%),
      linear-gradient(-45deg, #c3c3c3 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #c3c3c3 75%),
      linear-gradient(-45deg, transparent 75%, #c3c3c3 75%)
    `,
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    backgroundSize: '16px 16px',
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

  // Render a color preview based on preset colors
  const renderColorPreview = () => {
    const { fillColor, stampColor } = preset.settings;
    return (
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: fillColor || '#ffffff',
          color: stampColor || '#000000',
          fontWeight: 'bold',
          fontSize: '12px',
        }}
      >
        {preset.name}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full max-w-[150px] mx-auto rounded overflow-hidden relative',
        'bg-control shadow-[0_2px_3px_0_rgba(0,0,0,0.2)]',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary-300 focus:ring-offset-0',
        'transition-all duration-150 ease-in-out',
        'cursor-pointer',
        isActive 
          ? 'shadow-[0_3px_5px_-1px_rgba(0,0,0,0.3)] scale-[1.02] z-10'
          : 'hover:bg-control-hover hover:z-10 hover:scale-[1.01]'
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
          className="absolute top-0 right-0 z-10 w-5 h-5 bg-red-500/80 text-control rounded-bl-md flex items-center justify-center transition-colors hover:bg-red-600"
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
            "absolute top-0 left-0 z-10 w-5 h-5 text-control rounded-br-md flex items-center justify-center transition-colors",
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
      
      {/* Thumbnail container with checkerboard background */}
      <div className="p-0.5 flex items-center justify-center">
        <div className="w-full overflow-hidden rounded relative aspect-video" style={{ minHeight: '60px' }}>
          {/* Checkerboard pattern background */}
          <div 
            className="absolute inset-0" 
            style={checkerboardStyle}
          />
          {isUserPreset ? (
            renderColorPreview()
          ) : (
            <div 
              className="absolute inset-0 w-full h-full bg-no-repeat bg-center"
              style={{
                backgroundImage: `url(${thumbnailPath})`,
                backgroundSize: '140%',
                backgroundPosition: 'center center',
              }}
              role="img" 
              aria-label={`${preset.name} style preview`}
              onError={(e) => {
                console.error(`Failed to load thumbnail for preset: ${preset.id}. Path attempted: ${thumbnailPath}`);
                const target = e.target as HTMLElement;
                
                // Create fallback
                const fallback = document.createElement('div');
                fallback.className = "w-full h-full flex items-center justify-center absolute inset-0";
                fallback.style.backgroundColor = preset.settings.fillColor || '#ffffff';
                fallback.style.color = preset.settings.stampColor || '#000000';
                fallback.style.fontWeight = 'bold';
                fallback.style.fontSize = '12px';
                fallback.innerText = preset.name;
                
                // Replace the background image with the fallback
                target.style.backgroundImage = 'none';
                target.appendChild(fallback);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

PresetCard.displayName = 'PresetCard';

// Horizontal scrolling container for preset cards
export const HorizontalPresetScroller: React.FC<{
  presets: StylePreset[];
  activePresetId?: string | undefined;
  onPresetSelect: (preset: StylePreset) => void;
  onPresetDelete?: (presetId: string) => void;
  areDeletable?: boolean;
}> = memo(({ presets, activePresetId, onPresetSelect, onPresetDelete, areDeletable = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';

  // Add event listeners for mouse wheel scrolling behavior
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheelScroll = (e: WheelEvent) => {
      // If the user is scrolling vertically with the mouse wheel, scroll horizontally instead
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheelScroll, { passive: false });
    
    // Cleanup event listeners on unmount
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheelScroll);
    };
  }, [presets]); // Re-run if presets change

  return (
    <div className="relative">
      {/* Scrollable container with a themed scrollbar */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-1 px-1 themed-scrollbar-horizontal"
      >
        <div className="flex gap-2 px-1">
          {presets.map(preset => (
            <div key={preset.id} className="flex-shrink-0" style={{ width: '90px' }}>
              <PresetCard
                preset={preset}
                isActive={preset.id === activePresetId}
                onClick={() => onPresetSelect(preset)}
                onDelete={isDev && areDeletable ? onPresetDelete : undefined}
                isDeletable={isDev && areDeletable}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

HorizontalPresetScroller.displayName = 'HorizontalPresetScroller';

// Grid container
export const PresetGrid: React.FC<{
  presets: StylePreset[];
  activePresetId?: string | undefined;
  onPresetSelect: (preset: StylePreset) => void;
  onPresetDelete?: (presetId: string) => void;
  areDeletable?: boolean;
}> = memo(({ presets, activePresetId, onPresetSelect, onPresetDelete, areDeletable = false }) => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';

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
