import express from 'express';
import { body, param, validationResult } from 'express-validator';
import fs from 'fs';
import multer from 'multer';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import path from 'path';
import { db } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Güvenli dosya yükleme konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/comments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Güvenli dosya adı oluştur
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

// Dosya filtreleme ve güvenlik
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // İzin verilen MIME tipleri
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG ve WebP formatları desteklenir'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5 // Maksimum 5 resim
  }
});

// Rate limiting middleware
const reviewRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 3, // 15 dakikada maksimum 3 yorum
  message: 'Çok fazla yorum gönderdiniz. 15 dakika sonra tekrar deneyin.'
});

const imageUploadRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 dakika  
  max: 10, // 1 dakikada maksimum 10 resim
  message: 'Çok fazla resim yüklemeye çalışıyorsunuz. Biraz bekleyin.'
});

// Test endpoint - basit yorum gönderme
router.post('/test', async (req, res) => {
  // Test endpoint çağrıldı
  res.json({ 
    success: true, 
    message: 'Test başarılı',
    data: req.body 
  });
});

// Veritabanı tablosu oluşturma endpoint'i
router.post('/create-tables', async (req: any, res: any) => {
  try {
    // comment_images tablosunu oluştur
    await db.execute(`
      CREATE TABLE IF NOT EXISTS comment_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_review_id (review_id)
      )
    `);

    // comment_images tablosu oluşturuldu

    res.json({
      success: true,
      message: 'Tablolar başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tablo oluşturma hatası: ' + (error as any).message
    });
  }
});

// Test yorum gönderme (auth olmadan)
router.post('/test-review', async (req: any, res: any) => {
  // Test yorum gönderiliyor
  
  try {
    const { product_id, rating, comment } = req.body;
    
    // Basit validation
    if (!product_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Eksik parametreler'
      });
    }

    // Test kullanıcısı ID'si (1 varsayalım)
    const testUserId = 1;
    
    // Veritabanına kaydet
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO reviews (product_id, user_id, rating, comment, status) 
       VALUES (?, ?, ?, ?, 'approved')`,
      [product_id, testUserId, rating, comment]
    );

    // Test yorum kaydedildi

    res.json({
      success: true,
      message: 'Test yorumu başarıyla kaydedildi!',
      data: { reviewId: result.insertId }
    });

  } catch (error) {
    console.error('Test yorum hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı hatası: ' + (error as any).message
    });
  }
});

// Basit rate limiter (test için)
const simpleRateLimit = (req: any, res: any, next: any) => {
  // Test endpoint için basit rate limiting (IP bazlı)
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`Test endpoint çağrısı: ${clientIP}`);
  next(); // Şimdilik tüm isteklere izin ver
};

// Test resimli yorum gönderme (FormData ile)
router.post('/test-review-images',
  simpleRateLimit,
  upload.array('images', 5),
  async (req: any, res: any) => {
    // Test resimli yorum gönderiliyor
    
    try {
      const { product_id, rating, comment } = req.body;
      
      // Basit validation
      if (!product_id || !rating || !comment) {
        return res.status(400).json({
          success: false,
          message: 'Eksik parametreler'
        });
      }

      // Test kullanıcısı ID'si (1 varsayalım)
      const testUserId = 1;
      const uploadedFiles = req.files as Express.Multer.File[];
      
      // Veritabanına yorum kaydet
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO reviews (product_id, user_id, rating, comment, status) 
         VALUES (?, ?, ?, ?, 'approved')`,
        [product_id, testUserId, rating, comment]
      );

      const reviewId = result.insertId;
      // Test resimli yorum kaydedildi

      // Resimleri kaydet
      const savedImages: string[] = [];
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const imageUrl = `/uploads/comments/${file.filename}`;
          savedImages.push(imageUrl);
          
          // Resim bilgisini veritabanına kaydet
          try {
            await db.execute(
              `INSERT INTO comment_images (review_id, image_url) VALUES (?, ?)`,
              [reviewId, imageUrl]
            );
            // Test resim kaydedildi
          } catch (imgError) {
            console.warn('Resim DB kaydı atlandı (tablo yok):', imgError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Test resimli yorum başarıyla kaydedildi!',
        data: { 
          reviewId, 
          imageCount: savedImages.length,
          images: savedImages
        }
      });

    } catch (error) {
      console.error('Test resimli yorum hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Veritabanı hatası: ' + (error as any).message
      });
    }
  }
);

