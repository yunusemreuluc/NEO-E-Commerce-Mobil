// contexts/OrderContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import {
    CreateOrderRequest,
    CreatePaymentMethodRequest,
    Order,
    OrderItem,
    OrderPayment,
    OrderStatusHistory,
    PaymentMethod
} from '../types/Order';
import { useAuth } from './AuthContext';

interface OrderContextType {
  // Orders
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  
  // Payment Methods
  paymentMethods: PaymentMethod[];
  paymentMethodsLoading: boolean;
  paymentMethodsError: string | null;
  
  // Actions
  loadOrders: (page?: number, limit?: number) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<{ order_id: number; order_number: string; total_amount: number; status: string; }>;
  getOrderDetail: (orderId: number) => Promise<{
    order: Order;
    items: OrderItem[];
    payments: OrderPayment[];
    status_history: OrderStatusHistory[];
  }>;
  cancelOrder: (orderId: number) => Promise<void>;
  
  // Payment Methods
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentData: CreatePaymentMethodRequest) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: number) => Promise<void>;
  deletePaymentMethod: (paymentMethodId: number) => Promise<void>;
  
  // Utils
  clearErrors: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Kullanıcı değiştiğinde verileri temizle
  useEffect(() => {
    if (!user) {
      console.log('👤 OrderContext: Kullanıcı çıkış yaptı, veriler temizleniyor');
      setOrders([]);
      setPaymentMethods([]);
      setOrdersError(null);
      setPaymentMethodsError(null);
    } else {
      console.log('👤 OrderContext: Kullanıcı giriş yaptı:', user.name);
    }
  }, [user]);

  const clearErrors = () => {
    setOrdersError(null);
    setPaymentMethodsError(null);
  };

  // Siparişleri yükle
  const loadOrders = async (page: number = 1, limit: number = 10) => {
    if (!user) {
      setOrders([]); // Kullanıcı yoksa siparişleri temizle
      return;
    }
    
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      const result = await orderService.getOrders(page, limit);
      setOrders(result.orders);
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Siparişler yüklenirken bir hata oluştu');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Sipariş oluştur
  const createOrder = async (orderData: CreateOrderRequest) => {
    try {
      setOrdersError(null);
      
      console.log('🏪 OrderContext.createOrder başladı');
      console.log('📋 Order data:', orderData);
      
      const result = await orderService.createOrder(orderData);
      
      console.log('🎯 OrderService sonucu:', result);
      
      if (result.success && result.data) {
        console.log('✅ Sipariş başarılı, siparişler yeniden yükleniyor...');
        // Siparişleri yeniden yükle
        await loadOrders();
        return result.data;
      } else {
        console.error('❌ Sipariş başarısız:', result);
        throw new Error(result.message || 'Sipariş oluşturulamadı');
      }
    } catch (error) {
      console.error('💥 OrderContext createOrder hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu';
      setOrdersError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sipariş detayı
  const getOrderDetail = async (orderId: number) => {
    try {
      setOrdersError(null);
      return await orderService.getOrderDetail(orderId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sipariş detayı yüklenirken bir hata oluştu';
      setOrdersError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sipariş iptal et
  const cancelOrder = async (orderId: number) => {
    try {
      setOrdersError(null);
      
      await orderService.cancelOrder(orderId);
      
      // Siparişleri yeniden yükle
      await loadOrders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sipariş iptal edilirken bir hata oluştu';
      setOrdersError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Ödeme yöntemlerini yükle
  const loadPaymentMethods = async () => {
    if (!user) {
      setPaymentMethods([]); // Kullanıcı yoksa ödeme yöntemlerini temizle
      return;
    }
    
    try {
      setPaymentMethodsLoading(true);
      setPaymentMethodsError(null);
      
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      setPaymentMethodsError(error instanceof Error ? error.message : 'Ödeme yöntemleri yüklenirken bir hata oluştu');
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  // Ödeme yöntemi ekle
  const addPaymentMethod = async (paymentData: CreatePaymentMethodRequest) => {
    try {
      setPaymentMethodsError(null);
      
      const result = await paymentService.addPaymentMethod(paymentData);
      
      if (result.success) {
        // Ödeme yöntemlerini yeniden yükle
        await loadPaymentMethods();
      } else {
        throw new Error(result.message || 'Kart eklenemedi');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kart eklenirken bir hata oluştu';
      setPaymentMethodsError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Varsayılan ödeme yöntemi ayarla
  const setDefaultPaymentMethod = async (paymentMethodId: number) => {
    try {
      setPaymentMethodsError(null);
      
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      
      // Ödeme yöntemlerini yeniden yükle
      await loadPaymentMethods();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Varsayılan kart güncellenirken bir hata oluştu';
      setPaymentMethodsError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Ödeme yöntemi sil
  const deletePaymentMethod = async (paymentMethodId: number) => {
    try {
      setPaymentMethodsError(null);
      
      await paymentService.deletePaymentMethod(paymentMethodId);
      
      // Ödeme yöntemlerini yeniden yükle
      await loadPaymentMethods();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kart silinirken bir hata oluştu';
      setPaymentMethodsError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value: OrderContextType = {
    orders,
    ordersLoading,
    ordersError,
    paymentMethods,
    paymentMethodsLoading,
    paymentMethodsError,
    loadOrders,
    createOrder,
    getOrderDetail,
    cancelOrder,
    loadPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    clearErrors,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};