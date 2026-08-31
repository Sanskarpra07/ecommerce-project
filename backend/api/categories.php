<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (is_array($data) && !empty($data)) {
        return $data;
    }
    return $_POST;
}

function verifyAdminAuth($data = []) {
    $token = $data['admin_token'] ?? $_GET['admin_token'] ?? $_POST['admin_token'] ?? '';
    if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }
    return $token === 'admin123';
}

$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------------------------
// 1. GET Categories: /categories.php
// --------------------------------------------------------------------------
if ($method === 'GET') {
    $stmt = $pdo->query('SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY c.id ASC');
    $categories = $stmt->fetchAll();
    respond(['categories' => $categories]);
}

// --------------------------------------------------------------------------
// 2. POST Create Category: /categories.php
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $data = getJsonBody();

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');

    if ($name === '') {
        respond(['message' => 'Category name is required'], 400);
    }

    // Check duplicate
    $check = $pdo->prepare('SELECT id FROM categories WHERE category_name = ?');
    $check->execute([$name]);
    if ($check->fetch()) {
        respond(['message' => 'A category with this name already exists'], 409);
    }

    $stmt = $pdo->prepare('INSERT INTO categories (category_name, description) VALUES (?, ?)');
    $stmt->execute([$name, $description]);

    $newId = (int)$pdo->lastInsertId();

    respond([
        'message' => 'Category created successfully',
        'id' => $newId,
        'category' => ['id' => $newId, 'category_name' => $name, 'description' => $description]
    ], 201);
}

// --------------------------------------------------------------------------
// 3. PUT Update Category: /categories.php
// --------------------------------------------------------------------------
if ($method === 'PUT') {
    $data = getJsonBody();

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    $id = (int)($data['id'] ?? 0);
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');

    if (!$id) {
        respond(['message' => 'Category ID is required'], 400);
    }
    if ($name === '') {
        respond(['message' => 'Category name is required'], 400);
    }

    // Check category exists
    $check = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        respond(['message' => 'Category not found'], 404);
    }

    // Check duplicate name (exclude self)
    $dup = $pdo->prepare('SELECT id FROM categories WHERE category_name = ? AND id != ?');
    $dup->execute([$name, $id]);
    if ($dup->fetch()) {
        respond(['message' => 'A category with this name already exists'], 409);
    }

    $stmt = $pdo->prepare('UPDATE categories SET category_name = ?, description = ? WHERE id = ?');
    $stmt->execute([$name, $description, $id]);

    respond(['message' => 'Category updated successfully', 'id' => $id]);
}

// --------------------------------------------------------------------------
// 4. DELETE Category: /categories.php?id=X
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    $data = getJsonBody();
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    if (!$id) {
        respond(['message' => 'Category ID is required'], 400);
    }

    // Check if products use this category
    $check = $pdo->prepare('SELECT COUNT(*) AS c FROM products WHERE category_id = ?');
    $check->execute([$id]);
    $count = (int)$check->fetch()['c'];

    if ($count > 0) {
        respond(['message' => "Cannot delete: $count product(s) use this category. Reassign them first."], 409);
    }

    $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
    $stmt->execute([$id]);

    respond(['message' => 'Category deleted successfully', 'id' => $id]);
}

respond(['message' => 'Method not allowed'], 405);
?>
