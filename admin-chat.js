/* ==========================================================================
   ADMIN: CHAT (mijozlar bilan yozishma)
   - Mijoz Telegramdagi botga yozsa, xabar shu yerga tushadi va sizga ham Telegramda xabar keladi.
   - Javobingiz mijozga bot orqali Telegramda boradi (email bilan kirgan mijozga emailga).
   - Mijoz botni umuman ishga tushirmagan bo'lsa, unga Telegram xabar yuborib bo'lmaydi.
   ========================================================================== */
Admin.page('chat', 'Chat', async app => {
  const A = Admin;
  let threads = [], cur = null, timer = null;
  const wantUid = new URLSearchParams(location.search).get('uid');
  app.innerHTML = `<div class="chatwrap" id="cw"><div class="threads" id="th"></div><div class="chatbox" id="cb"><div class="empty"><b>Suhbatni tanlang</b>Chap tomondan mijozni tanlang</div></div></div>`;
  const cw = A.$('#cw');
  const when = iso => { if (!iso) return ''; const d = new Date(iso); return A.dayKey(iso) === A.dayKey(new Date().toISOString()) ? d.toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' }) : A.dt(iso).slice(0, 5); };
  async function loadThreads() {
    threads = await A.api('/api/admin/chats');
    if (wantUid && !threads.find(t => String(t.uid) === wantUid)) { const U = await A.users(); const u = U.find(x => String(x.id) === wantUid); if (u) threads.unshift({ uid: u.id, name: u.name, username: u.username, unread: 0, last: null, updated: '' }); }
    drawThreads();
  }
  function drawThreads() {
    A.$('#th').innerHTML = threads.length ? threads.map(t => `<div class="thread ${cur && String(cur.uid) === String(t.uid) ? 'on' : ''}" data-uid="${A.esc(t.uid)}"><span class="ava">${A.esc(A.initials(t.name))}</span><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:6px"><b class="ellipsis">${A.esc(t.name || 'Mijoz')}</b><span class="small muted">${when(t.updated)}</span></div><div class="small muted ellipsis">${t.last ? (t.last.from === 'a' ? 'Siz: ' : '') + A.esc(t.last.text) : 'Yangi suhbat'}</div></div>${t.unread ? `<span class="badge primary">${t.unread}</span>` : ''}</div>`).join('') : '<div class="empty"><b>Suhbat yo\'q</b>Mijoz botga yozganda shu yerda ko\'rinadi. Mijozlar sahifasidan ham yozishingiz mumkin.</div>';
  }
  async function open(uid, silent) {
    const t = threads.find(x => String(x.uid) === String(uid)) || { uid, name: '' };
    const th = await A.api('/api/admin/chat', 'POST', { uid }); cur = { uid, name: th.name || t.name, username: th.username || t.username, msgs: th.msgs || [] };
    cw.classList.add('open'); drawBox(silent); if (t.unread) { t.unread = 0; drawThreads(); A.refreshCounts(); }
  }
  function drawBox(keepScroll) {
    let box = A.$('#cb');
    if (!A.$('#msgs')) box.innerHTML = `<div class="top" style="position:static;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line)"><button class="btn sm icon" id="back" title="Orqaga">${A.ic('left')}</button><span class="ava" id="av"></span><div style="min-width:0"><b id="nm" class="ellipsis" style="display:block"></b><span class="small muted" id="un"></span></div></div><div class="msgs" id="msgs"></div><form class="sendrow" id="sf"><input class="inp" id="tx" placeholder="Xabar yozing..." autocomplete="off" maxlength="2000"><button class="btn primary" type="submit">${A.ic('send')}<span>Yuborish</span></button></form>`;
    A.$('#av').textContent = A.initials(cur.name); A.$('#nm').textContent = cur.name || 'Mijoz'; A.$('#un').textContent = cur.username ? '@' + cur.username : '';
    const m = A.$('#msgs'), atEnd = m.scrollHeight - m.scrollTop - m.clientHeight < 80;
    m.innerHTML = cur.msgs.length ? cur.msgs.map(x => `<div class="msg ${x.from === 'a' ? 'a' : ''}">${A.esc(x.text)}<small>${new Date(x.ts).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') : '<div class="empty">Hali xabar yo\'q. Birinchi bo\'lib yozing.</div>';
    if (!keepScroll || atEnd) m.scrollTop = m.scrollHeight;
    A.$('#back').onclick = () => { cw.classList.remove('open'); cur = null; drawThreads(); };
    A.$('#sf').onsubmit = async e => { e.preventDefault(); const tx = A.$('#tx'), text = tx.value.trim(); if (!text) return; tx.disabled = true;
      try { const th = await A.api('/api/admin/chat/send', 'POST', { uid: cur.uid, text }); cur.msgs = th.msgs; tx.value = ''; drawBox(); loadThreads(); } catch (x) { A.toast(x.message, 'err'); } tx.disabled = false; tx.focus(); };
  }
  A.$('#th').addEventListener('click', e => { const t = e.target.closest('.thread'); if (t) open(t.dataset.uid); });
  await loadThreads();
  if (wantUid) open(wantUid);
  // yangi xabarlarni har 8 soniyada tekshirish
  timer = setInterval(async () => { if (document.hidden) return; try { await loadThreads(); if (cur) { const th = await A.api('/api/admin/chat', 'POST', { uid: cur.uid }); if ((th.msgs || []).length !== cur.msgs.length) { cur.msgs = th.msgs; drawBox(true); } } } catch (e) {} }, 8000);
});
