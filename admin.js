/* ==========================================================================
   ADMIN PANEL: UMUMIY YADRO (hamma admin-*.html sahifalari shu faylni ishlatadi)
   Tuzilishi:
     1. SOZLAMA (server manzili)                 6. Oyna (modal), tasdiqlash, xabar (toast)
     2. Yordamchilar (matn, pul, sana)            7. Rasm yuklash vidjeti (siqish + yuklash)
     3. Server bilan aloqa + kirish oynasi        8. Diagrammalar (ustun, chiziq, donut)
     4. Menyu va sahifa qobig'i                   9. Mahsulot tanlash oynasi
     5. Katalog va buyurtmalar keshi             10. Hisob-kitob (savdo, foyda)
   Har bir sahifa o'z faylida: Admin.page('nomi', 'Sarlavha', async (app) => { ... })
   ========================================================================== */

/* ===== 1. SOZLAMA ===== */
// Server (Render) manzili. Admin sahifa serverning o'zidan ochilsa bo'sh qoldiring: ''
const ADMIN_CONFIG = { API_BASE: 'https://mini-shop-w7s5.onrender.com' };

(function () {
  'use strict';
  const API = ADMIN_CONFIG.API_BASE.replace(/\/+$/, '');

  /* ===== 2. YORDAMCHILAR ===== */
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nm = o => (o && typeof o === 'object') ? (o.uz || o.ru || '') : (o || '');
  const num = v => { const n = parseInt(String(v == null ? '' : v).replace(/[^0-9-]/g, ''), 10); return isNaN(n) ? 0 : n; };
  const grp = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, ' ');
  const money = n => grp(n) + " so'm";
  const short = n => { const a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' mlrd'; if (a >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' mln'; if (a >= 1e3) return Math.round(n / 1e3) + ' ming'; return String(Math.round(n)); };
  const TZ = 'Asia/Tashkent';
  const dt = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const dayKey = iso => new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ });
  const toLocalInput = iso => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };
  const fromLocalInput = v => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toISOString(); };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const ST = { new: 'Yangi', confirmed: 'Tasdiqlandi', shipping: "Yo'lda", delivered: 'Yetkazildi', cancelled: 'Bekor' };
  const STC = { new: 'warn', confirmed: 'info', shipping: 'primary', delivered: 'ok', cancelled: 'danger' };
  const thumb = p => (p && ((p.images && p.images[0]) || (p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0]))) || '';
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 200); }; };
  const initials = s => (String(s || '?').trim()[0] || '?').toUpperCase();

  const IC = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>', orders: '<path d="M6 2l-2 4v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4zM4 6h16M16 10a4 4 0 01-8 0"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>', box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v9"/>',
    shirt: '<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 01-8 0z"/>', tag: '<path d="M20 12l-8 8-9-9V3h8zM7.5 7.5h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>', story: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-3-1-6-4-8 0 4-3 6-3 11 0 4 3 8 7 8z"/>', users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/>',
    chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', archive: '<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>', out: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>', more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 18l-6-6 6-6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    restore: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5"/>', send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>', close: '<path d="M18 6L6 18M6 6l12 12"/>', download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>', eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  const ic = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>';

  /* ===== 3. SERVER BILAN ALOQA + KIRISH ===== */
  let KEY = '';
  try { KEY = sessionStorage.getItem('admin_key') || localStorage.getItem('admin_key_saved') || ''; } catch (e) {}
  let loadN = 0;
  const lb = () => $('#lb');
  function loadStart() { loadN++; const b = lb(); if (b) { b.className = 'loadbar on'; } }
  function loadEnd() { loadN = Math.max(0, loadN - 1); if (!loadN) { const b = lb(); if (b) { b.style.width = '100%'; setTimeout(() => { if (!loadN) { b.className = 'loadbar'; b.style.width = '0'; } }, 250); } } }
  async function api(path, method, body) {
    loadStart(); let slow = setTimeout(() => toast("Server uyg'onmoqda, 30-60 soniya kuting...", ''), 5000);
    let r;
    try { r = await fetch(API + path, { method: method || 'GET', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY }, body: body !== undefined ? JSON.stringify(body) : undefined }); }
    catch (e) { clearTimeout(slow); loadEnd(); throw Object.assign(new Error("Server bilan aloqa yo'q. Internetni tekshiring yoki 1 daqiqa kutib qayta urining."), { status: 0 }); }
    clearTimeout(slow); loadEnd();
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { showLogin(j.error || "Parol noto'g'ri"); throw Object.assign(new Error(j.error || 'Kirish kerak'), { status: 401 }); }
    if (!r.ok) throw Object.assign(new Error(j.error || ('Xato ' + r.status)), { status: r.status });
    return j;
  }
  function showLogin(msg) {
    let L = $('#login'); if (L) { $('.err', L).textContent = msg || ''; return; }
    L = document.createElement('div'); L.className = 'login'; L.id = 'login';
    L.innerHTML = '<form class="box"><div class="logo">A</div><h2>Admin panel</h2><p>Kirish uchun admin parolini kiriting</p><input class="inp" type="password" id="lkey" placeholder="Admin paroli" autocomplete="current-password"><div class="err"></div><label class="rm"><input type="checkbox" id="lrm"> Bu qurilmada eslab qolish</label><button class="btn primary block" type="submit">Kirish</button></form>';
    document.body.appendChild(L); $('.err', L).textContent = msg || '';
    $('form', L).onsubmit = async e => {
      e.preventDefault(); KEY = $('#lkey').value.trim(); if (!KEY) return;
      try { sessionStorage.setItem('admin_key', KEY); if ($('#lrm').checked) localStorage.setItem('admin_key_saved', KEY); } catch (x) {}
      try { await api('/api/admin/counts'); L.remove(); location.reload(); } catch (x) { if (x.status !== 401) $('.err', L).textContent = x.message; }
    };
    setTimeout(() => { const k = $('#lkey'); if (k) k.focus(); }, 50);
  }
  function logout() { try { sessionStorage.removeItem('admin_key'); localStorage.removeItem('admin_key_saved'); } catch (e) {} KEY = ''; location.reload(); }

  /* ===== 6. OYNA, TASDIQLASH, XABAR ===== */
  function toast(msg, kind) {
    const box = $('#toasts'); if (!box) return; const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), kind === 'err' ? 5000 : 2600);
  }
  // modal({title, body: html yoki Node, buttons: [{text, cls, fn(close, el)}], wide})
  function modal(o) {
    const ov = document.createElement('div'); ov.className = 'ovl';
    ov.innerHTML = '<div class="modal ' + (o.wide ? 'wide' : '') + '" role="dialog"><div class="mh"><h3>' + esc(o.title || '') + '</h3><button class="btn icon sm" data-x aria-label="Yopish">' + ic('close') + '</button></div><div class="mb"></div>' + ((o.buttons && o.buttons.length) ? '<div class="mf"></div>' : '') + '</div>';
    const mb = $('.mb', ov); if (typeof o.body === 'string') mb.innerHTML = o.body; else if (o.body) mb.appendChild(o.body);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); if (o.onClose) o.onClose(); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    $('[data-x]', ov).onclick = close; ov.addEventListener('mousedown', e => { if (e.target === ov && !o.sticky) close(); });
    const mf = $('.mf', ov);
    (o.buttons || []).forEach(b => {
      const btn = document.createElement('button'); btn.className = 'btn ' + (b.cls || ''); btn.textContent = b.text; mf.appendChild(btn);
      btn.onclick = async () => {
        if (!b.fn) return close(); btn.disabled = true;
        try { const r = await b.fn(close, ov); if (r !== false) close(); } catch (e) { if (e && e.status !== 401) toast(e.message || 'Xato', 'err'); } btn.disabled = false;
      };
    });
    document.body.appendChild(ov); if (o.onOpen) o.onOpen(ov, close); return { el: ov, close };
  }
  function confirmBox(msg, o) {
    o = o || {};
    return new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      modal({ title: o.title || 'Tasdiqlang', body: '<p style="margin:0;white-space:pre-line">' + esc(msg) + '</p>', onClose: () => fin(false), buttons: [{ text: 'Bekor qilish' }, { text: o.ok || 'Ha', cls: o.danger ? 'danger' : 'primary', fn: () => { fin(true); } }] }); });
  }

  /* ===== 7. RASM YUKLASH VIDJETI ===== */
  async function compress(file, maxPx, q) {
    maxPx = maxPx || 1100; q = q || 0.82;
    let src; try { src = await createImageBitmap(file); } catch (e) { src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error("Rasmni o'qib bo'lmadi")); im.src = URL.createObjectURL(file); }); }
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(1, maxPx / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  }
  async function uploadFile(file, maxPx) { const data = await compress(file, maxPx); const r = await api('/api/admin/upload', 'POST', { data }); return r.url; }
  // imgs({value:[url], multiple, max, shape:'tall'|'sq'|'wide', maxPx, onChange}) -> {el, get(), set(arr)}
  function imgs(o) {
    let list = (o.value || []).slice(); const max = o.multiple ? (o.max || 10) : 1; const el = document.createElement('div');
    el.className = 'imgs ' + (o.shape === 'sq' ? 'sq' : o.shape === 'wide' ? 'wide' : '');
    const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.multiple = !!o.multiple; fi.style.display = 'none';
    function draw(busy) {
      el.innerHTML = '<div class="grid">' + list.map((u, i) => '<div class="im" style="background-image:url(\'' + esc(u) + '\')">' + (i === 0 && o.multiple && list.length > 1 ? '<span class="first">Asosiy</span>' : '') + '<button type="button" class="x" data-del="' + i + '" aria-label="Olib tashlash">×</button>' + (o.multiple && list.length > 1 ? '<span class="mv"><button type="button" data-l="' + i + '" aria-label="Oldinga">‹</button><button type="button" data-r="' + i + '" aria-label="Orqaga">›</button></span>' : '') + '</div>').join('')
        + (busy ? '<div class="im busy"></div>' : '') + (list.length < max && !busy ? '<button type="button" class="add" data-add>' + ic('plus') + '<span>Rasm qo\'shish</span></button>' : '') + '</div>'
        + (list.length < max ? '<div class="url"><input type="url" placeholder="yoki rasm havolasini (https://...) qo\'ying" data-url><button type="button" class="btn sm" data-useurl>Qo\'shish</button></div>' : '') + '<div class="small muted" style="margin-top:6px">Rasmni shu yerga tashlang (drag &amp; drop) yoki tugmani bosing. Rasm avtomatik kichraytiriladi.</div>';
      el.appendChild(fi);
    }
    function changed() { if (o.onChange) o.onChange(list.slice()); }
    async function addFiles(files) {
      files = [...files].filter(f => /^image\//.test(f.type)); if (!files.length) return;
      for (const f of files) { if (list.length >= max) break; draw(true);
        try { const u = await uploadFile(f, o.maxPx); if (o.multiple) list.push(u); else list = [u]; } catch (e) { toast(e.message, 'err'); } }
      draw(); changed();
    }
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-add')) fi.click();
      else if (t.dataset.del != null) { list.splice(+t.dataset.del, 1); draw(); changed(); }
      else if (t.dataset.l != null) { const i = +t.dataset.l; if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; draw(); changed(); } }
      else if (t.dataset.r != null) { const i = +t.dataset.r; if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; draw(); changed(); } }
      else if (t.hasAttribute('data-useurl')) { const inp = $('[data-url]', el); const v = inp.value.trim(); if (/^https?:\/\//i.test(v)) { if (o.multiple) list.push(v); else list = [v]; draw(); changed(); } else toast("Havola https:// bilan boshlansin", 'err'); }
    });
    fi.addEventListener('change', () => { addFiles(fi.files); fi.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.remove('over'); }));
    el.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    draw();
    return { el, get: () => list.slice(), set: a => { list = (a || []).slice(); draw(); } };
  }

  /* ===== 8. DIAGRAMMALAR (hech qanday tashqi kutubxonasiz) ===== */
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
  // bars(el, {labels:[], series:[{name, values:[], color}], line:false, fmt: v=>text, height})
  function bars(el, o) {
    const W = Math.max(340, Math.min(640, (el.clientWidth || el.parentNode && el.parentNode.clientWidth || 640) - 8)), H = o.height || 240, pl = 46, pr = 8, pt = 10, pb = 26, labels = o.labels || [], S = o.series || [], n = labels.length;
    const fmt = o.fmt || short; const mx = niceMax(Math.max(1, ...S.map(s => Math.max(0, ...s.values))));
    const cw = (W - pl - pr) / Math.max(1, n), ih = H - pt - pb, y = v => pt + ih - (v / mx) * ih;
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = mx / 4 * i, yy = y(v); g += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>'; }
    const step = Math.ceil(n / (o.maxLabels || 8)); let body = '';
    if (o.line) {
      S.forEach((s, si) => { const col = s.color || 'var(--c' + (si + 1) + ')'; const pts = s.values.map((v, i) => [pl + cw * i + cw / 2, y(v)]);
        if (pts.length) { body += '<path d="M' + pts[0][0] + ',' + (pt + ih) + ' L' + pts.map(p => p.join(',')).join(' L') + ' L' + pts[pts.length - 1][0] + ',' + (pt + ih) + 'Z" fill="' + col + '" opacity=".1"/><polyline fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linejoin="round" points="' + pts.map(p => p.join(',')).join(' ') + '"/>'; } });
    } else {
      const bw = Math.max(2, Math.min(34, cw * 0.72 / S.length));
      S.forEach((s, si) => s.values.forEach((v, i) => { const x = pl + cw * i + (cw - bw * S.length) / 2 + bw * si, yy = y(v); body += '<rect class="bar" x="' + x + '" y="' + yy + '" width="' + bw + '" height="' + Math.max(0, pt + ih - yy) + '" rx="3" fill="' + (s.color || 'var(--c' + (si + 1) + ')') + '"/>'; }));
    }
    let hit = '';
    for (let i = 0; i < n; i++) { const tip = '<b>' + esc(labels[i]) + '</b>' + S.map(s => '<br>' + (S.length > 1 ? esc(s.name) + ': ' : '') + esc((o.tipFmt || fmt)(s.values[i]))).join(''); hit += '<rect x="' + (pl + cw * i) + '" y="' + pt + '" width="' + cw + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>'; if (i % step === 0) hit += '<text x="' + (pl + cw * i + cw / 2) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(labels[i]) + '</text>'; }
    el.className = (el.className || '').replace(/\bchart\b/, '') + ' chart';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' + g + body + hit + '</svg>' + (S.length > 1 ? '<div class="legend">' + S.map((s, i) => '<span><i style="background:' + (s.color || 'var(--c' + (i + 1) + ')') + '"></i>' + esc(s.name) + '</span>').join('') + '</div>' : '');
  }
  // donut(el, [{label, value, color}], {center, fmt})
  function donut(el, items, o) {
    o = o || {}; const tot = items.reduce((s, x) => s + x.value, 0), R = 52, C = 2 * Math.PI * R; let off = 0, segs = '';
    items.forEach((x, i) => { if (!x.value) return; const len = x.value / tot * C; segs += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + (x.color || 'var(--c' + (i % 6 + 1) + ')') + '" stroke-width="20" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)" data-tip="' + esc('<b>' + x.label + '</b><br>' + (o.fmt || grp)(x.value) + ' (' + Math.round(x.value / tot * 100) + '%)') + '"/>'; off += len; });
    if (!tot) segs = '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="20"/>';
    el.className = (el.className || '').replace(/\bdonutwrap\b/, '') + ' donutwrap';
    el.innerHTML = '<div class="chart"><svg viewBox="0 0 140 140">' + segs + '<text x="70" y="68" text-anchor="middle" style="font-size:19px;font-weight:800;fill:var(--text)">' + esc(o.center != null ? o.center : grp(tot)) + '</text><text x="70" y="84" text-anchor="middle" style="font-size:9px">' + esc(o.sub || '') + '</text></svg></div><div class="legend" style="flex-direction:column;gap:6px">' + items.map((x, i) => '<span><i style="background:' + (x.color || 'var(--c' + (i % 6 + 1) + ')') + '"></i>' + esc(x.label) + ': <b style="color:var(--text)">' + esc((o.fmt || grp)(x.value)) + '</b></span>').join('') + '</div>';
  }
  // hbars(el, [{label, value, sub}], fmt)  -- gorizontal reyting
  function hbars(el, items, fmt) {
    const mx = Math.max(1, ...items.map(x => x.value)); fmt = fmt || grp;
    el.innerHTML = items.length ? items.map(x => '<div class="hbar"><span class="ellipsis">' + esc(x.label) + (x.sub ? ' <span class="muted small">' + esc(x.sub) + '</span>' : '') + '</span><b>' + esc(fmt(x.value)) + '</b><div class="track"><b style="width:' + Math.max(2, x.value / mx * 100) + '%"></b></div></div>').join('') : '<div class="empty">Ma\'lumot yo\'q</div>';
  }
  // Diagramma ustiga bosganda/olib borganda qiymat ko'rsatish
  let tipEl = null;
  function tipMove(e, t) { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); } tipEl.innerHTML = t.getAttribute('data-tip'); const w = tipEl.offsetWidth; tipEl.style.left = Math.min(innerWidth - w - 8, Math.max(8, e.clientX + 12)) + 'px'; tipEl.style.top = Math.max(8, e.clientY - 48) + 'px'; }
  document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) tipMove(e, t); });
  document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) tipMove(e, t); else if (tipEl) { tipEl.remove(); tipEl = null; } });
  document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t && tipEl) { tipEl.remove(); tipEl = null; } });

  /* Ro'yxatni tortib (drag & drop) tartiblash. Telefonda tugmalar (↑ ↓) ishlatiladi. */
  function sortable(box, sel, onDone) {
    let drag = null;
    box.addEventListener('dragstart', e => { const it = e.target.closest(sel); if (!it || e.target.closest('input,textarea,select')) return; drag = it; it.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'x'); } catch (x) {} });
    box.addEventListener('dragover', e => { if (!drag) return; e.preventDefault(); const over = e.target.closest(sel); if (!over || over === drag) return; const r = over.getBoundingClientRect(); over.parentNode.insertBefore(drag, (e.clientY - r.top) > r.height / 2 ? over.nextSibling : over); });
    box.addEventListener('dragend', () => { if (!drag) return; drag.classList.remove('drag'); drag = null; onDone($$(sel, box).map(x => x.dataset.id)); });
  }
  const moveId = (ids, id, dir) => { const a = ids.map(String), i = a.indexOf(String(id)), j = i + dir; if (i < 0 || j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

  /* ===== 5. KATALOG VA BUYURTMALAR KESHI ===== */
  let _cat = null, _ord = null, _usr = null;
  const catalog = async force => { if (!_cat || force) _cat = await api('/api/admin/catalog'); return _cat; };
  const orders = async force => { if (!_ord || force) _ord = await api('/api/admin/orders'); return _ord; };
  const users = async force => { if (!_usr || force) _usr = await api('/api/admin/users'); return _usr; };
  async function save(type, item) { const r = await api('/api/admin/save', 'POST', { type, item }); _cat = null; return r.item; }
  async function archive(type, id, archived, sub_of) { await api('/api/admin/archive', 'POST', { type, id, archived, sub_of }); _cat = null; }
  async function remove(type, id) { await api('/api/admin/remove', 'POST', { type, id }); _cat = null; }
  async function reorder(type, ids) { await api('/api/admin/reorder', 'POST', { type, ids }); _cat = null; }
  const catName = (C, id) => { const c = (C.categories || []).find(x => String(x.id) === String(id)); return c ? nm(c.name) : ''; };

  /* ===== 9. MAHSULOT TANLASH OYNASI ===== */
  // pickProducts({selected:[ids], multiple, title}) -> Promise<[ids] | null>
  async function pickProducts(o) {
    o = o || {}; const C = await catalog(); let sel = new Set((o.selected || []).map(String)); const list = C.products.filter(p => !p.archived);
    return new Promise(res => { let fin = false; const done = v => { if (!fin) { fin = true; res(v); } };
      const body = document.createElement('div');
      body.innerHTML = '<input class="inp sm" placeholder="Qidirish..." data-q style="margin-bottom:10px"><div class="pick" data-list></div>';
      const draw = () => { const q = $('[data-q]', body).value.trim().toLowerCase(); $('[data-list]', body).innerHTML = list.filter(p => !q || nm(p.name).toLowerCase().includes(q) || String(p.id) === q).map(p => '<div class="row ' + (sel.has(String(p.id)) ? 'on' : '') + '" data-id="' + p.id + '"><img src="' + esc(thumb(p)) + '" alt=""><div style="flex:1;min-width:0"><div class="ellipsis" style="font-weight:600">' + esc(nm(p.name)) + '</div><div class="small muted">' + esc(p.price) + ' · ' + esc(catName(C, p.category_id)) + '</div></div>' + (sel.has(String(p.id)) ? '<span class="badge primary">✓</span>' : '') + '</div>').join('') || '<div class="empty">Topilmadi</div>'; };
      body.addEventListener('input', debounce(draw, 120));
      body.addEventListener('click', e => { const r = e.target.closest('.row'); if (!r) return; const id = r.dataset.id; if (o.multiple) { sel.has(id) ? sel.delete(id) : sel.add(id); draw(); } else { sel = new Set([id]); done([Number(id)]); m.close(); } });
      const m = modal({ title: o.title || 'Mahsulotni tanlang', body, wide: false, onClose: () => done(null), buttons: o.multiple ? [{ text: 'Bekor qilish' }, { text: 'Tayyor', cls: 'primary', fn: () => { done([...sel].map(Number)); } }] : [{ text: 'Yopish' }], onOpen: draw });
    });
  }

  /* ===== 10. HISOB-KITOB (savdo, foyda) ===== */
  // Har bir buyurtma qatorini tekis ro'yxatga aylantiradi: sana, tushum, tan narx, foyda
  function lines(ords, C) {
    const pm = new Map((C.products || []).map(p => [String(p.id), p])); const out = [];
    ords.forEach(o => { if (o.status === 'cancelled') return; (o.items || []).forEach(i => {
      const p = pm.get(String(i.product_id)); const cost = i.cost != null ? i.cost : (p ? num(p.cost) : 0); const rev = (i.price || 0) * (i.qty || 0);
      out.push({ ts: new Date(o.created).getTime(), day: dayKey(o.created), order: o.number, pid: i.product_id, name: nm(i.name), qty: i.qty || 0, rev, cost: cost * (i.qty || 0), profit: rev - cost * (i.qty || 0), cat: p ? p.category_id : null, noCost: !cost }); }); });
    return out;
  }

  /* ===== 4. MENYU VA SAHIFA QOBIG'I ===== */
  const NAV = [
    { g: 'Savdo' }, { id: 'dashboard', href: 'admin.html', t: 'Boshqaruv', i: 'home' }, { id: 'orders', href: 'admin-orders.html', t: 'Buyurtmalar', i: 'orders', badge: 'orders' },
    { id: 'reports', href: 'admin-reports.html', t: 'Hisobot', i: 'chart' }, { id: 'stock', href: 'admin-stock.html', t: 'Ombor', i: 'box' },
    { g: 'Katalog' }, { id: 'products', href: 'admin-products.html', t: 'Mahsulotlar', i: 'shirt' }, { id: 'categories', href: 'admin-categories.html', t: 'Kategoriyalar', i: 'tag' },
    { g: 'Reklama' }, { id: 'banners', href: 'admin-banners.html', t: 'Bannerlar', i: 'image' }, { id: 'stories', href: 'admin-stories.html', t: 'Storislar', i: 'story' }, { id: 'weekly', href: 'admin-weekly.html', t: 'Hafta aksiyalari', i: 'fire' },
    { g: 'Mijozlar' }, { id: 'users', href: 'admin-users.html', t: 'Foydalanuvchilar', i: 'users' }, { id: 'chat', href: 'admin-chat.html', t: 'Chat', i: 'chat', badge: 'chat' },
    { g: 'Tizim' }, { id: 'archive', href: 'admin-archive.html', t: 'Arxiv', i: 'archive' }, { id: 'settings', href: 'admin-settings.html', t: 'Sozlamalar', i: 'gear' },
  ];
  const TABS = ['dashboard', 'orders', 'products', 'chat'];
  let pageDef = null, counts = { new_orders: 0, unread: 0 };
  function setTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('admin_theme', t); } catch (e) {} }
  (function () { let t = ''; try { t = localStorage.getItem('admin_theme') || ''; } catch (e) {} if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', t); })();
  function badgeHtml(k) { const v = k === 'orders' ? counts.new_orders : counts.unread; return v ? '<span class="dot" data-bd="' + k + '">' + (v > 99 ? '99+' : v) + '</span>' : ''; }
  function buildShell(def) {
    const links = NAV.map(n => n.g ? '<div class="grp">' + esc(n.g) + '</div>' : '<a class="lnk ' + (n.id === def.id ? 'on' : '') + '" href="' + n.href + '" title="' + esc(n.t) + '">' + ic(n.i) + '<span class="t">' + esc(n.t) + '</span>' + (n.badge ? badgeHtml(n.badge) : '') + '</a>').join('');
    const tabs = TABS.map(id => { const n = NAV.find(x => x.id === id); return '<a href="' + n.href + '" class="' + (id === def.id ? 'on' : '') + '">' + ic(n.i) + '<span>' + esc(n.t) + '</span>' + (n.badge ? badgeHtml(n.badge) : '') + '</a>'; }).join('') + '<button type="button" id="moreBtn" class="' + (TABS.includes(def.id) ? '' : 'on') + '">' + ic('more') + '<span>Yana</span></button>';
    document.body.innerHTML = '<div class="loadbar" id="lb"></div><div class="shell"><nav class="nav"><div class="brand"><i>A</i><span>Admin panel</span></div>' + links + '</nav><div class="main"><header class="top"><h1>' + esc(def.title) + '</h1><span class="sp"></span><a class="btn sm" href="' + (API || '') + '/index.html" target="_blank" rel="noopener">' + ic('eye') + '<span class="nowrap">Saytni ochish</span></a><button class="btn sm icon" id="themeBtn" title="Tungi/kunduzgi rejim">' + ic('moon') + '</button><button class="btn sm icon" id="outBtn" title="Chiqish">' + ic('out') + '</button></header><div class="content" id="app"></div></div></div><nav class="tabbar">' + tabs + '</nav><div class="toasts" id="toasts"></div>';
    $('#themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    $('#outBtn').onclick = async () => { if (await confirmBox('Admin paneldan chiqasizmi?')) logout(); };
    $('#moreBtn').onclick = () => modal({ title: 'Bo\'limlar', body: '<div class="list">' + NAV.filter(n => n.id).map(n => '<a class="item" href="' + n.href + '" style="color:inherit">' + ic(n.i) + '<div class="body"><div class="ttl">' + esc(n.t) + '</div></div>' + (n.badge ? badgeHtml(n.badge) : '') + '</a>').join('') + '</div>' });
    document.title = def.title + ' · Admin';
  }
  async function refreshCounts() {
    try { counts = await api('/api/admin/counts'); $$('[data-bd]').forEach(x => x.remove());
      $$('.nav a.lnk, .tabbar a').forEach(a => { const n = NAV.find(x => x.href === a.getAttribute('href')); if (n && n.badge) a.insertAdjacentHTML('beforeend', badgeHtml(n.badge)); }); } catch (e) {}
  }
  function page(id, title, init) { pageDef = { id, title, init }; }
  // Fayl yetib kelmasa (GitHub'ga yuklanmagan), sahifa oppoq qolmasin: nima yetishmayotganini ko'rsatamiz
  const failedScripts = [];
  window.addEventListener('error', e => { if (e.target && e.target.tagName === 'SCRIPT') failedScripts.push((e.target.getAttribute('src') || '').split('/').pop()); }, true);
  function showMissing() {
    const here = location.pathname.split('/').pop() || 'admin.html';
    document.body.innerHTML = '<div style="max-width:520px;margin:40px auto;padding:0 16px;font:16px/1.5 system-ui,sans-serif"><h2>Sahifa kodi yuklanmadi</h2><p>' + (failedScripts.length ? 'Quyidagi fayl topilmadi: <b>' + failedScripts.map(esc).join(', ') + '</b>' : 'Sahifa kodi (admin-*.js) topilmadi yoki xato bor.') + '</p><p>Bu fayl <b>' + esc(location.host) + '</b> serveriga yuklanmagan. Uni GitHub\'dagi <code>mini-shop</code> repoga asosiy ro\'yxatga (papka ichiga emas) yuklang, so\'ng Render\'da <b>Manual Deploy</b> qiling.</p><p style="color:#777">Sahifa: ' + esc(here) + '</p></div>';
  }
  async function start() {
    if (!pageDef) { showMissing(); return; }
    if (!KEY) { buildShell(pageDef); showLogin(''); return; }
    buildShell(pageDef);
    const app = $('#app'); app.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    try { await pageDef.init(app); } catch (e) { if (e.status !== 401) app.innerHTML = '<div class="empty"><b>Xatolik</b>' + esc(e.message || e) + '<div style="margin-top:12px"><button class="btn" onclick="location.reload()">Qayta urinish</button></div></div>'; }
    refreshCounts(); setInterval(refreshCounts, 60000);
  }
  document.addEventListener('DOMContentLoaded', start);

  window.Admin = { api, esc, nm, num, grp, money, short, dt, dayKey, toLocalInput, fromLocalInput, $, $$, ST, STC, thumb, debounce, initials, ic, toast, modal, confirm: confirmBox, imgs, uploadFile, bars, donut, hbars, catalog, orders, users, save, archive, remove, reorder, catName, pickProducts, lines, sortable, moveId, page, refreshCounts, API };
})();
