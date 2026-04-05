import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Welcome!', message: 'Your wallet is ready to use.', time: new Date(), read: false, type: 'info' },
    { id: 2, title: 'KYC Reminder', message: 'Complete your KYC to unlock all features.', time: new Date(Date.now() - 3600000), read: false, type: 'warning' },
  ]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    setNotifications((prev) => [{ id: Date.now(), time: new Date(), read: false, ...notif }, ...prev]);
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markRead, markAllRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
};
