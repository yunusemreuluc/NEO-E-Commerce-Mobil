-- NEO E-ticaret Veritabanı Tabloları

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ürün yorumları tablosu
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Admin kullanıcı oluştur (şifre: admin123)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@neoapp.com', '$2b$10$tBUzTNj3pdsRTGwfj9qx7urd4wzr3L5OXVhFxW2jSYOcY6Exx29Ba', 'admin');

-- Test kullanıcısı oluştur (şifre: 123456)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES 
('Test Kullanıcı', 'demo@neoapp.com', '$2b$10$ZlspMjFTvNgvcU.4ojy/POHF3y91vDVEUzpg26l3kTpAHiY.ZoGbu', 'user');