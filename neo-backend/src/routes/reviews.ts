import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'neo-secret-key-2024';

// Rate limiting kaldırıldı - kullanıcılar istediği kadar yorum yapabilir

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Giriş yapmanız gerekiyor' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
  next();
};

// Validation
const reviewValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID\'si gerekli'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasında olmalı'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Yorum 10-1000 karakter arasında olmalı'),
];

// Ürün yorumlarını listele (onaylı olanlar)
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    
    const [reviews] = await pool.query(`
      SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `, [productId]);

    // Ortalama puan hesapla
    const [avgResult] = await pool.query(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews 
      WHERE product_id = ? AND status = 'approved'
    `, [productId]);

    const stats = (avgResult as any[])[0];

    res.json({
      reviews,
      stats: {
        average_rating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 0,
        total_reviews: stats.total_reviews || 0
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Yorumlar yüklenirken hata oluştu' });
  }
});

// Yorum ekle
router.post('/', authenticateToken, reviewValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Girilen bilgilerde hata var',
        errors: errors.array()
      });
    }

    const { product_id, rating, comment } = req.body;
    const userId = req.user.userId;

    // Aynı ürüne birden fazla yorum yapılabilir - kısıtlama kaldırıldı

    // Ürün var mı kontrol et
    const [product] = await pool.query(
      'SELECT id FROM products WHERE id = ? AND is_active = 1',
      [product_id]
    );

    if ((product as any[]).length === 0) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Yorumu kaydet (otomatik onaylı)
    const [result] = await pool.query(`
      INSERT INTO reviews (product_id, user_id, rating, comment, status)
      VALUES (?, ?, ?, ?, 'approved')
    `, [product_id, userId, rating, comment]);

    res.status(201).json({
      message: 'Yorumunuz başarıyla eklendi.',
      review_id: (result as any).insertId
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Yorum eklenirken hata oluştu' });
  }
});

// Admin: Tüm yorumları listele (filtreleme ile)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, product_id, user_id, page = 1, limit = 20 } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('r.status = ?');
      queryParams.push(status);
    }

    if (product_id) {
      whereConditions.push('r.product_id = ?');
      queryParams.push(product_id);
    }

    if (user_id) {
      whereConditions.push('r.user_id = ?');
      queryParams.push(user_id);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryParams.push(parseInt(limit as string), offset);

    const [reviews] = await pool.query(`
      SELECT 
        r.id, r.product_id, r.user_id, r.rating, r.comment, r.status, r.created_at,
        u.name as user_name, u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // Toplam sayı
    const countParams = queryParams.slice(0, -2); // limit ve offset'i çıkar
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
    `, countParams);

    const total = (countResult as any[])[0].total;

    res.json({
      reviews,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ message: 'Yorumlar yüklenirken hata oluştu' });
  }
});

// Admin: Yorum durumunu güncelle (onayla/reddet)
router.patch('/admin/:reviewId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum. pending, approved veya rejected olmalı' });
    }

    const [result] = await pool.query(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [status, reviewId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    res.json({ message: 'Yorum durumu güncellendi' });

  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ message: 'Yorum durumu güncellenirken hata oluştu' });
  }
});

export default router;