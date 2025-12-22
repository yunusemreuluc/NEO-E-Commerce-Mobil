// test-postal-code.js
const fetch = require('node-fetch');

async function testPostalCode() {
  try {
    // Giriş yap
    const loginResponse = await fetch('http://10.241.81.212:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@neoapp.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Giriş başarılı');

    // Posta kodlu adres ekle
    const newAddress = {
      title: 'Posta Kodlu Adres',
      full_name: 'Test Kullanıcı',
      phone: '0555 888 77 66',
      address_line: 'Posta Kodu Test Mahallesi, Test Sokak No: 5',
      district: 'Test İlçe',
      city: 'Test İl',
      postal_code: '34567',
      is_default: false
    };

    const addResponse = await fetch('http://10.241.81.212:4000/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newAddress)
    });

    const addData = await addResponse.json();
    
    if (addResponse.ok) {
      console.log('✅ Posta kodlu adres eklendi:', addData.title);
      console.log('📮 Posta Kodu:', addData.postal_code);
    } else {
      console.log('❌ Adres ekleme hatası:', addData.message);
    }

    // Adresleri listele
    const listResponse = await fetch('http://10.241.81.212:4000/addresses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const addresses = await listResponse.json();
    console.log('\n📋 Tüm adresler:');
    addresses.forEach((addr, index) => {
      console.log(`${index + 1}. ${addr.title} - ${addr.postal_code || 'Posta kodu yok'}`);
    });

  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testPostalCode();