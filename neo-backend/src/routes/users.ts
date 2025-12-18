import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'neo-secret-key-2024';

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

// Kullanıcıları listele
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR email LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryParams.push(parseInt(limit as string), offset);

    const [users] = await pool.query(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, queryParams);

    // Toplam sayı
    const countParams = queryParams.slice(0, -2);
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `, countParams);

    const total = (countResult as any[])[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Kullanıcılar yüklenirken hata oluştu' });
  }
});

// Kullanıcı detayı
router.get('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const [users] = await pool.query(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      WHERE id = ?
    `, [userId]);

    const user = (users as any[])[0];
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kullanıcının yorum istatistikleri
    const [reviewStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reviews,
        AVG(rating) as avg_rating
      FROM reviews
      WHERE user_id = ?
    `, [userId]);

    const stats = (reviewStats as any[])[0];

    res.json({
      user,
      stats: {
        total_reviews: stats.total_reviews || 0,
        approved_reviews: stats.approved_reviews || 0,
        pending_reviews: stats.pending_reviews || 0,
        rejected_reviews: stats.rejected_reviews || 0,
        avg_rating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ message: 'Kullanıcı detayı yüklenirken hata oluştu' });
  }
});

// Kullanıcı durumunu güncelle (aktif/pasif)
router.patch('/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active boolean değer olmalı' });
    }

    // Kendi hesabını devre dışı bırakmasını engelle
    if (req.user.userId === userId && !is_active) {
      return res.status(400).json({ message: 'Kendi hesabınızı devre dışı bırakamazsınız' });
    }

    const [result] = await pool.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı durumu güncellendi' });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Kullanıcı durumu güncellenirken hata oluştu' });
  }
});

// Kullanıcı rolünü güncelle
router.patch('/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol user veya admin olmalı' });
    }

    // Kendi rolünü değiştirmesini engelle
    if (req.user.userId === userId) {
      return res.status(400).json({ message: 'Kendi rolünüzü değiştiremezsiniz' });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı rolü güncellendi' });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Kullanıcı rolü güncellenirken hata oluştu' });
  }
});

export default router;