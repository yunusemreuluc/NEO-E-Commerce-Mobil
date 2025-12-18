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

// Base64 ile resim gönderme (FormData alternatifi)
export async function testReviewWithImages(
  productId: number, 
  rating: number, 
  comment: string, 
  images: any[]
) {
  const url = `${API_BASE_URL}/comments/base64-review-images`;
  
  try {
    // Resimleri base64'e çevir
    const base64Images = await Promise.all(
      images.map(async (image, index) => {
        try {
          // Resmi fetch ile al ve base64'e çevir
          const response = await fetch(image.uri);
          const blob = await response.blob();
          
          // Blob boyutunu kontrol et (5MB limit)
          if (blob.size > 5 * 1024 * 1024) {
            console.warn('Resim çok büyük, atlanıyor:', blob.size);
            return null;
          }
          
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                data: reader.result,
                type: image.type || 'image/jpeg',
                name: `image_${Date.now()}_${index}.jpg`
              });
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Resim base64 çevirme hatası:', error);
          return null;
        }
      })
    );

    // Null olanları filtrele
    const validImages = base64Images.filter(img => img !== null);

    // Base64 resimleri hazırlandı

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment,
        images: validImages
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    // Base64 resimli yorum yanıtı alındı
    return data;
  } catch (error) {
    console.error('Base64 resimli yorum hatası:', error);
    throw error;
  }
}

// Test yorumları getirme
export async function getTestReviews(productId: number) {
  const url = `${API_BASE_URL}/comments/test-reviews/${productId}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    // Test yorumlar yanıtı alındı
    return data.success ? data.data : { reviews: [], stats: { average_rating: 0, total_reviews: 0 } };
  } catch (error) {
    console.error('Test yorumlar hatası:', error);
    throw error;
  }
}

// Resimli yorum gönderme
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

    // Resimleri FormData'ya ekle
    images.forEach((image, index) => {
      const imageUri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
      
      formData.append('images', {
        uri: imageUri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `image_${index}.jpg`,
      } as any);
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
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
    throw err;
  }
}
