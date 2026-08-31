<?php
// backend/db.php - MegaFoot Database Connection

if (php_sapi_name() !== 'cli') {
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Token');
    header('Content-Type: application/json');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
    exit();
}
}

$host   = getenv('DB_HOST') ?: '127.0.0.1';
$port   = getenv('DB_PORT') ?: '3306';
$user   = getenv('DB_USER') ?: 'root';
$pass   = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$dbname = getenv('DB_NAME') ?: 'megafoot_db';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Attempt connecting to the target database
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, $options);
} catch (PDOException $e) {
    // If unknown database, check if solestyle_db exists as fallback or create megafoot_db
    if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
        try {
            // Try connecting to legacy solestyle_db first if it exists
            $pdo = new PDO("mysql:host=$host;port=$port;dbname=solestyle_db;charset=utf8mb4", $user, $pass, $options);
            $dbname = 'solestyle_db';
        } catch (PDOException $e2) {
            // Create database from scratch
            $rootPdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, $options);
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, $options);
            // Execute schema if available
            $schemaFile = __DIR__ . '/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $sql = preg_replace('/CREATE DATABASE.*?;/is', '', $sql);
                $sql = preg_replace('/USE\s+`?[^;`]+`?\s*;/i', '', $sql);
                $pdo->exec($sql);
            }
        }
    } else {
        if (php_sapi_name() !== 'cli') {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        echo json_encode([
            'status'  => 'error',
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit();
    }
}



