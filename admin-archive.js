/* ==========================================================================
   ADMIN: ARXIV
   Arxivga olingan mahsulot, kategoriya, banner va storislar saytda ko'rinmaydi, lekin o'chib ketmaydi.
   Keyin qaytadan yozib o'tirmasdan "Tiklash" tugmasi bilan saytga qaytarasiz.
   ========================================================================== */
Admin.page('archive', 'Arxiv', async app => {
  const A = Admin;
  let C = await A.catalog(true), tab = new URLSearchParams(location.search).get('t') || 'products';
  const TABS = [['products', 'Mahsulotlar'], ['categories', 'Kategoriyalar'], ['banners', 'Bannerlar'], ['stories', 'Storislar']];
  const TYPE = { products: 'product', categories: 'category', banners: 'banner', stories: 'story' };
  app.innerHTML = `<div class="note">Arxivdagi narsalar saytda ko'rinmaydi. <b>Tiklash</b> bosilsa, ma'lumotlari bilan darhol saytga qaytadi.</div><div class="chips" id="tabs"></div><div class="list" id="list" style="margin-top:12px"></div>`;
  function items() {
    if (tab === 'products') return C.products.filter(p => p.archived).map(p => ({ id: p.id, type: 'product', title: A.nm(p.name), meta: p.price + ' · ' + A.catName(C, p.category_id), img: A.thumb(p), at: p.archived_at }));
    if (tab === 'categories') { const out = C.categories.filter(c => c.archived).map(c => ({ id: c.id, type: 'category', title: A.nm(c.name), meta: 'Kategoriya · ' + C.products.filter(p => String(p.category_id) === String(c.id)).length + ' ta mahsulot', img: c.img || '', at: c.archived_at }));
      C.categories.forEach(c => (c.subcats || []).filter(s => s.archived).forEach(s => out.push({ id: s.id, sub_of: c.id, type: 'category', title: A.nm(s.name), meta: 'Ichki kategoriya · ' + A.nm(c.name.uz ? c.name : { uz: c.name }), img: s.img || '', at: s.archived_at }))); return out; }
    if (tab === 'banners') return C.banners.filter(b => b.archived).map(b => ({ id: b.id, type: 'banner', title: 'Banner', meta: b.product_id ? 'Mahsulotga' : b.category_id ? 'Kategoriyaga' : '', img: b.img, at: b.archived_at, wide: true }));
    return C.stories.filter(s => s.archived).map(s => ({ id: s.id, type: 'story', title: A.nm(s.title) || 'Storis', meta: s.type === 'video' ? 'Video' : 'Rasm', img: s.type === 'video' ? '' : s.media, at: s.archived_at }));
  }
  function render() {
    A.$('#tabs').innerHTML = TABS.map(t => `<button class="chip ${t[0] === tab ? 'on' : ''}" data-t="${t[0]}">${t[1]} <span class="badge">${(t[0] === 'categories' ? C.categories.filter(c => c.archived).length + C.categories.reduce((n, c) => n + (c.subcats || []).filter(s => s.archived).length, 0) : C[t[0]].filter(x => x.archived).length)}</span></button>`).join('');
    const L = items();
    A.$('#list').innerHTML = L.length ? L.map(x => `<div class="item" data-id="${A.esc(x.id)}" data-sub="${A.esc(x.sub_of || '')}"><div style="width:${x.wide ? 120 : 52}px;height:${x.wide ? 54 : 64}px;border-radius:9px;background:var(--surface2) center/cover;flex-shrink:0;background-image:url('${A.esc(x.img)}')"></div><div class="body"><div class="ttl">${A.esc(x.title)}</div><div class="meta">${A.esc(x.meta)}${x.at ? ' · arxivga olingan: ' + A.dt(x.at) : ''}</div></div><div class="acts">${tab === 'products' ? '<button class="btn sm" data-restore-edit>Tahrirlab tiklash</button>' : ''}<button class="btn sm primary" data-restore>${A.ic('restore')}<span>Tiklash</span></button><button class="btn sm icon danger" data-del title="Butunlay o'chirish">${A.ic('trash')}</button></div></div>`).join('') : '<div class="empty"><b>Arxiv bo\'sh</b>Bu bo\'limda arxivga olingan narsa yo\'q</div>';
  }
  render();
  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; render(); return; }
    const it = e.target.closest('.item'); if (!it) return; const id = it.dataset.id, sub = it.dataset.sub, type = TYPE[tab];
    try {
      if (e.target.closest('[data-restore-edit]')) { const p = C.products.find(x => String(x.id) === String(id)); if (p) { try { sessionStorage.setItem('restore_item', JSON.stringify(p)); } catch (x) {} location.href = 'admin-products.html?restore=1'; } return; }
      if (e.target.closest('[data-restore]')) { await A.archive(type, id, false, sub || undefined); A.toast('Tiklandi. Saytda ko\'rinadi', 'ok'); C = await A.catalog(true); render(); }
      else if (e.target.closest('[data-del]')) {
        if (sub) { A.toast("Ichki kategoriyani 'Kategoriyalar' sahifasidan o'chiring", 'err'); return; }
        if (await A.confirm("Butunlay o'chirilsinmi?\nBuni qaytarib bo'lmaydi.", { danger: true, ok: "O'chirish" })) { await A.remove(type, id); A.toast("O'chirildi", 'ok'); C = await A.catalog(true); render(); }
      }
    } catch (x) { A.toast(x.message, 'err'); }
  });
});
