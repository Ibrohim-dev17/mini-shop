/* ==========================================================================
   ADMIN: EGASI BILAN CHAT (sotuvchi va do'kon egasi o'rtasida yozishma)
   ========================================================================== */
Admin.page('support', 'Egasi bilan chat', async app => {
  const A = Admin;
  const fmt = iso => { try { return new Date(iso).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  app.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:10px;min-height:60vh">
      <div class="muted small">Platforma egasi bilan bevosita yozishma. Savol, shikoyat yoki yordam so'rash uchun.</div>
      <div id="sup" style="flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:6px 2px;max-height:55vh"></div>
      <div style="display:flex;gap:8px"><textarea class="inp" id="supTxt" rows="2" placeholder="Xabar yozing..." style="flex:1;resize:vertical"></textarea><button class="btn primary" id="supSend">Yuborish</button></div>
    </div>`;
  const box = A.$('#sup');
  const bubble = m => { const mine = m.from === 'seller'; return `<div style="align-self:${mine ? 'flex-end' : 'flex-start'};max-width:78%;background:${mine ? 'var(--accent,#6c2fff)' : 'var(--surface2,#eef0f6)'};color:${mine ? '#fff' : 'inherit'};padding:8px 12px;border-radius:14px;white-space:pre-wrap">${A.esc(m.text)}<div style="font-size:11px;opacity:.7;margin-top:3px">${fmt(m.created)}</div></div>`; };
  const load = async () => {
    const list = await A.api('/api/admin/owner-chat');
    box.innerHTML = list.length ? list.map(bubble).join('') : '<div class="muted small" style="margin:auto">Hozircha xabar yo\'q</div>';
    box.scrollTop = box.scrollHeight;
  };
  A.$('#supSend').onclick = async () => {
    const t = A.$('#supTxt').value.trim(); if (!t) return;
    try { await A.api('/api/admin/owner-chat', 'POST', { text: t }); A.$('#supTxt').value = ''; await load(); }
    catch (e) { A.toast(e.message, 'err'); }
  };
  try { await load(); } catch (e) { if (e.status !== 401) box.innerHTML = '<div class="muted">' + A.esc(e.message) + '</div>'; }
  const timer = setInterval(() => { if (!document.body.contains(box)) return clearInterval(timer); load().catch(() => {}); }, 15000);
});
