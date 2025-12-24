"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.241.81.212:4000";

type ProductRow = {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  brand?: string;
  category_name?: string;
  category_slug?: string;
  image_url: string | null;
  primary_image?: string;
  price: number;
  sale_price?: number;
  discount_percentage?: number;
  stock_quantity?: number;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setErr('Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/products?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setErr('Token süresi dolmuş. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setLoading(false);
          return;
        }
        
        const data: unknown = await res.json().catch(() => null);
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Ürünler alınamadı.";
        throw new Error(message);
      }

      const data: any = await res.json();

      // Yeni API yapısına göre products array'ini al
      const list = data.success && Array.isArray(data.data?.products) 
        ? data.data.products as ProductRow[]
        : [];

      setProducts(list);
    } catch (e: unknown) {
      setProducts([]);
      setErr(e instanceof Error ? e.message : "Bilinmeyen hata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    if (!confirm("Bu ürünü silmek istiyor musun?")) return;

    setDeletingId(id);
    setErr(null);

    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Silme başarısız.";
        throw new Error(message);
      }

      // UI'dan kaldır
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Bilinmeyen hata.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">📦</span>
            Ürünler
          </h1>
          <p className="text-gray-600 mt-2">Mağaza ürünlerinizi yönetin ve düzenleyin</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {products.length} Toplam Ürün
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {products.filter(p => (p.stock_quantity || 0) > 0).length} Stokta
            </div>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {products.filter(p => (p.stock_quantity || 0) === 0).length} Tükendi
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {products.filter(p => p.is_featured).length} Öne Çıkan
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/products/categories"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🏷️</span>
            Kategoriler
          </Link>
          <Link
            href="/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <span className="text-red-700 font-medium">Hata:</span>
            <span className="text-red-600">{err}</span>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Ürün Listesi
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🆔</span>
                  ID
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🖼️</span>
                  Görsel
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📝</span>
                  Ürün Bilgileri
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏷️</span>
                  Kategori & Marka
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💰</span>
                  Fiyat
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📦</span>
                  Stok & Durum
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">⚙️</span>
                  İşlemler
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Yükleniyor...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="text-gray-500">
                    <span className="text-4xl mb-2 block">📦</span>
                    Henüz ürün bulunmuyor
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-500">#{p.id}</span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={p.primary_image || p.image_url || "https://picsum.photos/seed/neo/200/200"}
                        alt={p.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://picsum.photos/seed/neo/200/200";
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                        {p.short_description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {p.short_description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {p.is_featured && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              ⭐ Öne Çıkan
                            </span>
                          )}
                          {p.rating && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              ⭐ {Number(p.rating).toFixed(1)} ({p.review_count || 0})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {p.category_name && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium block w-fit">
                          {p.category_name}
                        </span>
                      )}
                      {p.brand && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium block w-fit">
                          {p.brand}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        ₺{Number(p.price).toFixed(2)}
                      </div>
                      {p.sale_price && p.sale_price !== p.price && (
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">
                            ₺{Number(p.sale_price).toFixed(2)}
                          </span>
                          {p.discount_percentage && (
                            <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-medium ml-1">
                              -%{p.discount_percentage}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (p.stock_quantity || 0) > 10 ? 'bg-green-100 text-green-800' : 
                        (p.stock_quantity || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        📦 {p.stock_quantity || 0}
                      </span>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {p.is_active ? '✅ Aktif' : '❌ Pasif'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <span className="text-sm">✏️</span>
                        Düzenle
                      </Link>
                      <button
                        onClick={() => onDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {deletingId === p.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="text-sm">🗑️</span>
                            Sil
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}