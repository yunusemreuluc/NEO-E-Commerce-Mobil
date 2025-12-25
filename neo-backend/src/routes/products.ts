// neo-backend/src/routes/products.ts
import express from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { API_BASE_URL } from '../config/api';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Gelişmiş arama endpoint'i
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const sortBy = req.query.sortBy as string || 'relevance';
    const offset = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          products: [],
          suggestions: [],
          total: 0,
          page,
          limit,
          message: 'En az 2 karakter girin'
        }
      });
    }

    const searchTerm = query.trim();
    const searchWords = searchTerm.split(' ').filter(word => word.length > 1);
    
    // Ana arama sorgusu - relevance skorlaması ile
    let searchQuery = `
      SELECT DISTINCT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(pi.image_url, p.image_url) as image_url,
        (
          -- Relevance skoru hesaplama
          CASE WHEN p.name LIKE ? THEN 100 ELSE 0 END +
          CASE WHEN p.name LIKE ? THEN 50 ELSE 0 END +
          CASE WHEN p.short_description LIKE ? THEN 30 ELSE 0 END +
          CASE WHEN p.description LIKE ? THEN 20 ELSE 0 END +
          CASE WHEN p.brand LIKE ? THEN 40 ELSE 0 END +
          CASE WHEN c.name LIKE ? THEN 25 ELSE 0 END +
          CASE WHEN p.tags LIKE ? THEN 15 ELSE 0 END
        ) as relevance_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      WHERE p.is_active = TRUE
      AND (
        p.name LIKE ? OR
        p.short_description LIKE ? OR
        p.description LIKE ? OR
        p.brand LIKE ? OR
        c.name LIKE ? OR
        p.tags LIKE ?
      )
    `;

    let queryParams = [
      // Relevance skoru için parametreler
      `${searchTerm}%`,        // Tam başlangıç eşleşmesi
      `%${searchTerm}%`,       // Kısmi eşleşme
      `%${searchTerm}%`,       // Kısa açıklama
      `%${searchTerm}%`,       // Açıklama
      `%${searchTerm}%`,       // Marka
      `%${searchTerm}%`,       // Kategori
      `%${searchTerm}%`,       // Tags
      // WHERE koşulu için parametreler
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`
    ];

    // Kategori filtresi
    if (category) {
      searchQuery += ` AND (c.slug = ? OR c.name LIKE ?)`;
      queryParams.push(category, `%${category}%`);
    }

    // Sıralama
    if (sortBy === 'relevance') {
      searchQuery += ` ORDER BY relevance_score DESC, p.rating DESC`;
    } else if (sortBy === 'price_asc') {
      searchQuery += ` ORDER BY p.price ASC`;
    } else if (sortBy === 'price_desc') {
      searchQuery += ` ORDER BY p.price DESC`;
    } else if (sortBy === 'rating') {
      searchQuery += ` ORDER BY p.rating DESC, p.review_count DESC`;
    } else if (sortBy === 'newest') {
      searchQuery += ` ORDER BY p.created_at DESC`;
    } else {
      searchQuery += ` ORDER BY relevance_score DESC`;
    }

    // Sayfalama
    searchQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit.toString(), offset.toString());

    const [products] = await db.execute(searchQuery, queryParams) as [RowDataPacket[], any];

    // Toplam sonuç sayısı
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      AND (
        p.name LIKE ? OR
        p.short_description LIKE ? OR
        p.description LIKE ? OR
        p.brand LIKE ? OR
        c.name LIKE ? OR
        p.tags LIKE ?
      )
      ${category ? 'AND (c.slug = ? OR c.name LIKE ?)' : ''}
    `;

    let countParams = [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`
    ];

    if (category) {
      countParams.push(category, `%${category}%`);
    }

    const [countResult] = await db.execute(countQuery, countParams) as [RowDataPacket[], any];
    const total = countResult[0].total;

    // Arama önerileri (benzer ürünler)
    const suggestionQuery = `
      SELECT DISTINCT p.name, p.brand, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      AND (p.name LIKE ? OR p.brand LIKE ? OR c.name LIKE ?)
      AND p.id NOT IN (${products.map(() => '?').join(',') || '0'})
      LIMIT 5
    `;

    const suggestionParams = [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      ...products.map(p => p.id)
    ];

    const [suggestions] = await db.execute(suggestionQuery, suggestionParams) as [RowDataPacket[], any];

    // Resim URL'lerini düzelt
    const processedProducts = products.map(product => ({
      ...product,
      image_url: product.image_url && !product.image_url.startsWith('http') 
        ? `${API_BASE_URL}${product.image_url}` 
        : product.image_url,
      price: parseFloat(product.price) || 0,
      sale_price: parseFloat(product.sale_price) || parseFloat(product.price) || 0,
      rating: parseFloat(product.rating) || 0,
      review_count: parseInt(product.review_count) || 0
    }));

    res.json({
      success: true,
      data: {
        products: processedProducts,
        suggestions: suggestions.map(s => ({
          text: s.name,
          type: 'product'
        })).concat(
          suggestions.map(s => ({
            text: s.brand,
            type: 'brand'
          })).filter(s => s.text)
        ).concat(
          suggestions.map(s => ({
            text: s.category_name,
            type: 'category'
          })).filter(s => s.text)
        ).slice(0, 8),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query: searchTerm,
        resultCount: products.length
      }
    });

  } catch (error) {
    console.error('Arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Arama sırasında bir hata oluştu'
    });
  }
});

// Tüm ürünleri listele (filtreleme ve sayfalama ile)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice = parseFloat(req.query.maxPrice as string) || 999999;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const offset = (page - 1) * limit;

    let whereConditions = ['p.is_active = TRUE'];
    let queryParams: any[] = [];

    if (category) {
      whereConditions.push('(c.slug = ? OR c.name LIKE ?)');
      queryParams.push(category, `%${category}%`);
    }

    if (brand) {
      whereConditions.push('p.brand LIKE ?');
      queryParams.push(`%${brand}%`);
    }

    if (minPrice > 0) {
      whereConditions.push('p.price >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice < 999999) {
      whereConditions.push('p.price <= ?');
      queryParams.push(maxPrice);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Ürünleri getir
    const [products] = await db.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) as variant_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    ) as [RowDataPacket[], any];

    // Toplam sayı
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClause}`,
      queryParams
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu'
    });
  }
});

