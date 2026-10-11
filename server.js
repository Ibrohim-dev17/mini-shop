const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname))); // Frontend fayllar turgan papka

const dbPath = path.join(__dirname, 'database.json');

// Bazani xavfsiz o'qish va xatolik bo'lsa avtomatik tiklash/yangilash
function readDatabase() {
    try {
        if (!fs.existsSync(dbPath)) {
            const defaultData = { 
                products: [], 
                categories: [], 
                orders: [], 
                users: [{ id: 1, name: "Sotuvchi", language: "uz" }] 
            };
            fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("database.json faylida xatolik topildi, baza yangilanmoqda:", error);
        const freshData = { 
            products: [], 
            categories: [], 
            orders: [], 
            users: [{ id: 1, name: "Sotuvchi", language: "uz" }] 
        };
        fs.writeFileSync(dbPath, JSON.stringify(freshData, null, 2));
        return freshData;
    }
}

// 1. Profil va joriy tilni olish
app.get('/api/profile', (req, res) => {
    let db = readDatabase();
    let user = db.users && db.users[0] ? db.users[0] : { id: 1, name: "Sotuvchi", language: "uz" };
    res.json(user);
});

// 2. Tilni o'zgartirganda database.json ga yozib yangilash
app.put('/api/profile', (req, res) => {
    try {
        let db = readDatabase();
        let newLang = req.body.language;

        if (!db.users || db.users.length === 0) {
            db.users = [{ id: 1, name: "Sotuvchi", language: "uz" }];
        }

        if (newLang) {
            db.users[0].language = newLang;
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }

        res.json({ success: true, language: db.users[0].language });
    } catch (error) {
        console.error("database.json ga yozishda xatolik:", error);
        res.status(500).json({ success: false, error: "Server xatoligi" });
    }
});

// 3. Barcha mahsulotlarni database.json dan olib beruvchi qism
app.get('/api/products', (req, res) => {
    let db = readDatabase();
    res.json(db);
});

app.listen(3000, () => {
    console.log("Server 3000-portda ishga tushdi!");
});
