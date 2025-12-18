-- NEO E-ticaret - Gelişmiş Yorum Sistemi DB Güncellemesi

-- Kullanıcılar tablosuna ban sistemi ekleme
ALTER TABLE users 
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN ban_reason TEXT NULL,
ADD COLUMN banned_at TIMESTAMP NULL,
ADD COLUMN banned_by INT NULL,
ADD INDEX idx_is_banned (is_banned);

-- Yorum resimleri tablosu
CREATE TABLE IF NOT EXISTS comment_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  original_filename VARCHAR(255) NULL,
  file_size INT NULL,
  mime_type VARCHAR(100) NULL,
  upload_order TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES reviews(id) ON DELETE CASCADE,
  INDEX idx_comment_id (comment_id)
);

-- Mevcut reviews tablosunu güncelle
ALTER TABLE reviews 
ADD COLUMN has_images BOOLEAN DEFAULT FALSE,
ADD COLUMN image_count TINYINT DEFAULT 0,
ADD COLUMN moderated_by INT NULL,
ADD COLUMN moderated_at TIMESTAMP NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD INDEX idx_has_images (has_images),
ADD INDEX idx_moderated_by (moderated_by);

-- Admin işlemleri log tablosu
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type ENUM('approve_review', 'reject_review', 'delete_review', 'ban_user', 'unban_user') NOT NULL,
  target_type ENUM('review', 'user') NOT NULL,
  target_id INT NOT NULL,
  reason TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type),
  INDEX idx_target (target_type, target_id)
);

-- Rate limiting tablosu (spam önleme)
CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type ENUM('review_submit', 'image_upload') NOT NULL,
  count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_action_window (user_id, action_type, window_start),
  INDEX idx_user_action (user_id, action_type),
  INDEX idx_window_start (window_start)
);