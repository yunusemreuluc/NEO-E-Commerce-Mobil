import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationPress = async (notification: any) => {
    // Önce okundu işaretle
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Metadata varsa ve ürün bilgisi varsa ürün sayfasına git
    if (notification.metadata) {
      try {
        // Metadata'yı parse et
        let metadata = notification.metadata;
        if (typeof metadata === 'string') {
          metadata = JSON.parse(metadata);
        }
        
        // Ürün ID varsa ürün sayfasına git
        if (metadata.product_id) {
          router.push({
            pathname: '/product' as any,
            params: {
              id: metadata.product_id.toString(),
              name: metadata.product_name || 'Ürün',
              price: '0',
              image: 'https://via.placeholder.com/600x400.png?text=NEO',
              category: 'Genel'
            },
          });
        }
      } catch (error) {
        // Metadata parse hatası - sessizce devam et
      }
    }
  };

  const handleDeleteNotification = async (id: number) => {
    await deleteNotification(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Az önce';
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_deleted':
        return 'trash-outline';
      case 'order_status':
        return 'bag-outline';
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    // Metadata'yı parse et
    let metadata = null;
    try {
      metadata = typeof item.metadata === 'string' 
        ? JSON.parse(item.metadata) 
        : item.metadata;
    } catch (error) {
      // Metadata parse edilemezse null bırak
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIconContainer}>
              <Ionicons
                name={getNotificationIcon(item.type) as any}
                size={20}
                color={!item.is_read ? '#FF3B30' : '#6B7280'}
              />
            </View>
            <View style={styles.notificationText}>
              <Text style={[
                styles.notificationTitle,
                !item.is_read && styles.unreadTitle,
              ]}>
                {item.title}
              </Text>
              
              {/* Ürün bilgisi varsa göster */}
              {metadata?.product_name && (
                <View style={styles.productInfo}>
                  <Ionicons name="cube-outline" size={14} color="#6B7280" />
                  <Text style={styles.productName}>{metadata.product_name}</Text>
                  {metadata.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={12} color="#FCD34D" />
                      <Text style={styles.ratingText}>{metadata.rating}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Yorum metni varsa göster */}
              {metadata?.user_comment && (
                <Text style={styles.commentPreview}>
                  "{metadata.user_comment}..."
                </Text>
              )}
              
              <Text style={styles.notificationMessage}>
                {item.message}
              </Text>
              
              <View style={styles.notificationFooter}>
                <Text style={styles.notificationTime}>
                  {formatDate(item.created_at)}
                </Text>
                {metadata?.product_id && (
                  <Text style={styles.tapHint}>Ürüne gitmek için tıklayın</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNotification(item.id)}
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bildirim Sayısı */}
      {notifications.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {notifications.length} bildirim • {unreadCount} okunmamış
          </Text>
        </View>
      )}

      {/* Bildirimler Listesi */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              tintColor="#FF3B30"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
              <Text style={styles.emptySubtitle}>
                Yeni bildirimler burada görünecek
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 16,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  commentPreview: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    padding: 6,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});