// types/Product.ts

// Backend'den gelen model
export type ApiProduct = {
  id: number;
  name: string;
  category?: string;
  category_name?: string;
  category_slug?: string;
  image_url?: string | null;
  primary_image?: string | null;
  images?: string[];
  price: number | string;
  old_price?: number | string | null;
  sale_price?: number | string | null;
  discount?: number | null;
  discount_percentage?: number | string | null;
  final_price?: number | string;
  stock?: number;
  stock_quantity?: number;
  is_active?: 0 | 1 | boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
  short_description?: string;
  brand?: string;
  rating?: number;
  review_count?: number;
  image_count?: number;
  variant_count?: number;
};


// Mobil uygulamanın içinde kullandığımız sade model
export type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
};
