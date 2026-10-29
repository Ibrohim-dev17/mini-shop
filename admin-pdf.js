/* ==========================================================================
   ADMIN: PDF / CHOP ETISH (umumiy). Hisobot ichki oynada ochiladi, yangi oyna talab qilmaydi
   (Telegram ichida yangi oyna bloklanishi mumkin). "PDF / Chop etish" tugmasi telefon yoki
   kompyuterning chop etish oynasini ochadi, u yerda "PDF sifatida saqlash" tanlanadi.
   ========================================================================== */
window.AdminPdf = {
  open(title, html) {
    const ru = window.Admin && Admin.UI && Admin.UI() === 'ru';
    const ov = document.createElement('div');
    ov.id = 'pdfOv';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);display:flex;flex-direction:column';
    ov.innerHTML = '<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;padding:10px 12px;background:#fff;color:#111">' +
      '<b style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + String(title || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) + '</b>' +
      '<span style="display:flex;gap:8px;flex-shrink:0"><button id="pdfPrint" class="btn primary">' + (ru ? 'PDF / Печать' : 'PDF / Chop etish') + '</button>' +
      '<button id="pdfClose" class="btn">' + (ru ? 'Закрыть' : 'Yopish') + '</button></span></div>' +
      '<iframe style="flex:1;border:0;background:#fff;width:100%"></iframe>';
    document.body.appendChild(ov);
    const fr = ov.querySelector('iframe');
    fr.srcdoc = html;
    ov.querySelector('#pdfPrint').onclick = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { if (window.Admin) Admin.toast(ru ? 'Печать недоступна на этом устройстве' : "Chop etish bu qurilmada ishlamadi", 'err'); } };
    ov.querySelector('#pdfClose').onclick = () => ov.remove();
  }
};
