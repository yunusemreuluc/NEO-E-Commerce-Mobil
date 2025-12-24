// neo-backend/src/routes/orders.ts
import express from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Sipariş oluşturma
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const {
    shipping_address_id,
    items, // [{ product_id, quantity, unit_price }]
    payment_method_id,
    subtotal,
    shipping_cost = 0,
    discount_amount = 0
  } = req.body;

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Geçersiz sipariş bilgileri' 
    });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Sipariş numarası oluştur
    const [orderNumResult] = await connection.execute(
      'SELECT generate_order_number() as order_number'
    ) as [RowDataPacket[], any];
    
    const orderNumber = orderNumResult[0].order_number;
    const totalAmount = subtotal + shipping_cost - discount_amount;

    // Adres snapshot'ı al
    let addressSnapshot = null;
    if (shipping_address_id) {
      const [addressResult] = await connection.execute(
        'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
        [shipping_address_id, userId]
      ) as [RowDataPacket[], any];
      
      if (addressResult.length > 0) {
        addressSnapshot = JSON.stringify(addressResult[0]);
      }
    }

    // Sipariş oluştur
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        user_id, order_number, shipping_address_id, shipping_address_snapshot,
        subtotal, shipping_cost, discount_amount, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, shipping_address_id, addressSnapshot, 
       subtotal, shipping_cost, discount_amount, totalAmount]
    ) as [ResultSetHeader, any];

    const orderId = orderResult.insertId;

    // Sipariş kalemlerini ekle
    for (const item of items) {
      // Ürün bilgilerini al (resim dahil)
      const [productResult] = await connection.execute(
        `SELECT 
          p.id, p.name, p.price, p.image_url,
          (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE LIMIT 1) as primary_image
        FROM products p 
        WHERE p.id = ?`,
        [item.product_id]
      ) as [RowDataPacket[], any];

      if (productResult.length === 0) {
        throw new Error(`Ürün bulunamadı: ${item.product_id}`);
      }

      const product = productResult[0];
      const totalPrice = item.quantity * item.unit_price;
      
      // Ürün resmini belirle (önce primary_image, sonra image_url)
      const productImage = product.primary_image || product.image_url;

      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_price, product_image,
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, product.id, product.name, product.price, productImage,
         item.quantity, item.unit_price, totalPrice]
      );
    }

    // Demo ödeme işlemi
    if (payment_method_id) {
      const transactionId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await connection.execute(
        `INSERT INTO order_payments (
          order_id, payment_method_id, amount, payment_status, 
          transaction_id, processed_at
        ) VALUES (?, ?, ?, 'completed', ?, NOW())`,
        [orderId, payment_method_id, totalAmount, transactionId]
      );

      // Sipariş durumunu güncelle
      await connection.execute(
        'UPDATE orders SET payment_status = "paid", status = "confirmed" WHERE id = ?',
        [orderId]
      );
    }

    // Sipariş durumu geçmişi
    await connection.execute(
      'INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)',
      [orderId, 'pending', 'Sipariş oluşturuldu']
    );

    if (payment_method_id) {
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)',
        [orderId, 'confirmed', 'Ödeme alındı, sipariş onaylandı']
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Sipariş başarıyla oluşturuldu',
      data: {
        order_id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        status: payment_method_id ? 'confirmed' : 'pending'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

// Kullanıcının siparişlerini listele
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  console.log('Orders API çağrıldı, userId:', userId);

  try {
    // Siparişleri ve ürün bilgilerini birlikte getir
    const [orders] = await db.execute(
      `SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        GROUP_CONCAT(oi.product_name SEPARATOR ', ') as product_names,
        (
          SELECT COALESCE(pi.image_url, p.image_url) 
          FROM order_items oi2 
          JOIN products p ON oi2.product_id = p.id
          LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
          WHERE oi2.order_id = o.id 
          LIMIT 1
        ) as first_product_image,
        (SELECT oi3.product_name FROM order_items oi3 WHERE oi3.order_id = o.id LIMIT 1) as first_product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    ) as [RowDataPacket[], any];

    // Sayısal alanları number tipine dönüştür
    const processedOrders = orders.map(order => ({
      ...order,
      subtotal: parseFloat(order.subtotal) || 0,
      shipping_cost: parseFloat(order.shipping_cost) || 0,
      discount_amount: parseFloat(order.discount_amount) || 0,
      total_amount: parseFloat(order.total_amount) || 0,
      item_count: parseInt(order.item_count) || 0
    }));

    // Toplam sipariş sayısı
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        orders: processedOrders,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Sipariş listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler yüklenirken bir hata oluştu'
    });
  }
});

// Sipariş detayı
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  try {
    // Sipariş bilgisi
    const [orderResult] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    ) as [RowDataPacket[], any];

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const order = orderResult[0];

    // Sipariş kalemleri
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    ) as [RowDataPacket[], any];

    // Ödeme bilgisi
    const [payments] = await db.execute(
      `SELECT op.*, pm.card_brand, pm.card_last4 
       FROM order_payments op
       LEFT JOIN payment_methods pm ON op.payment_method_id = pm.id
       WHERE op.order_id = ?`,
      [orderId]
    ) as [RowDataPacket[], any];

    // Durum geçmişi
    const [statusHistory] = await db.execute(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        order,
        items,
        payments,
        status_history: statusHistory
      }
    });

  } catch (error) {
    console.error('Sipariş detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı yüklenirken bir hata oluştu'
    });
  }
});

// Sipariş iptal etme
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  try {
    // Sipariş kontrolü
    const [orderResult] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    ) as [RowDataPacket[], any];

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const order = orderResult[0];

    // İptal edilebilir durumda mı kontrol et
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş iptal edilemez'
      });
    }

    // Siparişi iptal et
    await db.execute(
      'UPDATE orders SET status = "cancelled" WHERE id = ?',
      [orderId]
    );

    // Durum geçmişine ekle
    await db.execute(
      'INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)',
      [orderId, 'cancelled', 'Kullanıcı tarafından iptal edildi']
    );

    res.json({
      success: true,
      message: 'Sipariş başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('Sipariş iptal hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş iptal edilirken bir hata oluştu'
    });
  }
});

// Admin siparişleri listele (bu route'u diğer GET route'larından önce koyuyoruz)
router.get('/admin/list', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }

    const [orders] = await db.execute(
      `SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    ) as [RowDataPacket[], any];

    // Toplam sipariş sayısı
    const [countResult] = await db.execute(
      `SELECT COUNT(DISTINCT o.id) as total FROM orders o ${whereClause}`,
      params
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin sipariş listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler yüklenirken bir hata oluştu'
    });
  }
});

// Admin sipariş durumu güncelle
router.patch('/admin/:id/status', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz sipariş durumu'
    });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Sipariş durumunu güncelle
    await connection.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );

    // Durum geçmişine ekle
    await connection.execute(
      'INSERT INTO order_status_history (order_id, status, notes) VALUES (?, ?, ?)',
      [orderId, status, `Admin tarafından ${status} olarak güncellendi`]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Sipariş durumu başarıyla güncellendi'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Sipariş durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken bir hata oluştu'
    });
  } finally {
    connection.release();
  }
});

// Admin sipariş detayı
router.get('/admin/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Sipariş bilgisi
    const [orderResult] = await db.execute(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    ) as [RowDataPacket[], any];

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const order = orderResult[0];

    // Sipariş kalemleri (ürün resimleri ile birlikte)
    const [items] = await db.execute(
      `SELECT oi.*, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    ) as [RowDataPacket[], any];

    // Ödeme bilgisi
    const [payments] = await db.execute(
      `SELECT op.*, pm.card_brand, pm.card_last4 
       FROM order_payments op
       LEFT JOIN payment_methods pm ON op.payment_method_id = pm.id
       WHERE op.order_id = ?`,
      [orderId]
    ) as [RowDataPacket[], any];

    // Durum geçmişi
    const [statusHistory] = await db.execute(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    ) as [RowDataPacket[], any];

    res.json({
      success: true,
      data: {
        order,
        items,
        payments,
        status_history: statusHistory
      }
    });

  } catch (error) {
    console.error('Admin sipariş detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş detayı yüklenirken bir hata oluştu'
    });
  }
});

// Admin: Sipariş resimlerini güncelle (tek seferlik)
router.post('/admin/update-images', authenticateToken, async (req, res) => {
  try {
    // Mevcut siparişlerdeki ürün resimlerini güncelle
    const [updateResult] = await db.execute(`
      UPDATE order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      SET oi.product_image = COALESCE(pi.image_url, p.image_url)
      WHERE oi.product_image IS NULL OR oi.product_image = ''
    `) as [ResultSetHeader, any];

    res.json({
      success: true,
      message: 'Sipariş resimleri güncellendi',
      data: {
        updated_rows: updateResult.affectedRows
      }
    });

  } catch (error) {
    console.error('Sipariş resimleri güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş resimleri güncellenirken bir hata oluştu'
    });
  }
});

export default router;