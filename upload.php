<?php
// CORS (utile pour API avec React Native)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
// Configuration de la base de données pour Railway
$host = 'yamabiko.proxy.rlwy.net'; // Hôte de Railway
$port = 42386; // Port de la base de données MySQL
$user = 'root'; // Utilisateur de la base de données
$password = 'MHVNjPTYIvqMMdkkGhBKTIddOBZsyPfI'; // Mot de passe de la base de données
$dbname = 'railway'; // Nom de la base de données

// Connexion à la base de données
$conn = new mysqli($host, $user, $password, $dbname, $port);

// Vérification de la connexion
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Traitement des données du formulaire
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Récupération des données de formulaire
    $marque = $_POST['marque'] ?? '';
    $modele = $_POST['modele'] ?? '';
    $moteur = $_POST['moteur'] ?? '';
    $transmission = $_POST['transmission'] ?? '';
    $freins = $_POST['freins'] ?? '';
    $suspension = $_POST['suspension'] ?? '';
    $essaiRoutier = $_POST['essaiRoutier'] ?? '';
    $prix = $_POST['prix'] ?? '';

    // Récupération des options de confort
    $confortOptions = [];
    foreach ($_POST as $key => $value) {
        if (strpos($key, 'climatisation') !== false || strpos($key, 'siegesChauffants') !== false || 
            strpos($key, 'reglageSieges') !== false || strpos($key, 'toitOuvrant') !== false ||
            strpos($key, 'volantChauffant') !== false || strpos($key, 'demarrageSansCle') !== false ||
            strpos($key, 'coffreElectrique') !== false || strpos($key, 'storesPareSoleil') !== false) {
            $confortOptions[$key] = $value;
        }
    }

    // Enregistrement des images
    $uploadDirectory = "uploads/";
    $images = [];
    if (isset($_FILES['images'])) {
        foreach ($_FILES['images']['tmp_name'] as $index => $tmpName) {
            $fileName = $_FILES['images']['name'][$index];
            $targetFile = $uploadDirectory . basename($fileName);
            
            // Vérifier si le fichier est une image
            if (in_array(pathinfo($targetFile, PATHINFO_EXTENSION), ['jpg', 'jpeg', 'png'])) {
                if (move_uploaded_file($tmpName, $targetFile)) {
                    $images[] = $targetFile;
                }
            }
        }
    }

    // Insertion dans la base de données
    $sql = "INSERT INTO annonces (marque, modele, moteur, transmission, freins, suspension, essaiRoutier, prix, confortOptions) 
            VALUES ('$marque', '$modele', '$moteur', '$transmission', '$freins', '$suspension', '$essaiRoutier', '$prix', '" . json_encode($confortOptions) . "')";
    
    if ($conn->query($sql) === TRUE) {
        // Récupérer l'ID de l'annonce insérée
        $annonceId = $conn->insert_id;

        // Insérer les images dans la base de données
        foreach ($images as $image) {
            $imageSql = "INSERT INTO photos_annonces (annonce_id, chemin_image) VALUES ('$annonceId', '$image')";
            if (!$conn->query($imageSql)) {
                echo "Erreur lors de l'insertion de l'image: " . $conn->error;
            }
        }

        echo "Annonce envoyée avec succès!";
    } else {
        echo "Erreur: " . $sql . "<br>" . $conn->error;
    }

    // Fermer la connexion à la base de données
    $conn->close();
}
?>
