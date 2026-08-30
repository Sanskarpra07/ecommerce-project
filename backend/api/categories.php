<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY c.id ASC');
    $categories = $stmt->fetchAll();
    respond(['categories' => $categories]);
}

respond(['message' => 'Method not allowed'], 405);
?>