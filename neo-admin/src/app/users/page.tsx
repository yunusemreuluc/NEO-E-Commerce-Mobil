'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

interface UserStats {
  total_reviews: number;
  approved_reviews: number;
  pending_reviews: number;
  rejected_reviews: number;
  avg_rating: string;
}

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState({
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.search) params.append('search', filter.search);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`${API_BASE_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (response.ok) {
        const result: UsersResponse = await response.json();
        if (result.success && result.data) {
          setUsers(result.data.users);
          setPagination(result.data.pagination);
        }
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSelectedUser(result.data.user);
          setUserStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error('Kullanıcı detayları yüklenirken hata:', error);
    }
  };

  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, is_active: isActive });
        }
      }
    } catch (error) {
      console.error('Kullanıcı durumu güncellenirken hata:', error);
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, role: role as 'user' | 'admin' });
        }
      }
    } catch (error) {
      console.error('Kullanıcı rolü güncellenirken hata:', error);
    }
  };

  const deleteUser = async (userId: number, userName: string, userEmail: string) => {
    if (!confirm(`"${userName}" (${userEmail}) kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.`)) {
      return;
    }

    setDeletingId(userId);

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || 'Kullanıcı silinemedi';
        throw new Error(message);
      }

      alert(data.message || 'Kullanıcı başarıyla silindi');
      fetchUsers(); // Listeyi yenile
      
      // Eğer silinen kullanıcı seçili ise, seçimi temizle
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setUserStats(null);
      }

    } catch (err) {
      console.error('Kullanıcı silme hatası:', err);
      alert(err instanceof Error ? err.message : 'Kullanıcı silinirken hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filter]);

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      admin: 'Admin',
      user: 'Kullanıcı'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Aktif' : 'Pasif'}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
        <p className="text-gray-600">Kullanıcıları görüntüleyin ve yönetin</p>
      </div>

      {/* Arama */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Kullanıcı ara (isim veya e-posta)..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kullanıcılar Listesi */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr 
                      key={user.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => fetchUserDetails(user.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateUserStatus(user.id, !user.is_active);
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              user.is_active 
                                ? 'text-red-600 hover:text-red-900 bg-red-50' 
                                : 'text-green-600 hover:text-green-900 bg-green-50'
                            }`}
                          >
                            {user.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(user.id, user.name, user.email);
                            }}
                            disabled={deletingId === user.id}
                            className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded disabled:opacity-50 flex items-center gap-1"
                          >
                            {deletingId === user.id ? (
                              <>
                                <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                Siliniyor...
                              </>
                            ) : (
                              <>
                                🗑️ Sil
                              </>
                            )}
                          </button>
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kullanıcı Detayları */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Kullanıcı Detayları
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">İsim</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <div className="mt-1 flex gap-2">
                    {getRoleBadge(selectedUser.role)}
                    <select
                      value={selectedUser.role}
                      onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedUser.is_active)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              {userStats && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Yorum İstatistikleri
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Toplam:</span>
                      <span className="ml-2 font-medium">{userStats.total_reviews}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Onaylı:</span>
                      <span className="ml-2 font-medium text-green-600">{userStats.approved_reviews}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Beklemede:</span>
                      <span className="ml-2 font-medium text-yellow-600">{userStats.pending_reviews}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reddedilen:</span>
                      <span className="ml-2 font-medium text-red-600">{userStats.rejected_reviews}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Ortalama Puan:</span>
                      <span className="ml-2 font-medium">{userStats.avg_rating}/5</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-center">
                Detayları görmek için bir kullanıcı seçin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}