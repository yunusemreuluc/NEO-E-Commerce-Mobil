-- Test ürünü ekle
INSERT INTO products (
  name, description, short_description, brand, category_id,
  price, sku, stock_quantity, is_featured, is_active,
  rating, review_count, image_url
) VALUES (
  'Kablosuz Kulaklık',
  'Yüksek kaliteli kablosuz kulaklık. Mükemmel ses kalitesi ve uzun pil ömrü.',
  'Premium kablosuz kulaklık',
  'NEO Audio',
  1,
  1299.00,
  'NEO-HEADPHONE-001',
  50,
  TRUE,
  TRUE,
  4.5,
  25,
  '/uploads/1765836819035-a795baaa4fd9e8.jpg'
);

-- Ürün resmi ekle
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT 
  id,
  '/uploads/1765836819035-a795baaa4fd9e8.jpg',
  'Kablosuz Kulaklık',
  TRUE,
  0
FROM products 
WHERE name = 'Kablosuz Kulaklık';

-- Mevcut ürünün de resmini güncelle
UPDATE products SET image_url = '/uploads/1765836819035-a795baaa4fd9e8.jpg' WHERE id = 10;

INSERT IGNORE INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(10, '/uploads/1765836819035-a795baaa4fd9e8.jpg', 'Test ürün resmi', TRUE, 0);