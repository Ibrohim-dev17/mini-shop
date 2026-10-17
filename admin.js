/* ==========================================================================
   admin.js  —  admin.html (buyurtmalar paneli) kodi
   Server: server.js dagi /api/admin/* manzillari. Parol: Render'dagi ADMIN_KEY.
   ========================================================================== */

const API = '';   // sayt serverning o'zidan ochilsa bo'sh

/* ===== SOZLAMALAR va HOLAT NOMLARI (o'zgartirish mumkin) ===== */
const ST = { new: 'Yangi', confirmed: 'Tasdiqlandi', shipping: "Yo'lda", delivered: 'Yetkazildi', cancelled: 'Bekor' };
let KEY = '', ORDERS = [], BANS = [], FILTER = 'all';
try { KEY = sessionStorage.getItem('admin_key') || ''; } catch (e) {}
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nm = n => (n && typeof n === 'object') ? (n.uz || Object.values(n)[0] || '') : (n || '');

/* ===== SERVERGA SO'ROV: har doim X-Admin-Key sarlavhasi bilan ===== */
async function call(path, method, body) {
    const r = await fetch(API + path, { method: method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(j.error || r.status); e.status = r.status; throw e; } return j;
}

/* ===== BUYURTMALAR va QORA RO'YXATNI YUKLASH ===== */
async function load() {
    try { ORDERS = await call('/api/admin/orders'); BANS = await call('/api/admin/bans'); $('login').style.display = 'none'; $('main').style.display = ''; render(); }
    catch (e) { if (e.status === 401) { $('loginErr').textContent = "Parol noto'g'ri"; $('login').style.display = ''; $('main').style.display = 'none'; try { sessionStorage.removeItem('admin_key'); } catch (x) {} } else $('loginErr').textContent = 'Server bilan aloqa yoq'; }
}
function banned(v) { return v && BANS.some(b => b.value === String(v).toLowerCase()); }

/* ===== RO'YXATNI CHIZISH: tablar, buyurtma kartochkalari ===== */
function render() {
    const counts = { all: ORDERS.length }; ORDERS.forEach(o => counts[o.status] = (counts[o.status] || 0) + 1);
    $('tabs').innerHTML = ['all', 'new', 'confirmed', 'shipping', 'delivered', 'cancelled'].map(k => `<button class="tab ${FILTER === k ? 'on' : ''}" data-f="${k}">${k === 'all' ? 'Hammasi' : ST[k]} (${counts[k] || 0})</button>`).join('');
    const L = ORDERS.filter(o => FILTER === 'all' || o.status === FILTER);
    $('list').innerHTML = L.length ? L.map(card).join('') : '<div class="msg">Buyurtma yoq</div>';
    $('bans').innerHTML = BANS.length ? 'Qora royxat: ' + BANS.map(b => `${esc(b.value)} <a href="#" data-unban="${esc(b.value)}">[olib tashlash]</a>`).join(', ') : '';
}
function card(o) {
    const u = o.user || {}, tgl = u.kind === 'tg' ? (u.username ? `<a href="https://t.me/${esc(u.username)}" target="_blank">@${esc(u.username)}</a>` : `<a href="tg://user?id=${u.tg}">Telegram profil</a>`) + ` <span>(ID ${u.tg})</span>` : '';
    const keys = [u.id, o.phone, u.verified_phone, u.email].filter(Boolean);
    const isBan = keys.some(banned);
    const date = new Date(o.created).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
    return `<div class="card" data-id="${o.number}">
      <div class="head"><span class="no">№${o.number}</span><span class="date">${esc(date)}</span></div>
      <div class="kv"><span>Ism:</span> <b>${esc(o.name)}</b><br>
        <span>Aloqa tel:</span> <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a><br>
        ${u.verified_phone ? `<span>Tasdiqlangan tel:</span> <a href="tel:${esc(u.verified_phone)}">${esc(u.verified_phone)}</a><span class="tag">Telegram</span><br>` : ''}
        ${u.email ? `<span>Email:</span> <a href="mailto:${esc(u.email)}">${esc(u.email)}</a><span class="tag">tasdiqlangan</span><br>` : ''}
        ${tgl ? `<span>Telegram:</span> ${tgl}<br>` : ''}
        <span>Manzil:</span> ${esc(o.address)}<br>${o.comment ? `<span>Izoh:</span> ${esc(o.comment)}<br>` : ''}</div>
      <div class="items">${(o.items || []).map(i => `<div class="it"><img src="${esc(i.image)}" alt=""><div>${esc(nm(i.name))}<br><span style="color:var(--muted)">${[i.color_name ? nm(i.color_name) : '', i.size ? 'o\'lcham ' + i.size : ''].filter(Boolean).map(esc).join(', ')} × ${i.qty}</span></div></div>`).join('')}</div>
      <div class="total">${Number(o.total).toLocaleString('ru-RU')} so'm</div>
      <div class="acts"><select class="st st-${o.status}" data-st>${Object.keys(ST).map(k => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${ST[k]}</option>`).join('')}</select>
        <button class="btn sm ${isBan ? 'ghost' : 'red'}" data-ban="${isBan ? 0 : 1}">${isBan ? "Qora royxatdan chiqarish" : 'Qora royxatga'}</button></div>
    </div>`;
}

/* ===== TUGMALAR VA HODISALAR: kirish, yangilash, filtr, holat o'zgartirish, qora ro'yxat ===== */
$('go').onclick = () => { KEY = $('key').value.trim(); try { sessionStorage.setItem('admin_key', KEY); } catch (e) {} $('loginErr').textContent = ''; load(); };
$('key').addEventListener('keydown', e => { if (e.key === 'Enter') $('go').click(); });
$('refresh').onclick = load; $('out').onclick = () => { try { sessionStorage.removeItem('admin_key'); } catch (e) {} KEY = ''; $('main').style.display = 'none'; $('login').style.display = ''; };
$('tabs').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { FILTER = b.dataset.f; render(); } };
$('bans').onclick = async e => { const a = e.target.closest('[data-unban]'); if (!a) return; e.preventDefault(); await call('/api/admin/ban', 'POST', { value: a.dataset.unban, banned: false }); load(); };
$('list').onchange = async e => {
    const s = e.target.closest('[data-st]'); if (!s) return; const id = s.closest('.card').dataset.id;
    try { await call('/api/admin/orders', 'PATCH', { id: id, status: s.value }); } catch (er) { alert(er.message); } load();
};
$('list').onclick = async e => {
    const b = e.target.closest('[data-ban]'); if (!b) return; const o = ORDERS.find(x => String(x.number) === b.closest('.card').dataset.id); const u = o.user || {};
    const vals = [u.id, o.phone, u.verified_phone, u.email].filter(Boolean); const on = b.dataset.ban === '1';
    if (on && !confirm("Shu mijoz (" + vals.join(', ') + ") buyurtma bera olmaydi. Davom etasizmi?")) return;
    for (const v of vals) await call('/api/admin/ban', 'POST', { value: v, banned: on, note: o.name }); load();
};

/* ===== ISHGA TUSHIRISH: har 30 soniyada ro'yxat avtomatik yangilanadi ===== */
if (KEY) load(); setInterval(() => { if (KEY && $('main').style.display !== 'none') load(); }, 30000);
