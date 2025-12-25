import express, { Request } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Admin middleware
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin yetkisi gerekli' 
    });
  }
  next();
};

// Kullanıcıları listele
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Kullanıcıları getir
    const [users] = await db.execute(`
      SELECT id, name, email, role, is_active, created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count,
             (SELECT COUNT(*) FROM product_reviews WHERE user_id = users.id) as review_count
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, queryParams) as [RowDataPacket[], any];

    // Toplam sayı
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `, queryParams) as [RowDataPacket[], any];

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Kullanıcılar yüklenirken hata oluştu' 
    });
  }
});

// Kullanıcı detayı
router.get('/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const [users] = await db.execute(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      WHERE id = ?
    `, [userId]) as [RowDataPacket[], any];

    const user = users[0];
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // Kullanıcının istatistikleri
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent
      FROM orders
      WHERE user_id = ?
    `, [userId]) as [RowDataPacket[], any];

    const [reviewStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
      FROM product_reviews
      WHERE user_id = ?
    `, [userId]) as [RowDataPacket[], any];

    const stats = {
      total_orders: orderStats[0]?.total_orders || 0,
      total_spent: parseFloat(orderStats[0]?.total_spent || 0),
      total_reviews: reviewStats[0]?.total_reviews || 0,
      avg_rating: reviewStats[0]?.avg_rating ? parseFloat(reviewStats[0].avg_rating).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: { user, stats }
    });

  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Kullanıcı detayı yüklenirken hata oluştu' 
    });
  }
});

// Kullanıcı durumunu güncelle (aktif/pasif)
router.patch('/:userId/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        message: 'is_active boolean değer olmalı' 
      });
    }

    // Kendi hesabını devre dışı bırakmasını engelle
    if (req.user?.id === userId && !is_active) {
      return res.status(400).json({ 
        success: false,
        message: 'Kendi hesabınızı devre dışı bırakamazsınız' 
      });
    }

    const [result] = await db.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({ 
      success: true,
      message: 'Kullanıcı durumu güncellendi' 
    });

  } catch (error) {
    console.error('Kullanıcı durumu güncelleme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Kullanıcı durumu güncellenirken hata oluştu' 
    });
  }
});

// Kullanıcı rolünü güncelle
router.patch('/:userId/role', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Rol user veya admin olmalı' 
      });
    }

    // Kendi rolünü değiştirmesini engelle
    if (req.user?.id === userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Kendi rolünüzü değiştiremezsiniz' 
      });
    }

    const [result] = await db.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({ 
      success: true,
      message: 'Kullanıcı rolü güncellendi' 
    });

  } catch (error) {
    console.error('Kullanıcı rolü güncelleme hatası:', error);
    res.status(500).json({ 
      success: false,
      message: 'Kullanıcı rolü güncellenirken hata oluştu' 
    });
  }
});

// Kullanıcı sil (gerçek silme)
router.delete('/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.userId);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Geçerli bir kullanıcı ID gerekli'
    });
  }

  // Kendi hesabını silmesini engelle
  if (req.user?.id === userId) {
    return res.status(400).json({
      success: false,
      message: 'Kendi hesabınızı silemezsiniz'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Önce kullanıcının var olup olmadığını kontrol et
    const [userCheck] = await connection.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (userCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const userName = userCheck[0].name;
    const userEmail = userCheck[0].email;

    // İlişkili tabloları temizle
    await connection.execute('DELETE FROM product_reviews WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM addresses WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM payment_methods WHERE user_id = ?', [userId]);
    
    // Siparişleri ve ilişkili verileri sil
    const [userOrders] = await connection.execute(
      'SELECT id FROM orders WHERE user_id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    for (const order of userOrders) {
      await connection.execute('DELETE FROM order_status_history WHERE order_id = ?', [order.id]);
      await connection.execute('DELETE FROM order_payments WHERE order_id = ?', [order.id]);
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
    }
    
    await connection.execute('DELETE FROM orders WHERE user_id = ?', [userId]);
    
    // Ana kullanıcıyı sil
    const [deleteResult] = await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    ) as [ResultSetHeader, any];

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı silinemedi'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Kullanıcı "${userName}" (${userEmail}) başarıyla silindi`,
      data: {
        deleted_user_id: userId,
        deleted_user_name: userName,
        deleted_user_email: userEmail
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

export default router;