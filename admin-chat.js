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
  let threads = [], cur = null, replyTo = null, via = '', timer = null, editing = null, rec = null;
  const wantUid = new URLSearchParams(location.search).get('uid');
  app.innerHTML = `<div class="chatwrap" id="cw"><div class="threads" id="th"></div><div class="chatbox" id="cb"><div class="empty"><b>Suhbatni tanlang</b>Chap tomondan mijozni tanlang</div></div></div>`;
  const cw = A.$('#cw');
  const tm = ts => new Date(ts).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
  const when = iso => { if (!iso) return ''; return A.dayKey(iso) === A.dayKey(new Date().toISOString()) ? tm(iso) : A.dt(iso).slice(0, 5); };
  const seenLbl = (seen, online) => online ? 'online' : (seen ? 'oxirgi marta: ' + (A.dayKey(new Date(seen).toISOString()) === A.dayKey(new Date().toISOString()) ? 'bugun ' + tm(seen) : A.dt(new Date(seen).toISOString())) : 'hali kirmagan');
  const srcBadge = s => s ? `<span class="src ${s}">${s === 'bot' ? 'Botdan' : 'Saytdan'}</span>` : '';


  const absU = u => /^https?:/i.test(u || '') ? u : A.API + u;
  const mediaH = md => { if (!md) return ''; const u = A.esc(absU(md.url)); return md.type === 'image' ? `<img class="mimg" src="${u}" alt="" data-lb="${u}">` : md.type === 'video' ? `<video class="mvid" src="${u}#t=0.1" controls playsinline preload="metadata"></video>` : `<audio class="maud" src="${u}" controls preload="metadata"></audio>`; };
  const prevT = x => x.text ? x.text : (x.media ? (x.media.type === 'image' ? '[Rasm]' : x.media.type === 'video' ? '[Video]' : '[Ovozli xabar]') : (x.deleted ? "[o'chirilgan xabar]" : ''));
  function msgHtml(x) {
    const q = x.rt ? `<div class="rt" data-goto="${x.rt.id}"><b>${x.rt.from === 'a' ? 'Siz' : A.esc(cur.name || 'Mijoz')}</b>${A.esc(x.rt.text || '')}</div>` : '';
    if (x.deleted) {
      const orig = (x.orig_text ? `<div class="orig-t">${A.esc(x.orig_text)}</div>` : '') + mediaH(x.orig_media);
      return `<div class="msg gone" data-id="${x.id}">${q}<div class="gone-l">${A.ic('trash')}<span>Mijoz bu xabarni o'chirib yuborgan · ${tm(x.deleted.ts)}</span></div>${orig ? `<details class="gone-d"><summary>Asl xabarni ko'rsatish</summary>${orig}</details>` : ''}<div class="meta2">${srcBadge(x.src)}<span>${tm(x.ts)}</span></div></div>`;
    }
    const chain = x.hist && x.hist.length ? x.hist.map(h => h.t).concat([x.text]) : null;
    const hist = chain ? `<details class="edit-d"><summary>✎ tahrirlangan · ${tm(x.edited)}</summary>${chain.map((t, i) => `<div class="eh ${i === chain.length - 1 ? 'now' : ''}"><small>${i === 0 ? 'Birinchi variant' : (i === chain.length - 1 ? 'Hozirgi' : i + '-tahrir')}</small>${A.esc(t || '(bo\'sh)')}</div>`).join('<div class="ea">↓</div>')}</details>` : (x.edited ? '<div class="edit-note">✎ tahrirlangan</div>' : '');
    return `<div class="msg ${x.from === 'a' ? 'a' : ''}" data-id="${x.id}">${q}${mediaH(x.media)}${x.text ? `<div class="mt">${A.esc(x.text)}</div>` : ''}${hist}<div class="meta2">${srcBadge(x.src)}<span>${tm(x.ts)}</span>${tick(x)}</div><button class="rbtn" data-more="${x.id}" title="Amallar">${A.ic('more')}</button></div>`;
  }
  /* ---- amallar menyusi ---- */
  function menu(x, ev) {
    document.querySelectorAll('.mmenu').forEach(e => e.remove());
    const mine = x.from === 'a', el = document.createElement('div'); el.className = 'mmenu';
    el.innerHTML = `<button data-a="reply">${A.ic('reply')}Javob berish</button>${x.text ? '<button data-a="copy">Nusxalash</button>' : ''}${mine && x.text ? `<button data-a="edit">${A.ic('edit')}Tahrirlash</button>` : ''}<button data-a="del" class="danger">${A.ic('trash')}O'chirish</button>`;
    document.body.appendChild(el); const W = innerWidth, H = innerHeight; const r = el.getBoundingClientRect();
    el.style.left = Math.max(8, Math.min(W - r.width - 8, ev.clientX - r.width / 2)) + 'px'; el.style.top = Math.max(8, Math.min(H - r.height - 8, ev.clientY)) + 'px';
    const off = () => { el.remove(); document.removeEventListener('pointerdown', away, true); };
    const away = e2 => { if (!el.contains(e2.target)) off(); }; setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
    el.onclick = async e2 => { const b = e2.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; off();
      if (a === 'reply') setReply(x.id);
      else if (a === 'copy') { try { await navigator.clipboard.writeText(x.text); A.toast('Nusxalandi', 'ok'); } catch (z) {} }
      else if (a === 'edit') { editing = x; replyTo = null; drawReply(); const t = A.$('#tx'); t.value = x.text; t.focus(); }
      else if (a === 'del') { if (await A.confirm("Xabar o'chirilsinmi?\nMijozning chatidan ham butunlay yo'qoladi" + (x.src === 'bot' ? " (Telegramdan ham o'chadi)." : '.'), { danger: true, ok: "O'chirish" })) { try { const th = await A.api('/api/admin/chat/delmsg', 'POST', { uid: cur.uid, id: x.id }); cur.msgs = th.msgs; drawBox(true); } catch (er) { A.toast(er.message, 'err'); } } } };
  }
  function setReply(id) { editing = null; replyTo = id; via = ''; drawReply(); const t = A.$('#tx'); if (t) t.focus(); }
  /* ---- yuborish (matn / rasm / video / ovoz) ---- */
  async function sendNow(text, media) {
    const th = await A.api('/api/admin/chat/send', 'POST', { uid: cur.uid, text, media: media || undefined, reply_to: replyTo || undefined, via: via || undefined });
    cur.msgs = th.msgs; replyTo = null; drawBox(); loadThreads();
  }
  async function upload(blob, mime) {
    const r = await fetch(A.API + '/api/admin/chat/upload', { method: 'POST', headers: { 'X-Admin-Key': A.getKey(), 'X-Mime': mime, 'Content-Type': mime }, body: blob }); let d = null; try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((d && (d.detail || d.error)) || 'Yuklab bo\'lmadi'); return d;
  }
  function shrink(file) { return new Promise(res => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c.toBlob(b => res(b), 'image/jpeg', .82); }; im.onerror = () => res(null); im.src = fr.result; }; fr.onerror = () => res(null); fr.readAsDataURL(file); }); }
  async function sendFile(f) {
    try {
      let blob = f, mime = f.type, type;
      if (/^image\//.test(f.type)) { blob = await shrink(f); mime = 'image/jpeg'; type = 'image'; if (!blob) return A.toast("Rasm o'qilmadi", 'err'); }
      else if (/^video\//.test(f.type)) { type = 'video'; if (f.size > 15 * 1048576) return A.toast('Video 15 MB dan kichik bo\'lsin', 'err'); } else return A.toast('Faqat rasm yoki video', 'err');
      A.toast('Yuborilmoqda...'); const up = await upload(blob, mime); await sendNow((A.$('#tx').value || '').trim(), { type: up.type || type, url: up.url });
    } catch (e) { A.toast(e.message, 'err'); }
  }
  async function recStart() {
    if (!navigator.mediaDevices || !window.MediaRecorder) return A.toast("Bu brauzerda ovoz yozib bo'lmaydi", 'err');
    let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return A.toast('Mikrofonga ruxsat bering', 'err'); }
    const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(m => MediaRecorder.isTypeSupported(m)) || ''; let mr; try { mr = new MediaRecorder(st, mt ? { mimeType: mt } : undefined); } catch (e) { st.getTracks().forEach(t => t.stop()); return A.toast("Ovoz yozib bo'lmadi", 'err'); }
    const ch = []; mr.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
    rec = { mr, st, ch, t0: Date.now(), cancel: false, mime: (mr.mimeType || mt || 'audio/webm').split(';')[0] };
    mr.onstop = async () => { st.getTracks().forEach(t => t.stop()); const r = rec; rec = null; clearInterval(r.tm); const rb = A.$('#recbar'); if (rb) rb.hidden = true; const d = Math.round((Date.now() - r.t0) / 1000);
      if (!r.cancel && d >= 1 && r.ch.length) { try { A.toast('Yuborilmoqda...'); const up = await upload(new Blob(r.ch, { type: r.mime }), r.mime); await sendNow('', { type: 'voice', url: up.url, dur: d }); } catch (e) { A.toast(e.message, 'err'); } } };
    mr.start(); A.$('#recbar').hidden = false; rec.tm = setInterval(() => { const s = Math.floor((Date.now() - rec.t0) / 1000); const t = A.$('#recT'); if (t) t.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (s >= 120) recStop(false); }, 250);
  }
  function recStop(c) { if (!rec) return; rec.cancel = !!c; try { rec.mr.stop(); } catch (e) { rec = null; } }
  // Ushlab yozish: mikrofon ruxsati bir marta so'raladi; chapga surib bekor qilinadi, qo'yib yuborilganda yuboriladi
  let hold = null, justHeld = false;
  async function micConsent() {
    try { if (localStorage.getItem('admin_mic_ok') === '1') return true; } catch (e) {}
    const ok = await A.confirm("Ovoz yozish uchun mikrofonga ruxsat kerak. Davom etamizmi?", { title: 'Mikrofon', ok: 'Ha' });
    if (ok) { try { localStorage.setItem('admin_mic_ok', '1'); } catch (e) {} }
    return !!ok;
  }
  async function holdStart(e, sb, tx0) {
    if (tx0.value.trim() || editing || rec) return;
    if (!(await micConsent())) return;
    hold = { x: e.clientX, cancel: false, t: Date.now() };
    await recStart(); if (!rec) { hold = null; return; }
    if (!hold) { recStop(true); return; }
    sb.classList.add('holding');
  }
  function holdMove(e) {
    if (!hold || !rec) return; const left = hold.x - e.clientX > 56; hold.cancel = left;
    const em = A.$('#recbar em'); if (em) { em.textContent = left ? '← Qo\'yib yuborsangiz bekor bo\'ladi' : '← Bekor qilish uchun chapga suring'; em.style.color = left ? '#ff3b30' : ''; }
  }
  function holdEnd() {
    if (!hold) return; const h = hold; hold = null; justHeld = true; setTimeout(() => { justHeld = false; }, 350);
    const sb = A.$('#sbtn'); if (sb) sb.classList.remove('holding');
    const em = A.$('#recbar em'); if (em) { em.textContent = 'Yozilmoqda...'; em.style.color = ''; }
    if (rec) recStop(h.cancel); else if (Date.now() - h.t < 400) A.toast('Ovozni ushlab turing', 'err');
  }
  document.addEventListener('pointermove', holdMove);
  document.addEventListener('pointerup', holdEnd);
  document.addEventListener('pointercancel', () => { if (hold) { hold.cancel = true; holdEnd(); } });

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
    cw.classList.add('open'); document.body.classList.add('chat-thread'); drawBox(silent); if (t.unread) { t.unread = 0; drawThreads(); A.refreshCounts(); }
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
      <div class="recbar" id="recbar" hidden><i class="rec-dot"></i><span id="recT">0:00</span><em>Yozilmoqda...</em><button type="button" class="btn sm" id="recX">Bekor</button></div>
      <form class="sendrow" id="sf"><label class="btn icon clipb" title="Rasm yoki video">${A.ic('clip')}<input type="file" id="fl" accept="image/*,video/*" hidden></label><input class="inp" id="tx" placeholder="Xabar yozing..." autocomplete="off" maxlength="2000"><button class="btn primary" type="submit" id="sbtn">${A.ic('send')}<span>Yuborish</span></button></form>`;
    A.$('#av').textContent = A.initials(cur.name); A.$('#nm').textContent = cur.name || 'Mijoz';
    A.$('#un').innerHTML = `<i class="dotp ${cur.online ? 'on' : ''}"></i><span>${A.esc(seenLbl(cur.seen, cur.online))}</span>${cur.username ? ' · @' + A.esc(cur.username) : ''}${cur.phone ? ' · ' + A.esc(cur.phone) : ''}`;
    const m = A.$('#msgs'), atEnd = m.scrollHeight - m.scrollTop - m.clientHeight < 80;
    m.innerHTML = cur.msgs.length ? cur.msgs.map(msgHtml).join('') : '<div class="empty">Hali xabar yo\'q. Birinchi bo\'lib yozing.</div>';
    if (!keepScroll || atEnd) m.scrollTop = m.scrollHeight;
    drawReply();
    A.$('#back').onclick = () => { cw.classList.remove('open'); document.body.classList.remove('chat-thread'); fitBox(); cur = null; drawThreads(); };
    const tx0 = A.$('#tx'), sb = A.$('#sbtn');
    const mb = () => { const has = tx0.value.trim() || editing; sb.innerHTML = has || rec ? A.ic('send') + '<span>' + (editing ? 'Saqlash' : 'Yuborish') + '</span>' : A.ic('mic') + '<span>Ovoz</span>'; };
    tx0.oninput = mb; mb();
    sb.addEventListener('pointerdown', e => { if (e.button !== undefined && e.button !== 0) return; if (tx0.value.trim() || editing) return; e.preventDefault(); holdStart(e, sb, tx0); });
    sb.addEventListener('contextmenu', e => e.preventDefault());
    A.$('#fl').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) sendFile(f); };
    A.$('#recX').onclick = () => recStop(true);
    A.$('#sf').onsubmit = async e => {
      e.preventDefault(); const tx = A.$('#tx'), text = tx.value.trim();
      if (justHeld) return;
      if (rec) { recStop(false); return; }
      if (!text && !editing) { A.toast('Ovozni ushlab turing', 'err'); return; }
      if (!text) return; tx.disabled = true;
      try {
        if (editing) { const th = await A.api('/api/admin/chat/edit', 'POST', { uid: cur.uid, id: editing.id, text }); cur.msgs = th.msgs; editing = null; tx.value = ''; drawBox(true); loadThreads(); }
        else { tx.value = ''; await sendNow(text); }
      } catch (x) { tx.value = text; A.toast(x.message, 'err'); } tx.disabled = false; tx.focus();
    };
    // surib javob berish (telefonda ham, sichqoncha bilan ham)
    const ml = A.$('#msgs'); let g = null;
    ml.onpointerdown = e => { const c = e.target.closest('.msg'); if (!c || e.target.closest('video,audio,details,.rbtn,img')) return; g = { c, x: e.clientX, y: e.clientY, dx: 0, drag: false }; };
    ml.onpointermove = e => { if (!g) return; const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.drag) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; } if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.4) { g.drag = true; g.c.classList.add('swiping'); try { ml.setPointerCapture(e.pointerId); } catch (z) {} } else return; }
      g.dx = dx; g.c.style.transform = 'translateX(' + Math.max(-84, Math.min(84, dx)) + 'px)'; g.c.classList.toggle('armed', Math.abs(dx) >= 56); };
    const eg = () => { if (!g) return; const c = g.c, w = g; if (w.drag) { c.style.transition = 'transform .18s'; c.style.transform = ''; c.classList.remove('armed', 'swiping'); setTimeout(() => { c.style.transition = ''; }, 200); if (Math.abs(w.dx) >= 56 && !c.classList.contains('gone')) setReply(Number(c.dataset.id)); } g = null; };
    ml.onpointerup = eg; ml.onpointercancel = eg;
    ml.oncontextmenu = e => { const c = e.target.closest('.msg'); if (!c) return; e.preventDefault(); const x = cur.msgs.find(z => z.id === Number(c.dataset.id)); if (x && !x.deleted) menu(x, e); };
    fitBox();
  }
  // klaviatura chiqqanda yozish maydoni uning ustida qoladi
  function fitBox() {
    const cb = A.$('#cb'); if (!cb) return; const vv = window.visualViewport;
    if (innerWidth > 900 || !cw.classList.contains('open') || !vv) { cb.style.height = ''; return; }
    const top = cb.getBoundingClientRect().top; cb.style.height = Math.max(260, vv.offsetTop + vv.height - top - 6) + 'px';
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', () => { fitBox(); const m = A.$('#msgs'); if (m) m.scrollTop = m.scrollHeight; }); window.visualViewport.addEventListener('scroll', fitBox); }
  addEventListener('focusin', e => { if (e.target && e.target.id === 'tx') setTimeout(() => { fitBox(); const m = A.$('#msgs'); if (m) m.scrollTop = m.scrollHeight; }, 300); });
  function drawReply() {
    const rb = A.$('#rbar'), vb = A.$('#via'); if (!rb) return;
    const m = editing || (replyTo && cur.msgs.find(x => x.id === replyTo));
    rb.innerHTML = m ? `<div class="replybar"><div><b class="small">${A.ic('reply')} ${editing ? 'Tahrirlash' : (m.from === 'a' ? 'O\'zingizga' : A.esc(cur.name || 'Mijoz'))} ${srcBadge(m.src)}</b><div class="ellipsis small">${A.esc(prevT(m))}</div></div><button class="btn sm icon" id="rx" type="button">${A.ic('close')}</button></div>` : '';
    if (m) A.$('#rx').onclick = () => { if (editing) { editing = null; const t = A.$('#tx'); if (t) { t.value = ''; t.dispatchEvent(new Event('input')); } } replyTo = null; drawReply(); };
    const dv = via || defVia();
    vb.innerHTML = cur.has_bot ? `<span>Yuboriladi:</span><button type="button" data-via="bot" class="${dv === 'bot' ? 'on' : ''}">Bot (Telegram)</button><button type="button" data-via="site" class="${dv === 'site' ? 'on' : ''}">Sayt chati</button>` : `<span>Yuboriladi: <b>Sayt chati</b> (bu mijozda Telegram yo'q)</span>`;
  }
  A.$('#th').addEventListener('click', e => { const t = e.target.closest('.thread'); if (t) open(t.dataset.uid); });
  app.addEventListener('click', e => {
    const mo = e.target.closest('[data-more]'); if (mo) { const x = cur.msgs.find(z => z.id === Number(mo.dataset.more)); if (x) { const r0 = mo.getBoundingClientRect(); menu(x, { clientX: r0.left, clientY: r0.bottom }); } return; }
    const lb = e.target.closest('img[data-lb]'); if (lb) { window.open(lb.dataset.lb, '_blank'); return; }
    const v = e.target.closest('[data-via]'); if (v) { via = v.dataset.via; drawReply(); return; }
    const g = e.target.closest('[data-goto]'); if (g) { const el = A.$(`.msg[data-id="${g.dataset.goto}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
  });
  await loadThreads();
  if (wantUid) open(wantUid);
  // yangi xabarlar va "ko'rildi / online" holatini har 6 soniyada yangilash
  timer = setInterval(async () => {
    if (document.hidden) return;
    try { await loadThreads(); if (cur) { const th = await A.api('/api/admin/chat', 'POST', { uid: cur.uid }); const sig = x => JSON.stringify((x.msgs || []).map(m => [m.id, m.read ? 1 : 0, m.edited || 0, m.deleted ? 1 : 0])) + (x.online ? 1 : 0); if (sig(th) !== sig(cur)) { cur.msgs = th.msgs; cur.seen = th.seen; cur.online = th.online; drawBox(true); } } } catch (e) {}
  }, 6000);
});
