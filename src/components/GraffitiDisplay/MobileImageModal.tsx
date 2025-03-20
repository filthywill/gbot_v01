import React, { useEffect, useRef } from 'react';

interface MobileImageModalProps {
  imageDataUrl: string;
  onClose: () => void;
  onSave: () => void;
  title?: string;
}

/**
 * A modal component for displaying and saving images on mobile devices
 */
const MobileImageModal: React.FC<MobileImageModalProps> = ({
  imageDataUrl,
  onClose,
  onSave,
  title = 'Graffiti Image'
}) => {
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus the save button when the modal opens
  useEffect(() => {
    setTimeout(() => {
      if (saveButtonRef.current) {
        saveButtonRef.current.focus();
      }
    }, 50);
    
    // Add keyboard event listener for accessibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Handle click outside to close
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };
  
  // Detect iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Hidden title for screen readers */}
      <h2 id="modal-title" className="sr-only">
        {title}
      </h2>
      
      {/* Image container */}
      <div 
        className="relative max-w-[90%] max-h-[70%] flex items-center justify-center p-2.5 rounded-lg"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          transform: 'scale(1)',
          transition: 'transform 0.25s ease-out',
        }}
      >
        <img
          src={imageDataUrl}
          alt="Graffiti artwork"
          className="max-w-full max-h-full object-contain"
          style={{
            display: 'block',
            touchAction: 'none',
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      
      {/* Button container */}
      <div 
        className="flex justify-center gap-2.5 mt-5 w-full max-w-[90%] px-2.5"
        style={{
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
        {/* Save button */}
        <button
          ref={saveButtonRef}
          onClick={onSave}
          className="py-2.5 px-4 bg-blue-500 text-white border-none rounded text-base cursor-pointer flex-grow max-w-[200px]"
          style={{
            backgroundColor: '#4a90e2',
            transition: 'transform 0.15s ease-out, background-color 0.15s ease-out',
            fontWeight: isIOS ? 600 : 400,
          }}
          role="button"
          aria-label="Save image to device"
        >
          Save Image
        </button>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="py-2.5 px-4 bg-gray-500 text-white border-none rounded text-base cursor-pointer flex-grow max-w-[200px]"
          style={{
            backgroundColor: '#6c757d',
            transition: 'transform 0.15s ease-out, background-color 0.15s ease-out',
            fontWeight: isIOS ? 600 : 400,
          }}
          role="button"
          aria-label="Close dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MobileImageModal; 