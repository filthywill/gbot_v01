import React, { useState, useEffect, ReactNode } from 'react';
import { Switch } from '../ui/switch';
import { FaChevronCircleUp, FaChevronCircleDown } from "react-icons/fa";
import { cn } from '../../lib/utils';

/**
 * Common props for all control components
 */
export interface ControlContainerProps {
  /** Label displayed next to the control */
  label: string;
  
  /** Whether this control has a toggle switch */
  hasToggle?: boolean;
  
  /** Current toggle state */
  enabled?: boolean;
  
  /** Callback when toggle state changes */
  onToggle?: (enabled: boolean) => void;
  
  /** Whether this control can be collapsed/expanded */
  isCollapsible?: boolean;
  
  /** Content to render on the right side of the header */
  headerRightContent?: ReactNode;
  
  /** Content to render in the expandable section */
  children?: ReactNode;
  
  /** Height of the content area when expanded (e.g., "h-[14px]", "h-[38px]") */
  contentHeight?: string;
  
  /** Additional classes for the container */
  className?: string;
}

/**
 * A standardized container component for all control items.
 * Handles layout, toggle functionality, and collapse/expand behavior.
 */
export const ControlContainer: React.FC<ControlContainerProps> = ({
  label,
  hasToggle = false,
  enabled = false,
  onToggle,
  isCollapsible = true,
  headerRightContent,
  children,
  contentHeight = "h-[14px]",
  className
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
      children ? "pt-1 px-1.5" : "py-1 px-1.5",
      isContentVisible && children ? "pb-1" : "pb-0.5 pt-0.5",
      className
    )}>
      {/* Header row with label and toggle */}
      <div className="flex items-center justify-between gap-1.5 min-h-[28px]">
        <div className="flex items-center">
          {hasToggle ? (
            <div className="w-9 h-6 flex items-center justify-start">
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          ) : (
            <div className="pl-1.5"></div>
          )}
          
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-zinc-200 leading-none">
              {label}
            </span>
            {isCollapsible && children && (
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
      {children && (
        <div className="overflow-visible">
          <div 
            className={cn(
              "transition-all duration-150 ease-in-out",
              !isContentVisible ? "h-0 opacity-0 -translate-y-2 -mb-px" : `${contentHeight} opacity-100 translate-y-0`
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}; 