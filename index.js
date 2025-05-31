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

// 📁 Servir les fichiers statiques (images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connexion à MySQL Railway
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'yamanote.proxy.rlwy.net',
    port: process.env.DB_PORT || 15633,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'tcyEAbboDFENwfQmHGbJpmjpAIkaLDLV',
    database: process.env.DB_NAME || 'railway',
  });
}

// 🔧 Configuration Multer pour l’upload d’images
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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  allowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Seuls les fichiers .jpeg, .jpg, .png sont autorisés."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { files: 10 },
});

// ✅ POST /utilisateurs - Enregistrer un utilisateur Firebase dans la base MySQL
app.post("/utilisateurs", async (req, res) => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ message: "ID et email requis." });
  }

  try {
    const conn = await getConnection();

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await conn.execute("SELECT * FROM users WHERE uid = ?", [uid]);
    if (existingUser.length > 0) {
      return res.status(200).json({ message: "Utilisateur déjà enregistré." });
    }

    // Insérer dans la base de données
    await conn.execute("INSERT INTO users (uid, email) VALUES (?, ?)", [uid, email]);
    res.status(201).json({ message: "Utilisateur enregistré avec succès." });
  } catch (error) {
    console.error("Erreur MySQL :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


// ✅ POST /annonces (avec photos)
app.post("/annonces", upload.array("photos", 10), async (req, res) => {
  try {
    const { marque } = req.body;

    if (!marque) {
      return res.status(400).json({ message: "Le champ 'marque' est requis." });
    }

    const conn = await getConnection();

    const [result] = await conn.execute(
      `INSERT INTO annonces (marque) VALUES (?)`,
      [marque]
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
    console.log("✅ Annonce créée avec ID :", annonceId);
    res.status(201).json({ message: "Annonce enregistrée avec succès", id: annonceId });

  } catch (err) {
    console.error("❌ Erreur POST /annonces :", err.stack);
    res.status(500).json({ error: "Erreur lors de l'enregistrement", details: err.message });
  }
});

// ✅ POST /annoncestext (insertion sans photo)
/*
app.post("/annoncestext", upload.array("photos", 10), async (req, res) => {
  console.log("📩 Données reçues :", req.body);

  const {
    marque, modele, moteur, transmission, freins, suspension, essaiRoutier,
    prix, climatisation, siegesChauffants, reglageSieges, toitOuvrant,
    volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seats
  } = req.body;

  const prixInt = parseFloat(prix);
  const seatsInt = parseInt(seats);

  try {
    const conn = await getConnection();

    // ✅ Insertion dans annonces
    const [result] = await conn.execute(`
      INSERT INTO annonces (
        marque, modele, moteur, transmission, freins, suspension, essaiRoutier,
        prix, climatisation, siegesChauffants, reglageSieges, toitOuvrant,
        volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      marque, modele, moteur, transmission, freins, suspension, essaiRoutier,
      prixInt, climatisation, siegesChauffants, reglageSieges, toitOuvrant,
      volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seatsInt
    ]);

    const annonceId = result.insertId;

    // ✅ Enregistrement des photos dans photos_annonces
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await conn.execute(
          "INSERT INTO photos_annonces (annonce_id, photo_url) VALUES (?, ?)",
          [annonceId, file.filename]
        );
      }
    }

    await conn.end();
    res.status(200).json({ message: "✅ Annonce + images enregistrées", id: annonceId });

  } catch (err) {
    console.error("❌ Erreur SQL :", err.sqlMessage || err.message);
    res.status(500).json({ message: "Erreur serveur", erreur: err.sqlMessage || err.message });
  }
});*/
// ✅ POST /annoncestext (insertion sans photo)
app.post("/annoncestext", async (req, res) => {
  console.log("📩 Données reçues :", req.body);

  const {
    marque, modele, moteur, transmission, freins, suspension, essaiRoutier,
    prix, seats, equipements = {}
  } = req.body;

  const prixDecimal = prix ? parseFloat(prix) : null;

  // Assurez-vous que chaque champ est soit une valeur soit null
  const {
    climatisation = null,
    siegesChauffants = null,
    reglageSieges = null,
    toitOuvrant = null,
    volantChauffant = null,
    demarrageSansCle = null,
    coffreElectrique = null,
    storesPareSoleil = null
  } = equipements;

  try {
    const conn = await getConnection();

    const [result] = await conn.execute(`
      INSERT INTO annonces (
        marque, modele, moteur, transmission, freins, suspension, essaiRoutier,
        prix, climatisation, siegesChauffants, reglageSieges, toitOuvrant,
        volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seats
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      marque || null,
      modele || null,
      moteur || null,
      transmission || null,
      freins || null,
      suspension || null,
      essaiRoutier || null,
      prixDecimal,
      climatisation,
      siegesChauffants,
      reglageSieges,
      toitOuvrant,
      volantChauffant,
      demarrageSansCle,
      coffreElectrique,
      storesPareSoleil,
      seats || null
    ]);

    await conn.end();
    res.status(200).json({ message: "✅ Annonce texte enregistrée", id: result.insertId });
  } catch (err) {
    console.error("❌ Erreur SQL :", err.sqlMessage || err.message);
    res.status(500).json({ message: "Erreur serveur", erreur: err.sqlMessage || err.message });
  }
});

app.post("/annoncestextimg", upload.array("photos", 10), async (req, res) => {
  try {
    const { annonce_id } = req.body;
    if (!annonce_id) {
      return res.status(400).json({ message: "Le champ 'annonce_id' est requis." });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Au moins une image est requise." });
    }

    const conn = await getConnection();

    // Insertion des photos
    for (const file of req.files) {
      await conn.execute(
        "INSERT INTO photos_annonces (annonce_id, photo_url) VALUES (?, ?)",
        [annonce_id, file.filename]
      );
    }

    await conn.end();
    res.status(201).json({ message: "Images ajoutées avec succès." });
  } catch (err) {
    console.error("❌ Erreur POST /annoncestextimg :", err.stack);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

app.get('/uploads-list', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  fs.readdir(uploadsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Impossible de lire le dossier uploads', details: err.message });
    }

    // Retourne des URLs complètes
    const fileUrls = files.map(file => `https://carsell-backend.onrender.com/uploads/${file}`);
    res.json({ fichiers: fileUrls });
  });
});


// ✅ GET /annonces/images
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
    console.error("❌ Erreur GET /annonces/images :", err.stack);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

// ✅ GET /annoncesdujour
app.get("/annoncesdujour", async (req, res) => {
  try {
    const conn = await getConnection();
    const [annonces] = await conn.query("SELECT * FROM annonces");
    await conn.end();
    res.json(annonces);
  } catch (err) {
    console.error("❌ Erreur GET /annoncesdujour :", err.stack);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

// ✅ Route de test de connexion à la base de données
app.get("/testdb", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT NOW() AS maintenant");
    await conn.end();

    res.json({
      success: true,
      message: "Connexion réussie à la base de données ✅",
      heure: rows[0].maintenant,
    });
  } catch (err) {
    console.error("❌ Erreur de connexion à la BDD :", err.message);
    res.status(500).json({
      success: false,
      message: "Erreur de connexion à la base de données ❌",
      erreur: err.message,
    });
  }
});


// ✅ GET /voiture (liste des marques)
app.get("/voiture", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM marques");
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur GET /voiture :", err.stack);
    res.status(500).json({ error: "Erreur lors de la récupération des marques" });
  }
});

// ✅ GET /modeles?marque=Toyota
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
    console.error("❌ Erreur GET /modeles :", err.stack);
    res.status(500).json({ error: "Erreur lors de la récupération des modèles" });
  }
});

// ✅ Route de test
app.get("/", (req, res) => {
  res.send("🚀 API CarSell active sur Railway");
});

// ✅ Lancement du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur lancé : http://localhost:${port}`);
});
