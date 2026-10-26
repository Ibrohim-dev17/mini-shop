/* ==========================================================================
   ADMIN: OMBOR (qancha mahsulot bor, o'z narxi, qiymati, foyda)
   - Qoldiqni shu yerning o'zida o'zgartirish: raqamni yozing yoki + / − bosing.
   - "O'z narxi" (tan narx) saytda ko'rinmaydi; faqat hisob-kitob va foyda uchun.
   - Rang/o'lchami bor mahsulotlarda qoldiq har bir rang va o'lcham uchun alohida.
   ========================================================================== */
Admin.page('stock', 'Ombor', async app => {
  const A = Admin;
  let C = await A.catalog(true), filt = 'all', q = '', tab = 'list';
  const prods = () => C.products.filter(p => !p.archived);
  const cost = p => A.num(p.cost), price = p => A.num(p.price);
  const vlabel = (p, k) => { const [c, s] = k.split('|'); const col = (p.colors || []).find(x => x.id === c); return [col ? A.nm(col.name) : c, s].filter(Boolean).join(' / ') || 'Asosiy'; };
  app.innerHTML = `<div class="pagehead"><h2>Ombor</h2><button class="btn right" id="csv">${A.ic('download')}<span>Excel (CSV)</span></button></div><div class="kpis" id="kpis"></div>
    <div class="chips"><button class="chip on" data-tab="list">Qoldiq</button><button class="chip" data-tab="log">O'zgarishlar tarixi</button></div>
    <div id="view"></div>`;

  function kpis() {
    const P = prods(); let units = 0, costVal = 0, retail = 0;
    P.forEach(p => { const n = p.stock || 0; units += n; costVal += n * cost(p); retail += n * price(p); });
    A.$('#kpis').innerHTML = `<div class="kpi"><div class="l">Mahsulot turlari</div><div class="v">${P.length}</div></div><div class="kpi"><div class="l">Jami dona</div><div class="v">${A.grp(units)}</div></div>
      <div class="kpi"><div class="l">Ombor qiymati (o'z narxida)</div><div class="v">${A.money(costVal)}</div></div><div class="kpi"><div class="l">Sotuv qiymati</div><div class="v">${A.money(retail)}</div><div class="s up">Kutilayotgan foyda: ${A.money(retail - costVal)}</div></div>`;
  }
  function list() {
    let P = prods().filter(p => { const t = p.stock || 0; return (!q || A.nm(p.name).toLowerCase().includes(q) || String(p.id) === q) && (filt === 'all' || (filt === 'zero' && t <= 0) || (filt === 'low' && t > 0 && t <= 3) || (filt === 'nocost' && !cost(p))); });
    A.$('#view').innerHTML = `<div class="toolbar" style="margin:12px 0"><input class="inp" id="q" placeholder="Mahsulot nomi yoki raqami..." value="${A.esc(q)}"><select class="sel" id="f"><option value="all">Hammasi</option><option value="low">Oz qolgan (1-3)</option><option value="zero">Tugagan</option><option value="nocost">O'z narxi yo'q</option></select></div>
      <div class="tablewrap"><table class="tbl"><thead><tr><th>Mahsulot</th><th class="num">Qoldiq</th><th class="num">O'z narxi</th><th class="num">Sotuv narxi</th><th class="num">Foyda (1 dona)</th><th class="num">Qiymati</th></tr></thead><tbody>
      ${P.map(p => { const t = p.stock || 0, pr = price(p), co = cost(p), mg = pr - co; const vs = p.variant_stock ? Object.keys(p.variant_stock) : [];
        const main = `<tr class="${t <= 0 ? 'zero' : t <= 3 ? 'low' : ''}" data-id="${p.id}"><td><div class="pn"><img src="${A.esc(A.thumb(p))}" alt=""><div><b>${A.esc(A.nm(p.name))}</b><div class="small muted">№${p.id} · ${A.esc(A.catName(C, p.category_id))}</div></div></div></td>
          <td class="num">${vs.length ? '<b>' + t + '</b> <span class="small muted">(' + vs.length + ' xil)</span>' : qty(p.id, null, t)}</td>
          <td class="num"><input class="inp sm" style="width:110px;text-align:right" data-cost="${p.id}" inputmode="numeric" value="${co || ''}" placeholder="0"></td>
          <td class="num">${A.grp(pr)}</td><td class="num ${co ? (mg >= 0 ? '' : 'down') : 'muted'}">${co ? A.grp(mg) + ' <span class="small muted">(' + (pr ? Math.round(mg / pr * 100) : 0) + '%)</span>' : '—'}</td><td class="num">${A.grp(t * co)}</td></tr>`;
        const sub = vs.map(k => { const n = p.variant_stock[k]; return `<tr class="${n <= 0 ? 'zero' : n <= 2 ? 'low' : ''}"><td style="padding-left:56px" class="muted">↳ ${A.esc(vlabel(p, k))}</td><td class="num">${qty(p.id, k, n)}</td><td colspan="4"></td></tr>`; }).join('');
        return main + sub; }).join('') || '<tr><td colspan="6"><div class="empty">Mahsulot topilmadi</div></td></tr>'}</tbody></table></div>
      <div class="small muted" style="margin-top:8px">Sariq qator: oz qolgan. Qizil qator: tugagan. Qoldiq mijoz buyurtma berganda o'zi kamayadi, bekor qilinsa qaytadi.</div>`;
    A.$('#f').value = filt; A.$('#q').oninput = A.debounce(e => { q = e.target.value.trim().toLowerCase(); list(); const i = A.$('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); A.$('#f').onchange = e => { filt = e.target.value; list(); };
  }
  const qty = (id, v, n) => `<span class="qty" data-id="${id}" data-v="${v == null ? '' : A.esc(v)}"><button type="button" data-m>−</button><input inputmode="numeric" value="${n}" data-n="${n}"><button type="button" data-p>+</button></span>`;
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
    if (w) { try { await setStock(w.dataset.id, w.dataset.v, Math.max(0, parseInt(inp.value, 10) || 0), 'set'); A.toast('Qoldiq saqlandi', 'ok'); kpis(); list(); } catch (x) { A.toast(x.message, 'err'); } }
    else if (inp.dataset.cost) { try { await A.api('/api/admin/stock', 'POST', { id: inp.dataset.cost, mode: 'cost', cost: inp.value }); C = await A.catalog(true); A.toast("O'z narxi saqlandi", 'ok'); kpis(); list(); } catch (x) { A.toast(x.message, 'err'); } }
  });
  async function log() {
    const L = await A.api('/api/admin/stocklog');
    A.$('#view').innerHTML = `<div class="tablewrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Vaqt</th><th>Mahsulot</th><th class="num">Oldin</th><th class="num">Keyin</th></tr></thead><tbody>${L.map(x => `<tr><td class="nowrap">${A.dt(x.ts)}</td><td>${A.esc(A.nm(x.name))}${x.variant ? ' <span class="muted small">(' + A.esc(x.variant.replace('|', ' / ')) + ')</span>' : ''}</td><td class="num">${x.before}</td><td class="num"><b>${x.after}</b></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Hali o\'zgarish yo\'q</div></td></tr>'}</tbody></table></div>`;
  }
  A.$('#csv').onclick = () => {
    const rows = [['ID', 'Mahsulot', 'Kategoriya', 'Rang/Olcham', 'Qoldiq', "O'z narxi", 'Sotuv narxi', 'Qiymati (oz narxida)']];
    prods().forEach(p => { const vs = p.variant_stock ? Object.keys(p.variant_stock) : [null]; vs.forEach(k => { const n = k ? p.variant_stock[k] : (p.stock || 0); rows.push([p.id, A.nm(p.name), A.catName(C, p.category_id), k ? vlabel(p, k) : '', n, cost(p), price(p), n * cost(p)]); }); });
    const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ombor-' + A.dayKey(new Date().toISOString()) + '.csv'; a.click();
  };
  kpis(); list();
});
