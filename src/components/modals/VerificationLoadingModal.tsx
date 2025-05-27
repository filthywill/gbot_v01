import React from 'react';

/**
 * Props for the VerificationLoadingModal component
 */
interface VerificationLoadingModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
}

/**
 * Modal displayed when email verification is in progress
 * Shows a loading indicator and message to the user
 */
export function VerificationLoadingModal({
  isOpen
}: VerificationLoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-brand-neutral-800 mb-2">Verifying Your Email</h2>
        <p className="text-brand-neutral-600">Please wait while we verify your email address...</p>
      </div>
    </div>
  );
}

export default VerificationLoadingModal; 