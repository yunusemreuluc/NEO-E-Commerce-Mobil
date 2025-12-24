-- Gelişmiş Ürün Sistemi için Veritabanı Yapısı

-- Mevcut products tablosunu yedekle
CREATE TABLE products_backup AS SELECT * FROM products;

-- Products tablosunu genişlet
ALTER TABLE products 
ADD COLUMN description TEXT AFTER name,
ADD COLUMN short_description VARCHAR(500) AFTER description,
ADD COLUMN brand VARCHAR(100) AFTER short_description,
ADD COLUMN category_id INT AFTER brand,
ADD COLUMN subcategory VARCHAR(100) AFTER category_id,
ADD COLUMN sku VARCHAR(100) UNIQUE AFTER subcategory,
ADD COLUMN weight DECIMAL(8,2) AFTER sku,
ADD COLUMN dimensions VARCHAR(100) AFTER weight,
ADD COLUMN material VARCHAR(200) AFTER dimensions,
ADD COLUMN color VARCHAR(50) AFTER material,
ADD COLUMN size VARCHAR(50) AFTER color,
ADD COLUMN stock_quantity INT DEFAULT 0 AFTER size,
ADD COLUMN min_stock_level INT DEFAULT 5 AFTER stock_quantity,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE AFTER min_stock_level,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER is_featured,
ADD COLUMN meta_title VARCHAR(200) AFTER is_active,
ADD COLUMN meta_description TEXT AFTER meta_title,
ADD COLUMN tags JSON AFTER meta_description,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 AFTER tags,
ADD COLUMN review_count INT DEFAULT 0 AFTER rating,
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER review_count,
ADD COLUMN sale_price DECIMAL(10,2) AFTER discount_percentage,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sale_price,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Ürün özellikleri tablosu
CREATE TABLE IF NOT EXISTS product_attributes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_type ENUM('text', 'number', 'boolean', 'color', 'size') DEFAULT 'text',
  is_filterable BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_attributes (product_id, attribute_name)
);

-- Ürün resimleri tablosu
CREATE TABLE IF NOT EXISTS product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images (product_id)
);

-- Ürün varyantları tablosu (beden, renk vb.)
CREATE TABLE IF NOT EXISTS product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  variant_name VARCHAR(100) NOT NULL, -- 'Beden', 'Renk', 'Stil' vb.
  variant_value VARCHAR(100) NOT NULL, -- 'M', 'Kırmızı', 'Slim Fit' vb.
  price_adjustment DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value),
  INDEX idx_product_variants (product_id)
);

-- Ürün yorumları tablosu
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_reviews (product_id, is_approved),
  INDEX idx_user_reviews (user_id)
);

-- Foreign key constraint ekle
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Örnek kategoriler ekle
INSERT INTO categories (name, slug, description) VALUES
('Giyim', 'giyim', 'Kadın ve erkek giyim ürünleri'),
('Elektronik', 'elektronik', 'Elektronik cihazlar ve aksesuarlar'),
('Ev & Yaşam', 'ev-yasam', 'Ev dekorasyonu ve yaşam ürünleri'),
('Spor', 'spor', 'Spor giyim ve ekipmanları'),
('Kozmetik', 'kozmetik', 'Güzellik ve kişisel bakım ürünleri');

-- Alt kategoriler
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Kadın Giyim', 'kadin-giyim', 'Kadın giyim ürünleri', 1),
('Erkek Giyim', 'erkek-giyim', 'Erkek giyim ürünleri', 1),
('Elbise', 'elbise', 'Kadın elbiseleri', 6),
('Gömlek', 'gomlek', 'Erkek gömlekleri', 7),
('Telefon', 'telefon', 'Akıllı telefonlar', 2),
('Laptop', 'laptop', 'Dizüstü bilgisayarlar', 2);

-- Mevcut ürünleri güncelle (örnek)
UPDATE products SET 
  description = 'Yüksek kaliteli ürün açıklaması',
  short_description = 'Kısa ürün açıklaması',
  brand = 'NEO Brand',
  category_id = 1,
  sku = CONCAT('NEO-', id),
  stock_quantity = 100,
  is_active = TRUE,
  rating = 4.5,
  review_count = 10
WHERE id > 0;

-- Örnek ürün özellikleri ekle
INSERT INTO product_attributes (product_id, attribute_name, attribute_value, attribute_type, is_filterable) 
SELECT 
  id,
  'Malzeme',
  'Pamuk',
  'text',
  TRUE
FROM products 
WHERE id <= 5;

INSERT INTO product_attributes (product_id, attribute_name, attribute_value, attribute_type, is_filterable) 
SELECT 
  id,
  'Yıkama Talimatı',
  '30°C makinede yıkanabilir',
  'text',
  FALSE
FROM products 
WHERE id <= 5;

-- Örnek ürün varyantları ekle (beden)
INSERT INTO product_variants (product_id, variant_name, variant_value, stock_quantity) 
SELECT 
  id,
  'Beden',
  'S',
  25
FROM products 
WHERE id <= 3;

INSERT INTO product_variants (product_id, variant_name, variant_value, stock_quantity) 
SELECT 
  id,
  'Beden',
  'M',
  30
FROM products 
WHERE id <= 3;

INSERT INTO product_variants (product_id, variant_name, variant_value, stock_quantity) 
SELECT 
  id,
  'Beden',
  'L',
  25
FROM products 
WHERE id <= 3;

-- Örnek renk varyantları
INSERT INTO product_variants (product_id, variant_name, variant_value, stock_quantity) 
SELECT 
  id,
  'Renk',
  'Siyah',
  40
FROM products 
WHERE id <= 2;

INSERT INTO product_variants (product_id, variant_name, variant_value, stock_quantity) 
SELECT 
  id,
  'Renk',
  'Beyaz',
  35
FROM products 
WHERE id <= 2;

-- Indexler ekle
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- Trigger: Ürün rating'ini otomatik güncelle
DELIMITER //
CREATE TRIGGER update_product_rating 
AFTER INSERT ON product_reviews 
FOR EACH ROW
BEGIN
  UPDATE products 
  SET 
    rating = (
      SELECT AVG(rating) 
      FROM product_reviews 
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM product_reviews 
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    )
  WHERE id = NEW.product_id;
END//
DELIMITER ;

-- Trigger: Sale price hesaplama
DELIMITER //
CREATE TRIGGER calculate_sale_price 
BEFORE UPDATE ON products 
FOR EACH ROW
BEGIN
  IF NEW.discount_percentage > 0 THEN
    SET NEW.sale_price = NEW.price * (1 - NEW.discount_percentage / 100);
  ELSE
    SET NEW.sale_price = NEW.price;
  END IF;
END//
DELIMITER ;

-- View: Ürün detay görünümü
CREATE VIEW product_details AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
  (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) as variant_count,
  (SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) as total_variant_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE;

COMMIT;