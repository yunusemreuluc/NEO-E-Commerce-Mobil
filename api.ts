import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiProduct } from "./types/Product";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://192.168.137.1:4000";

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

// Reviews API
export async function getProductReviews(productId: number) {
  const url = `${API_BASE_URL}/reviews/product/${productId}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text || "response yok"}`);
    }

    return await res.json();
  } catch (err) {
    throw new Error("Yorumlar yüklenirken bir hata oluştu");
  }
}

export async function addReview(productId: number, rating: number, comment: string) {
  const url = `${API_BASE_URL}/reviews`;

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
