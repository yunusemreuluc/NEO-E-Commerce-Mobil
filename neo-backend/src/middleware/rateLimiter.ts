import { NextFunction, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { db } from '../db';

interface RateLimitOptions {
  windowMs: number; // Zaman penceresi (ms)
  max: number; // Maksimum istek sayısı
  message: string; // Limit aşıldığında gösterilecek mesaj
  skipSuccessfulRequests?: boolean;
}

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const rateLimiter = (options: RateLimitOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Kimlik doğrulama gerekli' 
      });
    }

    const userId = req.user.id;
    const actionType = req.path.includes('image') ? 'image_upload' : 'review_submit';
    const now = new Date();
    const windowStart = new Date(now.getTime() - options.windowMs);

    try {
      // Mevcut penceredeki istek sayısını kontrol et
      const [existing] = await db.execute<RowDataPacket[]>(
        `SELECT count, window_start FROM rate_limits 
         WHERE user_id = ? AND action_type = ? AND window_start > ?
         ORDER BY window_start DESC LIMIT 1`,
        [userId, actionType, windowStart]
      );

      if (existing.length > 0) {
        const currentCount = existing[0].count;
        
        if (currentCount >= options.max) {
          const resetTime = new Date(existing[0].window_start.getTime() + options.windowMs);
          const remainingMs = resetTime.getTime() - now.getTime();
          const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
          
          return res.status(429).json({
            success: false,
            message: options.message,
            retryAfter: remainingMinutes
          });
        }

        // Sayacı artır
        await db.execute(
          `UPDATE rate_limits SET count = count + 1 WHERE user_id = ? AND action_type = ? AND window_start = ?`,
          [userId, actionType, existing[0].window_start]
        );
      } else {
        // Yeni pencere oluştur
        await db.execute(
          `INSERT INTO rate_limits (user_id, action_type, count, window_start) VALUES (?, ?, 1, ?)`,
          [userId, actionType, now]
        );
      }

      // Eski kayıtları temizle (performans için)
      await db.execute(
        `DELETE FROM rate_limits WHERE window_start < ?`,
        [new Date(now.getTime() - options.windowMs * 2)]
      );

      next();
    } catch (error) {
      console.error('Rate limiting hatası:', error);
      // Hata durumunda devam et (güvenlik açısından)
      next();
    }
  };
};