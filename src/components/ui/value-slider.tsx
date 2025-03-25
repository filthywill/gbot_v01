import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ValueSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  formatValue?: (value: number) => string;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: () => void;
}

const ValueSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ValueSliderProps
>(({ className, formatValue = (v) => Math.round(v).toString(), onValueCommit, ...props }, ref) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    if (isDragging && onValueCommit) {
      setIsDragging(false);
      onValueCommit();
    }
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      onPointerDown={handleDragStart}
      onPointerUp={handleDragEnd}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-purple-400/20"
      >
        <SliderPrimitive.Range className="absolute h-full bg-purple-400/60" />
      </SliderPrimitive.Track>
      {props.value?.map((value, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="relative block h-[19px] w-[28px] rounded-[20%] bg-zinc-300 border-[2px] border-zinc-700/95 shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-zinc-200"
        >
          <span className="ui-value absolute inset-0 flex items-center justify-center text-[10px] text-zinc-700">
            {formatValue(value)}
          </span>
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});

ValueSlider.displayName = "ValueSlider";

export { ValueSlider }; 