'use strict';
/*
 * ============================================================================
 *  DO'KON SERVERI (Node.js)  —  Render.com'da `node server.js` bilan ishlaydi
 * ============================================================================
 *  Tashqi kutubxona kerak emas (Express ham). Faqat PostgreSQL ulansa `pg` ishlatiladi.
 *
 *  NIMA QILADI
 *   1. Saytning html/css/js fayllarini beradi.
 *   2. /database.json (va eski /api/products): mahsulotlar + sharhlar + QOLDIQ + haftalik sotuv.
 *   3. KIRISH:
 *        - Telegram ichida: avtomatik (Telegram ID bo'yicha). Har bir Telegram akkaunt ALOHIDA.
 *          Telefon raqam: mijoz "Raqamni ulashish" tugmasini bosadi, bot raqamni Telegramning o'zidan oladi.
 *        - Oddiy brauzerda: email + 6 xonali kod (bepul, Brevo yoki Resend orqali).
 *   4. Buyurtma, sharh (faqat yetkazilgandan keyin), "Kelganda xabar qil", admin.
 *   5. Egasiga Telegramga xabar: ism, aloqa telefoni, tasdiqlangan telefon, email, Telegram havolasi.
 *
 *  MUHIT O'ZGARUVCHILARI (Render -> Environment). Hammasi ixtiyoriy, lekin BOT_TOKEN tavsiya etiladi:
 *    BOT_TOKEN        Telegram bot tokeni (BotFather)
 *    OWNER_CHAT_ID    buyurtma xabari boradigan chat ID (bir nechta bo'lsa vergul bilan: 123,456)
 *    ADMIN_KEY        admin.html uchun maxfiy parol (o'zingiz o'ylab toping, uzun bo'lsin)
 *    DATABASE_URL     PostgreSQL manzili (Neon/Supabase). BO'LMASA buyurtmalar bepul Render'da yo'qoladi!
 *    BREVO_API_KEY    email yuborish uchun (yoki RESEND_API_KEY)
 *    EMAIL_FROM       "Do'kon nomi <sizning@email.com>"  (Brevo'da tasdiqlangan manzil)
 *    PUBLIC_URL       sayt manzili (Render o'zi RENDER_EXTERNAL_URL beradi, odatda kerak emas)
 *    SECRET_KEY       tokenlarni imzolash uchun (bo'lmasa BOT_TOKEN'dan olinadi)
 *    EMAIL_DEV=1      SINOV uchun: kod ekranda ko'rinadi (haqiqiy ishlatishda O'CHIRING!)
 *    CORS_ORIGIN      sayt boshqa domenda bo'lsa o'sha manzil (standart: *)
 * ============================================================================
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

/* ============================ SOZLAMALAR ============================ */
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, process.env.DB_JSON || 'database.json');
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const OWNER_IDS = String(process.env.OWNER_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const SECRET = process.env.SECRET_KEY || (BOT_TOKEN ? crypto.createHash('sha256').update('shop-secret:' + BOT_TOKEN).digest('hex') : crypto.randomBytes(32).toString('hex'));
const PUBLIC_URL = String(process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
const EMAIL_DEV = process.env.EMAIL_DEV === '1';
const EMAIL_FROM = process.env.EMAIL_FROM || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
let BOT_USERNAME = process.env.BOT_USERNAME || '';
if (!process.env.SECRET_KEY && !BOT_TOKEN) console.warn("[OGOHLANTIRISH] SECRET_KEY ham, BOT_TOKEN ham yo'q: server qayta ishga tushsa hamma qayta kirishi kerak.");
if (!ADMIN_KEY) console.warn("[OGOHLANTIRISH] ADMIN_KEY o'rnatilmagan: admin sahifa ishlamaydi.");

/* ============================ SAQLASH: PostgreSQL yoki fayl ============================ */
// Hammasi bitta jadvalda: docs(col, id, owner, data). col = "users", "orders", "reviews", ...
function fileStore(file) {
  let d = {};
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
  const save = () => { fs.writeFileSync(file + '.tmp', JSON.stringify(d)); fs.renameSync(file + '.tmp', file); };
  return {
    kind: 'fayl',
    async get(col, id) { const r = (d[col] || {})[id]; return r ? r.data : null; },
    async put(col, id, data, owner) { (d[col] = d[col] || {})[id] = { owner: owner || null, data }; save(); },
    async list(col, owner) { return Object.values(d[col] || {}).filter(r => !owner || r.owner === owner).map(r => r.data); },
    async del(col, id) { if (d[col]) { delete d[col][id]; save(); } },
    async next(col) { d._seq = d._seq || {}; d._seq[col] = (d._seq[col] || 0) + 1; save(); return d._seq[col]; },
  };
}
function pgStore(url) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false }, max: 5 });
  const ready = pool.query(`create table if not exists docs(col text not null, id text not null, owner text, data jsonb not null, primary key(col,id));
    create index if not exists docs_owner on docs(col, owner);
    create table if not exists seq(col text primary key, n bigint not null);`);
  return {
    kind: 'PostgreSQL',
    ready,
    async get(col, id) { await ready; const r = await pool.query('select data from docs where col=$1 and id=$2', [col, id]); return r.rows[0] ? r.rows[0].data : null; },
    async put(col, id, data, owner) { await ready; await pool.query('insert into docs(col,id,owner,data) values($1,$2,$3,$4) on conflict(col,id) do update set data=excluded.data, owner=excluded.owner', [col, id, owner || null, data]); },
    async list(col, owner) { await ready; const r = owner ? await pool.query('select data from docs where col=$1 and owner=$2', [col, owner]) : await pool.query('select data from docs where col=$1', [col]); return r.rows.map(x => x.data); },
    async del(col, id) { await ready; await pool.query('delete from docs where col=$1 and id=$2', [col, id]); },
    async next(col) { await ready; const r = await pool.query('insert into seq(col,n) values($1,1) on conflict(col) do update set n=seq.n+1 returning n', [col]); return Number(r.rows[0].n); },
  };
}
const { AsyncLocalStorage } = require('async_hooks');
const TENANT_CTX = new AsyncLocalStorage();   // har so'rov qaysi do'konga tegishli ekanini shu yerda saqlaydi
const OWNER_KEY = process.env.OWNER_KEY || '';
const GLOBAL_COLS = new Set(['tenants', 'img', 'announcements', 'ownerchat', 'applications']);     // do'konlar ro'yxati hamma uchun umumiy
const tCol = (tid, col) => (tid === 'main' || GLOBAL_COLS.has(col)) ? col : 't_' + tid + '_' + col;
const currentTid = () => { const c = TENANT_CTX.getStore(); return c ? c.tid : 'main'; };
const currentTenant = () => { const c = TENANT_CTX.getStore(); return c ? c.tenant : null; };
const rawStore = process.env.DATABASE_URL ? pgStore(process.env.DATABASE_URL) : fileStore(path.join(ROOT, 'data.json'));
const store = {
  kind: rawStore.kind, ready: rawStore.ready,
  get: (c, i) => rawStore.get(tCol(currentTid(), c), i),
  put: (c, i, d, o) => rawStore.put(tCol(currentTid(), c), i, d, o),
  list: (c, o) => rawStore.list(tCol(currentTid(), c), o),
  del: (c, i) => rawStore.del(tCol(currentTid(), c), i),
  next: c => rawStore.next(tCol(currentTid(), c)),
};
if (store.kind === 'fayl') console.warn("[OGOHLANTIRISH] DATABASE_URL yo'q: buyurtmalar data.json faylida saqlanadi. Bepul Render qayta ishga tushganda bu fayl O'CHADI. Neon/Supabase ulang.");

/* ============================ database.json + qo'shimchalar ============================ */
let baseCache = { mtime: 0, data: null, sig: '' };
const EMPTY_CATALOG = () => ({ settings: { shop_name: 'Do\'kon', theme: 'light' }, categories: [], products: [], reviews: [], banners: [], stories: [], home_sections: [] });
let fileWarned = '';
function fileBase() {
  let st;
  try { st = fs.statSync(DB_FILE); } catch (e) {
    if (fileWarned !== 'missing') { fileWarned = 'missing'; console.error("[database.json] TOPILMADI (" + DB_FILE + "). Bo'sh katalog bilan ishlayapman. Faylni GitHub'ga asosiy ro'yxatga yuklang yoki admin paneldan mahsulot qo'shing."); }
    return baseCache.data || (baseCache = { mtime: 0, data: EMPTY_CATALOG(), sig: 'empty' }).data;
  }
  if (baseCache.mtime !== st.mtimeMs) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8').replace(/^\uFEFF/, ''); const j = JSON.parse(raw); // BOM (Windows/telefon muharrirlari qo'yadigan ko'rinmas belgi) olib tashlanadi
      if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error("fayl ob'ekt emas");
      delete j.orders; delete j.users; // eski fayldagi maxfiy bo'limlar saytga chiqmasin
      baseCache = { mtime: st.mtimeMs, data: j, sig: crypto.createHash('sha1').update(raw).digest('hex') }; fileWarned = '';
    } catch (e) {
      if (fileWarned !== 'bad:' + st.mtimeMs) { fileWarned = 'bad:' + st.mtimeMs; console.error("[database.json] O'QIB BO'LMADI: " + e.message + ". Fayl buzilgan (JSON xato). Avvalgi yoki bo'sh katalog bilan ishlayapman."); }
      if (!baseCache.data) baseCache = { mtime: 0, data: EMPTY_CATALOG(), sig: 'empty' };
      else baseCache.mtime = st.mtimeMs;
    }
  }
  return baseCache.data;
}
const TSTATE = new Map();
function tstate(tid) { let s = TSTATE.get(tid); if (!s) { s = { cat: null, sig: '', ver: 0, loaded: false, merged: { body: null, gz: null, etag: '', ts: 0, mtime: 0 } }; TSTATE.set(tid, s); } return s; }
const TC = () => tstate(currentTid());
// asosiy do'kon: database.json; yangi do'kon: bo'sh katalog (boshqa do'kon ma'lumoti ko'rinmasin)
function loadBase() { const s = TC(); if (s.cat) return s.cat; return currentTid() === 'main' ? fileBase() : EMPTY_CATALOG(); }
const baseKey = () => TC().cat ? 'c' + TC().ver : 'f' + baseCache.mtime;
async function loadTenantCatalog(tid) {
  const s = tstate(tid); if (s.loaded) return s; s.loaded = true;
  try { const r = await rawStore.get(tCol(tid, 'meta'), 'catalog'); if (r && r.cat) { s.cat = r.cat; s.sig = r.sig || ''; s.ver++; console.log('[Katalog] ' + tid + ': bazadan yuklandi'); } }
  catch (e) { console.error('[Katalog]', tid, e.message); }
  return s;
}
const catalogReady = (async () => {
  try { const a = await store.get('meta', 'admin_seen'); if (a && a.ts) adminSeen = Math.min(a.ts, Date.now()); } catch (e) {}
  await loadTenantCatalog('main');
})();
const vkey = (pid, color, size) => pid + '#' + (color == null ? '' : color) + '|' + (size == null ? '' : size);
// Mahsulotning "tanlanadigan xususiyatlari" (admin yaratadi: rang, o'lcham, voltaj, xotira...). Eski mahsulotlarda rang+o'lcham.
const axesOfP = p => (Array.isArray(p && p.options) ? p.options : []).filter(a => a && a.key && Array.isArray(a.values) && a.values.length);
// Ombor kaliti: xususiyat qiymatlari tartib bilan '|' orqali ulanadi (eski mahsulotda "rang|o'lcham")
const stockKey = (p, it) => {
  const ax = axesOfP(p); it = it || {};
  if (ax.length) { const sel = it.sel || {}; return ax.map(a => sel[a.key] == null ? '' : String(sel[a.key])).join('|'); }
  return (it.color != null ? it.color : '') + '|' + (it.size != null ? it.size : '');
};
async function soldMap() { return (await store.get('meta', 'sold')) || {}; }
function soldTotal(sold, pid) { let s = 0; const pre = pid + '#'; for (const k in sold) if (k.startsWith(pre)) s += sold[k]; return s; }
// Haqiqiy qoldiq = database.json dagi qoldiq - sotilgan
function effStock(p, sold, color, size, key) {
  if (p.variant_stock) { const k = key !== undefined ? key : (color == null ? '' : color) + '|' + (size == null ? '' : size); return Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); }
  return Math.max(0, (p.stock !== undefined ? Number(p.stock) : 10) - soldTotal(sold, p.id));
}
function effTotal(p, sold) {
  if (p.variant_stock) { let t = 0; for (const k in p.variant_stock) t += Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); return t; }
  return effStock(p, sold);
}
function bump() { TC().merged.ts = 0; }
// Sotuv hisobiga faqat admin tasdiqlagan (sotilgan) buyurtmalar kiradi; 'new' (tasdiqlanmagan) kirmaydi
const SOLD_STATUSES = ['confirmed', 'shipping', 'delivered'];
async function mergedDB() {
  const M = TC().merged;
  if (M.body && M.mtime === baseKey() && Date.now() - M.ts < 30000) return M;
  const base = loadBase(), sold = await soldMap();
  const orders = await store.list('orders'), since = Date.now() - 7 * 86400000, week = {};
  orders.forEach(o => { if (SOLD_STATUSES.includes(o.status) && new Date(o.created).getTime() >= since) (o.items || []).forEach(i => { week[i.product_id] = (week[i.product_id] || 0) + (i.qty || 0); }); });
  const archCats = new Set((base.categories || []).filter(c => c.archived).map(c => String(c.id)));
  const products = (base.products || []).filter(p => !p.archived && !archCats.has(String(p.category_id))).map(p => {
    const q = Object.assign({}, p);
    if (p.variant_stock) { q.variant_stock = {}; let tot = 0; for (const k in p.variant_stock) { const v = Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); q.variant_stock[k] = v; tot += v; } q.stock = tot; }
    else if (p.stock !== undefined) q.stock = effStock(p, sold);
    if (week[p.id]) q.sold_week = Math.max(Number(p.sold_week) || 0, week[p.id]);
    delete q.cost; delete q.note; delete q.archived; delete q.archived_at; // tan narx va ichki izohlar saytga chiqmaydi
    return q;
  });
  const reviews = (base.reviews || []).concat((await store.list('reviews')).map(r => { const q = Object.assign({}, r); delete q.uid; delete q.order_id; return q; }));
  const body = Buffer.from(JSON.stringify(Object.assign({}, base, {
    products, reviews, settings: Object.assign({}, base.settings || {}, { bot: BOT_USERNAME, admin_online: Date.now() - adminSeen < 150000 }),
    categories: (base.categories || []).filter(c => !c.archived).map(c => Object.assign({}, c, { subcats: (c.subcats || []).filter(x => !x.archived) })),
    banners: (base.banners || []).filter(b => !b.archived), stories: (base.stories || []).filter(x => !x.archived),
    home_sections: (base.home_sections || []).map(x => Object.assign({}, x, { product_ids: (x.product_ids || []).filter(id => products.some(p => p.id === id)) })),
  })));
  TC().merged = { body, gz: zlib.gzipSync(body), etag: '"' + crypto.createHash('sha1').update(body).digest('hex') + '"', ts: Date.now(), mtime: baseKey() };
  return TC().merged;
}

