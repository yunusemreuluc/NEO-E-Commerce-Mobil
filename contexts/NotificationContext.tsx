import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthHeaders } from '../api';
import { API_BASE_URL } from '../config/api';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Kullanıcı değiştiğinde bildirimleri temizle
  useEffect(() => {
    if (!user) {
      console.log('👤 NotificationContext: Kullanıcı çıkış yaptı, bildirimler temizleniyor');
      setNotifications([]);
    } else {
      console.log('👤 NotificationContext: Kullanıcı giriş yaptı, bildirimler yükleniyor:', user.name);
      fetchNotifications();
    }
  }, [user]);

  // Bildirimleri getir
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]); // Kullanıcı yoksa bildirimleri temizle
      return;
    }

    try {
      setLoading(true);
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      } else if (response.status === 401) {
        // Token geçersizse bildirimleri temizle
        setNotifications([]);
      }
    } catch (error) {
      console.error('Bildirim getirme hatası:', error);
      // Network hatası durumunda sessizce devam et
    } finally {
      setLoading(false);
    }
  };

  // Bildirimi okundu olarak işaretle
  const markAsRead = async (id: number) => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers
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
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers
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
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Bildirim silme hatası:', error);
    }
  };

  // Sayfa yüklendiğinde bildirimleri getir (sadece bir kez)
  // useEffect kaldırıldı - artık kullanıcı değişikliğinde otomatik yükleniyor

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
