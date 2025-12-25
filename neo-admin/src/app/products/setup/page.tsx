'use client';

import { useState } from 'react';
import { API_BASE_URL } from '../../../config/api';



export default function ProductSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const setupEnhancedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`${API_BASE_URL}/products/admin/setup-enhanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kurulum başarısız');
      }

      setResult(data);
    } catch (err) {
      console.error('Kurulum hatası:', err);
      setError(err instanceof Error ? err.message : 'Kurulum sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Gelişmiş Ürün Sistemi Kurulumu
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Bu kurulum şunları ekleyecek:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Ürün Bilgileri</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Detaylı açıklama</li>
                <li>• Kısa açıklama</li>
                <li>• Marka bilgisi</li>
                <li>• SKU kodu</li>
                <li>• Ağırlık ve boyutlar</li>
                <li>• Malzeme bilgisi</li>
                <li>• Renk ve beden</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Sistem Özellikleri</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Kategori sistemi</li>
                <li>• Ürün özellikleri</li>
                <li>• Çoklu resim desteği</li>
                <li>• Ürün varyantları</li>
                <li>• Yorum sistemi</li>
                <li>• Stok takibi</li>
                <li>• İndirim sistemi</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Önemli Uyarı
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Bu işlem veritabanında yeni tablolar oluşturacak ve mevcut products tablosuna yeni kolonlar ekleyecektir.
                    İşlem geri alınamaz, bu yüzden önceden veritabanı yedeği almanız önerilir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={setupEnhancedProducts}
            disabled={loading}
            className={`px-6 py-3 rounded-md font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kuruluyor...
              </div>
            ) : (
              'Gelişmiş Ürün Sistemini Kur'
            )}
          </button>
        </div>

        {/* Sonuç Gösterimi */}
        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Kurulum Başarılı!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p className="mb-2">{result.message}</p>
                  <div>
                    <strong>Eklenen özellikler:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {result.data?.features?.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hata Gösterimi */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Kurulum Hatası
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sonraki Adımlar */}
        {result && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Sonraki Adımlar
            </h3>
            <div className="text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Ürünler sayfasına gidip yeni özellikleri kontrol edin</li>
                <li>Kategorileri düzenleyin ve yeni kategoriler ekleyin</li>
                <li>Mevcut ürünlere detaylı bilgiler ekleyin</li>
                <li>Ürün varyantları (beden, renk) tanımlayın</li>
                <li>Ürün resimlerini çoklu resim sistemi ile güncelleyin</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}