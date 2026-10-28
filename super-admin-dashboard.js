const FEATS = [['chat', 'Chat'], ['stories', 'Storislar'], ['banners', 'Bannerlar']];
let OKEY = ''; try { OKEY = sessionStorage.getItem('owner_key') || ''; } catch (e) {}
let TENANTS = [];
let UNREAD = {};
let CHAT_SLUG = '';
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function toast(m) { const t = $('toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display = 'none', 2600); }
async function api(path, body) {
  const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: Object.assign({ 'x-owner-key': OKEY }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('Xato ' + r.status));
  return j;
}
function status(t) {
  if (t.frozen) return '<span class="badge b-off">Muzlatilgan</span>';
  if (t.paid_until && Date.parse(t.paid_until) < Date.now()) return '<span class="badge b-off">Muddati tugagan</span>';
  return '<span class="badge b-ok">Faol</span>';
}
const dateOf = t => t.paid_until ? t.paid_until.slice(0, 10) : '—';
function featsHtml(t) { return FEATS.map(([k, n]) => `<span class="badge ${t.features[k] ? 'b-ok' : 'b-off'}" style="cursor:pointer" data-feat="${k}" data-slug="${esc(t.slug)}">${n}: ${t.features[k] ? 'yoniq' : "o'chiq"}</span>`).join(' '); }
function actsHtml(t) {
  return `<button class="${t.frozen ? 'ok' : 'danger'}" data-act="freeze" data-slug="${esc(t.slug)}">${t.frozen ? 'Ochish' : 'Muzlatish'}</button>
  <button class="ghost" data-act="pay" data-slug="${esc(t.slug)}">Muddat</button>
  <button class="ghost" data-act="key" data-slug="${esc(t.slug)}">Kalit</button>
  <button class="ghost" data-act="chat" data-slug="${esc(t.slug)}">Chat${UNREAD[t.slug] ? ' <span class="dot-n">' + UNREAD[t.slug] + '</span>' : ''}</button>
  <button class="ghost" data-act="bot" data-slug="${esc(t.slug)}">Bot${t.bot ? ' ✓' : ''}</button>`;
}
function render() {
  $('tbl').querySelector('tbody').innerHTML = TENANTS.map(t => `<tr>
    <td><b>${esc(t.name)}</b><div class="muted">${esc(t.slug)} · kalit: <code>${esc(t.admin_key)}</code>${t.bot ? ' · bot: @' + esc(t.bot_username || '?') : ' · bot yo\'q'}</div></td>
    <td>${status(t)}</td><td>${dateOf(t)}</td><td><div class="feat">${featsHtml(t)}</div></td><td><div class="acts">${actsHtml(t)}</div></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Do\'kon yo\'q</td></tr>';
  $('cards').innerHTML = TENANTS.map(t => `<div class="shopcard">
    <div class="top"><div><b>${esc(t.name)}</b><div class="muted">${esc(t.slug)}</div></div>${status(t)}</div>
    <div class="meta">Muddat: ${dateOf(t)} · kalit: <code>${esc(t.admin_key)}</code></div>
    <div class="feat" style="margin-bottom:10px">${featsHtml(t)}</div>
    <div class="acts">${actsHtml(t)}</div></div>`).join('') || '<div class="muted">Do\'kon yo\'q</div>';
  $('c_shop').innerHTML = '<option value="">— sotuvchi —</option>' + TENANTS.map(t => `<option value="${esc(t.slug)}">${esc(t.name)}${UNREAD[t.slug] ? ' (' + UNREAD[t.slug] + ' yangi)' : ''}</option>`).join('');
  $('c_shop').value = CHAT_SLUG;
  $('a_to').innerHTML = '<option value="all">Hamma do\'konlar</option>' + TENANTS.map(t => `<option value="${esc(t.slug)}">${esc(t.name)}</option>`).join('');
}
async function load() { TENANTS = (await api('/api/owner/tenants')).filter(Boolean); await refreshUnread(); render(); }
async function enter() {
  OKEY = $('okey').value.trim(); if (!OKEY) return;
  try { await load(); sessionStorage.setItem('owner_key', OKEY); $('login').hidden = true; $('app').hidden = false; $('hd').hidden = false; }
  catch (e) { $('lerr').textContent = e.message; OKEY = ''; }
}
$('enter').onclick = enter;
$('okey').onkeydown = e => { if (e.key === 'Enter') enter(); };
$('logout').onclick = () => { OKEY = ''; try { sessionStorage.removeItem('owner_key'); } catch (e) {} location.reload(); };
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'), f = e.target.closest('[data-feat]');
  try {
    if (b) {
      const t = TENANTS.find(x => x.slug === b.dataset.slug); if (!t) return;
      if (b.dataset.act === 'freeze') { await api('/api/owner/tenant/update', { slug: t.slug, frozen: !t.frozen }); toast(t.frozen ? 'Ochildi' : 'Muzlatildi'); }
      if (b.dataset.act === 'pay') { const d = prompt('To\'lov muddati (YYYY-MM-DD), bo\'sh bo\'lsa cheksiz:', t.paid_until ? t.paid_until.slice(0, 10) : ''); if (d === null) return; await api('/api/owner/tenant/update', { slug: t.slug, paid_until: d.trim() ? d.trim() : null }); toast('Muddat saqlandi'); }
      if (b.dataset.act === 'chat') { CHAT_SLUG = t.slug; $('c_shop').value = t.slug; await openChat(); document.getElementById('chatSec').scrollIntoView({ behavior: 'smooth' }); return; }
      if (b.dataset.act === 'bot') {
        const tok = prompt("Sotuvchining Telegram bot tokeni (BotFather'dan). Bo'sh qoldirsangiz o'chadi:", ''); if (tok === null) return;
        const oc = prompt("Buyurtma xabarlari boradigan chat ID (ixtiyoriy, bo'sh bo'lsa asosiy):", t.owner_chat || ''); if (oc === null) return;
        const r = await api('/api/owner/tenant/update', { slug: t.slug, bot_token: tok.trim(), owner_chat: oc.trim() });
        toast(r.bot && r.bot.ok ? "Bot ulandi" : (tok.trim() ? "Bot xato: " + ((r.bot && r.bot.error) || "tekshiring") : "Saqlandi")); await load(); return;
      }
      if (b.dataset.act === 'key') { const k = prompt('Yangi admin kaliti:', t.admin_key); if (!k) return; await api('/api/owner/tenant/update', { slug: t.slug, admin_key: k }); toast('Kalit yangilandi'); }
      await load();
    }
    if (f) {
      const t = TENANTS.find(x => x.slug === f.dataset.slug); if (!t) return;
      const on = !t.features[f.dataset.feat];
      await api('/api/owner/tenant/update', { slug: t.slug, features: { [f.dataset.feat]: on } }); toast('Saqlandi'); await load();
    }
  } catch (err) { toast(err.message); }
});
$('n_add').onclick = async () => {
  try {
    const res = await fetch('/api/owner/tenants', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner-key': OKEY }, body: JSON.stringify({ slug: $('n_slug').value.trim().toLowerCase(), name: $('n_name').value.trim(), admin_key: $('n_key').value.trim(), paid_until: $('n_paid').value || null }) });
    const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Xato');
    prompt('Do\'kon yaratildi. Admin kalit (nusxa oling):', j.admin_key);
    ['n_slug', 'n_name', 'n_key', 'n_paid'].forEach(i => $(i).value = ''); await load();
  } catch (err) { toast(err.message); }
};
$('a_send').onclick = async () => {
  try { await api('/api/owner/announce', { title: $('a_title').value, text: $('a_text').value, to: $('a_to').value }); $('a_title').value = ''; $('a_text').value = ''; toast('Yuborildi'); }
  catch (err) { toast(err.message); }
};
SAChat.init();
if (OKEY) { $('okey').value = OKEY; enter(); }
