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
const store = process.env.DATABASE_URL ? pgStore(process.env.DATABASE_URL) : fileStore(path.join(ROOT, 'data.json'));
if (store.kind === 'fayl') console.warn("[OGOHLANTIRISH] DATABASE_URL yo'q: buyurtmalar data.json faylida saqlanadi. Bepul Render qayta ishga tushganda bu fayl O'CHADI. Neon/Supabase ulang.");

/* ============================ database.json + qo'shimchalar ============================ */
let baseCache = { mtime: 0, data: null };
function loadBase() {
  const st = fs.statSync(DB_FILE);
  if (baseCache.mtime !== st.mtimeMs) {
    const j = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    delete j.orders; delete j.users; // eski fayldagi maxfiy bo'limlar saytga chiqmasin
    baseCache = { mtime: st.mtimeMs, data: j };
  }
  return baseCache.data;
}
const vkey = (pid, color, size) => pid + '#' + (color == null ? '' : color) + '|' + (size == null ? '' : size);
async function soldMap() { return (await store.get('meta', 'sold')) || {}; }
function soldTotal(sold, pid) { let s = 0; const pre = pid + '#'; for (const k in sold) if (k.startsWith(pre)) s += sold[k]; return s; }
// Haqiqiy qoldiq = database.json dagi qoldiq - sotilgan
function effStock(p, sold, color, size) {
  if (p.variant_stock) { const k = (color == null ? '' : color) + '|' + (size == null ? '' : size); return Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[vkey(p.id, color, size)] || 0)); }
  return Math.max(0, (p.stock !== undefined ? Number(p.stock) : 10) - soldTotal(sold, p.id));
}
function effTotal(p, sold) {
  if (p.variant_stock) { let t = 0; for (const k in p.variant_stock) t += Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); return t; }
  return effStock(p, sold);
}
let merged = { body: null, gz: null, etag: '', ts: 0, mtime: 0 };
function bump() { merged.ts = 0; }
async function mergedDB() {
  loadBase();
  if (merged.body && merged.mtime === baseCache.mtime && Date.now() - merged.ts < 30000) return merged;
  const base = baseCache.data, sold = await soldMap();
  const orders = await store.list('orders'), since = Date.now() - 7 * 86400000, week = {};
  orders.forEach(o => { if (o.status !== 'cancelled' && new Date(o.created).getTime() >= since) (o.items || []).forEach(i => { week[i.product_id] = (week[i.product_id] || 0) + (i.qty || 0); }); });
  const products = (base.products || []).map(p => {
    const q = Object.assign({}, p);
    if (p.variant_stock) { q.variant_stock = {}; let tot = 0; for (const k in p.variant_stock) { const v = Math.max(0, (Number(p.variant_stock[k]) || 0) - (sold[p.id + '#' + k] || 0)); q.variant_stock[k] = v; tot += v; } q.stock = tot; }
    else if (p.stock !== undefined) q.stock = effStock(p, sold);
    if (week[p.id]) q.sold_week = Math.max(Number(p.sold_week) || 0, week[p.id]);
    return q;
  });
  const reviews = (base.reviews || []).concat(await store.list('reviews'));
  const body = Buffer.from(JSON.stringify(Object.assign({}, base, { products, reviews })));
  merged = { body, gz: zlib.gzipSync(body), etag: '"' + crypto.createHash('sha1').update(body).digest('hex') + '"', ts: Date.now(), mtime: baseCache.mtime };
  return merged;
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
// Oddiy tezlik cheklovi (faqat kod so'rash/kirishga; BUYURTMAGA CHEKLOV YO'Q)
const hits = new Map();
function rate(key, max, ms) { const now = Date.now(); const a = (hits.get(key) || []).filter(t => now - t < ms); if (a.length >= max) throw new HttpError(429, "Juda ko'p so'rov. Biroz kuting"); a.push(now); hits.set(key, a); }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 3600000)) hits.delete(k); }, 600000).unref();
// Buyurtmalar bir-bir navbat bilan bajariladi (ikki kishi oxirgi mahsulotni bir vaqtda ololmasin)
let orderLock = Promise.resolve();
function withLock(fn) { const run = orderLock.then(fn, fn); orderLock = run.catch(() => {}); return run; }

