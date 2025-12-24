// neo-backend/src/routes/payment-methods.ts
import express from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Kullanıcının ödeme yöntemlerini listele
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const [paymentMethods] = await db.execute(
      `SELECT id, card_holder_name, card_brand, card_last4, 
              exp_month, exp_year, is_default, created_at
       FROM payment_methods 
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Ödeme yöntemleri listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme yöntemleri yüklenirken bir hata oluştu'
    });
  }
});

// Yeni ödeme yöntemi ekle (demo)
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const {
    card_holder_name,
    card_number, // Demo için tam numara alıyoruz ama sadece son 4 hanesi saklanacak
    exp_month,
    exp_year,
    cvv, // CVV saklanmayacak
    is_default = false
  } = req.body;

  // Validasyon
  if (!card_holder_name || !card_number || !exp_month || !exp_year) {
    return res.status(400).json({
      success: false,
      message: 'Tüm kart bilgileri gereklidir'
    });
  }

  // Kart numarası validasyonu (basit)
  const cleanCardNumber = card_number.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanCardNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz kart numarası'
    });
  }

  // Tarih validasyonu
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  if (exp_year < currentYear || (exp_year === currentYear && exp_month < currentMonth)) {
    return res.status(400).json({
      success: false,
      message: 'Kart süresi geçmiş'
    });
  }

  try {
    // Kart markası belirleme (basit)
    let cardBrand = 'unknown';
    if (cleanCardNumber.startsWith('4')) {
      cardBrand = 'visa';
    } else if (cleanCardNumber.startsWith('5') || cleanCardNumber.startsWith('2')) {
      cardBrand = 'mastercard';
    } else if (cleanCardNumber.startsWith('3')) {
      cardBrand = 'amex';
    }

    // Son 4 hane
    const cardLast4 = cleanCardNumber.slice(-4);
    
    // Demo token oluştur (gerçek uygulamada payment provider'dan gelir)
    const cardToken = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Eğer varsayılan kart olarak işaretlendiyse, diğerlerini varsayılan olmaktan çıkar
    if (is_default) {
      await db.execute(
        'UPDATE payment_methods SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    // Kartı kaydet
    const [result] = await db.execute(
      `INSERT INTO payment_methods (
        user_id, card_holder_name, card_brand, card_last4,
        exp_month, exp_year, card_token, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, card_holder_name, cardBrand, cardLast4, 
       exp_month, exp_year, cardToken, is_default]
    ) as [ResultSetHeader, any];

    res.json({
      success: true,
      message: 'Kart başarıyla eklendi',
      data: {
        id: result.insertId,
        card_holder_name,
        card_brand: cardBrand,
        card_last4: cardLast4,
        exp_month,
        exp_year,
        is_default
      }
    });

  } catch (error) {
    console.error('Kart ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kart eklenirken bir hata oluştu'
    });
  }
});

// Ödeme yöntemini varsayılan yap
router.patch('/:id/set-default', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const paymentMethodId = req.params.id;

  try {
    // Kartın kullanıcıya ait olduğunu kontrol et
    const [cardResult] = await db.execute(
      'SELECT id FROM payment_methods WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [paymentMethodId, userId]
    ) as [RowDataPacket[], any];

    if (cardResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kart bulunamadı'
      });
    }

    // Tüm kartları varsayılan olmaktan çıkar
    await db.execute(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_id = ?',
      [userId]
    );

    // Seçilen kartı varsayılan yap
    await db.execute(
      'UPDATE payment_methods SET is_default = TRUE WHERE id = ?',
      [paymentMethodId]
    );

    res.json({
      success: true,
      message: 'Varsayılan kart güncellendi'
    });

  } catch (error) {
    console.error('Varsayılan kart güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varsayılan kart güncellenirken bir hata oluştu'
    });
  }
});

// Ödeme yöntemini sil
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const paymentMethodId = req.params.id;

  try {
    // Kartın kullanıcıya ait olduğunu kontrol et
    const [cardResult] = await db.execute(
      'SELECT id, is_default FROM payment_methods WHERE id = ? AND user_id = ? AND is_active = TRUE',
      [paymentMethodId, userId]
    ) as [RowDataPacket[], any];

    if (cardResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kart bulunamadı'
      });
    }

    // Kartı pasif yap (tamamen silmek yerine)
    await db.execute(
      'UPDATE payment_methods SET is_active = FALSE, is_default = FALSE WHERE id = ?',
      [paymentMethodId]
    );

    // Eğer varsayılan kart silindiyse, başka bir kartı varsayılan yap
    if (cardResult[0].is_default) {
      await db.execute(
        `UPDATE payment_methods 
         SET is_default = TRUE 
         WHERE user_id = ? AND is_active = TRUE 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );
    }

    res.json({
      success: true,
      message: 'Kart başarıyla silindi'
    });

  } catch (error) {
    console.error('Kart silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kart silinirken bir hata oluştu'
    });
  }
});

export default router;