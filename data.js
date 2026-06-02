const allProducts = [
  {id:"termos1", category:"termos", name:"Termos 1L", price:120000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"1 litr termos. 12 soat issiq va sovuq haroratni saqlaydi.", rating: 4.8, reviewsCount: 124},
  {id:"termos2", category:"termos", name:"Termos 2L", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"2 litr katta termos. Oila va uzoq safarlar uchun eng zo‘r tanlov.", rating: 4.9, reviewsCount: 89},
  {id:"termos3", category:"termos", name:"Sport Termos", price:110000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Sport bilan shug'ullanish uchun qulay, yengil termos.", rating: 4.5, reviewsCount: 45},
  {id:"blender1", category:"blender", name:"Blender 3x1", price:220000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"3 ta funksiyali yuqori sifatli blender.", rating: 4.7, reviewsCount: 210},
  {id:"blender2", category:"blender", name:"Mini Blender", price:160000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Mini blender. Har qanday sharoitda, yo'lda ham qulay.", rating: 4.6, reviewsCount: 95},
  {id:"blender3", category:"blender", name:"Professional Blender", price:390000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Professional va o'ta kuchli dvigatelli blender.", rating: 5.0, reviewsCount: 56},
  {id:"qozon1", category:"qozon", name:"Qozon 5L", price:180000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"5 litrli qalin quyma temir qozon.", rating: 4.8, reviewsCount: 130},
  {id:"qozon2", category:"qozon", name:"Qozon 10L", price:260000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"10 litrli katta va baquvvat qozon.", rating: 4.9, reviewsCount: 78},
  {id:"mikser1", category:"mikser", name:"Mikser 5 Speed", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"5 xil tezlik rejimiga ega qulay oshxona mikseri.", rating: 4.4, reviewsCount: 67},
  {id:"mikser2", category:"mikser", name:"Mini Mikser", price:95000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Kichik va ixcham mikser.", rating: 4.3, reviewsCount: 34},
  {id:"idish1", category:"idishlar", name:"Idishlar To‘plami", price:150000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Zamonaviy oshxona bezagi uchun maxsus idishlar.", rating: 4.7, reviewsCount: 112},
  {id:"idish2", category:"idishlar", name:"Premium Idishlar", price:260000, img:"https://i.imgur.com/3ZQ3Z5b.png", desc:"Premium turkumidagi nafis dizaynli idishlar.", rating: 4.9, reviewsCount: 90}
];

function updateBottomBadges() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const favs = JSON.parse(localStorage.getItem("favs")) || [];
  const cartLink = document.querySelector('a[href="cart.html"]');
  const favLink = document.querySelector('a[href="favorites.html"]');

  if (cartLink) {
    const oldBadge = cartLink.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty > 0) {
      cartLink.style.position = 'relative';
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.style.cssText = "position:absolute; top:4px; right:4px; background:#ff3b30; color:white; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:2px solid white; z-index:10;";
      badge.innerText = totalQty;
      cartLink.appendChild(badge);
    }
  }

  if (favLink) {
    const oldBadge = favLink.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    if (favs && favs.length > 0) {
      favLink.style.position = 'relative';
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.style.cssText = "position:absolute; top:4px; right:4px; background:#ff3b30; color:white; font-size:10px; font-weight:700; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:2px solid white; z-index:10;";
      badge.innerText = favs.length;
      favLink.appendChild(badge);
    }
  }
}
document.addEventListener("DOMContentLoaded", updateBottomBadges);
window.addEventListener('favsUpdated', updateBottomBadges);