/* ============================ Yordamchilar ============================ */
class HttpError extends Error { constructor(status, msg, code) { super(msg); this.status = status; this.code = code; } }
const b64 = b => Buffer.from(b).toString('base64url');
function sign(obj) { const p = b64(JSON.stringify(obj)); return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url'); }
function unsign(tok) {
  try {
    const [p, s] = String(tok).split('.'); const good = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
    if (!s || s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
    const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? o : null;
  } catch (e) { return null; }
}
const safeEq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const digits = v => parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10) || 0;
const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const locName = (n, lang) => (n && typeof n === 'object') ? (n[lang] || n.uz || Object.values(n)[0] || '') : String(n || '');
function normPhone(v) { const d = String(v || '').replace(/\D/g, ''); if (d.length === 9) return '+998' + d; if (d.length >= 10 && d.length <= 15) return '+' + d; return ''; }
function normEmail(v) { const e = String(v || '').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120 ? e : ''; }
function readBody(req, limit) {
  return new Promise((res, rej) => {
    let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > limit) { rej(new HttpError(413, 'Juda katta')); req.destroy(); } else ch.push(c); });
    req.on('end', () => { try { res(ch.length ? JSON.parse(Buffer.concat(ch).toString()) : {}); } catch (e) { rej(new HttpError(400, "JSON noto'g'ri")); } });
    req.on('error', rej);
  });
}
function readRaw(req, limit) {
  return new Promise((res, rej) => {
    let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > limit) { rej(new HttpError(413, 'Fayl juda katta')); req.destroy(); } else ch.push(c); });
    req.on('end', () => res(Buffer.concat(ch))); req.on('error', rej);
  });
}
// Oddiy tezlik cheklovi (faqat kod so'rash/kirishga; BUYURTMAGA CHEKLOV YO'Q)
const hits = new Map();
function rate(key, max, ms) { const now = Date.now(); const a = (hits.get(key) || []).filter(t => now - t < ms); if (a.length >= max) throw new HttpError(429, "Juda ko'p so'rov. Biroz kuting"); a.push(now); hits.set(key, a); }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 3600000)) hits.delete(k); }, 600000).unref();
// Buyurtmalar bir-bir navbat bilan bajariladi (ikki kishi oxirgi mahsulotni bir vaqtda ololmasin)
let orderLock = Promise.resolve();
function withLock(fn) { const run = orderLock.then(fn, fn); orderLock = run.catch(() => {}); return run; }

/* ============================ Telegram ============================ */
// Har bir do'konning o'z boti bo'lishi mumkin (tenant.bot_token). Yo'q bo'lsa asosiy bot.
const botTok = () => { const t = currentTenant(); return (t && t.bot_token) || BOT_TOKEN; };
const ownerIdsNow = () => { const t = currentTenant(); return t && t.owner_chat ? [String(t.owner_chat)] : OWNER_IDS; };
const secretFor = tok => crypto.createHmac('sha256', SECRET).update('tg-webhook:' + tok).digest('hex').slice(0, 48);
const secretNow = () => { const t = currentTenant(); return t && t.bot_token ? secretFor(t.bot_token) : webhookSecret(); };
async function tgApiWith(tok, method, payload) {
  if (!tok) return null;
  try {
    const r = await fetch('https://api.telegram.org/bot' + tok + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
    const j = await r.json(); if (!j.ok) console.error('[Telegram ' + method + ']', j.description); return j;
  } catch (e) { console.error('[Telegram ' + method + ']', e.message); return null; }
}
const tgApi = (method, payload) => tgApiWith(botTok(), method, payload);
const webhookSecret = () => crypto.createHmac('sha256', SECRET).update('tg-webhook').digest('hex').slice(0, 48);
async function setupTelegram() {
  if (!botTok()) return { ok: false, error: 'BOT_TOKEN yoq' };
  const tn = currentTenant(); const slug = tn ? tn.slug : '';
  const me = await tgApi('getMe');
  if (me && me.ok) { if (tn) { tn.bot_username = me.result.username; await rawStore.put('tenants', tn.slug, tn).catch(() => {}); } else BOT_USERNAME = me.result.username; }
  if (!PUBLIC_URL) { console.warn("[Telegram] PUBLIC_URL/RENDER_EXTERNAL_URL yo'q: webhook o'rnatilmadi"); return { ok: false, error: 'PUBLIC_URL yoq' }; }
  const r = await tgApi('setWebhook', { url: PUBLIC_URL + '/api/tg/webhook' + (slug ? '?shop=' + slug : ''), secret_token: secretNow(), allowed_updates: ['message'], drop_pending_updates: false });
  // Bot menyusidagi tugma (chap pastda): brauzer emas, Telegram ilovasining ichida ochiladi
  const mb = await tgApi('setChatMenuButton', { menu_button: { type: 'web_app', text: "Do'kon", web_app: { url: shopUrl('index.html') } } });
  if (!mb || !mb.ok) console.error('[Telegram] menu button xato');
  console.log('[Telegram] bot: @' + BOT_USERNAME + ', webhook: ' + (r && r.ok ? 'OK' : 'XATO'));
  return { ok: !!(r && r.ok), bot: tn ? (tn.bot_username || '') : BOT_USERNAME };
}
function verifyInitData(initData, tok = botTok()) {
  if (!tok) throw new HttpError(503, 'BOT_TOKEN sozlanmagan');
  const p = new URLSearchParams(String(initData || '')); const hash = p.get('hash'); p.delete('hash');
  if (!hash) throw new HttpError(401, "Telegram ma'lumoti yo'q");
  const dcs = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(tok).digest();
  const good = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
  if (!safeEq(hash, good)) throw new HttpError(401, "Telegram imzosi noto'g'ri");
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 86400) throw new HttpError(401, 'Telegram sessiyasi eskirgan, ilovani qayta oching', 'stale');
  const u = JSON.parse(p.get('user') || '{}'); if (!u.id) throw new HttpError(401, 'Telegram foydalanuvchisi topilmadi');
  return u;
}
async function upsertTgUser(from, extra) {
  const id = 'tg:' + from.id; let u = await store.get('users', id);
  const full = [from.first_name, from.last_name].filter(Boolean).join(' ').slice(0, 40);
  if (!u) u = { id, kind: 'tg', tg: from.id, name: full, phone: '', phone_verified: false, email: '', created: new Date().toISOString() };
  u.username = from.username || ''; if (!u.name) u.name = full;
  if (extra) Object.assign(u, extra);
  await store.put('users', id, u); return u;
}
const T = {
  uz: {
    open: "Do'konni ochish", back: "Do'konga qaytish",
    hello: "Assalomu alaykum! Do'konimizga xush kelibsiz.",
    share: "Ushbu raqamingiz orqali ro'yxatdan o'tmoqchimisiz?",
    shareBtn: '📱 Raqamni ulashish',
    ok: "✅ Raqamingiz tasdiqlandi: {p}\nEndi do'konga qaytib buyurtmani davom ettiring.",
    other: "Iltimos, o'zingizning raqamingizni ulashing (pastdagi tugma orqali).",
    st: { confirmed: 'tasdiqlandi ✅', shipping: "yo'lda 🚚", delivered: 'yetkazildi 🎉', cancelled: 'bekor qilindi ❌', new: 'qabul qilindi' },
    order: 'Buyurtma №{n}: {s}', review: "Mahsulotni baholab, sharh qoldirsangiz xursand bo'lamiz.",
    back_in: "{n} yana omborda bor! 🎉",
  },
  ru: {
    open: 'Открыть магазин', back: 'Вернуться в магазин',
    hello: 'Здравствуйте! Добро пожаловать в наш магазин.',
    share: 'Зарегистрироваться по этому номеру?',
    shareBtn: '📱 Поделиться номером',
    ok: '✅ Ваш номер подтверждён: {p}\nТеперь вернитесь в магазин и продолжите заказ.',
    other: 'Пожалуйста, поделитесь своим номером (кнопка ниже).',
    st: { confirmed: 'подтверждён ✅', shipping: 'в пути 🚚', delivered: 'доставлен 🎉', cancelled: 'отменён ❌', new: 'принят' },
    order: 'Заказ №{n}: {s}', review: 'Будем рады, если вы оцените товар и оставите отзыв.',
    back_in: '{n} снова в наличии! 🎉',
  },
};
const tt = (lang, key, p) => { let s = (T[lang] || T.uz)[key]; if (typeof s === 'string' && p) for (const k in p) s = s.split('{' + k + '}').join(p[k]); return s; };
const shopUrl = p => PUBLIC_URL ? PUBLIC_URL + '/' + (p || 'index.html') + (currentTid() !== 'main' ? '?shop=' + currentTid() : '') : '';
const webBtn = (lang, page, label) => PUBLIC_URL ? { inline_keyboard: [[{ text: label || tt(lang, 'open'), web_app: { url: shopUrl(page) } }]] } : undefined;

