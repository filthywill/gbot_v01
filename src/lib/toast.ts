import logger from './logger';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  type?: ToastType;
}

// Function to create and show a toast message
export const showToast = (message: string, options: ToastOptions = {}) => {
  const {
    duration = 3000,
    type = 'info'
  } = options;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed z-50 bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out max-w-md
    ${type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-blue-500 text-white'}`;
  
  // Set initial styles for animation
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  
  // Add message
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (document.body.contains(toast)) {
      document.body.removeChild(toast);
      }
    }, 300);
  }, duration);

  // Log the message
  logger.info('Toast shown:', { message, type });
};

// Convenience methods
export const showError = (message: string, duration?: number) => 
  showToast(message, { type: 'error', ...(duration !== undefined && { duration }) });

export const showWarning = (message: string, duration?: number) => 
  showToast(message, { type: 'warning', ...(duration !== undefined && { duration }) });

export const showSuccess = (message: string, duration?: number) => 
  showToast(message, { type: 'success', ...(duration !== undefined && { duration }) });

export const showInfo = (message: string, duration?: number) => 
  showToast(message, { type: 'info', ...(duration !== undefined && { duration }) }); 