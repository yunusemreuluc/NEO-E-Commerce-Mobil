// neo-backend/setup-addresses.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupAddresses() {
  let connection;
  
  try {
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'sensizasla72', // Veritabanı şifresi
      database: 'neo_ecommerce'
    });

    console.log('Veritabanına bağlanıldı...');

    // SQL dosyasını oku
    const sqlFile = path.join(__dirname, 'addresses-setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // SQL komutlarını ayır ve çalıştır
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        await connection.execute(command);
        console.log('SQL komutu çalıştırıldı:', command.substring(0, 50) + '...');
      }
    }

    console.log('✅ Adresler tablosu başarıyla oluşturuldu!');
    console.log('✅ Test adresleri eklendi!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupAddresses();