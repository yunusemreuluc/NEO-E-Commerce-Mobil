'use client';

import { useEffect, useState } from 'react';

interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name: string;
  user_email: string;
  product_name: string;
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`http://localhost:4000/reviews/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (response.ok) {
        const data: ReviewsResponse = await response.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: number, status: string) => {
    try {
      const response = await fetch(`http://localhost:4000/reviews/admin/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchReviews(); // Listeyi yenile
      }
    } catch (error) {
      console.error('Yorum durumu güncellenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylı',
      rejected: 'Reddedildi'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yorum Yönetimi</h1>
        <p className="text-gray-600">Kullanıcı yorumlarını inceleyin ve moderasyon yapın</p>
      </div>

      {/* Filtreler */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Tüm Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="approved">Onaylı</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>

      {/* Yorumlar Listesi */}
      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün & Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puan & Yorum
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
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {review.product_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.user_name} ({review.user_email})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center mb-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          ({review.rating}/5)
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {review.comment}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(review.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {review.status !== 'approved' && (
                        <button
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Onayla
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button
                          onClick={() => updateReviewStatus(review.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reddet
                        </button>
                      )}
                      {review.status !== 'pending' && (
                        <button
                          onClick={() => updateReviewStatus(review.id, 'pending')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Beklet
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setFilter({ ...filter, page: Math.max(1, filter.page - 1) })}
                  disabled={filter.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setFilter({ ...filter, page: Math.min(pagination.pages, filter.page + 1) })}
                  disabled={filter.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{((filter.page - 1) * filter.limit) + 1}</span>
                    {' - '}
                    <span className="font-medium">
                      {Math.min(filter.page * filter.limit, pagination.total)}
                    </span>
                    {' / '}
                    <span className="font-medium">{pagination.total}</span>
                    {' sonuç gösteriliyor'}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setFilter({ ...filter, page })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === filter.page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}