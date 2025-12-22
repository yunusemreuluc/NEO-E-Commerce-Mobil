// neo-backend/src/routes/addresses.ts
import { Router } from "express";
import pool from "../db";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Tüm adres işlemleri için authentication gerekli
router.use(authenticateToken);

// Kullanıcının adreslerini listele
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const [rows] = await pool.query(`
      SELECT id, title, full_name, phone, full_address as address_line, district, city, postal_code, is_default, created_at
      FROM addresses 
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error("GET /addresses error:", error);
    res.status(500).json({ message: "Adresler yüklenirken bir hata oluştu." });
  }
});

// Belirli bir adresi getir
router.get("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const addressId = Number(req.params.id);
    
    const [rows] = await pool.query(`
      SELECT id, title, full_name, phone, full_address as address_line, district, city, postal_code, is_default
      FROM addresses 
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `, [addressId, userId]);
    
    const address = (rows as any[])[0];
    if (!address) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }
    
    res.json(address);
  } catch (error) {
    console.error("GET /addresses/:id error:", error);
    res.status(500).json({ message: "Adres getirilemedi." });
  }
});

// Yeni adres ekle
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { title, full_name, phone, address_line, district, city, postal_code, is_default } = req.body;
    
    // Zorunlu alanları kontrol et
    if (!title || !full_name || !phone || !address_line || !district || !city) {
      return res.status(400).json({ 
        message: "Başlık, ad soyad, telefon, adres, ilçe ve il alanları zorunludur." 
      });
    }
    
    // Telefon numarası formatını kontrol et (basit kontrol)
    const phoneRegex = /^[0-9\s\-\+\(\)]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        message: "Geçerli bir telefon numarası giriniz." 
      });
    }
    
    // Eğer varsayılan adres olarak işaretlendiyse, diğerlerini varsayılan olmaktan çıkar
    if (is_default) {
      await pool.query(`
        UPDATE addresses SET is_default = 0 
        WHERE user_id = ?
      `, [userId]);
    }
    
    const [result] = await pool.query(`
      INSERT INTO addresses (user_id, title, full_name, phone, full_address, district, city, postal_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, title, full_name, phone, address_line, district, city, postal_code || null, is_default ? 1 : 0]);
    
    const insertId = (result as any).insertId;
    
    // Eklenen adresi geri döndür
    const [rows] = await pool.query(`
      SELECT id, title, full_name, phone, full_address as address_line, district, city, postal_code, is_default, created_at
      FROM addresses WHERE id = ?
    `, [insertId]);
    
    res.status(201).json((rows as any[])[0]);
  } catch (error) {
    console.error("POST /addresses error:", error);
    res.status(500).json({ message: "Adres eklenirken bir hata oluştu." });
  }
});

// Adres güncelle
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const addressId = Number(req.params.id);
    const { title, full_name, phone, address_line, district, city, postal_code, is_default } = req.body;
    
    // Zorunlu alanları kontrol et
    if (!title || !full_name || !phone || !address_line || !district || !city) {
      return res.status(400).json({ 
        message: "Başlık, ad soyad, telefon, adres, ilçe ve il alanları zorunludur." 
      });
    }
    
    // Telefon numarası formatını kontrol et
    const phoneRegex = /^[0-9\s\-\+\(\)]{10,20}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        message: "Geçerli bir telefon numarası giriniz." 
      });
    }
    
    // Adresin kullanıcıya ait olduğunu kontrol et
    const [checkRows] = await pool.query(`
      SELECT id FROM addresses WHERE id = ? AND user_id = ?
    `, [addressId, userId]);
    
    if ((checkRows as any[]).length === 0) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }
    
    // Eğer varsayılan adres olarak işaretlendiyse, diğerlerini varsayılan olmaktan çıkar
    if (is_default) {
      await pool.query(`
        UPDATE addresses SET is_default = 0 
        WHERE user_id = ? AND id != ?
      `, [userId, addressId]);
    }
    
    const [result] = await pool.query(`
      UPDATE addresses SET 
        title = ?, full_name = ?, phone = ?, full_address = ?, 
        district = ?, city = ?, postal_code = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `, [title, full_name, phone, address_line, district, city, postal_code || null, is_default ? 1 : 0, addressId, userId]);
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Adres güncellenemedi." });
    }
    
    // Güncellenmiş adresi geri döndür
    const [rows] = await pool.query(`
      SELECT id, title, full_name, phone, full_address as address_line, district, city, postal_code, is_default, created_at
      FROM addresses WHERE id = ?
    `, [addressId]);
    
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error("PUT /addresses/:id error:", error);
    res.status(500).json({ message: "Adres güncellenirken bir hata oluştu." });
  }
});

// Adresi varsayılan yap
router.patch("/:id/set-default", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const addressId = Number(req.params.id);
    
    // Adresin kullanıcıya ait olduğunu kontrol et
    const [checkRows] = await pool.query(`
      SELECT id FROM addresses WHERE id = ? AND user_id = ?
    `, [addressId, userId]);
    
    if ((checkRows as any[]).length === 0) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }
    
    // Önce tüm adresleri varsayılan olmaktan çıkar
    await pool.query(`
      UPDATE addresses SET is_default = 0 
      WHERE user_id = ?
    `, [userId]);
    
    // Seçilen adresi varsayılan yap
    await pool.query(`
      UPDATE addresses SET is_default = 1 
      WHERE id = ? AND user_id = ?
    `, [addressId, userId]);
    
    res.json({ message: "Varsayılan adres güncellendi." });
  } catch (error) {
    console.error("PATCH /addresses/:id/set-default error:", error);
    res.status(500).json({ message: "Varsayılan adres güncellenirken bir hata oluştu." });
  }
});

// Adres sil (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const addressId = Number(req.params.id);
    
    // Adresin kullanıcıya ait olduğunu kontrol et
    const [checkRows] = await pool.query(`
      SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?
    `, [addressId, userId]);
    
    if ((checkRows as any[]).length === 0) {
      return res.status(404).json({ message: "Adres bulunamadı." });
    }
    
    const address = (checkRows as any[])[0];
    
    // Adresi sil
    const [result] = await pool.query(`
      DELETE FROM addresses WHERE id = ? AND user_id = ?
    `, [addressId, userId]);
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Adres silinemedi." });
    }
    
    // Eğer silinen adres varsayılandı ve başka adres varsa, ilkini varsayılan yap
    if (address.is_default) {
      const [otherAddresses] = await pool.query(`
        SELECT id FROM addresses WHERE user_id = ? LIMIT 1
      `, [userId]);
      
      if ((otherAddresses as any[]).length > 0) {
        const firstAddressId = (otherAddresses as any[])[0].id;
        await pool.query(`
          UPDATE addresses SET is_default = 1 WHERE id = ?
        `, [firstAddressId]);
      }
    }
    
    res.json({ message: "Adres başarıyla silindi." });
  } catch (error) {
    console.error("DELETE /addresses/:id error:", error);
    res.status(500).json({ message: "Adres silinirken bir hata oluştu." });
  }
});

export default router;