// test-order-system.js
const API_BASE_URL = 'http://10.241.81.212:4000';

async function testOrderSystem() {
  console.log('🧪 Sipariş Sistemi Testi Başlıyor...\n');

  try {
    // 1. Giriş yap
    console.log('1️⃣ Kullanıcı girişi yapılıyor...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@neoapp.com',
        password: '123456'
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok || !loginData.token) {
      throw new Error('Giriş başarısız: ' + loginData.message);
    }

    const token = loginData.token;
    console.log('✅ Giriş başarılı:', loginData.user.name);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Ödeme yöntemlerini listele
    console.log('\n2️⃣ Ödeme yöntemleri kontrol ediliyor...');
    const paymentResponse = await fetch(`${API_BASE_URL}/payment-methods`, {
      method: 'GET',
      headers,
    });

    const paymentData = await paymentResponse.json();
    console.log('💳 Ödeme yöntemleri:', paymentData.data?.length || 0, 'adet');

    // Eğer ödeme yöntemi yoksa demo kart ekle
    let paymentMethodId = null;
    if (!paymentData.data || paymentData.data.length === 0) {
      console.log('➕ Demo kart ekleniyor...');
      const addCardResponse = await fetch(`${API_BASE_URL}/payment-methods`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          card_holder_name: 'Test Kullanıcı',
          card_number: '4111111111111111',
          exp_month: 12,
          exp_year: 2025,
          cvv: '123',
          is_default: true
        }),
      });

      const addCardData = await addCardResponse.json();
      if (addCardData.success) {
        paymentMethodId = addCardData.data.id;
        console.log('✅ Demo kart eklendi:', addCardData.data.card_last4);
      }
    } else {
      paymentMethodId = paymentData.data[0].id;
      console.log('✅ Mevcut kart kullanılacak:', paymentData.data[0].card_last4);
    }

    // 3. Adresleri listele
    console.log('\n3️⃣ Adresler kontrol ediliyor...');
    const addressResponse = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers,
    });

    const addressData = await addressResponse.json();
    console.log('🏠 Adresler:', addressData.data?.length || 0, 'adet');

    let addressId = null;
    if (addressData.data && addressData.data.length > 0) {
      addressId = addressData.data[0].id;
      console.log('✅ Adres seçildi:', addressData.data[0].title);
    }

    // 4. Demo sipariş oluştur
    console.log('\n4️⃣ Demo sipariş oluşturuluyor...');
    const orderData = {
      shipping_address_id: addressId,
      payment_method_id: paymentMethodId,
      items: [
        {
          product_id: 1,
          quantity: 2,
          unit_price: 299.99
        },
        {
          product_id: 2,
          quantity: 1,
          unit_price: 149.99
        }
      ],
      subtotal: 749.97,
      shipping_cost: 15.00,
      discount_amount: 0
    };

    const createOrderResponse = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    const createOrderData = await createOrderResponse.json();
    
    if (createOrderData.success) {
      console.log('✅ Sipariş oluşturuldu!');
      console.log('📦 Sipariş No:', createOrderData.data.order_number);
      console.log('💰 Toplam Tutar:', createOrderData.data.total_amount);
      console.log('📊 Durum:', createOrderData.data.status);

      const orderId = createOrderData.data.order_id;

      // 5. Sipariş detayını kontrol et
      console.log('\n5️⃣ Sipariş detayı kontrol ediliyor...');
      const detailResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'GET',
        headers,
      });

      const detailData = await detailResponse.json();
      if (detailData.success) {
        console.log('✅ Sipariş detayı alındı');
        console.log('🛍️ Ürün sayısı:', detailData.data.items.length);
        console.log('💳 Ödeme durumu:', detailData.data.order.payment_status);
        console.log('📈 Total Amount Tipi:', typeof detailData.data.order.total_amount);
        console.log('💰 Total Amount Değeri:', detailData.data.order.total_amount);
      }

      // 6. Siparişleri listele
      console.log('\n6️⃣ Sipariş listesi kontrol ediliyor...');
      const listResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: 'GET',
        headers,
      });

      const listData = await listResponse.json();
      if (listData.success) {
        console.log('✅ Sipariş listesi alındı');
        console.log('📋 Toplam sipariş:', listData.data.orders.length);
        
        if (listData.data.orders.length > 0) {
          const firstOrder = listData.data.orders[0];
          console.log('🔍 İlk sipariş total_amount tipi:', typeof firstOrder.total_amount);
          console.log('🔍 İlk sipariş total_amount değeri:', firstOrder.total_amount);
        }
      }

    } else {
      console.log('❌ Sipariş oluşturulamadı:', createOrderData.message);
    }

    console.log('\n✅ Test tamamlandı!');

  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testOrderSystem();