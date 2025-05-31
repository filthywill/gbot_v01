import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { cn } from '../../lib/utils';
import { clearAllVerificationState } from '../../lib/auth/utils';
import logger from '../../lib/logger';

/**
 * Props for the VerificationSuccessModal component
 */
interface VerificationSuccessModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Function to call when the modal should close */
  onClose: () => void;
  /** Optional function to clear the verification email state */
  setVerificationEmail?: (email: null) => void;
  /** Optional function to update the pending verification state */
  setPendingVerification?: (pending: boolean) => void;
}

/**
 * VerificationSuccessModal - Shows when email verification is successful
 * Memoized to prevent unnecessary re-renders when app state changes
 */
export function VerificationSuccessModal({
  isOpen,
  onClose,
  setVerificationEmail,
  setPendingVerification
}: VerificationSuccessModalProps) {
  if (!isOpen) return null;

  /**
   * Handles the close action for the modal
   * Clears all verification state and calls the provided onClose callback
   */
  const handleClose = () => {
    // Clear all verification state when the success modal is closed
    setVerificationEmail?.(null);
    setPendingVerification?.(false);
    clearAllVerificationState();
    logger.info('Cleared all verification state after verification success');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-brand-neutral-900 mb-2">
            Email Verified!
          </h2>
          
          <p className="text-brand-neutral-600 mb-6">
            Your email has been successfully verified. You can now access all features.
          </p>
          
          <button
            onClick={handleClose}
            className={cn(
              "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm",
              "text-sm font-medium text-white bg-brand-gradient hover:bg-brand-gradient",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500",
              "transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
            )}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(VerificationSuccessModal); 