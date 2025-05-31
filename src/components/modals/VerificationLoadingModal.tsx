import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

/**
 * Props for the VerificationLoadingModal component
 */
interface VerificationLoadingModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
}

/**
 * VerificationLoadingModal - Shows during email verification process
 * Memoized to prevent unnecessary re-renders when app state changes
 */
export function VerificationLoadingModal({
  isOpen
}: VerificationLoadingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin">
            <svg className="w-full h-full text-brand-primary-600" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-brand-neutral-900 mb-2">
            Verifying...
          </h2>
          
          <p className="text-brand-neutral-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(VerificationLoadingModal); 