// Ürün detayı
router.get('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Ana ürün bilgisi
    const [productResult] = await db.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = TRUE`,
      [productId]
    ) as [RowDataPacket[], any];

    if (productResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const product = productResult[0];

    // Ürün resimleri
    const [images] = await db.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
      [productId]
    ) as [RowDataPacket[], any];

    // Ürün özellikleri
    const [attributes] = await db.execute(
      'SELECT * FROM product_attributes WHERE product_id = ? ORDER BY sort_order ASC, attribute_name ASC',
      [productId]
    ) as [RowDataPacket[], any];

    // Ürün varyantları
    const [variants] = await db.execute(
      'SELECT * FROM product_variants WHERE product_id = ? AND is_active = TRUE ORDER BY variant_name, variant_value',
      [productId]
    ) as [RowDataPacket[], any];

    // Ürün yorumları (onaylı olanlar)
    const [reviews] = await db.execute(
      `SELECT 
        pr.*,
        u.name as user_name
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = ? AND pr.is_approved = TRUE
      ORDER BY pr.created_at DESC
      LIMIT 10`,
      [productId]
    ) as [RowDataPacket[], any];

    // Benzer ürünler (aynı kategoriden)
    const [similarProducts] = await db.execute(
      `SELECT 
        p.id, p.name, p.price, p.sale_price, p.rating, p.image_url,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) as primary_image
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = TRUE
      ORDER BY p.rating DESC, p.created_at DESC
      LIMIT 6`,
      [product.category_id, productId]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        product,
        images,
        attributes,
        variants,
        reviews,
        similar_products: similarProducts
      }
    });

  } catch (error) {
    console.error('Ürün detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün detayı yüklenirken bir hata oluştu'
    });
  }
});

// Kategorileri listele
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(
      `SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.is_active = TRUE
      ORDER BY c.parent_id ASC, c.sort_order ASC, c.name ASC`
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Kategoriler yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler yüklenemedi'
    });
  }
});

// Kategorileri listele (eski endpoint - geriye uyumluluk için)
router.get('/categories/list', async (req, res) => {
  try {
    const [categories] = await db.execute(
      `SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) as product_count,
        parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.is_active = TRUE
      ORDER BY c.parent_id ASC, c.sort_order ASC, c.name ASC`
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Kategori listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler yüklenirken bir hata oluştu'
    });
  }
});

// Markalar listesi
router.get('/brands/list', async (req, res) => {
  try {
    const [brands] = await db.execute(
      `SELECT 
        brand,
        COUNT(*) as product_count
      FROM products 
      WHERE is_active = TRUE AND brand IS NOT NULL AND brand != ''
      GROUP BY brand
      ORDER BY product_count DESC, brand ASC`
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: { brands }
    });

  } catch (error) {
    console.error('Marka listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Markalar yüklenirken bir hata oluştu'
    });
  }
});

// Ürün arama önerileri
router.get('/search/suggestions', async (req, res) => {
  const query = req.query.q as string;

  if (!query || query.length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }

  try {
    const [suggestions] = await db.execute(
      `SELECT DISTINCT name as suggestion, 'product' as type
      FROM products 
      WHERE name LIKE ? AND is_active = TRUE
      UNION
      SELECT DISTINCT brand as suggestion, 'brand' as type
      FROM products 
      WHERE brand LIKE ? AND is_active = TRUE AND brand IS NOT NULL
      UNION
      SELECT DISTINCT name as suggestion, 'category' as type
      FROM categories 
      WHERE name LIKE ? AND is_active = TRUE
      ORDER BY suggestion ASC
      LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Arama önerileri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Arama önerileri yüklenirken bir hata oluştu'
    });
  }
});

