import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { db } from '../db';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Erişim token gerekli' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'neo-secret-key-2024') as any;
    
    // Kullanıcı bilgilerini veritabanından al
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }

    req.user = users[0] as any;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Geçersiz token' 
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin yetkisi gerekli' 
    });
  }
  next();
};

export const checkBanStatus = (req: AuthRequest, res: Response, next: NextFunction) => {
  // is_banned kolonu olmadığı için bu kontrolü atlıyoruz
  next();
};