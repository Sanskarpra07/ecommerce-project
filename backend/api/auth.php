<?php
// backend/api/auth.php - MegaFoot Auth API
require_once __DIR__ . '/../db.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) && !empty($data) ? $data : $_POST;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$data   = $method === 'POST' ? getJsonBody() : [];
$action = $data['action'] ?? ($_GET['action'] ?? 'login');

if ($action === 'register') {
    if ($method !== 'POST') {
        respond(['message' => 'Method not allowed'], 405);
    }

    $fullName = trim($data['full_name'] ?? $data['name'] ?? '');
    $email    = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? '';
    $role     = $data['role'] ?? 'customer';

    if (!$fullName || !$email || strlen($password) < 6) {
        respond(['message' => 'Invalid input. Name, email, and a password of at least 6 characters are required.'], 400);
    }

    if (!in_array($role, ['customer', 'admin'], true)) {
        $role = 'customer';
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
        if ($stmt->fetch()) {
            respond(['message' => 'An account with this email already exists.'], 409);
        }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    $insert->execute([$fullName, $email, $hash, $role]);
    $newUserId = (int)$pdo->lastInsertId();

    $token = ($role === 'admin') ? 'admin123' : bin2hex(random_bytes(16));

        respond([
        'message'   => 'Account created successfully.',
        'id'        => $newUserId,
        'full_name' => $fullName,
        'name'      => $fullName,
        'email'     => $email,
        'role'      => $role,
        'user'      => [
            'id'        => $newUserId,
            'full_name' => $fullName,
            'name'      => $fullName,
            'email'     => $email,
            'role'      => $role,
        ],
        'token'     => $token,
    ], 201);
}

if ($action === 'login') {
    if ($method !== 'POST') {
        respond(['message' => 'Method not allowed'], 405);
    }

    $email    = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? '';

    if (!$email || strlen($password) < 6) {
        respond(['message' => 'Email and password are required.'], 400);
        }
    $stmt = $pdo->prepare('SELECT id, full_name, email, role, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(['message' => 'Invalid credentials'], 401);
}

    $token = ($user['role'] === 'admin') ? 'admin123' : bin2hex(random_bytes(16));

        respond([
        'message'   => 'Login successful',
        'id'        => (int)$user['id'],
        'full_name' => $user['full_name'],
        'name'      => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'user'      => [
            'id'        => (int)$user['id'],
            'full_name' => $user['full_name'],
            'name'      => $user['full_name'],
            'email'     => $user['email'],
            'role'      => $user['role'],
        ],
        'token'     => $token,
    ]);
}

if ($action === 'profile') {
    $userId = $_GET['user_id'] ?? $data['user_id'] ?? null;
    if (!$userId) {
        respond(['message' => 'User ID is required.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        respond(['message' => 'User not found.'], 404);
    }

    $user['name'] = $user['full_name'];
    respond(['user' => $user]);
}

respond(['message' => 'Invalid auth endpoint action.'], 400);

