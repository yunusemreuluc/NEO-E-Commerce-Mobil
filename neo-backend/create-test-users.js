const bcrypt = require('bcryptjs');

async function createHashes() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('123456', 10);
  
  console.log('Admin hash (admin123):', adminPassword);
  console.log('User hash (123456):', userPassword);
  
  console.log('\nSQL komutları:');
  console.log(`INSERT IGNORE INTO users (name, email, password_hash, role) VALUES ('Admin User', 'admin@neoapp.com', '${adminPassword}', 'admin');`);
  console.log(`INSERT IGNORE INTO users (name, email, password_hash, role) VALUES ('Test Kullanıcı', 'demo@neoapp.com', '${userPassword}', 'user');`);
}

createHashes();