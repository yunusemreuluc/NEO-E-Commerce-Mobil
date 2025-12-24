-- Mevcut siparişlerdeki ürün resimlerini güncelle
UPDATE order_items oi
JOIN products p ON oi.product_id = p.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
SET oi.product_image = COALESCE(pi.image_url, p.image_url)
WHERE oi.product_image IS NULL OR oi.product_image = '';

-- Kontrol sorgusu
SELECT 
    oi.id,
    oi.product_name,
    oi.product_image,
    p.image_url as product_main_image,
    pi.image_url as primary_image
FROM order_items oi
JOIN products p ON oi.product_id = p.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
ORDER BY oi.id;