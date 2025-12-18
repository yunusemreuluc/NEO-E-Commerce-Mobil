// neo-backend/src/routes/products.ts
import { Router } from "express";
import pool from "../db";

const router = Router();

const computeFinalPrice = (originalPrice: number, discount: number | null) => {
  if (!discount || discount <= 0 || discount >= 100) return originalPrice;
  const finalPrice = originalPrice - (originalPrice * discount / 100);
  return Math.round(finalPrice * 100) / 100;
};

// LIST
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, category, image_url, images, price, old_price, discount, stock, is_active, created_at
      FROM products
      WHERE is_active = 1
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /products error:", error);
    res.status(500).json({ message: "Ürünler yüklenirken bir hata oluştu." });
  }
});

// GET ONE
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT id, name, category, image_url, images, price, old_price, discount, stock, is_active
       FROM products WHERE id = ? LIMIT 1`,
      [id]
    );
    const item = (rows as any[])[0];
    if (!item) return res.status(404).json({ message: "Ürün bulunamadı." });
    res.json(item);
  } catch (error) {
    console.error("GET /products/:id error:", error);
    res.status(500).json({ message: "Ürün getirilemedi." });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name, price, category, image_url, images, stock, discount } = req.body;

    if (!name || price == null || !category) {
      return res.status(400).json({ message: "name, price ve category zorunludur." });
    }

    const originalPrice = Number(price); // Girilen fiyat = eski fiyat
    const discNum = discount != null && discount !== "" ? Number(discount) : null;
    const finalPrice = computeFinalPrice(originalPrice, discNum); // İndirimli fiyat

    // Resim dizisini hazırla
    let imageArray = [];
    if (images && Array.isArray(images)) {
      imageArray = images;
    } else if (image_url) {
      imageArray = [image_url];
    } else {
      imageArray = ["https://picsum.photos/seed/neo/600/600"];
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, price, category, image_url, images, stock, old_price, discount, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        finalPrice, // İndirimli fiyat price kolonuna
        category,
        imageArray[0] || "https://picsum.photos/seed/neo/600/600",
        JSON.stringify(imageArray),
        Number(stock || 0),
        originalPrice, // Eski fiyat old_price kolonuna
        discNum,
      ]
    );

    const insertId = (result as any).insertId;
    const [rows] = await pool.query(
      `SELECT id, name, category, image_url, images, price, old_price, discount, stock, is_active
       FROM products WHERE id = ?`,
      [insertId]
    );

    res.status(201).json((rows as any[])[0]);
  } catch (error) {
    console.error("POST /products error:", error);
    res.status(500).json({ message: "Ürün eklenirken bir hata oluştu." });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, price, category, image_url, images, stock, discount, is_active } = req.body;

    const originalPrice = Number(price); // Girilen fiyat = eski fiyat
    const discNum = discount != null && discount !== "" ? Number(discount) : null;
    const finalPrice = computeFinalPrice(originalPrice, discNum); // İndirimli fiyat

    // Resim dizisini hazırla
    let imageArray = [];
    if (images && Array.isArray(images)) {
      imageArray = images;
    } else if (image_url) {
      imageArray = [image_url];
    }

    const [result] = await pool.query(
      `UPDATE products SET
        name = ?,
        price = ?,
        category = ?,
        image_url = ?,
        images = ?,
        stock = ?,
        old_price = ?,
        discount = ?,
        is_active = ?
       WHERE id = ?`,
      [
        name,
        finalPrice, // İndirimli fiyat price kolonuna
        category,
        imageArray[0] || image_url,
        JSON.stringify(imageArray),
        Number(stock || 0),
        originalPrice, // Eski fiyat old_price kolonuna
        discNum,
        is_active ?? 1,
        id,
      ]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    const [rows] = await pool.query(
      `SELECT id, name, category, image_url, images, price, old_price, discount, stock, is_active
       FROM products WHERE id = ?`,
      [id]
    );

    res.json((rows as any[])[0]);
  } catch (error) {
    console.error("PUT /products/:id error:", error);
    res.status(500).json({ message: "Ürün güncellenirken bir hata oluştu." });
  }
});

// DELETE (soft)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query(`UPDATE products SET is_active = 0 WHERE id = ?`, [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Ürün bulunamadı." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("DELETE /products/:id error:", error);
    res.status(500).json({ message: "Ürün silinirken bir hata oluştu." });
  }
});

export default router;
