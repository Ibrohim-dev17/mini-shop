/* ==========================================================================
   ADMIN: BANNERLAR (bosh sahifadagi katta aylanuvchi rasmlar)
   Banner bosilganda: kategoriyaga, ichki kategoriyaga, mahsulotga o'tishi yoki hech qayerga o'tmasligi mumkin.
   ========================================================================== */
Admin.page('banners', 'Bannerlar', async app => {
  const A = Admin;
  let C = await A.catalog(true);
  app.innerHTML = `<div class="pagehead"><h2>Bannerlar</h2><button class="btn primary right" id="add">${A.ic('plus')}<span>Banner qo'shish</span></button></div>
    <div class="note">Bannerlar saytda shu tartibda aylanadi. Tartibni o'zgartirish: kompyuterda tortib qo'ying, telefonda ↑ ↓ ni bosing. Ko'rsatish muddatini belgilasangiz, muddat tugagach banner o'zi yo'qoladi.</div>
    <div class="list" id="list"></div>`;
  const status = b => { const now = Date.now(), s = b.start_at && Date.parse(b.start_at), e = b.end_at && Date.parse(b.end_at); if (s && now < s) return ['info', 'Rejalashtirilgan']; if (e && now > e) return ['danger', 'Muddati tugagan']; return ['ok', 'Faol']; };
  const target = b => b.product_id ? 'Mahsulot: ' + A.esc(A.nm((C.products.find(p => String(p.id) === String(b.product_id)) || {}).name) || '#' + b.product_id) : b.category_id ? 'Kategoriya: ' + A.esc(A.catName(C, b.category_id)) + (b.subcat ? ' → ' + A.esc(b.subcat) : '') : 'Hech qayerga o\'tmaydi';
  function render() {
    const L = C.banners.filter(b => !b.archived);
    A.$('#list').innerHTML = L.length ? L.map((b, i) => { const st = status(b); return `
      <div class="item" data-id="${b.id}" draggable="true">
        <div style="width:160px;aspect-ratio:16/7;border-radius:10px;background:var(--surface2) center/cover url('${A.esc(b.img)}');flex-shrink:0;background-image:url('${A.esc(b.img)}')"></div>
        <div class="body"><div class="ttl"><span class="badge ${st[0]}">${st[1]}</span></div><div class="meta">${target(b)}</div><div class="meta">${b.start_at ? A.dt(b.start_at) : 'darhol'} → ${b.end_at ? A.dt(b.end_at) : 'cheksiz'}</div></div>
        <div class="acts"><button class="btn sm icon" data-up ${i === 0 ? 'disabled' : ''}>${A.ic('up')}</button><button class="btn sm icon" data-dn ${i === L.length - 1 ? 'disabled' : ''}>${A.ic('down')}</button><button class="btn sm soft icon" data-edit title="Tahrirlash">${A.ic('edit')}</button><button class="btn sm icon" data-arch title="Arxivga">${A.ic('archive')}</button><button class="btn sm icon danger" data-del title="O'chirish">${A.ic('trash')}</button></div>
      </div>`; }).join('') : '<div class="empty"><b>Banner yo\'q</b>Birinchi bannerni qo\'shing (tavsiya: keng rasm, 1600×700)</div>';
  }
  async function reload() { C = await A.catalog(true); render(); }
  render();
  A.sortable(A.$('#list'), '.item', async ids => { await A.reorder('banner', ids); A.toast('Tartib saqlandi', 'ok'); reload(); });
  A.$('#add').onclick = () => editor(null);
  app.addEventListener('click', async e => {
    const it = e.target.closest('.item'); if (!it) return; const b = C.banners.find(x => String(x.id) === it.dataset.id); if (!b) return;
    if (e.target.closest('[data-edit]')) editor(b);
    else if (e.target.closest('[data-up]') || e.target.closest('[data-dn]')) { await A.reorder('banner', A.moveId(C.banners.filter(x => !x.archived).map(x => x.id), b.id, e.target.closest('[data-up]') ? -1 : 1)); reload(); }
    else if (e.target.closest('[data-arch]')) { await A.archive('banner', b.id, true); A.toast('Arxivga olindi', 'ok'); reload(); }
    else if (e.target.closest('[data-del]')) { if (await A.confirm("Banner butunlay o'chirilsinmi?\nKeyin kerak bo'lsa, ARXIVGA oling.", { danger: true, ok: "O'chirish" })) { await A.remove('banner', b.id); A.toast("O'chirildi", 'ok'); reload(); } }
  });

  function editor(b) {
    const isNew = !b; b = b || {}; const img = A.imgs({ value: b.img ? [b.img] : [], shape: 'wide', maxPx: 1600 }); const imgRu = A.imgs({ value: b.img_ru ? [b.img_ru] : [], shape: 'wide', maxPx: 1600 });
    const mode0 = b.product_id ? 'product' : b.category_id ? 'category' : 'none'; let prod = b.product_id || null;
    const body = document.createElement('div');
    body.innerHTML = `<div id="clb"></div><div class="fld" data-lg="uz"><label>Banner rasmi (o'zbekcha) *</label><div id="im"></div><div class="hint">Keng (gorizontal) rasm yaxshi: 1600×600 o'lchamga avtomatik kesiladi va siqiladi. Rasm galereyadan olinadi.</div></div>
      <div class="fld" data-lg="ru"><label>Banner rasmi (ruscha)</label><div id="imr"></div><div class="hint">Rus tilida alohida rasm bo'lsa, shu yerga yuklang. Bo'sh qolsa, sayt rus tilida ham o'zbekcha rasmni ko'rsatadi.</div></div>
      <div class="fld"><label>Bosilganda qayerga o'tsin?</label><select class="sel" id="mode"><option value="none">Hech qayerga</option><option value="category">Kategoriyaga</option><option value="product">Mahsulotga</option></select></div>
      <div id="catBox" class="grid2"><div class="fld"><label>Kategoriya</label><select class="sel" id="cat">${C.categories.filter(c => !c.archived).map(c => `<option value="${c.id}">${A.esc(A.nm(c.name))}</option>`).join('')}</select></div><div class="fld"><label>Ichki kategoriya</label><select class="sel" id="sub"></select></div></div>
      <div id="prodBox" class="fld"><label>Mahsulot</label><div class="inputrow"><div class="inp" id="pname" style="display:flex;align-items:center"></div><button class="btn" type="button" id="pick">Tanlash</button></div></div>
      <div class="grid2"><div class="fld"><label>Ko'rsatish boshlanishi</label><input class="inp" type="datetime-local" id="s" value="${A.toLocalInput(b.start_at)}"><div class="hint">Bo'sh = darhol</div></div><div class="fld"><label>Ko'rsatish tugashi</label><input class="inp" type="datetime-local" id="e" value="${A.toLocalInput(b.end_at)}"><div class="hint">Bo'sh = cheksiz</div></div></div>`;
    A.$('#im', body).appendChild(img.el); A.$('#imr', body).appendChild(imgRu.el); A.$('#clb', body).appendChild(A.clBar());
    const mode = A.$('#mode', body), cat = A.$('#cat', body), sub = A.$('#sub', body);
    mode.value = mode0; if (b.category_id) cat.value = b.category_id;
    function fillSub() { const c = C.categories.find(x => String(x.id) === cat.value); sub.innerHTML = '<option value="">- butun kategoriya -</option>' + ((c && c.subcats) || []).filter(s => !s.archived).map(s => `<option ${A.nm(s.name) === b.subcat ? 'selected' : ''}>${A.esc(A.nm(s.name))}</option>`).join(''); }
    cat.onchange = () => { b = Object.assign({}, b, { subcat: '' }); fillSub(); }; fillSub();
    const pn = () => { const p = prod && C.products.find(x => String(x.id) === String(prod)); A.$('#pname', body).textContent = p ? A.nm(p.name) : 'Tanlanmagan'; };
    const vis = () => { A.$('#catBox', body).style.display = mode.value === 'category' ? '' : 'none'; A.$('#prodBox', body).style.display = mode.value === 'product' ? '' : 'none'; };
    mode.onchange = vis; vis(); pn();
    A.$('#pick', body).onclick = async () => { const r = await A.pickProducts({ selected: prod ? [prod] : [] }); if (r) { prod = r[0]; pn(); } };
    A.modal({ title: isNew ? 'Yangi banner' : 'Bannerni tahrirlash', body, wide: true, sticky: true, buttons: [{ text: 'Bekor qilish' }, { text: isNew ? "Qo'shish" : 'Saqlash', cls: 'primary', fn: async () => {
      const mainImg = img.get()[0] || imgRu.get()[0]; if (!mainImg) { A.toast('Banner rasmini yuklang', 'err'); return false; }
      if (mode.value === 'product' && !prod) { A.toast('Mahsulotni tanlang', 'err'); return false; }
      await A.save('banner', { id: b.id, img: mainImg, img_ru: imgRu.get()[0] && imgRu.get()[0] !== mainImg ? imgRu.get()[0] : '', product_id: mode.value === 'product' ? prod : null, category_id: mode.value === 'category' ? Number(cat.value) : null, subcat: mode.value === 'category' ? sub.value : '', start_at: A.fromLocalInput(A.$('#s', body).value), end_at: A.fromLocalInput(A.$('#e', body).value) });
      A.toast('Saqlandi. Sayt yangilandi', 'ok'); await reload();
    } }] });
  }
});
