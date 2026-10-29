/* super-admin-chat.js: egasi paneli ↔ sotuvchi chati (o'qilmagan xabarlar, yuborish, avtomatik yangilash) */
async function openChat() {
  const box = $('c_box'); if (!CHAT_SLUG) { box.innerHTML = '<div class="muted">Sotuvchini tanlang</div>'; return; }
  const list = await api('/api/owner/chat?shop=' + encodeURIComponent(CHAT_SLUG));
  box.innerHTML = list.length ? list.map(m => `<div class="bub ${m.from === 'owner' ? 'o' : 's'}">${esc(m.text)}<small>${new Date(m.created).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') : '<div class="muted">Hozircha xabar yo\'q</div>';
  box.scrollTop = box.scrollHeight;
  UNREAD[CHAT_SLUG] = 0; render();
}
async function refreshUnread() { try { UNREAD = await api('/api/owner/unread'); render(); } catch (e) {} }
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
