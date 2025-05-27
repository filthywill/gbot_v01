import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Maximum number of notifications to show at once
const MAX_NOTIFICATIONS = 5;

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  autoDismiss?: boolean;
  duration?: number;
  createdAt: number; // Timestamp for tracking notification age
  isPersistent?: boolean; // Whether this notification should persist across page navigations
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  clearExpiredNotifications: () => void; // New method to clear outdated notifications
}

// Create store with persistence
const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNotification = {
          ...notification,
          id,
          createdAt: Date.now(),
          autoDismiss: notification.autoDismiss !== false,
          duration: notification.duration || 5000, // default 5 seconds
          isPersistent: notification.isPersistent || false,
        };
        
        set((state) => {
          // Get current notifications
          let updatedNotifications = [...state.notifications, newNotification];
          
          // If we have more than the maximum allowed, remove the oldest non-persistent ones first
          if (updatedNotifications.length > MAX_NOTIFICATIONS) {
            const nonPersistentNotifications = updatedNotifications
              .filter(n => !n.isPersistent)
              .sort((a, b) => a.createdAt - b.createdAt);
              
            // If we have non-persistent notifications, remove the oldest ones
            if (nonPersistentNotifications.length > 0) {
              const oldestNonPersistentId = nonPersistentNotifications[0].id;
              updatedNotifications = updatedNotifications.filter(n => n.id !== oldestNonPersistentId);
            } else {
              // If all are persistent, remove the oldest notification regardless
              updatedNotifications.sort((a, b) => a.createdAt - b.createdAt);
              updatedNotifications = updatedNotifications.slice(1);
            }
          }
          
          return { notifications: updatedNotifications };
        });
        
        if (newNotification.autoDismiss) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, newNotification.duration);
        }
        
        return id;
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      // Clear notifications that are older than a certain time threshold (e.g., 5 minutes)
      clearExpiredNotifications: () => {
        const MAX_AGE = 5 * 60 * 1000; // 5 minutes in milliseconds
        const now = Date.now();
        
        set((state) => ({
          notifications: state.notifications.filter((notification) => {
            // Keep persistent notifications
            if (notification.isPersistent) return true;
            
            // Filter out old notifications
            return now - notification.createdAt < MAX_AGE;
          }),
        }));
      },
    }),
    {
      name: 'notification-store', // Name for localStorage
      partialize: (state) => ({ 
        // Only persist specific notifications that should survive page reloads
        notifications: state.notifications.filter(n => n.isPersistent) 
      }),
    }
  )
);

export default useNotificationStore; 