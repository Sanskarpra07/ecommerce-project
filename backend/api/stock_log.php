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
// 1. GET Stock Log: /stock_log.php
// --------------------------------------------------------------------------
if ($method === 'GET') {
    if (!verifyAdminAuth()) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 200) : 50;

    $stmt = $pdo->prepare("
        SELECT sl.*, p.name AS product_name
        FROM stock_log sl
        JOIN products p ON sl.product_id = p.id
        ORDER BY sl.created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    $logs = $stmt->fetchAll();

    respond(['logs' => $logs]);
}

// --------------------------------------------------------------------------
// 2. POST Stock Adjustment: /stock_log.php
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $data = getJsonBody();

    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    $product_id    = (int)($data['product_id'] ?? 0);
    $change_amount = (int)($data['change_amount'] ?? 0);
    $type          = $data['type'] ?? 'add';
    $reason        = trim($data['reason'] ?? '');
    $changed_by    = $data['changed_by'] ?? 'Admin';

    if ($product_id === 0) {
        respond(['message' => 'Please select a product'], 400);
    }
    if ($change_amount <= 0) {
        respond(['message' => 'Please enter a valid amount'], 400);
    }

    if ($type === 'remove') {
        $change_amount = -abs($change_amount);
    } else {
        $change_amount = abs($change_amount);
    }

    // Get current stock
    $stmt = $pdo->prepare('SELECT stock_quantity FROM products WHERE id = ?');
    $stmt->execute([$product_id]);
    $product = $stmt->fetch();
    if (!$product) {
        respond(['message' => 'Product not found'], 404);
    }

    $current_stock = (int)$product['stock_quantity'];
    $new_stock = $current_stock + $change_amount;

    if ($new_stock < 0) {
        respond(['message' => "Cannot remove more than current stock ($current_stock units)"], 400);
    }

    // Update stock
    $stmt = $pdo->prepare('UPDATE products SET stock_quantity = ? WHERE id = ?');
    $stmt->execute([$new_stock, $product_id]);

    // Log the change
    $stmt = $pdo->prepare('INSERT INTO stock_log (product_id, change_amount, reason, changed_by) VALUES (?, ?, ?, ?)');
    $stmt->execute([$product_id, $change_amount, $reason, $changed_by]);

    respond([
        'message' => 'Stock updated successfully',
        'product_id' => $product_id,
        'old_stock' => $current_stock,
        'new_stock' => $new_stock,
        'change' => $change_amount,
    ], 201);
}

respond(['message' => 'Method not allowed'], 405);
?>
