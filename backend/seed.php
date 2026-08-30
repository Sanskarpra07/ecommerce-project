<?php
require_once __DIR__ . '/db.php';

if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}

echo "=== SoleStyle Database Seeder ===\n\n";

// 1. Ensure Schema and Tables Exist
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `categories` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `category_name` VARCHAR(100) NOT NULL UNIQUE,
        `description` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `full_name` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS `orders` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
        `order_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
        `shipping_address` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS `order_items` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `order_id` INT NOT NULL,
        `product_id` INT NOT NULL,
        `quantity` INT NOT NULL DEFAULT 1,
        `price` DECIMAL(10, 2) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// 2. Seed Categories
$categories = [
    ['Running', 'Performance running footwear engineered for speed, comfort, and endurance'],
    ['Casual', 'Everyday lifestyle shoes, slip-ons, and canvas sneakers for casual comfort'],
    ['Formal', 'Refined leather oxfords, brogues, and dress shoes for business and formal events'],
    ['Sneakers', 'Streetwear classics, retro basketball kicks, and high-top fashion sneakers'],
];

$catStmt = $pdo->prepare("INSERT INTO categories (category_name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)");
foreach ($categories as $cat) {
    $catStmt->execute([$cat[0], $cat[1]]);
}

$catIds = [];
$fetchCats = $pdo->query("SELECT id, category_name FROM categories")->fetchAll();
foreach ($fetchCats as $row) {
    $catIds[$row['category_name']] = (int)$row['id'];
}
echo "[✓] Categories synchronized: " . count($catIds) . " categories available.\n";

// 3. Seed Users
$adminHash = password_hash('admin123', PASSWORD_DEFAULT);
$userHash  = password_hash('password123', PASSWORD_DEFAULT);
$guestHash = password_hash('guest123', PASSWORD_DEFAULT);

$users = [
    [1, 'Guest Customer', 'guest@solestyle.com', $guestHash, 'customer'],
    [2, 'Admin User', 'admin@solestyle.com', $adminHash, 'admin'],
    [3, 'Demo Customer', 'customer@solestyle.com', $userHash, 'customer'],
];

$userStmt = $pdo->prepare("INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role)");
foreach ($users as $u) {
    $userStmt->execute($u);
}
echo "[✓] Default users created/updated (Admin: admin@solestyle.com / admin123, Customer: customer@solestyle.com / password123).\n";

// 4. Truncate / Refresh Products
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE order_items");
$pdo->exec("TRUNCATE TABLE orders");
$pdo->exec("TRUNCATE TABLE products");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// 5. Seed Extensive Products Catalog
$products = [
    // Running
    ['Running', 'Air Zoom Pegasus 39', 'Nike', 129.99, '9', 'Black/Orange', 'Responsive daily trainer with Zoom Air units and engineered mesh for a smooth, energetic ride.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 45],
    ['Running', 'Ultraboost 22', 'Adidas', 189.99, '10', 'White', 'Premium performance running shoe with responsive Boost midsole for maximum energy return and comfort.', 'https://images.unsplash.com/photo-1518002171953-a080ee543b7f?auto=format&fit=crop&w=800&q=80', 30],
    ['Running', 'Fresh Foam 1080v12', 'New Balance', 159.95, '8', 'Blue/Cyan', 'Plush Fresh Foam X cushioning built for long-distance training comfort and effortless transition.', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80', 25],
    ['Running', 'Gel-Kayano 29', 'ASICS', 160.00, '10', 'Grey/Yellow', 'Advanced stability running shoe featuring FF BLAST PLUS cushioning and dynamic support system.', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', 20],
    ['Running', 'Clifton 9', 'Hoka One One', 145.00, '9', 'Orange/Teal', 'Ultra-lightweight daily trainer delivering revitalized underfoot foam and improved outsole design.', 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', 35],

    // Casual
    ['Casual', 'Chuck Taylor All Star', 'Converse', 64.99, '9', 'Red', 'Classic high-top canvas sneaker with timeless silhouette and signature ankle patch for casual wear.', 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80', 100],
    ['Casual', 'Old Skool Classic', 'Vans', 69.99, '10', 'Black/White', 'Iconic skate shoe featuring the signature side stripe, durable suede and canvas uppers, and waffle sole.', 'https://images.unsplash.com/photo-1525966222134-fcac221044c9?auto=format&fit=crop&w=800&q=80', 80],
    ['Casual', 'Stan Smith Leather', 'Adidas', 89.99, '11', 'White/Green', 'Clean leather minimalist court sneaker that never goes out of style. Built with recycled materials.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', 60],
    ['Casual', 'Club C 85 Vintage', 'Reebok', 85.00, '9', 'Chalk/Green', 'Court-inspired classic with soft leather upper, heritage logos, and lightweight EVA midsole.', 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80', 40],
    ['Casual', 'Suede Classic XXI', 'Puma', 75.00, '8', 'Navy/White', 'Heritage street staple with velvety full suede upper and comfy synthetic lining.', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', 50],

    // Formal
    ['Formal', 'Cap Toe Oxford', 'Allen Edmonds', 295.00, '10', 'Brown', 'Handcrafted dress oxford made of full-grain calfskin leather, built with 360-degree Goodyear welt.', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80', 15],
    ['Formal', 'Park Avenue Executive', 'Cole Haan', 245.00, '9', 'Black', 'Premium polished calfskin oxford with sleek boardroom-ready silhouette and Grand.OS comfort technology.', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=800&q=80', 10],
    ['Formal', 'Wingtip Brogue', 'Clarks', 165.00, '11', 'Tan', 'Classic perforations and medallion toe detailing on rich leather with OrthoLite footbed cushioning.', 'https://images.unsplash.com/photo-1449505278894-297fdbffaa08?auto=format&fit=crop&w=800&q=80', 12],
    ['Formal', 'Tassel Loafer', 'Florsheim', 135.00, '10', 'Burgundy', 'Slip-on dress loafer tailored in smooth genuine leather with decorative tassels and flexible sole.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd43f9db?auto=format&fit=crop&w=800&q=80', 18],
    ['Formal', 'Chelsea Dress Boot', 'Thursday Boot Co', 199.00, '9', 'Dark Brown', 'Sleek weather-resistant leather Chelsea boot with Goodyear welt construction and Poron insole.', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80', 22],

    // Sneakers
    ['Sneakers', 'Air Force 1 \'07', 'Nike', 109.99, '9', 'White', 'The legendary AF1 basketball icon featuring crisp stitched overlays and encapsulated Nike Air cushioning.', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=80', 150],
    ['Sneakers', 'Air Jordan 1 Retro High', 'Jordan', 179.99, '11', 'Chicago Red/Black', 'Iconic high-top basketball sneaker crafted with genuine premium leather and classic Jordan Wings logo.', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80', 50],
    ['Sneakers', 'Yeezy Boost 350 V2', 'Adidas', 229.99, '10', 'Zebra / Grey', 'Engineered Primeknit upper combined with full-length Boost midsole for standout streetwear comfort.', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', 40],
    ['Sneakers', 'Dunk Low Retro', 'Nike', 115.00, '10', 'Panda Black/White', 'Heritage 80s hoops icon revitalized with crisp color blocking and durable padded low-cut collar.', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80', 75],
    ['Sneakers', 'New Balance 550', 'New Balance', 120.00, '9', 'White/Navy', 'Tribute to 90s basketball street culture with clean leather, suede details, and retro court traction.', 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=800&q=80', 65],
];

$insert = $pdo->prepare("INSERT INTO products (category_id, name, brand, price, size, color, description, image_url, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

$count = 0;
foreach ($products as $p) {
    $catId = $catIds[$p[0]] ?? 1;
    $insert->execute([
        $catId,
        $p[1], // name
        $p[2], // brand
        $p[3], // price
        $p[4], // size
        $p[5], // color
        $p[6], // description
        $p[7], // image_url
        $p[8]  // stock_quantity
    ]);
    $count++;
}

echo "[✓] Successfully seeded $count products across " . count($catIds) . " categories into solestyle_db.\n";
echo "\nSeeding completed successfully!\n";
?>
