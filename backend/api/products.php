<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && isset($_GET['id']) && $_GET['id'] !== '') {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare('SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) { respond(['message' => 'Product not found'], 404); }
    respond(['product' => $product]);
}

if ($method === 'GET') {
    $filters = [
        'category'  => filter_input(INPUT_GET, 'category'),
        'size'      => filter_input(INPUT_GET, 'size'),
        'min_price' => filter_input(INPUT_GET, 'min_price'),
        'max_price' => filter_input(INPUT_GET, 'max_price'),
        'search'    => filter_input(INPUT_GET, 'search'),
    ];
    $where = []; $params = [];
    if ($filters['category'])  { $where[] = 'p.category_id = ?'; $params[] = $filters['category']; }
    if ($filters['size'])      { $where[] = 'p.size = ?';       $params[] = $filters['size']; }
    if ($filters['min_price']) { $where[] = 'p.price >= ?';     $params[] = $filters['min_price']; }
    if ($filters['max_price']) { $where[] = 'p.price <= ?';     $params[] = $filters['max_price']; }
    if ($filters['search']) {
        $where[] = '(p.name LIKE ? OR p.brand LIKE ?)';
        $term = '%' . $filters['search'] . '%';
        $params[] = $term; $params[] = $term;
    }
    $sql = 'SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY p.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    respond(['products' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $data = getJsonBody();
    $token = $data['admin_token'] ?? '';
    if ($token !== 'admin123') { respond(['message' => 'Forbidden'], 403); }
    $required = ['category_id', 'name', 'price', 'stock_quantity'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            respond(["Missing required field: $field"], 400);
        }
    }
    $stmt = $pdo->prepare('INSERT INTO products (category_id, name, brand, price, size, color, description, image_url, stock_quantity) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$data['category_id'], $data['name'], $data['brand']??null, $data['price'], $data['size']??null, $data['color']??null, $data['description']??null, $data['image_url']??null, $data['stock_quantity']]);
    respond(['message' => 'Product created', 'id' => $pdo->lastInsertId()], 201);
}

if ($method === 'PUT') {
    $data = getJsonBody();
    $id = (int)($data['id'] ?? 0);
    $token = $data['admin_token'] ?? '';
    if (!$id || $token !== 'admin123') { respond(['message' => 'Bad params'], 400); }
    $allowed = ['name','brand','price','size','color','description','image_url','stock_quantity','category_id'];
    $fields = []; $params = [];
    foreach ($allowed as $field) {
        if (isset($data[$field])) { $fields[] = "$field = ?"; $params[] = $data[$field]; }
    }
    if (empty($fields)) { respond(['message' => 'No fields'], 400); }
    $params[] = $id;
    $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);
    respond(['message' => 'Product updated']);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $token = $_GET['admin_token'] ?? '';
    if (!$id || $token !== 'admin123') { respond(['message' => 'Bad params'], 400); }
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    respond(['message' => 'Product deleted']);
}

respond(['message' => 'Method not allowed'], 405);
?>
