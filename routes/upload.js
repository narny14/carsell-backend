require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../db'); // Importation du fichier de connexion MySQL

// Configuration de stockage pour multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Route POST pour enregistrer une annonce avec images
router.post('/upload-annonce', upload.array('images', 10), (req, res) => {
  const {
    marque,
    modele,
    moteur,
    transmission,
    freins,
    suspension,
    essaiRoutier,
    prix,
    climatisation,
    siegesChauffants,
    reglageSieges,
    toitOuvrant,
    volantChauffant,
    demarrageSansCle,
    coffreElectrique,
    storesPareSoleil,
    seats
  } = req.body;

  // Récupérer les noms des images
  const imageNames = req.files.map(file => file.filename);

  // Insérer l'annonce dans la table `annonces`
  const insertAnnonceQuery = `
    INSERT INTO annonces (marque, modele, moteur, transmission, freins, suspension, essaiRoutier, prix, climatisation, siegesChauffants, reglageSieges, toitOuvrant, volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertAnnonceQuery, [marque, modele, moteur, transmission, freins, suspension, essaiRoutier, prix, climatisation, siegesChauffants, reglageSieges, toitOuvrant, volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil, seats], (err, result) => {
    if (err) {
      console.error('Erreur d\'insertion de l\'annonce:', err);
      return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'annonce' });
    }

    const annonceId = result.insertId;

    // Insérer les images dans `photos_annonces`
    const insertPhotosQuery = `
      INSERT INTO photos_annonces (annonce_id, photo_url)
      VALUES ?
    `;

    const photosData = imageNames.map(name => [annonceId, name]);

    db.query(insertPhotosQuery, [photosData], (errPhotos) => {
      if (errPhotos) {
        console.error('Erreur insertion photos:', errPhotos);
        return res.status(500).json({ message: 'Annonce enregistrée, mais erreur lors des photos' });
      }

      res.status(200).json({ message: 'Annonce et photos enregistrées avec succès' });
    });
  });
});

module.exports = router;
