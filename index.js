require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️ Requête reçue : ${req.method} ${req.url}`);
  next();
});

console.log("✅ SERVEUR LANCÉ DEPUIS LE BON FICHIER");

// Connexion MySQL Railway
async function getConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'yamabiko.proxy.rlwy.net',
      port: process.env.DB_PORT || 42386,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'MHVNjPTYIvqMMdkkGhBKTIddOBZsyPfI',
      database: process.env.DB_NAME || 'railway',
    });
    return connection;
  } catch (err) {
    console.error("❌ Erreur lors de la création de la connexion :", err.message);
    throw err;
  }
}

// Test de connexion initiale
(async () => {
  try {
    const conn = await getConnection();
    await conn.query("SELECT 1");
    await conn.end();
    console.log("✅ Connexion MySQL Railway OK");
  } catch (err) {
    console.error("❌ Connexion MySQL échouée :", err.message);
  }
})();

// Route /cars
app.get("/cars", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM cars");
    console.log("✅ Résultat /cars :", rows);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL /cars :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route /modeles
app.get("/modeles", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM modeles");
    console.log("✅ Résultat /modeles :", rows);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL /modeles :", err.message);
    res.status(500).json({ error: err.message });
  }
});
// Route /annonces
app.get("/annonces", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM annonces");
    console.log("✅ Résultat /annonces :", rows);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL /annonces :", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/test", (req, res) => {
    res.send("✅ Route test OK");
  });
  app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API CarSell 🚗");
  });
  
app.listen(port, () => {
  console.log(`🚀 API en ligne sur http://localhost:${port}`);
});
