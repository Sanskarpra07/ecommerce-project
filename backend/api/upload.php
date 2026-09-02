<?php
require_once __DIR__ . '/../cors.php';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function verifyAdminAuth() {
    $token = $_GET['admin_token'] ?? $_POST['admin_token'] ?? '';
    if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }
    return $token === 'admin123';
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!verifyAdminAuth()) {
        respond(['message' => 'Forbidden: Invalid administrator token'], 403);
    }

    if (empty($_FILES['image'])) {
        respond(['message' => 'No image file provided'], 400);
    }

    $file = $_FILES['image'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(['message' => 'File upload failed (error code ' . $file['error'] . ')'], 400);
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        respond(['message' => 'Image is too large. Maximum size is 5MB.'], 400);
    }

    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed, true)) {
        respond(['message' => 'Invalid file type. Only JPG, PNG, GIF and WEBP images are allowed.'], 400);
    }

    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
    ];
    $ext = $extMap[$mime];

    $uploadDir = __DIR__ . '/../../userfiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    // Best-effort: ensure the web server (Apache 'daemon') can write here.
    @chmod($uploadDir, 0777);

    $filename = 'product_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $destPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        respond(['message' => 'Failed to move uploaded file'], 500);
    }

    $base = 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/ecommerce-project/userfiles/';
    $url = $base . $filename;

    respond([
        'message' => 'Image uploaded successfully',
        'url'     => $url,
        'filename'=> $filename,
    ], 201);
}

respond(['message' => 'Method not allowed'], 405);
?>
