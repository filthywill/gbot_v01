import React from 'react';
import Notifications from './Notifications';

type NotificationProviderProps = {
  children: React.ReactNode;
};

/**
 * NotificationProvider renders the Notifications component and wraps the children
 * This ensures that notifications are visible across the entire application regardless of routing
 */
const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Notifications />
    </>
  );
};

export default NotificationProvider; 