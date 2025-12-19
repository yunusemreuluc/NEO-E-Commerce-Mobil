-- Safe mode'u geçici olarak kapat
SET SQL_SAFE_UPDATES = 0;

-- Kolon varlığını kontrol et ve ekle (MySQL uyumlu)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND column_name = 'image_type';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE comment_images ADD COLUMN image_type ENUM(''file'', ''url'', ''base64'') DEFAULT ''url'' AFTER image_url',
    'SELECT "image_type column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- original_url kolonu
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND column_name = 'original_url';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE comment_images ADD COLUMN original_url TEXT AFTER image_type',
    'SELECT "original_url column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- file_size kolonu
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND column_name = 'file_size';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE comment_images ADD COLUMN file_size INT DEFAULT 0 AFTER original_url',
    'SELECT "file_size column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- mime_type kolonu
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND column_name = 'mime_type';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE comment_images ADD COLUMN mime_type VARCHAR(100) DEFAULT ''image/jpeg'' AFTER file_size',
    'SELECT "mime_type column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mevcut verileri güncelle (safe mode kapalı)
UPDATE comment_images SET image_type = 'file' WHERE image_url LIKE '/uploads/%';
UPDATE comment_images SET image_type = 'url' WHERE image_url LIKE 'http%';
UPDATE comment_images SET image_type = 'base64' WHERE image_url LIKE 'data:%';

-- Index ekle (hata kontrolü ile)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND index_name = 'idx_image_type';

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_image_type ON comment_images(image_type)',
    'SELECT "idx_image_type already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- İkinci index
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'comment_images' 
AND index_name = 'idx_review_id_type';

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_review_id_type ON comment_images(review_id, image_type)',
    'SELECT "idx_review_id_type already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- image_url kolonunu büyüt (Base64 için)
ALTER TABLE comment_images MODIFY COLUMN image_url LONGTEXT;

-- Safe mode'u geri aç
SET SQL_SAFE_UPDATES = 1;