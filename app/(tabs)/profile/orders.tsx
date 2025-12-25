// app/(tabs)/profile/orders.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../contexts/AuthContext';
import { useOrder } from '../../../contexts/OrderContext';
import { Order } from '../../../types/Order';

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return '#FF9500';
    case 'confirmed': return '#007AFF';
    case 'processing': return '#5856D6';
    case 'shipped': return '#32D74B';
    case 'delivered': return '#28a745';
    case 'cancelled': return '#FF3B30';
    default: return '#8E8E93';
  }
};

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'Beklemede';
    case 'confirmed': return 'Onaylandı';
    case 'processing': return 'Hazırlanıyor';
    case 'shipped': return 'Kargoda';
    case 'delivered': return 'Teslim Edildi';
    case 'cancelled': return 'İptal Edildi';
    default: return status;
  }
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const { orders, ordersLoading, ordersError, loadOrders, cancelOrder } = useOrder();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/order-detail/${order.id}`);
  };

  const handleCancelOrder = (order: Order) => {
    Alert.alert(
      'Siparişi İptal Et',
      `${order.order_number} numaralı siparişi iptal etmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(order.id);
              Alert.alert('Başarılı', 'Sipariş başarıyla iptal edildi');
            } catch (error) {
              Alert.alert('Hata', error instanceof Error ? error.message : 'Sipariş iptal edilirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    // Backend'ten gelen ürün bilgilerini kullan
    const firstProductImage = order.first_product_image;
    const firstProductName = order.first_product_name || 'Ürün';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.95}
      >
        {/* Ana İçerik */}
        <View style={styles.cardContent}>
          {/* Sol Taraf - Ürün Görseli */}
          <View style={styles.productSection}>
            <View style={styles.productImageWrapper}>
              {firstProductImage ? (
                <Image
                  source={{ uri: firstProductImage }}
                  style={styles.productImageLarge}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImageLarge}>
                  <Ionicons name="cube-outline" size={32} color="#CCCCCC" />
                </View>
              )}
              
              {/* Ürün Sayısı Badge */}
              {(order.item_count || 0) > 1 && (
                <View style={styles.productCountBadge}>
                  <Text style={styles.productCountText}>{order.item_count}</Text>
                </View>
              )}
            </View>
            
            {/* Ürün Bilgisi */}
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2}>
                {firstProductName}
              </Text>
              {(order.item_count || 0) > 1 && (
                <Text style={styles.moreProducts}>
                  +{(order.item_count || 1) - 1} ürün daha
                </Text>
              )}
            </View>
          </View>

          {/* Sağ Taraf - Fiyat ve İşlemler */}
          <View style={styles.actionSection}>
            <View style={styles.priceSection}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalPrice}>₺{Number(order.total_amount || 0).toFixed(2)}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              {['pending', 'confirmed'].includes(order.status) && (
                <TouchableOpacity
                  style={styles.cancelButtonNew}
                  onPress={() => handleCancelOrder(order)}
                >
                  <Ionicons name="close" size={16} color="#FF3B30" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.detailButtonNew}>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Alt Kısım - İlerleme Çubuğu */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: getProgressWidth(order.status),
                  backgroundColor: getStatusColor(order.status)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {getProgressText(order.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Yardımcı fonksiyonlar
  const getProgressWidth = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '20%';
      case 'confirmed': return '40%';
      case 'processing': return '60%';
      case 'shipped': return '80%';
      case 'delivered': return '100%';
      case 'cancelled': return '0%';
      default: return '20%';
    }
  };

  const getProgressText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Sipariş alındı';
      case 'confirmed': return 'Sipariş onaylandı';
      case 'processing': return 'Hazırlanıyor';
      case 'shipped': return 'Kargoya verildi';
      case 'delivered': return 'Teslim edildi';
      case 'cancelled': return 'İptal edildi';
      default: return 'Durum bilinmiyor';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bag-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>Henüz siparişiniz yok</Text>
      <Text style={styles.emptySubtitle}>
        Alışverişe başlayın ve siparişlerinizi burada takip edin
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-outline" size={64} color="#CCCCCC" />
          <Text style={styles.loginTitle}>Giriş Yapın</Text>
          <Text style={styles.loginSubtitle}>
            Siparişlerinizi görmek için giriş yapmanız gerekiyor
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Siparişlerim</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {ordersError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{ordersError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          orders.length === 0 && styles.emptyContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={!ordersLoading && !ordersError ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productSection: {
    flex: 1,
    flexDirection: 'row',
  },
  productImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  productImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  placeholderImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  productCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  productCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 4,
  },
  moreProducts: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  actionSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  priceSection: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonNew: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonNew: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#E0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FAFBFC',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});