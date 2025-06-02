import * as React from "react"
import { Root, Trigger, Content } from "@radix-ui/react-collapsible"

import { cn } from "../../lib/utils"

const Collapsible = Root

const CollapsibleTrigger = Trigger

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
  <Content
    ref={ref}
    className={cn(
      "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden",
      className
    )}
    {...props}
  >
    {children}
  </Content>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent } 