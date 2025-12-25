"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config/api";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state'leri
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    sort_order: 0
  });

  // Kategorileri yükle
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriesRes = await fetch(`${API_BASE_URL}/products/categories/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data?.categories || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Slug otomatik oluştur
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Form alanlarını güncelle
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Name değiştiğinde slug'ı otomatik güncelle
      if (field === 'name') {
        newData.slug = generateSlug(value);
      }
      
      return newData;
    });
  };

  // Form temizle
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      is_active: true,
      sort_order: 0
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  // Yeni form aç
  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  // Düzenleme için formu doldur
  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  // Kategori kaydet/güncelle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('Kategori adı gerekli');
      }

      const url = editingCategory 
        ? `${API_BASE_URL}/products/categories/admin/${editingCategory.id}`
        : `${API_BASE_URL}/products/categories/admin`;
      
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          parent_id: null // Ana kategori olarak kaydet
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Kategori kaydedilirken hata oluştu');
      }

      const result = await res.json();
      alert(result.message || `Kategori başarıyla ${editingCategory ? 'güncellendi' : 'eklendi'}`);
      await loadData();
      resetForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      alert(`Hata: ${errorMessage}`);
    }
  };

  // Kategori sil
  const deleteCategory = async (id: number) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/products/categories/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Kategori silinirken hata oluştu');
      }

      const result = await res.json();
      alert(result.message || 'Kategori başarıyla silindi');
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      setError(errorMessage);
      alert(`Hata: ${errorMessage}`);
    }
  };

  // Sadece ana kategorileri göster
  const mainCategories = categories.filter(cat => !cat.parent_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">🏷️</span>
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">Ürün kategorilerini organize edin</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {mainCategories.length} Kategori
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0)} Toplam Ürün
            </div>
          </div>
        </div>
        <button
          onClick={openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg">🏷️</span>
          Kategori Ekle
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <span className="text-red-700 font-medium">Hata:</span>
            <span className="text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Kategori Düzenle' : 'Kategori Ekle'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="örn: Elektronik"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="elektronik"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kategori açıklaması"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sıralama
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => updateFormData('sort_order', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Resmi (URL)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => updateFormData('image_url', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => updateFormData('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">✅ Aktif</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {editingCategory ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Kategori Listesi
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500">Yükleniyor...</span>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mainCategories.map((category) => (
              <div key={category.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {category.image_url && (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Kategori
                        </span>
                        {!category.is_active && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Pasif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {category.description || 'Açıklama yok'} • {category.product_count || 0} ürün
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Slug: {category.slug} • Sıra: {category.sort_order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {mainCategories.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">🏷️</span>
                <p className="text-gray-500">Henüz kategori bulunmuyor</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}