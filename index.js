require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

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

// Route /voiture
app.get("/voiture", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM marques");
    console.log("✅ Résultat /marques :", rows);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur SQL /marques :", err.message);
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

app.get("/modeles", async (req, res) => {
  const marque = req.query.marque;

  if (!marque) {
    return res.status(400).json({ error: "Paramètre 'marque' requis" });
  }

  try {
    const conn = await getConnection();

    // Cherche l'ID de la marque
    const [marqueRows] = await conn.query(
      "SELECT id FROM marques WHERE nom = ? LIMIT 1",
      [marque]
    );

    if (marqueRows.length === 0) {
      await conn.end();
      return res.json([]); // Marque inconnue
    }

    const marqueId = marqueRows[0].id;

    // Récupère les modèles liés à cette marque
    const [modelesRows] = await conn.query(
      "SELECT nom FROM modeles WHERE marque_id = ?",
      [marqueId]
    );

    await conn.end();
    const modeles = modelesRows.map((row) => row.nom);
    res.json(modeles);
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
// Ajoute cette ligne pour exposer le dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Exemple : une route simple pour tester
app.get('/', (req, res) => {
  res.send('Bienvenue sur carsell-backend');
});
  
app.listen(port, () => {
  console.log(`🚀 API en ligne sur http://localhost:${port}`);
});
