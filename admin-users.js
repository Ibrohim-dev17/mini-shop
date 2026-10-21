/* ==========================================================================
   ADMIN: FOYDALANUVCHILAR (mijozlar ro'yxati, ularning buyurtmalari, chat va bloklash)
   ========================================================================== */
Admin.page('users', 'Foydalanuvchilar', async app => {
  const A = Admin;
  let U = await A.users(true), q = '', f = 'all';
  app.innerHTML = `<div class="kpis" id="kpis"></div>
    <div class="toolbar" style="margin:14px 0"><input class="inp" id="q" placeholder="Ism, telefon, email, @username..."><select class="sel" id="f"><option value="all">Hammasi</option><option value="buyers">Buyurtma berganlar</option><option value="none">Buyurtma bermaganlar</option><option value="tg">Telegram</option><option value="email">Email</option><option value="banned">Bloklanganlar</option></select></div>
    <div class="tablewrap"><table class="tbl"><thead><tr><th>Mijoz</th><th>Aloqa</th><th class="num">Buyurtma</th><th class="num">Jami xarid</th><th>So'nggi</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
  const kind = u => u.kind === 'tg' ? '<span class="badge info">Telegram</span>' : '<span class="badge">Email</span>';
  function render() {
    const s = q.toLowerCase();
    const L = U.filter(u => (!s || [u.name, u.phone, u.email, u.username, u.id].some(v => String(v || '').toLowerCase().includes(s)))
      && (f === 'all' || (f === 'buyers' && u.orders) || (f === 'none' && !u.orders) || (f === 'tg' && u.kind === 'tg') || (f === 'email' && u.kind !== 'tg') || (f === 'banned' && u.banned)));
    const buyers = U.filter(u => u.orders).length;
    A.$('#kpis').innerHTML = `<div class="kpi"><div class="l">Jami foydalanuvchi</div><div class="v">${U.length}</div></div><div class="kpi"><div class="l">Buyurtma berganlar</div><div class="v">${buyers}</div><div class="s">${U.length ? Math.round(buyers / U.length * 100) : 0}% konversiya</div></div><div class="kpi"><div class="l">Jami xarid</div><div class="v">${A.money(U.reduce((a, u) => a + u.spent, 0))}</div></div><div class="kpi"><div class="l">O'rtacha mijoz xaridi</div><div class="v">${A.money(buyers ? U.reduce((a, u) => a + u.spent, 0) / buyers : 0)}</div></div>`;
    A.$('#tb').innerHTML = L.map(u => `<tr data-id="${A.esc(u.id)}"><td><div style="display:flex;gap:10px;align-items:center"><span class="ava">${A.esc(A.initials(u.name))}</span><div><b>${A.esc(u.name || 'Ismsiz')}</b> ${u.banned ? '<span class="badge danger">Bloklangan</span>' : ''}<div class="small muted">${kind(u)} ${u.username ? '@' + A.esc(u.username) : ''}</div></div></div></td>
      <td>${u.phone ? A.esc(u.phone) + (u.phone_verified ? ' <span class="badge ok">✓</span>' : '') : '<span class="muted">—</span>'}<div class="small muted">${A.esc(u.email)}</div></td>
      <td class="num">${u.orders}</td><td class="num">${A.money(u.spent)}</td><td class="small nowrap">${u.last_order ? A.dt(u.last_order) : '<span class="muted">—</span>'}</td>
      <td class="nowrap"><a class="btn sm soft" href="admin-chat.html?uid=${encodeURIComponent(u.id)}">${A.ic('chat')}<span>Chat</span></a> <button class="btn sm ${u.banned ? '' : 'danger'}" data-ban="${u.banned ? 0 : 1}">${u.banned ? 'Blokdan chiqarish' : 'Bloklash'}</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Foydalanuvchi topilmadi</div></td></tr>';
  }
  render();
  A.$('#q').oninput = A.debounce(e => { q = e.target.value.trim(); render(); }, 200); A.$('#f').onchange = e => { f = e.target.value; render(); };
  app.addEventListener('click', async e => {
    const b = e.target.closest('[data-ban]'); if (!b) return; const u = U.find(x => String(x.id) === b.closest('tr').dataset.id); if (!u) return; const on = b.dataset.ban === '1';
    if (on && !(await A.confirm((u.name || 'Bu mijoz') + ' buyurtma bera olmaydi. Bloklaysizmi?', { danger: true, ok: 'Bloklash' }))) return;
    for (const v of [u.id, u.phone, u.email].filter(Boolean)) await A.api('/api/admin/ban', 'POST', { value: v, banned: on, note: u.name });
    A.toast(on ? 'Bloklandi' : 'Blokdan chiqarildi', 'ok'); U = await A.users(true); render();
  });
});
