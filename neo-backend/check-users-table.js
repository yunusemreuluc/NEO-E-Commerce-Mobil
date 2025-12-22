// neo-backend/check-users-table.js
const mysql = require('mysql2/promise');

async function checkUsersTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'sensizasla72',
      database: 'neo_ecommerce'
    });

    console.log('Veritabanına bağlanıldı...');

    // Users tablosunun yapısını göster
    const [columns] = await connection.execute("DESCRIBE users");
    console.log('\n📋 Users tablo yapısı:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `Default: ${col.Default}` : ''}`);
    });
    
    // Test kullanıcısını kontrol et
    const [users] = await connection.execute("SELECT * FROM users WHERE email = 'demo@neoapp.com'");
    if (users.length > 0) {
      console.log('\n👤 Test kullanıcısı:');
      console.log(users[0]);
    } else {
      console.log('\n❌ Test kullanıcısı bulunamadı');
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable();