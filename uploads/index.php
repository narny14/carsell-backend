<?php
// Servir les fichiers statiques depuis /uploads/
$request = $_SERVER['REQUEST_URI'];

if (preg_match('/^\/uploads\/(.+)$/', $request, $matches)) {
    $file = __DIR__ . '/uploads/' . $matches[1];
    if (file_exists($file)) {
        header('Content-Type: ' . mime_content_type($file));
        readfile($file);
        exit;
    } else {
        http_response_code(404);
        echo "Fichier non trouvé.";
        exit;
    }
}

// Reste du backend ici (ex: API, etc.)
echo "Bienvenue sur carsell-backend.";