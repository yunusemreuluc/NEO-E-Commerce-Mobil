// types/Order.ts
export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Adres bilgileri
  shipping_address_id?: number;
  shipping_address_snapshot?: string;
  
  // Fiyat bilgileri
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  
  // Ödeme bilgileri
  payment_method: 'credit_card' | 'debit_card';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Ek bilgiler (JOIN'den gelen)
  item_count?: number;
  product_names?: string;
  first_product_image?: string;
  first_product_name?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  
  // Ürün snapshot
  product_name: string;
  product_price: number;
  product_image?: string;
  
  // Sipariş detayları
  quantity: number;
  unit_price: number;
  total_price: number;
  
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  
  // Kart bilgileri (maskeli)
  card_holder_name: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  
  // Güvenlik
  card_token?: string;
  is_default: boolean;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface OrderPayment {
  id: number;
  order_id: number;
  payment_method_id?: number;
  
  // Ödeme detayları
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Demo ödeme bilgileri
  transaction_id?: string;
  payment_gateway: string;
  
  // Timestamps
  processed_at?: string;
  created_at: string;
  
  // JOIN'den gelen kart bilgileri
  card_brand?: string;
  card_last4?: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: Order['status'];
  notes?: string;
  created_by?: number;
  created_at: string;
}

// API Request/Response tipleri
export interface CreateOrderRequest {
  shipping_address_id?: number;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
  payment_method_id?: number;
  subtotal: number;
  shipping_cost?: number;
  discount_amount?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data?: {
    order_id: number;
    order_number: string;
    total_amount: number;
    status: string;
  };
}

export interface CreatePaymentMethodRequest {
  card_holder_name: string;
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
  is_default?: boolean;
}

export interface CreatePaymentMethodResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    card_holder_name: string;
    card_brand: string;
    card_last4: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
  };
}

// Checkout için birleşik tip
export interface CheckoutData {
  shipping_address_id?: number;
  payment_method_id?: number;
  cart_items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    product_image?: string;
  }[];
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
}