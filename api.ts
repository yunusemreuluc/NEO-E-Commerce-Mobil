import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ApiProduct } from "./types/Product";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://10.106.118.212:4000";

// Token'ı header'a ekleyen yardımcı fonksiyon
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Products API
export async function getProducts(): Promise<ApiProduct[]> {
  const url = `${API_BASE_URL}/products`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text || "response yok"}`);
    }

    const data: unknown = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("API array dönmedi. /products response formatını kontrol et.");
    }

    return data as ApiProduct[];
  } catch (err) {
    throw new Error("Ürünler yüklenirken bir hata oluştu");
  }
}

export async function getProduct(id: number): Promise<ApiProduct> {
  const url = `${API_BASE_URL}/products/${id}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text || "response yok"}`);
    }

    return await res.json();
  } catch (err) {
    throw new Error("Ürün yüklenirken bir hata oluştu");
  }
}

// Auth API
export async function loginUser(email: string, password: string) {
  const url = `${API_BASE_URL}/auth/login`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Giriş başarısız');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export async function registerUser(name: string, email: string, password: string) {
  const url = `${API_BASE_URL}/auth/register`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Kayıt başarısız');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Reviews API - Gelişmiş Yorum Sistemi
export async function getProductReviews(productId: number) {
  const url = `${API_BASE_URL}/comments/product/${productId}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text || "response yok"}`);
    }

    const data = await res.json();
    return data.success ? data.data : { reviews: [], stats: { average_rating: 0, total_reviews: 0 } };
  } catch (err) {
    throw new Error("Yorumlar yüklenirken bir hata oluştu");
  }
}

export async function addReview(productId: number, rating: number, comment: string) {
  const url = `${API_BASE_URL}/comments`;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Yorum eklenirken hata oluştu');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Test fonksiyonu
export async function testCommentEndpoint() {
  const url = `${API_BASE_URL}/comments/test`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });

    const data = await res.json();
    // Test endpoint yanıtı alındı
    return data;
  } catch (error) {
    console.error('Test endpoint hatası:', error);
    throw error;
  }
}

// Test yorum gönderme (auth olmadan)
export async function testReviewSubmit(productId: number, rating: number, comment: string) {
  const url = `${API_BASE_URL}/comments/test-review`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment
      })
    });

    const data = await res.json();
    // Test yorum yanıtı alındı
    return data;
  } catch (error) {
    console.error('Test yorum hatası:', error);
    throw error;
  }
}

// Backend endpoint kontrolü
async function checkEndpointExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'OPTIONS' });
    return response.status !== 404;
  } catch {
    return false;
  }
}

// Test resimli yorum gönderme (auth gerektirmez)
export async function testReviewWithImages(
  productId: number, 
  rating: number, 
  comment: string, 
  images: any[]
) {
  const url = `${API_BASE_URL}/comments/test-review-images`;
  
  // Endpoint'in mevcut olup olmadığını kontrol et
  const endpointExists = await checkEndpointExists(url);
  if (!endpointExists) {
    throw new Error('Resimli yorum endpoint\'i henüz hazır değil. Backend geliştirme gerekli.');
  }
  
  try {
    const formData = new FormData();
    formData.append('product_id', productId.toString());
    formData.append('rating', rating.toString());
    formData.append('comment', comment);

    // Resimleri FormData'ya ekle - platform uyumlu
    images.forEach((image, index) => {
      try {
        let imageUri = image.uri;
        
        // URI formatını düzelt
        if (Platform.OS === 'ios') {
          // iOS için file:// prefix'ini kaldır
          if (imageUri.startsWith('file://')) {
            imageUri = imageUri.replace('file://', '');
          }
        } else if (Platform.OS === 'android') {
          // Android için file:// prefix'ini ekle
          if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
            imageUri = `file://${imageUri}`;
          }
        }
        
        const imageObject = {
          uri: imageUri,
          type: image.mimeType || image.type || 'image/jpeg',
          name: image.fileName || image.filename || `image_${Date.now()}_${index}.jpg`,
        };
        
        formData.append('images', imageObject as any);
      } catch (imageError) {
        console.warn(`Resim ${index} eklenirken hata:`, imageError);
        // Hatalı resmi atla, devam et
      }
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        // FormData için Content-Type header'ını otomatik ayarla
        // Authorization header yok - test endpoint
      },
      body: formData
    });

    // Yanıt tipini kontrol et
    const contentType = res.headers.get('content-type');
    
    if (!res.ok) {
      // HTML yanıtı geliyorsa endpoint mevcut değil
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Endpoint bulunamadı: ${url}`);
      }
      
      try {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Test resimli yorum gönderilirken hata oluştu');
      } catch (parseError) {
        throw new Error(`HTTP ${res.status}: Sunucu yanıtı okunamadı`);
      }
    }

    // JSON yanıtını parse et
    try {
      const data = await res.json();
      return data;
    } catch (parseError) {
      // JSON parse hatası - muhtemelen HTML yanıtı geldi
      const textResponse = await res.text();
      console.error('Beklenmeyen yanıt formatı:', textResponse.substring(0, 200));
      throw new Error('Sunucu beklenmeyen yanıt formatı döndürdü');
    }
  } catch (err) {
    console.error('Test resimli yorum hatası:', err);
    throw err;
  }
}

// Veritabanı tablolarını oluştur
export async function createTables() {
  const url = `${API_BASE_URL}/comments/create-tables`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    throw error;
  }
}

// Test yorumları getirme
export async function getTestReviews(productId: number) {
  const url = `${API_BASE_URL}/comments/test-reviews/${productId}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data : { reviews: [], stats: { average_rating: 0, total_reviews: 0 } };
  } catch (error) {
    console.error('Test yorumlar hatası:', error);
    throw error;
  }
}

// Resimli yorum gönderme (FormData ile)
export async function addReviewWithImages(
  productId: number, 
  rating: number, 
  comment: string, 
  images: any[]
) {
  const url = `${API_BASE_URL}/comments`;

  try {
    const token = await AsyncStorage.getItem('auth_token');
    
    const formData = new FormData();
    formData.append('product_id', productId.toString());
    formData.append('rating', rating.toString());
    formData.append('comment', comment);

    // Resimleri FormData'ya ekle - platform uyumlu
    images.forEach((image, index) => {
      try {
        let imageUri = image.uri;
        
        // URI formatını düzelt
        if (Platform.OS === 'ios') {
          // iOS için file:// prefix'ini kaldır
          if (imageUri.startsWith('file://')) {
            imageUri = imageUri.replace('file://', '');
          }
        } else if (Platform.OS === 'android') {
          // Android için file:// prefix'ini ekle
          if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
            imageUri = `file://${imageUri}`;
          }
        }
        
        const imageObject = {
          uri: imageUri,
          type: image.mimeType || image.type || 'image/jpeg',
          name: image.fileName || image.filename || `image_${Date.now()}_${index}.jpg`,
        };
        
        formData.append('images', imageObject as any);
      } catch (imageError) {
        console.warn(`Resim ${index} eklenirken hata:`, imageError);
        // Hatalı resmi atla, devam et
      }
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        // FormData için Content-Type header'ını otomatik ayarla
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Yorum gönderilirken hata oluştu');
    }

    return data;
  } catch (err) {
    console.error('FormData resimli yorum hatası:', err);
    throw err;
  }
}
