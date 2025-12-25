// test-direct-address.js
const fetch = require('node-fetch');
const { API_BASE_URL } = require('./config/test-config');

async function testDirectAddress() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiZGVtb0BuZW9hcHAuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjY0NDEwOTIsImV4cCI6MTc2NzA0NTg5Mn0.fGOQ8Xo-KurMSJLbLF-0VDKJR36QRSUcwCyUaQ6nlqM';
  
  try {
    console.log('🧪 Direkt adres endpoint testi...');
    
    const response = await fetch(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('📝 Response Body:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ JSON Data:', data);
    } catch (e) {
      console.log('❌ JSON parse hatası');
    }
    
  } catch (error) {
    console.error('❌ Request hatası:', error.message);
  }
}

testDirectAddress();