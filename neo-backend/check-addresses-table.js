// neo-backend/check-addresses-table.js
const mysql = require('mysql2/promise');

async function checkAddressesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'sensizasla72',
      database: 'neo_ecommerce'
    });

    console.log('Veritabanına bağlanıldı...');

    // Addresses tablosunun var olup olmadığını kontrol et
    const [tables] = await connection.execute("SHOW TABLES LIKE 'addresses'");
    
    if (tables.length > 0) {
      console.log('✅ Addresses tablosu mevcut');
      
      // Tablo yapısını göster
      const [columns] = await connection.execute("DESCRIBE addresses");
      console.log('\n📋 Tablo yapısı:');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
      
      // Kayıt sayısını kontrol et
      const [count] = await connection.execute("SELECT COUNT(*) as count FROM addresses");
      console.log(`\n📊 Toplam kayıt sayısı: ${count[0].count}`);
      
      if (count[0].count > 0) {
        const [records] = await connection.execute("SELECT * FROM addresses LIMIT 3");
        console.log('\n📝 İlk 3 kayıt:');
        records.forEach((record, index) => {
          console.log(`${index + 1}. ${record.title} - ${record.full_name}`);
        });
      }
    } else {
      console.log('❌ Addresses tablosu bulunamadı');
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAddressesTable();