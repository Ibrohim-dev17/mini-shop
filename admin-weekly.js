/* ==========================================================================
   ADMIN: HAFTA AKSIYALARI (bosh sahifadagi gorizontal qator va taymer)
   Taymer tugagach blok saytda o'zi yo'qoladi. Yangi aksiya uchun faqat yangi sana qo'ying va mahsulotlarni almashtiring.
   ========================================================================== */
Admin.page('weekly', 'Hafta aksiyalari', async app => {
  const A = Admin;
  let C = await A.catalog(true);
  const sec = (C.home_sections || []).find(s => s.id === 'weekly_discounts') || { enabled: true, title: { uz: 'Hafta aksiyalari', ru: 'Акции недели' }, product_ids: [] };
  let ids = (sec.product_ids || []).slice();
  app.innerHTML = `<div class="pagehead"><h2>Hafta aksiyalari</h2><button class="btn primary right" id="save">Saqlash</button></div>
    <div class="note">Bu blok saytning bosh sahifasida chiqadi. Taymer tugagach blok yo'qoladi. Aksiyani uzaytirish uchun tugash sanasini o'zgartiring.</div>
    <div class="card"><div class="grid2">
      <div class="fld"><label>Sarlavha (o'zbekcha)</label><input class="inp" id="tu" value="${A.esc((sec.title && sec.title.uz) || '')}"></div>
      <div class="fld"><label>Sarlavha (ruscha)</label><input class="inp" id="tr" value="${A.esc((sec.title && sec.title.ru) || '')}"></div></div>
      <div class="fld"><label>Aksiya tugash vaqti (taymer)</label><input class="inp" type="datetime-local" id="te" value="${A.toLocalInput(sec.timer_end)}">
        <div class="chips" style="margin-top:8px"><button class="chip" type="button" data-d="1">+1 kun</button><button class="chip" type="button" data-d="3">+3 kun</button><button class="chip" type="button" data-d="7">+7 kun</button><button class="chip" type="button" data-d="14">+14 kun</button></div>
        <div class="hint" id="left"></div></div>
      <div class="fld" style="display:flex;align-items:center;gap:12px"><label class="sw"><input type="checkbox" id="on" ${sec.enabled !== false ? 'checked' : ''}><span></span></label><b>Saytda ko'rsatilsin</b></div></div>
    <div class="card"><div class="hd"><h2>Aksiyadagi mahsulotlar (<span id="cnt"></span>)</h2><button class="btn sm right" id="pick">${A.ic('plus')}<span>Mahsulot qo'shish</span></button></div><div class="list" id="list"></div></div>`;
  const prod = id => C.products.find(p => String(p.id) === String(id));
  function left() { const v = A.fromLocalInput(A.$('#te').value); const t = v ? Date.parse(v) - Date.now() : null; A.$('#left').textContent = t == null ? 'Sana qo\'yilmagan: taymer ko\'rinmaydi.' : t <= 0 ? 'Bu sana o\'tib ketgan: blok saytda ko\'rinmaydi. Yangi sana qo\'ying.' : 'Qolgan vaqt: ' + Math.floor(t / 864e5) + ' kun ' + Math.floor(t % 864e5 / 36e5) + ' soat'; }
  function render() {
    A.$('#cnt').textContent = ids.length;
    A.$('#list').innerHTML = ids.length ? ids.map((id, i) => { const p = prod(id); if (!p) return ''; const disc = p.discount ? `<span class="badge danger">${A.esc(p.discount)}</span>` : '<span class="badge">Chegirma yo\'q</span>';
      return `<div class="item" data-id="${p.id}" draggable="true"><div class="th" style="width:44px;height:54px;border-radius:8px;background:var(--surface2) center/cover url('${A.esc(A.thumb(p))}')"></div><div class="body"><div class="ttl">${A.esc(A.nm(p.name))}</div><div class="meta">${A.esc(p.price)} ${p.oldPrice ? '<s class="muted">' + A.esc(p.oldPrice) + '</s>' : ''} ${disc}</div></div><div class="acts"><button class="btn sm icon" data-up ${i === 0 ? 'disabled' : ''}>${A.ic('up')}</button><button class="btn sm icon" data-dn ${i === ids.length - 1 ? 'disabled' : ''}>${A.ic('down')}</button><button class="btn sm icon danger" data-rm title="Olib tashlash">${A.ic('close')}</button></div></div>`; }).join('') : '<div class="empty"><b>Mahsulot yo\'q</b>"Mahsulot qo\'shish" tugmasini bosing</div>';
    const miss = ids.filter(i => !prod(i)).length; if (miss) ids = ids.filter(i => prod(i));
  }
  render(); left();
  A.sortable(A.$('#list'), '.item', o => { ids = o.map(Number); render(); });
  A.$('#te').oninput = left;
  A.$$('[data-d]').forEach(b => b.onclick = () => { const cur = A.fromLocalInput(A.$('#te').value); const base = cur && Date.parse(cur) > Date.now() ? Date.parse(cur) : Date.now(); A.$('#te').value = A.toLocalInput(new Date(base + Number(b.dataset.d) * 864e5).toISOString()); left(); });
  A.$('#pick').onclick = async () => { const r = await A.pickProducts({ selected: ids, multiple: true, title: 'Aksiya mahsulotlari' }); if (r) { ids = r; render(); } };
  app.addEventListener('click', e => { const it = e.target.closest('.item'); if (!it) return; const id = it.dataset.id;
    if (e.target.closest('[data-rm]')) { ids = ids.filter(x => String(x) !== id); render(); }
    else if (e.target.closest('[data-up]')) { ids = A.moveId(ids, id, -1).map(Number); render(); }
    else if (e.target.closest('[data-dn]')) { ids = A.moveId(ids, id, 1).map(Number); render(); } });
  A.$('#save').onclick = async () => {
    if (!ids.length && A.$('#on').checked && !(await A.confirm("Mahsulot tanlanmagan. Blok saytda ko'rinmaydi. Davom etasizmi?"))) return;
    await A.save('section', { enabled: A.$('#on').checked, title: { uz: A.$('#tu').value, ru: A.$('#tr').value }, product_ids: ids, timer_end: A.fromLocalInput(A.$('#te').value) });
    A.toast('Saqlandi. Sayt yangilandi', 'ok');
  };
});
