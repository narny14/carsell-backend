const mysql = require('mysql2');

// Créer une connexion à la base de données MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'yamabiko.proxy.rlwy.net',
  port: process.env.DB_PORT || 42386,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'MHVNjPTYIvqMMdkkGhBKTIddOBZsyPfI',
  database: process.env.DB_NAME || 'railway',
});

// Vérifier la connexion
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err.stack);
    return;
  }
  console.log('Connexion à la base de données MySQL réussie avec l\'ID', db.threadId);
});

module.exports = db;
