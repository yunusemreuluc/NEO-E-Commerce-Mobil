// app/checkout.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { AddressForm } from '../components/AddressForm';
import { PaymentMethodForm } from '../components/PaymentMethodForm';
import { useAddress } from '../contexts/AddressContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { Address } from '../types/Address';
import { PaymentMethod } from '../types/Order';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const { addresses, loadAddresses } = useAddress();
  const { paymentMethods, loadPaymentMethods, createOrder } = useOrder();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = getTotalPrice();
  const shippingCost = 15.00; // Sabit kargo ücreti
  const discountAmount = 0;
  const totalAmount = subtotal + shippingCost - discountAmount;

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    loadAddresses();
    loadPaymentMethods();
  }, [user]);

  useEffect(() => {
    // Varsayılan adres seç
    const defaultAddress = addresses?.find(addr => addr.is_default);
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [addresses]);

  useEffect(() => {
    // Varsayılan ödeme yöntemi seç
    const defaultPayment = paymentMethods?.find(pm => pm.is_default);
    if (defaultPayment && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultPayment);
    }
  }, [paymentMethods]);

  const handleCompleteOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Hata', 'Lütfen teslimat adresi seçin');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Hata', 'Lütfen ödeme yöntemi seçin');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Hata', 'Sepetiniz boş');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        shipping_address_id: selectedAddress.id,
        payment_method_id: selectedPaymentMethod.id,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
      };

      console.log('🛒 Sipariş verisi hazırlandı:', orderData);
      console.log('🔑 Kullanıcı:', user?.name, user?.email);

      const result = await createOrder(orderData);
      
      console.log('✅ Sipariş sonucu:', result);
      console.log('💰 Total amount:', result?.total_amount, typeof result?.total_amount);

      // Sepeti temizle
      clearCart();

      // Başarı mesajı
      const orderNumber = result?.order_number || 'Bilinmiyor';
      const orderTotal = typeof result?.total_amount === 'number' ? result.total_amount : totalAmount;
      
      Alert.alert(
        'Sipariş Tamamlandı!',
        `Sipariş numaranız: ${orderNumber}\nTutar: ₺${Number(orderTotal).toFixed(2)}`,
        [
          {
            text: 'Siparişlerim',
            onPress: () => router.push('/(tabs)/profile/orders'),
          },
          {
            text: 'Ana Sayfa',
            onPress: () => router.push('/(tabs)/home'),
            style: 'cancel',
          },
        ]
      );

    } catch (error) {
      console.error('❌ Sipariş hatası:', error);
      Alert.alert('Hata', error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Ödeme</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Demo Uyarısı */}
        <View style={styles.demoWarning}>
          <Ionicons name="information-circle" size={24} color="#f59e0b" />
          <Text style={styles.demoText}>
            Bu demo ödemedir, gerçek çekim yapılmaz
          </Text>
        </View>

        {/* Teslimat Adresi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Teslimat Adresi</Text>
            <TouchableOpacity onPress={() => setShowAddressForm(true)}>
              <Text style={styles.addButton}>+ Yeni Adres</Text>
            </TouchableOpacity>
          </View>

          {addresses?.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => setShowAddressForm(true)}
            >
              <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
              <Text style={styles.emptyText}>Adres Ekle</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addressContainer}>
              {/* Seçili Adres Gösterimi */}
              {selectedAddress && (
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.selectedAddressCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.selectedAddressHeader}>
                    <View style={styles.selectedAddressIcon}>
                      <Ionicons name="location" size={20} color="#ffffff" />
                    </View>
                    <View style={styles.selectedAddressInfo}>
                      <Text style={styles.selectedAddressTitle}>{selectedAddress.title}</Text>
                      <Text style={styles.selectedAddressName}>{selectedAddress.full_name}</Text>
                    </View>
                    <View style={styles.selectedAddressBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                  </View>
                  <Text style={styles.selectedAddressText}>
                    {selectedAddress.address_line}
                  </Text>
                  <Text style={styles.selectedAddressLocation}>
                    {selectedAddress.district}, {selectedAddress.city}
                  </Text>
                </LinearGradient>
              )}

              {/* Diğer Adresler Listesi */}
              {addresses?.filter(addr => addr.id !== selectedAddress?.id).length > 0 && (
                <View style={styles.otherAddressesContainer}>
                  <Text style={styles.otherAddressesTitle}>Diğer Adresler</Text>
                  {addresses?.filter(addr => addr.id !== selectedAddress?.id).map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.addressListItem}
                      onPress={() => setSelectedAddress(address)}
                    >
                      <View style={styles.addressListIcon}>
                        <Ionicons name="location-outline" size={18} color="#64748b" />
                      </View>
                      <View style={styles.addressListInfo}>
                        <Text style={styles.addressListTitle}>{address.title}</Text>
                        <Text style={styles.addressListSubtitle}>
                          {address.full_name} • {address.district}, {address.city}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Ödeme Yöntemi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ödeme Yöntemi</Text>
            <TouchableOpacity onPress={() => setShowPaymentForm(true)}>
              <Text style={styles.addButton}>+ Yeni Kart</Text>
            </TouchableOpacity>
          </View>

          {paymentMethods?.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyCard}
              onPress={() => setShowPaymentForm(true)}
            >
              <Ionicons name="card-outline" size={28} color="#3b82f6" />
              <Text style={styles.emptyText}>Kart Ekle</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {paymentMethods?.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCardWrapper,
                    selectedPaymentMethod?.id === method.id && styles.selectedPaymentCard,
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <LinearGradient
                    colors={
                      selectedPaymentMethod?.id === method.id 
                        ? ['#1e40af', '#3b82f6'] 
                        : ['#1e293b', '#334155']
                    }
                    style={styles.paymentCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardHeader}>
                      <Ionicons 
                        name={method.card_brand === 'visa' ? 'card' : 'card-outline'} 
                        size={24} 
                        color="#ffffff" 
                      />
                      <Text style={styles.cardBrand}>{method.card_brand.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.cardNumber}>**** **** **** {method.card_last4}</Text>
                    <Text style={styles.cardHolder}>{method.card_holder_name}</Text>
                    <Text style={styles.cardExpiry}>
                      {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </Text>
                    {selectedPaymentMethod?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#3b82f6" style={styles.checkIcon} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sipariş Özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
          
          {items?.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>{item.quantity} adet</Text>
              <Text style={styles.itemPrice}>₺{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          <LinearGradient
            colors={['#f8fafc', '#f1f5f9']}
            style={styles.orderSummary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam</Text>
              <Text style={styles.summaryValue}>₺{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kargo</Text>
              <Text style={styles.summaryValue}>₺{shippingCost.toFixed(2)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>İndirim</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -₺{discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalValue}>₺{totalAmount.toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Alt Buton */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.completeButtonWrapper, loading && styles.disabledButton]}
          onPress={handleCompleteOrder}
          disabled={loading || !selectedAddress || !selectedPaymentMethod}
        >
          <LinearGradient
            colors={loading || !selectedAddress || !selectedPaymentMethod 
              ? ['#94a3b8', '#94a3b8'] 
              : ['#3b82f6', '#1d4ed8']
            }
            style={styles.completeButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'İşleniyor...' : `Siparişi Tamamla - ₺${totalAmount.toFixed(2)}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Adres Formu Modal */}
      <Modal
        visible={showAddressForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <AddressForm
            onSubmit={async () => {
              setShowAddressForm(false);
              await loadAddresses();
            }}
            onCancel={() => setShowAddressForm(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Ödeme Yöntemi Formu Modal */}
      <Modal
        visible={showPaymentForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <PaymentMethodForm
            onSubmit={async () => {
              setShowPaymentForm(false);
              await loadPaymentMethods();
            }}
            onCancel={() => setShowPaymentForm(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  demoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    margin: 20,
    borderRadius: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  demoText: {
    fontSize: 15,
    color: '#92400e',
    flex: 1,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  addButton: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  addressContainer: {
    gap: 16,
  },
  selectedAddressCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  selectedAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAddressInfo: {
    flex: 1,
  },
  selectedAddressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  selectedAddressName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  selectedAddressBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAddressText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    marginBottom: 8,
  },
  selectedAddressLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  otherAddressesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  otherAddressesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  addressListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  addressListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressListInfo: {
    flex: 1,
  },
  addressListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  addressListSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  paymentCardWrapper: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  paymentCard: {
    padding: 20,
    borderRadius: 16,
  },
  selectedCard: {
    borderColor: '#3b82f6',
    transform: [{ scale: 1.02 }],
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
  },
  selectedPaymentCard: {
    borderColor: '#3b82f6',
    transform: [{ scale: 1.02 }],
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  cardHolder: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
    fontWeight: '500',
  },
  cardExpiry: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 12,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  orderSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  discountValue: {
    color: '#059669',
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonWrapper: {
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledButton: {
    shadowOpacity: 0.1,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});