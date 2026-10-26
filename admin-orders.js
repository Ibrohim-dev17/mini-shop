/* ==========================================================================
   ADMIN: BUYURTMALAR: ro'yxat, qidirish, holatni o'zgartirish, mijozni bloklash
   ========================================================================== */
Admin.page('orders', 'Buyurtmalar', async app => {
  const A = Admin;
  let ORDERS = await A.orders(true), BANS = await A.api('/api/admin/bans');
  let filter = 'all', q = new URLSearchParams(location.search).get('q') || '';
  const openN = new URLSearchParams(location.search).get('n');
  const isBanned = o => { const u = o.user || {}; return [u.id, o.phone, u.verified_phone, u.email].filter(Boolean).some(v => BANS.some(b => b.value === String(v).toLowerCase())); };

  app.innerHTML = `
  <div class="toolbar"><input class="inp" id="q" placeholder="Qidirish: raqam, ism, telefon, manzil..." value="${A.esc(q)}"><button class="btn" id="refresh">${A.ic('restore')}<span>Yangilash</span></button><button class="btn" id="csv">${A.ic('download')}<span>CSV</span></button></div>
  <div class="scrollx" id="tabs"></div>
  <div class="list" id="list"></div>`;

  function counts() { const c = { all: ORDERS.length }; ORDERS.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; }); return c; }
  function filtered() {
    const s = q.trim().toLowerCase();
    return ORDERS.filter(o => (filter === 'all' || o.status === filter) && (!s || [o.number, o.name, o.phone, o.address, o.user && o.user.email, o.user && o.user.username, o.user && o.user.verified_phone].join(' ').toLowerCase().includes(s)));
  }
  function render() {
    const c = counts();
    A.$('#tabs').innerHTML = ['all', ...Object.keys(A.ST)].map(k => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${k === 'all' ? 'Hammasi' : A.ST[k]} (${c[k] || 0})</button>`).join('');
    const L = filtered();
    A.$('#list').innerHTML = L.length ? L.map(o => `
      <div class="item" data-n="${o.number}" style="cursor:pointer">
        <div style="display:flex;gap:-8px">${(o.items || []).slice(0, 3).map(i => `<img class="th sq" style="width:46px;height:56px;margin-right:-14px;border:2px solid var(--surface)" src="${A.esc(i.image)}" alt="">`).join('')}</div>
        <div class="body" style="margin-left:18px">
          <div class="ttl">№${o.number} · ${A.esc(o.name)} ${isBanned(o) ? '<span class="badge danger">bloklangan</span>' : ''}</div>
          <div class="meta">${A.dt(o.created)} · ${A.esc(o.phone)}${o.geo ? ' · ' + A.ic('pin') : ''}${o.payment === 'click' ? ' · Click' : ''} · ${(o.items || []).reduce((s, i) => s + i.qty, 0)} dona</div>
        </div>
        <div style="text-align:right"><div style="font-weight:800">${A.money(o.total)}</div><span class="badge ${A.STC[o.status]}">${A.ST[o.status]}</span></div>
      </div>`).join('') : '<div class="empty"><b>Buyurtma topilmadi</b>Boshqa filtrni sinab ko\'ring</div>';
  }

  function detail(o) {
    const u = o.user || {}; const tg = u.kind === 'tg' ? (u.username ? `<a href="https://t.me/${A.esc(u.username)}" target="_blank" rel="noopener">@${A.esc(u.username)}</a>` : `<a href="tg://user?id=${u.tg}">Telegram profil</a>`) + ` <span class="muted">(ID ${u.tg})</span>` : '';
    const nextBtns = { new: [['confirmed', 'Tasdiqlash', 'primary']], confirmed: [['shipping', "Yo'lga chiqarish", 'primary']], shipping: [['delivered', 'Yetkazildi', 'ok']] }[o.status] || [];
    const costTotal = (o.items || []).reduce((s, i) => s + (i.cost || 0) * i.qty, 0);
    const body = `
      <dl class="kv">
        <dt>Holat</dt><dd><span class="badge ${A.STC[o.status]}">${A.ST[o.status]}</span> ${isBanned(o) ? '<span class="badge danger">bloklangan</span>' : ''}</dd>
        <dt>Sana</dt><dd>${A.dt(o.created)}</dd>
        <dt>Ism</dt><dd><b>${A.esc(o.name)}</b></dd>
        <dt>Aloqa telefoni</dt><dd><a href="tel:${A.esc(o.phone)}">${A.esc(o.phone)}</a></dd>
        ${u.verified_phone ? `<dt>Tasdiqlangan raqam</dt><dd><a href="tel:${A.esc(u.verified_phone)}">${A.esc(u.verified_phone)}</a> <span class="badge ok">Telegram</span></dd>` : ''}
        ${u.email ? `<dt>Email</dt><dd><a href="mailto:${A.esc(u.email)}">${A.esc(u.email)}</a> <span class="badge ok">tasdiqlangan</span></dd>` : ''}
        ${tg ? `<dt>Telegram</dt><dd>${tg}</dd>` : ''}
        <dt>Manzil</dt><dd>${A.esc(o.address)}${o.geo ? `<div style="margin-top:6px"><span class="muted small">${A.esc(o.geo.label || '')}</span><div class="btns" style="margin-top:6px"><a class="btn sm maplink" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${o.geo.lat},${o.geo.lng}">${A.ic('pin')}<span>Google xarita</span></a><a class="btn sm maplink" target="_blank" rel="noopener" href="https://yandex.com/maps/?pt=${o.geo.lng},${o.geo.lat}&z=17&l=map">${A.ic('pin')}<span>Yandex xarita</span></a></div><div class="geo-box"><iframe loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${o.geo.lng - 0.004},${o.geo.lat - 0.0025},${o.geo.lng + 0.004},${o.geo.lat + 0.0025}&layer=mapnik&marker=${o.geo.lat},${o.geo.lng}"></iframe></div></div>` : ''}</dd>
        <dt>To'lov</dt><dd>${o.payment === 'click' ? '<span class="badge ok">Click (kartaga o\'tkazadi)</span>' : '<span class="badge">Naqd pul</span>'}</dd>
        ${o.comment ? `<dt>Izoh</dt><dd>${A.esc(o.comment)}</dd>` : ''}
      </dl>
      <div class="list" style="margin:14px 0">${(o.items || []).map(i => `<div class="item" style="box-shadow:none"><img class="th sq" src="${A.esc(i.image)}" alt=""><div class="body"><div class="ttl">${A.esc(A.nm(i.name))}</div><div class="meta">${(i.opts ? i.opts.map(x => A.nm(x.name) + ': ' + A.nm(x.value)) : [i.color_name ? A.nm(i.color_name) : '', i.size ? "o'lcham " + i.size : '']).filter(Boolean).map(A.esc).join(', ')}${i.opts || i.color_name || i.size ? ' · ' : ''}${i.qty} × ${A.grp(i.price)}</div></div><b>${A.grp(i.price * i.qty)}</b></div>`).join('')}</div>
      <div class="stat-line"><span>Jami</span><b style="font-size:17px">${A.money(o.total)}</b></div>
      ${costTotal ? `<div class="stat-line"><span class="muted">Tan narx / foyda</span><span>${A.money(costTotal)} / <b style="color:var(--ok)">${A.money(o.total - costTotal)}</b></span></div>` : ''}`;
    const btns = [{ text: 'Yopish' }];
    if (o.status !== 'cancelled' && o.status !== 'delivered') btns.push({ text: 'Bekor qilish', cls: 'danger', fn: async () => { if (!(await A.confirm("Buyurtma №" + o.number + " bekor qilinsinmi?\nMahsulotlar omborga qaytariladi, mijozga xabar boradi.", { danger: true, ok: 'Bekor qilish' }))) return false; await setStatus(o, 'cancelled'); } });
    nextBtns.forEach(([st, txt, cls]) => btns.push({ text: txt, cls, fn: async () => { await setStatus(o, st); } }));
    if (u.id) btns.unshift({ text: 'Chat', fn: () => { location.href = 'admin-chat.html?uid=' + encodeURIComponent(u.id); return false; } });
    const banned = isBanned(o);
    btns.unshift({ text: banned ? 'Blokdan chiqarish' : 'Bloklash', cls: banned ? '' : 'danger', fn: async () => { await toggleBan(o, !banned); } });
    A.modal({ title: 'Buyurtma №' + o.number, body, wide: true, buttons: btns });
  }
  async function setStatus(o, status) {
    const r = await A.api('/api/admin/orders', 'PATCH', { id: o.number, status }); Object.assign(o, r); A.toast('Holat: ' + A.ST[status], 'ok'); A.refreshCounts(); render();
  }
  async function toggleBan(o, on) {
    const u = o.user || {}; const vals = [u.id, o.phone, u.verified_phone, u.email].filter(Boolean);
    if (on && !(await A.confirm('Mijoz (' + vals.join(', ') + ') endi buyurtma bera olmaydi. Davom etasizmi?', { danger: true, ok: 'Bloklash' }))) return false;
    for (const v of vals) await A.api('/api/admin/ban', 'POST', { value: v, banned: on, note: o.name }); BANS = await A.api('/api/admin/bans'); A.toast(on ? 'Bloklandi' : 'Blokdan chiqarildi', 'ok'); render();
  }

  app.addEventListener('click', e => {
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; render(); return; }
    const it = e.target.closest('[data-n]'); if (it) { const o = ORDERS.find(x => String(x.number) === it.dataset.n); if (o) detail(o); }
  });
  A.$('#q').addEventListener('input', A.debounce(e => { q = e.target.value; render(); }, 150));
  A.$('#refresh').onclick = async () => { ORDERS = await A.orders(true); render(); A.toast('Yangilandi', 'ok'); };
  A.$('#csv').onclick = () => {
    const rows = [['№', 'Sana', 'Holat', 'Ism', 'Telefon', 'Tasdiqlangan tel', 'Email', 'Manzil', 'To\'lov', 'Xarita', 'Mahsulotlar', 'Jami']].concat(filtered().map(o => [o.number, A.dt(o.created), A.ST[o.status], o.name, o.phone, (o.user || {}).verified_phone || '', (o.user || {}).email || '', o.address, o.payment === 'click' ? 'Click' : 'Naqd', o.geo ? 'https://www.google.com/maps?q=' + o.geo.lat + ',' + o.geo.lng : '', (o.items || []).map(i => A.nm(i.name) + (i.opts ? ' (' + i.opts.map(x => A.nm(x.value)).join(', ') + ')' : '') + ' x' + i.qty).join('; '), o.total]));
    const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'buyurtmalar.csv'; a.click();
  };
  render();
  if (openN) { const o = ORDERS.find(x => String(x.number) === openN); if (o) detail(o); }
  setInterval(async () => { if (document.hidden || document.querySelector('.ovl')) return; try { ORDERS = await A.orders(true); render(); } catch (e) {} }, 45000);
});
