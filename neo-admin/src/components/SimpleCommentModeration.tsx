'use client';

import { useCallback, useEffect, useState } from 'react';

interface Comment {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  created_at: string;
  product_name?: string;
  // Backend'den gelen ek alanlar
  image_urls?: string;
}

interface SimpleCommentModerationProps {
  apiBaseUrl: string;
  authToken: string;
}

export default function SimpleCommentModeration({ 
  apiBaseUrl, 
  authToken 
}: SimpleCommentModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Yorumları yükle - önce mevcut reviews endpoint'ini deneyelim
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Comments endpoint'ini kullan (resim desteği var)
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`${apiBaseUrl}/comments/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status} - ${response.statusText} - ${data.message || 'Bilinmeyen hata'}`);
      }
      
      // Admin endpoint veri yapısını kontrol et
      if (data.success && data.data && Array.isArray(data.data)) {
        setComments(data.data);
      } else if (Array.isArray(data)) {
        setComments(data);
      } else {
        setComments([]);
      }
      
    } catch (error) {
      console.error('Load comments error:', error);
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authToken, statusFilter]);

  useEffect(() => {
    if (authToken) {
      loadComments();
    }
  }, [loadComments, authToken]);

  // Yorum durumu güncelle
  const updateCommentStatus = async (commentId: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`${apiBaseUrl}/comments/admin/${commentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('İşlem başarısız');
      }

      alert(`Yorum ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`);
      loadComments();
    } catch (error) {
      console.error('Update comment status error:', error);
      alert('İşlem gerçekleştirilemedi');
    }
  };

  // Kullanıcı ban/unban
  const toggleUserBan = async (userId: number, action: 'ban' | 'unban', reason?: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/comments/admin/user/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reason })
      });

      if (!response.ok) {
        throw new Error('İşlem başarısız');
      }

      alert(`Kullanıcı ${action === 'ban' ? 'yasaklandı' : 'yasağı kaldırıldı'}`);
      loadComments();
    } catch (error) {
      console.error('Toggle user ban error:', error);
      alert('İşlem gerçekleştirilemedi');
    }
  };

  // Yorum silme fonksiyonu
  const deleteComment = async (commentId: number, reason?: string) => {
    try {
      const response = await fetch(`http://10.241.81.212:4000/comments/admin/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Silme işlemi başarısız: ${response.status} - ${errorData?.message || 'Bilinmeyen hata'}`);
      }

      // Bildirim backend tarafından otomatik oluşturulacak
      alert('Yorum başarıyla silindi ve kullanıcıya bildirim gönderildi');
      loadComments();
    } catch (error) {
      console.error('Delete comment error:', error);
      alert(`Yorum silinemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  // Durum badge'i
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="neo-badge neo-badge-success">Onaylandı</span>;
      case 'rejected':
        return <span className="neo-badge neo-badge-danger">Reddedildi</span>;
      case 'pending':
        return <span className="neo-badge neo-badge-warning">Beklemede</span>;
      default:
        return <span className="neo-badge neo-badge-info">{status}</span>;
    }
  };

  // Yıldız render
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="neo-card p-12 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500">Yorumlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yorum Yönetimi</h1>
          <p className="text-gray-600 mt-1">Kullanıcı yorumlarını inceleyin ve moderasyon yapın</p>
        </div>
        
        <div className="neo-card border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">API Bağlantı Hatası</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <div className="mt-3 text-sm text-red-600">
                <p><strong>Kontrol edilecekler:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Backend server çalışıyor mu? (http://localhost:4000)</li>
                  <li>Admin token geçerli mi? Token: {authToken ? authToken.substring(0, 20) + '...' : 'YOK'}</li>
                  <li>/comments/admin/all endpoint'i mevcut mu?</li>
                  <li>Önce login sayfasından giriş yaptınız mı?</li>
                </ul>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium">Çözüm:</p>
                <p className="text-blue-700 text-sm mt-1">
                  1. <a href="/login" className="underline hover:text-blue-900">Login sayfasına</a> gidin<br/>
                  2. admin@neoapp.com / admin123 ile giriş yapın<br/>
                  3. Bu sayfaya geri dönün
                </p>
              </div>
              <button 
                onClick={loadComments}
                className="btn-primary mt-4"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">💬</span>
          Yorum Yönetimi
        </h1>
        <p className="text-gray-600 mt-2">Kullanıcı yorumlarını inceleyin ve moderasyon yapın</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="neo-badge neo-badge-info neo-badge-sm">
            {comments.length} Toplam Yorum
          </div>
          <div className="neo-badge neo-badge-warning neo-badge-sm">
            {comments.filter(c => c.status === 'pending').length} Beklemede
          </div>
          <div className="neo-badge neo-badge-success neo-badge-sm">
            {comments.filter(c => c.status === 'approved').length} Onaylandı
          </div>
          <div className="neo-badge neo-badge-danger neo-badge-sm">
            {comments.filter(c => c.status === 'rejected').length} Reddedildi
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="neo-card-soft p-6">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <label className="text-sm font-semibold text-gray-700">Durum Filtresi:</label>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">🔄 Tümü</option>
            <option value="pending">⏳ Beklemede</option>
            <option value="approved">✅ Onaylandı</option>
            <option value="rejected">❌ Reddedildi</option>
          </select>
          <div className="ml-auto text-sm text-gray-500">
            Toplam {comments.length} yorum bulundu
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <div className="text-gray-500">
              <span className="text-4xl mb-2 block">💬</span>
              Gösterilecek yorum bulunamadı
            </div>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="neo-card p-6">
              {/* Comment Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{comment.user_name}</span>
                    <span className="text-sm text-gray-500">({comment.user_email})</span>
                    {renderStars(comment.rating)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Ürün ID: {comment.product_id}</span>
                    {comment.product_name && (
                      <>
                        <span>•</span>
                        <span>{comment.product_name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                    {comment.images && comment.images.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{comment.images.length} resim</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(comment.status)}
                </div>
              </div>

              {/* Comment Text */}
              <p className="text-gray-700 mb-4 leading-relaxed">{comment.comment}</p>

              {/* Images - URL Tabanlı Sistem */}
              {comment.images && comment.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {comment.images.map((imageUrl, index) => {
                      // URL tipini belirle
                      const isBase64 = imageUrl.startsWith('data:');
                      const isExternalUrl = imageUrl.startsWith('http');
                      const isLocalFile = imageUrl.startsWith('/uploads/');
                      
                      // Görüntüleme URL'sini hazırla
                      let displayUrl = imageUrl;
                      if (isLocalFile) {
                        displayUrl = `${apiBaseUrl}${imageUrl}`;
                      }
                      
                      return (
                        <div key={index} className="relative flex-shrink-0">
                          <img
                            src={displayUrl}
                            alt={`Yorum resmi ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              // URL tipine göre açma yöntemi
                              if (isBase64) {
                                // Base64 için yeni pencere
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>Resim ${index + 1}</title></head>
                                      <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                        <img src="${imageUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                      </body>
                                    </html>
                                  `);
                                }
                              } else {
                                // URL veya dosya için direkt açma
                                window.open(displayUrl, '_blank');
                              }
                            }}
                            onError={(e) => {
                              // Resim yüklenemezse placeholder göster
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkw0MCA0OEw1NiAzMkw2NCA0MEw2NCA1NkgxNlY0MEwyNCAzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                            }}
                          />
                          <div className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {index + 1}
                          </div>
                          {/* URL tipi göstergesi */}
                          <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tr">
                            {isBase64 ? 'B64' : isExternalUrl ? 'URL' : 'FILE'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {comment.images.length} resim • Resme tıklayarak büyük görüntüleyin • B64=Base64, URL=Harici, FILE=Dosya
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {comment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateCommentStatus(comment.id, 'approved')}
                      className="btn-success btn-sm"
                    >
                      <span className="text-sm">✅</span>
                      Onayla
                    </button>
                    
                    <button
                      onClick={() => updateCommentStatus(comment.id, 'rejected')}
                      className="btn-danger btn-sm"
                    >
                      <span className="text-sm">❌</span>
                      Reddet
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    const reason = prompt('Yorumu silme sebebini yazın (kullanıcıya bildirim olarak gönderilecek):');
                    if (reason !== null && reason.trim() !== '') {
                      if (confirm(`Bu yorumu silmek istediğinizden emin misiniz?\n\nSebep: ${reason}\n\nKullanıcıya bildirim gönderilecek.`)) {
                        deleteComment(comment.id, reason.trim());
                      }
                    } else if (reason !== null) {
                      alert('Silme sebebi boş olamaz!');
                    }
                  }}
                  className="btn-danger btn-sm"
                >
                  <span className="text-sm">🗑️</span>
                  Yorumu Sil
                </button>

                <button
                  onClick={() => {
                    const reason = prompt('Kullanıcıyı yasaklama sebebi (opsiyonel):');
                    if (reason !== null) {
                      toggleUserBan(comment.user_id, 'ban', reason || undefined);
                    }
                  }}
                  className="btn-warning btn-sm"
                >
                  <span className="text-sm">🚫</span>
                  Kullanıcıyı Yasakla
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}