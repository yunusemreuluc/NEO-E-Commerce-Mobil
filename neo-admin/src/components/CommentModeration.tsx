import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Ban,
    CheckCircle,
    Eye,
    Image as ImageIcon,
    Star,
    UnlockKeyhole,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
}

interface CommentModerationProps {
  apiBaseUrl: string;
  authToken: string;
}

export default function CommentModeration({ apiBaseUrl, authToken }: CommentModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Yorumları yükle
  const loadComments = async () => {
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
      toast.error('Yorumlar yüklenirken hata oluştu');
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [statusFilter]);

  // Yorum durumu güncelle
  const updateCommentStatus = async (commentId: number, status: 'approved' | 'rejected', reason?: string) => {
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

      toast.success(`Yorum ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`);
      loadComments(); // Listeyi yenile
      setSelectedComment(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('İşlem gerçekleştirilemedi');
      console.error('Update comment status error:', error);
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

      toast.success(`Kullanıcı ${action === 'ban' ? 'yasaklandı' : 'yasağı kaldırıldı'}`);
      loadComments(); // Listeyi yenile
      setBanReason('');
    } catch (error) {
      toast.error('İşlem gerçekleştirilemedi');
      console.error('Toggle user ban error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Durum badge rengi
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Onaylandı</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Reddedildi</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Yıldız render
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Yorumlar yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yorum Moderasyonu</CardTitle>
          <div className="flex gap-4">
            <div>
              <Label htmlFor="status-filter">Durum Filtresi</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Gösterilecek yorum bulunamadı
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{comment.user_name}</span>
                          <span className="text-sm text-gray-500">({comment.user_email})</span>
                          {renderStars(comment.rating)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Ürün ID: {comment.product_id}</span>
                          <span>•</span>
                          <span>{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                          {comment.has_images && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <ImageIcon size={14} />
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

                    <p className="text-gray-700 mb-3 line-clamp-3">{comment.comment}</p>

                    {/* Resimler */}
                    {comment.images && comment.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {comment.images.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={`${apiBaseUrl}${imageUrl}`}
                            alt={`Yorum resmi ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {comment.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateCommentStatus(comment.id, 'approved')}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Onayla
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={actionLoading}>
                                <XCircle size={16} className="mr-1" />
                                Reddet
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Yorumu Reddet</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection-reason">Ret Sebebi (Opsiyonel)</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Neden reddedildiğini açıklayın..."
                                    maxLength={500}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => updateCommentStatus(comment.id, 'rejected', rejectionReason)}
                                    disabled={actionLoading}
                                    variant="destructive"
                                  >
                                    Reddet
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye size={16} className="mr-1" />
                            Detay
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Yorum Detayı</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><strong>Kullanıcı:</strong> {comment.user_name}</div>
                              <div><strong>E-posta:</strong> {comment.user_email}</div>
                              <div><strong>Puan:</strong> {renderStars(comment.rating)}</div>
                              <div><strong>Durum:</strong> {getStatusBadge(comment.status)}</div>
                              <div><strong>Tarih:</strong> {new Date(comment.created_at).toLocaleString('tr-TR')}</div>
                              <div><strong>Resim Sayısı:</strong> {comment.image_count}</div>
                            </div>
                            
                            <div>
                              <strong>Yorum:</strong>
                              <p className="mt-1 p-3 bg-gray-50 rounded">{comment.comment}</p>
                            </div>

                            {comment.images && comment.images.length > 0 && (
                              <div>
                                <strong>Resimler:</strong>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                  {comment.images.map((imageUrl, index) => (
                                    <img
                                      key={index}
                                      src={`${apiBaseUrl}${imageUrl}`}
                                      alt={`Yorum resmi ${index + 1}`}
                                      className="w-full h-20 object-cover rounded border"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Ban size={16} className="mr-1" />
                                    Kullanıcıyı Yasakla
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Kullanıcıyı Yasakla</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="ban-reason">Yasak Sebebi</Label>
                                      <Textarea
                                        id="ban-reason"
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        placeholder="Neden yasaklandığını açıklayın..."
                                        maxLength={500}
                                      />
                                    </div>
                                    <Button
                                      onClick={() => toggleUserBan(comment.user_id, 'ban', banReason)}
                                      disabled={actionLoading}
                                      variant="destructive"
                                    >
                                      Yasakla
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleUserBan(comment.user_id, 'unban')}
                                disabled={actionLoading}
                              >
                                <UnlockKeyhole size={16} className="mr-1" />
                                Yasağı Kaldır
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}