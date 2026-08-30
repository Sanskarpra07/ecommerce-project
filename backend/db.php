<?php
// /backend/db.php
$host = '127.0.0.1';
$db   = 'solestyle_db';
$user = 'root';
$pass = ''; // XAMPP default
$charset = 'utf8mb4';

// Use socket if present, or 127.0.0.1 TCP connection
$socket = '/opt/lampp/var/mysql/mysql.sock';
if (file_exists($socket)) {
    $dsn = "mysql:unix_socket=$socket;dbname=$db;charset=$charset";
} else {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
}

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>