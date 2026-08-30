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

$method = $_SERVER['REQUEST_METHOD'];

// --------------------------------------------------------------------------
// 1. POST Create New Order: /orders.php
// --------------------------------------------------------------------------
if ($method === 'POST') {
    $data = getJsonBody();
    if (!isset($data['items']) || !is_array($data['items']) || empty($data['items'])) {
        respond(['message' => 'Missing or empty required field: items'], 400);
    }
    $userId = isset($data['user_id']) ? (int)$data['user_id'] : 1;

    // Verify or ensure user exists in database to avoid foreign key violation
    $userCheck = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $userCheck->execute([$userId]);
    if (!$userCheck->fetch()) {
        // Fallback: create default guest user if no users exist or user_id not found
        $findAnyUser = $pdo->query('SELECT id FROM users ORDER BY id ASC LIMIT 1')->fetch();
        if ($findAnyUser) {
            $userId = (int)$findAnyUser['id'];
        } else {
            $stmtGuest = $pdo->prepare("INSERT INTO users (id, full_name, email, password_hash, role) VALUES (1, 'Guest Customer', 'guest@solestyle.com', '', 'customer')");
            $stmtGuest->execute();
            $userId = 1;
        }
    }

    $items = $data['items'];
    $total = 0;
    $validItems = [];
    foreach ($items as $item) {
        $productId = (int)($item['product_id'] ?? 0);
        $quantity = (int)($item['quantity'] ?? 1);

        if ($productId <= 0 || $quantity <= 0) {
            respond(['message' => 'Invalid product ID or quantity specified'], 400);
        }

        $stmt = $pdo->prepare('SELECT id, name, price, stock_quantity FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            respond(['message' => "Product ID $productId not found"], 404);
        }

        if ((int)$product['stock_quantity'] < $quantity) {
            respond([
                'message' => "Insufficient stock for '{$product['name']}'. Only {$product['stock_quantity']} available, requested $quantity."
            ], 400);
        }

        $price = (float)$product['price'];
        $total += $price * $quantity;
        $validItems[] = [
            'product_id' => $productId,
            'quantity'   => $quantity,
            'price'      => $price,
        ];
    }

    $shippingAddress = isset($data['shipping_address']) ? trim($data['shipping_address']) : null;

    $pdo->beginTransaction();
    try {
        $orderStmt = $pdo->prepare('INSERT INTO orders (user_id, total_amount, payment_status, order_status, shipping_address) VALUES (?, ?, ?, ?, ?)');
        $orderStmt->execute([$userId, $total, 'Paid', 'Processing', $shippingAddress]);
        $orderId = (int)$pdo->lastInsertId();

        $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        $stockStmt = $pdo->prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');

        foreach ($validItems as $vi) {
            $itemStmt->execute([$orderId, $vi['product_id'], $vi['quantity'], $vi['price']]);
            $stockStmt->execute([$vi['quantity'], $vi['product_id']]);
        }

        $pdo->commit();

        respond([
            'message'  => 'Order created successfully',
            'order_id' => $orderId,
            'total'    => (float)$total,
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['message' => 'Failed to place order', 'error' => $e->getMessage()], 500);
    }
}

// --------------------------------------------------------------------------
// 2. GET List Orders: /orders.php or /orders.php?user_id=X
// --------------------------------------------------------------------------
if ($method === 'GET') {
    $userId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);

    if ($userId) {
        $stmt = $pdo->prepare('SELECT o.*, u.full_name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC');
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query('SELECT o.*, u.full_name as user_name, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
    }

    $orders = $stmt->fetchAll();

    foreach ($orders as &$order) {
        $order['total_amount'] = (float)$order['total_amount'];
        $itemStmt = $pdo->prepare('SELECT oi.*, p.name, p.brand, p.image_url, p.color, c.category_name FROM order_items oi JOIN products p ON oi.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id WHERE oi.order_id = ?');
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();
        foreach ($items as &$item) {
            $item['price'] = (float)$item['price'];
            $item['quantity'] = (int)$item['quantity'];
        }
        $order['items'] = $items;
    }

    respond(['orders' => $orders, 'count' => count($orders)]);
}

respond(['message' => 'Method not allowed'], 405);
?>

