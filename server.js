const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Barcha frontend sahifalarni (HTML, CSS, JS) to'g'ridan-to'g'ri o'qish uchun
app.use(express.static(__dirname));

// Ma'lumotlar bazasi fayli yo'li
const DB_FILE = path.join(__dirname, 'database.json');

// Bazani o'qish funksiyasi
const readDatabase = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { 
            products: [], 
            categories: [], 
            orders: [], 
            users: [] 
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
};

// Bazaga yozish funksiyasi
const writeDatabase = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API YO'LLARI (BACKEND) ---

// 1. Hamma mahsulotlarni olish
app.get('/api/products', (req, res) => {
    const db = readDatabase();
    res.json(db.products);
});

// 2. Yangi mahsulot qo'shish (Admin panel uchun)
app.post('/api/products', (req, res) => {
    const db = readDatabase();
    const newProduct = { id: Date.now(), ...req.body };
    db.products.push(newProduct);
    writeDatabase(db);
    res.json({ success: true, product: newProduct });
});

// 3. Buyurtma berish (Sotilganlarni hisoblash uchun)
app.post('/api/orders', (req, res) => {
    const db = readDatabase();
    const newOrder = { id: Date.now(), date: new Date(), ...req.body };
    db.orders.push(newOrder);
    writeDatabase(db);
    res.json({ success: true, order: newOrder });
});

// Serverni ishga tushirish
app.listen(PORT, () => {
    console.log(`Server ishlamoqda: port ${PORT}`);
});
