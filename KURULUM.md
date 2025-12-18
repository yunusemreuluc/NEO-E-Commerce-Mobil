# NEO E-ticaret Uygulaması - Kurulum Rehberi

## 🚀 Özellikler

✅ **Kullanıcı Sistemi**
- Kayıt olma ve giriş yapma
- JWT tabanlı kimlik doğrulama
- Şifre hash'leme (bcrypt)

✅ **Yorum Sistemi**
- Ürünlere yorum yapma ve puanlama
- Admin moderasyonu (onay/ret)
- Rate limiting ve spam koruması

✅ **Admin Panel**
- Ürün yönetimi
- Yorum moderasyonu
- Kullanıcı yönetimi

✅ **Sepet Sistemi**
- Ürün ekleme/çıkarma
- Miktar güncelleme
- Sepeti temizleme

## 📋 Gereksinimler

- Node.js (v16+)
- MySQL (v8+)
- Expo CLI
- Android Studio veya Xcode (emülatör için)

## 🛠️ Kurulum Adımları

### 1. Veritabanı Kurulumu

MySQL'de `neo_ecommerce` veritabanını oluşturun:

```sql
CREATE DATABASE neo_ecommerce;
USE neo_ecommerce;
```

Ardından `neo-backend/database-setup.sql` dosyasındaki komutları çalıştırın:

```sql
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

-- Test kullanıcıları
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@neoapp.com', '$2b$10$tBUzTNj3pdsRTGwfj9qx7urd4wzr3L5OXVhFxW2jSYOcY6Exx29Ba', 'admin');

INSERT IGNORE INTO users (name, email, password_hash, role) VALUES 
('Test Kullanıcı', 'demo@neoapp.com', '$2b$10$ZlspMjFTvNgvcU.4ojy/POHF3y91vDVEUzpg26l3kTpAHiY.ZoGbu', 'user');
```

### 2. Backend Kurulumu

```bash
cd neo-backend
npm install
```

`.env` dosyasını oluşturun:
```env
PORT=4000
PUBLIC_BASE_URL=http://YOUR_IP:4000
JWT_SECRET=neo-secret-key-2024
```

Backend'i başlatın:
```bash
npm run dev
```

### 3. Admin Panel Kurulumu

```bash
cd neo-admin
npm install
npm run dev
```

Admin panel: http://localhost:3000

### 4. Mobile App Kurulumu

```bash
# Ana dizinde
npm install
npx expo start
```

## 🔐 Test Hesapları

**Admin:**
- E-posta: admin@neoapp.com
- Şifre: admin123

**Kullanıcı:**
- E-posta: demo@neoapp.com
- Şifre: 123456

## 📱 Kullanım

### Mobil Uygulama
1. Expo Go uygulamasını indirin
2. QR kodu tarayın veya emülatör kullanın
3. Test hesabıyla giriş yapın
4. Ürünlere yorum yapabilir, sepete ekleyebilirsiniz

### Admin Panel
1. http://localhost:3000 adresine gidin
2. Admin hesabıyla giriş yapın
3. Ürünleri, yorumları ve kullanıcıları yönetin

## 🔧 API Endpoints

### Auth
- `POST /auth/login` - Giriş yap
- `POST /auth/register` - Kayıt ol

### Products
- `GET /products` - Ürünleri listele
- `GET /products/:id` - Ürün detayı
- `POST /products` - Ürün ekle (admin)
- `PUT /products/:id` - Ürün güncelle (admin)

### Reviews
- `GET /reviews/product/:productId` - Ürün yorumları
- `POST /reviews` - Yorum ekle (auth gerekli)
- `GET /reviews/admin` - Tüm yorumlar (admin)
- `PATCH /reviews/admin/:id/status` - Yorum durumu güncelle (admin)

### Users
- `GET /users` - Kullanıcıları listele (admin)
- `GET /users/:id` - Kullanıcı detayı (admin)
- `PATCH /users/:id/status` - Kullanıcı durumu güncelle (admin)
- `PATCH /users/:id/role` - Kullanıcı rolü güncelle (admin)

## 🛡️ Güvenlik Özellikleri

- **Rate Limiting**: Auth endpoint'leri için 15 dakikada 5 deneme
- **Input Validation**: express-validator ile veri doğrulama
- **XSS Koruması**: Kullanıcı girdileri sanitize edilir
- **SQL Injection Koruması**: Parametreli sorgular kullanılır
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **Password Hashing**: bcrypt ile şifre hash'leme

## 🚨 Sorun Giderme

### Backend başlamıyor
- MySQL servisinin çalıştığından emin olun
- Veritabanı bağlantı bilgilerini kontrol edin
- Port 4000'in boş olduğundan emin olun

### Mobil uygulamada resimler görünmüyor
- `api.ts` dosyasındaki IP adresini güncelleyin
- Backend'in çalıştığından emin olun

### Admin panelinde veriler yüklenmiyor
- Backend'in çalıştığından emin olun
- Browser console'da hata mesajlarını kontrol edin

## 📈 Geliştirilebilir Özellikler

- Push notification sistemi
- Ödeme entegrasyonu
- Sipariş takip sistemi
- Çoklu dil desteği
- Offline mod
- Sosyal medya paylaşımı