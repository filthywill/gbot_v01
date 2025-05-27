import React, { useEffect, useState, useCallback, memo } from 'react';
import useNotificationStore, { NotificationType, Notification } from '../../store/useNotificationStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Simple timeout utility function
const createTimeout = (callback: () => void, ms: number) => {
  const timeout = setTimeout(callback, ms);
  return () => clearTimeout(timeout);
};

// Notification icon component
const NotificationIcon = memo(({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'info':
      return <Info className="w-5 h-5" />;
  }
});

// Style classes for notifications
const getNotificationClasses = (type: NotificationType) => {
  const baseClasses = 'p-4 rounded-md shadow-lg flex items-start border transition-all duration-300 hover:shadow-xl will-change-transform';
  switch (type) {
    case 'success':
      return `${baseClasses} bg-status-success-light border-status-success text-status-success`;
    case 'error':
      return `${baseClasses} bg-status-error-light border-status-error text-status-error`;
    case 'warning':
      return `${baseClasses} bg-status-warning-light border-status-warning text-status-warning`;
    case 'info':
      return `${baseClasses} bg-status-info-light border-status-info text-status-info`;
  }
};

// Single notification item component
const NotificationItem = memo(({ 
  notification,
  onRemove
}: { 
  notification: Notification;
  onRemove: (id: string) => void;
}) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Set visible after a small delay for enter animation
  useEffect(() => {
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(enterTimeout);
  }, []);
  
  // Handle notification removal
  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    const leaveTimeout = setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Animation duration
    
    return () => clearTimeout(leaveTimeout);
  }, [notification.id, onRemove]);
  
  // Auto-dismiss if configured
  useEffect(() => {
    if (notification.autoDismiss) {
      return createTimeout(handleRemove, notification.duration || 5000);
    }
  }, [notification, handleRemove]);
  
  return (
    <div 
      className={`${getNotificationClasses(notification.type)} ${
        isLeaving ? 'opacity-0 translate-y-2' : 
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      style={{ 
        transition: 'all 0.3s ease',
      }}
      role="alert"
    >
      <div className="mr-2 flex-shrink-0">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 mr-2">
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="text-current hover:text-current/80 flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

// Main Notifications container component
const Notifications = () => {
  const { notifications, removeNotification, clearExpiredNotifications } = useNotificationStore();
  
  // Clear expired notifications on mount and visibility change
  useEffect(() => {
    // Clear expired notifications on initial load
    clearExpiredNotifications();
    
    // Setup visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearExpiredNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearExpiredNotifications]);
  
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md transition-all duration-300"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

export default memo(Notifications); 