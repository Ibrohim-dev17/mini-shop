/* ==========================================================================
   ADMIN: MAHSULOTLAR: ro'yxat, qo'shish, tahrirlash, nusxalash, arxivlash, o'chirish
   Tuzilishi:  1) ro'yxat va filtrlar   2) tahrirlash oynasi (forma)   3) saqlash
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
    const L = C.products.filter(p => !p.archived && (!fcat || String(p.category_id) === String(fcat)) && (!s || A.nm(p.name).toLowerCase().includes(s) || String(p.id) === s) && (!fstock || (fstock === 'zero' ? p.stock <= 0 : p.stock > 0 && p.stock <= 3)));
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
    else if (e.target.closest('[data-dup]')) { const c = JSON.parse(JSON.stringify(p)); delete c.id; c.name = { uz: A.nm(p.name) + ' (nusxa)', ru: (p.name.ru || A.nm(p.name)) + ' (копия)' }; await A.save('product', c); A.toast('Nusxa yaratildi', 'ok'); reload(); }
    else if (e.target.closest('[data-arch]')) { await A.archive('product', p.id, true); A.toast('Arxivga olindi. Saytda ko\'rinmaydi, arxivdan qaytarish mumkin', 'ok'); reload(); }
    else if (e.target.closest('[data-del]')) { if (await A.confirm('"' + A.nm(p.name) + '" butunlay o\'chirilsinmi?\nQayta tiklab bo\'lmaydi. Keyin kerak bo\'lishi mumkin bo\'lsa, ARXIVGA oling.', { danger: true, ok: "O'chirish" })) { await A.remove('product', p.id); A.toast("O'chirildi", 'ok'); reload(); } }
  });

  /* ---------- 2. TAHRIRLASH OYNASI ---------- */
  const slug = (s, i) => (String(s || '').toLowerCase().replace(/['`ʻʼ‘’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || ('c' + (i + 1));
  const PRESETS = { 'Kiyim': 'XS,S,M,L,XL,XXL', 'Poyabzal': '36,37,38,39,40,41,42,43,44', 'Shim': '28,30,32,34,36,38', 'Bolalar': '2-3 yosh,4-5 yosh,6-7 yosh,8-9 yosh,10-12 yosh' };

  function editor(p) {
    const isNew = !p; p = p || {};
    const st = { colors: (p.colors || []).map(c => ({ id: c.id, nu: A.nm(c.name), nr: (c.name && c.name.ru) || '', hex: c.hex || '#999999', imgs: A.imgs({ value: c.images || [], multiple: true, max: 8 }) })), sizes: (p.sizes || []).slice(), vals: Object.assign({}, p.variant_stock || {}), stock: p.stock || 0 };
    const main = A.imgs({ value: p.images || [], multiple: true, max: 10 });
    const catOpts = C.categories.map(c => `<option value="${c.id}">${A.esc(A.nm(c.name))}${c.archived ? ' (arxivda)' : ''}</option>`).join('');
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="fld"><label>Rasmlar</label><div id="mImgs"></div><div class="hint">Birinchi rasm mahsulot kartasida ko'rinadi. Rang bo'yicha alohida rasmlarni pastdagi "Ranglar" bo'limida qo'shing.</div></div>
      <div class="grid2"><div class="fld"><label>Nomi (o'zbekcha) *</label><input class="inp" id="nu" value="${A.esc(A.nm(p.name))}" placeholder="Masalan: Yozgi gulli ko'ylak"></div>
        <div class="fld"><label>Nomi (ruscha)</label><input class="inp" id="nr" value="${A.esc((p.name && p.name.ru) || '')}" placeholder="Bo'sh qolsa o'zbekcha ishlatiladi"></div></div>
      <div class="grid3">
        <div class="fld"><label>Sotuv narxi (so'm) *</label><input class="inp" id="pr" inputmode="numeric" value="${p.price ? A.num(p.price) : ''}" placeholder="120000"></div>
        <div class="fld"><label>Eski narx (chegirma uchun)</label><input class="inp" id="op" inputmode="numeric" value="${p.oldPrice ? A.num(p.oldPrice) : ''}" placeholder="150000"><div class="hint" id="disc"></div></div>
        <div class="fld"><label>Tan narx (o'z narxingiz)</label><input class="inp" id="co" inputmode="numeric" value="${p.cost ? p.cost : ''}" placeholder="80000"><div class="hint" id="marg">Mijozga ko'rinmaydi. Foyda hisobi uchun.</div></div>
      </div>
      <div class="grid2"><div class="fld"><label>Kategoriya *</label><select class="sel" id="cat">${catOpts}</select></div>
        <div class="fld"><label>Ichki kategoriya</label><select class="sel" id="sub"></select></div></div>

      <div class="fld"><label>Ranglar</label><div id="cols"></div><button class="btn sm" type="button" id="addCol">${A.ic('plus')}<span>Rang qo'shish</span></button><div class="hint">Rang bo'lmasa, bo'sh qoldiring.</div></div>
      <div class="fld"><label>O'lchamlar</label><input class="inp" id="sizes" value="${A.esc(st.sizes.join(', '))}" placeholder="XS, S, M, L, XL"><div class="chips" style="margin-top:6px">${Object.keys(PRESETS).map(k => `<button type="button" class="chip" data-preset="${A.esc(PRESETS[k])}">${k}</button>`).join('')}</div><div class="hint">Vergul bilan ajrating. Tayyor to'plamni bosing yoki o'zingiz yozing. O'lcham bo'lmasa, bo'sh qoldiring.</div></div>
      <div class="fld"><label>Ombordagi qoldiq</label><div id="stk"></div></div>

      <details style="margin-bottom:14px"><summary style="cursor:pointer;font-weight:700;color:var(--muted);margin-bottom:10px">Qo'shimcha ma'lumotlar (material, mamlakat, tavsif)</summary>
        <div class="grid3"><div class="fld"><label>Material</label><input class="inp" id="mu" value="${A.esc(A.nm(p.material))}" placeholder="Paxta"><input class="inp sm" id="mr" value="${A.esc((p.material && p.material.ru) || '')}" placeholder="ruscha"></div>
          <div class="fld"><label>Ishlab chiqarilgan</label><input class="inp" id="cu" value="${A.esc(A.nm(p.country))}" placeholder="Turkiya"><input class="inp sm" id="cr" value="${A.esc((p.country && p.country.ru) || '')}" placeholder="ruscha"></div>
          <div class="fld"><label>Fasl</label><input class="inp" id="su" value="${A.esc(A.nm(p.season))}" placeholder="Yoz"><input class="inp sm" id="sr" value="${A.esc((p.season && p.season.ru) || '')}" placeholder="ruscha"></div></div>
        <div class="fld"><label>Tavsif (o'zbekcha)</label><textarea class="txt" id="du">${A.esc(A.nm(p.description))}</textarea></div>
        <div class="fld"><label>Tavsif (ruscha)</label><textarea class="txt" id="dr">${A.esc((p.description && p.description.ru) || '')}</textarea></div>
        <div class="grid2"><div class="fld"><label>"Original" belgisi</label><select class="sel" id="bd"><option value="original" ${(p.badgeType || 'original') === 'original' ? 'selected' : ''}>Ko'rsatilsin</option><option value="none" ${p.badgeType === 'none' ? 'selected' : ''}>Ko'rsatilmasin</option></select></div>
          <div class="fld"><label>Ichki izoh (faqat siz ko'rasiz)</label><input class="inp" id="nt" value="${A.esc(p.note || '')}" placeholder="Masalan: Ahmad aka'dan olingan"></div></div>
      </details>`;
    A.$('#mImgs', body).appendChild(main.el);

    const catSel = A.$('#cat', body), subSel = A.$('#sub', body);
    if (p.category_id) catSel.value = p.category_id;
    function fillSub() { const c = C.categories.find(x => String(x.id) === catSel.value); const cur = A.nm(p.subcat); subSel.innerHTML = '<option value="">- tanlanmagan -</option>' + ((c && c.subcats) || []).map(s => `<option value="${A.esc(A.nm(s.name))}" data-ru="${A.esc((s.name && s.name.ru) || '')}" ${A.nm(s.name) === cur ? 'selected' : ''}>${A.esc(A.nm(s.name))}${s.archived ? ' (arxivda)' : ''}</option>`).join(''); }
    catSel.onchange = () => { p = Object.assign({}, p, { subcat: null }); fillSub(); }; fillSub();

    // narx va foyda ko'rsatkichi
    function money() {
      const pr = A.num(A.$('#pr', body).value), op = A.num(A.$('#op', body).value), co = A.num(A.$('#co', body).value);
      A.$('#disc', body).textContent = op > pr && pr ? 'Chegirma: -' + Math.round((op - pr) / op * 100) + '%' : (op && op <= pr ? "Eski narx sotuv narxidan katta bo'lishi kerak" : '');
      A.$('#marg', body).innerHTML = co && pr ? 'Foyda: <b style="color:' + (pr > co ? 'var(--ok)' : 'var(--danger)') + '">' + A.money(pr - co) + '</b> (' + Math.round((pr - co) / pr * 100) + '%)' : 'Mijozga ko\'rinmaydi. Foyda hisobi uchun.';
    }
    ['pr', 'op', 'co'].forEach(id => A.$('#' + id, body).addEventListener('input', money)); money();

    // ranglar
    function drawCols() {
      A.$('#cols', body).innerHTML = '';
      st.colors.forEach((c, i) => {
        const row = document.createElement('div'); row.className = 'colrow';
        row.innerHTML = `<input type="color" value="${c.hex}" data-hex><div><div class="grid2 keep"><input class="inp sm" data-nu placeholder="Rang nomi" value="${A.esc(c.nu)}"><input class="inp sm" data-nr placeholder="ruscha" value="${A.esc(c.nr)}"></div><div data-im style="margin-top:8px"></div></div><button type="button" class="btn sm icon danger" data-rm title="Rangni o'chirish">${A.ic('trash')}</button>`;
        A.$('[data-im]', row).appendChild(c.imgs.el);
        A.$('[data-hex]', row).oninput = e => { c.hex = e.target.value; };
        A.$('[data-nu]', row).oninput = e => { c.nu = e.target.value; drawStock(); };
        A.$('[data-nr]', row).oninput = e => { c.nr = e.target.value; };
        A.$('[data-rm]', row).onclick = () => { st.colors.splice(i, 1); drawCols(); drawStock(); };
        A.$('#cols', body).appendChild(row);
      });
    }
    A.$('#addCol', body).onclick = () => { st.colors.push({ id: '', nu: '', nr: '', hex: '#2b2b2b', imgs: A.imgs({ value: [], multiple: true, max: 8 }) }); drawCols(); drawStock(); };
    function colorIds() { const seen = new Set(); return st.colors.map((c, i) => { let id = c.id || slug(c.nu, i); while (seen.has(id)) id += '_'; seen.add(id); return id; }); }

    // o'lchamlar
    const sizesInp = A.$('#sizes', body);
    const readSizes = () => sizesInp.value.split(',').map(x => x.trim()).filter(Boolean);
    sizesInp.addEventListener('input', A.debounce(() => { st.sizes = readSizes(); drawStock(); }, 250));
    body.addEventListener('click', e => { const b = e.target.closest('[data-preset]'); if (b) { sizesInp.value = b.dataset.preset.split(',').join(', '); st.sizes = readSizes(); drawStock(); } });

    // qoldiq: bitta son yoki rang x o'lcham jadvali
    function drawStock() {
      const ids = colorIds(), sizes = st.sizes, box = A.$('#stk', body);
      // jadvaldagi hozirgi qiymatlarni saqlab qo'yamiz
      A.$$('[data-k]', box).forEach(inp => { st.vals[inp.dataset.k] = A.num(inp.value); });
      const single = A.$('[data-single]', box); if (single) st.stock = A.num(single.value);
      if (!ids.length && !sizes.length) { box.innerHTML = `<input class="inp" data-single inputmode="numeric" value="${st.stock}" style="max-width:200px"><div class="hint">Rang yoki o'lcham bo'lmasa, bitta umumiy son.</div>`; return; }
      const cs = ids.length ? ids : [''], ss = sizes.length ? sizes : [''];
      box.innerHTML = `<div class="vmatrix"><table><tr><th></th>${ss.map(s => `<th>${A.esc(s || '-')}</th>`).join('')}</tr>${cs.map((cid, ci) => `<tr><th style="text-align:right;white-space:nowrap">${A.esc(ids.length ? (st.colors[ci].nu || 'Rang ' + (ci + 1)) : 'Soni')}</th>${ss.map(s => { const k = cid + '|' + s; return `<td><input data-k="${A.esc(k)}" inputmode="numeric" value="${st.vals[k] != null ? st.vals[k] : 0}"></td>`; }).join('')}</tr>`).join('')}</table></div><div class="btns" style="margin-top:8px"><button type="button" class="btn sm" data-fill>Hammasiga bir xil son</button></div><div class="hint">Har bir rang va o'lcham uchun nechta borligini yozing. 0 = "Qolmadi".</div>`;
      A.$('[data-fill]', box).onclick = () => { const v = prompt('Hamma katakka nechta qo\'yilsin?', '5'); if (v == null) return; A.$$('[data-k]', box).forEach(i => { i.value = A.num(v); st.vals[i.dataset.k] = A.num(v); }); };
    }
    drawCols(); drawStock();

    // eski "variant_stock" kalitlari rang id bilan mos kelishi uchun: mavjud id lar saqlanadi (c.id), yangilari slug bo'ladi
    const m = A.modal({
      title: isNew ? "Yangi mahsulot" : 'Tahrirlash: ' + A.nm(p.name), body, wide: true, sticky: true,
      buttons: [{ text: 'Bekor qilish' }, { text: isNew ? "Qo'shish" : 'Saqlash', cls: 'primary', fn: async () => {
        const g = id => A.$('#' + id, body).value.trim();
        if (!g('nu')) { A.toast('Mahsulot nomini kiriting', 'err'); return false; }
        if (!A.num(g('pr'))) { A.toast('Sotuv narxini kiriting', 'err'); return false; }
        if (!catSel.value) { A.toast('Kategoriyani tanlang', 'err'); return false; }
        // qoldiqni o'qish
        A.$$('[data-k]', body).forEach(inp => { st.vals[inp.dataset.k] = A.num(inp.value); });
        const single = A.$('[data-single]', body); if (single) st.stock = A.num(single.value);
        const allIds = colorIds(), named = st.colors.map((c, i) => ({ c, id: allIds[i] })).filter(x => x.c.nu.trim()), ids = named.map(x => x.id), sizes = readSizes(); const hasVar = ids.length || sizes.length;
        const vs = {}; if (hasVar) (ids.length ? ids : ['']).forEach(cid => (sizes.length ? sizes : ['']).forEach(s => { const k = cid + '|' + s; vs[k] = A.num(st.vals[k]); }));
        const subOpt = subSel.selectedOptions[0];
        const item = {
          id: p.id, name: { uz: g('nu'), ru: g('nr') }, price: A.num(g('pr')), oldPrice: A.num(g('op')), cost: A.num(g('co')),
          category_id: Number(catSel.value), subcat: subSel.value ? { uz: subSel.value, ru: (subOpt && subOpt.dataset.ru) || subSel.value } : null,
          images: main.get(), sizes, colors: named.map(x => ({ id: x.id, name: { uz: x.c.nu.trim(), ru: x.c.nr.trim() }, hex: x.c.hex, images: x.c.imgs.get() })),
          material: { uz: g('mu'), ru: g('mr') }, country: { uz: g('cu'), ru: g('cr') }, season: { uz: g('su'), ru: g('sr') },
          description: { uz: A.$('#du', body).value.trim(), ru: A.$('#dr', body).value.trim() }, badgeType: g('bd'), note: g('nt'),
        };
        if (hasVar) item.variant_stock = vs; else item.stock = st.stock;
        // rangsiz bo'lsa, kalitlar '|size' bo'ladi; rang o'chirilgan bo'lsa eski kalitlar tashlab yuboriladi
        await A.save('product', item); A.toast(isNew ? "Mahsulot qo'shildi" : 'Saqlandi. Sayt yangilandi', 'ok'); await reload();
      } }],
    });
  }

  if (qp.get('new')) editor(null);
});
