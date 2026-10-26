/* ==========================================================================
   ADMIN: KATEGORIYALAR va ICHKI KATEGORIYALAR: qo'shish, tahrirlash, tartiblash, arxivlash, o'chirish
   ========================================================================== */
Admin.page('categories', 'Kategoriyalar', async app => {
  const A = Admin;
  let C = await A.catalog(true);
  app.innerHTML = `<div class="pagehead"><h2>Kategoriyalar</h2><button class="btn primary right" id="add">${A.ic('plus')}<span>Kategoriya qo'shish</span></button></div>
    <div class="note">Tartibni o'zgartirish: kompyuterda kartani tortib qo'ying, telefonda ↑ ↓ tugmalarini bosing. Ichki kategoriya nomini o'zgartirsangiz, mahsulotlardagi nomi ham avtomatik o'zgaradi.</div>
    <div class="list" id="list"></div>`;
  const cnt = id => C.products.filter(p => String(p.category_id) === String(id) && !p.archived).length;
  function render() {
    const L = C.categories.filter(c => !c.archived);
    A.$('#list').innerHTML = L.length ? L.map((c, i) => `
      <div class="item" data-id="${c.id}" draggable="true" style="align-items:flex-start">
        ${c.img ? `<img class="th sq" src="${A.esc(c.img)}" alt="">` : `<div class="th sq" style="display:grid;place-items:center;color:var(--muted)">${A.ic('tag')}</div>`}
        <div class="body"><div class="ttl">${A.esc(A.nm(c.name))} <span class="badge">${cnt(c.id)} ta mahsulot</span></div>
          <div class="chips" style="margin-top:8px">${(c.subcats || []).filter(s => !s.archived).map(s => `<span class="chip" style="cursor:default">${A.esc(A.nm(s.name))}</span>`).join('') || '<span class="muted small">Ichki kategoriya yo\'q</span>'}</div></div>
        <div class="acts" style="flex-direction:column;align-items:flex-end">
          <div class="btns"><button class="btn sm icon" data-up ${i === 0 ? 'disabled' : ''} title="Yuqoriga">${A.ic('up')}</button><button class="btn sm icon" data-dn ${i === L.length - 1 ? 'disabled' : ''} title="Pastga">${A.ic('down')}</button></div>
          <div class="btns"><button class="btn sm soft" data-edit>${A.ic('edit')}<span>Tahrirlash</span></button><button class="btn sm icon" data-arch title="Arxivga">${A.ic('archive')}</button><button class="btn sm icon danger" data-del title="O'chirish">${A.ic('trash')}</button></div>
        </div>
      </div>`).join('') : '<div class="empty"><b>Kategoriya yo\'q</b>Birinchi kategoriyani qo\'shing</div>';
  }
  async function reload() { C = await A.catalog(true); render(); }
  render();
  A.sortable(A.$('#list'), '.item', async ids => { await A.reorder('category', ids); A.toast('Tartib saqlandi', 'ok'); reload(); });
  A.$('#add').onclick = () => editor(null);
  app.addEventListener('click', async e => {
    const it = e.target.closest('.item'); if (!it) return; const c = C.categories.find(x => String(x.id) === it.dataset.id); if (!c) return;
    if (e.target.closest('[data-edit]')) editor(c);
    else if (e.target.closest('[data-up]') || e.target.closest('[data-dn]')) { const ids = C.categories.filter(x => !x.archived).map(x => x.id); await A.reorder('category', A.moveId(ids, c.id, e.target.closest('[data-up]') ? -1 : 1)); reload(); }
    else if (e.target.closest('[data-arch]')) { if (await A.confirm('"' + A.nm(c.name) + '" arxivga olinsinmi?\nSaytda bu kategoriya va uning mahsulotlari ko\'rinmaydi. Keyin arxivdan qaytarish mumkin.', { ok: 'Arxivga' })) { await A.archive('category', c.id, true); A.toast('Arxivga olindi', 'ok'); reload(); } }
    else if (e.target.closest('[data-del]')) { if (await A.confirm('"' + A.nm(c.name) + '" butunlay o\'chirilsinmi?', { danger: true, ok: "O'chirish" })) { try { await A.remove('category', c.id); A.toast("O'chirildi", 'ok'); reload(); } catch (er) { A.toast(er.message, 'err'); } } }
  });

  function editor(c) {
    const isNew = !c; c = c || { subcats: [] };
    const img = A.imgs({ value: c.img ? [c.img] : [], shape: 'sq' }); let subs = (c.subcats || []).map(s => ({ id: s.id, nu: (s.name && s.name.uz) || '', nr: (s.name && s.name.ru) || '', img: s.img || '', archived: !!s.archived }));
    const body = document.createElement('div');
    body.innerHTML = `<div id="clb"></div>${A.bi({ id: 'n', label: 'Nomi', uz: c.name && c.name.uz, ru: c.name && c.name.ru, ph: 'Ayollar', max: 60 })}
      <div class="fld"><label>Rasm</label><div id="im"></div></div>
      <div class="fld"><label>Ichki kategoriyalar</label><div id="subs"></div><button class="btn sm" type="button" id="addSub">${A.ic('plus')}<span>Ichki kategoriya qo'shish</span></button></div>`;
    A.$('#im', body).appendChild(img.el); A.$('#clb', body).appendChild(A.clBar());
    function draw() {
      const box = A.$('#subs', body); box.innerHTML = '';
      subs.forEach((s, i) => { const row = document.createElement('div'); row.className = 'colrow'; row.style.gridTemplateColumns = '1fr auto';
        row.innerHTML = `<div><div class="grid2 keep bi"><div data-lg="uz"><input class="inp sm" data-nu placeholder="Nomi (o'zbekcha)" value="${A.esc(s.nu)}"></div><div data-lg="ru"><input class="inp sm" data-nr placeholder="Nomi (ruscha)" value="${A.esc(s.nr)}"></div></div><div data-im style="margin-top:8px"></div>${s.archived ? '<span class="badge warn" style="margin-top:6px">arxivda</span>' : ''}</div><button class="btn sm icon danger" type="button" data-rm title="O'chirish">${A.ic('trash')}</button>`;
        const w = A.imgs({ value: s.img ? [s.img] : [], shape: 'sq', onChange: v => { s.img = v[0] || ''; } }); A.$('[data-im]', row).appendChild(w.el);
        A.$('[data-nu]', row).oninput = e => { s.nu = e.target.value; }; A.$('[data-nr]', row).oninput = e => { s.nr = e.target.value; };
        A.$('[data-rm]', row).onclick = () => { subs.splice(i, 1); draw(); }; box.appendChild(row); });
    }
    A.$('#addSub', body).onclick = () => { subs.push({ nu: '', nr: '', img: '', id: null }); draw(); }; draw();
    A.modal({ title: isNew ? 'Yangi kategoriya' : 'Tahrirlash: ' + A.nm(c.name), body, wide: true, sticky: true, buttons: [{ text: 'Bekor qilish' }, { text: isNew ? "Qo'shish" : 'Saqlash', cls: 'primary', fn: async () => {
      const nn = A.biVal(body, 'n'); if (!nn.uz && !nn.ru) { A.toast('Kategoriya nomini kiriting', 'err'); return false; }
      await A.save('category', { id: c.id, name: nn, img: img.get()[0] || '', subcats: subs.filter(s => s.nu.trim() || s.nr.trim()).map(s => ({ id: s.id, name: { uz: s.nu.trim() || s.nr.trim(), ru: s.nr.trim() || s.nu.trim() }, img: s.img, archived: s.archived })) });
      A.toast('Saqlandi. Sayt yangilandi', 'ok'); await reload();
    } }] });
  }
});
