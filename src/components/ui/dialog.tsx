import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
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
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only trigger if the click was directly on the backdrop element
    if (e.target === e.currentTarget && onOpenChange) {
      onOpenChange(false);
      // Stop propagation to prevent further click handling
      e.stopPropagation();
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
      {/* Dialog container - don't close when clicking this container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
    </>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ 
  className, 
  children,
  onClose,
  showCloseButton = true
}) => {
  // Prevent clicks inside the content from closing the modal
  const handleContentClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent the backdrop's click handler from firing
    e.stopPropagation();
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-lg max-w-md w-full p-4 mx-4 animate-in fade-in duration-200 relative",
        className
      )}
      onClick={handleContentClick}
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-neutral-500 hover:text-brand-neutral-700 transition-colors"
          aria-label="Close dialog"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      )}
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