/* common.js: cart.html, heart.html, profil.html, product.html uchun.
   <head> ichiga qo'shing:  <script defer src="common.js"></script>
   1) Telegram "orqaga" tugmasi doim ko'rinadi: telefonning orqaga tugmasi / chetdan surish ilovani yopmaydi.
   2) window.loadDB() — database.json ni keshdan darhol o'qiydi, fonda yangilaydi (tezroq ochiladi). */
(function () {
    function goBack() {
        if (history.length > 1 && document.referrer) history.back();
        else window.location.href = 'index.html';
    }
    window.pageGoBack = window.pageGoBack || goBack;

    function setup() {
        var tg = window.Telegram && window.Telegram.WebApp;
        if (!tg) return;
        try { tg.ready(); tg.expand(); } catch (e) {}
        if (tg.BackButton) {
            try { tg.BackButton.offClick(window.pageGoBack); } catch (e) {}
            tg.BackButton.onClick(window.pageGoBack);
            tg.BackButton.show();
        }
        try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
    }
    window.addEventListener('DOMContentLoaded', setup);
    window.addEventListener('pageshow', function (e) { if (e.persisted) setup(); });

    window.loadDB = async function (onUpdate) {
        var KEY = new URL('database.json', location.href).href, cache = null, cachedText = null;
        try { cache = await caches.open('uzum-db-v1'); var hit = await cache.match(KEY); if (hit) cachedText = await hit.text(); } catch (e) {}
        async function fetchFresh() {
            var res = await fetch(KEY, { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var text = await res.text();
            if (cache && text !== cachedText) { try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {} }
            return text;
        }
        if (cachedText) {
            try {
                var data = JSON.parse(cachedText);
                fetchFresh().then(function (text) { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (e) {} } }).catch(function () {});
                return data;
            } catch (e) {}
        }
        return JSON.parse(await fetchFresh());
    };
})();
