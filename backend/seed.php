<?php
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain');

$categories = ['Running', 'Casual', 'Formal', 'Sneakers'];
foreach ($categories as $cat) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO categories (category_name) VALUES (?)");
    $stmt->execute([$cat]);
}

$catIds = [];
foreach ($categories as $cat) {
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE category_name = ?");
    $stmt->execute([$cat]);
    $catIds[$cat] = $stmt->fetchColumn();
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE order_items");
$pdo->exec("TRUNCATE TABLE orders");
$pdo->exec("TRUNCATE TABLE products");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

$products = [
    ['Running', 'Air Zoom Pegasus 39', 'Nike', 129.99, '9', 'Black/Orange', 'Responsive daily trainer with Zoom Air units for a smooth, energetic ride.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 45],
    ['Running', 'Ultraboost 22', 'Adidas', 189.99, '10', 'White', 'Premium running shoe with Boost midsole for maximum energy return.', 'https://images.unsplash.com/photo-1518002171953-a080ee543b7f?auto=format&fit=crop&w=800&q=80', 30],
    ['Running', 'Fresh Foam 1080', 'New Balance', 159.95, '8', 'Blue', 'Plush Fresh Foam cushioning built for long-distance comfort.', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80', 25],
    ['Casual', 'Chuck Taylor All Star', 'Converse', 64.99, '9', 'Red', 'Classic canvas high-top. Timeless style for everyday wear.', 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80', 100],
    ['Casual', 'Old Skool', 'Vans', 69.99, '10', 'Black/White', 'Iconic skate shoe with the signature side stripe and padded collar.', 'https://images.unsplash.com/photo-1525966222134-fcac221044c9?auto=format&fit=crop&w=800&q=80', 80],
    ['Casual', 'Stan Smith', 'Adidas', 89.99, '11', 'White/Green', 'Clean leather court sneaker that never goes out of style.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80', 60],
    ['Formal', 'Cap Toe Oxford', 'Allen Edmonds', 295.00, '10', 'Brown', 'Handcrafted leather oxford for business and formal occasions.', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80', 15],
    ['Formal', 'Park Avenue', 'Cole Haan', 245.00, '9', 'Black', 'Premium calfskin oxford with a sleek, boardroom-ready silhouette.', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=800&q=80', 10],
    ['Formal', 'Wingtip Brogue', 'Clarks', 165.00, '11', 'Tan', 'Classic brogue detailing on a durable leather upper.', 'https://images.unsplash.com/photo-1449505278894-297fdbffaa08?auto=format&fit=crop&w=800&q=80', 12],
    ['Sneakers', 'Air Force 1', 'Nike', 109.99, '9', 'White', 'The legendary AF1 with Nike Air cushioning and a durable leather upper.', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=80', 150],
    ['Sneakers', 'Air Jordan 1 Retro', 'Jordan', 179.99, '11', 'Red/Black', 'Iconic high-top basketball sneaker with premium leather construction.', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80', 50],
    ['Sneakers', 'Yeezy Boost 350', 'Adidas', 229.99, '10', 'Grey', 'Primeknit upper with Boost cushioning for all-day street comfort.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd43f9db?auto=format&fit=crop&w=800&q=80', 40],
];

$insert = $pdo->prepare("INSERT INTO products (category_id, name, brand, price, size, color, description, image_url, stock_quantity) VALUES (?,?,?,?,?,?,?,?,?)");

$count = 0;
foreach ($products as $p) {
    $insert->execute([$catIds[$p[0]], $p[1], $p[2], $p[3], $p[4], $p[5], $p[6], $p[7], $p[8]]);
    $count++;
}

echo "Successfully seeded $count products into solestyle_db.\n";
?>
