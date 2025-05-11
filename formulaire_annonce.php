<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Connexion à la base de données Railway
$host = 'yamabiko.proxy.rlwy.net';
$port = 42386;
$user = 'root';
$password = 'MHVNjPTYIvqMMdkkGhBKTIddOBZsyPfI';
$dbname = 'railway';

$conn = new mysqli($host, $user, $password, $dbname, $port);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données: ' . $conn->connect_error]));
}

// Récupération des données POST
$marque = $_POST['marque'];
$modele = $_POST['modele'];
$moteur = $_POST['moteur'];
$transmission = $_POST['transmission'];
$freins = $_POST['freins'];
$suspension = $_POST['suspension'];
$essaiRoutier = $_POST['essaiRoutier'];
$prix = $_POST['prix'];

// Options confort
$confort = [
    'climatisation' => $_POST['climatisation'] ?? '0',
    'siegesChauffants' => $_POST['siegesChauffants'] ?? '0',
    'reglageSieges' => $_POST['reglageSieges'] ?? '0',
    'toitOuvrant' => $_POST['toitOuvrant'] ?? '0',
    'volantChauffant' => $_POST['volantChauffant'] ?? '0',
    'demarrageSansCle' => $_POST['demarrageSansCle'] ?? '0',
    'coffreElectrique' => $_POST['coffreElectrique'] ?? '0',
    'storesPareSoleil' => $_POST['storesPareSoleil'] ?? '0'
];

// Insertion dans la table annonces
$stmt = $conn->prepare("
  INSERT INTO annonces (
    marque, modele, moteur, transmission, freins, suspension, essaiRoutier, prix,
    climatisation, siegesChauffants, reglageSieges, toitOuvrant,
    volantChauffant, demarrageSansCle, coffreElectrique, storesPareSoleil
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "sssssssdiiiiiiii",
    $marque, $modele, $moteur, $transmission, $freins, $suspension, $essaiRoutier, $prix,
    $confort['climatisation'], $confort['siegesChauffants'], $confort['reglageSieges'],
    $confort['toitOuvrant'], $confort['volantChauffant'], $confort['demarrageSansCle'],
    $confort['coffreElectrique'], $confort['storesPareSoleil']
);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Erreur insertion annonce: ' . $stmt->error]);
    exit;
}

$idAnnonce = $stmt->insert_id;

// Dossier upload (à adapter si tu es sur un hébergeur distant)
$uploadDir = "uploads/";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Enregistrement des images
foreach ($_FILES['images']['tmp_name'] as $index => $tmpName) {
    $fileName = basename($_FILES['images']['name'][$index]);
    $targetPath = $uploadDir . time() . "_" . $fileName;

    if (move_uploaded_file($tmpName, $targetPath)) {
        $stmtImg = $conn->prepare("INSERT INTO photos_annonces (id_annonce, chemin_photo) VALUES (?, ?)");
        $stmtImg->bind_param("is", $idAnnonce, $targetPath);
        $stmtImg->execute();
    }
}

echo json_encode(['success' => true, 'message' => 'Annonce enregistrée avec succès']);
?>
