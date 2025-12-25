// test-notifications-api.js
const fetch = require('node-fetch');
const API_BASE_URL = 'http://localhost:3000';

async function testNotifications() {
  console.log('🧪 Bildirim API Testi Başlıyor...\n');

  // 1. Giriş yap
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@neoapp.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(loginData.message || 'Giriş başarısız');
    }

    console.log('✅ Giriş başarılı:', loginData.user.name);
    const token = loginData.token;

    // 2. Bildirimleri getir
    const notificationsResponse = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('✅ Bildirimler:', notificationsData.data?.length || 0, 'adet');
      
      if (notificationsData.data && notificationsData.data.length > 0) {
        const unreadCount = notificationsData.data.filter(n => !n.is_read).length;
        console.log('📬 Okunmamış:', unreadCount, 'adet');
        
        // İlk bildirimi göster
        const firstNotification = notificationsData.data[0];
        console.log('📋 İlk bildirim:', firstNotification.title);
      }
    } else {
      console.log('⚠️ Bildirim endpoint\'i henüz hazır değil (Status:', notificationsResponse.status, ')');
    }

    console.log('\n✅ Test tamamlandı!');
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testNotifications();