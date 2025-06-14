import * as React from 'react';
import { Root, Track, Range, Thumb } from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ValueSliderProps extends React.ComponentPropsWithoutRef<typeof Root> {
  formatValue?: (value: number) => string;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: () => void;
}

const ValueSlider = React.forwardRef<
  React.ElementRef<typeof Root>,
  ValueSliderProps
>(({ className, formatValue = (v) => Math.round(v).toString(), onValueCommit, ...props }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [displayValue, setDisplayValue] = useState(props.value?.[0] ?? 0);
  const lastValueRef = useRef(props.value?.[0] ?? 0);
  const lastMoveTimeRef = useRef(Date.now());
  const checkMovementTimer = useRef<number | null>(null);
  const valueUpdateTimer = useRef<number | null>(null);

  // Debounced value update for smoother text display
  useEffect(() => {
    const currentValue = props.value?.[0] ?? 0;
    
    if (valueUpdateTimer.current) {
      window.clearTimeout(valueUpdateTimer.current);
    }

    valueUpdateTimer.current = window.setTimeout(() => {
      setDisplayValue(currentValue);
    }, isDragging ? 32 : 0); // One frame delay while dragging, immediate otherwise

    return () => {
      if (valueUpdateTimer.current) {
        window.clearTimeout(valueUpdateTimer.current);
      }
    };
  }, [props.value, isDragging]);

  // Setup movement check interval when dragging starts
  useEffect(() => {
    if (isDragging) {
      // Use requestAnimationFrame instead of setInterval for smoother animation
      let rafId: number;
      let lastCheck = Date.now();

      const checkMovement = () => {
        const currentTime = Date.now();
        if (currentTime - lastMoveTimeRef.current > 50) {
          setDragDirection(null);
        }
        lastCheck = currentTime;
        rafId = requestAnimationFrame(checkMovement);
      };

      rafId = requestAnimationFrame(checkMovement);

      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [isDragging]);
  
  // Track value changes to determine drag direction
  useEffect(() => {
    const currentValue = props.value?.[0] ?? 0;
    if (isDragging && currentValue !== lastValueRef.current) {
      setDragDirection(currentValue > lastValueRef.current ? 'right' : 'left');
      lastMoveTimeRef.current = Date.now();
    }
    lastValueRef.current = currentValue;
  }, [props.value, isDragging]);

  const handleDragStart = () => {
    setIsDragging(true);
    lastMoveTimeRef.current = Date.now();
  };
  
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragDirection(null);
      if (onValueCommit) {
        onValueCommit();
      }
    }
  };

  // Memoize transform calculation to reduce unnecessary recalculations
  const getThumbTransform = useCallback(() => {
    const transforms = [];
    
    // Add transforms in specific order for smooth animation
    if (dragDirection) {
      // Skew effect (first to maintain bottom edge)
      const skewAngle = dragDirection === 'right' ? 15 : -15;
      transforms.push(`skewX(${skewAngle}deg)`);
      
      // Horizontal scale compression (second)
      const scaleX = dragDirection === 'right' ? 0.95 : 1.05;
      transforms.push(`scaleX(${scaleX})`);
    }
    
    // Vertical scale is always last to maintain bottom alignment
    if (isDragging) {
      transforms.push('scaleY(1.15)');
    }
    
    return transforms.join(' ');
  }, [dragDirection, isDragging]);

  return (
    <Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center rounded-full",
        className
      )}
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      {...props}
    >
      <Track
        className="relative h-1.5 w-full grow overflow-hidden rounded-full translate-z-0 slider-control-track"
      >
        <Range className="absolute h-full rounded-full slider-control-active" />
      </Track>
      {props.value?.map((value, index) => (
        <Thumb
          key={index}
          className={cn(
            "relative block h-[16px] w-[32px] rounded-t-full slider-control-thumb",
            "transition-transform duration-100 ease-out will-change-transform",
            "outline-none border-0 ring-0",
            "focus:outline-none focus:ring-0 focus:border-0",
            "active:outline-none active:ring-0 active:border-0",
            "hover:scale-y-[1.15]",
            "origin-bottom -mt-[10px] tap-highlight-none",
            "translate-z-0 backface-visibility-hidden"
          )}
          style={{
            transform: getThumbTransform(),
            contain: 'layout style paint'
          }}
        >
          <span className={cn(
            "ui-value absolute inset-0 flex items-center justify-center text-[11px] slider-control-text mt-[2px] select-none",
            "transition-transform duration-75 ease-out will-change-transform",
            "translate-z-0 backface-visibility-hidden",
            dragDirection && "scale-[0.98]"
          )}>
            {formatValue(displayValue)}
          </span>
        </Thumb>
      ))}
    </Root>
  );
});

ValueSlider.displayName = "ValueSlider";

export { ValueSlider }; 