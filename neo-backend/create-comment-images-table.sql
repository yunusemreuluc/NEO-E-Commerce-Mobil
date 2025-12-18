-- Yorum resimleri için basit tablo oluştur
CREATE TABLE IF NOT EXISTS comment_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_id (review_id)
);