// Telegram botiga kelgan xabarlar (webhook)
async function handleTgUpdate(upd) {
  const em = upd && upd.edited_message;
  if (em && em.from && em.chat.type === 'private') {   // mijoz botdagi xabarini tahrirladi: admin panelda eski/yangi matn qoladi
    const u = (await store.list('users')).find(x => x.kind === 'tg' && String(x.tg) === String(em.from.id)); if (!u) return;
    const th = await chatGet(u); const hit = th.msgs.find(x => x.from === 'u' && x.src === 'bot' && x.tg === em.message_id); const nt = String(em.text || em.caption || '').slice(0, 2000);
    if (hit && nt && nt !== hit.text) { (hit.hist = hit.hist || []).push({ t: hit.text || '', ts: Date.now() }); hit.text = nt; hit.edited = Date.now(); th.unread = (th.unread || 0) + 1; th.updated = new Date().toISOString(); await store.put('chat', u.id, th); }
    return;
  }
  const m = upd && upd.message; if (!m || !m.from || m.chat.type !== 'private') return;
  const lang = m.from.language_code === 'ru' ? 'ru' : 'uz';
  // /ariza <do'kon nomi>: sotuvchi do'kon ochish uchun ariza yuboradi (egasi tasdiqlaydi)
  if (m.text && /^\/ariza(@\w+)?\b/i.test(m.text.trim()) && PUBLIC_URL !== undefined) {
    const tid = String(m.from.id), chat = m.chat.id;
    const name = m.text.trim().replace(/^\/ariza(@\w+)?\s*/i, '').replace(/[\n\r]/g, ' ').trim().slice(0, 80);
    const tenants = await rawStore.list('tenants');
    if (tenants.some(t => String(t.admin_tg || '') === tid)) { await tgApi('sendMessage', { chat_id: chat, text: "Sizda do'kon allaqachon bor. Admin panel: /admin" }); return; }
    const apps = await rawStore.list('applications');
    if (apps.some(a => a.tg === tid && a.status === 'new')) { await tgApi('sendMessage', { chat_id: chat, text: "Arizangiz allaqachon yuborilgan. Egasi tasdiqlashini kuting." }); return; }
    if (!name) { await tgApi('sendMessage', { chat_id: chat, text: "Do'kon nomini yozing: /ariza Do'kon nomi" }); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await rawStore.put('applications', id, { id, tg: tid, username: m.from.username || '', first: m.from.first_name || '', name, status: 'new', created: new Date().toISOString() });
    const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    await tellOwners(`🆕 Yangi ariza: <b>${esc(name)}</b>\nTelegram: ${esc(m.from.first_name || '')} ${m.from.username ? '@' + esc(m.from.username) : ''} (${tid})`);
    await tgApi('sendMessage', { chat_id: chat, text: "Arizangiz qabul qilindi. Egasi tasdiqlagach, sizga xabar keladi." });
    return;
  }
  // /admin: sotuvchi admin paneliga o'tadi (Telegram orqali, parolsiz)
  if (m.text && /^\/admin(@\w+)?\b/i.test(m.text.trim()) && PUBLIC_URL) {
    const txt = lang === 'ru' ? 'Панель администратора: нажмите кнопку и войдите логином и паролем.' : "Admin panel: tugmani bosing va login hamda parol bilan kiring.";
    await tgApi('sendMessage', { chat_id: m.chat.id, text: txt, reply_markup: { inline_keyboard: [[{ text: lang === 'ru' ? 'Открыть админ-панель' : 'Admin panelni ochish', web_app: { url: PUBLIC_URL + '/admin.html' } }]] } });
    return;
  }
  if (m.contact) {
    if (m.contact.user_id !== m.from.id) { await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'other') }); return; }
    const phone = normPhone(m.contact.phone_number);
    await upsertTgUser(m.from, { phone, phone_verified: true, lang });
    await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'ok', { p: phone }), reply_markup: { remove_keyboard: true } });
    if (PUBLIC_URL) await tgApi('sendMessage', { chat_id: m.chat.id, text: '👇', reply_markup: webBtn(lang, 'cart.html', tt(lang, 'back')) });
    return;
  }
  const u = await upsertTgUser(m.from, { lang });
  if ((m.text && !m.text.startsWith('/')) || (!m.text && (m.caption || m.photo || m.document || m.voice))) { await chatIncoming(u, m, lang); return; }
  const open = webBtn(lang, 'index.html');
  await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'hello'), reply_markup: open });
  if (!u.phone_verified) await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'share'), reply_markup: { keyboard: [[{ text: tt(lang, 'shareBtn'), request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
}
/* ============================================================================
 *  CHAT (mijoz <-> admin). Ikki alohida kanal:
 *    src:'site' : saytdagi chat (Profil -> Sotuvchiga murojaat) <-> admin panel. Telegram botga HECH QACHON bormaydi.
 *    src:'bot'  : mijoz botga yozgan xabar. Admin panelda "Botdan" deb ko'rinadi, javob ham bot orqali ketadi
 *                 (Telegramda "reply" qilib: mijoz qaysi xabarga javob berilganini ko'radi).
 *  Xabar: {id, from:'u'|'a', src, text, ts, tg (telegram message_id), rt:{id,from,text} (javob berilgan xabar), read (o'qilgan vaqt)}
 * ============================================================================ */
function chatNorm(th) {
  th.msgs = th.msgs || []; let mx = 0;
  th.msgs.forEach((m, i) => { if (!m.id) m.id = i + 1; if (!m.src) m.src = 'bot'; mx = Math.max(mx, m.id); });
  th.seq = Math.max(th.seq || 0, mx); return th;
}
async function chatGet(u) { return chatNorm((await store.get('chat', u.id)) || { uid: u.id, tg: u.tg || null, msgs: [], unread: 0, seq: 0 }); }
function chatPush(th, m) { m.id = ++th.seq; m.ts = m.ts || Date.now(); th.msgs.push(m); if (th.msgs.length > 300) th.msgs = th.msgs.slice(-300); th.updated = new Date().toISOString(); return m; }
const quote = m => m ? { id: m.id, from: m.from, text: String(m.text || '').slice(0, 140) } : null;
// Mijozning botga yozgan xabari: admin panelning "Chat" bo'limiga ("Botdan" belgisi bilan) tushadi
async function chatIncoming(u, m, lang) {
  const th = await chatGet(u);
  const text = String(m.text || m.caption || (m.photo ? '[rasm]' : m.voice ? '[ovozli xabar]' : '[fayl]')).slice(0, 2000);
  const prev = th.msgs.length ? th.msgs[th.msgs.length - 1].ts : 0;
  let rt = null; const rp = m.reply_to_message;      // mijoz Telegramda biror xabarga "reply" qilgan
  if (rp) { const hit = th.msgs.find(x => x.tg && x.tg === rp.message_id); rt = hit ? quote(hit) : { id: 0, from: rp.from && rp.from.is_bot ? 'a' : 'u', text: String(rp.text || rp.caption || '[xabar]').slice(0, 140) }; }
  th.name = u.name; th.username = u.username || '';
  chatPush(th, { from: 'u', src: 'bot', text, tg: m.message_id, rt });
  th.unread = (th.unread || 0) + 1; await store.put('chat', u.id, th);
  u.seen = Date.now(); store.put('users', u.id, u).catch(() => {});
  tellOwners('💬 <b>' + escHtml(u.name || 'Mijoz') + '</b>' + (u.username ? ' @' + escHtml(u.username) : '') + ' (bot): ' + escHtml(text.slice(0, 300)) + '\n<i>Javob berish: admin panel → Chat</i>').catch(() => {});
  if (Date.now() - prev > 6 * 3600000) await tgApi('sendMessage', { chat_id: m.chat.id, text: lang === 'ru' ? 'Сообщение получено, скоро ответим.' : "Xabaringiz qabul qilindi, tez orada javob beramiz." });
}
async function tellOwners(html) { for (const id of ownerIdsNow()) await tgApi('sendMessage', { chat_id: id, text: html, parse_mode: 'HTML', disable_web_page_preview: true }); }
async function tellUser(u, text, page, label) {
  if (u && u.kind === 'tg') return tgApi('sendMessage', { chat_id: u.tg, text, reply_markup: webBtn(u.lang, page || 'index.html', label) });
  if (u && u.email) return sendEmail(u.email, text.split('\n')[0].slice(0, 80), '<p>' + escHtml(text).replace(/\n/g, '<br>') + '</p>').catch(() => {});
}

/* ============================ Email (Brevo yoki Resend) ============================ */
function parseFrom(s) { const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(s || ''); return m ? { name: m[1].replace(/^"|"$/g, '') || 'Shop', email: m[2] } : { name: 'Shop', email: String(s || '').trim() }; }
const emailEnabled = () => !!(EMAIL_FROM && (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY));
async function sendEmail(to, subject, html) {
  const from = parseFrom(EMAIL_FROM); let r;
  if (process.env.BREVO_API_KEY) r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ sender: from, to: [{ email: to }], subject, htmlContent: html }) });
  else if (process.env.RESEND_API_KEY) r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }) });
  else throw new Error('email sozlanmagan');
  if (!r.ok) { const t = await r.text().catch(() => ''); console.error('[Email xato]', r.status, t.slice(0, 200)); throw new HttpError(502, "Emailga yuborib bo'lmadi"); }
}

/* ============================ Kirish, foydalanuvchi ============================ */
async function authUser(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); const t = m && unsign(m[1]);
  const u = t && await store.get('users', t.uid); if (!u) throw new HttpError(401, 'Kirish kerak', 'auth');
  // "oxirgi online": har 45 soniyada bir marta yoziladi (bazani zo'riqtirmaslik uchun)
  if (!u.seen || Date.now() - u.seen > 45000) { u.seen = Date.now(); store.put('users', u.id, u).catch(() => {}); }
  return u;
}
const pubUser = u => ({ id: u.id, kind: u.kind, tg: u.tg || null, username: u.username || '', name: u.name || '', phone: u.phone || '', phone_verified: !!u.phone_verified, email: u.email || '', lang: u.lang || '' });
const tokenFor = u => sign({ uid: u.id, exp: Date.now() + 30 * 86400000 });
const adminFails = new Map();
let adminSeen = 0, adminSeenSaved = 0;
function touchAdmin() { adminSeen = Date.now(); if (adminSeen - adminSeenSaved > 120000) { adminSeenSaved = adminSeen; store.put('meta', 'admin_seen', { ts: adminSeen }).catch(() => {}); } }
function checkOwner(req) {
  if (!OWNER_KEY || !safeEq(req.headers['x-owner-key'] || '', OWNER_KEY)) throw new HttpError(401, "Egasi kaliti noto'g'ri");
}

// Do'konni aniqlash: ?shop=nom yoki x-shop sarlavhasi. Yo'q bo'lsa asosiy do'kon.
async function tenantRun(req, res, fn) {
  const url = new URL(req.url, 'http://x');
  const slug = String(req.headers['x-shop'] || url.searchParams.get('shop') || 'main').toLowerCase();
  if (slug === 'main') return TENANT_CTX.run({ tid: 'main', tenant: null }, () => fn(req, res));
  if (!/^[a-z0-9-]{3,30}$/.test(slug)) return sendJson(res, 404, { error: "Do'kon topilmadi" });
  const tn = await rawStore.get('tenants', slug);
  if (!tn) return sendJson(res, 404, { error: "Do'kon topilmadi" });
  await loadTenantCatalog(slug);
  if (url.pathname.startsWith('/api/') && (tn.frozen || (tn.paid_until && Date.parse(tn.paid_until) < Date.now()))) {
    return sendJson(res, 403, { error: "Do'kon vaqtincha to'xtatilgan. Egasi bilan bog'laning.", code: 'frozen' });
  }
  return TENANT_CTX.run({ tid: slug, tenant: tn }, () => fn(req, res));
}

function checkAdmin(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), now = Date.now();
  const a = (adminFails.get(ip) || []).filter(t => now - t < 600000);
  if (a.length >= 10) throw new HttpError(429, "Juda ko'p noto'g'ri urinish. 10 daqiqadan keyin qayta urining");
  const tn = currentTenant();
  const KEYV = tn ? tn.admin_key : ADMIN_KEY;
  const keyOk = !!KEYV && safeEq(req.headers['x-admin-key'] || '', KEYV);
  const tgOk = !keyOk && !!req.headers['x-tg-init'] && adminTgOk(req.headers['x-tg-init'], tn);
  if (!keyOk && !tgOk) { a.push(now); adminFails.set(ip, a); throw new HttpError(401, "Admin kaliti noto'g'ri"); }
  touchAdmin();
}
// Sotuvchi Telegram orqali kiradi: initData imzosi asosiy bot yoki do'kon boti bilan tekshiriladi va user ID si admin_tg ga teng bo'lishi kerak
function adminTgOk(initData, tn) {
  if (!tn || !tn.admin_tg) return false;
  for (const tok of [BOT_TOKEN, tn.bot_token].filter(Boolean)) {
    try { const u = verifyInitData(initData, tok); if (String(u.id) === String(tn.admin_tg)) return true; } catch (e) {}
  }
  return false;
}
// Sotuvchi lochin_partmer_bot dagi menyu tugmasi orqali admin paneliga kiradi
async function setSellerAdminMenu(tn) {
  if (!BOT_TOKEN || !tn.admin_tg || !PUBLIC_URL) return { ok: false };
  const r = await tgApiWith(BOT_TOKEN, 'setChatMenuButton', { chat_id: Number(tn.admin_tg) || tn.admin_tg, menu_button: { type: 'web_app', text: 'Admin', web_app: { url: PUBLIC_URL + '/admin.html?shop=' + tn.slug } } });
  return { ok: !!(r && r.ok) };
}
const STATUSES = ['new', 'confirmed', 'shipping', 'delivered', 'cancelled'];
async function isBanned(vals) { for (const v of vals) if (v && await store.get('bans', String(v).toLowerCase())) return true; return false; }

/* ============================ API ============================ */
const routes = {};
const route = (m, p, fn) => { routes[m + ' ' + p] = fn; };
// Egasi boshqaradigan funksiyalar (do'kon uchun yoqilgan/o'chirilgan)
const FEATURES = ['chat', 'stories', 'banners'];
const featOn = (tn, f) => !tn || !tn.features || tn.features[f] !== false;
const shopState = tn => ({ paid_until: tn.paid_until || null, frozen: !!tn.frozen, features: Object.fromEntries(FEATURES.map(f => [f, featOn(tn, f)])) });
route('POST', '/api/owner/tenant/update', async (req, body) => {
  checkOwner(req);
  const tn = await rawStore.get('tenants', String(body.slug || ''));
  if (!tn) throw new HttpError(404, "Do'kon topilmadi");
  if (body.name !== undefined) tn.name = String(body.name).slice(0, 80);
  if (body.frozen !== undefined) tn.frozen = !!body.frozen;
  if (body.paid_until !== undefined) tn.paid_until = body.paid_until ? String(body.paid_until) : null;
  if (body.admin_key) tn.admin_key = String(body.admin_key).trim().slice(0, 200);
  if (body.owner_chat !== undefined) tn.owner_chat = String(body.owner_chat || '').trim().slice(0, 40) || null;
  const newTok = body.bot_token !== undefined ? String(body.bot_token || '').trim() : null;
  if (newTok !== null) tn.bot_token = newTok || null;
  const newAdminTg = body.admin_tg !== undefined ? String(body.admin_tg || '').trim() : null;
  if (newAdminTg !== null) tn.admin_tg = newAdminTg || null;
  if (body.features && typeof body.features === 'object') { tn.features = tn.features || {}; for (const f of FEATURES) if (f in body.features) tn.features[f] = !!body.features[f]; }
  await rawStore.put('tenants', tn.slug, tn);
  let adminMenu = null;
  if (newAdminTg && PUBLIC_URL) { try { adminMenu = await setSellerAdminMenu(tn); } catch (e) { adminMenu = { ok: false }; } }
  let bot = null;
  if (newTok && PUBLIC_URL) { try { bot = await TENANT_CTX.run({ tid: tn.slug, tenant: tn }, () => setupTelegram()); } catch (e) { bot = { ok: false, error: e.message }; } }
  return { ok: true, slug: tn.slug, name: tn.name, admin_key: tn.admin_key, bot, adminMenu, ...shopState(tn) };
});
route('POST', '/api/owner/announce', async (req, body) => {
  checkOwner(req);
  const title = String(body.title || '').trim().slice(0, 120), text = String(body.text || '').trim().slice(0, 2000);
  if (!title && !text) throw bad('Matn kiriting');
  const to = body.to && body.to !== 'all' ? String(body.to) : 'all';
  if (to !== 'all' && !(await rawStore.get('tenants', to))) throw bad("Do'kon topilmadi");
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rec = { id, title, text, to, created: new Date().toISOString() };
  await rawStore.put('announcements', id, rec);
  return { ok: true, item: rec };
});
// Egasi <-> sotuvchi yozishmasi (har bir do'kon uchun alohida, umumiy kolleksiyada)
const threadOf = async slug => (await rawStore.list('ownerchat')).filter(m => m.slug === slug).sort((a, b) => (a.created < b.created ? -1 : 1)).slice(-200);
route('GET', '/api/owner/chat', async req => { checkOwner(req); const slug = String(new URL(req.url, 'http://x').searchParams.get('shop') || '').toLowerCase(); if (!slug) throw bad('Do\'kon tanlang'); return threadOf(slug); });
route('POST', '/api/owner/chat', async (req, body) => {
  checkOwner(req);
  const slug = String(body.slug || '').toLowerCase(), text = String(body.text || '').trim().slice(0, 2000);
  if (!text) throw bad('Matn kiriting');
  if (!(await rawStore.get('tenants', slug))) throw bad("Do'kon topilmadi");
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await rawStore.put('ownerchat', id, { id, slug, from: 'owner', text, created: new Date().toISOString(), read: false });
  return { ok: true, id };
});
route('GET', '/api/admin/owner-chat', async req => {
  checkAdmin(req);
  const slug = currentTid();
  const list = await threadOf(slug);
  // sotuvchi ochganda egasining xabarlari o'qilgan bo'ladi
  for (const m of list) if (m.from === 'owner' && !m.read) { m.read = true; rawStore.put('ownerchat', m.id, m).catch(() => {}); }
  return list;
});
route('POST', '/api/admin/owner-chat', async (req, body) => {
  checkAdmin(req);
  const text = String(body.text || '').trim().slice(0, 2000);
  if (!text) throw bad('Matn kiriting');
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await rawStore.put('ownerchat', id, { id, slug: currentTid(), from: 'seller', text, created: new Date().toISOString(), read: false });
  return { ok: true, id };
});
route('GET', '/api/owner/applications', async req => { checkOwner(req); return (await rawStore.list('applications')).sort((a, b) => (a.created < b.created ? 1 : -1)); });
route('POST', '/api/owner/applications/approve', async (req, body) => {
  checkOwner(req);
  const app = await rawStore.get('applications', String(body.id || ''));
  if (!app || app.status !== 'new') throw bad("Ariza topilmadi yoki allaqachon ko'rib chiqilgan");
  const slug = String(body.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,30}$/.test(slug) || slug === 'main') throw bad("Do'kon nomi (slug) noto'g'ri: 3-30 ta harf, raqam yoki tire");
  if (await rawStore.get('tenants', slug)) throw bad('Bu do\'kon nomi band');
  const tn = { slug, name: app.name, admin_key: randomBytes(16).toString('hex'), admin_tg: app.tg, paid_until: body.paid_until || null, frozen: false, created: new Date().toISOString() };
  await rawStore.put('tenants', slug, tn);
  const cat = EMPTY_CATALOG(); cat.settings.shop_name = tn.name;
  await rawStore.put(tCol(slug, 'meta'), 'catalog', { cat, sig: 'new', saved: new Date().toISOString() });
  app.status = 'approved'; app.slug = slug; app.decided = new Date().toISOString();
  await rawStore.put('applications', app.id, app);
  await tgApiWith(BOT_TOKEN, 'sendMessage', { chat_id: Number(app.tg), text: `✅ Do'koningiz tasdiqlandi: ${tn.name}. Admin panelga kirish uchun /admin deb yozing.` });
  return { ok: true, slug };
});
route('POST', '/api/owner/applications/reject', async (req, body) => {
  checkOwner(req);
  const app = await rawStore.get('applications', String(body.id || ''));
  if (!app || app.status !== 'new') throw bad("Ariza topilmadi yoki allaqachon ko'rib chiqilgan");
  app.status = 'rejected'; app.decided = new Date().toISOString();
  await rawStore.put('applications', app.id, app);
  await tgApiWith(BOT_TOKEN, 'sendMessage', { chat_id: Number(app.tg), text: "Afsuski, arizangiz rad etildi. Savollar bo'lsa egasi bilan bog'laning." });
  return { ok: true };
});
route('GET', '/api/owner/unread', async req => { checkOwner(req); const all = await rawStore.list('ownerchat'); const r = {}; for (const m of all) if (m.from === 'seller' && !m.read) r[m.slug] = (r[m.slug] || 0) + 1; return r; });
route('GET', '/api/owner/announcements', async req => { checkOwner(req); return (await rawStore.list('announcements')).sort((a, b) => (a.created < b.created ? 1 : -1)); });
route('GET', '/api/admin/shop', async req => {
  checkAdmin(req);
  const tid = currentTid(), tn = currentTenant() || { name: '' };
  const anns = (await rawStore.list('announcements')).filter(a => a.to === 'all' || a.to === tid).sort((a, b) => (a.created < b.created ? 1 : -1));
  return Object.assign({ name: tn.name || '', slug: tid }, currentTenant() ? shopState(tn) : { paid_until: null, frozen: false, features: Object.fromEntries(FEATURES.map(f => [f, true])) }, { announcements: anns.slice(0, 20) });
});


