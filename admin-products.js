/* ==========================================================================
   ADMIN: MAHSULOTLAR: ro'yxat, qo'shish, tahrirlash, nusxalash, arxivlash, o'chirish
   Tuzilishi:  1) ro'yxat va filtrlar   2) tahrirlash oynasi (forma)   3) saqlash
   MUHIM: rang, o'lcham, voltaj, xotira va h.k. tayyor emas: "Xususiyatlar" bo'limida SIZ yaratasiz (yoki tayyor to'plamni tanlaysiz).
          Saytda ular tanlash tugmalari bo'lib chiqadi, ombor qoldig'i esa har bir kombinatsiya uchun alohida yuritiladi.
   Saytga ta'siri: saqlangan zahoti sayt yangi ma'lumotni oladi (database.json o'rniga admin katalogi ishlatiladi).
   ========================================================================== */
Admin.page('products', 'Mahsulotlar', async app => {
  const A = Admin;
  let C = await A.catalog(true);
  const qp = new URLSearchParams(location.search);
  let fq = qp.get('q') || '', fcat = '', fstock = '';

  /* ---------- 1. RO'YXAT ---------- */
  app.innerHTML = `
  <div class="toolbar">
    <input class="inp" id="q" placeholder="Qidirish: nomi yoki raqami..." value="${A.esc(fq)}">
    <select class="sel" id="fc"></select>
    <select class="sel" id="fs"><option value="">Qoldiq: hammasi</option><option value="low">Kam qolgan (3 tagacha)</option><option value="zero">Tugagan</option></select>
    <button class="btn primary" id="add">${A.ic('plus')}<span>Mahsulot qo'shish</span></button>
  </div>
  <div class="small muted" id="count"></div>
  <div class="pgrid" id="grid"></div>`;
  const stockBadge = p => p.stock <= 0 ? '<span class="badge danger">Tugagan</span>' : p.stock <= 3 ? `<span class="badge warn">${p.stock} dona</span>` : `<span class="badge ok">${p.stock} dona</span>`;
  function fillCats() { A.$('#fc').innerHTML = '<option value="">Barcha kategoriyalar</option>' + C.categories.filter(c => !c.archived).map(c => `<option value="${c.id}" ${String(fcat) === String(c.id) ? 'selected' : ''}>${A.esc(A.nm(c.name))}</option>`).join(''); }
  function render() {
    const s = fq.trim().toLowerCase();
    const L = C.products.filter(p => !p.archived && (!fcat || String(p.category_id) === String(fcat)) && (!s || (A.nm(p.name) + ' ' + ((p.name && (p.name.uz + ' ' + p.name.ru)) || '')).toLowerCase().includes(s) || String(p.id) === s) && (!fstock || (fstock === 'zero' ? p.stock <= 0 : p.stock > 0 && p.stock <= 3)));
    A.$('#count').textContent = L.length + ' ta mahsulot' + (C.products.some(p => p.archived) ? ' (arxivda: ' + C.products.filter(p => p.archived).length + ')' : '');
    A.$('#grid').innerHTML = L.length ? L.map(p => `
      <div class="pcard" data-id="${p.id}">
        <div class="im" style="background-image:url('${A.esc(A.thumb(p))}')">${stockBadge(p)}</div>
        <div class="bd"><div class="nm">${A.esc(A.nm(p.name))}</div><div class="pr">${A.esc(p.price)} ${p.oldPrice ? `<s class="muted small" style="font-weight:400">${A.esc(p.oldPrice)}</s>` : ''}</div><div class="small muted">${A.esc(A.catName(C, p.category_id))}${p.subcat ? ' · ' + A.esc(A.nm(p.subcat)) : ''}</div></div>
        <div class="ft"><button class="btn sm soft" style="flex:1" data-edit>${A.ic('edit')}<span>Tahrirlash</span></button><button class="btn sm icon" data-dup title="Nusxa olish">${A.ic('copy')}</button><button class="btn sm icon" data-arch title="Arxivga">${A.ic('archive')}</button><button class="btn sm icon danger" data-del title="O'chirish">${A.ic('trash')}</button></div>
      </div>`).join('') : '<div class="empty" style="grid-column:1/-1"><b>Mahsulot topilmadi</b>Yangi mahsulot qo\'shing yoki filtrni o\'zgartiring</div>';
  }
  async function reload() { C = await A.catalog(true); render(); }
  fillCats(); render();
  A.$('#q').addEventListener('input', A.debounce(e => { fq = e.target.value; render(); }, 150));
  A.$('#fc').onchange = e => { fcat = e.target.value; render(); };
  A.$('#fs').onchange = e => { fstock = e.target.value; render(); };
  A.$('#add').onclick = () => editor(null);
  app.addEventListener('click', async e => {
    const card = e.target.closest('.pcard'); if (!card) return; const p = C.products.find(x => String(x.id) === card.dataset.id); if (!p) return;
    if (e.target.closest('[data-edit]') || e.target.closest('.im')) editor(p);
    else if (e.target.closest('[data-dup]')) { const c = JSON.parse(JSON.stringify(p)); delete c.id; c.name = { uz: (p.name.uz || A.nm(p.name)) + ' (nusxa)', ru: (p.name.ru || A.nm(p.name)) + ' (копия)' }; await A.save('product', c); A.toast('Nusxa yaratildi', 'ok'); reload(); }
    else if (e.target.closest('[data-arch]')) { await A.archive('product', p.id, true); A.toast('Arxivga olindi. Saytda ko\'rinmaydi, arxivdan qaytarish mumkin', 'ok'); reload(); }
    else if (e.target.closest('[data-del]')) { if (await A.confirm('"' + A.nm(p.name) + '" butunlay o\'chirilsinmi?\nQayta tiklab bo\'lmaydi. Keyin kerak bo\'lishi mumkin bo\'lsa, ARXIVGA oling.', { danger: true, ok: "O'chirish" })) { await A.remove('product', p.id); A.toast("O'chirildi", 'ok'); reload(); } }
  });

  /* ---------- 2. TAHRIRLASH OYNASI ---------- */
  const slug = (s, pre) => (String(s || '').replace(/['`ʻʼ‘’]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')) || pre;
  const sz = (list, ru) => list.split(',').map(x => ({ nu: x.trim(), nr: x.trim(), id: '', hex: '', imgs: null }));
  // Tayyor to'plamlar (faqat qulaylik uchun: xohlasangiz o'zgartirasiz yoki o'zingiz yaratasiz)
  const COLOR_AX = () => ({ key: 'color', nu: 'Rang', nr: 'Цвет', type: 'color', values: [] });
  const PRESETS = {
    'Kiyim': () => [COLOR_AX(), { key: 'size', nu: "O'lcham", nr: 'Размер', type: 'text', values: sz('XS,S,M,L,XL,XXL') }],
    'Poyabzal': () => [COLOR_AX(), { key: 'size', nu: "O'lcham", nr: 'Размер', type: 'text', values: sz('36,37,38,39,40,41,42,43,44') }],
    'Bolalar kiyimi': () => [COLOR_AX(), { key: 'size', nu: 'Yosh', nr: 'Возраст', type: 'text', values: sz('2-3 yosh,4-5 yosh,6-7 yosh,8-9 yosh,10-12 yosh').map(v => (v.nr = v.nu.replace('yosh', 'лет'), v)) }],
    'Elektronika (voltaj)': () => [COLOR_AX(), { key: 'voltage', nu: 'Voltaj', nr: 'Напряжение', type: 'text', values: sz('110V,220V') }],
    'Telefon / planshet': () => [COLOR_AX(), { key: 'memory', nu: 'Xotira', nr: 'Память', type: 'text', values: sz('64GB,128GB,256GB,512GB') }],
    'Hajm (kosmetika, ichimlik)': () => [{ key: 'volume', nu: 'Hajmi', nr: 'Объём', type: 'text', values: [{ nu: '50 ml', nr: '50 мл', id: '', hex: '', imgs: null }, { nu: '100 ml', nr: '100 мл', id: '', hex: '', imgs: null }, { nu: '250 ml', nr: '250 мл', id: '', hex: '', imgs: null }] }],
    "Og'irlik (oziq-ovqat)": () => [{ key: 'weight', nu: "Og'irligi", nr: 'Вес', type: 'text', values: [{ nu: '500 g', nr: '500 г', id: '', hex: '', imgs: null }, { nu: '1 kg', nr: '1 кг', id: '', hex: '', imgs: null }, { nu: '5 kg', nr: '5 кг', id: '', hex: '', imgs: null }] }],
  };
  const BIZ = { clothes: 'Kiyim', shoes: 'Poyabzal', kids: 'Bolalar kiyimi', electronics: 'Elektronika (voltaj)', phones: 'Telefon / planshet', cosmetics: 'Hajm (kosmetika, ichimlik)', food: "Og'irlik (oziq-ovqat)" };
  const ATTR_SUGG = [['Material', 'Материал'], ['Mamlakat', 'Страна'], ['Fasl', 'Сезон'], ['Brend', 'Бренд'], ['Kafolat', 'Гарантия'], ['Quvvat', 'Мощность'], ['Rangi', 'Цвет']];
  let uidN = 0; const newUid = () => '~' + (++uidN);

  function editor(p) {
    const isNew = !p; p = p || {};
    // --- mavjud mahsulotni "xususiyatlar" shakliga o'tkazamiz (eski: colors/sizes) ---
    const mkVal = (v, type) => ({ id: v.id != null ? String(v.id) : '', _u: newUid(), nu: (v.name && v.name.uz) || (typeof v.name === 'string' ? v.name : '') || '', nr: (v.name && v.name.ru) || '', hex: v.hex || '#2b2b2b', imgs: type === 'color' ? A.imgs({ value: v.images || [], multiple: true, max: 8 }) : null });
    let axes = [];
    if (p.options && p.options.length) axes = p.options.map(a => ({ key: a.key, nu: (a.name && a.name.uz) || '', nr: (a.name && a.name.ru) || '', type: a.type === 'color' ? 'color' : 'text', values: (a.values || []).map(v => mkVal(v, a.type === 'color' ? 'color' : 'text')) }));
    else {
      if (p.colors && p.colors.length) axes.push({ key: 'color', nu: 'Rang', nr: 'Цвет', type: 'color', values: p.colors.map(c => mkVal(c, 'color')) });
      if (p.sizes && p.sizes.length) axes.push({ key: 'size', nu: "O'lcham", nr: 'Размер', type: 'text', values: p.sizes.map(z => mkVal({ id: z, name: { uz: z, ru: z } }, 'text')) });
    }
    let vals = {};
    if (p.variant_stock) {   // eski kalitlar "rang|o'lcham" (bo'sh qismlar bilan) -> yangi kalit (faqat mavjud xususiyatlar)
      const legacy = !(p.options && p.options.length), hasC = !!(p.colors && p.colors.length), hasS = !!(p.sizes && p.sizes.length);
      Object.keys(p.variant_stock).forEach(k => { let nk = k; if (legacy) { const [c, z] = k.split('|'); nk = [hasC ? c : null, hasS ? z : null].filter(x => x != null).join('|'); } vals[nk] = p.variant_stock[k]; });
    }
    // eski mahsulotda ma'lumotlar jadvali: material/mamlakat/fasl
    let attrs = (p.attrs || []).map(x => ({ nu: (x.name && x.name.uz) || '', nr: (x.name && x.name.ru) || '', vu: (x.value && x.value.uz) || '', vr: (x.value && x.value.ru) || '' }));
    if (!p.attrs) [['material', 'Material', 'Материал'], ['country', 'Mamlakat', 'Страна'], ['season', 'Fasl', 'Сезон']].forEach(([k, a, b]) => { if (p[k] && (p[k].uz || p[k].ru)) attrs.push({ nu: a, nr: b, vu: p[k].uz || '', vr: p[k].ru || '' }); });
    const st = { stock: p.stock || 0 };
    if (isNew && !axes.length) { const pre = PRESETS[BIZ[(C.settings || {}).business_type]]; if (pre) axes = pre(); }
    axes.forEach(a => a.values.forEach(v => { if (!v._u) v._u = newUid(); if (a.type === 'color' && !v.imgs) v.imgs = A.imgs({ value: [], multiple: true, max: 8 }); if (!v.hex) v.hex = '#2b2b2b'; }));

    const main = A.imgs({ value: p.images || [], multiple: true, max: 10 });
    const catOpts = C.categories.map(c => `<option value="${c.id}">${A.esc(A.nm(c.name))}${c.archived ? ' (arxivda)' : ''}</option>`).join('');
    const body = document.createElement('div');
    body.innerHTML = `
      <div id="clb"></div>
      <div class="fld"><label>Rasmlar</label><div id="mImgs"></div><div class="hint">Birinchi rasm mahsulot kartasida ko'rinadi. Rang bo'yicha alohida rasmlarni pastdagi "Xususiyatlar" -> rang ichida qo'shing.</div></div>
      ${A.bi({ id: 'n', label: 'Nomi', uz: p.name && p.name.uz, ru: p.name && p.name.ru, ph: "Masalan: Yozgi gulli ko'ylak", max: 120 })}
      <div class="grid3">
        <div class="fld"><label>Sotuv narxi (so'm) *</label><input class="inp" id="pr" inputmode="numeric" value="${p.price ? A.num(p.price) : ''}" placeholder="120000"></div>
        <div class="fld"><label>Eski narx (chegirma uchun)</label><input class="inp" id="op" inputmode="numeric" value="${p.oldPrice ? A.num(p.oldPrice) : ''}" placeholder="150000"><div class="hint" id="disc"></div></div>
        <div class="fld"><label>Tan narx (o'z narxingiz)</label><input class="inp" id="co" inputmode="numeric" value="${p.cost ? p.cost : ''}" placeholder="80000"><div class="hint" id="marg">Mijozga ko'rinmaydi. Foyda hisobi uchun.</div></div>
      </div>
      <div class="grid2"><div class="fld"><label>Kategoriya *</label><select class="sel" id="cat">${catOpts}</select></div>
        <div class="fld"><label>Ichki kategoriya</label><select class="sel" id="sub"></select></div></div>

      <div class="fld"><label>Xususiyatlar (mijoz tanlaydigan: rang, o'lcham, voltaj...)</label>
        <div class="presetbar" id="presets"></div>
        <div id="axes"></div>
        <button class="btn sm" type="button" id="addAx">${A.ic('plus')}<span>Yangi xususiyat qo'shish</span></button>
        <div class="hint">Masalan: "Rang", "O'lcham", "Voltaj", "Xotira", "Hajm". Har bir xususiyatga qiymatlar qo'shasiz (qizil, M, 220V...). Mijoz saytda shularni tanlaydi. Hech narsa tanlanmaydigan mahsulotda bo'sh qoldiring.</div></div>
      <div class="fld"><label>Ombordagi qoldiq</label><div id="stk"></div></div>

      <div class="fld"><label>Qo'shimcha ma'lumotlar (mahsulot sahifasida jadval bo'lib chiqadi)</label><div id="attrs"></div>
        <div class="chips" id="attrSugg" style="margin:6px 0"></div>
        <button class="btn sm" type="button" id="addAttr">${A.ic('plus')}<span>Qator qo'shish</span></button></div>
      ${A.bi({ id: 'd', label: 'Tavsif', uz: p.description && p.description.uz, ru: p.description && p.description.ru, area: true, max: 3000 })}
      <div class="grid2"><div class="fld"><label>"Original" belgisi</label><select class="sel" id="bd"><option value="original" ${(p.badgeType || 'original') === 'original' ? 'selected' : ''}>Ko'rsatilsin</option><option value="none" ${p.badgeType === 'none' ? 'selected' : ''}>Ko'rsatilmasin</option></select></div>
        <div class="fld"><label>Ichki izoh (faqat siz ko'rasiz)</label><input class="inp" id="nt" value="${A.esc(p.note || '')}" placeholder="Masalan: Ahmad aka'dan olingan"></div></div>`;
    A.$('#clb', body).appendChild(A.clBar());
    A.$('#mImgs', body).appendChild(main.el);

    const catSel = A.$('#cat', body), subSel = A.$('#sub', body);
    if (p.category_id) catSel.value = p.category_id;
    function fillSub() { const c = C.categories.find(x => String(x.id) === catSel.value); const cur = (p.subcat && (p.subcat.uz || A.nm(p.subcat))) || ''; subSel.innerHTML = '<option value="">- tanlanmagan -</option>' + ((c && c.subcats) || []).map(s => `<option value="${A.esc(s.name.uz || A.nm(s.name))}" data-ru="${A.esc((s.name && s.name.ru) || '')}" ${(s.name.uz || A.nm(s.name)) === cur ? 'selected' : ''}>${A.esc(A.nm(s.name))}${s.archived ? ' (arxivda)' : ''}</option>`).join(''); }
    catSel.onchange = () => { p = Object.assign({}, p, { subcat: null }); fillSub(); }; fillSub();

    function money() {
      const pr = A.num(A.$('#pr', body).value), op = A.num(A.$('#op', body).value), co = A.num(A.$('#co', body).value);
      A.$('#disc', body).textContent = op > pr && pr ? 'Chegirma: -' + Math.round((op - pr) / op * 100) + '%' : (op && op <= pr ? "Eski narx sotuv narxidan katta bo'lishi kerak" : '');
      A.$('#marg', body).innerHTML = co && pr ? 'Foyda: <b style="color:' + (pr > co ? 'var(--ok)' : 'var(--danger)') + '">' + A.money(pr - co) + '</b> (' + Math.round((pr - co) / pr * 100) + '%)' : 'Mijozga ko\'rinmaydi. Foyda hisobi uchun.';
    }
    ['pr', 'op', 'co'].forEach(id => A.$('#' + id, body).addEventListener('input', money)); money();

    /* ----- Xususiyatlar yaratuvchi ----- */
    const vname = v => v.nu.trim() || v.nr.trim();
    const named = a => a.values.filter(vname);
    const activeAxes = () => axes.filter(a => (a.nu.trim() || a.nr.trim()) && named(a).length);
    function drawPresets() {
      A.$('#presets', body).innerHTML = '<span class="small muted" style="align-self:center">Tayyor to\'plam:</span>' + Object.keys(PRESETS).map(k => `<button type="button" class="chip" data-preset="${A.esc(k)}">${A.esc(k)}</button>`).join('') + (axes.length ? '<button type="button" class="chip" data-clear>Hammasini tozalash</button>' : '');
    }
    function drawAxes() {
      const box = A.$('#axes', body); box.innerHTML = '';
      axes.forEach((a, ai) => {
        const el = document.createElement('div'); el.className = 'axis';
        el.innerHTML = `<div class="ah"><div class="grow"><div class="grid2 bi keep">
            <div class="fld" data-lg="uz" style="margin:0"><label>Xususiyat nomi (o'zbekcha)</label><input class="inp sm" data-an="nu" value="${A.esc(a.nu)}" placeholder="Masalan: Voltaj"></div>
            <div class="fld" data-lg="ru" style="margin:0"><label>Xususiyat nomi (ruscha)</label><input class="inp sm" data-an="nr" value="${A.esc(a.nr)}" placeholder="Напр.: Напряжение"></div></div>
          <div style="margin-top:8px"><label class="small muted" style="margin-right:6px">Turi:</label><select class="sel" data-at style="width:auto;height:36px;display:inline-block"><option value="text" ${a.type === 'text' ? 'selected' : ''}>Matn / son (M, 220V, 128GB)</option><option value="color" ${a.type === 'color' ? 'selected' : ''}>Rang (rangli doira va rasm bilan)</option></select></div></div>
          <button type="button" class="btn sm icon danger" data-rmax title="Xususiyatni o'chirish">${A.ic('trash')}</button></div>
          <div class="vals"></div><button type="button" class="btn sm addv" data-addv>${A.ic('plus')}<span>Qiymat qo'shish</span></button>`;
        const vb = A.$('.vals', el);
        a.values.forEach((v, vi) => {
          const row = document.createElement('div'); row.className = 'vrow';
          row.innerHTML = (a.type === 'color' ? `<input type="color" value="${v.hex}" data-hex>` : '') + `<div class="grow"><div class="grid2 bi keep"><input class="inp sm" data-lg="uz" data-vn="nu" placeholder="${a.type === 'color' ? 'Rang nomi (Qizil)' : 'Qiymat (M, 220V...)'}" value="${A.esc(v.nu)}"><input class="inp sm" data-lg="ru" data-vn="nr" placeholder="ruscha" value="${A.esc(v.nr)}"></div>${a.type === 'color' ? '<div data-im style="margin-top:8px"></div>' : ''}</div><button type="button" class="btn sm icon danger" data-rmv title="O'chirish">${A.ic('trash')}</button>`;
          if (a.type === 'color') { A.$('[data-im]', row).appendChild(v.imgs.el); A.$('[data-hex]', row).oninput = e => { v.hex = e.target.value; }; }
          A.$$('[data-vn]', row).forEach(inp => { inp.oninput = e => { v[inp.dataset.vn] = e.target.value; drawStock(); }; });
          A.$('[data-rmv]', row).onclick = () => { a.values.splice(vi, 1); drawAxes(); drawStock(); };
          vb.appendChild(row);
        });
        A.$$('[data-an]', el).forEach(inp => { inp.oninput = e => { a[inp.dataset.an] = e.target.value; drawStock(); }; });
        A.$('[data-at]', el).onchange = e => { a.type = e.target.value; a.values.forEach(v => { if (a.type === 'color' && !v.imgs) v.imgs = A.imgs({ value: [], multiple: true, max: 8 }); }); drawAxes(); };
        A.$('[data-rmax]', el).onclick = () => { axes.splice(ai, 1); drawAxes(); drawPresets(); drawStock(); };
        A.$('[data-addv]', el).onclick = () => { a.values.push({ id: '', _u: newUid(), nu: '', nr: '', hex: '#2b2b2b', imgs: a.type === 'color' ? A.imgs({ value: [], multiple: true, max: 8 }) : null }); drawAxes(); const last = A.$$('[data-vn="nu"]', A.$$('.axis', body)[ai]).pop(); if (last) last.focus(); };
        box.appendChild(el);
      });
      drawPresets();
    }
    body.addEventListener('click', e => {
      const pr = e.target.closest('[data-preset]');
      if (pr) { axes = axes.concat(PRESETS[pr.dataset.preset]()).filter((a, i, arr) => arr.findIndex(b => b.key === a.key) === i); axes.forEach(a => a.values.forEach(v => { if (!v._u) v._u = newUid(); if (a.type === 'color' && !v.imgs) v.imgs = A.imgs({ value: [], multiple: true, max: 8 }); if (!v.hex) v.hex = '#2b2b2b'; })); drawAxes(); drawStock(); return; }
      if (e.target.closest('[data-clear]')) { axes = []; drawAxes(); drawStock(); }
    });
    A.$('#addAx', body).onclick = () => { axes.push({ key: '', nu: '', nr: '', type: 'text', values: [] }); drawAxes(); const f = A.$$('[data-an="nu"]', body).pop(); if (f) f.focus(); };

    /* ----- Ombor: bitta son yoki kombinatsiyalar jadvali ----- */
    const kid = v => v.id || v._u;
    function combos() {
      const ax = activeAxes(); let out = [[]]; ax.forEach(a => { const nx = []; out.forEach(o => named(a).forEach(v => { if (nx.length < 800) nx.push(o.concat([v])); })); out = nx; }); return ax.length ? out : [];
    }
    function drawStock() {
      const box = A.$('#stk', body); if (!box) return;
      A.$$('[data-k]', box).forEach(inp => { vals[inp.dataset.k] = A.num(inp.value); });
      const single = A.$('[data-single]', box); if (single) st.stock = A.num(single.value);
      const ax = activeAxes(), cb = combos();
      if (!ax.length) { box.innerHTML = `<input class="inp" data-single inputmode="numeric" value="${st.stock}" style="max-width:200px"><div class="hint">Tanlanadigan xususiyat bo'lmasa, bitta umumiy son.</div>`; return; }
      const lab = a => a.nu.trim() || a.nr.trim();
      const cell = key => `<td><input data-k="${A.esc(key)}" inputmode="numeric" value="${vals[key] != null ? vals[key] : 0}"></td>`;
      let table;
      if (ax.length === 1) table = `<table><tr><th class="lbl">${A.esc(lab(ax[0]))}</th><th>Soni</th></tr>${cb.map(c => `<tr><td class="lbl">${A.esc(vname(c[0]))}</td>${cell(kid(c[0]))}</tr>`).join('')}</table>`;
      else if (ax.length === 2) { const r = named(ax[0]), cc = named(ax[1]); table = `<table><tr><th></th>${cc.map(v => `<th>${A.esc(vname(v))}</th>`).join('')}</tr>${r.map(rv => `<tr><th class="lbl">${A.esc(vname(rv))}</th>${cc.map(v => cell(kid(rv) + '|' + kid(v))).join('')}</tr>`).join('')}</table>`; }
      else table = `<table><tr><th class="lbl">Kombinatsiya</th><th>Soni</th></tr>${cb.map(c => `<tr><td class="lbl">${A.esc(c.map(vname).join(' · '))}</td>${cell(c.map(kid).join('|'))}</tr>`).join('')}</table>`;
      box.innerHTML = `<div class="stkmat">${table}</div><div class="btns" style="margin-top:8px"><button type="button" class="btn sm" data-fill>Hammasiga bir xil son</button></div><div class="hint">Har bir kombinatsiya uchun nechta borligini yozing. 0 = "Qolmadi" (mijoz "Kelganda xabar qil" ni bosa oladi).</div>`;
      A.$('[data-fill]', box).onclick = () => { const v = prompt("Hamma katakka nechta qo'yilsin?", '5'); if (v == null) return; A.$$('[data-k]', box).forEach(i => { i.value = A.num(v); vals[i.dataset.k] = A.num(v); }); };
    }
    drawAxes(); drawStock();

    /* ----- Qo'shimcha ma'lumotlar jadvali ----- */
    function drawAttrs() {
      const box = A.$('#attrs', body); box.innerHTML = '';
      attrs.forEach((x, i) => {
        const row = document.createElement('div'); row.className = 'attrrow';
        row.innerHTML = `<div class="grow"><div class="grid2 bi keep"><input class="inp sm" data-lg="uz" data-f="nu" placeholder="Nomi (Material)" value="${A.esc(x.nu)}"><input class="inp sm" data-lg="ru" data-f="nr" placeholder="Название" value="${A.esc(x.nr)}"></div><div class="grid2 bi keep" style="margin-top:6px"><input class="inp sm" data-lg="uz" data-f="vu" placeholder="Qiymati (Paxta)" value="${A.esc(x.vu)}"><input class="inp sm" data-lg="ru" data-f="vr" placeholder="Значение" value="${A.esc(x.vr)}"></div></div><button type="button" class="btn sm icon danger" data-rm>${A.ic('trash')}</button>`;
        A.$$('[data-f]', row).forEach(inp => { inp.oninput = e => { x[inp.dataset.f] = e.target.value; }; });
        A.$('[data-rm]', row).onclick = () => { attrs.splice(i, 1); drawAttrs(); };
        box.appendChild(row);
      });
      A.$('#attrSugg', body).innerHTML = ATTR_SUGG.filter(([u]) => !attrs.some(x => x.nu === u)).map(([u, r]) => `<button type="button" class="chip" data-sugg="${A.esc(u)}|${A.esc(r)}">+ ${A.esc(A.UI() === 'ru' ? r : u)}</button>`).join('');
    }
    body.addEventListener('click', e => { const g = e.target.closest('[data-sugg]'); if (g) { const [u, r] = g.dataset.sugg.split('|'); attrs.push({ nu: u, nr: r, vu: '', vr: '' }); drawAttrs(); const last = A.$$('[data-f="vu"]', body).pop(); if (last) last.focus(); } });
    A.$('#addAttr', body).onclick = () => { attrs.push({ nu: '', nr: '', vu: '', vr: '' }); drawAttrs(); };
    drawAttrs();

    A.modal({
      title: isNew ? 'Yangi mahsulot' : 'Tahrirlash: ' + A.nm(p.name), body, wide: true, sticky: true,
      buttons: [{ text: 'Bekor qilish' }, { text: isNew ? "Qo'shish" : 'Saqlash', cls: 'primary', fn: async () => {
        const g = id => A.$('#' + id, body).value.trim(), nmv = A.biVal(body, 'n');
        if (!nmv.uz && !nmv.ru) { A.toast('Mahsulot nomini kiriting', 'err'); return false; }
        if (!A.num(g('pr'))) { A.toast('Sotuv narxini kiriting', 'err'); return false; }
        if (!catSel.value) { A.toast('Kategoriyani tanlang', 'err'); return false; }
        A.$$('[data-k]', body).forEach(inp => { vals[inp.dataset.k] = A.num(inp.value); });
        const single = A.$('[data-single]', body); if (single) st.stock = A.num(single.value);
        // yangi qiymatlarga barqaror id beramiz (nomidan), ombor kalitlarini shunga moslaymiz
        const act = activeAxes(), idMap = {}, usedKeys = new Set();
        act.forEach((a, ai) => {
          let key = a.key || slug(a.nu || a.nr, 'o' + (ai + 1)); while (usedKeys.has(key)) key += '_'; usedKeys.add(key); a.key = key;
          const used = new Set(); named(a).forEach((v, vi) => { if (!v.id) { let id = slug(v.nu || v.nr, 'v' + (vi + 1)), n = 2, base = id; while (used.has(id)) id = base + '-' + (n++); v.id = id; } used.add(v.id); idMap[v._u] = v.id; });
        });
        const cb = (() => { let out = [[]]; act.forEach(a => { const nx = []; out.forEach(o => named(a).forEach(v => nx.push(o.concat([v])))); out = nx; }); return act.length ? out : []; })();
        const vs = {}; cb.forEach(c => { const tmp = c.map(v => v._u).join('|'), fin = c.map(v => v.id).join('|'); vs[fin] = A.num(vals[fin] != null ? vals[fin] : (vals[tmp] != null ? vals[tmp] : 0)); });
        const subOpt = subSel.selectedOptions[0];
        const dsc = A.biVal(body, 'd');
        const item = {
          id: p.id, name: nmv, price: A.num(g('pr')), oldPrice: A.num(g('op')), cost: A.num(g('co')),
          category_id: Number(catSel.value), subcat: subSel.value ? { uz: subSel.value, ru: (subOpt && subOpt.dataset.ru) || subSel.value } : null,
          images: main.get(),
          options: act.map(a => ({ key: a.key, name: { uz: a.nu.trim(), ru: a.nr.trim() }, type: a.type, values: named(a).map(v => ({ id: v.id, name: { uz: v.nu.trim(), ru: v.nr.trim() }, hex: v.hex, images: a.type === 'color' && v.imgs ? v.imgs.get() : [] })) })),
          attrs: attrs.filter(x => (x.nu.trim() || x.nr.trim()) && (x.vu.trim() || x.vr.trim())).map(x => ({ name: { uz: x.nu.trim(), ru: x.nr.trim() }, value: { uz: x.vu.trim(), ru: x.vr.trim() } })),
          description: dsc, badgeType: g('bd'), note: g('nt'),
        };
        if (cb.length) item.variant_stock = vs; else item.stock = st.stock;
        await A.save('product', item); A.toast(isNew ? "Mahsulot qo'shildi" : 'Saqlandi. Sayt yangilandi', 'ok'); await reload();
      } }],
    });
  }

  if (qp.get('new')) editor(null);
});
