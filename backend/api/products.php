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
// 1. GET Single Product: /products.php?id=X
// --------------------------------------------------------------------------
if ($method === 'GET' && isset($_GET['id']) && $_GET['id'] !== '') {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare('SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) {
        respond(['message' => 'Product not found'], 404);
    }
    $product['price'] = (float)$product['price'];
    $product['stock_quantity'] = (int)$product['stock_quantity'];
    respond(['product' => $product]);
}

// --------------------------------------------------------------------------
// 2. GET Filtered Product List: /products.php
// --------------------------------------------------------------------------
if ($method === 'GET') {
    $category = $_GET['category'] ?? null;
    $size     = $_GET['size'] ?? null;
    $minPrice = $_GET['min_price'] ?? null;
    $maxPrice = $_GET['max_price'] ?? null;
    $search   = trim($_GET['search'] ?? '');
    $brand    = trim($_GET['brand'] ?? '');
    $sort     = $_GET['sort'] ?? 'newest';

    $where = [];
    $params = [];

    if ($category !== null && $category !== '') {
        if (is_numeric($category)) {
            $where[] = 'p.category_id = ?';
            $params[] = (int)$category;
        } else {
            $where[] = 'c.category_name LIKE ?';
            $params[] = '%' . $category . '%';
        }
    }

    if ($size !== null && $size !== '') {
        $where[] = '(p.size = ? OR p.size LIKE ?)';
        $params[] = $size;
        $params[] = '%' . $size . '%';
    }

    if ($minPrice !== null && $minPrice !== '' && is_numeric($minPrice)) {
        $where[] = 'p.price >= ?';
        $params[] = (float)$minPrice;
    }

    if ($maxPrice !== null && $maxPrice !== '' && is_numeric($maxPrice)) {
        $where[] = 'p.price <= ?';
        $params[] = (float)$maxPrice;
    }

    if ($brand !== '') {
        $where[] = 'p.brand LIKE ?';
        $params[] = '%' . $brand . '%';
    }

    if ($search !== '') {
        $where[] = '(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR c.category_name LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $sql = 'SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    switch ($sort) {
        case 'price_asc':
            $sql .= ' ORDER BY p.price ASC';
            break;
        case 'price_desc':
            $sql .= ' ORDER BY p.price DESC';
            break;
        case 'name_asc':
            $sql .= ' ORDER BY p.name ASC';
            break;
        case 'newest':
        default:
            $sql .= ' ORDER BY p.id DESC';
            break;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['price'] = (float)$p['price'];
        $p['stock_quantity'] = (int)$p['stock_quantity'];
    }

    respond(['products' => $products, 'count' => count($products)]);
}

// --------------------------------------------------------------------------
// 3. POST Create Product: /products.php
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $data = getJsonBody();

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    $required = ['category_id', 'name', 'price', 'stock_quantity'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            respond(['message' => "Missing required field: $field"], 400);
        }
    }

    $name = trim($data['name']);
    $price = (float)$data['price'];
    $stockQuantity = (int)$data['stock_quantity'];
    $categoryId = (int)$data['category_id'];
    $brand = isset($data['brand']) && trim($data['brand']) !== '' ? trim($data['brand']) : 'MegaFoot';
    $size = isset($data['size']) && trim($data['size']) !== '' ? trim($data['size']) : '9';
    $color = isset($data['color']) && trim($data['color']) !== '' ? trim($data['color']) : 'Multi';
    $description = isset($data['description']) ? trim($data['description']) : '';
    $imageUrl = isset($data['image_url']) && trim($data['image_url']) !== '' 
        ? trim($data['image_url']) 
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80';

    if ($price <= 0) {
        respond(['message' => 'Price must be greater than 0'], 400);
    }
    if ($stockQuantity < 0) {
        respond(['message' => 'Stock quantity cannot be negative'], 400);
    }

    // Verify category exists
    $checkCat = $pdo->prepare('SELECT id FROM categories WHERE id = ?');
    $checkCat->execute([$categoryId]);
    if (!$checkCat->fetch()) {
        // Default to first category if not found
        $firstCat = $pdo->query('SELECT id FROM categories ORDER BY id ASC LIMIT 1')->fetch();
        $categoryId = $firstCat ? (int)$firstCat['id'] : 1;
    }

    $stmt = $pdo->prepare('INSERT INTO products (category_id, name, brand, price, size, color, description, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $categoryId,
        $name,
        $brand,
        $price,
        $size,
        $color,
        $description,
        $imageUrl,
        $stockQuantity
    ]);

    $newId = (int)$pdo->lastInsertId();

    respond([
        'message' => 'Product created successfully',
        'id' => $newId,
        'product' => [
            'id' => $newId,
            'category_id' => $categoryId,
            'name' => $name,
            'brand' => $brand,
            'price' => $price,
            'size' => $size,
            'color' => $color,
            'description' => $description,
            'image_url' => $imageUrl,
            'stock_quantity' => $stockQuantity
        ]
    ], 201);
}

// --------------------------------------------------------------------------
// 4. PUT Update Product: /products.php
// --------------------------------------------------------------------------
if ($method === 'PUT') {
    $data = getJsonBody();
    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    if (!$id) {
        respond(['message' => 'Product ID is required for update'], 400);
    }

    // Verify product exists
    $stmtCheck = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $stmtCheck->execute([$id]);
    if (!$stmtCheck->fetch()) {
        respond(['message' => 'Product not found'], 404);
    }

    $allowed = ['name', 'brand', 'price', 'size', 'color', 'description', 'image_url', 'stock_quantity', 'category_id'];
    $fields = [];
    $params = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "`$field` = ?";
            if ($field === 'price') {
                $params[] = (float)$data[$field];
            } elseif ($field === 'stock_quantity' || $field === 'category_id') {
                $params[] = (int)$data[$field];
            } else {
                $params[] = $data[$field];
            }
        }
    }

    if (empty($fields)) {
        respond(['message' => 'No fields provided for update'], 400);
    }

    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);

    respond(['message' => 'Product updated successfully', 'id' => $id]);
}

// --------------------------------------------------------------------------
// 5. DELETE Product: /products.php?id=X&admin_token=admin123
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    $data = getJsonBody();
    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    if (!$id) {
        respond(['message' => 'Product ID is required for deletion'], 400);
    }

    // Verify product exists
    $stmtCheck = $pdo->prepare('SELECT name FROM products WHERE id = ?');
    $stmtCheck->execute([$id]);
    $product = $stmtCheck->fetch();
    if (!$product) {
        respond(['message' => 'Product not found'], 404);
    }

    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);

    respond(['message' => 'Product deleted successfully', 'id' => $id, 'name' => $product['name']]);
}

respond(['message' => 'Method not allowed'], 405);
?>

