import React from 'react';
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
 * Modal displayed when email verification is successful
 * Provides feedback to the user and handles state cleanup
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Email Verified!</h2>
        </div>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Your account has been verified successfully</p>
          <p className="mt-1">You are now signed in and can start using the application.</p>
        </div>
        
        <button
          onClick={handleClose}
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white
            bg-brand-gradient
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500
            transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
        >
          Continue to App
        </button>
      </div>
    </div>
  );
}

export default VerificationSuccessModal; 