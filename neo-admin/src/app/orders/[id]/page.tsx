'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.241.81.212:4000";

interface OrderDetail {
  order: {
    id: number;
    user_id: number;
    order_number: string;
    status: string;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    total_amount: number;
    payment_status: string;
    shipping_address_snapshot?: string;
    created_at: string;
    updated_at: string;
    user_name?: string;
    user_email?: string;
  };
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url?: string;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    payment_status: string;
    transaction_id?: string;
    card_brand?: string;
    card_last4?: string;
    processed_at?: string;
  }>;
  status_history: Array<{
    id: number;
    status: string;
    notes?: string;
    created_at: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-purple-100 text-purple-800';
    case 'shipped': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-green-200 text-green-900';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setOrderDetail(result.data);
    } catch (err) {
      console.error('Sipariş detay hatası:', err);
      setError(err instanceof Error ? err.message : 'Sipariş detayı yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Sipariş durumu güncellenemedi');
      }

      // Detayı yenile
      fetchOrderDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu');
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Sipariş detayı yükleniyor...</div>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Hata</div>
        <div className="text-red-600 mt-1">{error || 'Sipariş bulunamadı'}</div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={fetchOrderDetail}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const { order, items, payments, status_history } = orderDetail;

  // Adres bilgisini güvenli şekilde parse et
  let addressInfo = null;
  if (order.shipping_address_snapshot) {
    try {
      // String kontrolü yap
      const addressData = typeof order.shipping_address_snapshot === 'string' 
        ? order.shipping_address_snapshot 
        : JSON.stringify(order.shipping_address_snapshot);
      
      // Boş string kontrolü
      if (addressData && addressData.trim() !== '' && addressData !== 'null') {
        addressInfo = JSON.parse(addressData);
      }
    } catch (e) {
      console.error('Adres parse hatası:', e, 'Data:', order.shipping_address_snapshot);
      // Parse hatası durumunda null bırak
      addressInfo = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Siparişlere Dön
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Sipariş #{order.order_number}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <select
              value={order.status}
              onChange={(e) => updateOrderStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="pending">Beklemede</option>
              <option value="confirmed">Onaylandı</option>
              <option value="processing">Hazırlanıyor</option>
              <option value="shipped">Kargoda</option>
              <option value="delivered">Teslim Edildi</option>
              <option value="cancelled">İptal Et</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Ana Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sipariş Bilgileri */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Bilgileri</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Sipariş Numarası</label>
                <p className="mt-1 text-sm text-gray-900">#{order.order_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Sipariş Tarihi</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Müşteri</label>
                <p className="mt-1 text-sm text-gray-900">{order.user_name || `User ${order.user_id}`}</p>
                {order.user_email && (
                  <p className="text-sm text-gray-500">{order.user_email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Ödeme Durumu</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Ürünler */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Edilen Ürünler</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birim Fiyat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-4">
                          {item.image_url && (
                            <div className="flex-shrink-0 h-16 w-16">
                              <img
                                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                                src={item.image_url}
                                alt={item.product_name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500">ID: {item.product_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">₺{Number(item.unit_price || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{Number(item.quantity || 0)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">₺{Number(item.total_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sipariş Durumu Geçmişi */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Takibi</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {status_history.map((status, index) => (
                  <li key={status.id}>
                    <div className="relative pb-8">
                      {index !== status_history.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(status.status)}`}>
                            <div className="h-2 w-2 rounded-full bg-current" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              {getStatusText(status.status)}
                            </p>
                            {status.notes && (
                              <p className="text-sm text-gray-500">{status.notes}</p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(status.created_at).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Özet Bilgiler */}
        <div className="space-y-6">
          {/* Fiyat Özeti */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fiyat Özeti</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ara Toplam</span>
                <span className="text-sm text-gray-900">₺{Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kargo</span>
                <span className="text-sm text-gray-900">₺{Number(order.shipping_cost || 0).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">İndirim</span>
                  <span className="text-sm text-green-600">-₺{Number(order.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Toplam</span>
                  <span className="text-base font-medium text-gray-900">₺{Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ödeme Bilgileri */}
          {payments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Bilgileri</h2>
              {payments.map((payment) => (
                <div key={payment.id} className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ödeme Yöntemi</span>
                    <span className="text-sm text-gray-900">
                      {payment.card_brand?.toUpperCase()} **** {payment.card_last4}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tutar</span>
                    <span className="text-sm text-gray-900">₺{Number(payment.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Durum</span>
                    <span className={`text-sm ${
                      payment.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {payment.payment_status === 'completed' ? 'Ödendi' : 'Beklemede'}
                    </span>
                  </div>
                  {payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">İşlem No</span>
                      <span className="text-sm text-gray-900 font-mono">{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.processed_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">İşlem Tarihi</span>
                      <span className="text-sm text-gray-900">
                        {new Date(payment.processed_at).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Teslimat Adresi */}
          {addressInfo && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Teslimat Adresi</h2>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{addressInfo.title}</p>
                <p className="text-sm text-gray-900">{addressInfo.full_name}</p>
                <p className="text-sm text-gray-600">{addressInfo.phone}</p>
                <p className="text-sm text-gray-600">{addressInfo.address_line}</p>
                <p className="text-sm text-gray-600">
                  {addressInfo.district}, {addressInfo.city}
                </p>
                {addressInfo.postal_code && (
                  <p className="text-sm text-gray-600">Posta Kodu: {addressInfo.postal_code}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}