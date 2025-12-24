'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.241.81.212:4000";

interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  item_count?: number;
  product_names?: string;
  user_name?: string;
  user_email?: string;
}

const getStatusColor = (status: Order['status']) => {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    page: 1,
    limit: 20
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`${API_BASE_URL}/orders/admin/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setOrders(result.data?.orders || []);
    } catch (err) {
      console.error('Sipariş listesi hatası:', err);
      setError(err instanceof Error ? err.message : 'Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
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

      // Listeyi yenile
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Siparişler yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Hata</div>
        <div className="text-red-600 mt-1">{error}</div>
        <button
          onClick={fetchOrders}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Yenile
        </button>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-sm text-gray-600">Toplam Sipariş</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.payment_status === 'paid').length}
          </div>
          <div className="text-sm text-gray-600">Ödenen Siparişler</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Bekleyen Siparişler</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            ₺{orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Toplam Ciro</div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum Filtresi
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="confirmed">Onaylandı</option>
              <option value="processing">Hazırlanıyor</option>
              <option value="shipped">Kargoda</option>
              <option value="delivered">Teslim Edildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Siparişler Tablosu */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sipariş No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürünler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ödeme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Sipariş bulunamadı
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.order_number}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {order.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.user_name || `User ${order.user_id}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.user_email || `ID: ${order.user_id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.product_names || 'Ürünler'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.item_count} ürün
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₺{Number(order.total_amount || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Alt: ₺{Number(order.subtotal || 0).toFixed(2)} + Kargo: ₺{Number(order.shipping_cost || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Beklemede</option>
                          <option value="confirmed">Onaylandı</option>
                          <option value="processing">Hazırlanıyor</option>
                          <option value="shipped">Kargoda</option>
                          <option value="delivered">Teslim Edildi</option>
                          <option value="cancelled">İptal Et</option>
                        </select>
                      )}
                      <button
                        onClick={() => window.open(`/orders/${order.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                      >
                        Detay Gör
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Toplam {orders.length} sipariş gösteriliyor
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filter.page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
            {filter.page}
          </span>
          <button
            onClick={() => setFilter(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={orders.length < filter.limit}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}