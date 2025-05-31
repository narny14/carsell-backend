// test-select.js
const mysql = require('mysql2/promise');

// Remplace ces valeurs si besoin
const dbConfig = {
  host: 'yamanote.proxy.rlwy.net',
  port: 15633,
  user: 'root',
  password: 'tcyEAbboDFENwfQmHGbJpmjpAIkaLDLV',
  database: 'railway',
};

async function testSelect() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion réussie à MySQL Railway !');

    const [rows] = await connection.execute('SELECT * FROM annonces');
    console.log('📦 Données récupérées :');
    console.table(rows);

    await connection.end();
  } catch (err) {
    console.error('❌ Erreur lors de la requête :', err.message);
  }
}

testSelect();
