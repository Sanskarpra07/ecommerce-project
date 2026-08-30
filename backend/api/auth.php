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
    return is_array($data) && !empty($data) ? $data : $_POST;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['message' => 'Method not allowed'], 405);
}

$data = getJsonBody();
$action = $data['action'] ?? ($_GET['action'] ?? 'login');

if ($action === 'register') {
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $fullName = trim($data['full_name'] ?? '');
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'customer';
    if (!$email || !$fullName || strlen($password) < 6) {
        respond(['message' => 'Invalid input. Password must be at least 6 characters.'], 400);
    }
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) { respond(['message' => 'Email already registered'], 409); }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)');
    $stmt->execute([$fullName, $email, $hash, $role]);
    respond(['message' => 'User registered successfully', 'id' => $pdo->lastInsertId()], 201);
}

$email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';
if (!$email || strlen($password) < 6) { respond(['message' => 'Invalid input'], 400); }
$stmt = $pdo->prepare('SELECT id, full_name, role, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(['message' => 'Invalid credentials'], 401);
}
respond(['id' => $user['id'], 'full_name' => $user['full_name'], 'role' => $user['role'], 'message' => 'Login successful']);
?>