// Sayt shu manzil orqali serverni topadi (api/health javob bersa — server bor)
route('GET', '/api/health', async () => { const tn = currentTenant(); return { ok: true, telegram: !!botTok(), bot: (tn && tn.bot_username) || BOT_USERNAME, email: emailEnabled() || EMAIL_DEV, store: store.kind }; });

// --- Telegram ichida kirish (initData imzosi tekshiriladi) ---
route('POST', '/api/auth/telegram', async (req, body, ip) => {
  rate('tg:' + ip, 60, 60000);
  const tgu = verifyInitData(body.initData);
  const lang = body.lang === 'ru' ? 'ru' : 'uz';
  const u = await upsertTgUser(tgu, { lang });
  return { token: tokenFor(u), user: pubUser(u) };
});

// --- Brauzerda kirish: email + kod ---
route('POST', '/api/auth/email/request', async (req, body, ip) => {
  rate('er:' + ip, 15, 600000);
  const email = normEmail(body.email); if (!email) throw new HttpError(400, "Email noto'g'ri");
  if (!emailEnabled() && !EMAIL_DEV) throw new HttpError(503, 'Email xizmati sozlanmagan');
  const id = 'em:' + email, rec = (await store.get('codes', id)) || { sent: [] }, now = Date.now();
  rec.sent = rec.sent.filter(t => now - t < 3600000);
  if (rec.sent.length && now - rec.sent[rec.sent.length - 1] < 45000) throw new HttpError(429, "Kodni qayta so'rash uchun biroz kuting");
  if (rec.sent.length >= 6) throw new HttpError(429, "Juda ko'p urinish. Keyinroq qayta urinib ko'ring");
  const code = String(crypto.randomInt(100000, 1000000));
  rec.sent.push(now); rec.hash = crypto.createHash('sha256').update(SECRET + email + code).digest('hex'); rec.exp = now + 600000; rec.attempts = 0;
  await store.put('codes', id, rec);
  if (emailEnabled()) { await sendEmail(email, 'Tasdiqlash kodi: ' + code, '<p>Tasdiqlash kodingiz: <b style="font-size:22px;letter-spacing:3px">' + code + '</b></p><p>Kod 10 daqiqa amal qiladi. Agar siz so\'ramagan bo\'lsangiz, bu xatni e\'tiborsiz qoldiring.</p>'); return { ok: true, expires_in: 600 }; }
  return { ok: true, expires_in: 600, dev_code: code };
});
route('POST', '/api/auth/email/verify', async (req, body, ip) => {
  rate('ev:' + ip, 30, 600000);
  const email = normEmail(body.email), code = String(body.code || '').trim(); const id = 'em:' + email, rec = email && await store.get('codes', id);
  if (!rec || rec.exp < Date.now() || rec.attempts >= 5) throw new HttpError(400, "Kod eskirgan. Yangi kod so'rang", 'expired');
  const h = crypto.createHash('sha256').update(SECRET + email + code).digest('hex');
  if (!safeEq(h, rec.hash)) { rec.attempts++; await store.put('codes', id, rec); throw new HttpError(400, "Kod noto'g'ri", 'wrong'); }
  await store.del('codes', id);
  let u = await store.get('users', id); const name = String(body.name || '').trim().slice(0, 40);
  if (!u) u = { id, kind: 'email', email, name, phone: '', phone_verified: false, created: new Date().toISOString() }; else if (name && !u.name) u.name = name;
  u.lang = body.lang === 'ru' ? 'ru' : (u.lang || 'uz');
  await store.put('users', id, u); return { token: tokenFor(u), user: pubUser(u) };
});

route('GET', '/api/me', async req => pubUser(await authUser(req)));
route('PUT', '/api/me', async (req, body) => {
  const u = await authUser(req);
  if (body.name !== undefined) u.name = String(body.name || '').trim().slice(0, 40);
  if (body.lang) u.lang = body.lang === 'ru' ? 'ru' : 'uz';
  await store.put('users', u.id, u); return pubUser(u);
});
// Eski frontend bilan moslik: til har bir foydalanuvchida alohida saqlanadi (umumiy emas)
route('GET', '/api/profile', async req => { try { const u = await authUser(req); return { id: u.id, name: u.name, language: u.lang || 'uz' }; } catch (e) { return { id: 0, name: '', language: 'uz' }; } });
route('PUT', '/api/profile', async (req, body) => { try { const u = await authUser(req); if (body.language) { u.lang = body.language === 'ru' ? 'ru' : 'uz'; await store.put('users', u.id, u); } return { success: true, language: u.lang || 'uz' }; } catch (e) { return { success: true, language: body.language || 'uz' }; } });

// --- Buyurtmalar (CHEKLOV YO'Q) ---
// Xaritadan tanlangan joy: {lat, lng, label}. Noto'g'ri bo'lsa e'tiborsiz qoldiriladi
function cleanGeo(g) {
  if (!g || typeof g !== 'object') return null; const lat = Number(g.lat), lng = Number(g.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, label: String(g.label || '').slice(0, 200) };
}
route('GET', '/api/orders', async req => { const u = await authUser(req); return (await store.list('orders', u.id)).sort((a, b) => b.number - a.number); });
route('POST', '/api/orders', (req, body) => withLock(async () => {
  const u = await authUser(req);
  if (u.kind === 'tg' && !u.phone_verified) throw new HttpError(403, 'Avval telefon raqamingizni tasdiqlang', 'phone_not_verified');
  const contact = normPhone(body.phone || u.phone); if (!contact) throw new HttpError(400, "Aloqa uchun telefon raqamini kiriting", 'bad_phone');
  if (await isBanned([u.id, contact, u.phone, u.email])) throw new HttpError(403, "Buyurtma qabul qilib bo'lmaydi", 'banned');
  const cid = String(body.client_id || '').slice(0, 60);
  if (cid) { const old = await store.get('idem', u.id + ':' + cid); if (old) { const o = await store.get('orders', String(old.number)); if (o) return o; } }
  const raw = body.items;
  if (!Array.isArray(raw) || !raw.length || raw.length > 50) throw new HttpError(400, "Buyurtmada mahsulot yo'q");
  const base = loadBase(), prods = new Map((base.products || []).filter(p => !p.archived).map(p => [String(p.id), p])), sold = await soldMap();
  const lines = new Map();
  for (const it of raw) {
    const p = prods.get(String(it.product_id)), qty = parseInt(it.qty, 10) || 1;
    if (!p || qty < 1 || qty > 99) throw new HttpError(400, 'Mahsulot topilmadi');
    const ax = axesOfP(p); let sel = null;
    if (ax.length) {                                   // admin yaratgan xususiyatlar: har biri to'g'ri qiymat bo'lishi shart
      sel = {}; const src = (it.sel && typeof it.sel === 'object') ? it.sel : {};
      for (const a of ax) { const v = a.values.find(x => String(x.id) === String(src[a.key])); if (!v) throw new HttpError(400, 'Variant tanlanmagan: ' + locName(p.name, 'uz')); sel[a.key] = String(v.id); }
    }
    const probe = { sel, color: it.color, size: it.size }, k = stockKey(p, probe), lk = p.id + '#' + k;
    const cur = lines.get(lk) || { p, key: k, sel, color: it.color == null ? null : it.color, size: it.size == null ? null : it.size, qty: 0 }; cur.qty += qty; lines.set(lk, cur);
  }
  const items = []; let total = 0;
  for (const [lk, l] of lines) {
    const avail = effStock(l.p, sold, null, null, l.key);
    if (l.qty > avail) throw new HttpError(409, 'Omborda yetarli emas: ' + locName(l.p.name, 'uz') + ' (' + avail + ' ta qolgan)', 'stock');
  }
  for (const [lk, l] of lines) {
    sold[lk] = (sold[lk] || 0) + l.qty;
    const ax = axesOfP(l.p); const price = digits(l.p.price); total += price * l.qty;
    let image = (l.p.images || [''])[0], opts = null, col = null;
    if (ax.length) {
      opts = ax.map(a => { const v = a.values.find(x => String(x.id) === String(l.sel[a.key])); if (a.type === 'color' && v && v.images && v.images[0]) image = v.images[0]; return { name: a.name, value: v.name }; });
    } else { col = (l.p.colors || []).find(c => c.id === l.color); if (col && col.images && col.images[0]) image = col.images[0]; }
    items.push({ product_id: l.p.id, name: l.p.name, image, price, cost: digits(l.p.cost), color: l.color, color_name: col ? col.name : null, size: l.size, sel: l.sel || undefined, opts: opts || undefined, vk: l.key, qty: l.qty, reviewed: false });
  }
  const number = 1000 + await store.next('orders');
  const order = {
    id: number, number, status: 'new', created: new Date().toISOString(),
    name: String(body.name || u.name || '').trim().slice(0, 80), phone: contact,
    address: String(body.address || '').slice(0, 300), payment: (body.payment === 'click' && ((TC().cat || base || {}).settings || {}).pay_click && ((TC().cat || base || {}).settings || {}).pay_card) ? 'click' : 'cash', geo: cleanGeo(body.geo), comment: String(body.comment || '').slice(0, 300), items, total,
    user: { id: u.id, kind: u.kind, tg: u.tg || null, username: u.username || '', email: u.email || '', verified_phone: u.phone_verified ? u.phone : '' },
  };
  await store.put('orders', String(number), order, u.id); await store.put('meta', 'sold', sold);
  if (cid) await store.put('idem', u.id + ':' + cid, { number });
  bump();
  // Egasiga xabar
  const who = u.kind === 'tg' ? ('<a href="tg://user?id=' + u.tg + '">' + escHtml(u.name || 'Telegram') + '</a>' + (u.username ? ' @' + escHtml(u.username) : '') + ' (ID ' + u.tg + ')') : escHtml(u.email);
  tellOwners('🛒 <b>Yangi buyurtma №' + number + '</b>\n👤 ' + escHtml(order.name) + '\n📞 Aloqa: ' + escHtml(contact) +
    (u.phone_verified && u.phone !== contact ? '\n✅ Tasdiqlangan raqam: ' + escHtml(u.phone) : (u.phone_verified ? ' ✅' : '')) +
    (u.email ? '\n✉️ ' + escHtml(u.email) : '') + '\n💬 ' + who + '\n' + (order.payment === 'click' ? '💳 To\'lov: Click (kartaga o\'tkazadi)' : '💵 To\'lov: naqd') + '\n📍 ' + escHtml(order.address) + (order.geo ? '\n🗺 <a href="https://www.google.com/maps?q=' + order.geo.lat + ',' + order.geo.lng + '">Xaritada ko\'rish</a>' : '') + (order.comment ? '\n📝 ' + escHtml(order.comment) : '') + '\n\n' +
    items.map(i => '• ' + escHtml(locName(i.name, 'uz')) + (i.opts ? ', ' + i.opts.map(o => escHtml(locName(o.value, 'uz'))).join(', ') : (i.color_name ? ', ' + escHtml(locName(i.color_name, 'uz')) : '') + (i.size ? ', ' + escHtml(i.size) : '')) + ' × ' + i.qty).join('\n') +
    "\n\n💰 Jami: <b>" + total.toLocaleString('ru-RU') + " so'm</b>").catch(() => {});
  if (order.geo) ownerIdsNow().forEach(id => tgApi('sendLocation', { chat_id: id, latitude: order.geo.lat, longitude: order.geo.lng }).catch(() => {}));
  return order;
}));