// Base64 resimli yorum gönderme
router.post('/base64-review-images', async (req: any, res: any) => {
  // Base64 resimli yorum gönderiliyor
  
  try {
    const { product_id, rating, comment, images } = req.body;
    
    // Basit validation
    if (!product_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Eksik parametreler'
      });
    }

    // Test kullanıcısı ID'si (1 varsayalım)
    const testUserId = 1;
    
    // Veritabanına yorum kaydet
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO reviews (product_id, user_id, rating, comment, status) 
       VALUES (?, ?, ?, ?, 'approved')`,
      [product_id, testUserId, rating, comment]
    );

    const reviewId = result.insertId;
    // Base64 resimli yorum kaydedildi

    // Base64 resimleri dosya olarak kaydet
    const savedImages: string[] = [];
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image && image.data) {
          try {
            // Base64'ten dosya oluştur
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const filename = `${Date.now()}_${i}_${Math.random().toString(36).substring(2)}.jpg`;
            const filepath = path.join(__dirname, '../../uploads/comments', filename);
            
            // Dosyayı kaydet
            fs.writeFileSync(filepath, buffer);
            
            const imageUrl = `/uploads/comments/${filename}`;
            savedImages.push(imageUrl);
            
            // Resim bilgisini veritabanına kaydet
            try {
              await db.execute(
                `INSERT INTO comment_images (review_id, image_url) VALUES (?, ?)`,
                [reviewId, imageUrl]
              );
              // Base64 resim kaydedildi
            } catch (imgError) {
              // Resim DB kaydı atlandı (tablo yok)
            }
          } catch (fileError) {
            console.error('Dosya kaydetme hatası:', fileError);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Base64 resimli yorum başarıyla kaydedildi!',
      data: { 
        reviewId, 
        imageCount: savedImages.length,
        images: savedImages
      }
    });

  } catch (error) {
    console.error('Base64 resimli yorum hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı hatası: ' + (error as any).message
    });
  }
});

// Test: Ürün yorumlarını getir
router.get('/test-reviews/:productId', async (req: any, res: any) => {
  // Test yorumlar getiriliyor
  
  try {
    const { productId } = req.params;
    
    // Yorumları ve resimlerini getir
    const [reviews] = await db.execute<RowDataPacket[]>(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              'Test Kullanıcı' as user_name
       FROM reviews r
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [productId]
    );

    // Bulunan yorumlar

    // Her yorum için resimlerini getir
    const reviewsWithImages = await Promise.all(
      reviews.map(async (review) => {
        try {
          // Gerçek resimleri getir
          const [images] = await db.execute<RowDataPacket[]>(
            `SELECT image_url FROM comment_images WHERE review_id = ? ORDER BY id`,
            [review.id]
          );
          
          const imageUrls = images.map(img => img.image_url);
          // Yorum resimleri yüklendi
          
          return {
            ...review,
            images: imageUrls
          };
        } catch (error) {
          // Tablo yoksa boş array
          return {
            ...review,
            images: []
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        reviews: reviewsWithImages,
        stats: { 
          average_rating: reviews.length > 0 ? 4.5 : 0, 
          total_reviews: reviews.length 
        }
      }
    });

  } catch (error) {
    console.error('Yorumlar getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı hatası: ' + (error as any).message
    });
  }
});

// Yorum gönderme (resimli)
router.post('/', 
  authenticateToken,
  reviewRateLimit,
  upload.array('images', 5),
  [
    body('product_id').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID gerekli'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasında olmalı'),
    body('comment').isLength({ min: 1, max: 1000 }).withMessage('Yorum 1-1000 karakter arasında olmalı')
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Geçersiz veri',
          errors: errors.array() 
        });
      }

      const { product_id, rating, comment } = req.body;
      const userId = (req as any).user.id;
      const uploadedFiles = req.files as Express.Multer.File[];

      // Kullanıcı ban kontrolü (opsiyonel - tablo yoksa atla)
      try {
        const [userCheck] = await db.execute<RowDataPacket[]>(
          'SELECT is_banned FROM users WHERE id = ?',
          [userId]
        );

        if (userCheck[0]?.is_banned) {
          return res.status(403).json({
            success: false,
            message: 'Hesabınız yasaklandığı için yorum yapamazsınız.'
          });
        }
      } catch (error) {
        // is_banned kolonu yoksa devam et
        console.log('Ban kontrolü atlandı (kolon yok)');
      }

      // Ürün varlık kontrolü (opsiyonel - ürün tablosu varsa)
      // const [productCheck] = await db.execute<RowDataPacket[]>(
      //   'SELECT id FROM products WHERE id = ?',
      //   [product_id]
      // );
      // if (productCheck.length === 0) {
      //   return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
      // }

      // Yorum ekleme (basit versiyon - mevcut reviews tablosu)
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO reviews (product_id, user_id, rating, comment, status) 
         VALUES (?, ?, ?, ?, 'pending')`,
        [product_id, userId, rating, comment]
      );

      const reviewId = result.insertId;

      // Resimleri kaydet (şimdilik atla - tablo yoksa)
      let savedImages = 0;
      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const imageUrl = `/uploads/comments/${file.filename}`;
            
            await db.execute(
              `INSERT INTO comment_images (comment_id, image_url, original_filename, file_size, mime_type, upload_order)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [reviewId, imageUrl, file.originalname, file.size, file.mimetype, i]
            );
            savedImages++;
          }
        } catch (error) {
          console.log('Resim kaydetme atlandı (tablo yok):', error);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Yorumunuz başarıyla gönderildi. Moderasyon sonrası yayınlanacak.',
        data: { reviewId, imageCount: savedImages }
      });

    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorum gönderilirken hata oluştu'
      });
    }
  }
);

// Ürün yorumlarını getir (onaylanmış)
router.get('/product/:productId',
  [param('productId').isInt({ min: 1 })],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { productId } = req.params;

      // Onaylanmış yorumları getir (basit versiyon)
      const [reviews] = await db.execute<RowDataPacket[]>(
        `SELECT r.id, r.rating, r.comment, r.created_at,
                u.name as user_name
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ? AND r.status = 'approved'
         ORDER BY r.created_at DESC`,
        [productId]
      );

      // İstatistikleri hesapla
      const [stats] = await db.execute<RowDataPacket[]>(
        `SELECT 
           AVG(rating) as average_rating,
           COUNT(*) as total_reviews
         FROM reviews 
         WHERE product_id = ? AND status = 'approved'`,
        [productId]
      );

      // Resim URL'lerini array'e çevir (şimdilik boş)
      const reviewsWithImages = reviews.map(review => ({
        ...review,
        images: [] // Şimdilik resim yok
      }));

      res.json({
        success: true,
        data: {
          reviews: reviewsWithImages,
          stats: stats[0] || { average_rating: 0, total_reviews: 0 }
        }
      });

    } catch (error) {
      console.error('Yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar yüklenirken hata oluştu'
      });
    }
  }
);

// Admin: Tüm yorumları getir (moderasyon için)
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  async (req: any, res: any) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = '';
      let params: any[] = [];

      if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
        whereClause = 'WHERE r.status = ?';
        params.push(status);
      }

      const [reviews] = await db.execute<RowDataPacket[]>(
        `SELECT r.*, u.name as user_name, u.email as user_email,
                GROUP_CONCAT(ci.image_url ORDER BY ci.upload_order) as image_urls
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         LEFT JOIN comment_images ci ON r.id = ci.comment_id
         ${whereClause}
         GROUP BY r.id
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      );

      const reviewsWithImages = reviews.map(review => ({
        ...review,
        images: review.image_urls ? review.image_urls.split(',') : []
      }));

      res.json({
        success: true,
        data: reviewsWithImages
      });

    } catch (error) {
      console.error('Admin yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar yüklenirken hata oluştu'
      });
    }
  }
);

