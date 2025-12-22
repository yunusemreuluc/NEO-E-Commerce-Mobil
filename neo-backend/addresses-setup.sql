-- Kullanıcı Adresleri Tablosu

CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL COMMENT 'Adres başlığı (Ev, İş, vb.)',
  full_name VARCHAR(255) NOT NULL COMMENT 'Alıcı adı soyadı',
  phone VARCHAR(20) NOT NULL COMMENT 'Telefon numarası',
  address_line VARCHAR(500) NOT NULL COMMENT 'Detaylı adres',
  district VARCHAR(100) NOT NULL COMMENT 'İlçe',
  city VARCHAR(100) NOT NULL COMMENT 'İl',
  postal_code VARCHAR(10) DEFAULT NULL COMMENT 'Posta kodu',
  is_default BOOLEAN DEFAULT FALSE COMMENT 'Varsayılan adres mi',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Aktif mi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
);

-- Test adresleri ekle (demo kullanıcısı için)
INSERT IGNORE INTO addresses (user_id, title, full_name, phone, address_line, district, city, postal_code, is_default) VALUES 
(2, 'Ev Adresim', 'Test Kullanıcı', '0555 123 45 67', 'Atatürk Mahallesi, Cumhuriyet Caddesi No: 123 Daire: 5', 'Kadıköy', 'İstanbul', '34710', TRUE),
(2, 'İş Adresim', 'Test Kullanıcı', '0555 123 45 67', 'Levent Mahallesi, İş Merkezi Blok A Kat: 15', 'Beşiktaş', 'İstanbul', '34330', FALSE);