// --- Sharh (faqat yetkazilgan buyurtma uchun) ---
route('POST', '/api/reviews', async (req, body) => {
  const u = await authUser(req); const order = await store.get('orders', String(body.order_id));
  if (!order || !order.user || order.user.id !== u.id || order.status !== 'delivered') throw new HttpError(403, 'Sharh faqat yetkazilgan buyurtma uchun');
  const it = order.items.find(i => String(i.product_id) === String(body.product_id) && !i.reviewed); if (!it) throw new HttpError(409, 'Bu mahsulotga sharh allaqachon qoldirilgan');
  const rating = parseInt(body.rating, 10); if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Baho 1 dan 5 gacha');
  const photos = (Array.isArray(body.photos) ? body.photos : []).slice(0, 3).filter(p => typeof p === 'string' && p.startsWith('data:image/') && p.length < 450000);
  const id = 'u' + await store.next('reviews');
  const r = { id, uid: u.id, order_id: order.number, product_id: it.product_id, name: body.anonymous ? null : (u.name || null), anon: !!body.anonymous, rating, text: String(body.text || '').slice(0, 600), date: new Date().toISOString().slice(0, 10), color: body.color == null ? null : body.color, size: body.size == null ? null : body.size, photos };
  if (it.opts) r.opts = it.opts;
  it.reviewed = true; await store.put('orders', String(order.number), order, u.id); await store.put('reviews', id, r, u.id); bump(); return pubReview(r);
});
const pubReview = r => { const q = Object.assign({}, r); delete q.uid; delete q.order_id; return q; };
// Mening sharhlarim (profil -> Sharhlarim)
route('GET', '/api/my-reviews', async req => { const u = await authUser(req); return (await store.list('reviews', u.id)).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id))); });
route('POST', '/api/reviews/edit', async (req, body) => {
  const u = await authUser(req); const r = await store.get('reviews', String(body.id));
  if (!r || r.uid !== u.id) throw new HttpError(404, 'Sharh topilmadi');
  const rating = parseInt(body.rating, 10); if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Baho 1 dan 5 gacha');
  r.rating = rating; r.text = String(body.text || '').slice(0, 600); r.anon = !!body.anonymous; r.name = r.anon ? null : (u.name || null); r.edited = new Date().toISOString().slice(0, 10);
  if (Array.isArray(body.photos)) r.photos = body.photos.slice(0, 3).filter(p => typeof p === 'string' && ((p.startsWith('data:image/') && p.length < 450000) || /^https?:\/\//.test(p) || p.startsWith('/img/')));
  await store.put('reviews', r.id, r, u.id); bump(); return pubReview(r);
});
route('POST', '/api/reviews/delete', async (req, body) => {
  const u = await authUser(req); const r = await store.get('reviews', String(body.id));
  if (!r || r.uid !== u.id) throw new HttpError(404, 'Sharh topilmadi');
  await store.del('reviews', r.id);
  const o = r.order_id && await store.get('orders', String(r.order_id));   // qaytadan sharh yozish imkoni qaytadi
  if (o && o.user && o.user.id === u.id) { const it = o.items.find(i => String(i.product_id) === String(r.product_id) && i.reviewed); if (it) { it.reviewed = false; await store.put('orders', String(o.number), o, u.id); } }
  bump(); return { ok: true };
});

// --- "Kelganda xabar qil" ---
route('POST', '/api/notify', async (req, body) => {
  const u = await authUser(req); const pid = String(body.product_id || ''); if (!pid) throw new HttpError(400, 'product_id kerak');
  const id = u.id + '|' + pid;
  if (body.off) await store.del('notify', id);
  else {
    const old = await store.get('notify', id);
    if (!old || old.status === 'notified') await store.put('notify', id, { id, uid: u.id, product_id: pid, created: new Date().toISOString(), status: 'pending', name: u.name || '', phone: u.phone || '', username: u.username || '', email: u.email || '', kind: u.kind, lang: u.lang || '' });
  }
  return { ok: true };
});
async function checkRestock() {
  try {
    const subs = await store.list('notify'); if (!subs.length) return;
    const base = loadBase(), sold = await soldMap(), prods = new Map((base.products || []).filter(p => !p.archived).map(p => [String(p.id), p]));
    for (const s of subs) {
      if (s.status === 'notified') continue;
      const p = prods.get(String(s.product_id)); if (!p || effTotal(p, sold) <= 0) continue;
      const u = await store.get('users', s.uid); s.status = 'notified'; s.notified_at = new Date().toISOString(); await store.put('notify', s.uid + '|' + s.product_id, s); if (!u) continue;
      await tellUser(u, tt(u.lang, 'back_in', { n: locName(p.name, u.lang || 'uz') }), 'product.html?id=' + encodeURIComponent(p.id), tt(u.lang, 'open'));
    }
  } catch (e) { console.error('[restock]', e.message); }
}

// --- Admin ---
route('GET', '/api/admin/orders', async req => { checkAdmin(req); return (await store.list('orders')).sort((a, b) => b.number - a.number).slice(0, 5000); });
route('PATCH', '/api/admin/orders', async (req, body) => {
  checkAdmin(req); const o = await store.get('orders', String(body.id)); if (!o) throw new HttpError(404, 'Buyurtma topilmadi');
  if (!STATUSES.includes(body.status)) throw new HttpError(400, 'status: ' + STATUSES.join(', '));
  if (o.status === 'cancelled') throw new HttpError(409, "Bekor qilingan buyurtmani o'zgartirib bo'lmaydi");
  if (o.status === body.status) return o;
  if (body.status === 'cancelled') { const sold = await soldMap(); o.items.forEach(i => { const k = i.product_id + '#' + (i.vk != null ? i.vk : (i.color == null ? '' : i.color) + '|' + (i.size == null ? '' : i.size)); sold[k] = Math.max(0, (sold[k] || 0) - i.qty); }); await store.put('meta', 'sold', sold); }
  o.status = body.status; await store.put('orders', String(o.number), o, o.user && o.user.id); bump();
  const u = o.user && await store.get('users', o.user.id);
  if (u && body.status !== 'new') tellUser(u, tt(u.lang, 'order', { n: o.number, s: tt(u.lang, 'st')[body.status] }) + (body.status === 'delivered' ? '\n' + tt(u.lang, 'review') : ''), body.status === 'delivered' ? 'profil.html#orders' : 'profil.html#orders', tt(u.lang, 'open')).catch(() => {});
  return o;
});
// Admin: kim qaysi mahsulot kelishini kutmoqda va unga xabar berildimi
route('GET', '/api/admin/notify', async req => {
  checkAdmin(req); const subs = await store.list('notify'); const base = ensureCatalog(), sold = await soldMap(), pm = new Map(base.products.map(p => [String(p.id), p]));
  return subs.map(x => { const p = pm.get(String(x.product_id)); return Object.assign({}, x, { product_name: p ? p.name : null, product_image: p ? ((p.images && p.images[0]) || '') : '', stock_now: p ? effTotal(p, sold) : 0, product_gone: !p || !!p.archived }); }).sort((a, b) => String(b.created).localeCompare(String(a.created)));
});
route('POST', '/api/admin/notify/remove', async (req, body) => { checkAdmin(req); await store.del('notify', String(body.id)); return { ok: true }; });
route('POST', '/api/admin/notify/send', async (req, body) => {   // qo'lda yuborish
  checkAdmin(req); const x = await store.get('notify', String(body.id)); if (!x) throw new HttpError(404, 'Topilmadi');
  const base = ensureCatalog(), p = base.products.find(q => String(q.id) === String(x.product_id)); const u = await store.get('users', x.uid); if (!p || !u) throw bad("Mahsulot yoki mijoz topilmadi");
  await tellUser(u, tt(u.lang, 'back_in', { n: locName(p.name, u.lang || 'uz') }), 'product.html?id=' + encodeURIComponent(p.id), tt(u.lang, 'open'));
  x.status = 'notified'; x.notified_at = new Date().toISOString(); await store.put('notify', x.id, x); return { ok: true };
});
route('GET', '/api/admin/bans', async req => { checkAdmin(req); return await store.list('bans'); });
route('POST', '/api/admin/ban', async (req, body) => {
  checkAdmin(req); const v = String(body.value || '').trim().toLowerCase(); if (!v) throw new HttpError(400, 'value kerak');
  if (body.banned === false) await store.del('bans', v); else await store.put('bans', v, { value: v, note: String(body.note || '').slice(0, 100), date: new Date().toISOString() });
  return { ok: true };
});
route('POST', '/api/admin/reset-sold', async req => { checkAdmin(req); await store.put('meta', 'sold', {}); const C = ensureCatalog(); C.settings = Object.assign({}, C.settings || {}, { sales_reset: new Date().toISOString() }); await saveCatalog(); bump(); return { ok: true }; });
route('POST', '/api/admin/telegram-setup', async req => { checkAdmin(req); return await setupTelegram(); });

/* ============================================================================
 *  ADMIN API: katalog (mahsulot, kategoriya, banner, storis, aksiya), ombor, rasm, foydalanuvchi, chat
 *  Hammasi X-Admin-Key bilan himoyalangan. Katalog o'zgarsa SAYT HAM O'ZGARADI (sayt shu katalogdan o'qiydi).
 * ============================================================================ */
const S = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
// Ikki tilli matn: admin faqat bittasini kiritsa, ikkinchisi shu bilan to'ldiriladi (sayt har doim matn ko'rsatadi)
const L = (v, n) => { const o = (v && typeof v === 'object') ? v : { uz: v }; const uz = S(o.uz, n), ru = S(o.ru, n); return { uz: uz || ru, ru: ru || uz }; };
const urlOk = u => typeof u === 'string' && u.length < 700000 && (/^https?:\/\//i.test(u) || u.startsWith('/img/') || /^data:(image|video)\//.test(u));
const nextId = arr => arr.reduce((m, x) => Math.max(m, Number(x && x.id) || 0), 0) + 1;
const fmtMoney = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, ' ') + " so'm";
const isoOrEmpty = v => { if (!v) return ''; const t = Date.parse(String(v)); return isNaN(t) ? '' : new Date(t).toISOString(); };

function ensureCatalog() {
  if (!TC().cat) { TC().cat = JSON.parse(JSON.stringify(loadBase())); TC().sig = currentTid() === 'main' ? baseCache.sig : 'new'; }
  ['categories', 'products', 'banners', 'stories', 'home_sections', 'reviews'].forEach(k => { if (!Array.isArray(TC().cat[k])) TC().cat[k] = []; });
  if (!TC().cat.settings || typeof TC().cat.settings !== 'object') TC().cat.settings = {};
  return TC().cat;
}
async function saveCatalog() { TC().ver++; await store.put('meta', 'catalog', { cat: TC().cat, sig: TC().sig, saved: new Date().toISOString() }); bump(); }
const bad = m => new HttpError(400, m);

/* ---- Mahsulot ---- */
async function saveProduct(C, inp) {
  const old = inp.id ? C.products.find(p => String(p.id) === String(inp.id)) : null;
  if (inp.id && !old) throw new HttpError(404, 'Mahsulot topilmadi');
  const p = old || { id: Math.max(nextId(C.products), (Number(C.next_product_id) || 0) + 1) };
  if (!old) C.next_product_id = p.id; // o'chirilgan mahsulot raqami qayta ishlatilmasin (sotuv hisobi aralashmasligi uchun)
  const name = L(inp.name, 120); if (!name.uz) throw bad('Mahsulot nomini kiriting');
  const price = digits(inp.price); if (!price) throw bad('Narxini kiriting');
  const cat = C.categories.find(c => String(c.id) === String(inp.category_id)); if (!cat) throw bad('Kategoriyani tanlang');
  p.name = name; p.price = fmtMoney(price);
  const op = digits(inp.oldPrice);
  if (op > price) { p.oldPrice = fmtMoney(op); p.discount = '-' + Math.round((op - price) / op * 100) + '%'; } else { delete p.oldPrice; delete p.discount; }
  p.cost = digits(inp.cost);
  p.category_id = cat.id;
  const sub = inp.subcat && (inp.subcat.uz || inp.subcat.ru) ? L(inp.subcat, 80) : null; if (sub) p.subcat = sub; else delete p.subcat;
  p.images = (Array.isArray(inp.images) ? inp.images : []).filter(urlOk).slice(0, 12);
  // --- Admin yaratgan xususiyatlar (rang, o'lcham, voltaj...) ---
  const optsIn = Array.isArray(inp.options) ? inp.options : null;
  if (optsIn) {
    const axes = [], akeys = new Set();
    optsIn.slice(0, 6).forEach((a, ai) => {
      const an = L(a && a.name, 40); if (!an.uz) return; const type = a.type === 'color' ? 'color' : 'text';
      let key = S(a.key, 30).replace(/[^a-zA-Z0-9_-]/g, '') || (type === 'color' ? 'color' : 'o' + (ai + 1)); while (akeys.has(key)) key += '_'; akeys.add(key);
      const vals = [], vk = new Set();
      (Array.isArray(a.values) ? a.values : []).slice(0, 60).forEach((v, vi) => {
        const vn = L(v && v.name, 40); if (!vn.uz) return;
        let id = S(v.id, 30).replace(/[^a-zA-Z0-9_.-]/g, '') || (vn.uz.replace(/['`ʻʼ‘’]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || ('v' + (vi + 1))); while (vk.has(id)) id += '_'; vk.add(id);
        const o = { id, name: vn }; if (type === 'color') { o.hex = /^#[0-9a-f]{6}$/i.test((v && v.hex) || '') ? v.hex : '#999999'; o.images = (Array.isArray(v.images) ? v.images : []).filter(urlOk).slice(0, 10); }
        vals.push(o);
      });
      if (vals.length) axes.push({ key, name: an, type, values: vals });
    });
    if (axes.length) { p.options = axes; delete p.colors; delete p.sizes; } else delete p.options;
  }
  if (Array.isArray(inp.attrs)) {    // oddiy xususiyatlar jadvali: "Material — Paxta", "Kafolat — 12 oy"
    const at = inp.attrs.slice(0, 30).map(x => ({ name: L(x && x.name, 40), value: L(x && x.value, 120) })).filter(x => x.name.uz && x.value.uz);
    if (at.length) p.attrs = at; else delete p.attrs; delete p.material; delete p.country; delete p.season;
  }
  const colors = []; const seen = new Set();
  if (!p.options) (Array.isArray(inp.colors) ? inp.colors : []).slice(0, 20).forEach((c, i) => {
    const nm = L(c && c.name, 40); if (!nm.uz) return;
    let id = S(c.id, 30).replace(/[^a-zA-Z0-9_-]/g, '') || ('c' + (i + 1)); while (seen.has(id)) id += '_'; seen.add(id);
    colors.push({ id, name: nm, hex: /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '#999999', images: (Array.isArray(c.images) ? c.images : []).filter(urlOk).slice(0, 10) });
  });
  if (!p.options) {
    if (colors.length) p.colors = colors; else delete p.colors;
    const sizes = (Array.isArray(inp.sizes) ? inp.sizes : []).map(x => S(x, 20)).filter(Boolean).slice(0, 30); if (sizes.length) p.sizes = sizes; else delete p.sizes;
  }
  if (!Array.isArray(inp.attrs)) ['material', 'country', 'season'].forEach(k => { const v = inp[k] && L(inp[k], 60); if (v && v.uz) p[k] = v; else delete p[k]; });
  const d = L(inp.description, 3000); if (d.uz) p.description = d; else delete p.description;
  p.badgeType = S(inp.badgeType, 20) || p.badgeType || 'original';
  if (inp.sold_week !== undefined) p.sold_week = digits(inp.sold_week);
  p.note = S(inp.note, 300); if (!p.note) delete p.note;
  // Omborga yozilgan son = HOZIRGI qoldiq (sotilganlar hisobga olinadi)
  const sold = await soldMap();
  const vs = inp.variant_stock && typeof inp.variant_stock === 'object' ? Object.keys(inp.variant_stock) : [];
  if (vs.length) { p.variant_stock = {}; vs.slice(0, 400).forEach(k => { p.variant_stock[k] = digits(inp.variant_stock[k]) + (sold[p.id + '#' + k] || 0); }); delete p.stock; }
  else { p.stock = digits(inp.stock) + soldTotal(sold, p.id); delete p.variant_stock; }
  if (!old) { p.created = new Date().toISOString(); C.products.unshift(p); }
  return p;
}
function effProduct(p, sold) { // adminga: HOZIRGI qoldiq bilan
  const q = Object.assign({}, p);
  if (p.variant_stock) { q.variant_stock = {}; let t = 0; for (const k in p.variant_stock) { const v = Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); q.variant_stock[k] = v; t += v; } q.stock = t; }
  else q.stock = effStock(p, sold);
  return q;
}

/* ---- Kategoriya + ichki kategoriyalar ---- */
function saveCategory(C, inp) {
  const old = inp.id ? C.categories.find(c => String(c.id) === String(inp.id)) : null;
  if (inp.id && !old) throw new HttpError(404, 'Kategoriya topilmadi');
  const c = old || { id: nextId(C.categories), order: C.categories.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1, subcats: [] };
  const name = L(inp.name, 60); if (!name.uz) throw bad('Kategoriya nomini kiriting');
  c.name = name; if (inp.img !== undefined) { if (urlOk(inp.img)) c.img = inp.img; else delete c.img; }
  let maxSub = 0; C.categories.forEach(x => (x.subcats || []).forEach(s => { maxSub = Math.max(maxSub, Number(s.id) || 0); }));
  const oldSubs = new Map((c.subcats || []).map(s => [String(s.id), s]));
  const subs = [];
  (Array.isArray(inp.subcats) ? inp.subcats : []).slice(0, 60).forEach(s => {
    const nm = L(s && s.name, 60); if (!nm.uz) return;
    const o = s.id ? oldSubs.get(String(s.id)) : null; const id = o ? o.id : ++maxSub;
    const item = { id, name: nm }; if (urlOk(s.img)) item.img = s.img; if (s.archived) item.archived = true;
    if (o) { oldSubs.delete(String(o.id)); if (o.name.uz !== nm.uz) { C.products.forEach(p => { if (String(p.category_id) === String(c.id) && p.subcat && p.subcat.uz === o.name.uz) p.subcat = nm; }); C.banners.forEach(b => { if (b.subcat === o.name.uz) b.subcat = nm.uz; }); } }
    subs.push(item);
  });
  // o'chirilgan ichki kategoriya: mahsulotlardan ham olib tashlanadi
  oldSubs.forEach(o => { C.products.forEach(p => { if (String(p.category_id) === String(c.id) && p.subcat && p.subcat.uz === o.name.uz) delete p.subcat; }); });
  c.subcats = subs;
  if (!old) C.categories.push(c);
  return c;
}

/* ---- Banner, storis, aksiya, sozlama ---- */
function saveBanner(C, inp) {
  const old = inp.id ? C.banners.find(b => String(b.id) === String(inp.id)) : null;
  const b = old || { id: 'b' + crypto.randomBytes(5).toString('hex') };
  if (!urlOk(inp.img)) throw bad('Banner rasmini yuklang');
  b.img = inp.img; if (urlOk(inp.img_ru)) b.img_ru = inp.img_ru; else delete b.img_ru; delete b.category_id; delete b.subcat; delete b.product_id;
  if (inp.product_id) b.product_id = Number(inp.product_id) || inp.product_id;
  else if (inp.category_id) { b.category_id = Number(inp.category_id); if (inp.subcat) b.subcat = S(inp.subcat, 80); }
  b.start_at = isoOrEmpty(inp.start_at); b.end_at = isoOrEmpty(inp.end_at); if (!b.start_at) delete b.start_at; if (!b.end_at) delete b.end_at;
  if (!old) C.banners.push(b);
  return b;
}
function saveStory(C, inp) {
  const old = inp.id ? C.stories.find(x => String(x.id) === String(inp.id)) : null;
  const st = old || { id: nextId(C.stories), created: new Date().toISOString() };
  if (!urlOk(inp.media)) throw bad('Storis rasmi yoki videosini kiriting');
  st.media = inp.media; st.type = inp.type === 'video' ? 'video' : 'image'; st.title = L(inp.title, 40);
  if (inp.product_id) st.product_id = Number(inp.product_id) || inp.product_id; else delete st.product_id;
  st.start_at = isoOrEmpty(inp.start_at); st.expires_at = isoOrEmpty(inp.expires_at); if (!st.start_at) delete st.start_at; if (!st.expires_at) delete st.expires_at;
  if (!old) C.stories.unshift(st);
  return st;
}
function saveSection(C, inp) {
  let s = C.home_sections.find(x => x.id === 'weekly_discounts');
  if (!s) { s = { id: 'weekly_discounts' }; C.home_sections.push(s); }
  s.enabled = !!inp.enabled; s.title = L(inp.title, 60); if (!s.title.uz) s.title = { uz: 'Hafta aksiyalari', ru: 'Акции недели' };
  s.product_ids = [...new Set((Array.isArray(inp.product_ids) ? inp.product_ids : []).map(Number).filter(n => C.products.some(p => p.id === n)))].slice(0, 40);
  const te = isoOrEmpty(inp.timer_end); if (te) s.timer_end = te; else delete s.timer_end;
  return s;
}
function saveSettings(C, inp) {
  ['shop_name', 'phone', 'address', 'work_hours', 'tg_username', 'instagram', 'business_type'].forEach(k => { if (inp[k] !== undefined) C.settings[k] = S(inp[k], 120); });
  if (inp.theme === 'light' || inp.theme === 'dark') C.settings.theme = inp.theme;
  if (inp.pay_cash !== undefined) C.settings.pay_cash = !!inp.pay_cash;
  if (inp.pay_click !== undefined) C.settings.pay_click = !!inp.pay_click;
  ['pay_card', 'pay_holder', 'pay_note'].forEach(k => { if (inp[k] !== undefined) C.settings[k] = S(inp[k], 160); });
  if (C.settings.pay_cash === false && !C.settings.pay_click) C.settings.pay_cash = true;
  return C.settings;
}

route('GET', '/api/admin/counts', async req => {
  checkAdmin(req); const o = await store.list('orders'), c = await store.list('chat');
  const nf = await store.list('notify'); return { new_orders: o.filter(x => x.status === 'new').length, unread: c.reduce((s, t) => s + (t.unread || 0), 0), notify: nf.filter(x => x.status !== 'notified').length };
});
route('GET', '/api/admin/catalog', async req => {
  checkAdmin(req); const C = ensureCatalog(); const sold = await soldMap();
  let fileChanged = false; try { fileBase(); fileChanged = !!TC().sig && baseCache.sig !== TC().sig; } catch (e) {}
  return { categories: C.categories, products: C.products.map(p => effProduct(p, sold)), banners: C.banners, stories: C.stories, home_sections: C.home_sections, settings: C.settings, file_changed: fileChanged, store: store.kind, from_store: !!TC().cat };
});
route('POST', '/api/admin/save', (req, body) => withLock(async () => {
  checkAdmin(req); const C = ensureCatalog(); const t = body.type, inp = body.item || {}; let out;
  if ((t === 'story' && !featOn(currentTenant(), 'stories')) || (t === 'banner' && !featOn(currentTenant(), 'banners'))) throw new HttpError(403, "Bu funksiya egasi tomonidan o'chirilgan", 'feature_off');
  if (t === 'product') out = await saveProduct(C, inp);
  else if (t === 'category') out = saveCategory(C, inp);
  else if (t === 'banner') out = saveBanner(C, inp);
  else if (t === 'story') out = saveStory(C, inp);
  else if (t === 'section') out = saveSection(C, inp);
  else if (t === 'settings') out = saveSettings(C, inp);
  else throw bad("noma'lum tur");
  await saveCatalog(); return { ok: true, item: out };
}));
const LISTS = { product: 'products', category: 'categories', banner: 'banners', story: 'stories' };
route('POST', '/api/admin/archive', (req, body) => withLock(async () => {
  checkAdmin(req); const C = ensureCatalog(); const key = LISTS[body.type]; if (!key) throw bad('tur?');
  let it = C[key].find(x => String(x.id) === String(body.id)); let sub = null;
  if (!it && body.type === 'category' && body.sub_of) { const c = C.categories.find(x => String(x.id) === String(body.sub_of)); sub = c && (c.subcats || []).find(s => String(s.id) === String(body.id)); it = sub; }
  if (!it) throw new HttpError(404, 'Topilmadi');
  if (body.archived === false) { delete it.archived; delete it.archived_at; } else { it.archived = true; it.archived_at = new Date().toISOString(); }
  await saveCatalog(); return { ok: true };
}));
route('POST', '/api/admin/remove', (req, body) => withLock(async () => {
  checkAdmin(req); const C = ensureCatalog(); const key = LISTS[body.type]; if (!key) throw bad('tur?'); const id = String(body.id);
  const idx = C[key].findIndex(x => String(x.id) === id); if (idx < 0) throw new HttpError(404, 'Topilmadi');
  if (body.type === 'category' && C.products.some(p => String(p.category_id) === id)) throw new HttpError(409, "Bu kategoriyada mahsulotlar bor. Avval mahsulotlarni boshqa kategoriyaga ko'chiring, o'chiring yoki kategoriyani ARXIVLANG.");
  const removed = C[key].splice(idx, 1)[0];
  if (body.type === 'product') {
    C.next_product_id = Math.max(Number(C.next_product_id) || 0, Number(removed.id) || 0);
    const sd = await soldMap(), pre = removed.id + '#'; let ch = false; for (const k of Object.keys(sd)) if (k.startsWith(pre)) { delete sd[k]; ch = true; } if (ch) await store.put('meta', 'sold', sd);
    C.home_sections.forEach(s => { s.product_ids = (s.product_ids || []).filter(x => String(x) !== id); });
    C.stories.forEach(s => { if (String(s.product_id) === id) delete s.product_id; });
    C.banners.forEach(b => { if (String(b.product_id) === id) delete b.product_id; });
  }
  await saveCatalog(); return { ok: true };
}));
route('POST', '/api/admin/reorder', (req, body) => withLock(async () => {
  checkAdmin(req); const C = ensureCatalog(); const key = LISTS[body.type]; if (!key) throw bad('tur?');
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(String); const map = new Map(C[key].map(x => [String(x.id), x]));
  const out = ids.map(i => map.get(i)).filter(Boolean); C[key].forEach(x => { if (!ids.includes(String(x.id))) out.push(x); });
  C[key] = out; if (body.type === 'category') C.categories.forEach((c, i) => { c.order = i + 1; });
  await saveCatalog(); return { ok: true };
}));

/* ---- Ombor: tez o'zgartirish (qoldiqni belgilash yoki qo'shish) + tarix ---- */
route('POST', '/api/admin/stock', (req, body) => withLock(async () => {
  checkAdmin(req); const C = ensureCatalog(); const p = C.products.find(x => String(x.id) === String(body.id)); if (!p) throw new HttpError(404, 'Mahsulot topilmadi');
  if (body.mode === 'cost') { p.cost = digits(body.cost); await saveCatalog(); return { ok: true }; }
  const sold = await soldMap(); const val = Math.max(0, parseInt(body.value, 10) || 0); const key = body.variant == null ? null : String(body.variant);
  let before, after;
  if (key !== null) {
    if (!p.variant_stock) throw bad("Bu mahsulotda rang/o'lcham bo'yicha qoldiq yo'q");
    const s = sold[p.id + '#' + key] || 0; before = Math.max(0, (Number(p.variant_stock[key]) || 0) - s); after = body.mode === 'add' ? Math.max(0, before + val * (body.sign === -1 ? -1 : 1)) : val;
    p.variant_stock[key] = after + s;
  } else {
    if (p.variant_stock) throw bad("Bu mahsulotda qoldiq rang/o'lcham bo'yicha");
    const s = soldTotal(sold, p.id); before = effStock(p, sold); after = body.mode === 'add' ? Math.max(0, before + val * (body.sign === -1 ? -1 : 1)) : val; p.stock = after + s;
  }
  if (body.cost !== undefined && body.cost !== null && body.cost !== '') p.cost = digits(body.cost);
  const lid = Date.now() + '-' + crypto.randomBytes(2).toString('hex');
  await store.put('stocklog', lid, { id: lid, ts: new Date().toISOString(), product_id: p.id, name: p.name, variant: key, before, after, note: S(body.note, 100) });
  await saveCatalog(); return { ok: true, before, after };
}));
route('GET', '/api/admin/stocklog', async req => { checkAdmin(req); return (await store.list('stocklog')).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 300); });

/* ---- Rasm yuklash (brauzerda siqilgan JPEG/WEBP/PNG) ---- */
route('POST', '/api/admin/upload', async (req, body) => {
  checkAdmin(req); const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
  if (!m) throw bad("Faqat rasm (jpg, png, webp) yuklash mumkin"); if (m[2].length > 3400000) throw bad('Rasm juda katta (brauzer avtomatik kichraytiradi, qayta urinib ko\'ring)');
  const id = crypto.randomBytes(8).toString('hex'); await store.put('img', id, { type: m[1], b64: m[2] });
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]; const base = PUBLIC_URL || (proto + '://' + req.headers.host);
  return { url: base + '/img/' + id + '.' + (m[1].split('/')[1].replace('jpeg', 'jpg')) };
});

// Video (galereyadan). Agar CLOUDINARY_CLOUD_NAME va CLOUDINARY_UPLOAD_PRESET berilsa, admin panel to'g'ridan-to'g'ri Cloudinary'ga yuklaydi (tavsiya).
// Aks holda shu yerda saqlanadi (kichik videolar uchun: 15 MB gacha).
const VIDEO_MAX = 15 * 1024 * 1024;
route('GET', '/api/admin/upload-config', async req => { checkAdmin(req); return { cloud: process.env.CLOUDINARY_CLOUD_NAME || '', preset: process.env.CLOUDINARY_UPLOAD_PRESET || '', video_max: VIDEO_MAX }; });
route('POST', '/api/admin/upload-video', async (req, buf) => {
  checkAdmin(req); const mime = String(req.headers['x-mime'] || req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!/^video\/(mp4|webm|quicktime)$/.test(mime)) throw bad("Faqat video (mp4, webm, mov) yuklash mumkin");
  if (!Buffer.isBuffer(buf) || !buf.length) throw bad('Video fayl bo\'sh'); if (buf.length > VIDEO_MAX) throw bad("Video juda katta (" + Math.round(buf.length / 1048576) + " MB). Server uchun 15 MB gacha. Kattaroq video uchun Cloudinary ulang.");
  const id = crypto.randomBytes(8).toString('hex'); await store.put('img', id, { type: mime === 'video/quicktime' ? 'video/mp4' : mime, b64: buf.toString('base64'), size: buf.length });
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]; const base = PUBLIC_URL || (proto + '://' + req.headers.host);
  return { url: base + '/img/' + id + '.' + (mime === 'video/webm' ? 'webm' : 'mp4') };
});

/* ---- Zaxira nusxa / tiklash ---- */
route('GET', '/api/admin/export', async req => { checkAdmin(req); return ensureCatalog(); });
route('POST', '/api/admin/import', (req, body) => withLock(async () => {
  checkAdmin(req); const c = body.catalog; if (!c || !Array.isArray(c.products) || !Array.isArray(c.categories)) throw bad("Zaxira fayli noto'g'ri (products va categories kerak)");
  TC().cat = c; ensureCatalog(); await saveCatalog(); return { ok: true, products: TC().cat.products.length };
}));
route('POST', '/api/admin/restore-file', (req) => withLock(async () => {
  checkAdmin(req); await store.del('meta', 'catalog'); TC().cat = null; TC().sig = ''; TC().ver++; bump(); return { ok: true };
}));

/* ---- Akkaunt holati: savat va sevimlilar har bir akkauntga alohida saqlanadi ---- */
route('GET', '/api/me/state', async req => { const u = await authUser(req); return (await store.get('ustate', u.id)) || { cart: [], favs: [] }; });
route('PUT', '/api/me/state', async (req, body) => {
  const u = await authUser(req); rate('state:' + u.id, 120, 60000);
  const cart = (Array.isArray(body.cart) ? body.cart : []).slice(0, 80).filter(i => i && i.id != null).map(i => ({
    id: i.id, selectedSize: i.selectedSize == null ? null : S(i.selectedSize, 30), selectedColor: i.selectedColor == null ? null : S(i.selectedColor, 30),
    sel: i.sel && typeof i.sel === 'object' ? i.sel : undefined, qty: Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1)) }));
  const favs = (Array.isArray(body.favs) ? body.favs : []).slice(0, 500).filter(x => x != null);
  await store.put('ustate', u.id, { cart, favs, ts: Date.now() }); return { ok: true };
});

