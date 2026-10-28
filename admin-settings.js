/* ==========================================================================
   ADMIN: SOZLAMALAR (do'kon ma'lumoti, zaxira nusxa, server holati)
   ========================================================================== */
Admin.page('settings', 'Sozlamalar', async app => {
  const A = Admin;
  const C = await A.catalog(true); const s = C.settings || {};
  let health = {}; try { health = await fetch(A.API + '/api/health').then(r => r.json()); } catch (e) {}
  const yn = (v, ok, no) => v ? `<span class="badge ok">${ok}</span>` : `<span class="badge danger">${no}</span>`;
  app.innerHTML = `<div class="card"><div class="hd"><h2>Do'kon ma'lumoti</h2></div><div class="grid2">
      <div class="fld"><label>Do'kon nomi</label><input class="inp" id="n" value="${A.esc(s.shop_name || '')}" maxlength="120"></div>
      <div class="fld"><label>Telefon</label><input class="inp" id="p" value="${A.esc(s.phone || '')}" placeholder="+998 90 123 45 67"></div>
      <div class="fld"><label>Manzil</label><input class="inp" id="a" value="${A.esc(s.address || '')}"></div>
      <div class="fld"><label>Ish vaqti</label><input class="inp" id="h" value="${A.esc(s.work_hours || '')}" placeholder="09:00 - 20:00"></div>
      <div class="fld"><label>Telegram (sotuvchi, @siz)</label><input class="inp" id="tgu" value="${A.esc(s.tg_username || '')}" placeholder="@do_kon_nomi"></div>
      <div class="fld"><label>Instagram</label><input class="inp" id="ig" value="${A.esc(s.instagram || '')}" placeholder="@instagram_nomi"></div>
      <div class="fld"><label>Biznes turi</label><input class="inp" id="bt" value="${A.esc(s.business_type || '')}" placeholder="Masalan: kiyim, elektronika, oziq-ovqat"><div class="hint">Mahsulot qo'shishda xususiyatlar (rang, o'lcham, voltaj...) ni o'zingiz yaratasiz, bu faqat eslatma uchun.</div></div>
      <div class="fld"><label>Sayt rangi (birinchi kirganlarga)</label><select class="sel" id="t"><option value="light">Kunduzgi</option><option value="dark">Tungi</option></select></div></div>
      <button class="btn primary" id="save">Saqlash</button></div>
    <div class="card"><div class="hd"><h2>To'lov usullari</h2></div>
      <label class="chk"><input type="checkbox" id="pcash" ${s.pay_cash === false ? '' : 'checked'}> <span>Naqd pul (qabul qilganda)</span></label>
      <label class="chk" style="margin-top:8px"><input type="checkbox" id="pclick" ${s.pay_click ? 'checked' : ''}> <span>Click (kartaga o'tkazish)</span></label>
      <div id="pbox" class="grid2" style="margin-top:12px">
        <div class="fld"><label>Karta raqami</label><input class="inp" id="pcard" inputmode="numeric" maxlength="23" value="${A.esc(s.pay_card || '')}" placeholder="8600 1234 5678 9012"></div>
        <div class="fld"><label>Karta egasi (ism familiya)</label><input class="inp" id="phold" value="${A.esc(s.pay_holder || '')}" placeholder="ALIYEV VALI"></div>
        <div class="fld"><label>Izoh (ixtiyoriy)</label><input class="inp" id="pnote" value="${A.esc(s.pay_note || '')}" placeholder="Pulni o'tkazgach chekni yuboring"><div class="hint">Mijoz "Click" ni tanlasa, shu karta raqami va egasining ismi ko'rsatiladi.</div></div></div>
      <button class="btn primary" id="psave" style="margin-top:10px">Saqlash</button></div>
    <div class="card"><div class="hd"><h2>Server holati</h2></div>
      <div class="stat-line"><span>Server</span>${yn(health.ok, 'Ishlayapti', "Javob yo'q")}</div>
      <div class="stat-line"><span>Ma'lumotlar bazasi</span>${yn(health.store && health.store !== 'fayl', health.store || '', "Vaqtinchalik fayl! DATABASE_URL kiriting, aks holda server qayta ishga tushganda ma'lumot yo'qoladi")}</div>
      <div class="stat-line"><span>Telegram bot</span>${yn(health.telegram, '@' + (health.bot || 'ulangan'), 'BOT_TOKEN kiritilmagan')}</div>
      <div style="margin-top:12px"><button class="btn" id="tg">Telegram botni qayta ulash</button></div></div>
    <div class="card"><div class="hd"><h2>Til / Язык</h2></div><p class="muted small" style="margin-top:0">Admin panel tilini tanlang. Tugma yuqoridagi bar'da ham bor.</p>
      <div class="btns"><button class="btn" data-ui="uz">O'zbekcha</button><button class="btn" data-ui="ru">Русский</button></div></div>
    <div class="card"><div class="hd"><h2>Zaxira nusxa</h2></div><p class="muted small" style="margin-top:0">Barcha mahsulot, kategoriya, banner va storislarni bitta faylga saqlab qo'ying. Xato bo'lsa, shu fayldan qaytarasiz.</p>
      <div class="btns"><button class="btn" id="exp">${A.ic('download')}<span>Zaxira faylini yuklab olish</span></button><label class="btn" style="cursor:pointer">${A.ic('restore')}<span>Zaxiradan tiklash</span><input type="file" id="imp" accept=".json,application/json" hidden></label></div></div>
    <div class="card"><div class="hd"><h2>Xavfli amallar</h2></div>
      <p class="muted small" style="margin-top:0"><b>Sotilganlar hisobini nolga tushirish:</b> qoldiqlar katalogdagi qiymatga qaytadi (sotuvlar tarixi o'chmaydi). <b>Boshlang'ich katalogga qaytish:</b> admin panelda qilingan barcha o'zgarishlar o'chib, GitHub'dagi <code>database.json</code> qaytadan ishlatiladi.</p>
      <div class="btns"><button class="btn danger" id="rs">Sotilganlar hisobini nolga tushirish</button><button class="btn danger" id="rf">Boshlang'ich katalogga qaytish</button></div></div>`;
  A.$('#t').value = s.theme || 'light';
  const pbox = () => { A.$('#pbox').style.display = A.$('#pclick').checked ? '' : 'none'; }; A.$('#pclick').onchange = pbox; pbox();
  A.$('#pcard').oninput = e => { const d = e.target.value.replace(/\D/g, '').slice(0, 19); e.target.value = d.replace(/(.{4})/g, '$1 ').trim(); };
  A.$('#psave').onclick = async () => {
    if (A.$('#pclick').checked && A.$('#pcard').value.replace(/\D/g, '').length < 16) return A.toast('Karta raqamini to\'liq kiriting (16 raqam)', 'err');
    await A.save('settings', { pay_cash: A.$('#pcash').checked, pay_click: A.$('#pclick').checked, pay_card: A.$('#pcard').value.trim(), pay_holder: A.$('#phold').value.trim(), pay_note: A.$('#pnote').value.trim() }); A.toast('Saqlandi', 'ok'); };
  A.$('#save').onclick = async () => { await A.save('settings', { shop_name: A.$('#n').value, phone: A.$('#p').value, address: A.$('#a').value, work_hours: A.$('#h').value, tg_username: A.$('#tgu').value, instagram: A.$('#ig').value, business_type: A.$('#bt').value, theme: A.$('#t').value }); A.toast('Saqlandi', 'ok'); };
  A.$('#tg').onclick = async () => { try { const r = await A.api('/api/admin/telegram-setup', 'POST', {}); A.toast(r && r.ok === false ? 'Xato: ' + (r.error || '') : 'Bot qayta ulandi', r && r.ok === false ? 'err' : 'ok'); } catch (e) { A.toast(e.message, 'err'); } };
  A.$('#exp').onclick = async () => { const d = await A.api('/api/admin/export'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })); a.download = 'zaxira-' + A.dayKey(new Date().toISOString()) + '.json'; a.click(); };
  A.$('#imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; let d; try { d = JSON.parse(await f.text()); } catch (x) { return A.toast("Fayl o'qilmadi", 'err'); }
    if (!(await A.confirm('Hozirgi katalog shu zaxira bilan almashtiriladi. Davom etasizmi?', { danger: true, ok: 'Tiklash' }))) return;
    try { const r = await A.api('/api/admin/import', 'POST', { catalog: d }); A.toast('Tiklandi: ' + r.products + ' ta mahsulot', 'ok'); } catch (x) { A.toast(x.message, 'err'); } e.target.value = ''; };
  A.$('#rs').onclick = async () => { if (await A.confirm("Qoldiqlar katalogdagi dastlabki qiymatga qaytadi.\nDavom etasizmi?", { danger: true, ok: 'Nolga tushirish' })) { await A.api('/api/admin/reset-sold', 'POST', {}); A.toast('Bajarildi', 'ok'); } };
  document.querySelectorAll('[data-ui]').forEach(b => { b.onclick = () => { try { localStorage.setItem('admin_ui', b.dataset.ui); } catch (e) {} location.reload(); }; if (b.dataset.ui === A.UI()) b.classList.add('primary'); });
  A.$('#rf').onclick = async () => { if (await A.confirm("Admin panelda qilingan BARCHA o'zgarishlar o'chadi!\nZaxira nusxa olganingizga ishonch hosil qiling.", { danger: true, ok: 'Qaytish' })) { await A.api('/api/admin/restore-file', 'POST', {}); A.toast('Boshlang\'ich katalog tiklandi', 'ok'); } };
});
