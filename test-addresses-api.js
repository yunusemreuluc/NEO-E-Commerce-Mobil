// test-addresses-api.js
const fetch = require('node-fetch');
const { API_BASE_URL } = require('./config/test-config');

// Test kullanıcısı ile giriş yap
async function loginTestUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@neoapp.com',
        password: '123456'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Giriş başarısız');
    }

    console.log('✅ Giriş başarılı:', data.user.name);
    console.log('🔑 Full Token:', data.token);
    return data.token;
  } catch (error) {
    console.error('❌ Giriş hatası:', error.message);
    return null;
  }
}

// Adresleri listele
async function getAddresses(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Adresler getirilemedi');
    }

    console.log('✅ Adresler:', data.length, 'adet');
    data.forEach((addr, index) => {
      console.log(`${index + 1}. ${addr.title} - ${addr.full_name} (${addr.is_default ? 'Varsayılan' : 'Normal'})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Adres listesi hatası:', error.message);
    return [];
  }
}

// Yeni adres ekle
async function addAddress(token) {
  try {
    const newAddress = {
      title: 'Test Adres',
      full_name: 'Test Kullanıcı',
      phone: '0555 999 88 77',
      address_line: 'Test Mahallesi, Test Sokak No: 1',
      district: 'Test İlçe',
      city: 'Test İl',
      postal_code: '12345',
      is_default: false
    };

    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newAddress)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Adres eklenemedi');
    }

    console.log('✅ Yeni adres eklendi:', data.title);
    return data;
  } catch (error) {
    console.error('❌ Adres ekleme hatası:', error.message);
    return null;
  }
}

// Test fonksiyonu
async function testAddressesAPI() {
  console.log('🧪 Adres API Testi Başlıyor...\n');

  // 1. Giriş yap
  const token = await loginTestUser();
  if (!token) return;

  // 2. Mevcut adresleri listele
  console.log('\n📋 Mevcut adresler:');
  const addresses = await getAddresses(token);

  // 3. Yeni adres ekle
  console.log('\n➕ Yeni adres ekleniyor:');
  const newAddress = await addAddress(token);

  // 4. Güncellenmiş listeyi göster
  if (newAddress) {
    console.log('\n📋 Güncellenmiş adres listesi:');
    await getAddresses(token);
  }

  console.log('\n✅ Test tamamlandı!');
}

testAddressesAPI();