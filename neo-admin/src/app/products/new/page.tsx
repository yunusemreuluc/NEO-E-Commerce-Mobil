"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.241.81.212:4000";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
}

interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'color' | 'size';
  is_filterable: boolean;
}

interface ProductVariant {
  name: string;
  value: string;
  price_adjustment: number;
  stock_quantity: number;
  sku?: string;
}

interface ProductImage {
  url: string;
  alt_text: string;
  is_primary: boolean;
}

export default function NewProductPage() {
  const router = useRouter();

  // Temel ürün bilgileri
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [sku, setSku] = useState("");
  
  // Fiziksel özellikler
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  
  // Stok ve durum
  const [stockQuantity, setStockQuantity] = useState("0");
  const [minStockLevel, setMinStockLevel] = useState("5");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Resimler
  const [images, setImages] = useState<ProductImage[]>([
    { url: "", alt_text: "", is_primary: true }
  ]);
  
  // Özellikler
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    { name: "", value: "", type: "text", is_filterable: false }
  ]);
  
  // Varyantlar
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  // Kategoriler
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI durumları
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/categories/list`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data?.categories || []);
        }
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Resim ekleme/çıkarma
  const addImage = () => {
    setImages([...images, { url: "", alt_text: "", is_primary: false }]);
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const updateImage = (index: number, field: keyof ProductImage, value: string | boolean) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    
    // Eğer bu resim primary yapılıyorsa, diğerlerini false yap
    if (field === 'is_primary' && value === true) {
      newImages.forEach((img, i) => {
        if (i !== index) img.is_primary = false;
      });
    }
    
    setImages(newImages);
  };

  // Özellik ekleme/çıkarma
  const addAttribute = () => {
    setAttributes([...attributes, { name: "", value: "", type: "text", is_filterable: false }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof ProductAttribute, value: any) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  // Varyant ekleme/çıkarma
  const addVariant = () => {
    setVariants([...variants, { name: "", value: "", price_adjustment: 0, stock_quantity: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // Tag ekleme/çıkarma
  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validasyon
      if (!name.trim()) throw new Error("Ürün adı gerekli");
      if (!price || Number(price) <= 0) throw new Error("Geçerli bir fiyat girin");

      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        short_description: shortDescription.trim() || null,
        brand: brand.trim() || null,
        category_id: categoryId,
        price: Number(price),
        discount_percentage: discountPercentage ? Number(discountPercentage) : 0,
        sku: sku.trim() || null,
        weight: weight ? Number(weight) : null,
        dimensions: dimensions.trim() || null,
        material: material.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        stock_quantity: Number(stockQuantity),
        min_stock_level: Number(minStockLevel),
        is_featured: isFeatured,
        tags: tags.length > 0 ? tags : null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        image_url: images[0]?.url || null,
        images: images.filter(img => img.url.trim()),
        attributes: attributes.filter(attr => attr.name.trim() && attr.value.trim()),
        variants: variants.filter(variant => variant.name.trim() && variant.value.trim())
      };

      const res = await fetch(`${API_BASE_URL}/products/admin`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Ürün kaydedilirken hata oluştu");
      }

      router.push("/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Temel Bilgiler", icon: "📝" },
    { id: "details", label: "Detaylar", icon: "📋" },
    { id: "images", label: "Resimler", icon: "🖼️" },
    { id: "attributes", label: "Özellikler", icon: "🏷️" },
    { id: "variants", label: "Varyantlar", icon: "🎨" },
    { id: "seo", label: "SEO", icon: "🔍" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">➕</span>
            Yeni Ürün Ekle
          </h1>
          <p className="text-gray-600 mt-2">Gelişmiş ürün sistemi ile detaylı ürün bilgileri ekleyin</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          ← Geri Dön
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Temel Bilgiler Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kısa Açıklama
                    </label>
                    <textarea
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürünün kısa açıklaması (liste görünümünde gösterilir)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detaylı Açıklama
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürünün detaylı açıklaması"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marka
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İndirim Yüzdesi (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {discountPercentage && price && (
                      <p className="text-sm text-green-600 mt-1">
                        İndirimli Fiyat: ₺{(Number(price) * (1 - Number(discountPercentage) / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU Kodu
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürün kodu"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stok Miktarı
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stok Seviyesi
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">⭐ Öne Çıkan Ürün</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">✅ Aktif</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detaylar Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ağırlık (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boyutlar (cm)
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="örn: 20x15x10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Malzeme
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="örn: %100 Pamuk"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Renk
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beden
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resimler Tab */}
            {activeTab === "images" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Ürün Resimleri</h3>
                  <button
                    type="button"
                    onClick={addImage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    + Resim Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Resim {index + 1} {image.is_primary && "(Ana Resim)"}
                        </span>
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Resim URL'si
                            </label>
                            <input
                              type="url"
                              value={image.url}
                              onChange={(e) => updateImage(index, 'url', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alt Metin
                            </label>
                            <input
                              type="text"
                              value={image.alt_text}
                              onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Resim açıklaması"
                            />
                          </div>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={image.is_primary}
                              onChange={(e) => updateImage(index, 'is_primary', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Ana resim olarak ayarla</span>
                          </label>
                        </div>

                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32">
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={image.alt_text || `Resim ${index + 1}`}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400">Resim önizlemesi</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Özellikler Tab */}
            {activeTab === "attributes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Ürün Özellikleri</h3>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    + Özellik Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {attributes.map((attr, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Özellik {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Kaldır
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Özellik Adı
                          </label>
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="örn: Malzeme"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Değer
                          </label>
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="örn: %100 Pamuk"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tip
                          </label>
                          <select
                            value={attr.type}
                            onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="text">Metin</option>
                            <option value="number">Sayı</option>
                            <option value="boolean">Evet/Hayır</option>
                            <option value="color">Renk</option>
                            <option value="size">Beden</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={attr.is_filterable}
                              onChange={(e) => updateAttribute(index, 'is_filterable', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Filtrelenebilir</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Varyantlar Tab */}
            {activeTab === "variants" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Ürün Varyantları</h3>
                    <p className="text-sm text-gray-500 mt-1">Farklı beden, renk veya stil seçenekleri ekleyin</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    + Varyant Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Varyant {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Kaldır
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Varyant Adı
                          </label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="örn: Beden"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Değer
                          </label>
                          <input
                            type="text"
                            value={variant.value}
                            onChange={(e) => updateVariant(index, 'value', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="örn: M"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fiyat Farkı (₺)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.price_adjustment}
                            onChange={(e) => updateVariant(index, 'price_adjustment', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stok
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock_quantity}
                            onChange={(e) => updateVariant(index, 'stock_quantity', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={variant.sku || ""}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Varyant kodu"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Başlık
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO için sayfa başlığı"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {metaTitle.length}/60 karakter (önerilen: 50-60)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Açıklama
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO için sayfa açıklaması"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {metaDescription.length}/160 karakter (önerilen: 150-160)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiketler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Etiket yazın ve Enter'a basın"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <span>💾</span>
                Ürünü Kaydet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}