/* ============================ Telegram ============================ */
async function tgApi(method, payload) {
  if (!BOT_TOKEN) return null;
  try {
    const r = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
    const j = await r.json(); if (!j.ok) console.error('[Telegram ' + method + ']', j.description); return j;
  } catch (e) { console.error('[Telegram ' + method + ']', e.message); return null; }
}
const webhookSecret = () => crypto.createHmac('sha256', SECRET).update('tg-webhook').digest('hex').slice(0, 48);
async function setupTelegram() {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN yoq' };
  const me = await tgApi('getMe'); if (me && me.ok) BOT_USERNAME = me.result.username;
  if (!PUBLIC_URL) { console.warn("[Telegram] PUBLIC_URL/RENDER_EXTERNAL_URL yo'q: webhook o'rnatilmadi"); return { ok: false, error: 'PUBLIC_URL yoq' }; }
  const r = await tgApi('setWebhook', { url: PUBLIC_URL + '/api/tg/webhook', secret_token: webhookSecret(), allowed_updates: ['message'], drop_pending_updates: false });
  console.log('[Telegram] bot: @' + BOT_USERNAME + ', webhook: ' + (r && r.ok ? 'OK' : 'XATO'));
  return { ok: !!(r && r.ok), bot: BOT_USERNAME };
}
function verifyInitData(initData) {
  if (!BOT_TOKEN) throw new HttpError(503, 'BOT_TOKEN sozlanmagan');
  const p = new URLSearchParams(String(initData || '')); const hash = p.get('hash'); p.delete('hash');
  if (!hash) throw new HttpError(401, "Telegram ma'lumoti yo'q");
  const dcs = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
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
    share: "Buyurtma berish uchun telefon raqamingizni tasdiqlang: pastdagi \"📱 Raqamni ulashish\" tugmasini bosing.",
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
    share: 'Чтобы оформить заказ, подтвердите номер телефона: нажмите кнопку «📱 Поделиться номером» ниже.',
    shareBtn: '📱 Поделиться номером',
    ok: '✅ Ваш номер подтверждён: {p}\nТеперь вернитесь в магазин и продолжите заказ.',
    other: 'Пожалуйста, поделитесь своим номером (кнопка ниже).',
    st: { confirmed: 'подтверждён ✅', shipping: 'в пути 🚚', delivered: 'доставлен 🎉', cancelled: 'отменён ❌', new: 'принят' },
    order: 'Заказ №{n}: {s}', review: 'Будем рады, если вы оцените товар и оставите отзыв.',
    back_in: '{n} снова в наличии! 🎉',
  },
};
const tt = (lang, key, p) => { let s = (T[lang] || T.uz)[key]; if (typeof s === 'string' && p) for (const k in p) s = s.split('{' + k + '}').join(p[k]); return s; };
const shopUrl = p => PUBLIC_URL ? PUBLIC_URL + '/' + (p || 'index.html') : '';
const webBtn = (lang, page, label) => PUBLIC_URL ? { inline_keyboard: [[{ text: label || tt(lang, 'open'), web_app: { url: shopUrl(page) } }]] } : undefined;

