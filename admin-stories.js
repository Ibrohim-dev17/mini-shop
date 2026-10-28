/* ==========================================================================
   ADMIN: STORISLAR (saytning tepasidagi dumaloq rasmlar)
   - Storisga mahsulotni "mention" qilish mumkin: storis ochilganda "Mahsulotga o'tish" tugmasi chiqadi.
   - Muddat: storis muddati tugagach saytdan o'zi yo'qoladi. Arxivga olsangiz, keyin qayta tiklash mumkin.
   ========================================================================== */
Admin.page('stories', 'Storislar', async app => {
  const A = Admin;
  let C = await A.catalog(true);
  app.innerHTML = `<div class="pagehead"><h2>Storislar</h2><button class="btn primary right" id="add">${A.ic('plus')}<span>Storis qo'shish</span></button></div>
    <div class="note">Storis saytda 9:16 (tik) shaklda ko'rinadi. Muddatni belgilasangiz, vaqti tugagach o'zi yo'qoladi. Mahsulotni tanlasangiz, mijoz storisdan to'g'ri mahsulot sahifasiga o'tadi.</div>
    <div class="list" id="list"></div>`;
  const status = s => { const n = Date.now(), a = s.start_at && Date.parse(s.start_at), e = s.expires_at && Date.parse(s.expires_at); if (a && n < a) return ['info', 'Rejalashtirilgan']; if (e && n > e) return ['danger', 'Muddati tugagan']; return ['ok', 'Faol']; };
  const prodName = id => { const p = C.products.find(x => String(x.id) === String(id)); return p ? A.nm(p.name) : '#' + id; };
  function render() {
    const L = C.stories.filter(s => !s.archived);
    A.$('#list').innerHTML = L.length ? L.map((s, i) => { const st = status(s); return `
      <div class="item" data-id="${s.id}" draggable="true">
        <div style="width:64px;aspect-ratio:9/16;border-radius:12px;background:var(--surface2) center/cover;flex-shrink:0;${s.type === 'video' ? '' : `background-image:url('${A.esc(s.media)}')`}">${s.type === 'video' ? '<div style="display:grid;place-items:center;height:100%;font-size:22px">▶</div>' : ''}</div>
        <div class="body"><div class="ttl">${A.esc(A.nm(s.title) || 'Nomsiz')} <span class="badge ${st[0]}">${st[1]}</span></div>
          <div class="meta">${s.product_id ? 'Mahsulot: ' + A.esc(prodName(s.product_id)) : 'Mahsulot ulanmagan'}</div>
          <div class="meta">${s.start_at ? A.dt(s.start_at) : 'darhol'} → ${s.expires_at ? A.dt(s.expires_at) : 'cheksiz'}</div></div>
        <div class="acts"><button class="btn sm icon" data-up ${i === 0 ? 'disabled' : ''}>${A.ic('up')}</button><button class="btn sm icon" data-dn ${i === L.length - 1 ? 'disabled' : ''}>${A.ic('down')}</button><button class="btn sm soft icon" data-edit title="Tahrirlash">${A.ic('edit')}</button><button class="btn sm icon" data-arch title="Arxivga">${A.ic('archive')}</button><button class="btn sm icon danger" data-del title="O'chirish">${A.ic('trash')}</button></div>
      </div>`; }).join('') : '<div class="empty"><b>Storis yo\'q</b>Birinchi storisni qo\'shing</div>';
  }
  async function reload() { C = await A.catalog(true); render(); }
  render();
  A.sortable(A.$('#list'), '.item', async ids => { await A.reorder('story', ids); A.toast('Tartib saqlandi', 'ok'); reload(); });
  A.$('#add').onclick = () => editor(null);
  app.addEventListener('click', async e => {
    const it = e.target.closest('.item'); if (!it) return; const s = C.stories.find(x => String(x.id) === it.dataset.id); if (!s) return;
    if (e.target.closest('[data-edit]')) editor(s);
    else if (e.target.closest('[data-up]') || e.target.closest('[data-dn]')) { await A.reorder('story', A.moveId(C.stories.filter(x => !x.archived).map(x => x.id), s.id, e.target.closest('[data-up]') ? -1 : 1)); reload(); }
    else if (e.target.closest('[data-arch]')) { await A.archive('story', s.id, true); A.toast('Arxivga olindi', 'ok'); reload(); }
    else if (e.target.closest('[data-del]')) { if (await A.confirm("Storis butunlay o'chirilsinmi?\nKeyin kerak bo'lsa, ARXIVGA oling.", { danger: true, ok: "O'chirish" })) { await A.remove('story', s.id); A.toast("O'chirildi", 'ok'); reload(); } }
  });

  function editor(s) {
    const isNew = !s; s = s || {}; let prod = s.product_id || null;
    const img = A.imgs({ value: s.type !== 'video' && s.media ? [s.media] : [], shape: 'tall', maxPx: 1080 });
    const vid = A.video({ value: s.type === 'video' ? s.media : '' });
    const body = document.createElement('div');
    const defEnd = isNew ? A.toLocalInput(new Date(Date.now() + 24 * 3600e3).toISOString()) : A.toLocalInput(s.expires_at);
    body.innerHTML = `<div id="clb"></div><div class="fld"><label>Turi</label><select class="sel" id="type"><option value="image">Rasm</option><option value="video">Video</option></select></div>
      <div class="fld" id="imBox"><label>Storis rasmi *</label><div id="im"></div><div class="hint">Tik (9:16) rasm yaxshi: 1080×1920. Rasm galereyadan olinadi.</div></div>
      <div class="fld" id="vidBox"><label>Storis videosi *</label><div id="vd"></div></div>
      ${A.bi({ id: 't', label: 'Sarlavha', uz: s.title && s.title.uz, ru: s.title && s.title.ru, max: 40 })}
      <div class="fld"><label>Mahsulotni "mention" qilish</label><div class="inputrow"><div class="inp" id="pname" style="display:flex;align-items:center"></div><button class="btn" type="button" id="pick">Tanlash</button><button class="btn icon" type="button" id="unpick" title="Olib tashlash">${A.ic('close')}</button></div></div>
      <div class="grid2"><div class="fld"><label>Boshlanishi</label><input class="inp" type="datetime-local" id="st" value="${A.toLocalInput(s.start_at)}"><div class="hint">Bo'sh = darhol</div></div><div class="fld"><label>Tugashi</label><input class="inp" type="datetime-local" id="en" value="${defEnd}"><div class="hint">Bo'sh = cheksiz. Odatda 24 soat.</div></div></div>`;
    A.$('#clb', body).appendChild(A.clBar());
    A.$('#vd', body).appendChild(vid.el);
    A.$('#im', body).appendChild(img.el);
    const type = A.$('#type', body); type.value = s.type === 'video' ? 'video' : 'image';
    const vis = () => { A.$('#imBox', body).style.display = type.value === 'image' ? '' : 'none'; A.$('#vidBox', body).style.display = type.value === 'video' ? '' : 'none'; };
    type.onchange = vis; vis();
    const pn = () => { const p = prod && C.products.find(x => String(x.id) === String(prod)); A.$('#pname', body).textContent = p ? A.nm(p.name) : 'Ulanmagan'; };
    pn();
    A.$('#pick', body).onclick = async () => { const r = await A.pickProducts({ selected: prod ? [prod] : [] }); if (r) { prod = r[0]; pn(); } };
    A.$('#unpick', body).onclick = () => { prod = null; pn(); };
    A.modal({ title: isNew ? 'Yangi storis' : 'Storisni tahrirlash', body, wide: true, sticky: true, buttons: [{ text: 'Bekor qilish' }, { text: isNew ? "Qo'shish" : 'Saqlash', cls: 'primary', fn: async () => {
      const media = type.value === 'video' ? vid.get() : img.get()[0];
      if (!media) { A.toast(type.value === 'video' ? 'Videoni galereyadan yuklang' : 'Storis rasmini yuklang', 'err'); return false; }
      const tt = A.biVal(body, 't'); if (!tt.uz && !tt.ru) { A.toast('Sarlavhani yozing', 'err'); return false; }
      await A.save('story', { id: s.id, type: type.value, media, title: tt, product_id: prod, start_at: A.fromLocalInput(A.$('#st', body).value), expires_at: A.fromLocalInput(A.$('#en', body).value) });
      A.toast('Saqlandi. Sayt yangilandi', 'ok'); await reload();
    } }] });
  }
});
