require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔓 Servir les fichiers statiques (images uploadées)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connexion à Railway
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'yamabiko.proxy.rlwy.net',
    port: process.env.DB_PORT || 42386,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'MHVNjPTYIvqMMdkkGhBKTIddOBZsyPfI',
    database: process.env.DB_NAME || 'railway',
  });
}

// 🔧 Configuration Multer : destination, nommage, filtre MIME, limite de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// 🔐 Filtrage des types MIME acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers .jpeg, .jpg, .png sont autorisés."), false);
  }
};

// 🎯 Middleware Multer configuré
const upload = multer({
  storage,
  fileFilter,
  limits: { files: 10 }, // Limite à 10 fichiers
});

// 🔥 Route POST /annonces avec images
app.post("/annonces", upload.array("photos", 10), async (req, res) => {
  try {
    const {
      marque, modele, moteur, transmission, freins, suspension,
      essaiRoutier, prix, climatisation, siegesChauffants, reglageSieges,
      toitOuvrant, volantChauffant, demarrageSansCle, coffreElectrique,
      storesPareSoleil, seats
    } = req.body;

    const conn = await getConnection();

    const [result] = await conn.execute(
      `INSERT INTO annonces (
        marque, modele, moteur, transmission, freins, suspension,
        essaiRoutier, prix, climatisation, siegesChauffants, reglageSieges,
        toitOuvrant, volantChauffant, demarrageSansCle, coffreElectrique,
        storesPareSoleil, seats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marque, modele, moteur, transmission, freins, suspension,
        essaiRoutier, prix, climatisation, siegesChauffants, reglageSieges,
        toitOuvrant, volantChauffant, demarrageSansCle, coffreElectrique,
        storesPareSoleil, seats
      ]
    );

    const annonceId = result.insertId;

    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        await conn.execute(
          "INSERT INTO photos_annonces (annonce_id, photo) VALUES (?, ?)",
          [annonceId, file.filename]
        );
      }
    }

    await conn.end();
    res.status(201).json({ message: "✅ Annonce enregistrée avec succès", id: annonceId });
  } catch (err) {
    console.error("❌ Erreur POST /annonces :", err.message);
    res.status(500).json({ error: "Erreur lors de l'enregistrement" });
  }
});

// 🔥 Route GET /annonces/images
app.get("/annonces/images", async (req, res) => {
  try {
    const conn = await getConnection();
    const [annonces] = await conn.query("SELECT * FROM annonces");

    for (let annonce of annonces) {
      const [photos] = await conn.query(
        "SELECT photo FROM photos_annonces WHERE annonce_id = ?",
        [annonce.id]
      );
      annonce.photos = photos.map(
        (p) => `${req.protocol}://${req.get("host")}/uploads/${p.photo}`
      );
    }

    await conn.end();
    res.json(annonces);
  } catch (err) {
    console.error("❌ Erreur GET /annonces/images :", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

// ✅ Route GET /annonces (liste simple sans images)
app.get("/annoncesdujour", async (req, res) => {
  try {
    const conn = await getConnection();
    const [annonces] = await conn.query("SELECT * FROM annonces");
    await conn.end();
    res.json(annonces);
  } catch (err) {
    console.error("❌ Erreur GET /annoncesdujour :", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

// 🔥 GET /voiture (liste des marques)
app.get("/voiture", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM marques");
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur GET /voiture :", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des marques" });
  }
});

// 🔥 GET /modeles?marque=Toyota
app.get("/modeles", async (req, res) => {
  const { marque } = req.query;

  if (!marque) {
    return res.status(400).json({ error: "Le paramètre 'marque' est requis." });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.query(
      `SELECT * FROM modeles WHERE marque_id = (
         SELECT id FROM marques WHERE nom_marque = ?
       )`,
      [marque]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur GET /modeles :", err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des modèles" });
  }
});

// 🔥 Route test
app.get("/", (req, res) => {
  res.send("🚀 API CarSell active sur Railway");
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});
