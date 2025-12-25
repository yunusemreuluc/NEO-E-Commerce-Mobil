-- Test ürün resimleri ekleme
-- product_images tablosuna test resimleri ekle
INSERT IGNORE INTO product_images (product_id, image_url, is_primary, alt_text) VALUES
(1, '/uploads/product1.jpg', TRUE, 'Ürün 1 Resmi'),
(2, '/uploads/product2.jpg', TRUE, 'Ürün 2 Resmi'),
(3, '/uploads/product3.jpg', TRUE, 'Ürün 3 Resmi'),
(4, '/uploads/product4.jpg', TRUE, 'Ürün 4 Resmi'),
(5, '/uploads/product5.jpg', TRUE, 'Ürün 5 Resmi');

-- Kontrol için
SELECT p.id, p.name, pi.image_url, pi.is_primary 
FROM products p 
LEFT JOIN product_images pi ON p.id = pi.product_id 
WHERE p.id <= 5;