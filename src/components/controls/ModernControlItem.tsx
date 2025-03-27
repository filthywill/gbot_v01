import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { ColorPicker } from '../ui/color-picker';
import { ValueSlider } from '../ui/value-slider';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { cn } from '../../lib/utils';
import { DevValueDisplay } from '../ui/dev-value-display';
import { ValueConfig } from '../../utils/sliderValueConversion';

interface ModernControlItemProps {
  // Base props
  label: string;
  
  // Feature flags
  hasToggle?: boolean;
  hasColorPicker?: boolean;
  hasSlider?: boolean;
  isCollapsible?: boolean;
  
  // Toggle props
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  
  // Color picker props
  color?: string;
  onColorChange?: (color: string) => void;
  onColorComplete?: () => void;
  
  // Slider props
  value?: number;
  onValueChange?: (value: number) => void;
  onSliderComplete?: () => void;
  valueConfig?: ValueConfig;
  sliderLabel?: string;
}

export const ModernControlItem: React.FC<ModernControlItemProps> = ({
  label,
  hasToggle = false,
  hasColorPicker = false,
  hasSlider = false,
  isCollapsible = false,
  enabled = false,
  onToggle,
  color = '#000000',
  onColorChange,
  onColorComplete,
  value = 0,
  onValueChange,
  onSliderComplete,
  valueConfig,
  sliderLabel = 'Size'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  // Update content visibility based on both toggle state and expand state
  useEffect(() => {
    setIsContentVisible((!hasToggle || enabled) && isExpanded);
  }, [hasToggle, enabled, isExpanded]);
  
  const displayValue = valueConfig ? valueConfig.toDisplayValue(value) : value;

  return (
    <div className={cn(
      "bg-zinc-500/25 rounded-lg relative",
      hasSlider ? "pt-1 px-1.5 pb-1" : "py-1 px-1.5"
    )}>
      {/* Header row with label and toggle - fixed height */}
      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
        <div className="flex items-center">
          {hasToggle ? (
            /* Toggle switch container when toggle is enabled */
            <div className="w-9 h-6 flex items-center justify-start">
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          ) : (
            /* Padding that mimics the position of text when there's a toggle */
            <div className="pl-1.5"></div>
          )}
          
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-zinc-200 leading-none">
              {label}
            </span>
            {isCollapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center w-4 h-4 hover:bg-zinc-600/30 rounded"
              >
                {isExpanded ? (
                  <FaChevronCircleUp className="w-3 h-3 text-zinc-500" />
                ) : (
                  <FaChevronCircleDown className="w-3 h-3 text-zinc-500" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Always include a color picker container with consistent dimensions */}
        <div className="w-6 h-6 flex items-center justify-end">
          {hasColorPicker && (
            <ColorPicker
              value={color}
              onChange={onColorChange || (() => {})}
              onChangeComplete={onColorComplete}
              className="w-6 h-6"
            />
          )}
        </div>
      </div>

      {/* Slider section - handle visibility with CSS but maintain container */}
      {hasSlider && (
        <div className="overflow-visible">
          <div 
            className={cn(
              "transition-all duration-150 ease-in-out",
              !isContentVisible ? "h-0 opacity-0 -translate-y-2 -mb-px" : "h-[14px] opacity-100 translate-y-0"
            )}
          >
            <div className="mt-1.5">
              <div className="grid grid-cols-[65px_1fr] items-center gap-3.5">
                <span className="text-xs text-zinc-400 pl-[35px] -mt-1">{sliderLabel}</span>
                <div className="relative max-w-[250px]">
                  {valueConfig && <DevValueDisplay value={value} displayValue={displayValue} />}
                  <ValueSlider
                    value={[displayValue]}
                    min={valueConfig?.displayMin ?? 0}
                    max={valueConfig?.displayMax ?? 100}
                    step={1}
                    onValueChange={([newDisplayValue]) => {
                      if (valueConfig && onValueChange) {
                        const actualValue = valueConfig.toActualValue(newDisplayValue);
                        onValueChange(actualValue);
                      }
                    }}
                    onValueCommit={onSliderComplete}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 