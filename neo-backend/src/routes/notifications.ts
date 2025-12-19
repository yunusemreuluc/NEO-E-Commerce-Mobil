import express from 'express';
import { param, validationResult } from 'express-validator';
import { RowDataPacket } from 'mysql2';
import { db } from '../db';

const router = express.Router();

// Kullanıcının bildirimlerini getir
router.get('/', 
  // Geçici olarak auth bypass
  // authenticateToken,
  async (req: any, res: any) => {
    try {
      // Geçici olarak user_id = 1 kullan
      const userId = 1; // (req as any).user.id;

      const [notifications] = await db.execute<RowDataPacket[]>(
        `SELECT id, type, title, message, metadata, is_read, created_at 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userId]
      );

      // Metadata'yı parse et
      const processedNotifications = notifications.map(notification => ({
        ...notification,
        metadata: notification.metadata ? 
          (typeof notification.metadata === 'string' ? 
            JSON.parse(notification.metadata) : 
            notification.metadata) : 
          null
      }));

      res.json({
        success: true,
        data: processedNotifications
      });

    } catch (error) {
      console.error('Bildirimler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirimler yüklenemedi'
      });
    }
  }
);

// Bildirimi okundu olarak işaretle
router.patch('/:notificationId/read',
  // authenticateToken,
  [param('notificationId').isInt({ min: 1 })],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { notificationId } = req.params;
      const userId = 1; // (req as any).user.id;

      await db.execute(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );

      res.json({
        success: true,
        message: 'Bildirim okundu olarak işaretlendi'
      });

    } catch (error) {
      console.error('Bildirim okundu işaretleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem gerçekleştirilemedi'
      });
    }
  }
);

// Tüm bildirimleri okundu olarak işaretle
router.patch('/read-all',
  // authenticateToken,
  async (req: any, res: any) => {
    try {
      const userId = 1; // (req as any).user.id;

      await db.execute(
        `UPDATE notifications 
         SET is_read = TRUE 
         WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );

      res.json({
        success: true,
        message: 'Tüm bildirimler okundu olarak işaretlendi'
      });

    } catch (error) {
      console.error('Tüm bildirimler okundu işaretleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem gerçekleştirilemedi'
      });
    }
  }
);

// Bildirimi sil
router.delete('/:notificationId',
  // authenticateToken,
  [param('notificationId').isInt({ min: 1 })],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { notificationId } = req.params;
      const userId = 1; // (req as any).user.id;

      await db.execute(
        `DELETE FROM notifications 
         WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
      );

      res.json({
        success: true,
        message: 'Bildirim silindi'
      });

    } catch (error) {
      console.error('Bildirim silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim silinemedi'
      });
    }
  }
);

// Bildirim tablosunu güncelle (metadata kolonu ekle)
router.post('/update-table',
  async (req: any, res: any) => {
    try {
      // Metadata kolonu ekle (MySQL uyumlu)
      try {
        await db.execute(`
          ALTER TABLE notifications 
          ADD COLUMN metadata JSON NULL
        `);
      } catch (error: any) {
        // Kolon zaten varsa devam et
        if (!error.message.includes('Duplicate column name')) {
          throw error;
        }
      }

      res.json({
        success: true,
        message: 'Bildirim tablosu güncellendi'
      });

    } catch (error) {
      console.error('Tablo güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Tablo güncellenemedi: ' + (error as any).message
      });
    }
  }
);

// Bildirim oluştur (admin panelinden)
router.post('/',
  async (req: any, res: any) => {
    try {
      const { user_id, type, title, message, metadata } = req.body;
      
      if (!user_id || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Eksik parametreler'
        });
      }

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, type, title, message, metadata ? JSON.stringify(metadata) : null]
      );

      res.json({
        success: true,
        message: 'Bildirim oluşturuldu'
      });

    } catch (error) {
      console.error('Bildirim oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim oluşturulamadı'
      });
    }
  }
);

// Test bildirimi oluştur
router.post('/test',
  async (req: any, res: any) => {
    try {
      const userId = 1;
      
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
         VALUES (?, 'test', 'Test Bildirimi', 'Bu bir test bildirimidir.', ?, NOW())`,
        [userId, JSON.stringify({product_name: 'Test Ürün', product_id: 1})]
      );

      res.json({
        success: true,
        message: 'Test bildirimi oluşturuldu'
      });

    } catch (error) {
      console.error('Test bildirimi oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Test bildirimi oluşturulamadı'
      });
    }
  }
);

export default router;