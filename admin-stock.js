/* ==========================================================================
   ADMIN: OMBOR (qoldiq, o'z narxi, qiymati, foyda)
   - Har bir mahsulot alohida kartochka: rang/o'lcham bo'yicha qoldiq katakchalarda.
   - Qoldiqni shu yerda o'zgartirish: raqamni yozing yoki + / − bosing.
   - "O'z narxi" (tan narx) saytda ko'rinmaydi; faqat hisob-kitob va foyda uchun.
   - PDF hisobot: yangi oynada ochiladi, "Chop etish" orqali PDF sifatida saqlanadi.
   ========================================================================== */
Admin.page('stock', 'Ombor', async app => {
  const A = Admin;
  let C = await A.catalog(true), filt = 'all', q = '', tab = 'list', fcat = 'all';
  const prods = () => C.products.filter(p => !p.archived);
  const cost = p => A.num(p.cost), price = p => A.num(p.price);
  const lvl = n => n <= 0 ? 'zero' : n <= 3 ? 'low' : 'ok';
  const vlabel = (p, k) => { const [c, s] = k.split('|'); const col = (p.colors || []).find(x => x.id === c); return [col ? A.nm(col.name) : c, s].filter(Boolean).join(' / ') || 'Asosiy'; };
  const RU = A.UI() === 'ru';
  const L = RU ? { pdfTitle: 'Отчёт по складу', date: 'Дата', types: 'Видов товаров', pcs: 'Всего штук', cost: 'Стоимость (по себестоимости)', retail: 'Стоимость (по продаже)', profit: 'Ожидаемая прибыль', prod: 'Товар', qty: 'Остаток', ucost: 'Себестоимость', uprice: 'Цена продажи', val: 'Стоимость', pdfBtn: 'PDF отчёт', foot: 'Остаток списывается при заказе клиента и возвращается при отмене.' }
    : { pdfTitle: 'Ombor hisoboti', date: 'Sana', types: 'Mahsulot turlari', pcs: 'Jami dona', cost: "Ombor qiymati (o'z narxida)", retail: 'Sotuv qiymati', profit: 'Kutilayotgan foyda', prod: 'Mahsulot', qty: 'Qoldiq', ucost: "O'z narxi", uprice: 'Sotuv narxi', val: 'Qiymati', pdfBtn: 'PDF hisobot', foot: "Qoldiq mijoz buyurtma berganda o'zi kamayadi, bekor qilinsa qaytadi." };

  app.innerHTML = `<div class="pagehead"><h2>Ombor</h2><button class="btn right" id="pdf">${A.ic('download')}<span>${L.pdfBtn}</span></button></div><div class="kpis" id="kpis"></div>
    <div class="chips" style="margin-top:12px"><button class="chip on" data-tab="list">${RU ? 'Остаток' : 'Qoldiq'}</button><button class="chip" data-tab="log">${RU ? 'История изменений' : "O'zgarishlar tarixi"}</button></div>
    <div id="view"></div>`;

  function kpis() {
    const P = prods(); let units = 0, costVal = 0, retail = 0;
    P.forEach(p => { const n = p.stock || 0; units += n; costVal += n * cost(p); retail += n * price(p); });
    A.$('#kpis').innerHTML = `<div class="kpi"><div class="l">${L.types}</div><div class="v">${P.length}</div></div><div class="kpi"><div class="l">${L.pcs}</div><div class="v">${A.grp(units)}</div></div>
      <div class="kpi"><div class="l">${L.cost}</div><div class="v">${A.money(costVal)}</div></div><div class="kpi"><div class="l">${L.retail}</div><div class="v">${A.money(retail)}</div><div class="s up">${L.profit}: ${A.money(retail - costVal)}</div></div>`;
  }
  const qty = (id, v, n) => `<span class="qty" data-id="${id}" data-v="${v == null ? '' : A.esc(v)}"><button type="button" data-m aria-label="Kamaytirish">−</button><input inputmode="numeric" value="${n}" data-n="${n}"><button type="button" data-p aria-label="Oshirish">+</button></span>`;
  function card(p) {
    const t = p.stock || 0, pr = price(p), co = cost(p), mg = pr - co; const vs = p.variant_stock ? Object.keys(p.variant_stock) : [];
    const head = `<div class="stk-h"><img src="${A.esc(A.thumb(p))}" alt=""><div class="stk-t"><b>${A.esc(A.nm(p.name))}</b><div class="small muted">№${p.id} · ${A.esc(A.catName(C, p.category_id))}</div></div>
      <div class="stk-q ${lvl(t)}"><b>${t}</b><small>${vs.length ? vs.length + (RU ? ' видов' : ' xil') : (RU ? 'шт.' : 'dona')}</small></div></div>`;
    const cells = vs.length ? vs.map(k => { const n = p.variant_stock[k]; return `<div class="stk-v ${lvl(n)}"><div class="stk-vl">${A.esc(vlabel(p, k))}</div>${qty(p.id, k, n)}</div>`; }).join('')
      : `<div class="stk-v ${lvl(t)}"><div class="stk-vl">${RU ? 'Основной' : 'Asosiy'}</div>${qty(p.id, null, t)}</div>`;
    const money = `<div class="stk-m"><label class="small muted">${L.ucost}<input class="inp sm" data-cost="${p.id}" inputmode="numeric" value="${co || ''}" placeholder="0"></label>
      <div><span class="small muted">${L.uprice}</span><b>${A.grp(pr)}</b></div>
      <div><span class="small muted">${RU ? 'Прибыль (1 шт.)' : 'Foyda (1 dona)'}</span><b class="${co ? (mg >= 0 ? '' : 'down') : 'muted'}">${co ? A.grp(mg) : '—'}</b></div>
      <div><span class="small muted">${L.val}</span><b>${A.grp(t * co)}</b></div></div>`;
    return `<div class="stk-card ${lvl(t)}" data-id="${p.id}">${head}<div class="stk-vs">${cells}</div>${money}</div>`;
  }
  function list() {
    const P = prods().filter(p => { const t = p.stock || 0; return (!q || A.nm(p.name).toLowerCase().includes(q) || String(p.id) === q) && (fcat === 'all' || String(p.category_id) === String(fcat)) && (filt === 'all' || (filt === 'zero' && t <= 0) || (filt === 'low' && t > 0 && t <= 3) || (filt === 'nocost' && !cost(p))); });
    A.$('#view').innerHTML = `<div class="toolbar" style="margin:12px 0"><input class="inp" id="q" placeholder="${RU ? 'Название или номер товара...' : 'Mahsulot nomi yoki raqami...'}" value="${A.esc(q)}"><select class="sel" id="fc"><option value="all">${RU ? 'Все категории' : 'Barcha kategoriyalar'}</option>${C.categories.filter(c => !c.archived).map(c => `<option value="${c.id}" ${String(fcat) === String(c.id) ? 'selected' : ''}>${A.esc(A.nm(c.name))}</option>`).join('')}</select><select class="sel" id="f">
      <option value="all">${RU ? 'Все' : 'Hammasi'}</option><option value="low">${RU ? 'Мало (1–3)' : 'Oz qolgan (1-3)'}</option><option value="zero">${RU ? 'Закончились' : 'Tugagan'}</option><option value="nocost">${RU ? 'Без себестоимости' : "Tan narxi yo'q"}</option></select></div>
      <div class="small muted" style="margin-bottom:6px">${RU ? 'Показано' : "Ko'rsatilmoqda"}: ${P.length} · ${RU ? 'закончились' : 'tugagan'}: ${P.filter(p => (p.stock || 0) <= 0).length} · ${RU ? 'мало (1–3)' : 'oz qolgan (1–3)'}: ${P.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 3).length}</div>
      <div class="stk-legend small"><span class="stk-dot zero"></span>${RU ? 'Закончился' : 'Tugagan'} <span class="stk-dot low"></span>${RU ? 'Мало' : 'Oz qolgan'} <span class="stk-dot ok"></span>${RU ? 'Достаточно' : 'Yetarli'}</div>
      <div class="stk-list">${P.map(card).join('') || `<div class="empty">${RU ? 'Товары не найдены' : 'Mahsulot topilmadi'}</div>`}</div>
      <div class="small muted" style="margin-top:10px">${L.foot}</div>`;
    A.$('#f').value = filt; A.$('#fc').onchange = e => { fcat = e.target.value; list(); }; A.$('#q').oninput = A.debounce(e => { q = e.target.value.trim().toLowerCase(); list(); const i = A.$('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); A.$('#f').onchange = e => { filt = e.target.value; list(); };
  }
  async function setStock(id, v, value, mode, sign) {
    await A.api('/api/admin/stock', 'POST', { id, variant: v === '' ? null : v, value, mode: mode || 'set', sign }); C = await A.catalog(true);
  }
  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; A.$$('[data-tab]').forEach(x => x.classList.toggle('on', x === t)); return tab === 'list' ? list() : log(); }
    const w = e.target.closest('.qty'); if (!w) return; const m = e.target.closest('[data-m]'), p = e.target.closest('[data-p]'); if (!m && !p) return;
    try { await setStock(w.dataset.id, w.dataset.v, 1, 'add', m ? -1 : 1); kpis(); list(); } catch (x) { A.toast(x.message, 'err'); }
  });
  app.addEventListener('change', async e => {
    const inp = e.target; const w = inp.closest('.qty');
    if (w) { try { await setStock(w.dataset.id, w.dataset.v, Math.max(0, parseInt(inp.value, 10) || 0), 'set'); A.toast(RU ? 'Остаток сохранён' : 'Qoldiq saqlandi', 'ok'); kpis(); list(); } catch (x) { A.toast(x.message, 'err'); } }
    else if (inp.dataset.cost) { try { await A.api('/api/admin/stock', 'POST', { id: inp.dataset.cost, mode: 'cost', cost: inp.value }); C = await A.catalog(true); A.toast(RU ? 'Себестоимость сохранена' : "O'z narxi saqlandi", 'ok'); kpis(); list(); } catch (x) { A.toast(x.message, 'err'); } }
  });
  async function log() {
    const Lg = await A.api('/api/admin/stocklog');
    A.$('#view').innerHTML = `<div class="tablewrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>${RU ? 'Время' : 'Vaqt'}</th><th>${L.prod}</th><th class="num">${RU ? 'Было' : 'Oldin'}</th><th class="num">${RU ? 'Стало' : 'Keyin'}</th></tr></thead><tbody>${Lg.map(x => `<tr><td class="nowrap">${A.dt(x.ts)}</td><td>${A.esc(A.nm(x.name))}${x.variant ? ' <span class="small muted">' + A.esc(x.variant) + '</span>' : ''}</td><td class="num">${x.before}</td><td class="num">${x.after}</td></tr>`).join('') || `<tr><td colspan="4"><div class="empty">${RU ? 'Пока пусто' : "Hozircha bo'sh"}</div></td></tr>`}</tbody></table></div>`;
  }
  // PDF hisobot: toza sahifa, chop etish oynasi orqali PDF sifatida saqlanadi
  function pdf() {
    const P = prods(); let units = 0, cv = 0, rv = 0;
    const esc = A.esc, rowsHtml = P.map(p => {
      const t = p.stock || 0, co = cost(p), pr = price(p); units += t; cv += t * co; rv += t * pr;
      const vs = p.variant_stock ? Object.keys(p.variant_stock) : [];
      const head = `<tr class="g"><td colspan="2"><b>${esc(A.nm(p.name))}</b> <span>№${p.id} · ${esc(A.catName(C, p.category_id))}</span></td><td class="n"><b>${t}</b></td><td class="n">${A.grp(co)}</td><td class="n">${A.grp(pr)}</td><td class="n">${A.grp(t * co)}</td></tr>`;
      const sub = vs.map(k => { const n = p.variant_stock[k]; return `<tr class="${n <= 0 ? 'zero' : ''}"><td class="ind">↳</td><td>${esc(vlabel(p, k))}</td><td class="n">${n}</td><td class="n"></td><td class="n"></td><td class="n"></td></tr>`; }).join('');
      return head + sub;
    }).join('');
    const date = new Date().toLocaleDateString(RU ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const html = `<!doctype html><html lang="${RU ? 'ru' : 'uz'}"><head><meta charset="utf-8"><title>${L.pdfTitle} ${date}</title><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:22px;font-size:12px}
      h1{font-size:20px;margin:0 0 4px} .sub{color:#555;margin-bottom:14px}
      .kp{display:flex;gap:10px;margin-bottom:16px} .kp div{border:1px solid #ddd;border-radius:8px;padding:8px 10px;flex:1}
      .kp small{color:#666;display:block;margin-bottom:3px} .kp b{font-size:13px}
      table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #e3e3e8;padding:6px 7px;text-align:left;vertical-align:top}
      th{background:#f1f1f5;font-size:10.5px;text-transform:uppercase;color:#555} .n{text-align:right;white-space:nowrap}
      tr.g td{background:#fafafc;padding-top:9px;border-bottom:0} tr.g span{color:#777;font-size:11px}
      td.ind{width:18px;color:#999} tr.zero td{color:#b00020}
      .foot{margin-top:12px;color:#666;font-size:11px}
      @media print{ @page{size:A4;margin:12mm} body{margin:0} }
    </style></head><body>
      <h1>${L.pdfTitle}</h1><div class="sub">${L.date}: ${date}</div>
      <div class="kp"><div><small>${L.types}</small><b>${P.length}</b></div><div><small>${L.pcs}</small><b>${A.grp(units)}</b></div><div><small>${L.cost}</small><b>${A.money(cv)}</b></div><div><small>${L.retail}</small><b>${A.money(rv)}</b></div><div><small>${L.profit}</small><b>${A.money(rv - cv)}</b></div></div>
      <table><thead><tr><th colspan="2">${L.prod}</th><th class="n">${L.qty}</th><th class="n">${L.ucost}</th><th class="n">${L.uprice}</th><th class="n">${L.val}</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="foot">${L.foot}</div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = 'ombor-' + A.dayKey(new Date().toISOString()) + '.html'; a.click(); A.toast(RU ? 'Откройте файл и выберите «Печать → PDF»' : "Faylni oching va «Chop etish → PDF» ni tanlang", 'ok'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 400);
  }
  A.$('#pdf', app).onclick = pdf;
  kpis(); list();
});
