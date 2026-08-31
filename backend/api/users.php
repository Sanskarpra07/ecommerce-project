<?php
// backend/api/users.php - MegaFoot User Management API (admin only)
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
// GET List Users (admin only)
// --------------------------------------------------------------------------
if ($method === 'GET') {
    $data = getJsonBody();
    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    $stmt = $pdo->query('SELECT id, full_name, email, role, created_at FROM users ORDER BY id ASC');
    $users = $stmt->fetchAll();

    respond(['users' => $users, 'count' => count($users)]);
}

// --------------------------------------------------------------------------
// PUT Update User Role (admin only)
// --------------------------------------------------------------------------
if ($method === 'PUT') {
    $data = getJsonBody();
    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    $role = $data['role'] ?? null;

    if (!$id) {
        respond(['message' => 'User ID is required'], 400);
    }
    if (!in_array($role, ['customer', 'admin'], true)) {
        respond(['message' => 'Valid role required: customer or admin'], 400);
    }

    $check = $pdo->prepare('SELECT id, full_name FROM users WHERE id = ?');
    $check->execute([$id]);
    $user = $check->fetch();
    if (!$user) {
        respond(['message' => 'User not found'], 404);
    }

    $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
    $stmt->execute([$role, $id]);

    respond([
        'message' => 'User role updated successfully',
        'id' => $id,
        'role' => $role,
        'full_name' => $user['full_name'],
    ]);
}

// --------------------------------------------------------------------------
// DELETE User (admin only)
// --------------------------------------------------------------------------
if ($method === 'DELETE') {
    $data = getJsonBody();
    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    $id = (int)($_GET['id'] ?? $data['id'] ?? 0);

    if (!$id) {
        respond(['message' => 'User ID is required'], 400);
    }

    $check = $pdo->prepare('SELECT id, full_name FROM users WHERE id = ?');
    $check->execute([$id]);
    $user = $check->fetch();
    if (!$user) {
        respond(['message' => 'User not found'], 404);
    }

    // Prevent deleting the last admin / guard against deleting self is handled client-side.
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);

    respond(['message' => 'User deleted successfully', 'id' => $id, 'full_name' => $user['full_name']]);
}

respond(['message' => 'Method not allowed'], 405);
?>
