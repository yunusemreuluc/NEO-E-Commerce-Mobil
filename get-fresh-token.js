// get-fresh-token.js
const fetch = require('node-fetch');

async function getFreshToken() {
  try {
    const response = await fetch('http://10.241.81.212:4000/auth/login', {
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

    console.log('✅ Yeni token alındı');
    console.log('🔑 Token:', data.token);
    
    // Hemen test et
    const testResponse = await fetch('http://10.241.81.212:4000/addresses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      }
    });

    console.log('📊 Test Response Status:', testResponse.status);
    const testData = await testResponse.text();
    console.log('📝 Test Response:', testData);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

getFreshToken();