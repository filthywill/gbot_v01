import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem('skipProjectDeleteConfirmation', 'true');
    }
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    setDontShowAgain(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-6 text-center">
          {/* Warning Icon - Matching auth modal pattern */}
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          {/* Title - Matching auth modal typography */}
          <h2 className="text-xl font-semibold text-brand-neutral-900 mb-2">
            Delete Project
          </h2>
          
          {/* Description - Matching auth modal styling */}
          <p className="text-brand-neutral-600 mb-4">
            Are you sure you want to delete "{projectName}"?
          </p>
          
          <p className="text-sm text-brand-neutral-500 mb-6">
            This action cannot be undone.
          </p>
          
          {/* Checkbox with consistent styling */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <input
              id="dont-show-again"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-brand-primary-600 bg-white border-brand-neutral-300 rounded focus:ring-brand-primary-500 focus:ring-2"
            />
            <label htmlFor="dont-show-again" className="text-sm text-brand-neutral-600">
              Don't show this confirmation again
            </label>
          </div>
          
          {/* Button Container - Matching auth modal layout */}
          <div className="space-y-3">
            {/* Delete Button - Primary destructive action */}
            <button
              onClick={handleConfirm}
              className={cn(
                "w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm",
                "text-sm font-medium text-white bg-red-600 hover:bg-red-700",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
                "transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
            
            {/* Cancel Button - Secondary action */}
            <button
              onClick={handleClose}
              className={cn(
                "w-full flex justify-center py-3 px-4 border border-brand-neutral-300 rounded-md shadow-sm",
                "text-sm font-medium text-brand-neutral-700 bg-white hover:bg-brand-neutral-50",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary-500",
                "transition-all duration-200 ease-in-out"
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(DeleteProjectModal); 