// neo-backend/add-postal-code.js
const mysql = require('mysql2/promise');

async function addPostalCodeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'sensizasla72',
      database: 'neo_ecommerce'
    });

    console.log('Veritabanına bağlanıldı...');

    // Postal code kolonunu ekle
    await connection.execute(`
      ALTER TABLE addresses 
      ADD COLUMN postal_code VARCHAR(10) NULL 
      AFTER city
    `);

    console.log('✅ postal_code kolonu eklendi');

    // Güncellenmiş tablo yapısını göster
    const [columns] = await connection.execute("DESCRIBE addresses");
    console.log('\n📋 Güncellenmiş tablo yapısı:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ postal_code kolonu zaten mevcut');
    } else {
      console.error('❌ Hata:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addPostalCodeColumn();