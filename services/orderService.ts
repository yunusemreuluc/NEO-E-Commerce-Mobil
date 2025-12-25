// services/orderService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getAuthHeaders } from '../api';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    Order,
    OrderItem,
    OrderPayment,
    OrderStatusHistory
} from '../types/Order';

// 401 hatası durumunda logout yapacak yardımcı fonksiyon
const handleUnauthorized = async () => {
  console.warn('Token geçersiz, kullanıcı çıkış yapılıyor');
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user_data');
  // Navigation burada yapılamaz, context'te handle edilecek
};

// API yanıtını kontrol eden yardımcı fonksiyon
const checkAuthResponse = async (response: Response) => {
  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }
  return response;
};

export const orderService = {
  // Sipariş oluştur
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    console.log('🚀 OrderService.createOrder başladı');
    console.log('📦 Order data:', orderData);
    
    const headers = await getAuthHeaders();
    console.log('🔑 Headers:', headers);
    
    const url = `${API_BASE_URL}/api/orders`;
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📄 Response body:', result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Sipariş oluşturulurken bir hata oluştu');
    }

    return result;
  },

  // Kullanıcının siparişlerini listele
  async getOrders(page: number = 1, limit: number = 10): Promise<{
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/orders?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers,
      }
    );

    // Auth kontrolü
    await checkAuthResponse(response);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Siparişler yüklenirken bir hata oluştu');
    }

    // Sayısal alanları güvenli şekilde dönüştür
    const processedOrders = result.data.orders.map((order: any) => ({
      ...order,
      subtotal: Number(order.subtotal) || 0,
      shipping_cost: Number(order.shipping_cost) || 0,
      discount_amount: Number(order.discount_amount) || 0,
      total_amount: Number(order.total_amount) || 0
    }));

    return {
      ...result.data,
      orders: processedOrders
    };
  },

  // Sipariş detayı
  async getOrderDetail(orderId: number): Promise<{
    order: Order;
    items: OrderItem[];
    payments: OrderPayment[];
    status_history: OrderStatusHistory[];
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

    // Auth kontrolü
    await checkAuthResponse(response);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Sipariş detayı yüklenirken bir hata oluştu');
    }

    // Sayısal alanları güvenli şekilde dönüştür
    const processedOrder = {
      ...result.data.order,
      subtotal: Number(result.data.order.subtotal) || 0,
      shipping_cost: Number(result.data.order.shipping_cost) || 0,
      discount_amount: Number(result.data.order.discount_amount) || 0,
      total_amount: Number(result.data.order.total_amount) || 0
    };

    const processedItems = result.data.items.map((item: any) => ({
      ...item,
      product_price: Number(item.product_price) || 0,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0
    }));

    const processedPayments = result.data.payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount) || 0
    }));

    return {
      order: processedOrder,
      items: processedItems,
      payments: processedPayments,
      status_history: result.data.status_history
    };
  },

  // Sipariş iptal et
  async cancelOrder(orderId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Sipariş iptal edilirken bir hata oluştu');
    }
  },
};