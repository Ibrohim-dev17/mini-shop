<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. MAHSULOTLARNI BAZADAN OLISH (Mijozlar sahifasi uchun)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_products') {
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($products);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// 2. YANGI MAHSULOT QO'SHISH VA RASM YUKLASH (Admin panel uchun)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add_product') {
    try {
        $name = $_POST['name'] ?? '';
        $category = $_POST['category'] ?? '';
        $price = $_POST['price'] ?? 0;
        $description = $_POST['description'] ?? '';
        
        // Unikal ID yaratish (Sizning front-end formatingizda, masalan: termos_12345)
        $id = $category . "_" . time() . rand(10, 99);

        if (empty($name) || empty($category) || empty($price) || !isset($_FILES['image'])) {
            throw new Exception("Hamma majburiy maydonlarni to'ldiring!");
        }

        // Rasmlar bilan ishlash
        $file = $_FILES['image'];
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array(strtolower($ext), $allowed)) {
            throw new Exception("Faqat JPG, PNG yoki WEBP formatdagi rasmlar ruxsat etiladi.");
        }

        // Rasmga yangi nom berish va serverdagi /uploads papkasiga ko'chirish
        $imgName = $id . "." . $ext;
        $uploadTarget = "uploads/" . $imgName;

        if (!move_uploaded_file($file['tmp_name'], $uploadTarget)) {
            throw new Exception("Rasmni serverga yuklashda xatolik yuz berdi.");
        }

        // Rasmlar manzili (URL)
        $imgUrl = "uploads/" . $imgName;

        // Ma'lumotlarni bazaga (MySQL) yozish
        $sql = "INSERT INTO products (id, category_name, name, price, img_url, description) 
                VALUES (:id, :category, :name, :price, :img_url, :description)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':category' => $category,
            ':name' => $name,
            ':price' => $price,
            ':img_url' => $imgUrl,
            ':description' => $description
        ]);

        echo json_encode(["status" => "success", "message" => "Mahsulot muvaffaqiyatli qo'shildi!"]);

    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
