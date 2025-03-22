import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50",
          // Size variants
          {
            "h-9 px-4 py-2 text-sm": size === "default",
            "h-7 px-3 py-1 text-xs": size === "sm",
            "h-10 px-8 py-2 text-base": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          // Style variants
          {
            "bg-purple-500 text-white hover:bg-purple-600": variant === "default",
            "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
            "border border-gray-300 bg-white hover:bg-gray-100 text-gray-900": variant === "outline",
            "bg-gray-200 text-gray-900 hover:bg-gray-300": variant === "secondary",
            "hover:bg-gray-100 hover:text-gray-900": variant === "ghost",
            "text-purple-500 underline-offset-4 hover:underline": variant === "link",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button }; 