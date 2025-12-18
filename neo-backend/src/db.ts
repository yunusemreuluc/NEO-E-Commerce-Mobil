// neo-backend/src/db.ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",          // 🔴 MySQL'de giriş yaptığın kullanıcı adı
  password: "sensizasla72",          // 🔴 Eğer şifren varsa buraya yaz, yoksa "" kalsın
  database: "neo_ecommerce",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
