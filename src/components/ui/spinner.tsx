import * as React from "react";
import { cn } from "../../lib/utils";

export interface SpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  centered?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "default", className, centered = false }) => {
  return (
    <div className={cn(
      "flex items-center justify-center",
      centered && "w-full h-full min-h-[200px]",
      className
    )}>
      <div className={cn(
        "animate-spin rounded-full border-t-transparent border-solid",
        {
          "w-4 h-4 border-2": size === "sm",
          "w-8 h-8 border-2": size === "default",
          "w-12 h-12 border-3": size === "lg",
        },
        "border-brand-primary-500"
      )} />
    </div>
  );
};

export default Spinner; 