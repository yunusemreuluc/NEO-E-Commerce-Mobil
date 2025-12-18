// types/Product.ts

// Backend'den gelen model
export type ApiProduct = {
  id: number;
  name: string;
  category: string;
  image_url?: string | null;
  images?: string[];
  price: number | string;
  discount?: number | null;
  final_price?: number | string;
  stock: number;
  is_active: 0 | 1 | boolean;
  created_at?: string;
  updated_at?: string;
};


// Mobil uygulamanın içinde kullandığımız sade model
export type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
};
