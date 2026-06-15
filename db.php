<?php
$host = "localhost";
$user = "root";       // Hostingda bazangiz foydalanuvchi nomi
$pass = "";           // Hostingda bazangiz paroli
$dbname = "bot_shop"; // Bazangiz nomi

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Bazaga ulanib bo'lmadi: " . $e->getMessage());
}
?>
