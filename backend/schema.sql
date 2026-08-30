-- ==========================================================
-- SoleStyle E-Commerce Database Schema
-- Database: solestyle_db
-- ==========================================================

CREA<?php
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
TE DATABASE IF NOT EXISTS `solestyle_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `solestyle_db`;

-- ----------------------------------------------------------
-- 1. Table: categories
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Table: products
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `brand` VARCHAR(100) DEFAULT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `size` VARCHAR(50) DEFAULT '9',
    `color` VARCHAR(100) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
    INDEX `idx_category` (`category_id`),
    INDEX `idx_price` (`price`),
    INDEX `idx_brand` (`brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Table: users
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Table: orders
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `order_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `shipping_address` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Table: order_items
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `price` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    INDEX `idx_order` (`order_id`),
    INDEX `idx_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Initial Seed Data: Categories
-- ----------------------------------------------------------
INSERT INTO `categories` (`id`, `category_name`, `description`) VALUES
(1, 'Running', 'Performance running footwear engineered for speed, comfort, and endurance'),
(2, 'Casual', 'Everyday lifestyle shoes, slip-ons, and canvas sneakers for casual comfort'),
(3, 'Formal', 'Refined leather oxfords, brogues, and dress shoes for business and formal events'),
(4, 'Sneakers', 'Streetwear classics, retro basketball kicks, and high-top fashion sneakers')
ON DUPLICATE KEY UPDATE `category_name` = VALUES(`category_name`);

-- ----------------------------------------------------------
-- Initial Seed Data: Users
-- Default Admin: admin@solestyle.com / admin123
-- Default Customer: customer@solestyle.com / password123
-- Guest Checkout Default: guest@solestyle.com / guest123
-- ----------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`) VALUES
(1, 'Guest Customer', 'guest@solestyle.com', '$2y$10$/9lhizocyuVDvsUrx.guuOPxLZeRWCaOgBK006CaSz5Px85P5y76K', 'customer'),
(2, 'Admin User', 'admin@solestyle.com', '$2y$10$10rtlkZVtLY3Ev0zDUiwluRHpAiBAoHcisseZ/Yvb6ioDLJ5wcDSm', 'admin'),
(3, 'John Doe', 'customer@solestyle.com', '$2y$10$/9lhizocyuVDvsUrx.guuOPxLZeRWCaOgBK006CaSz5Px85P5y76K', 'customer')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ----------------------------------------------------------
-- Initial Seed Data: Products
-- ----------------------------------------------------------
INSERT INTO `products` (`id`, `category_id`, `name`, `brand`, `price`, `size`, `color`, `description`, `image_url`, `stock_quantity`) VALUES
(1, 1, 'Air Zoom Pegasus 39', 'Nike', 129.99, '9', 'Black/Orange', 'Responsive daily trainer with Zoom Air units and engineered mesh for a smooth, energetic ride.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 45),
(2, 1, 'Ultraboost 22', 'Adidas', 189.99, '10', 'White', 'Premium performance running shoe with responsive Boost midsole for maximum energy return and comfort.', 'https://images.unsplash.com/photo-1518002171953-a080ee543b7f?auto=format&fit=crop&w=800&q=80', 30),
(3, 1, 'Fresh Foam 1080v12', 'New Balance', 159.95, '8', 'Blue/Cyan', 'Plush Fresh Foam X cushioning built for long-distance training comfort and effortless transition.', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80', 25),
(4, 1, 'Gel-Kayano 29', 'ASICS', 160.00, '10', 'Grey/Yellow', 'Advanced stability running shoe featuring FF BLAST PLUS cushioning and dynamic support system.', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', 20),
(5, 1, 'Clifton 9', 'Hoka One One', 145.00, '9', 'Orange/Teal', 'Ultra-lightweight daily trainer delivering revitalized underfoot foam and improved outsole design.', 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', 35),
(6, 2, 'Chuck Taylor All Star', 'Converse', 64.99, '9', 'Red', 'Classic high-top canvas sneaker with timeless silhouette and signature ankle patch for casual wear.', 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80', 100),
(7, 2, 'Old Skool Classic', 'Vans', 69.99, '10', 'Black/White', 'Iconic skate shoe featuring the signature side stripe, durable suede and canvas uppers, and waffle sole.', 'https://images.unsplash.com/photo-1525966222134-fcac221044c9?auto=format&fit=crop&w=800&q=80', 80),
(8, 2, 'Stan Smith Leather', 'Adidas', 89.99, '11', 'White/Green', 'Clean leather minimalist court sneaker that never goes out of style. Built with recycled materials.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', 60),
(9, 2, 'Club C 85 Vintage', 'Reebok', 85.00, '9', 'Chalk/Green', 'Court-inspired classic with soft leather upper, heritage logos, and lightweight EVA midsole.', 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80', 40),
(10, 2, 'Suede Classic XXI', 'Puma', 75.00, '8', 'Navy/White', 'Heritage street staple with velvety full suede upper and comfy synthetic lining.', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', 50),
(11, 3, 'Cap Toe Oxford', 'Allen Edmonds', 295.00, '10', 'Brown', 'Handcrafted dress oxford made of full-grain calfskin leather, built with 360-degree Goodyear welt.', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80', 15),
(12, 3, 'Park Avenue Executive', 'Cole Haan', 245.00, '9', 'Black', 'Premium polished calfskin oxford with sleek boardroom-ready silhouette and Grand.OS comfort technology.', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=800&q=80', 10),
(13, 3, 'Wingtip Brogue', 'Clarks', 165.00, '11', 'Tan', 'Classic perforations and medallion toe detailing on rich leather with OrthoLite footbed cushioning.', 'https://images.unsplash.com/photo-1449505278894-297fdbffaa08?auto=format&fit=crop&w=800&q=80', 12),
(14, 3, 'Tassel Loafer', 'Florsheim', 135.00, '10', 'Burgundy', 'Slip-on dress loafer tailored in smooth genuine leather with decorative tassels and flexible sole.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd43f9db?auto=format&fit=crop&w=800&q=80', 18),
(15, 3, 'Chelsea Dress Boot', 'Thursday Boot Co', 199.00, '9', 'Dark Brown', 'Sleek weather-resistant leather Chelsea boot with Goodyear welt construction and Poron insole.', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80', 22),
(16, 4, 'Air Force 1 \'07', 'Nike', 109.99, '9', 'White', 'The legendary AF1 basketball icon featuring crisp stitched overlays and encapsulated Nike Air cushioning.', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=80', 150),
(17, 4, 'Air Jordan 1 Retro High', 'Jordan', 179.99, '11', 'Chicago Red/Black', 'Iconic high-top basketball sneaker crafted with genuine premium leather and classic Jordan Wings logo.', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80', 50),
(18, 4, 'Yeezy Boost 350 V2', 'Adidas', 229.99, '10', 'Zebra / Grey', 'Engineered Primeknit upper combined with full-length Boost midsole for standout streetwear comfort.', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', 40),
(19, 4, 'Dunk Low Retro', 'Nike', 115.00, '10', 'Panda Black/White', 'Heritage 80s hoops icon revitalized with crisp color blocking and durable padded low-cut collar.', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80', 75),
(20, 4, 'New Balance 550', 'New Balance', 120.00, '9', 'White/Navy', 'Tribute to 90s basketball street culture with clean leather, suede details, and retro court traction.', 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80', 65)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);