import * as React from "react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ 
  open = false, 
  onOpenChange, 
  children 
}) => {
  const handleBackdropClick = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      {/* Dialog container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {children}
      </div>
    </>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ 
  className, 
  children 
}) => {
  // Prevent click propagation to the backdrop
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-lg max-w-md w-full p-4 mx-4 animate-in fade-in duration-200",
        className
      )}
      onClick={handleContentClick}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ 
  className, 
  children 
}) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
};

export const DialogFooter: React.FC<DialogFooterProps> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={cn("mt-4 flex justify-end gap-2", className)}>
      {children}
    </div>
  );
}; 