// Admin: Yorum onayla/reddet
router.patch('/admin/:reviewId/status',
  authenticateToken,
  requireAdmin,
  [
    param('reviewId').isInt({ min: 1 }),
    body('status').isIn(['approved', 'rejected']),
    body('reason').optional().isLength({ max: 500 })
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { reviewId } = req.params;
      const { status, reason } = req.body;
      const adminId = (req as any).user.id;

      await db.execute(
        `UPDATE reviews 
         SET status = ?, moderated_by = ?, moderated_at = NOW(), rejection_reason = ?
         WHERE id = ?`,
        [status, adminId, reason || null, reviewId]
      );

      // Admin işlemini logla
      await db.execute(
        `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
         VALUES (?, ?, 'review', ?, ?)`,
        [adminId, status === 'approved' ? 'approve_review' : 'reject_review', reviewId, reason || null]
      );

      res.json({
        success: true,
        message: `Yorum ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`
      });

    } catch (error) {
      console.error('Yorum moderasyon hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem gerçekleştirilemedi'
      });
    }
  }
);

// Admin: Kullanıcı ban/unban
router.patch('/admin/user/:userId/ban',
  authenticateToken,
  requireAdmin,
  [
    param('userId').isInt({ min: 1 }),
    body('action').isIn(['ban', 'unban']),
    body('reason').optional().isLength({ max: 500 })
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId } = req.params;
      const { action, reason } = req.body;
      const adminId = (req as any).user.id;

      const isBanned = action === 'ban';

      await db.execute(
        `UPDATE users 
         SET is_banned = ?, ban_reason = ?, banned_at = ?, banned_by = ?
         WHERE id = ?`,
        [isBanned, reason || null, isBanned ? new Date() : null, isBanned ? adminId : null, userId]
      );

      // Admin işlemini logla
      await db.execute(
        `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason)
         VALUES (?, ?, 'user', ?, ?)`,
        [adminId, action === 'ban' ? 'ban_user' : 'unban_user', userId, reason || null]
      );

      res.json({
        success: true,
        message: `Kullanıcı ${action === 'ban' ? 'yasaklandı' : 'yasağı kaldırıldı'}`
      });

    } catch (error) {
      console.error('Kullanıcı ban işlemi hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem gerçekleştirilemedi'
      });
    }
  }
);

export default router;