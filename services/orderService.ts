// services/orderService.ts
import { API_BASE_URL, getAuthHeaders } from '../api';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    Order,
    OrderItem,
    OrderPayment,
    OrderStatusHistory
} from '../types/Order';

export const orderService = {
  // Sipariş oluştur
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    
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
      `${API_BASE_URL}/orders?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers,
      }
    );

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
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

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
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Sipariş iptal edilirken bir hata oluştu');
    }
  },
};