-- Test resimleri ekle
INSERT IGNORE INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(10, '/uploads/1765836819035-a795baaa4fd9e8.jpg', 'Test ürün resmi', TRUE, 0),
(11, '/uploads/1765836819035-a795baaa4fd9e8.jpg', 'Test ürün resmi', TRUE, 0),
(12, '/uploads/1765836819035-a795baaa4fd9e8.jpg', 'Test ürün resmi', TRUE, 0);

-- Ürünlerin image_url alanını da güncelle
UPDATE products SET image_url = '/uploads/1765836819035-a795baaa4fd9e8.jpg' WHERE id IN (10, 11, 12);