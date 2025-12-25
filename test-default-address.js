// test-default-address.js
const { API_BASE_URL } = require('./config/test-config');

async function testDefaultAddress() {
  console.log('🧪 Varsayılan Adres Testi Başlıyor...\n');

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

    // 2. Mevcut adresleri listele
    console.log('\n2️⃣ Mevcut adresler kontrol ediliyor...');
    const addressResponse = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers,
    });

    const addresses = await addressResponse.json();
    console.log('🏠 Toplam adres:', addresses.length);
    
    addresses.forEach((addr, index) => {
      console.log(`${index + 1}. ${addr.title} - ${addr.full_name} ${addr.is_default ? '(Varsayılan)' : '(Normal)'}`);
    });

    if (addresses.length < 2) {
      console.log('⚠️ Test için en az 2 adres gerekli');
      return;
    }

    // 3. İkinci adresi varsayılan yap
    const secondAddress = addresses[1];
    console.log(`\n3️⃣ "${secondAddress.title}" adresini varsayılan yapılıyor...`);
    
    const setDefaultResponse = await fetch(`${API_BASE_URL}/addresses/${secondAddress.id}/set-default`, {
      method: 'PATCH',
      headers,
    });

    const setDefaultData = await setDefaultResponse.json();
    if (setDefaultResponse.ok) {
      console.log('✅', setDefaultData.message);
    } else {
      console.log('❌ Hata:', setDefaultData.message);
    }

    // 4. Güncellenmiş adres listesini kontrol et
    console.log('\n4️⃣ Güncellenmiş adres listesi kontrol ediliyor...');
    const updatedResponse = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers,
    });

    const updatedAddresses = await updatedResponse.json();
    console.log('🏠 Güncellenmiş adres listesi:');
    
    updatedAddresses.forEach((addr, index) => {
      console.log(`${index + 1}. ${addr.title} - ${addr.full_name} ${addr.is_default ? '(Varsayılan)' : '(Normal)'}`);
    });

    // 5. Varsayılan adresin en üstte olduğunu kontrol et
    const defaultAddress = updatedAddresses.find(addr => addr.is_default);
    if (defaultAddress && updatedAddresses[0].id === defaultAddress.id) {
      console.log('\n✅ Varsayılan adres en üstte görünüyor!');
    } else {
      console.log('\n❌ Varsayılan adres en üstte görünmüyor!');
    }

    console.log('\n✅ Test tamamlandı!');

  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testDefaultAddress();