// Admin: Veritabanı düzeltme (category alanı sorunu)
router.post('/admin/fix-category-field', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Category alanı düzeltiliyor...');

    // Category alanına default değer ver veya kaldır
    try {
      // Önce category alanını kaldırmayı dene
      await connection.execute('ALTER TABLE products DROP COLUMN category');
      console.log('Category alanı kaldırıldı');
    } catch (error: any) {
      if (error.message.includes("check that column/key exists")) {
        console.log('Category alanı zaten yok');
      } else {
        // Kaldıramıyorsak default değer ver
        try {
          await connection.execute("ALTER TABLE products MODIFY COLUMN category VARCHAR(100) DEFAULT 'Genel'");
          console.log('Category alanına default değer verildi');
        } catch (modifyError: any) {
          console.log('Category alanı düzeltme hatası:', modifyError.message);
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Veritabanı category alanı düzeltildi!'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Veritabanı düzeltme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı düzeltilirken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

// Admin: Gelişmiş ürün sistemi kurulumu
router.post('/admin/setup-enhanced', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Gelişmiş ürün sistemi kuruluyor...');

    // 1. Önce category alanını kaldır (eğer varsa)
    try {
      await connection.execute('ALTER TABLE products DROP COLUMN category');
      console.log('Eski category alanı kaldırıldı');
    } catch (error: any) {
      if (!error.message.includes("check that column/key exists")) {
        console.log('Category alanı kaldırma hatası:', error.message);
      }
    }

    // 2. Products tablosunu genişlet
    const alterQueries = [
      'ALTER TABLE products ADD COLUMN description TEXT AFTER name',
      'ALTER TABLE products ADD COLUMN short_description VARCHAR(500) AFTER description',
      'ALTER TABLE products ADD COLUMN brand VARCHAR(100) AFTER short_description',
      'ALTER TABLE products ADD COLUMN category_id INT AFTER brand',
      'ALTER TABLE products ADD COLUMN subcategory VARCHAR(100) AFTER category_id',
      'ALTER TABLE products ADD COLUMN sku VARCHAR(100) AFTER subcategory',
      'ALTER TABLE products ADD COLUMN weight DECIMAL(8,2) AFTER sku',
      'ALTER TABLE products ADD COLUMN dimensions VARCHAR(100) AFTER weight',
      'ALTER TABLE products ADD COLUMN material VARCHAR(200) AFTER dimensions',
      'ALTER TABLE products ADD COLUMN color VARCHAR(50) AFTER material',
      'ALTER TABLE products ADD COLUMN size VARCHAR(50) AFTER color',
      'ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 0 AFTER size',
      'ALTER TABLE products ADD COLUMN min_stock_level INT DEFAULT 5 AFTER stock_quantity',
      'ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE AFTER min_stock_level',
      'ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER is_featured',
      'ALTER TABLE products ADD COLUMN meta_title VARCHAR(200) AFTER is_active',
      'ALTER TABLE products ADD COLUMN meta_description TEXT AFTER meta_title',
      'ALTER TABLE products ADD COLUMN tags JSON AFTER meta_description',
      'ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 AFTER tags',
      'ALTER TABLE products ADD COLUMN review_count INT DEFAULT 0 AFTER rating',
      'ALTER TABLE products ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0.00 AFTER review_count',
      'ALTER TABLE products ADD COLUMN sale_price DECIMAL(10,2) AFTER discount_percentage'
    ];

    for (const query of alterQueries) {
      try {
        await connection.execute(query);
      } catch (error: any) {
        if (!error.message.includes('Duplicate column name')) {
          console.log('Kolon ekleme hatası:', error.message);
        }
      }
    }

    // 2. Kategoriler tablosu
    await connection.execute(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. Ürün özellikleri tablosu
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        attribute_value TEXT NOT NULL,
        attribute_type ENUM('text', 'number', 'boolean', 'color', 'size') DEFAULT 'text',
        is_filterable BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 4. Ürün resimleri tablosu
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(200),
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 5. Ürün varyantları tablosu
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        variant_name VARCHAR(100) NOT NULL,
        variant_value VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10,2) DEFAULT 0.00,
        stock_quantity INT DEFAULT 0,
        sku VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 6. Ürün yorumları tablosu
    await connection.execute(`
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 7. Örnek kategoriler ekle
    const categories = [
      ['Giyim', 'giyim', 'Kadın ve erkek giyim ürünleri'],
      ['Elektronik', 'elektronik', 'Elektronik cihazlar ve aksesuarlar'],
      ['Ev & Yaşam', 'ev-yasam', 'Ev dekorasyonu ve yaşam ürünleri'],
      ['Spor', 'spor', 'Spor giyim ve ekipmanları'],
      ['Kozmetik', 'kozmetik', 'Güzellik ve kişisel bakım ürünleri']
    ];

    for (const [name, slug, description] of categories) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
          [name, slug, description]
        );
      } catch (error: any) {
        console.log(`Kategori ekleme hatası (${name}):`, error.message);
      }
    }

    // 8. Mevcut ürünleri güncelle
    await connection.execute(`
      UPDATE products SET 
        description = COALESCE(description, 'Yüksek kaliteli ürün açıklaması'),
        short_description = COALESCE(short_description, 'Kısa ürün açıklaması'),
        brand = COALESCE(brand, 'NEO Brand'),
        category_id = COALESCE(category_id, 1),
        sku = COALESCE(sku, CONCAT('NEO-', id)),
        stock_quantity = COALESCE(stock_quantity, 100),
        is_active = COALESCE(is_active, TRUE),
        rating = COALESCE(rating, 4.5),
        review_count = COALESCE(review_count, 10)
      WHERE id > 0
    `);

    await connection.commit();

    res.json({
      success: true,
      message: 'Gelişmiş ürün sistemi başarıyla kuruldu!',
      data: {
        features: [
          'Detaylı ürün bilgileri (açıklama, marka, kategori)',
          'Ürün özellikleri sistemi',
          'Çoklu ürün resimleri',
          'Ürün varyantları (beden, renk vb.)',
          'Ürün yorumları sistemi',
          'Kategori sistemi',
          'Stok takibi',
          'İndirim sistemi'
        ]
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Gelişmiş ürün sistemi kurulum hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Gelişmiş ürün sistemi kurulurken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

// Admin: Basit ürün oluştur (test için)
router.post('/admin/simple', authenticateToken, async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Ürün adı ve fiyat gerekli'
    });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO products (name, price, description, image_url) VALUES (?, ?, ?, ?)',
      [name, price, description || 'Açıklama yok', '']
    ) as [ResultSetHeader, any];

    res.json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: { product_id: result.insertId }
    });

  } catch (error) {
    console.error('Basit ürün oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken hata: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
    });
  }
});

// Admin: Ürün oluştur
router.post('/admin', authenticateToken, async (req, res) => {
  const {
    name, description, short_description, brand, category_id,
    price, sku, weight, dimensions, material, color, size,
    stock_quantity, is_featured, tags, discount_percentage,
    image_url, images, attributes, variants
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Ürün adı ve fiyat gerekli'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Fiyat hesaplaması - Admin panelinden gelen price eski fiyat
    const oldPrice = Number(price);
    const discountPercent = Number(discount_percentage) || 0;
    
    // Yeni fiyat hesapla (indirimli fiyat)
    const newPrice = discountPercent > 0 
      ? oldPrice * (1 - discountPercent / 100)
      : oldPrice;

    // Short description'ı kısalt (veritabanı sınırı için)
    const shortDesc = short_description ? 
      (short_description.length > 255 ? short_description.substring(0, 255) : short_description) : '';

    // Ana ürünü oluştur - price alanına yeni fiyatı kaydet
    const [productResult] = await connection.execute(
      `INSERT INTO products (
        name, description, short_description, brand, category_id,
        price, old_price, sku, weight, dimensions, material, color, size,
        stock_quantity, is_featured, tags, discount_percentage, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || '', 
        shortDesc, 
        brand || '', 
        category_id || null,
        newPrice, 
        discountPercent > 0 ? oldPrice : null,
        sku || '', 
        weight || null, 
        dimensions || '', 
        material || '', 
        color || '', 
        size || '',
        stock_quantity || 0, 
        is_featured || false, 
        tags ? JSON.stringify(tags) : null, 
        discount_percentage || 0, 
        image_url || ''
      ]
    ) as [ResultSetHeader, any];

    const productId = productResult.insertId;

    // Ürün resimlerini ekle
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
          [productId, img.url, img.alt_text || name, i === 0, i]
        );
      }
    }

    // Ürün özelliklerini ekle
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        await connection.execute(
          'INSERT INTO product_attributes (product_id, attribute_name, attribute_value, attribute_type, is_filterable) VALUES (?, ?, ?, ?, ?)',
          [productId, attr.name, attr.value, attr.type || 'text', attr.is_filterable || false]
        );
      }
    }

    // Ürün varyantlarını ekle
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await connection.execute(
          'INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, variant.name, variant.value, variant.price_adjustment || 0, variant.stock_quantity || 0, variant.sku]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: { product_id: productId }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Ürün oluşturma hatası:', error);
    
    // Detaylı hata mesajı
    let errorMessage = 'Ürün oluşturulurken bir hata oluştu';
    if (error instanceof Error) {
      console.error('Hata detayı:', error.message);
      if (error.message.includes('category')) {
        errorMessage = 'Kategori alanı hatası: ' + error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    connection.release();
  }
});

