// services/paymentService.ts
import { API_BASE_URL, getAuthHeaders } from '../api';
import {
    CreatePaymentMethodRequest,
    CreatePaymentMethodResponse,
    PaymentMethod
} from '../types/Order';

export const paymentService = {
  // Ödeme yöntemlerini listele
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/payment-methods`, {
      method: 'GET',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Ödeme yöntemleri yüklenirken bir hata oluştu');
    }

    return result.data;
  },

  // Yeni ödeme yöntemi ekle
  async addPaymentMethod(paymentData: CreatePaymentMethodRequest): Promise<CreatePaymentMethodResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/payment-methods`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Kart eklenirken bir hata oluştu');
    }

    return result;
  },

  // Ödeme yöntemini varsayılan yap
  async setDefaultPaymentMethod(paymentMethodId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/api/payment-methods/${paymentMethodId}/set-default`,
      {
        method: 'PATCH',
        headers,
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Varsayılan kart güncellenirken bir hata oluştu');
    }
  },

  // Ödeme yöntemini sil
  async deletePaymentMethod(paymentMethodId: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Kart silinirken bir hata oluştu');
    }
  },

  // Kart numarası validasyonu
  validateCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleanNumber);
  },

  // CVV validasyonu
  validateCVV(cvv: string, cardBrand?: string): boolean {
    if (cardBrand === 'amex') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  },

  // Kart numarasını maskele
  maskCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 4) return cardNumber;
    
    const last4 = cleanNumber.slice(-4);
    const masked = '*'.repeat(cleanNumber.length - 4);
    return `${masked}${last4}`;
  },

  // Kart markası belirleme
  getCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) {
      return 'visa';
    } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
      return 'mastercard';
    } else if (cleanNumber.startsWith('3')) {
      return 'amex';
    }
    
    return 'unknown';
  },

  // Kart numarasını formatlama (4'lü gruplar)
  formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
  },
};