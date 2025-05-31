import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { cn } from '../../lib/utils';

/**
 * Props for the VerificationErrorModal component
 */
interface VerificationErrorModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** The error message to display */
  errorMessage: string | null;
  /** Function to call when the modal should close */
  onClose: () => void;
}

/**
 * VerificationErrorModal - Shows when email verification fails
 * Memoized to prevent unnecessary re-renders when app state changes
 */
export function VerificationErrorModal({
  isOpen,
  errorMessage,
  onClose
}: VerificationErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-brand-neutral-900 mb-2">
            Verification Failed
          </h2>
          
          <p className="text-brand-neutral-600 mb-2">
            We couldn't verify your email address.
          </p>
          
          {errorMessage && (
            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-md">
              {errorMessage}
            </p>
          )}
          
          <button
            onClick={onClose}
            className={cn(
              "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm",
              "text-sm font-medium text-white bg-red-600 hover:bg-red-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
              "transition-all duration-200 ease-in-out"
            )}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(VerificationErrorModal); 