// Markalar listesi (gelişmiş)
router.get('/brands/admin/list', authenticateToken, async (req, res) => {
  try {
    const [brands] = await db.execute(
      `SELECT 
        brand,
        COUNT(*) as product_count,
        MIN(created_at) as first_used,
        MAX(updated_at) as last_updated
      FROM products 
      WHERE is_active = TRUE AND brand IS NOT NULL AND brand != ''
      GROUP BY brand
      ORDER BY product_count DESC, brand ASC`
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: { brands }
    });

  } catch (error) {
    console.error('Marka listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Markalar yüklenirken bir hata oluştu'
    });
  }
});

// Admin: Marka güncelle (tüm ürünlerde)
router.put('/brands/admin/:oldName', authenticateToken, async (req, res) => {
  const oldBrandName = decodeURIComponent(req.params.oldName);
  const { newName } = req.body;

  if (!newName || !newName.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Yeni marka adı gerekli'
    });
  }

  try {
    // Marka var mı kontrol et
    const [existing] = await db.execute(
      'SELECT COUNT(*) as count FROM products WHERE brand = ?',
      [oldBrandName]
    ) as [RowDataPacket[], any];

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    // Tüm ürünlerde marka adını güncelle
    await db.execute(
      'UPDATE products SET brand = ?, updated_at = NOW() WHERE brand = ?',
      [newName.trim(), oldBrandName]
    );

    res.json({
      success: true,
      message: 'Marka başarıyla güncellendi',
      data: { updated_products: existing[0].count }
    });

  } catch (error) {
    console.error('Marka güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Marka güncellenirken bir hata oluştu'
    });
  }
});

