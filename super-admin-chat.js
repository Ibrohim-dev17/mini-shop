/* super-admin-chat.js: egasi ↔ sotuvchi chati. Egasi o'z xabarini tahrirlaydi/o'chiradi; sotuvchining tahrir va o'chirishlari (tarix bilan) ko'rinadi. */
const fmtT = iso => { try { return new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
function bubble(m) {
  const mine = m.from === 'owner';
  const who = m.deleted ? ' · o\'chirilgan (' + (m.deleted_by === 'owner' ? 'siz' : 'sotuvchi') + ')' : '';
  const meta = fmtT(m.created) + (m.edited ? ' · tahrirlangan' : '') + who;
  const text = m.deleted ? `<s class="muted">${esc(m.text)}</s>` : esc(m.text);
  const acts = mine && !m.deleted ? `<span class="bub-acts"><button class="ghost" data-cact="edit" data-id="${esc(m.id)}" data-text="${esc(m.text)}">Tahrir</button> <button class="ghost" data-cact="del" data-id="${esc(m.id)}">O'chirish</button></span>` : '';
  const hist = m.hist && m.hist.length ? `<details class="small"><summary>Tahrir tarixi (${m.hist.length})</summary>${m.hist.map(h => `<div class="muted">${esc(h.t)} <small>${fmtT(h.ts)}</small></div>`).join('')}</details>` : '';
  return `<div class="bub ${mine ? 'o' : 's'}">${text}${hist}<small>${meta}</small>${acts}</div>`;
}
async function openChat() {
  const box = $('c_box'); if (!CHAT_SLUG) { box.innerHTML = '<div class="muted">Sotuvchini tanlang</div>'; return; }
  const slug = encodeURIComponent(CHAT_SLUG);
  const [list, st] = await Promise.all([api('/api/owner/chat?shop=' + slug), api('/api/owner/seller-status?shop=' + slug).catch(() => ({ online: false }))]);
  box.innerHTML = `<div class="muted small" style="margin-bottom:8px">Sotuvchi: ${st.online ? '<b style="color:#16a34a">● onlayn</b>' : 'oflayn'}</div>` +
    (list.length ? list.map(bubble).join('') : '<div class="muted">Xabar yo\'q</div>');
  box.scrollTop = box.scrollHeight;
  UNREAD[CHAT_SLUG] = 0; render();
}
async function refreshUnread() { try { UNREAD = await api('/api/owner/unread'); render(); } catch (e) {} }
// tahrir / o'chirish tugmalari
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-cact]'); if (!b) return;
  try {
    if (b.dataset.cact === 'del') { if (!confirm("Xabarni o'chirasizmi? Sotuvchi buni ko'rmaydi.")) return; await api('/api/owner/chat/delete', { id: b.dataset.id }); }
    if (b.dataset.cact === 'edit') { const t = prompt('Xabarni tahrirlash:', b.dataset.text || ''); if (t === null || !t.trim() || t.trim() === b.dataset.text) return; await api('/api/owner/chat/edit', { id: b.dataset.id, text: t.trim() }); }
    await openChat();
  } catch (err) { toast(err.message); }
});
window.SAChat = { init() {
  $('c_load').onclick = () => { CHAT_SLUG = $('c_shop').value; openChat().catch(e => toast(e.message)); };
  $('c_shop').onchange = () => { CHAT_SLUG = $('c_shop').value; openChat().catch(e => toast(e.message)); };
  $('c_send').onclick = async () => {
    const t = $('c_txt').value.trim(); if (!t || !CHAT_SLUG) return;
    try { await api('/api/owner/chat', { slug: CHAT_SLUG, text: t }); $('c_txt').value = ''; await openChat(); }
    catch (e) { toast(e.message); }
  };
  setInterval(() => { if (OKEY && !$('app').hidden) { refreshUnread(); if (CHAT_SLUG) openChat().catch(() => {}); } }, 20000);
} };
