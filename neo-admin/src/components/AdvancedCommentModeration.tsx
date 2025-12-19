'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageLightbox from './ui/ImageLightbox';
import Modal from './ui/Modal';

interface Comment {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  has_images: boolean;
  image_count: number;
  images: string[];
  created_at: string;
  moderated_at?: string;
  moderated_by?: number;
  rejection_reason?: string;
  product_name?: string;
  user_banned?: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  banned: boolean;
  ban_reason?: string;
  banned_at?: string;
}

interface AdvancedCommentModerationProps {
  apiBaseUrl: string;
  authToken: string;
}

export default function AdvancedCommentModeration({ 
  apiBaseUrl, 
  authToken 
}: AdvancedCommentModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [banReason, setBanReason] = useState('');

  // Yorumları yükle
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
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

      if (!response.ok) {
        throw new Error('Yorumlar yüklenemedi');
      }

      const data = await response.json();
      setComments(data.success ? data.data : []);
    } catch (error) {
      console.error('Load comments error:', error);
      // Toast notification yerine basit alert kullanıyoruz
      alert('Yorumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authToken, statusFilter]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Yorum durumu güncelle
  const updateCommentStatus = async (
    commentId: number, 
    status: 'approved' | 'rejected', 
    reason?: string
  ) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${apiBaseUrl}/comments/admin/${commentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      });

      if (!response.ok) {
        throw new Error('İşlem başarısız');
      }

      alert(`Yorum ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`);
      loadComments();
      setRejectModalOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Update comment status error:', error);
      alert('İşlem gerçekleştirilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Kullanıcı ban/unban
  const toggleUserBan = async (userId: number, action: 'ban' | 'unban', reason?: string) => {
    try {
      setActionLoading(true);
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
      setBanModalOpen(false);
      setBanReason('');
    } catch (error) {
      console.error('Toggle user ban error:', error);
      alert('İşlem gerçekleştirilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Yorum sil
  const deleteComment = async (commentId: number) => {
    if (!confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${apiBaseUrl}/comments/admin/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız');
      }

      alert('Yorum silindi');
      loadComments();
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Silme işlemi gerçekleştirilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Tek resmi sil
  const deleteCommentImage = async (commentId: number, imageUrl: string) => {
    if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${apiBaseUrl}/comments/admin/${commentId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        throw new Error('Resim silme işlemi başarısız');
      }

      alert('Resim silindi');
      loadComments();
    } catch (error) {
      console.error('Delete image error:', error);
      alert('Resim silme işlemi gerçekleştirilemedi');
    } finally {
      setActionLoading(false);
    }
  };

  // Lightbox fonksiyonları
  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gelişmiş Yorum Moderasyonu</h1>
        <p className="text-gray-600 mt-1">Yorumları, resimlerini inceleyin ve moderasyon yapın</p>
      </div>

      {/* Filters */}
      <div className="neo-card p-4">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Durum Filtresi:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>
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
                    {comment.user_banned && (
                      <span className="neo-badge neo-badge-danger">Yasaklı Kullanıcı</span>
                    )}
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
                    {comment.has_images && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{comment.image_count} resim</span>
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

              {/* Images */}
              {comment.images && comment.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {comment.images.map((imageUrl, index) => (
                      <div key={index} className="relative flex-shrink-0 group">
                        <img
                          src={`${apiBaseUrl}${imageUrl}`}
                          alt={`Yorum resmi ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openLightbox(comment.images, index)}
                        />
                        {/* Delete Image Button */}
                        <button
                          onClick={() => deleteCommentImage(comment.id, imageUrl)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                          title="Resmi sil"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {comment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateCommentStatus(comment.id, 'approved')}
                      disabled={actionLoading}
                      className="btn-secondary text-green-700 hover:bg-green-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Onayla
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedComment(comment);
                        setRejectModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="btn-secondary text-red-700 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reddet
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setSelectedComment(comment);
                    setDetailModalOpen(true);
                  }}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Detay
                </button>

                <button
                  onClick={() => deleteComment(comment.id)}
                  disabled={actionLoading}
                  className="btn-danger"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Sil
                </button>

                <button
                  onClick={() => {
                    setSelectedComment(comment);
                    setBanModalOpen(true);
                  }}
                  disabled={actionLoading}
                  className="btn-secondary text-orange-700 hover:bg-orange-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  {comment.user_banned ? 'Yasağı Kaldır' : 'Kullanıcıyı Yasakla'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Yorumu Reddet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ret Sebebi (Opsiyonel)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Neden reddedildiğini açıklayın..."
              maxLength={500}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {rejectionReason.length}/500 karakter
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="btn-outline"
            >
              İptal
            </button>
            <button
              onClick={() => selectedComment && updateCommentStatus(selectedComment.id, 'rejected', rejectionReason)}
              disabled={actionLoading}
              className="btn-danger"
            >
              {actionLoading ? 'İşleniyor...' : 'Reddet'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        title={selectedComment?.user_banned ? 'Kullanıcı Yasağını Kaldır' : 'Kullanıcıyı Yasakla'}
      >
        <div className="space-y-4">
          {!selectedComment?.user_banned && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yasak Sebebi
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Neden yasaklandığını açıklayın..."
                maxLength={500}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                {banReason.length}/500 karakter
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setBanModalOpen(false)}
              className="btn-outline"
            >
              İptal
            </button>
            <button
              onClick={() => selectedComment && toggleUserBan(
                selectedComment.user_id, 
                selectedComment.user_banned ? 'unban' : 'ban', 
                banReason
              )}
              disabled={actionLoading}
              className={selectedComment?.user_banned ? 'btn-secondary' : 'btn-danger'}
            >
              {actionLoading ? 'İşleniyor...' : (selectedComment?.user_banned ? 'Yasağı Kaldır' : 'Yasakla')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Yorum Detayı"
        size="lg"
      >
        {selectedComment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Kullanıcı:</strong> {selectedComment.user_name}</div>
              <div><strong>E-posta:</strong> {selectedComment.user_email}</div>
              <div><strong>Puan:</strong> <div className="inline-flex">{renderStars(selectedComment.rating)}</div></div>
              <div><strong>Durum:</strong> {getStatusBadge(selectedComment.status)}</div>
              <div><strong>Tarih:</strong> {new Date(selectedComment.created_at).toLocaleString('tr-TR')}</div>
              <div><strong>Resim Sayısı:</strong> {selectedComment.image_count}</div>
            </div>
            
            <div>
              <strong>Yorum:</strong>
              <p className="mt-2 p-4 bg-gray-50 rounded-lg">{selectedComment.comment}</p>
            </div>

            {selectedComment.images && selectedComment.images.length > 0 && (
              <div>
                <strong>Resimler:</strong>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {selectedComment.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`${apiBaseUrl}${imageUrl}`}
                        alt={`Yorum resmi ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(selectedComment.images, index)}
                      />
                      <button
                        onClick={() => deleteCommentImage(selectedComment.id, imageUrl)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                        title="Resmi sil"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedComment.rejection_reason && (
              <div>
                <strong>Ret Sebebi:</strong>
                <p className="mt-2 p-4 bg-red-50 rounded-lg text-red-700">{selectedComment.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}