// Admin: Marka sil (tüm ürünlerden)
router.delete('/brands/admin/:brandName', authenticateToken, async (req, res) => {
  const brandName = decodeURIComponent(req.params.brandName);

  try {
    // Marka var mı kontrol et
    const [existing] = await db.execute(
      'SELECT COUNT(*) as count FROM products WHERE brand = ?',
      [brandName]
    ) as [RowDataPacket[], any];

    if (existing[0].count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    // Tüm ürünlerden marka bilgisini kaldır
    await db.execute(
      'UPDATE products SET brand = NULL, updated_at = NOW() WHERE brand = ?',
      [brandName]
    );

    res.json({
      success: true,
      message: 'Marka başarıyla silindi',
      data: { updated_products: existing[0].count }
    });

  } catch (error) {
    console.error('Marka silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Marka silinirken bir hata oluştu'
    });
  }
});

// Admin: Kategori oluştur
router.post('/categories/admin', authenticateToken, async (req, res) => {
  const { name, slug, description, parent_id, image_url, is_active, sort_order } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Kategori adı gerekli'
    });
  }

  try {
    // Slug otomatik oluştur
    const finalSlug = slug || name.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const [result] = await db.execute(
      `INSERT INTO categories (name, slug, description, parent_id, image_url, is_active, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), finalSlug, description || null, parent_id || null, 
       image_url || null, is_active !== false, sort_order || 0]
    ) as [ResultSetHeader, any];

    res.json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: { category_id: result.insertId }
    });

  } catch (error: any) {
    console.error('Kategori oluşturma hatası:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: 'Bu slug zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Kategori oluşturulurken bir hata oluştu'
      });
    }
  }
});

// Admin: Kategori güncelle
router.put('/categories/admin/:id', authenticateToken, async (req, res) => {
  const categoryId = req.params.id;
  const { name, slug, description, parent_id, image_url, is_active, sort_order } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Kategori adı gerekli'
    });
  }

  try {
    // Kategori var mı kontrol et
    const [existing] = await db.execute(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    ) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Slug otomatik oluştur
    const finalSlug = slug || name.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    await db.execute(
      `UPDATE categories SET 
        name = ?, slug = ?, description = ?, parent_id = ?, 
        image_url = ?, is_active = ?, sort_order = ?, updated_at = NOW()
       WHERE id = ?`,
      [name.trim(), finalSlug, description || null, parent_id || null,
       image_url || null, is_active !== false, sort_order || 0, categoryId]
    );

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi'
    });

  } catch (error: any) {
    console.error('Kategori güncelleme hatası:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: 'Bu slug zaten kullanılıyor'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Kategori güncellenirken bir hata oluştu'
      });
    }
  }
});

// Admin: Kategori sil
router.delete('/categories/admin/:id', authenticateToken, async (req, res) => {
  const categoryId = req.params.id;

  try {
    // Kategori var mı kontrol et
    const [existing] = await db.execute(
      'SELECT id, name FROM categories WHERE id = ?',
      [categoryId]
    ) as [RowDataPacket[], any];

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Alt kategoriler var mı kontrol et
    const [subCategories] = await db.execute(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [categoryId]
    ) as [RowDataPacket[], any];

    if (subCategories[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.'
      });
    }

    // Bu kategoriye ait ürünler var mı kontrol et
    const [products] = await db.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    ) as [RowDataPacket[], any];

    if (products[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriye ait ürünler var. Önce ürünleri başka kategoriye taşıyın.'
      });
    }

    // Kategoriyi sil
    await db.execute('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });

  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori silinirken bir hata oluştu'
    });
  }
});

// Admin: Ürün güncelle
router.put('/admin/:id', authenticateToken, async (req, res) => {
  const productId = req.params.id;
  const {
    name, description, short_description, brand, category_id,
    price, sku, weight, dimensions, material, color, size,
    stock_quantity, is_featured, tags, discount_percentage,
    image_url, images, attributes, variants, is_active
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Ürün adı ve fiyat gerekli'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Fiyat hesaplaması - Admin panelinden gelen price eski fiyat
    const oldPrice = Number(price);
    const discountPercent = Number(discount_percentage) || 0;
    
    // Yeni fiyat hesapla (indirimli fiyat)
    const newPrice = discountPercent > 0 
      ? oldPrice * (1 - discountPercent / 100)
      : oldPrice;

    // Ana ürünü güncelle - price alanına yeni fiyatı kaydet
    await connection.execute(
      `UPDATE products SET 
        name = ?, description = ?, short_description = ?, brand = ?, category_id = ?,
        price = ?, old_price = ?, sku = ?, weight = ?, dimensions = ?, material = ?, color = ?, size = ?,
        stock_quantity = ?, is_featured = ?, tags = ?, discount_percentage = ?, 
        image_url = ?, is_active = ?
      WHERE id = ?`,
      [name, description, short_description, brand, category_id,
       newPrice, discountPercent > 0 ? oldPrice : null, sku, weight, dimensions, material, color, size,
       stock_quantity || 0, is_featured || false, 
       tags ? JSON.stringify(tags) : null, discount_percentage || 0, 
       image_url, is_active !== false, productId]
    );

    // Mevcut resimleri sil ve yenilerini ekle
    if (images && Array.isArray(images)) {
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.url && img.url.trim()) {
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
            [productId, img.url, img.alt_text || name, img.is_primary || false, i]
          );
        }
      }
    }

    // Mevcut özellikleri sil ve yenilerini ekle
    if (attributes && Array.isArray(attributes)) {
      await connection.execute('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
      
      for (const attr of attributes) {
        if (attr.name && attr.value) {
          await connection.execute(
            'INSERT INTO product_attributes (product_id, attribute_name, attribute_value, attribute_type, is_filterable) VALUES (?, ?, ?, ?, ?)',
            [productId, attr.name, attr.value, attr.type || 'text', attr.is_filterable || false]
          );
        }
      }
    }

    // Mevcut varyantları sil ve yenilerini ekle
    if (variants && Array.isArray(variants)) {
      await connection.execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      
      for (const variant of variants) {
        if (variant.name && variant.value) {
          await connection.execute(
            'INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?)',
            [productId, variant.name, variant.value, variant.price_adjustment || 0, variant.stock_quantity || 0, variant.sku]
          );
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

// Admin: Ürün sil (gerçek silme)
router.delete('/:id', authenticateToken, async (req, res) => {
  const productId = req.params.id;

  if (!productId || isNaN(Number(productId))) {
    return res.status(400).json({
      success: false,
      message: 'Geçerli bir ürün ID gerekli'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Önce ürünün var olup olmadığını kontrol et
    const [productCheck] = await connection.execute(
      'SELECT id, name FROM products WHERE id = ?',
      [productId]
    ) as [RowDataPacket[], any];

    if (productCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    const productName = productCheck[0].name;

    // İlişkili tabloları temizle (CASCADE olduğu için otomatik silinecek ama manuel yapalım)
    await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM product_reviews WHERE product_id = ?', [productId]);
    
    // Ana ürünü sil
    const [deleteResult] = await connection.execute(
      'DELETE FROM products WHERE id = ?',
      [productId]
    ) as [ResultSetHeader, any];

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ürün silinemedi'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Ürün "${productName}" başarıyla silindi`,
      data: {
        deleted_product_id: productId,
        deleted_product_name: productName
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Ürün silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

export default router;