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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ürünler</h1>
        <Link
          href="/products/new"
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          + Yeni Ürün
        </Link>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-200">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Görsel</div>
          <div className="col-span-3">Ad</div>
          <div className="col-span-2">Kategori</div>
          <div className="col-span-2">Fiyat</div>
          <div className="col-span-1">Stok</div>
          <div className="col-span-1 text-right">İşlem</div>
        </div>

        {loading ? (
          <div className="p-5 text-zinc-400">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="p-5 text-zinc-400">Ürün yok.</div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm items-center hover:bg-zinc-900/40"
              >
                <div className="col-span-1 text-zinc-200">{p.id}</div>

                <div className="col-span-2">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
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
                </div>

                <div className="col-span-3 text-zinc-100">{p.name}</div>
                <div className="col-span-2 text-zinc-300">{p.category}</div>

                <div className="col-span-2 text-zinc-100">
                  {Number(p.price).toFixed(2)} ₺
                  {p.discount != null ? (
                    <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-200">
                      -%{p.discount}
                    </span>
                  ) : null}
                </div>

                <div className="col-span-1 text-zinc-200">{p.stock}</div>

                <div className="col-span-1 flex justify-end gap-2">
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200 hover:bg-zinc-900"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => onDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="rounded-md bg-red-500 px-2 py-1 text-white hover:bg-red-600 disabled:opacity-60"
                  >
                    {deletingId === p.id ? "..." : "Sil"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
