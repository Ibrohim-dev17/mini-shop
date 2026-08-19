// Backend server manzili (agar loyiha kompyuterda ishlayotgan bo'lsa)
const API_URL = "http://localhost:3000";

let allProducts = [];

// Serverdan mahsulotlarni internet orqali tortib kelish
async function fetchProducts() {
  try {
    let response = await fetch(`${API_URL}/api/products`);
    allProducts = await response.json();
    
    // Mahsulotlar kelgandan keyin sahifadagi asosiy funksiyani ishga tushiramiz
    if (typeof renderFavorites === 'function') renderFavorites();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderHomeProducts === 'function') renderHomeProducts();
    if (typeof loadProductDetails === 'function') loadProductDetails(); // Agar mahsulot tafsilotlari sahifasi bo'lsa
    
  } catch (err) {
    console.error("Serverdan mahsulotlarni olib kelishda xatolik:", err);
  }
}

// Sahifa ochilishi bilan ma'lumotlarni yuklaymiz
fetchProducts();
