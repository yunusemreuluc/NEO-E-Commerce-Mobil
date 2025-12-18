"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  images: string[] | null;
  price: number;
  old_price: number | null;
  discount: number | null;
  stock: number;
  is_active: number;
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("Moda");
  const [stock, setStock] = useState("0");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [files, setFiles] = useState<(File | null)[]>([null]);

  // İndirimli fiyat otomatik hesap (indirim varsa)
  const calculatedNewPrice = useMemo(() => {
    const p = Number(price);
    const d = Number(discount);

    if (!p || p <= 0) return p || 0;
    if (!d || d <= 0 || d >= 100) return p;

    // Girilen fiyat eski fiyat, yeni fiyatı hesapla
    const newPrice = p - (p * d / 100);
    return Number(newPrice.toFixed(2));
  }, [price, discount]);

  // ürün verisini çek
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Ürün bulunamadı.");
          return;
        }

        const p = (await res.json()) as ApiProduct;

        setName(p.name ?? "");
        setPrice(p.price != null ? String(p.price) : "");
        setDiscount(p.discount != null ? String(p.discount) : "");
        setCategory(p.category ?? "Moda");
        setStock(p.stock != null ? String(p.stock) : "0");
        
        // Çoklu resim desteği
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          setImageUrls(p.images);
          setFiles(new Array(p.images.length).fill(null));
        } else if (p.image_url) {
          setImageUrls([p.image_url]);
          setFiles([null]);
        } else {
          setImageUrls([""]);
          setFiles([null]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bilinmeyen hata.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const previews = useMemo(() => {
    return imageUrls.map((url, index) => {
      const file = files[index];
      if (file) return URL.createObjectURL(file);
      if (url?.trim()) return url.trim();
      return "";
    });
  }, [files, imageUrls]);

  const addImageSlot = () => {
    setImageUrls([...imageUrls, ""]);
    setFiles([...files, null]);
  };

  const removeImageSlot = (index: number) => {
    if (imageUrls.length <= 1) return;
    setImageUrls(imageUrls.filter((_, i) => i !== index));
    setFiles(files.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const updateFile = (index: number, file: File | null) => {
    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);
  };

  const uploadFilesIfNeeded = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const file = files[i];
      const url = imageUrls[i];
      
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        
        const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`${i + 1}. görsel yüklenemedi.`);
        
        const data = (await res.json()) as { url: string };
        uploadedUrls.push(data.url);
      } else if (url?.trim()) {
        uploadedUrls.push(url.trim());
      }
    }
    
    return uploadedUrls.filter(url => url.length > 0);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const finalImageUrls = await uploadFilesIfNeeded();

      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          discount: discount ? Number(discount) : null,
          category,
          image_url: finalImageUrls[0] || "https://picsum.photos/seed/neo/600/600",
          images: finalImageUrls,
          stock: Number(stock),
          is_active: 1,
        }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);

        const message =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Güncelleme başarısız.";

        throw new Error(message);
      }

      router.push("/products");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bilinmeyen hata.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Yükleniyor...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ürün Güncelle</h1>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={onSave}
        className="max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6"
      >
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className="mb-1 block text-sm text-zinc-300">Ürün Adı</label>
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Fiyat (₺)</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              İndirim % (ops.)
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Örn: 20"
            />
          </div>

          {Number(discount) > 0 && (
            <div className="col-span-2">
              <label className="mb-1 block text-sm text-zinc-400">
                İndirimli Fiyat (Otomatik Hesaplanan)
              </label>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-green-400">
                {calculatedNewPrice.toFixed(2)} ₺
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Girdiğiniz fiyat eski fiyat, indirimli fiyat otomatik hesaplanır.
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Stok</label>
            <input
              type="number"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Kategori</label>
            <select
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Moda">Moda</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Ev">Ev</option>
              <option value="Spor">Spor</option>
              <option value="Ofis">Ofis</option>
            </select>
          </div>

          <div className="col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm text-zinc-300">Ürün Görselleri</label>
              <button
                type="button"
                onClick={addImageSlot}
                className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                + Görsel Ekle
              </button>
            </div>

            <div className="space-y-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Görsel {index + 1}</span>
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageSlot(index)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                    
                    <input
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder="https://..."
                    />

                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateFile(index, e.target.files?.[0] ?? null)}
                        className="block w-full text-xs text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-2">
                    {previews[index] ? (
                      <div className="relative h-32 w-full">
                        <img
                          src={previews[index]}
                          alt={`preview ${index + 1}`}
                          className="h-full w-full rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden grid h-32 place-items-center rounded border border-dashed border-zinc-700 text-xs text-zinc-600">
                          Resim yüklenemedi
                        </div>
                      </div>
                    ) : (
                      <div className="grid h-32 place-items-center rounded border border-dashed border-zinc-700 text-xs text-zinc-600">
                        Görsel yok
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-500 px-5 py-2 text-white hover:bg-red-600 disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Güncelle"}
          </button>
        </div>
      </form>
    </div>
  );
}
