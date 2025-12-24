-- Sipariş Sistemi Veritabanı Tabloları

-- 1. Siparişler tablosu
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    -- Adres bilgileri
    shipping_address_id INT,
    shipping_address_snapshot JSON, -- Adres değişirse diye snapshot
    
    -- Fiyat bilgileri
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Ödeme bilgileri (demo)
    payment_method ENUM('credit_card', 'debit_card') DEFAULT 'credit_card',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_user_orders (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_number (order_number)
);

-- 2. Sipariş kalemleri tablosu
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    
    -- Ürün bilgileri snapshot (ürün değişirse diye)
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500),
    
    -- Sipariş detayları
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_items (order_id),
    INDEX idx_product_orders (product_id)
);

-- 3. Ödeme bilgileri tablosu (demo - güvenli saklama)
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Kart bilgileri (maskeli/tokenized)
    card_holder_name VARCHAR(100) NOT NULL,
    card_brand VARCHAR(20), -- visa, mastercard, etc.
    card_last4 VARCHAR(4) NOT NULL,
    exp_month INT NOT NULL,
    exp_year INT NOT NULL,
    
    -- Güvenlik
    card_token VARCHAR(255), -- Gerçek uygulamada payment provider token'ı
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_cards (user_id)
);

-- 4. Sipariş ödemeleri tablosu
CREATE TABLE IF NOT EXISTS order_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method_id INT,
    
    -- Ödeme detayları
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    
    -- Demo ödeme bilgileri
    transaction_id VARCHAR(100), -- Demo transaction ID
    payment_gateway VARCHAR(50) DEFAULT 'demo_gateway',
    
    -- Timestamps
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    INDEX idx_order_payments (order_id),
    INDEX idx_payment_status (payment_status)
);

-- 5. Sipariş durumu geçmişi tablosu
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL,
    notes TEXT,
    created_by INT, -- Admin user ID (opsiyonel)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_history (order_id)
);

-- Test verileri için sipariş numarası generator function
DELIMITER //
CREATE FUNCTION IF NOT EXISTS generate_order_number() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE order_num VARCHAR(20);
    DECLARE counter INT DEFAULT 1;
    DECLARE done BOOLEAN DEFAULT FALSE;
    
    REPEAT
        SET order_num = CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(counter, 4, '0'));
        
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) THEN
            SET done = TRUE;
        ELSE
            SET counter = counter + 1;
        END IF;
    UNTIL done END REPEAT;
    
    RETURN order_num;
END//
DELIMITER ;

-- Demo test verileri
INSERT IGNORE INTO payment_methods (user_id, card_holder_name, card_brand, card_last4, exp_month, exp_year, is_default) VALUES
(1, 'Test User', 'visa', '1234', 12, 2025, TRUE),
(1, 'Test User', 'mastercard', '5678', 6, 2026, FALSE);

-- Demo sipariş
INSERT IGNORE INTO orders (id, user_id, order_number, status, subtotal, shipping_cost, total_amount, payment_status) VALUES
(1, 1, 'ORD202412230001', 'delivered', 299.99, 15.00, 314.99, 'paid');

INSERT IGNORE INTO order_items (order_id, product_id, product_name, product_price, quantity, unit_price, total_price) VALUES
(1, 1, 'Demo Ürün', 299.99, 1, 299.99, 299.99);

INSERT IGNORE INTO order_payments (order_id, amount, payment_status, transaction_id, processed_at) VALUES
(1, 314.99, 'completed', 'DEMO_TXN_001', NOW());

INSERT IGNORE INTO order_status_history (order_id, status, notes) VALUES
(1, 'pending', 'Sipariş oluşturuldu'),
(1, 'confirmed', 'Sipariş onaylandı'),
(1, 'processing', 'Sipariş hazırlanıyor'),
(1, 'shipped', 'Sipariş kargoya verildi'),
(1, 'delivered', 'Sipariş teslim edildi');