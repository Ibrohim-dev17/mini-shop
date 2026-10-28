/* ==========================================================================
   ADMIN: BOSHQARUV (bosh sahifa): savdo ko'rsatkichlari, diagramma, kam qolgan mahsulotlar
   ========================================================================== */
Admin.page('dashboard', 'Boshqaruv', async app => {
  const A = Admin;
  const [ords, C] = await Promise.all([A.orders(true), A.catalog(true)]);
  const L = A.lines(ords, C);
  const day = n => A.dayKey(new Date(Date.now() - n * 864e5).toISOString());
  const sumFrom = (n, f) => L.filter(x => x.day >= day(n)).reduce((s, x) => s + x[f], 0);
  const prevSum = (a, b, f) => L.filter(x => x.day >= day(b) && x.day < day(a)).reduce((s, x) => s + x[f], 0);
  const today = day(0), tRev = L.filter(x => x.day === today).reduce((s, x) => s + x.rev, 0);
  const yRev = L.filter(x => x.day === day(1)).reduce((s, x) => s + x.rev, 0);
  const w = sumFrom(6, 'rev'), wPrev = prevSum(7, 13, 'rev'), m = sumFrom(29, 'rev'), mProfit = sumFrom(29, 'profit');
  const newCnt = ords.filter(o => o.status === 'new').length;
  const prods = C.products.filter(p => !p.archived);
  const zero = prods.filter(p => p.stock <= 0), low = prods.filter(p => p.stock > 0 && p.stock <= 3);
  const trend = (a, b) => b ? ((a - b) / b * 100) : null;
  const tr = (a, b) => { const t = trend(a, b); return t == null ? '' : '<div class="s ' + (t >= 0 ? 'up' : 'down') + '">' + (t >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(t)) + '% oldingi davrga nisbatan</div>'; };
  const noCost = prods.filter(p => !A.num(p.cost)).length;

  app.innerHTML = `
  ${newCnt ? `<a class="note warn" href="admin-orders.html" style="display:block"><b>${newCnt} ta yangi buyurtma</b> kutmoqda. Ko'rish uchun bosing →</a>` : ''}
  <div class="kpis">
    <div class="kpi"><div class="l">Bugungi savdo</div><div class="v">${A.money(tRev)}</div>${tr(tRev, yRev).replace('oldingi davrga', 'kechagiga')}</div>
    <div class="kpi"><div class="l">7 kunlik savdo</div><div class="v">${A.money(w)}</div>${tr(w, wPrev)}</div>
    <div class="kpi"><div class="l">30 kunlik savdo</div><div class="v">${A.money(m)}</div><div class="s">${new Set(L.filter(x => x.day >= day(29)).map(x => x.order)).size} ta buyurtma</div></div>
    <div class="kpi"><div class="l">30 kunlik foyda</div><div class="v">${A.money(mProfit)}</div><div class="s">${noCost ? noCost + ' ta mahsulotda tan narx yo\'q' : 'Tan narx hisobga olingan'}</div></div>
  </div>
  <div class="cols2">
    <div class="card"><div class="hd"><h2>Oxirgi 30 kun savdosi</h2></div><div id="chRev"></div></div>
    <div class="card"><div class="hd"><h2>Buyurtma holatlari</h2></div><div id="chSt"></div></div>
  </div>
  <div class="cols2e">
    <div class="card"><div class="hd"><h2>Eng ko'p sotilgan (30 kun)</h2><a class="right small" href="admin-reports.html">Batafsil →</a></div><div id="top"></div></div>
    <div class="card"><div class="hd"><h2>Kam qolgan mahsulotlar</h2><a class="right small" href="admin-stock.html">Ombor →</a></div><div class="small muted" style="margin:-4px 0 8px">Qolgan soni 3 donadan kam yoki 0 bo'lgan mahsulotlar. Raqam — qolgan dona soni.</div><div id="warn"></div></div>
  </div>
  <div class="card"><div class="hd"><h2>So'nggi buyurtmalar</h2><a class="right small" href="admin-orders.html">Hammasi →</a></div><div id="recent"></div></div>`;

  // 30 kunlik ustun diagramma
  const days = [...Array(30).keys()].map(i => day(29 - i));
  const byDay = {}; L.forEach(x => { byDay[x.day] = (byDay[x.day] || 0) + x.rev; });
  A.bars(A.$('#chRev'), { labels: days.map(d => d.slice(8) + '.' + d.slice(5, 7)), series: [{ name: 'Savdo', values: days.map(d => byDay[d] || 0) }], fmt: A.short, tipFmt: A.money, maxLabels: 8 });

  // buyurtma holatlari
  const cnt = {}; ords.forEach(o => { cnt[o.status] = (cnt[o.status] || 0) + 1; });
  const col = { new: 'var(--c3)', confirmed: 'var(--c4)', shipping: 'var(--c1)', delivered: 'var(--c2)', cancelled: 'var(--c5)' };
  A.donut(A.$('#chSt'), Object.keys(A.ST).map(k => ({ label: A.ST[k], value: cnt[k] || 0, color: col[k] })), { center: ords.length, sub: 'buyurtma' });

  // top mahsulotlar
  const top = {}; L.filter(x => x.day >= day(29)).forEach(x => { const t = top[x.pid] || (top[x.pid] = { label: x.name, value: 0, sub: '' }); t.value += x.qty; });
  A.hbars(A.$('#top'), Object.values(top).sort((a, b) => b.value - a.value).slice(0, 6), v => v + ' dona');

  // ombor ogohlantirishlari
  const row = (p, bad) => `<div class="stat-line"><span class="ellipsis"><a href="admin-products.html?q=${p.id}">${A.esc(A.nm(p.name))}</a></span><span class="badge ${bad ? 'danger' : 'warn'}">${bad ? 'Tugagan' : p.stock + ' dona'}</span></div>`;
  A.$('#warn').innerHTML = (zero.length || low.length) ? zero.slice(0, 5).map(p => row(p, 1)).join('') + low.slice(0, 6).map(p => row(p, 0)).join('') + ((zero.length + low.length) > 11 ? '<div class="small muted" style="margin-top:8px">... va yana ' + (zero.length + low.length - 11) + ' ta</div>' : '') : '<div class="empty"><b>Hammasi joyida</b>Qoldig\'i tugayotgan mahsulot yo\'q</div>';

  // so'nggi buyurtmalar
  A.$('#recent').innerHTML = ords.length ? '<div class="list">' + ords.slice(0, 6).map(o => `<a class="item" href="admin-orders.html?n=${o.number}" style="color:inherit"><div class="body"><div class="ttl">№${o.number} · ${A.esc(o.name)}</div><div class="meta">${A.dt(o.created)} · ${A.money(o.total)}</div></div><span class="badge ${A.STC[o.status]}">${A.ST[o.status]}</span></a>`).join('') + '</div>' : '<div class="empty"><b>Hali buyurtma yo\'q</b>Birinchi buyurtma shu yerda ko\'rinadi</div>';
});
