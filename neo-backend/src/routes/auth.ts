import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();

// Rate limiting kaldırıldı

const JWT_SECRET = process.env.JWT_SECRET || 'neo-secret-key-2024';

// Validation middleware
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
];

const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('İsim en az 2 karakter olmalı'),
  body('email').isEmail().normalizeEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
];

// LOGIN
router.post('/login', loginValidation, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Girilen bilgilerde hata var',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email]
    );

    const user = (rows as any[])[0];
    if (!user) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Hesabınız devre dışı bırakılmış' });
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu' });
  }
});

// REGISTER
router.post('/register', registerValidation, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Girilen bilgilerde hata var',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // E-posta kontrolü
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingUser as any[]).length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı kaydet
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'user']
    );

    const userId = (result as any).insertId;

    // JWT token oluştur
    const token = jwt.sign(
      { userId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Kayıt başarılı',
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu' });
  }
});

export default router;