/* ---- Jonli katalogga kiyim shablon rasmlarini qo'llash (faqat namuna rasmlar almashadi, haqiqiy rasmlar qoladi) ---- */
route('POST', '/api/admin/apply-template', (req) => withLock(async () => {
  checkAdmin(req); ensureCatalog(); const fresh = JSON.parse(JSON.stringify(fileBase()));
  const isOld = u => typeof u === 'string' && u.startsWith('data:image/svg') && !/0 0 300 400|0 0 400 175/.test(u);
  let n = 0; const by = arr => new Map((arr || []).map(x => [String(x.id), x]));
  const fp = by(fresh.products);
  (TC().cat.products || []).forEach(p => { const f = fp.get(String(p.id)); if (!f) return;
    if ((p.images || []).some(isOld) && f.images && f.images.length) { let k = 0; p.images = p.images.map(u => isOld(u) ? f.images[(k++) % f.images.length] : u); n++; }
    const fc = by(f.colors); (p.colors || []).forEach(c => { const g = fc.get(String(c.id)); if (g && (c.images || []).some(isOld) && g.images && g.images.length) { let k = 0; c.images = c.images.map(u => isOld(u) ? g.images[(k++) % g.images.length] : u); n++; } }); });
  const fb = by(fresh.banners); (TC().cat.banners || []).forEach(b => { const f = fb.get(String(b.id)); if (f && isOld(b.img) && f.img) { b.img = f.img; if (f.img_ru) b.img_ru = f.img_ru; n++; } });
  const fst = by(fresh.stories); (TC().cat.stories || []).forEach(st => { const f = fst.get(String(st.id)); if (f && isOld(st.media) && f.media) { st.media = f.media; n++; } });
  const fcat = new Map(); (fresh.categories || []).forEach(c => { fcat.set('c' + c.id, c); (c.subcats || []).forEach(x => fcat.set('s' + x.id, x)); });
  (TC().cat.categories || []).forEach(c => { const f = fcat.get('c' + c.id); if (f && isOld(c.img) && f.img) { c.img = f.img; n++; }
    (c.subcats || []).forEach(x => { const g = fcat.get('s' + x.id); if (g && isOld(x.img) && g.img) { x.img = g.img; n++; } }); });
  await saveCatalog(); bump(); return { ok: true, changed: n };
}));

