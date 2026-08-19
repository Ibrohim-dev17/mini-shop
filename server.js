const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Vaqtinchalik xotiradagi mahsulotlar ro'yxati (Keyin buni bazaga ulaymiz)
let products = [
  { id: "1", name: "Non pishirgich", price: 150000, desc: "Sifatli", img: "https://via.placeholder.com/150" }
];

// 1. Mahsulotlarni olish
app.get('/api/products', (req, res) => {
  res.json(products);
});

// 2. Yangi mahsulot qo'shish (Admin uchun)
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  newProduct.id = Date.now().toString(); // Unikal ID
  products.push(newProduct);
  res.json({ success: true, message: "Mahsulot qo'shildi!", product: newProduct });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlayapti`);
});
