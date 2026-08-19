const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json({ limit: '15mb' })); // Katta rasmlar (Base64) uchun limit
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB ulanishi
mongoose.connect('mongodb://localhost:27017/bilimgo_shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB ulandi ✅'))
  .catch(err => console.log('Xatolik:', err));

// --- SCHEMALAR ---
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: String, required: true }
});
const Category = mongoose.model('Category', categorySchema);

const bannerSchema = new mongoose.Schema({
  img: { type: String, required: true },
  link: { type: String, default: "" }
});
const Banner = mongoose.model('Banner', bannerSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  img: { type: String, required: true },
  desc: { type: String },
  fullDesc: { type: String },
  brand: { type: String },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 },
  attributes: { type: Map, of: [String] } // Masalan: { Rang: ["Qora", "Oq"], O'lcham: ["S", "M"] }
});
const Product = mongoose.model('Product', productSchema);

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  pros: { type: String, required: true },
  cons: { type: String, default: "Yo'q" },
  comment: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: String, required: true },
  images: [String],
  sellerReply: { type: String, default: "" }
}, { timestamps: true });
const Review = mongoose.model('Review', reviewSchema);


// --- API: KATEGORIYALAR ---
app.get('/api/categories', async (req, res) => {
  res.json(await Category.find());
});
app.post('/api/categories', async (req, res) => {
  const cat = new Category(req.body);
  await cat.save();
  res.json(await Category.find());
});
app.put('/api/categories/:id', async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, req.body);
  res.json(await Category.find());
});
app.delete('/api/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json(await Category.find());
});

// --- API: BANNERLAR ---
app.get('/api/banners', async (req, res) => {
  res.json(await Banner.find());
});
app.post('/api/banners', async (req, res) => {
  const banner = new Banner(req.body);
  await banner.save();
  res.json(await Banner.find());
});
app.delete('/api/banners/:id', async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json(await Banner.find());
});

// --- API: MAHSULOTLAR ---
app.get('/api/products', async (req, res) => {
  res.json(await Product.find());
});
app.post('/api/products', async (req, res) => {
  const prod = new Product(req.body);
  await prod.save();
  res.json(await Product.find());
});
app.put('/api/products/:id', async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.json(await Product.find());
});
app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json(await Product.find());
});

// --- API: SHARHLAR ---
app.get('/api/reviews/:productId', async (req, res) => {
  res.json(await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }));
});
app.post('/api/reviews', async (req, res) => {
  const rev = new Review({
    ...req.body,
    date: new Date().toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', year: 'numeric' })
  });
  await rev.save();
  res.json(await Review.find({ productId: req.body.productId }).sort({ createdAt: -1 }));
});
app.delete('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json(await Review.find({ productId: req.query.productId }).sort({ createdAt: -1 }));
});

app.listen(3000, () => console.log('Server 3000-portda ishga tushdi 🚀'));
