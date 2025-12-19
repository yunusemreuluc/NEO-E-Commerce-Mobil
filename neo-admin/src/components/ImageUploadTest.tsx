'use client';

import { useState } from 'react';

export default function ImageUploadTest() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Dosya seçme ve URL'ye çevirme
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const newUrls: string[] = [];

    Array.from(files).forEach((file) => {
      // Dosya tipini kontrol et
      if (!file.type.startsWith('image/')) {
        alert('Sadece resim dosyaları seçebilirsiniz!');
        return;
      }

      // Dosya boyutunu kontrol et (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Resim boyutu 5MB\'dan küçük olmalı!');
        return;
      }

      // FileReader ile Base64'e çevir
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        // Base64 boyut kontrolü (10MB max frontend'de)
        if (base64String.length > 10 * 1024 * 1024) {
          alert(`Resim çok büyük: ${Math.round(base64String.length / 1024 / 1024)}MB. Maksimum 10MB olmalı.`);
          return;
        }
        
        newImages.push(base64String);
        
        // Blob URL oluştur (daha performanslı)
        const blobUrl = URL.createObjectURL(file);
        newUrls.push(blobUrl);
        
        // State'i güncelle
        setSelectedImages(prev => [...prev, base64String]);
        setImageUrls(prev => [...prev, blobUrl]);
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Resmi sil
  const removeImage = (index: number) => {
    // Blob URL'yi temizle (memory leak önleme)
    URL.revokeObjectURL(imageUrls[index]);
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Backend'e gönderme fonksiyonu (Yeni URL sistemi)
  const uploadToBackend = async () => {
    if (selectedImages.length === 0) {
      alert('Önce resim seçin!');
      return;
    }

    try {
      // Resimleri tipine göre hazırla
      const processedImages = selectedImages.map((imageData, index) => {
        // URL tipini belirle
        if (imageData.startsWith('data:')) {
          // Base64 resim
          return {
            type: 'base64',
            data: imageData,
            originalName: `base64_image_${index + 1}`,
            mimeType: imageData.split(';')[0].split(':')[1] || 'image/jpeg'
          };
        } else if (imageData.startsWith('http')) {
          // Harici URL
          return {
            type: 'url',
            url: imageData,
            originalName: imageData.split('/').pop() || `url_image_${index + 1}`,
            mimeType: 'image/jpeg'
          };
        } else {
          // Dosya yolu (eski sistem)
          return {
            type: 'file',
            data: imageData,
            originalName: `file_image_${index + 1}`,
            mimeType: 'image/jpeg'
          };
        }
      });

      // URL tabanlı sistem kullan
      const response = await fetch('http://10.8.0.222:4000/comments/url-review-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: 1,
          rating: 5,
          comment: 'Test yorumu - URL tabanlı resimlerle (Karışık tip)',
          images: processedImages
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Başarılı! ${result.data.imageCount} resim URL olarak kaydedildi.`);
        console.log('Kaydedilen URL\'ler:', result.data.images);
        console.log('Resim tipleri:', result.data.imageTypes);
        
        // Formu temizle
        imageUrls.forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        setSelectedImages([]);
        setImageUrls([]);
      } else {
        alert('Yükleme başarısız: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Yükleme sırasında hata oluştu');
    }
  };

  // Harici URL ekleme fonksiyonu
  const addExternalUrl = () => {
    const url = prompt('Resim URL\'si girin (örn: https://example.com/image.jpg):');
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      // URL'yi hem selectedImages hem imageUrls'e ekle
      setSelectedImages(prev => [...prev, url]);
      setImageUrls(prev => [...prev, url]);
    } else if (url) {
      alert('Geçerli bir URL girin (http:// veya https:// ile başlamalı)');
    }
  };

  return (
    <div className="neo-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Resim Upload Test</h2>
        <p className="text-gray-600">Masaüstü, telefon kamerası veya galeriden resim seçin</p>
      </div>

      {/* Dosya Seçici */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resim Seç (Çoklu seçim mümkün)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment" // Telefonda kamera açar
          onChange={handleImageSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
        <div className="text-xs text-gray-500 mt-1">
          • Maksimum 5MB per resim<br/>
          • JPG, PNG, WebP formatları desteklenir<br/>
          • Telefonda "capture" özelliği kamerayı açar
        </div>
      </div>

      {/* Seçilen Resimler */}
      {imageUrls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Seçilen Resimler ({imageUrls.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Seçilen resim ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Bilgileri */}
      {selectedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">URL Bilgileri</h3>
          <div className="space-y-2">
            {selectedImages.map((imageData, index) => {
              const isBase64 = imageData.startsWith('data:');
              const isExternalUrl = imageData.startsWith('http');
              const imageType = isBase64 ? 'Base64' : isExternalUrl ? 'Harici URL' : 'Dosya';
              
              return (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Resim {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        isBase64 ? 'bg-blue-100 text-blue-800' :
                        isExternalUrl ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {imageType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(imageData.length / 1024)} KB
                      </span>
                    </div>
                  </div>
                  
                  {isBase64 && (
                    <>
                      <div className="text-xs text-gray-600 break-all">
                        <strong>Base64 Data:</strong> {imageData.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-gray-600 break-all mt-1">
                        <strong>Blob URL:</strong> {imageUrls[index]}
                      </div>
                    </>
                  )}
                  
                  {isExternalUrl && (
                    <div className="text-xs text-gray-600 break-all">
                      <strong>Harici URL:</strong> {imageData}
                    </div>
                  )}
                  
                  {!isBase64 && !isExternalUrl && (
                    <div className="text-xs text-gray-600 break-all">
                      <strong>Dosya Yolu:</strong> {imageData}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Harici URL Ekleme */}
      <div>
        <button
          onClick={addExternalUrl}
          className="btn-secondary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Harici URL Ekle
        </button>
        <div className="text-xs text-gray-500 mt-1">
          İnternetten resim URL'si ekleyin (örn: Unsplash, Pixabay)
        </div>
      </div>

      {/* Upload Butonu */}
      {selectedImages.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={uploadToBackend}
            className="btn-primary"
          >
            Backend'e Yükle ({selectedImages.length} resim)
          </button>
          <button
            onClick={() => {
              // Tüm Blob URL'leri temizle (sadece blob URL'ler için)
              imageUrls.forEach(url => {
                if (url.startsWith('blob:')) {
                  URL.revokeObjectURL(url);
                }
              });
              setSelectedImages([]);
              setImageUrls([]);
            }}
            className="btn-outline"
          >
            Temizle
          </button>
        </div>
      )}

      {/* Bilgi Kutusu */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 URL Tabanlı Resim Sistemi</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Dosya Seçimi:</strong> Masaüstü/telefon kamerası → Base64 URL</li>
          <li>• <strong>Harici URL:</strong> İnternet resmi → Direkt URL referansı</li>
          <li>• <strong>Base64:</strong> Resim veritabanında text olarak saklanır</li>
          <li>• <strong>URL Referans:</strong> Sadece link saklanır, dosya yok</li>
          <li>• <strong>Avantaj:</strong> Dosya sistemi kullanmadan resim yönetimi</li>
          <li>• <strong>Performans:</strong> Base64 büyük, URL küçük ama bağımlı</li>
        </ul>
      </div>
    </div>
  );
}