// Telegram botiga kelgan xabarlar (webhook)
async function handleTgUpdate(upd) {
  const m = upd && upd.message; if (!m || !m.from || m.chat.type !== 'private') return;
  const lang = m.from.language_code === 'ru' ? 'ru' : 'uz';
  if (m.contact) {
    if (m.contact.user_id !== m.from.id) { await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'other') }); return; }
    const phone = normPhone(m.contact.phone_number);
    await upsertTgUser(m.from, { phone, phone_verified: true, lang });
    await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'ok', { p: phone }), reply_markup: { remove_keyboard: true } });
    if (PUBLIC_URL) await tgApi('sendMessage', { chat_id: m.chat.id, text: '👇', reply_markup: webBtn(lang, 'cart.html', tt(lang, 'back')) });
    return;
  }
  const u = await upsertTgUser(m.from, { lang });
  const open = webBtn(lang, 'index.html');
  await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'hello'), reply_markup: open });
  if (!u.phone_verified) await tgApi('sendMessage', { chat_id: m.chat.id, text: tt(lang, 'share'), reply_markup: { keyboard: [[{ text: tt(lang, 'shareBtn'), request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
}
async function tellOwners(html) { for (const id of OWNER_IDS) await tgApi('sendMessage', { chat_id: id, text: html, parse_mode: 'HTML', disable_web_page_preview: true }); }
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
  return u;
}
const pubUser = u => ({ id: u.id, kind: u.kind, tg: u.tg || null, username: u.username || '', name: u.name || '', phone: u.phone || '', phone_verified: !!u.phone_verified, email: u.email || '', lang: u.lang || '' });
const tokenFor = u => sign({ uid: u.id, exp: Date.now() + 30 * 86400000 });
function checkAdmin(req) { if (!ADMIN_KEY || !safeEq(req.headers['x-admin-key'] || '', ADMIN_KEY)) throw new HttpError(401, "Admin kaliti noto'g'ri"); }
const STATUSES = ['new', 'confirmed', 'shipping', 'delivered', 'cancelled'];
async function isBanned(vals) { for (const v of vals) if (v && await store.get('bans', String(v).toLowerCase())) return true; return false; }

/* ============================ API ============================ */
const routes = {};
const route = (m, p, fn) => { routes[m + ' ' + p] = fn; };

// Sayt shu manzil orqali serverni topadi (api/health javob bersa — server bor)
route('GET', '/api/health', async () => ({ ok: true, telegram: !!BOT_TOKEN, bot: BOT_USERNAME, email: emailEnabled() || EMAIL_DEV, store: store.kind }));

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
  const base = loadBase(), prods = new Map((base.products || []).map(p => [String(p.id), p])), sold = await soldMap();
  const lines = new Map();
  for (const it of raw) {
    const p = prods.get(String(it.product_id)), qty = parseInt(it.qty, 10) || 1;
    if (!p || qty < 1 || qty > 99) throw new HttpError(400, 'Mahsulot topilmadi');
    const k = vkey(p.id, it.color, it.size); const cur = lines.get(k) || { p, color: it.color == null ? null : it.color, size: it.size == null ? null : it.size, qty: 0 }; cur.qty += qty; lines.set(k, cur);
  }
  const items = []; let total = 0;
  for (const [k, l] of lines) {
    const avail = effStock(l.p, sold, l.color, l.size);
    if (l.qty > avail) throw new HttpError(409, 'Omborda yetarli emas: ' + locName(l.p.name, 'uz') + ' (' + avail + ' ta qolgan)', 'stock');
  }
  for (const [k, l] of lines) {
    sold[k] = (sold[k] || 0) + l.qty;
    const col = (l.p.colors || []).find(c => c.id === l.color), price = digits(l.p.price); total += price * l.qty;
    items.push({ product_id: l.p.id, name: l.p.name, image: ((col && col.images) || l.p.images || [''])[0], price, color: l.color, color_name: col ? col.name : null, size: l.size, qty: l.qty, reviewed: false });
  }
  const number = 1000 + await store.next('orders');
  const order = {
    id: number, number, status: 'new', created: new Date().toISOString(),
    name: String(body.name || u.name || '').trim().slice(0, 80), phone: contact,
    address: String(body.address || '').slice(0, 300), comment: String(body.comment || '').slice(0, 300), items, total,
    user: { id: u.id, kind: u.kind, tg: u.tg || null, username: u.username || '', email: u.email || '', verified_phone: u.phone_verified ? u.phone : '' },
  };
  await store.put('orders', String(number), order, u.id); await store.put('meta', 'sold', sold);
  if (cid) await store.put('idem', u.id + ':' + cid, { number });
  bump();
  // Egasiga xabar
  const who = u.kind === 'tg' ? ('<a href="tg://user?id=' + u.tg + '">' + escHtml(u.name || 'Telegram') + '</a>' + (u.username ? ' @' + escHtml(u.username) : '') + ' (ID ' + u.tg + ')') : escHtml(u.email);
  tellOwners('🛒 <b>Yangi buyurtma №' + number + '</b>\n👤 ' + escHtml(order.name) + '\n📞 Aloqa: ' + escHtml(contact) +
    (u.phone_verified && u.phone !== contact ? '\n✅ Tasdiqlangan raqam: ' + escHtml(u.phone) : (u.phone_verified ? ' ✅' : '')) +
    (u.email ? '\n✉️ ' + escHtml(u.email) : '') + '\n💬 ' + who + '\n📍 ' + escHtml(order.address) + (order.comment ? '\n📝 ' + escHtml(order.comment) : '') + '\n\n' +
    items.map(i => '• ' + escHtml(locName(i.name, 'uz')) + (i.color_name ? ', ' + escHtml(locName(i.color_name, 'uz')) : '') + (i.size ? ', ' + escHtml(i.size) : '') + ' × ' + i.qty).join('\n') +
    "\n\n💰 Jami: <b>" + total.toLocaleString('ru-RU') + " so'm</b>").catch(() => {});
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
  const r = { id, product_id: it.product_id, name: body.anonymous ? null : (u.name || null), rating, text: String(body.text || '').slice(0, 600), date: new Date().toISOString().slice(0, 10), color: body.color == null ? null : body.color, size: body.size == null ? null : body.size, photos };
  it.reviewed = true; await store.put('orders', String(order.number), order, u.id); await store.put('reviews', id, r); bump(); return r;
});

// --- "Kelganda xabar qil" ---
route('POST', '/api/notify', async (req, body) => {
  const u = await authUser(req); const pid = String(body.product_id || ''); if (!pid) throw new HttpError(400, 'product_id kerak');
  const id = u.id + '|' + pid;
  if (body.off) await store.del('notify', id); else await store.put('notify', id, { uid: u.id, product_id: pid, created: new Date().toISOString() });
  return { ok: true };
});
async function checkRestock() {
  try {
    const subs = await store.list('notify'); if (!subs.length) return;
    const base = loadBase(), sold = await soldMap(), prods = new Map((base.products || []).map(p => [String(p.id), p]));
    for (const s of subs) {
      const p = prods.get(String(s.product_id)); if (!p || effTotal(p, sold) <= 0) continue;
      const u = await store.get('users', s.uid); await store.del('notify', s.uid + '|' + s.product_id); if (!u) continue;
      await tellUser(u, tt(u.lang, 'back_in', { n: locName(p.name, u.lang || 'uz') }), 'product.html?id=' + encodeURIComponent(p.id), tt(u.lang, 'open'));
    }
  } catch (e) { console.error('[restock]', e.message); }
}

// --- Admin ---
route('GET', '/api/admin/orders', async req => { checkAdmin(req); return (await store.list('orders')).sort((a, b) => b.number - a.number).slice(0, 300); });
route('PATCH', '/api/admin/orders', async (req, body) => {
  checkAdmin(req); const o = await store.get('orders', String(body.id)); if (!o) throw new HttpError(404, 'Buyurtma topilmadi');
  if (!STATUSES.includes(body.status)) throw new HttpError(400, 'status: ' + STATUSES.join(', '));
  if (o.status === 'cancelled') throw new HttpError(409, "Bekor qilingan buyurtmani o'zgartirib bo'lmaydi");
  if (o.status === body.status) return o;
  if (body.status === 'cancelled') { const sold = await soldMap(); o.items.forEach(i => { const k = vkey(i.product_id, i.color, i.size); sold[k] = Math.max(0, (sold[k] || 0) - i.qty); }); await store.put('meta', 'sold', sold); }
  o.status = body.status; await store.put('orders', String(o.number), o, o.user && o.user.id); bump();
  const u = o.user && await store.get('users', o.user.id);
  if (u && body.status !== 'new') tellUser(u, tt(u.lang, 'order', { n: o.number, s: tt(u.lang, 'st')[body.status] }) + (body.status === 'delivered' ? '\n' + tt(u.lang, 'review') : ''), body.status === 'delivered' ? 'profil.html#orders' : 'profil.html#orders', tt(u.lang, 'open')).catch(() => {});
  return o;
});
route('GET', '/api/admin/bans', async req => { checkAdmin(req); return await store.list('bans'); });
route('POST', '/api/admin/ban', async (req, body) => {
  checkAdmin(req); const v = String(body.value || '').trim().toLowerCase(); if (!v) throw new HttpError(400, 'value kerak');
  if (body.banned === false) await store.del('bans', v); else await store.put('bans', v, { value: v, note: String(body.note || '').slice(0, 100), date: new Date().toISOString() });
  return { ok: true };
});
route('POST', '/api/admin/reset-sold', async req => { checkAdmin(req); await store.put('meta', 'sold', {}); bump(); return { ok: true }; });
route('POST', '/api/admin/telegram-setup', async req => { checkAdmin(req); return await setupTelegram(); });

// Telegram webhook (maxfiy sarlavha bilan himoyalangan)
route('POST', '/api/tg/webhook', async (req, body) => {
  if (!safeEq(req.headers['x-telegram-bot-api-secret-token'] || '', webhookSecret())) throw new HttpError(401, 'noto\'g\'ri');
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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'); const pathname = url.pathname;
    if (req.method === 'OPTIONS') return send(res, 204, '', { 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Key', 'Access-Control-Max-Age': '86400' });
    if ((pathname === '/database.json' || pathname === '/api/products') && (req.method === 'GET' || req.method === 'HEAD')) {
      const m = await mergedDB(); const h = { 'Content-Type': 'application/json; charset=utf-8', ETag: m.etag, 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' };
      if (req.headers['if-none-match'] === m.etag) return send(res, 304, '', h);
      if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; return send(res, 200, req.method === 'HEAD' ? '' : m.gz, h); }
      return send(res, 200, req.method === 'HEAD' ? '' : m.body, h);
    }
    if (pathname.startsWith('/api/')) {
      const fn = routes[req.method + ' ' + pathname]; if (!fn) return sendJson(res, 404, { error: 'Topilmadi' });
      const body = (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') ? await readBody(req, pathname === '/api/reviews' ? 2e6 : 2e5) : {};
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      return sendJson(res, 200, await fn(req, body, ip));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return await serveStatic(req, res, pathname);
  } catch (e) {
    if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message, detail: e.message, code: e.code });
    console.error(e); return sendJson(res, 500, { error: 'Server xatosi' });
  }
});
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e && e.message || e));
if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Server ' + PORT + '-portda ishga tushdi! Saqlash: ' + store.kind);
    setupTelegram().catch(() => {});
    setInterval(checkRestock, 5 * 60000).unref();
  });
}
module.exports = { server, store, checkRestock, handleTgUpdate, webhookSecret };
