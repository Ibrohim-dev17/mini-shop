const allProducts = [
  {id:"termos1", category:"termos", name:"Termos 1L", price:120000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"1 litr termos. 12 soat issiq va sovuq haroratni saqlaydi. Sifatli zanglamas po'latdan yasalgan."},
  {id:"termos2", category:"termos", name:"Termos 2L", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"2 litr katta termos. Oila va uzoq safarlar uchun eng zo‘r tanlov."},
  {id:"termos3", category:"termos", name:"Sport Termos", price:110000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Sport bilan shug'ullanish uchun qulay, yengil va ixcham termos."},
  {id:"blender1", category:"blender", name:"Blender 3x1", price:220000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"3 ta funksiyali yuqori sifatli blender. Mevalar, sabzavotlar va muzlarni oson maydalaydi."},
  {id:"blender2", category:"blender", name:"Mini Blender", price:160000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Mini blender. Har qanday sharoitda, yo'lda ham oshxona uchun juda qulay."},
  {id:"blender3", category:"blender", name:"Professional Blender", price:390000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Professional va o'ta kuchli dvigatelli blender, og'ir va uzluksiz ishlar uchun."},
  {id:"qozon1", category:"qozon", name:"Qozon 5L", price:180000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"5 litrli qalin quyma temir qozon. Taomlar bir me'yorda va mazali pishadi."},
  {id:"qozon2", category:"qozon", name:"Qozon 10L", price:260000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"10 litrli katta va baquvvat qozon, oilaviy tadbirlar va marosimlar uchun."},
  {id:"mikser1", category:"mikser", name:"Mikser 5 Speed", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"5 xil tezlik rejimiga va zanglamas metall nasadkalarga ega qulay oshxona mikseri."},
  {id:"mikser2", category:"mikser", name:"Mini Mikser", price:95000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Kichik va ixcham mikser. Krem va kofeni ko'pirtirish uchun qulay variant."},
  {id:"idish1", category:"idishlar", name:"Idishlar To‘plami", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Zamonaviy oshxona bezagi uchun maxsus chidamli materialdan yasalgan idishlar komplekti."},
  {id:"idish2", category:"idishlar", name:"Premium Idishlar", price:260000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Premium turkumidagi nafis dizaynli, qirilishga chidamli va uzoq xizmat qiluvchi idishlar to'plami."}
];

function updateBottomBadges() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const favs = JSON.parse(localStorage.getItem("favs")) || [];
  
  const cartLink = document.querySelector('a[href="cart.html"]');
  if (cartLink) {
    let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    let oldBadge = cartLink.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    if (totalQty > 0) {
      cartLink.style.position = 'relative';
      cartLink.innerHTML += `<span class="badge" style="position:absolute; top:4px; right:4px; background:#ff3b30; color:white; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${totalQty}</span>`;
    }
  }

  const favLink = document.querySelector('a[href="favorites.html"]');
  if (favLink) {
    let oldBadge = favLink.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    if (favs.length > 0) {
      favLink.style.position = 'relative';
      favLink.innerHTML += `<span class="badge" style="position:absolute; top:4px; right:4px; background:#ff3b30; color:white; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:2px solid white;">${favs.length}</span>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", updateBottomBadges);
window.addEventListener('favsUpdated', updateBottomBadges);
