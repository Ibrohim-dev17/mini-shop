/* ==========================================================================
   ADMIN: CHAT (mijozlar bilan yozishma)
   Ikki alohida kanal (har bir xabarda belgi turadi):
     [Bot]  - mijoz Telegramdagi botga yozgan. Javobingiz botga, Telegramda "reply" bo'lib boradi (mijoz qaysi xabarga javob berilganini ko'radi).
     [Sayt] - mijoz saytdagi "Sotuvchiga murojaat" orqali yozgan. Javobingiz faqat saytdagi chatga boradi, botga BORMAYDI.
   Belgilar: bitta ✓ = yuborildi, ikkita ✓✓ (yashil) = mijoz ko'rdi (sayt chatida). Mijozning "online" yoki oxirgi kirgan vaqti sarlavhada.
   Xabar ustiga olib borib (telefonda ↩ tugmasi) javob berish mumkin.
   ========================================================================== */
Admin.page('chat', 'Chat', async app => {
  const A = Admin;
  let threads = [], cur = null, replyTo = null, via = '', timer = null;
  const wantUid = new URLSearchParams(location.search).get('uid');
  app.innerHTML = `<div class="chatwrap" id="cw"><div class="threads" id="th"></div><div class="chatbox" id="cb"><div class="empty"><b>Suhbatni tanlang</b>Chap tomondan mijozni tanlang</div></div></div>`;
  const cw = A.$('#cw');
  const tm = ts => new Date(ts).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
  const when = iso => { if (!iso) return ''; return A.dayKey(iso) === A.dayKey(new Date().toISOString()) ? tm(iso) : A.dt(iso).slice(0, 5); };
  const seenLbl = (seen, online) => online ? 'online' : (seen ? 'oxirgi marta: ' + (A.dayKey(new Date(seen).toISOString()) === A.dayKey(new Date().toISOString()) ? 'bugun ' + tm(seen) : A.dt(new Date(seen).toISOString())) : 'hali kirmagan');
  const srcBadge = s => s ? `<span class="src ${s}">${s === 'bot' ? 'Botdan' : 'Saytdan'}</span>` : '';

  async function loadThreads() {
    threads = await A.api('/api/admin/chats');
    if (wantUid && !threads.find(t => String(t.uid) === wantUid)) { const U = await A.users(); const u = U.find(x => String(x.id) === wantUid); if (u) threads.unshift({ uid: u.id, name: u.name, username: u.username, unread: 0, last: null, updated: '', kind: u.kind }); }
    drawThreads();
  }
  function drawThreads() {
    A.$('#th').innerHTML = threads.length ? threads.map(t => `<div class="thread ${cur && String(cur.uid) === String(t.uid) ? 'on' : ''}" data-uid="${A.esc(t.uid)}"><span class="ava">${A.esc(A.initials(t.name))}</span><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:6px"><b class="ellipsis">${t.online ? '<i class="dotp on"></i> ' : ''}${A.esc(t.name || 'Mijoz')}</b><span class="small muted">${when(t.updated)}</span></div><div class="small muted ellipsis">${t.last ? (t.last.from === 'a' ? 'Siz: ' : '') + A.esc(t.last.text) : 'Yangi suhbat'}${srcBadge(t.last_src)}</div></div>${t.unread ? `<span class="badge primary">${t.unread}</span>` : ''}</div>`).join('') : '<div class="empty"><b>Suhbat yo\'q</b>Mijoz botga yoki saytdagi chatga yozganda shu yerda ko\'rinadi. Mijozlar sahifasidan ham yozishingiz mumkin.</div>';
  }
  // standart kanal: javob berilayotgan xabar kanali, aks holda mijozning oxirgi xabari kanali
  function defVia() {
    if (replyTo) { const m = cur.msgs.find(x => x.id === replyTo); if (m) return m.src; }
    const lu = [...cur.msgs].reverse().find(m => m.from === 'u'); if (lu) return lu.src;
    return cur.has_bot ? 'bot' : 'site';
  }
  async function open(uid, silent) {
    const t = threads.find(x => String(x.uid) === String(uid)) || { uid, name: '' };
    const th = await A.api('/api/admin/chat', 'POST', { uid });
    const keep = cur && String(cur.uid) === String(uid);
    cur = { uid, name: th.name || t.name, username: th.username || t.username, msgs: th.msgs || [], seen: th.seen, online: th.online, has_bot: th.has_bot, phone: th.phone, email: th.email, kind: th.kind };
    if (!keep) { replyTo = null; via = ''; }
    cw.classList.add('open'); drawBox(silent); if (t.unread) { t.unread = 0; drawThreads(); A.refreshCounts(); }
  }
  const tick = m => {
    if (m.from !== 'a') return '';
    if (m.src === 'bot') return `<span class="tick" title="Telegramga yuborildi">${A.ic('check')}</span>`;
    return `<span class="tick ${m.read ? 'read' : ''}" title="${m.read ? "Mijoz ko'rdi" : "Yuborildi, hali ko'rilmadi"}">${A.ic(m.read ? 'checks' : 'check')}</span>`;
  };
  function drawBox(keepScroll) {
    const box = A.$('#cb');
    if (!A.$('#msgs')) box.innerHTML = `<div class="chead"><button class="btn sm icon" id="back" title="Orqaga">${A.ic('left')}</button><span class="ava" id="av"></span><div style="min-width:0;flex:1"><b id="nm" class="ellipsis" style="display:block"></b><span class="st" id="un"></span></div></div>
      <div class="msgs" id="msgs"></div><div id="rbar"></div><div class="viabar" id="via"></div>
      <form class="sendrow" id="sf"><input class="inp" id="tx" placeholder="Xabar yozing..." autocomplete="off" maxlength="2000"><button class="btn primary" type="submit">${A.ic('send')}<span>Yuborish</span></button></form>`;
    A.$('#av').textContent = A.initials(cur.name); A.$('#nm').textContent = cur.name || 'Mijoz';
    A.$('#un').innerHTML = `<i class="dotp ${cur.online ? 'on' : ''}"></i><span>${A.esc(seenLbl(cur.seen, cur.online))}</span>${cur.username ? ' · @' + A.esc(cur.username) : ''}${cur.phone ? ' · ' + A.esc(cur.phone) : ''}`;
    const m = A.$('#msgs'), atEnd = m.scrollHeight - m.scrollTop - m.clientHeight < 80;
    m.innerHTML = cur.msgs.length ? cur.msgs.map(x => `<div class="msg ${x.from === 'a' ? 'a' : ''}" data-id="${x.id}">${x.rt ? `<div class="rt" data-goto="${x.rt.id}"><b>${x.rt.from === 'a' ? 'Siz' : A.esc(cur.name || 'Mijoz')}</b>${A.esc(x.rt.text)}</div>` : ''}${A.esc(x.text)}<div class="meta2">${srcBadge(x.src)}<span>${tm(x.ts)}</span>${tick(x)}</div><button class="rbtn" data-reply="${x.id}" title="Javob berish">${A.ic('reply')}</button></div>`).join('') : '<div class="empty">Hali xabar yo\'q. Birinchi bo\'lib yozing.</div>';
    if (!keepScroll || atEnd) m.scrollTop = m.scrollHeight;
    drawReply();
    A.$('#back').onclick = () => { cw.classList.remove('open'); cur = null; drawThreads(); };
    A.$('#sf').onsubmit = async e => {
      e.preventDefault(); const tx = A.$('#tx'), text = tx.value.trim(); if (!text) return; tx.disabled = true;
      try { const th = await A.api('/api/admin/chat/send', 'POST', { uid: cur.uid, text, reply_to: replyTo || undefined, via: via || undefined }); cur.msgs = th.msgs; replyTo = null; tx.value = ''; drawBox(); loadThreads(); }
      catch (x) { A.toast(x.message, 'err'); } tx.disabled = false; tx.focus();
    };
  }
  function drawReply() {
    const rb = A.$('#rbar'), vb = A.$('#via'); if (!rb) return;
    const m = replyTo && cur.msgs.find(x => x.id === replyTo);
    rb.innerHTML = m ? `<div class="replybar"><div><b class="small">${A.ic('reply')} ${m.from === 'a' ? 'O\'zingizga' : A.esc(cur.name || 'Mijoz')} ${srcBadge(m.src)}</b><div class="ellipsis small">${A.esc(m.text)}</div></div><button class="btn sm icon" id="rx" type="button">${A.ic('close')}</button></div>` : '';
    if (m) A.$('#rx').onclick = () => { replyTo = null; drawReply(); };
    const dv = via || defVia();
    vb.innerHTML = cur.has_bot ? `<span>Yuboriladi:</span><button type="button" data-via="bot" class="${dv === 'bot' ? 'on' : ''}">Bot (Telegram)</button><button type="button" data-via="site" class="${dv === 'site' ? 'on' : ''}">Sayt chati</button>` : `<span>Yuboriladi: <b>Sayt chati</b> (bu mijozda Telegram yo'q)</span>`;
  }
  A.$('#th').addEventListener('click', e => { const t = e.target.closest('.thread'); if (t) open(t.dataset.uid); });
  app.addEventListener('click', e => {
    const r = e.target.closest('[data-reply]'); if (r) { replyTo = Number(r.dataset.reply); via = ''; drawReply(); const tx = A.$('#tx'); if (tx) tx.focus(); return; }
    const v = e.target.closest('[data-via]'); if (v) { via = v.dataset.via; drawReply(); return; }
    const g = e.target.closest('[data-goto]'); if (g) { const el = A.$(`.msg[data-id="${g.dataset.goto}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
  });
  await loadThreads();
  if (wantUid) open(wantUid);
  // yangi xabarlar va "ko'rildi / online" holatini har 6 soniyada yangilash
  timer = setInterval(async () => {
    if (document.hidden) return;
    try { await loadThreads(); if (cur) { const th = await A.api('/api/admin/chat', 'POST', { uid: cur.uid }); const sig = x => JSON.stringify((x.msgs || []).map(m => [m.id, m.read ? 1 : 0])) + (x.online ? 1 : 0); if (sig(th) !== sig(cur)) { cur.msgs = th.msgs; cur.seen = th.seen; cur.online = th.online; drawBox(true); } } } catch (e) {}
  }, 6000);
});
