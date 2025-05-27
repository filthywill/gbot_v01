import React from 'react';

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
 * Modal displayed when email verification fails
 * Shows the error message and provides guidance on next steps
 */
export function VerificationErrorModal({
  isOpen,
  errorMessage,
  onClose
}: VerificationErrorModalProps) {
  if (!isOpen || !errorMessage) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h2 className="text-xl font-bold text-status-error mb-4">Verification Failed</h2>
        <p className="text-brand-neutral-700 mb-4">{errorMessage}</p>
        <p className="text-brand-neutral-700 mb-4">Please try signing in directly or contact support for assistance.</p>
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary-600 text-white rounded hover:bg-brand-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificationErrorModal; 