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

if ($method === 'POST') {
    $data = getJsonBody();
    if (!isset($data['user_id']) || !isset($data['items']) || !is_array($data['items'])) {
        respond(['message' => 'Missing required fields: user_id, items'], 400);
    }
    $userId = (int)$data['user_id'];
    $items = $data['items'];
    $total = 0; $validItems = [];
    foreach ($items as $item) {
        $productId = (int)$item['product_id'];
        $quantity = (int)$item['quantity'];
        $stmt = $pdo->prepare('SELECT id, price, stock_quantity FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        if (!$product) { respond(["Product ID $productId not found"], 404); }
        if ($product['stock_quantity'] < $quantity) { respond(["Insufficient stock for product ID $productId"], 400); }
        $total += $product['price'] * $quantity;
        $validItems[] = ['product_id' => $productId, 'quantity' => $quantity, 'price' => $product['price']];
    }
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO orders (user_id, total_amount, payment_status, order_status) VALUES (?,?,?,?)');
        $stmt->execute([$userId, $total, 'Pending', 'Pending']);
        $orderId = $pdo->lastInsertId();
        $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)');
        $updateStmt = $pdo->prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
        foreach ($validItems as $vi) {
            $itemStmt->execute([$orderId, $vi['product_id'], $vi['quantity'], $vi['price']]);
            $updateStmt->execute([$vi['quantity'], $vi['product_id']]);
        }
        $pdo->commit();
        respond(['message' => 'Order created successfully', 'order_id' => $orderId, 'total' => $total], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['message' => 'Failed to create order', 'error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET') {
    $userId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
    if ($userId) {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC');
    }
    $orders = $stmt->fetchAll();
    foreach ($orders as &$order) {
        $itemStmt = $pdo->prepare('SELECT oi.*, p.name, p.brand, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?');
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();
    }
    respond(['orders' => $orders]);
}

respond(['message' => 'Method not allowed'], 405);
?>
