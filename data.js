let allProducts = [];

async function fetchProducts() {
  try {
    let response = await fetch(`${API_URL}/api/products`);
    allProducts = await response.json();
    
    // Serverdan mahsulotlar kelgandan keyin ularni ekranga chiqarish funksiyalari:
    if (typeof renderHomeProducts === 'function') renderHomeProducts();
    if (typeof renderProducts === 'function') renderProducts(); // Ba'zi loyihalarda shunday nomlanadi
    
  } catch (err) {
    console.error("Serverdan mahsulotlarni olib kelishda xatolik:", err);
  }
}

fetchProducts();
