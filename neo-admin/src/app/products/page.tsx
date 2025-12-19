"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ProductRow = {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  price: number;
  discount: number | null;
  stock: number;
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
      const res = await fetch(`${API_BASE_URL}/products`, {
        cache: "no-store",
      });

      // res.ok değilse message alıp hata bas
      if (!res.ok) {
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

      const data: unknown = await res.json();

      // 👇 Kritik kısım: Array değilse boş array’e düş
      const list = Array.isArray(data)
        ? (data as ProductRow[])
        : Array.isArray((data as any)?.rows)
          ? ((data as any).rows as ProductRow[])
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

      // UI’dan kaldır
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
            <div className="neo-badge neo-badge-info neo-badge-sm">
              {products.length} Toplam Ürün
            </div>
            <div className="neo-badge neo-badge-success neo-badge-sm">
              {products.filter(p => p.stock > 0).length} Stokta
            </div>
            <div className="neo-badge neo-badge-warning neo-badge-sm">
              {products.filter(p => p.stock === 0).length} Tükendi
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/products/categories"
            className="btn-secondary"
          >
            <span className="text-lg">🏷️</span>
            Kategoriler
          </Link>
          <Link
            href="/products/new"
            className="btn-primary btn-lg"
          >
            <span className="text-xl">+</span>
            Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {err && (
        <div className="neo-card border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <span className="text-red-700 font-medium">Hata:</span>
            <span className="text-red-600">{err}</span>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="neo-card-elevated overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Ürün Listesi
          </h3>
        </div>
        <table className="neo-table">
          <thead>
            <tr>
              <th className="w-16">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🆔</span>
                  ID
                </div>
              </th>
              <th className="w-20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🖼️</span>
                  Görsel
                </div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <span className="text-sm">📝</span>
                  Ürün Adı
                </div>
              </th>
              <th className="w-32">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏷️</span>
                  Kategori
                </div>
              </th>
              <th className="w-32">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💰</span>
                  Fiyat
                </div>
              </th>
              <th className="w-20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📦</span>
                  Stok
                </div>
              </th>
              <th className="w-32 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">⚙️</span>
                  İşlemler
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
                <tr key={p.id}>
                  <td className="font-mono text-sm text-gray-500">#{p.id}</td>
                  
                  <td>
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={p.image_url || "https://picsum.photos/seed/neo/200/200"}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://picsum.photos/seed/neo/200/200";
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    <div className="font-medium text-gray-900">{p.name}</div>
                  </td>
                  
                  <td>
                    <span className="neo-badge neo-badge-info">{p.category}</span>
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {Number(p.price).toFixed(2)} ₺
                      </span>
                      {p.discount != null && (
                        <span className="neo-badge neo-badge-danger">
                          -%{p.discount}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className={`neo-badge ${
                      p.stock > 10 ? 'neo-badge-success' : 
                      p.stock > 0 ? 'neo-badge-warning' : 'neo-badge-danger'
                    }`}>
                      {p.stock}
                    </span>
                  </td>

                  <td>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="btn-info btn-sm"
                      >
                        <span className="text-sm">✏️</span>
                        Düzenle
                      </Link>
                      <button
                        onClick={() => onDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="btn-danger btn-sm"
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
