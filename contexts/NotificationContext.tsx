import React, { createContext, useContext, useEffect, useState } from 'react';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata?: {
    product_id?: number;
    product_name?: string;
    review_id?: number;
    user_comment?: string;
    rating?: number;
    reason?: string;
  };
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Bildirimleri getir
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Geçici olarak token olmadan test et
      const response = await fetch('http://10.8.0.222:4000/notifications', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Bildirim getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`http://10.8.0.222:4000/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
      }
    } catch (error) {
      console.error('Bildirim okundu işaretleme hatası:', error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://10.8.0.222:4000/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretleme hatası:', error);
    }
  };

  // Bildirimi sil
  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`http://10.8.0.222:4000/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Bildirim silme hatası:', error);
    }
  };

  // Sayfa yüklendiğinde bildirimleri getir (sadece bir kez)
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};