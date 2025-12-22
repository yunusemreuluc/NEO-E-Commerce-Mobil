// debug-jwt.js
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiZGVtb0BuZW9hcHAuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjY0NDEwMDUsImV4cCI6MTc2NzA0NTgwNX0.YD-tqsx5o6mYbL_bgpreZafhU1KTIhGLkBswGvklsk0';

try {
  const decoded = jwt.verify(token, 'your-secret-key');
  console.log('✅ Token geçerli:', decoded);
} catch (error) {
  console.log('❌ Token hatası:', error.message);
  
  // Decode without verification
  const decoded = jwt.decode(token);
  console.log('📋 Token içeriği:', decoded);
}