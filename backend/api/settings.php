<?php
// backend/api/settings.php - MegaFoot Site Settings API
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

// Ensure the settings table exists (idempotent)
function ensureSettingsTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `setting_key` VARCHAR(100) NOT NULL UNIQUE,
        `setting_value` TEXT DEFAULT NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

// Return public settings (no auth required for reads)
function fetchSettings($pdo) {
    ensureSettingsTable($pdo);
    $stmt = $pdo->query('SELECT setting_key, setting_value FROM settings');
    $rows = $stmt->fetchAll();
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    respond(['settings' => fetchSettings($pdo)]);
}

if ($method === 'PUT') {
    $data = getJsonBody();
    if (!verifyAdminAuth($data)) {
        respond(['message' => 'Forbidden: Invalid administrator authentication token'], 403);
    }

    $settings = $data['settings'] ?? $data;
    if (!is_array($settings) || empty($settings)) {
        respond(['message' => 'No settings provided to update'], 400);
    }

    ensureSettingsTable($pdo);
    $upsert = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');

    foreach ($settings as $key => $value) {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        } else {
            $value = (string)$value;
        }
        $upsert->execute([$key, $value]);
    }

    respond([
        'message' => 'Settings saved successfully',
        'settings' => fetchSettings($pdo),
    ]);
}

respond(['message' => 'Method not allowed'], 405);
?>
