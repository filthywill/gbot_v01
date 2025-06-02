import * as React from "react"
import { Root, Thumb } from "@radix-ui/react-switch"
import { cn } from "../../utils/cn"

const Switch = React.forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
  <Root
    className={cn(
      "peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary-300 focus-visible:ring-offset-1",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-brand-primary-600 data-[state=unchecked]:bg-control-hover",
      className
    )}
    {...props}
    ref={ref}
  >
    <Thumb
      className={cn(
        "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm ring-0",
        "transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0"
      )}
    />
  </Root>
))
Switch.displayName = Root.displayName

export { Switch } 