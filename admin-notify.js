/* ==========================================================================
   ADMIN: XABAR SO'RASHLAR ("Kelganda xabar qil")
   Mijoz qolmagan mahsulotdagi "Kelganda xabar qilish" tugmasini bossa, shu yerda ko'rinadi:
   kim so'radi, qaysi mahsulot, hozir omborda bormi va unga xabar berildimi.
   Mahsulot omborga qaytganda mijozga Telegram/email orqali o'zi xabar yuboriladi (har 5 daqiqada tekshiriladi).
   ========================================================================== */
Admin.page('notify', "Xabar so'rovlari", async app => {
  const A = Admin;
  let L = await A.api('/api/admin/notify'), filter = 'all';
  const stLbl = x => x.status === 'notified' ? ['ok', 'Xabar berildi'] : ['warn', 'Kutmoqda'];
  function render() {
    const f = L.filter(x => filter === 'all' || (filter === 'pending' ? x.status !== 'notified' : x.status === 'notified'));
    const by = {}; f.forEach(x => { (by[x.product_id] = by[x.product_id] || { id: x.product_id, name: x.product_name, img: x.product_image, stock: x.stock_now, gone: x.product_gone, rows: [] }).rows.push(x); });
    const groups = Object.values(by).sort((a, b) => b.rows.length - a.rows.length);
    const pend = L.filter(x => x.status !== 'notified').length;
    A.$('#tabs').innerHTML = [['all', 'Hammasi', L.length], ['pending', 'Kutmoqda', pend], ['notified', 'Xabar berilgan', L.length - pend]].map(([k, t, n]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${t} (${n})</button>`).join('');
    A.$('#list').innerHTML = groups.length ? groups.map(g => `<div class="card" style="margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><img class="th sq" style="width:48px;height:60px;border-radius:10px;object-fit:cover" src="${A.esc(g.img || '')}" alt=""><div style="flex:1;min-width:0"><div class="ttl" style="font-weight:700">${A.esc(A.nm(g.name) || ('#' + g.id))}</div><div class="small muted">${g.rows.length} kishi so'ragan · ${g.gone ? '<span class="badge danger">mahsulot arxivda/o\'chirilgan</span>' : g.stock > 0 ? `<span class="badge ok">Omborda: ${g.stock} dona</span>` : '<span class="badge danger">Omborda yo\'q</span>'}</div></div>${g.gone ? '' : `<a class="btn sm" href="admin-stock.html?q=${encodeURIComponent(A.nm(g.name))}">Omborga</a>`}</div>
      ${g.rows.map(x => `<div class="stat-line" data-id="${A.esc(x.id)}" style="align-items:center;gap:8px;flex-wrap:wrap"><span style="flex:1;min-width:150px"><b>${A.esc(x.name || 'Mijoz')}</b> ${x.username ? '<span class="muted small">@' + A.esc(x.username) + '</span>' : ''}<div class="small muted">${A.esc(x.phone || x.email || '')} · ${A.dt(x.created)}${x.notified_at ? ' · xabar: ' + A.dt(x.notified_at) : ''}</div></span><span class="badge ${stLbl(x)[0]}">${stLbl(x)[1]}</span>
        <a class="btn sm icon" title="Chat" href="admin-chat.html?uid=${encodeURIComponent(x.uid)}">${A.ic('chat')}</a>${g.stock > 0 && !g.gone ? `<button class="btn sm soft" data-send>Xabar yuborish</button>` : ''}<button class="btn sm icon danger" data-del title="Olib tashlash">${A.ic('trash')}</button></div>`).join('')}
    </div>`).join('') : '<div class="empty"><b>So\'rov yo\'q</b>Mijoz qolmagan mahsulotda "Kelganda xabar qilish" tugmasini bossa, shu yerda ko\'rinadi</div>';
  }
  app.innerHTML = `<div class="note">Mijoz qolmagan mahsulotga "Kelganda xabar qilish" ni bosganda shu yerda paydo bo'ladi. Mahsulot omborga qaytganda mijozga o'zi xabar boradi va holati "Xabar berildi" bo'ladi.</div><div class="scrollx" id="tabs"></div><div id="list"></div>`;
  render();
  app.addEventListener('click', async e => {
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; render(); return; }
    const row = e.target.closest('[data-id]'); if (!row) return; const id = row.dataset.id;
    if (e.target.closest('[data-del]')) { await A.api('/api/admin/notify/remove', 'POST', { id }); L = L.filter(x => x.id !== id); render(); A.refreshCounts(); }
    else if (e.target.closest('[data-send]')) { try { await A.api('/api/admin/notify/send', 'POST', { id }); A.toast('Xabar yuborildi', 'ok'); L = await A.api('/api/admin/notify'); render(); A.refreshCounts(); } catch (x) { A.toast(x.message, 'err'); } }
  });
});