/* ---- Foydalanuvchilar ---- */
route('GET', '/api/admin/users', async req => {
  checkAdmin(req); const users = await store.list('users'), orders = await store.list('orders'), bans = new Set((await store.list('bans')).map(b => b.value)), st = new Map();
  orders.forEach(o => { const id = o.user && o.user.id; if (!id) return; const x = st.get(id) || { n: 0, sum: 0, last: '' }; if (o.status !== 'cancelled') { x.n++; x.sum += o.total || 0; } if (!x.last || o.created > x.last) x.last = o.created; st.set(id, x); });
  return users.map(u => { const x = st.get(u.id) || { n: 0, sum: 0, last: '' }; return { id: u.id, kind: u.kind, tg: u.tg || null, username: u.username || '', name: u.name || '', phone: u.phone || '', phone_verified: !!u.phone_verified, email: u.email || '', created: u.created || '', orders: x.n, spent: x.sum, last_order: x.last, banned: [u.id, u.phone, u.email].some(v => v && bans.has(String(v).toLowerCase())) }; })
    .sort((a, b) => (b.last_order || b.created || '').localeCompare(a.last_order || a.created || ''));
});

/* ---- Chat: admin tomoni ---- */
const isOnline = ts => !!ts && Date.now() - ts < 150000;
route('GET', '/api/admin/chats', async req => {
  checkAdmin(req); const users = new Map((await store.list('users')).map(u => [u.id, u]));
  return (await store.list('chat')).map(t => { chatNorm(t); const u = users.get(t.uid) || {}; const lastU = [...t.msgs].reverse().find(m => m.from === 'u');
    return { uid: t.uid, name: t.name || u.name || '', username: t.username || u.username || '', kind: u.kind || (t.tg ? 'tg' : 'email'), unread: t.unread || 0, updated: t.updated || '', last: t.msgs.length ? t.msgs[t.msgs.length - 1] : null, last_src: lastU ? lastU.src : '', seen: u.seen || 0, online: isOnline(u.seen) }; })
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
});
route('POST', '/api/admin/chat', async (req, body) => {
  checkAdmin(req); const uid = String(body.uid); const u = (await store.get('users', uid)) || {}; const th = await store.get('chat', uid);
  const info = { seen: u.seen || 0, online: isOnline(u.seen), kind: u.kind || '', phone: u.phone || '', username: u.username || '', email: u.email || '', has_bot: u.kind === 'tg' };
  if (!th) return Object.assign({ uid, msgs: [] }, info);
  chatNorm(th); let ch = false; const now = Date.now();
  th.msgs.forEach(m => { if (m.from === 'u' && !m.read) { m.read = now; ch = true; } });   // mijozga "ko'rildi" belgisi
  if (th.unread) { th.unread = 0; ch = true; } if (ch) await store.put('chat', th.uid, th);
  return Object.assign({}, th, info);
});
route('POST', '/api/admin/chat/send', async (req, body) => {
  checkAdmin(req); const uid = String(body.uid || ''), text = S(body.text, 2000), media = cleanMedia(body.media); if (!uid || (!text && !media)) throw bad('Xabar matni kerak');
  const u = await store.get('users', uid); if (!u) throw new HttpError(404, 'Foydalanuvchi topilmadi');
  const th = chatNorm((await store.get('chat', uid)) || { uid, tg: u.tg, name: u.name, username: u.username || '', msgs: [], unread: 0, seq: 0 });
  const target = body.reply_to ? th.msgs.find(m => m.id === Number(body.reply_to)) : null;
  // Kanal: javob berilayotgan xabar qaysi kanaldan kelgan bo'lsa, shu kanal. Aks holda mijozning oxirgi xabari kanali.
  const lastU = [...th.msgs].reverse().find(m => m.from === 'u');
  let via = body.via === 'bot' || body.via === 'site' ? body.via : (target ? target.src : (lastU ? lastU.src : (u.kind === 'tg' ? 'bot' : 'site')));
  if (via === 'bot' && u.kind !== 'tg') via = 'site';
  const msg = { from: 'a', src: via, text, media: media || undefined, rt: quote(target), sent: Date.now() };
  if (via === 'bot') {
    const payload = { chat_id: u.tg, text }; if (target && target.tg && target.src === 'bot') { payload.reply_to_message_id = target.tg; payload.allow_sending_without_reply = true; }
    let r;
    if (media) {
      const abs = media.url.startsWith('http') ? media.url : ((PUBLIC_URL || '') + media.url); const meth = media.type === 'image' ? 'sendPhoto' : media.type === 'video' ? 'sendVideo' : 'sendAudio';
      const pl = Object.assign({}, payload); delete pl.text; pl[media.type === 'image' ? 'photo' : media.type === 'video' ? 'video' : 'audio'] = abs; if (text) pl.caption = text;
      r = await tgApi(meth, pl); if (!r || !r.ok) { const pd = Object.assign({}, pl); delete pd.photo; delete pd.video; delete pd.audio; pd.document = abs; r = await tgApi('sendDocument', pd); }
    } else r = await tgApi('sendMessage', payload); if (!r || !r.ok) throw new HttpError(502, "Telegramga yuborib bo'lmadi (mijoz botni bloklagan bo'lishi mumkin)");
    msg.tg = r.result.message_id;
  }
  chatPush(th, msg); th.name = th.name || u.name; await store.put('chat', uid, th); return th;
});
route('POST', '/api/admin/chat/delete', async (req, body) => { checkAdmin(req); await store.del('chat', String(body.uid)); return { ok: true }; });

/* ---- Chat v2: rasm / video / ovozli xabar, tahrirlash, o'chirish ---- */
const CHAT_MEDIA = { 'image/jpeg': ['image', 'jpg', 1.6e6], 'image/png': ['image', 'png', 1.6e6], 'image/webp': ['image', 'webp', 1.6e6],
  'video/mp4': ['video', 'mp4', VIDEO_MAX], 'video/webm': ['video', 'webm', VIDEO_MAX], 'video/quicktime': ['video', 'mp4', VIDEO_MAX],
  'audio/webm': ['voice', 'webm', 3e6], 'audio/ogg': ['voice', 'ogg', 3e6], 'audio/mp4': ['voice', 'm4a', 3e6], 'audio/mpeg': ['voice', 'mp3', 3e6], 'audio/aac': ['voice', 'aac', 3e6], 'audio/x-m4a': ['voice', 'm4a', 3e6], 'audio/wav': ['voice', 'wav', 3e6] };
