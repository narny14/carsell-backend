// test-db.js
import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'yamanote.proxy.rlwy.net',
      port: 15633,
      user: 'root',
      password: 'tcyEAbboDFENwfQmHGbJpmjpAIkaLDLV',
      database: 'railway',
    });

    console.log('✅ Connexion réussie à MySQL Railway !');
    await connection.end();
  } catch (err) {
    console.error('❌ Erreur de connexion :', err.message);
  }
}

testConnection();
