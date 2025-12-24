// app/order-detail/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOrder } from '../../contexts/OrderContext';
import { Order, OrderItem, OrderPayment, OrderStatusHistory } from '../../types/Order';

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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderDetail, cancelOrder } = useOrder();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getOrderDetail(parseInt(id));
      setOrder(result.order);
      setItems(result.items);
      setPayments(result.payments);
      setStatusHistory(result.status_history);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sipariş detayı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

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
              Alert.alert('Başarılı', 'Sipariş başarıyla iptal edildi', [
                { text: 'Tamam', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Hata', error instanceof Error ? error.message : 'Sipariş iptal edilirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Sipariş bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOrderDetail}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Sipariş Detayı</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sipariş Bilgileri */}
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>#{order.order_number}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>

          {/* İptal Butonu */}
          {['pending', 'confirmed'].includes(order.status) && (
            <TouchableOpacity style={styles.cancelOrderButton} onPress={handleCancelOrder}>
              <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
              <Text style={styles.cancelOrderText}>Siparişi İptal Et</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sipariş Durumu Takibi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Takibi</Text>
          <View style={styles.statusTimeline}>
            {statusHistory.map((status, index) => (
              <View key={status.id} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View style={[
                    styles.timelineDot,
                    { backgroundColor: getStatusColor(status.status) }
                  ]} />
                  {index < statusHistory.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{getStatusText(status.status)}</Text>
                  <Text style={styles.timelineDate}>
                    {new Date(status.created_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  {status.notes && (
                    <Text style={styles.timelineNotes}>{status.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Ürünler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürünler</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.productItem}>
              <Image
                source={{ uri: item.product_image || 'https://via.placeholder.com/60' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text style={styles.productPrice}>₺{Number(item.unit_price || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.productQuantity}>
                <Text style={styles.quantityText}>{item.quantity} adet</Text>
                <Text style={styles.totalPrice}>₺{Number(item.total_price || 0).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ödeme Bilgileri */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentInfo}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Ödeme Yöntemi</Text>
                  <Text style={styles.paymentValue}>
                    {payment.card_brand?.toUpperCase()} **** {payment.card_last4}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Tutar</Text>
                  <Text style={styles.paymentValue}>₺{Number(payment.amount || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Durum</Text>
                  <Text style={[
                    styles.paymentValue,
                    { color: payment.payment_status === 'completed' ? '#28a745' : '#FF9500' }
                  ]}>
                    {payment.payment_status === 'completed' ? 'Ödendi' : 'Beklemede'}
                  </Text>
                </View>
                {payment.transaction_id && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>İşlem No</Text>
                    <Text style={styles.paymentValue}>{payment.transaction_id}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Fiyat Özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiyat Özeti</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Ara Toplam</Text>
              <Text style={styles.priceValue}>₺{Number(order.subtotal || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Kargo</Text>
              <Text style={styles.priceValue}>₺{Number(order.shipping_cost || 0).toFixed(2)}</Text>
            </View>
            {Number(order.discount_amount || 0) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>İndirim</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -₺{Number(order.discount_amount || 0).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>₺{Number(order.total_amount || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Teslimat Adresi */}
        {order.shipping_address_snapshot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
            <View style={styles.addressInfo}>
              {(() => {
                try {
                  const address = JSON.parse(order.shipping_address_snapshot);
                  return (
                    <>
                      <Text style={styles.addressTitle}>{address.title}</Text>
                      <Text style={styles.addressName}>{address.full_name}</Text>
                      <Text style={styles.addressPhone}>{address.phone}</Text>
                      <Text style={styles.addressText}>
                        {address.address_line}
                      </Text>
                      <Text style={styles.addressLocation}>
                        {address.district}, {address.city}
                      </Text>
                    </>
                  );
                } catch {
                  return <Text style={styles.addressText}>Adres bilgisi mevcut değil</Text>;
                }
              })()}
            </View>
          </View>
        )}
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cancelOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  cancelOrderText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  statusTimeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timelineDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timelineNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  productQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  priceBreakdown: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
  },
  discountValue: {
    color: '#28a745',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  addressLocation: {
    fontSize: 14,
    color: '#666',
  },
});