async function saveChatMedia(req, buf) {
  const mime = String(req.headers['x-mime'] || req.headers['content-type'] || '').split(';')[0].trim().toLowerCase(); const t = CHAT_MEDIA[mime];
  if (!t) throw bad("Bu turdagi fayl yuborib bo'lmaydi (rasm, video yoki ovoz)");
  if (!Buffer.isBuffer(buf) || !buf.length) throw bad("Fayl bo'sh"); if (buf.length > t[2]) throw bad('Fayl juda katta (' + Math.round(buf.length / 1048576 * 10) / 10 + ' MB)');
  const id = crypto.randomBytes(8).toString('hex'); await store.put('img', id, { type: mime === 'video/quicktime' ? 'video/mp4' : mime, b64: buf.toString('base64'), size: buf.length });
  return { url: '/img/' + id + '.' + t[1], type: t[0] };
}
const cleanMedia = m => {
  if (!m || typeof m !== 'object') return null; const type = ['image', 'video', 'voice'].includes(m.type) ? m.type : ''; const url = String(m.url || '');
  if (!type || !/^(https?:\/\/[^\s/]+)?\/img\/[a-f0-9]{16}\.(jpg|png|webp|mp4|webm|m4a|ogg|mp3|aac|wav)$/.test(url)) return null;
  return { type, url, dur: Math.max(0, Math.min(600, Math.round(Number(m.dur) || 0))) || undefined };
};
const mediaLabel = m => m ? (m.type === 'image' ? '[rasm]' : m.type === 'video' ? '[video]' : '[ovozli xabar]') : '';
route('POST', '/api/chat/upload', async (req, buf) => { const u = await authUser(req); rate('chatup:' + u.id, 20, 60000); if (await isBanned([u.id, u.phone, u.email])) throw new HttpError(403, "Xabar yuborib bo'lmaydi", 'banned'); return saveChatMedia(req, buf); });
route('POST', '/api/admin/chat/upload', async (req, buf) => { checkAdmin(req); return saveChatMedia(req, buf); });
// mijozga ko'rinadigan ko'rinish: o'zi o'chirgan xabarlar va ichki tarix chiqarib tashlanadi
const chatForUser = th => th.msgs.filter(m => !(m.deleted && m.deleted.by === 'u')).map(m => { const o = Object.assign({}, m); delete o.hist; delete o.orig_text; delete o.orig_media; return o; });
route('POST', '/api/chat/edit', async (req, body) => {
  const u = await authUser(req); rate('chated:' + u.id, 30, 60000); const text = S(body.text, 1500); if (!text) throw bad('Xabar matni kerak');
  const th = await chatGet(u); const m = th.msgs.find(x => x.id === Number(body.id));
  if (!m || m.from !== 'u' || m.src !== 'site' || m.deleted) throw new HttpError(404, 'Xabar topilmadi');
  if (text === m.text) return { ok: true, msg: m };
  (m.hist = m.hist || []).push({ t: m.text || '', ts: Date.now() }); if (m.hist.length > 20) m.hist = m.hist.slice(-20);
  m.text = text; m.edited = Date.now(); th.unread = (th.unread || 0) + 1; th.updated = new Date().toISOString(); await store.put('chat', u.id, th); return { ok: true };
});
route('POST', '/api/chat/delete', async (req, body) => {
  const u = await authUser(req); rate('chatdel:' + u.id, 30, 60000); const th = await chatGet(u); const m = th.msgs.find(x => x.id === Number(body.id));
  if (!m || m.from !== 'u' || m.src !== 'site') throw new HttpError(404, 'Xabar topilmadi');
  if (!m.deleted) { m.deleted = { by: 'u', ts: Date.now() }; m.orig_text = m.text || ''; if (m.media) m.orig_media = m.media; m.text = ''; delete m.media; th.unread = (th.unread || 0) + 1; th.updated = new Date().toISOString(); await store.put('chat', u.id, th); }
  return { ok: true };
});
route('POST', '/api/admin/chat/edit', async (req, body) => {
  checkAdmin(req); const uid = String(body.uid || ''); const text = S(body.text, 2000); if (!text) throw bad('Xabar matni kerak');
  const th = await store.get('chat', uid); if (!th) throw new HttpError(404, 'Suhbat topilmadi'); chatNorm(th); const m = th.msgs.find(x => x.id === Number(body.id));
  if (!m || m.from !== 'a') throw new HttpError(404, 'Xabar topilmadi'); if (text === m.text) return th;
  if (m.src === 'bot' && m.tg) { const u = await store.get('users', uid); if (u && u.tg) { const r = await tgApi(m.media ? 'editMessageCaption' : 'editMessageText', Object.assign({ chat_id: u.tg, message_id: m.tg }, m.media ? { caption: text } : { text })); if (!r || !r.ok) throw new HttpError(502, 'Telegramda tahrirlab bo\'lmadi'); } }
  (m.hist = m.hist || []).push({ t: m.text || '', ts: Date.now() }); m.text = text; m.edited = Date.now(); th.updated = new Date().toISOString(); await store.put('chat', uid, th); return th;
});
route('POST', '/api/admin/chat/delmsg', async (req, body) => {
  checkAdmin(req); const uid = String(body.uid || ''); const th = await store.get('chat', uid); if (!th) throw new HttpError(404, 'Suhbat topilmadi'); chatNorm(th);
  const i = th.msgs.findIndex(x => x.id === Number(body.id)); if (i < 0) throw new HttpError(404, 'Xabar topilmadi');
  const m = th.msgs[i]; if (m.from === 'a' && m.src === 'bot' && m.tg) { const u = await store.get('users', uid); if (u && u.tg) tgApi('deleteMessage', { chat_id: u.tg, message_id: m.tg }).catch(() => {}); }
  th.msgs.splice(i, 1); th.updated = new Date().toISOString(); await store.put('chat', uid, th); return th;   // mijozdan ham butunlay yo'qoladi
});

/* ---- Chat: mijoz tomoni (saytdagi "Sotuvchiga murojaat") ---- */
route('GET', '/api/chat', async req => {
  const u = await authUser(req); const th = await chatGet(u); const now = Date.now(); let ch = false;
  th.msgs.forEach(m => { if (m.from === 'a' && !m.read) { m.read = now; ch = true; } });   // admin xabari mijozda ochildi = "ko'rildi"
  if (ch) await store.put('chat', u.id, th);
  const as = adminSeen || ((await store.get('meta', 'admin_seen')) || {}).ts || 0;
  return { msgs: chatForUser(th).slice(-150), admin: { online: isOnline(as), seen: as } };
});
route('GET', '/api/chat/status', async req => {
  const u = await authUser(req); const th = await store.get('chat', u.id); const unread = th ? chatNorm(th).msgs.filter(m => m.from === 'a' && !m.read).length : 0;
  return { unread, admin_online: isOnline(adminSeen) };
});
route('POST', '/api/chat/send', async (req, body) => {
  const u = await authUser(req); rate('chat:' + u.id, 20, 60000);
  if (await isBanned([u.id, u.phone, u.email])) throw new HttpError(403, "Xabar yuborib bo'lmaydi", 'banned');
  const media = cleanMedia(body.media); const text = S(body.text, 1500); if (!text && !media) throw bad('Xabar yozing');
  const th = await chatGet(u); const target = body.reply_to ? th.msgs.find(m => m.id === Number(body.reply_to)) : null;
  th.name = u.name; th.username = u.username || '';
  const m = chatPush(th, { from: 'u', src: 'site', text, media: media || undefined, rt: quote(target) });
  th.unread = (th.unread || 0) + 1; await store.put('chat', u.id, th);     // Telegram botga yuborilmaydi
  return { ok: true, msg: m };
});

// Telegram webhook (maxfiy sarlavha bilan himoyalangan)
route('POST', '/api/tg/webhook', async (req, body) => {
  if (!safeEq(req.headers['x-telegram-bot-api-secret-token'] || '', secretNow())) throw new HttpError(401, 'noto\'g\'ri');
  handleTgUpdate(body).catch(e => console.error('[webhook]', e.message)); return { ok: true };
});

/* ============================ HTTP server (+ statik fayllar) ============================ */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const TEXTY = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);
const HIDDEN = new Set(['server.js', 'package.json', 'package-lock.json', 'data.json', 'data.json.tmp']);
function send(res, status, body, headers) { res.writeHead(status, Object.assign({ 'Access-Control-Allow-Origin': CORS_ORIGIN, 'X-Content-Type-Options': 'nosniff' }, headers)); res.end(body); }
const sendJson = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
const gzCache = new Map();
async function serveStatic(req, res, pathname) {
  let rel; try { rel = decodeURIComponent(pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel)); const name = path.basename(file);
  if (!file.startsWith(ROOT + path.sep) || name.startsWith('.') || HIDDEN.has(name) || file.includes(path.sep + 'node_modules' + path.sep)) return send(res, 404, 'Not found');
  const ext = path.extname(file).toLowerCase(); if (!MIME[ext]) return send(res, 404, 'Not found');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    // Fayl o'zgarsa brauzer darhol yangisini oladi (ETag), o'zgarmasa 304 (tez)
    const etag = 'W/"' + st.size.toString(36) + '-' + Math.round(st.mtimeMs).toString(36) + '"';
    const h = { 'Content-Type': MIME[ext], 'ETag': etag, 'Cache-Control': TEXTY.has(ext) ? 'no-cache' : 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': CORS_ORIGIN, 'Vary': 'Accept-Encoding' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    const wantsGz = TEXTY.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '') && st.size < 3e6;
    if (wantsGz) {
      const c = gzCache.get(file);
      if (c && c.etag === etag) { res.writeHead(200, Object.assign({ 'Content-Encoding': 'gzip', 'Content-Length': c.buf.length }, h)); return res.end(req.method === 'HEAD' ? undefined : c.buf); }
      return fs.readFile(file, (e2, data) => {
        if (e2) return send(res, 404, 'Not found');
        const buf = zlib.gzipSync(data); gzCache.set(file, { etag, buf });
        res.writeHead(200, Object.assign({ 'Content-Encoding': 'gzip', 'Content-Length': buf.length }, h)); res.end(req.method === 'HEAD' ? undefined : buf);
      });
    }
    res.writeHead(200, Object.assign({ 'Content-Length': st.size }, h));
    if (req.method === 'HEAD') return res.end(); fs.createReadStream(file).pipe(res);
  });
}

const { randomBytes } = require('crypto');
route('GET', '/api/owner/tenants', async req => { checkOwner(req); return (await rawStore.list('tenants')).map(t => Object.assign({ slug: t.slug, name: t.name, admin_key: t.admin_key, created: t.created, owner_chat: t.owner_chat || '', admin_tg: t.admin_tg || '', bot: !!t.bot_token, bot_username: t.bot_username || '' }, shopState(t))).sort((a, b) => (a.created < b.created ? 1 : -1)); });
route('POST', '/api/owner/tenants', async (req, body) => {
  checkOwner(req);
  const slug = String(body.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,30}$/.test(slug) || slug === 'main') throw bad("Do'kon nomi (slug) noto'g'ri: 3-30 ta harf, raqam yoki tire");
  if (await rawStore.get('tenants', slug)) throw bad('Bu do\'kon nomi band');
  const name = String(body.name || slug).slice(0, 80);
  const tn = { slug, name, admin_key: String(body.admin_key || '').trim() || randomBytes(16).toString('hex'), paid_until: body.paid_until || null, frozen: false, created: new Date().toISOString() };
  await rawStore.put('tenants', slug, tn);
  const cat = EMPTY_CATALOG(); cat.settings.shop_name = name;
  await rawStore.put(tCol(slug, 'meta'), 'catalog', { cat, sig: 'new', saved: new Date().toISOString() });
  return { ok: true, slug, admin_key: tn.admin_key };
});

const server = http.createServer((req, res) => tenantRun(req, res, async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'); const pathname = url.pathname;
    if (req.method === 'OPTIONS') return send(res, 204, '', { 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Key,X-Mime', 'Access-Control-Max-Age': '86400' });
    if ((pathname === '/database.json' || pathname === '/api/products') && (req.method === 'GET' || req.method === 'HEAD')) {
      const m = await mergedDB(); const h = { 'Content-Type': 'application/json; charset=utf-8', ETag: m.etag, 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' };
      if (req.headers['if-none-match'] === m.etag) return send(res, 304, '', h);
      if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; return send(res, 200, req.method === 'HEAD' ? '' : m.gz, h); }
      return send(res, 200, req.method === 'HEAD' ? '' : m.body, h);
    }
    if (pathname.startsWith('/img/') && (req.method === 'GET' || req.method === 'HEAD')) {
      const id = pathname.slice(5).replace(/\.[a-z0-9]+$/i, ''); const r = /^[a-f0-9]{8,32}$/.test(id) && await store.get('img', id);
      if (!r) return send(res, 404, 'Not found');
      const buf = Buffer.from(r.b64, 'base64'), hd = { 'Content-Type': r.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes' };
      const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (rg && (rg[1] || rg[2])) {   // video oldinga surish uchun (iPhone ham shuni talab qiladi)
        let st = rg[1] ? parseInt(rg[1], 10) : Math.max(0, buf.length - parseInt(rg[2], 10)), en = rg[1] && rg[2] ? parseInt(rg[2], 10) : buf.length - 1; en = Math.min(en, buf.length - 1);
        if (st > en || st >= buf.length) return send(res, 416, '', { 'Content-Range': 'bytes */' + buf.length });
        return send(res, 206, req.method === 'HEAD' ? '' : buf.subarray(st, en + 1), Object.assign(hd, { 'Content-Range': 'bytes ' + st + '-' + en + '/' + buf.length, 'Content-Length': en - st + 1 }));
      }
      return send(res, 200, req.method === 'HEAD' ? '' : buf, hd);
    }
    if (pathname.startsWith('/api/')) {
      const fn = routes[req.method + ' ' + pathname]; if (!fn) return sendJson(res, 404, { error: 'Topilmadi' });
      if (pathname.includes('chat') && !featOn(currentTenant(), 'chat')) return sendJson(res, 403, { error: "Chat egasi tomonidan o'chirilgan", code: 'feature_off' });
      let body = {};
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (pathname === '/api/admin/upload-video') { checkAdmin(req); body = await readRaw(req, VIDEO_MAX + 1024); }
        else if (pathname === '/api/chat/upload') { await authUser(req); body = await readRaw(req, VIDEO_MAX + 1024); }
        else if (pathname === '/api/admin/chat/upload') { checkAdmin(req); body = await readRaw(req, VIDEO_MAX + 1024); }
        else body = await readBody(req, (pathname === '/api/reviews' || pathname === '/api/reviews/edit') ? 2e6 : (pathname === '/api/admin/upload' ? 4.6e6 : (pathname === '/api/admin/import' ? 2e7 : 2e5)));
      }
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      return sendJson(res, 200, await fn(req, body, ip));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return await serveStatic(req, res, pathname);
  } catch (e) {
    if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message, detail: e.message, code: e.code });
    console.error(e); return sendJson(res, 500, { error: 'Server xatosi' });
  }
}));
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e && e.message || e));
if (require.main === module) {
  catalogReady.then(() => server.listen(PORT, () => {
    console.log('Server ' + PORT + '-portda ishga tushdi! Saqlash: ' + store.kind);
    setupTelegram().catch(() => {});
    setInterval(checkRestock, 5 * 60000).unref();
  }));
}
module.exports = { server, store, checkRestock, handleTgUpdate, webhookSecret, catalogReady };
