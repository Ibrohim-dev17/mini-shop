/* ==========================================================================
   ADMIN: HISOBOT (savdo, foyda, sotilgan mahsulotlar, diagrammalar, Excel uchun CSV)
   Foyda = sotuv narxi − o'z narxi (tan narx). Bekor qilingan buyurtmalar hisobga olinmaydi.
   O'z narxi buyurtma berilgan paytdagi qiymat bilan saqlanadi; eski buyurtmalarda hozirgi o'z narxi ishlatiladi.
   ========================================================================== */
Admin.page('reports', 'Hisobot', async app => {
  const A = Admin;
  const [ords, C] = await Promise.all([A.orders(true), A.catalog(true)]);
  const ALL = A.lines(ords, C), today = A.dayKey(new Date().toISOString());
  const shift = n => A.dayKey(new Date(Date.now() - n * 864e5).toISOString());
  let from = shift(29), to = today, preset = '30';
  app.innerHTML = `<div class="card"><div class="chips" id="pre">${[['0', 'Bugun'], ['6', '7 kun'], ['29', '30 kun'], ['89', '90 kun'], ['m', 'Shu oy'], ['all', 'Hammasi']].map(p => `<button class="chip" data-p="${p[0]}">${p[1]}</button>`).join('')}</div>
    <div class="grid2" style="margin-top:12px"><div class="fld"><label>Boshlanishi</label><input class="inp" type="date" id="fr"></div><div class="fld"><label>Tugashi</label><input class="inp" type="date" id="to"></div></div></div>
    <div class="kpis" id="kpis"></div>
    <div class="card"><div class="hd"><h2>Kunlar bo'yicha savdo va foyda</h2></div><div id="chDay"></div></div>
    <div class="cols2e"><div class="card"><div class="hd"><h2>Kategoriyalar bo'yicha savdo</h2></div><div id="chCat"></div></div><div class="card"><div class="hd"><h2>Buyurtma holatlari</h2></div><div id="chSt"></div></div></div>
    <div class="card"><div class="hd"><h2>Sotilgan mahsulotlar</h2><button class="btn sm right" id="csv">${A.ic('download')}<span>Excel (CSV)</span></button></div><div class="tablewrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>Mahsulot</th><th class="num">Dona</th><th class="num">Tushum</th><th class="num">O'z narxi</th><th class="num">Foyda</th></tr></thead><tbody id="tb"></tbody></table></div><div class="small muted" id="nc" style="margin-top:8px"></div></div>`;
  let rows = [];
  function range() { if (preset === 'all') { from = '2000-01-01'; to = today; } else if (preset === 'm') { from = today.slice(0, 8) + '01'; to = today; } else if (/^\d+$/.test(preset)) { from = shift(+preset); to = today; } A.$('#fr').value = from; A.$('#to').value = to; }
  function draw() {
    A.$$('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === preset));
    const L = ALL.filter(x => x.day >= from && x.day <= to), O = ords.filter(o => { const d = A.dayKey(o.created); return d >= from && d <= to; });
    const rev = L.reduce((s, x) => s + x.rev, 0), cost = L.reduce((s, x) => s + x.cost, 0), n = new Set(L.map(x => x.order)).size, units = L.reduce((s, x) => s + x.qty, 0);
    A.$('#kpis').innerHTML = `<div class="kpi"><div class="l">Tushum (savdo)</div><div class="v">${A.money(rev)}</div></div><div class="kpi"><div class="l">O'z narxi (xarajat)</div><div class="v">${A.money(cost)}</div></div><div class="kpi"><div class="l">Sof foyda</div><div class="v">${A.money(rev - cost)}</div><div class="s ${rev - cost >= 0 ? 'up' : 'down'}">${rev ? Math.round((rev - cost) / rev * 100) : 0}% rentabellik</div></div>
      <div class="kpi"><div class="l">Buyurtmalar</div><div class="v">${n}</div><div class="s">O'rtacha chek: ${A.money(n ? rev / n : 0)}</div></div><div class="kpi"><div class="l">Sotilgan dona</div><div class="v">${A.grp(units)}</div></div>`;
    // kunlar
    const days = []; let d = new Date(from + 'T00:00:00'); const end = new Date(to + 'T00:00:00'); while (d <= end && days.length < 400) { days.push(d.toLocaleDateString('sv-SE')); d = new Date(d.getTime() + 864e5); }
    const by = {}; L.forEach(x => { const o = by[x.day] || (by[x.day] = { rev: 0, profit: 0 }); o.rev += x.rev; o.profit += x.profit; });
    A.bars(A.$('#chDay'), { labels: days.map(x => x.slice(8) + '.' + x.slice(5, 7)), series: [{ name: 'Savdo', values: days.map(x => (by[x] || {}).rev || 0) }, { name: 'Foyda', values: days.map(x => (by[x] || {}).profit || 0) }], fmt: A.short, tipFmt: A.money, line: days.length > 45, maxLabels: 9 });
    // kategoriyalar
    const cat = {}; L.forEach(x => { const k = A.catName(C, x.cat) || 'Boshqa'; cat[k] = (cat[k] || 0) + x.rev; });
    A.donut(A.$('#chCat'), Object.keys(cat).map(k => ({ label: k, value: cat[k] })).sort((a, b) => b.value - a.value), { center: A.short(rev), sub: "so'm", fmt: A.money });
    const cnt = {}; O.forEach(o => { cnt[o.status] = (cnt[o.status] || 0) + 1; });
    const col = { new: 'var(--c3)', confirmed: 'var(--c4)', shipping: 'var(--c1)', delivered: 'var(--c2)', cancelled: 'var(--c5)' };
    A.donut(A.$('#chSt'), Object.keys(A.ST).map(k => ({ label: A.ST[k], value: cnt[k] || 0, color: col[k] })), { center: O.length, sub: 'buyurtma' });
    // jadval
    const m = {}; L.forEach(x => { const t = m[x.pid] || (m[x.pid] = { name: x.name, qty: 0, rev: 0, cost: 0, profit: 0, nc: false }); t.qty += x.qty; t.rev += x.rev; t.cost += x.cost; t.profit += x.profit; if (x.noCost) t.nc = true; });
    rows = Object.values(m).sort((a, b) => b.rev - a.rev);
    A.$('#tb').innerHTML = rows.map(r => `<tr><td>${A.esc(r.name)}${r.nc ? ' <span class="badge warn" title="O\'z narxi kiritilmagan">o\'z narxi yo\'q</span>' : ''}</td><td class="num">${r.qty}</td><td class="num">${A.grp(r.rev)}</td><td class="num">${A.grp(r.cost)}</td><td class="num"><b>${A.grp(r.profit)}</b></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">Bu davrda savdo yo\'q</div></td></tr>';
    const nc = rows.filter(r => r.nc).length; A.$('#nc').innerHTML = nc ? `<b>${nc} ta mahsulotda o'z narxi kiritilmagan</b>, shuning uchun ularning foydasi to'liq to'g'ri chiqmaydi. <a href="admin-stock.html">Omborda o'z narxini kiriting →</a>` : '';
  }
  app.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { preset = b.dataset.p; range(); draw(); } });
  A.$('#fr').onchange = () => { from = A.$('#fr').value || from; preset = ''; draw(); }; A.$('#to').onchange = () => { to = A.$('#to').value || to; preset = ''; draw(); };
  A.$('#csv').onclick = () => {
    const r = [['Mahsulot', 'Dona', 'Tushum', "O'z narxi", 'Foyda']].concat(rows.map(x => [x.name, x.qty, x.rev, x.cost, x.profit]));
    const csv = '﻿' + r.map(a => a.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'hisobot-' + from + '_' + to + '.csv'; a.click();
  };
  range(); draw();
});
