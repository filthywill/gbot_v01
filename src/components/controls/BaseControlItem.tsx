import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { cn } from '../../lib/utils';

/**
 * BaseControlItem is the foundation component for all control UI in the application.
 * It provides a consistent structure with:
 * - Optional toggle switch functionality
 * - Optional collapsible/expandable sections
 * - Consistent styling and animations
 * - Flexible content rendering through slots
 * 
 * This component is designed to be extended by more specialized control components
 * like ModernControlItem and EffectControlItem.
 */
export interface BaseControlItemProps {
  // Base props
  /** Label displayed next to the control */
  label: string;
  
  // Feature flags
  /** Whether this control has a toggle switch */
  hasToggle?: boolean;
  /** Whether this control can be collapsed/expanded */
  isCollapsible?: boolean;
  
  // Toggle props
  /** Current enabled state of the toggle switch */
  enabled?: boolean;
  /** Callback when toggle state changes */
  onToggle?: (enabled: boolean) => void;
  
  // Rendering props
  /** Content to render on the right side of the header (e.g., color picker) */
  headerRightContent?: React.ReactNode;
  /** Content to render in the expandable section */
  contentSlot?: React.ReactNode;
  /** Height of the content area when expanded (e.g., "h-[14px]", "h-[38px]") */
  contentHeight?: string;
  /** Whether to add bottom padding when control is expanded */
  bottomPadding?: boolean;
}

/**
 * A flexible control container component that provides consistent UI structure
 * for all customization controls. It handles toggle state, collapse/expand behavior,
 * animations, and consistent styling.
 */
export const BaseControlItem: React.FC<BaseControlItemProps> = ({
  label,
  hasToggle = false,
  isCollapsible = true,
  enabled = false,
  onToggle,
  headerRightContent,
  contentSlot,
  contentHeight = "h-[14px]",
  bottomPadding = true
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  // Update content visibility based on both toggle state and expand state
  useEffect(() => {
    setIsContentVisible((!hasToggle || enabled) && isExpanded);
  }, [hasToggle, enabled, isExpanded]);

  return (
    <div className={cn(
      "bg-zinc-500/25 rounded-lg relative",
      contentSlot ? "pt-1 px-1.5" : "py-1.5 px-1.5", // Adjust vertical padding for controls without content
      isContentVisible && bottomPadding && contentSlot ? "pb-1" : "pb-0"
    )}>
      {/* Header row with label and toggle */}
      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
        <div className="flex items-center gap-1.5">
          {hasToggle && (
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-purple-600"
            />
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
        
        {headerRightContent}
      </div>

      {/* Content section */}
      {contentSlot && (
        <div className="overflow-visible">
          <div 
            className={cn(
              "transition-all duration-150 ease-in-out",
              !isContentVisible ? "h-0 opacity-0 -translate-y-2 -mb-px" : `${contentHeight} opacity-100 translate-y-0`
            )}
          >
            {contentSlot}
          </div>
        </div>
      )}
    </div>
  );
}; 