window.__hdrFit = (function () { const f = () => { const h = document.querySelector('.sticky-header'); if (h) document.documentElement.style.setProperty('--hdr-h', Math.ceil(h.getBoundingClientRect().bottom) + 'px'); }; f(); setInterval(f, 400); window.addEventListener('resize', f); return f; })();
window.shKey = function () { try { const a = JSON.parse(localStorage.getItem('auth') || 'null'); return 'search_history:' + (a && a.user ? a.user.id : 'guest'); } catch (e) { return 'search_history:guest'; } };
/* ==========================================================================
   script.js  —  BUTUN SAYTNING KODI (bitta fayl)
   --------------------------------------------------------------------------
   Tuzilishi (yuqoridan pastga):
     1. CONFIG ..................... sozlamalar (server manzili)
     2. AKKAUNT HIMOYASI ........... Telegramda akkauntlar aralashmasligi uchun
     3. SH (umumiy kod) ............ til, tungi rejim, savat, saralanganlar, kirish (Telegram/email), buyurtma, sharh, oynalar
     4. PAGES.<sahifa> ............. HAR BIR SAHIFANING O'Z KODI (index, products, categories, ...). Har biri bo'limlarga ajratilgan.
     5. Ishga tushirish ............ <html data-page="..."> bo'yicha kerakli sahifa kodi ishga tushadi

   Muhim: qidiruv, mahsulot kartasi va storis kodlari bir necha sahifada (products, categories, product, heart) bir xil
   nusxada turadi. Qidiruvni o'zgartirsangiz, shu nomli bo'limni har bir sahifada o'zgartiring.
   ========================================================================== */

/* ==================== 1. CONFIG: SOZLAMALAR ==================== */
const CONFIG = {
  // Server manzili. Sayt serverning o'zidan (Render) ochilsa BO'SH qoldiring: ''
  // Sayt boshqa joyda bo'lsa (masalan GitHub Pages): 'https://mini-shop-w7s5.onrender.com'
  API_BASE: 'https://mini-shop-w7s5.onrender.com'
};

/* ==================== 2-3. AKKAUNT HIMOYASI va SH (umumiy kod) ==================== */
/* ============================================================================
   AKKAUNT HIMOYASI
   Telegramda bitta telefonda bir nechta akkaunt bo'lsa, ularning brauzer xotirasi (localStorage) umumiy bo'lib qolishi mumkin.
   Shu sababli har bir Telegram akkauntning savati, saralanganlari va kirish ma'lumoti ALOHIDA saqlanadi:
   akkaunt almashsa, eskisining ma'lumoti saqlab qo'yiladi, yangisiniki tiklanadi.
   Bu kod sahifa yuklanishining eng boshida, boshqa kodlardan OLDIN ishlaydi.
   ============================================================================ */
(function accountGuard() {
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    const uid = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id;
    if (!uid) return;
    const KEYS = ['cart_products', 'fav_products', 'notified_products', 'notified_synced', 'auth', 'checkout_draft', 'checkout_pending', 'pending_email', 'last_name', 'last_address'];
    const prev = localStorage.getItem('owner_tg');
    if (String(prev) === String(uid)) return;
    if (prev) {
      const snap = {}; KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) snap[k] = v; });
      localStorage.setItem('snap_' + prev, JSON.stringify(snap));
      KEYS.forEach(k => localStorage.removeItem(k));
      let next = null; try { next = JSON.parse(localStorage.getItem('snap_' + uid) || 'null'); } catch (e) {}
      if (next) for (const k in next) localStorage.setItem(k, next[k]);
    }
    localStorage.setItem('owner_tg', String(uid));
  } catch (e) {}
})();
const SH = (function () {
  'use strict';
    /* ---------------- Matnlar (uz / ru) ---------------- */
    const DICT = {
      uz: {
        nav_home: "Bosh sahifa", nav_catalog: "Katalog", nav_cart: "Savatcha", nav_fav: "Saralangan", nav_profile: "Profil",
        back: "Orqaga", close: "Yopish", cancel: "Bekor qilish", save: "Saqlash", ok: "Yaxshi", yes: "Ha", no: "Yo'q", loading: "Yuklanmoqda...",
        error_generic: "Xatolik yuz berdi. Qayta urinib ko'ring.", currency: "so'm", pcs: "ta", not_found: "Mahsulot topilmadi", go_home: "Bosh sahifaga",
        p_color: "Rang", p_size: "O'lcham", p_size_guide: "O'lchamlar jadvali", p_material: "Mato", p_country: "Ishlab chiqarilgan davlat", p_season: "Fasl",
        p_specs: "Xususiyatlar", p_about: "Tovar haqida", p_show_all: "Barchasini ko'rsatish", p_hide: "Yopish", p_reviews: "Sharhlar", p_all_reviews: "Barcha sharhlar",
        p_no_reviews: "Hali sharhlar yo'q", p_sold_week: "Bu haftada {n} kishi sotib oldi", p_left: "Oxirgi {n} ta qoldi", p_out: "Qolmadi",
        p_add_cart: "Savatga qo'shish", p_go_cart: "Savatchaga o'tish", p_notify: "Kelganda xabar qilish", p_notified: "Xabar beriladi",
        p_similar: "O'xshash mahsulotlar", p_choose_size: "O'lchamni tanlang", p_choose_color: "Rangni tanlang", p_variant_out: "Bu variant qolmagan",
        p_added: "Savatga qo'shildi", p_notify_on: "Mahsulot kelganda xabar beramiz", p_notify_off: "Xabar o'chirildi", p_max: "Omborda faqat {n} ta qolgan",
        p_new: "Yangi", p_price_from: "Narxi",
        r_title: "Sharhlar", r_anon: "Anonim", r_all: "Barchasi", r_with_photos: "Rasmli", r_buyers_photos: "Xaridorlarning fotosuratlari",
        r_write: "Sharh qoldirish", r_rating_label: "Bahoyingiz", r_text_ph: "Mahsulot haqida fikringiz...", r_add_photo: "Rasm qo'shish",
        r_post_as: "Sharh qanday nomda chiqsin?", r_as_name: "{name} nomidan", r_as_anon: "Anonim", r_send: "Yuborish", r_thanks: "Sharhingiz uchun rahmat!",
        r_rate_required: "Iltimos, yulduzcha bilan baho bering", r_variant: "Rang: {c}  ·  O'lcham: {s}", r_seller: "Do'kon javobi", r_based: "{n} ta sharh asosida",
        r_count: "{n} ta sharh", r_none_filter: "Bu filtr bo'yicha sharh yo'q", r_photo_limit: "Ko'pi bilan 3 ta rasm",
        c_title: "Savatcha", c_empty_title: "Savatchangiz bo'sh", c_empty_text: "Hozircha xarid qilish uchun mahsulot qo'shmagansiz.", c_go_shop: "Xarid qilishni boshlash",
        c_select_all: "Hammasini tanlash", c_delete_selected: "Tanlanganlarni o'chirish", c_selected: "Tanlangan: {n}", c_total: "Jami summa", c_checkout: "Rasmiylashtirish",
        c_remove: "O'chirish", c_choose_items: "Buyurtma uchun mahsulotlarni tanlang", c_need_login_title: "Ro'yxatdan o'ting",
        c_need_login_text: "Buyurtma berish uchun hisobingizni tasdiqlashingiz kerak.", c_login_btn: "Kirish / Ro'yxatdan o'tish",
        c_checkout_title: "Buyurtmani rasmiylashtirish", c_name: "Ism", c_phone: "Telefon", c_address: "Yetkazib berish manzili", c_address_ph: "Shahar, ko'cha, uy",
        c_comment: "Izoh (ixtiyoriy)", c_payment: "To'lov usuli", c_cash: "Naqd pul (qabul qilganda)", c_confirm: "Buyurtma berish", c_order_ok_title: "Buyurtma qabul qilindi",
        c_order_ok_text: "Buyurtma №{n} qabul qilindi. Holatini profilda kuzatishingiz mumkin.", c_my_orders: "Buyurtmalarim", c_unavailable: "Qolmagan",
        c_limit: "Omborda faqat {n} ta qolgan", c_need_address: "Manzilni kiriting", c_need_name: "Ismingizni kiriting", c_items_count: "Mahsulotlar ({n})",
        c_removed_out: "Qolmagan mahsulotlar buyurtmaga kiritilmadi", c_order_fail: "Buyurtmani yuborib bo'lmadi", c_ask_delete: "Tanlangan mahsulotlar savatdan o'chirilsinmi?",
        a_login_title: "Kirish", a_login_text: "Telefon raqamingizni kiriting, tasdiqlash kodini yuboramiz.", a_phone: "Telefon raqam", a_name: "Ismingiz",
        a_name_ph: "Masalan: Aziz", a_get_code: "Kod olish", a_code: "Tasdiqlash kodi", a_code_sent: "Kod {phone} raqamiga yuborildi", a_confirm: "Tasdiqlash",
        a_resend: "Kodni qayta yuborish", a_resend_in: "Qayta yuborish: {s} s", a_wrong_code: "Kod noto'g'ri yoki eskirgan", a_bad_phone: "Telefon raqamni to'liq kiriting (9 ta raqam)",
        a_demo_note: "Demo rejim: SMS yuborilmaydi. Kod: {code}", a_logout: "Chiqish", a_logout_ask: "Hisobdan chiqasizmi?", a_welcome: "Xush kelibsiz, {name}!",
        a_guest: "Mehmon", a_guest_text: "Buyurtma berish uchun ro'yxatdan o'ting", a_need_name: "Ismingizni kiriting", a_wait: "Biroz kuting...",
        pr_title: "Profil", pr_orders: "Mening buyurtmalarim", pr_favs: "Saralanganlar", pr_settings: "Sozlamalar", pr_lang: "Til", pr_theme: "Mavzu",
        pr_light: "Kunduzgi", pr_dark: "Tungi", pr_orders_empty: "Buyurtmalar yo'q", pr_orders_empty_text: "Siz hali buyurtma bermagansiz.", pr_order_no: "Buyurtma №{n}",
        st_new: "Qabul qilindi", st_confirmed: "Tasdiqlandi", st_shipping: "Yo'lda", st_delivered: "Yetkazildi", st_cancelled: "Bekor qilindi",
        pr_total: "Jami", pr_address: "Manzil", pr_date: "Sana", pr_demo_deliver: "Demo: yetkazildi deb belgilash", pr_review_btn: "Sharh qoldirish", pr_reviewed: "Sharh qoldirilgan",
        pr_rate_hint: "Yetkazilgan mahsulotlarga sharh qoldirishingiz mumkin", pr_edit_name: "Ismni o'zgartirish", pr_saved: "Saqlandi", pr_items: "Mahsulotlar",
        a_tg_title: "Telefon raqamni tasdiqlang", a_tg_text: "Buyurtma berish uchun raqamingizni Telegram orqali tasdiqlang.",
        a_tg_share: "Raqamni ulashish", a_tg_waiting: "Tasdiqlanmoqda...",
        a_tg_bot_hint: "So'rov chiqmasa, botni oching va u yerdagi «Raqamni ulashish» tugmasini bosing, so'ng shu yerga qayting.", a_tg_open_bot: "Botni ochish",
        a_tg_ok: "Raqamingiz tasdiqlandi", a_tg_timeout: "Tasdiqlash kelmadi. Qayta urinib ko'ring.",
        a_email: "Email", a_email_ph: "nom@gmail.com", a_bad_email: "Email manzilni to'g'ri kiriting",
        a_email_text: "Emailingizni kiriting, tasdiqlash kodini yuboramiz. Buyurtmangiz shu email bilan bog'lanadi.",
        a_email_sent: "Kod {email} manziliga yuborildi", a_email_note: "Xat kelmasa «Spam» papkasini tekshiring. Kod 10 daqiqa amal qiladi. Pochtaga o'tib kelsangiz ham, shu yerdan davom etasiz.",
        a_code_expired: "Kod eskirgan. Yangi kod oling.", a_change_email: "Emailni o'zgartirish", a_demo_email: "Sinov rejimi: kod {code}", a_not_ready: "Hozircha kirish sozlanmagan. Keyinroq urinib ko'ring.",
        c_contact_phone: "Aloqa uchun telefon", c_phone_ask: "Telegram raqamingiz bo'yicha ro'yxatdan o'tmoqchimisiz?", chat_mic_ask: "Ovoz yozish uchun mikrofondan foydalanishga ruxsat berasizmi?", c_yes: "Ha", map_geo_ask: "Joylashuvingizni aniqlashga ruxsat berasizmi?", c_contact_hint: "Tasdiqlangan raqamingiz: {p}. Buyurtmani boshqa kishi qabul qilsa, boshqa raqam yozishingiz mumkin.",
        c_contact_hint_email: "Kuryer shu raqamga qo'ng'iroq qiladi", c_need_phone: "Telefon raqamni to'liq kiriting (9 ta raqam)", c_banned: "Buyurtmani qabul qilib bo'lmaydi",
        pr_phone_verified: "Raqam tasdiqlangan", pr_verify_phone: "Telefon raqamni tasdiqlash"
      },
      ru: {
        nav_home: "Главная", nav_catalog: "Каталог", nav_cart: "Корзина", nav_fav: "Избранное", nav_profile: "Профиль",
        back: "Назад", close: "Закрыть", cancel: "Отмена", save: "Сохранить", ok: "Хорошо", yes: "Да", no: "Нет", loading: "Загрузка...",
        error_generic: "Произошла ошибка. Попробуйте ещё раз.", currency: "сум", pcs: "шт", not_found: "Товар не найден", go_home: "На главную",
        p_color: "Цвет", p_size: "Размер", p_size_guide: "Таблица размеров", p_material: "Ткань", p_country: "Страна производства", p_season: "Сезон",
        p_specs: "Характеристики", p_about: "О товаре", p_show_all: "Показать полностью", p_hide: "Скрыть", p_reviews: "Отзывы", p_all_reviews: "Все отзывы",
        p_no_reviews: "Отзывов пока нет", p_sold_week: "На этой неделе купили {n} чел.", p_left: "Осталось {n} шт.", p_out: "Нет в наличии",
        p_add_cart: "Добавить в корзину", p_go_cart: "Перейти в корзину", p_notify: "Сообщить о поступлении", p_notified: "Сообщим",
        p_similar: "Похожие товары", p_choose_size: "Выберите размер", p_choose_color: "Выберите цвет", p_variant_out: "Этого варианта нет в наличии",
        p_added: "Добавлено в корзину", p_notify_on: "Сообщим, когда товар появится", p_notify_off: "Уведомление отключено", p_max: "На складе осталось только {n} шт.",
        p_new: "Новинка", p_price_from: "Цена",
        r_title: "Отзывы", r_anon: "Аноним", r_all: "Все", r_with_photos: "С фото", r_buyers_photos: "Фото покупателей",
        r_write: "Оставить отзыв", r_rating_label: "Ваша оценка", r_text_ph: "Ваше мнение о товаре...", r_add_photo: "Добавить фото",
        r_post_as: "От чьего имени опубликовать?", r_as_name: "От имени {name}", r_as_anon: "Анонимно", r_send: "Отправить", r_thanks: "Спасибо за отзыв!",
        r_rate_required: "Пожалуйста, поставьте оценку звёздами", r_variant: "Цвет: {c}  ·  Размер: {s}", r_seller: "Ответ магазина", r_based: "На основе {n} отзывов",
        r_count: "Отзывов: {n}", r_none_filter: "Нет отзывов по этому фильтру", r_photo_limit: "Не более 3 фото",
        c_title: "Корзина", c_empty_title: "Корзина пуста", c_empty_text: "Вы пока не добавили товары для покупки.", c_go_shop: "Начать покупки",
        c_select_all: "Выбрать всё", c_delete_selected: "Удалить выбранные", c_selected: "Выбрано: {n}", c_total: "Итого", c_checkout: "Оформить",
        c_remove: "Удалить", c_choose_items: "Выберите товары для заказа", c_need_login_title: "Зарегистрируйтесь",
        c_need_login_text: "Чтобы оформить заказ, нужно подтвердить аккаунт.", c_login_btn: "Войти / Регистрация",
        c_checkout_title: "Оформление заказа", c_name: "Имя", c_phone: "Телефон", c_address: "Адрес доставки", c_address_ph: "Город, улица, дом",
        c_comment: "Комментарий (необязательно)", c_payment: "Способ оплаты", c_cash: "Наличными при получении", c_confirm: "Оформить заказ", c_order_ok_title: "Заказ принят",
        c_order_ok_text: "Заказ №{n} принят. Статус можно отслеживать в профиле.", c_my_orders: "Мои заказы", c_unavailable: "Нет в наличии",
        c_limit: "На складе осталось только {n} шт.", c_need_address: "Укажите адрес", c_need_name: "Укажите имя", c_items_count: "Товары ({n})",
        c_removed_out: "Товары, которых нет в наличии, не вошли в заказ", c_order_fail: "Не удалось отправить заказ", c_ask_delete: "Удалить выбранные товары из корзины?",
        a_login_title: "Вход", a_login_text: "Введите номер телефона, мы отправим код подтверждения.", a_phone: "Номер телефона", a_name: "Ваше имя",
        a_name_ph: "Например: Азиз", a_get_code: "Получить код", a_code: "Код подтверждения", a_code_sent: "Код отправлен на номер {phone}", a_confirm: "Подтвердить",
        a_resend: "Отправить код ещё раз", a_resend_in: "Повторно через {s} с", a_wrong_code: "Код неверный или устарел", a_bad_phone: "Введите номер полностью (9 цифр)",
        a_demo_note: "Демо-режим: SMS не отправляется. Код: {code}", a_logout: "Выйти", a_logout_ask: "Выйти из аккаунта?", a_welcome: "Добро пожаловать, {name}!",
        a_guest: "Гость", a_guest_text: "Зарегистрируйтесь, чтобы оформлять заказы", a_need_name: "Введите имя", a_wait: "Подождите...",
        pr_title: "Профиль", pr_orders: "Мои заказы", pr_favs: "Избранное", pr_settings: "Настройки", pr_lang: "Язык", pr_theme: "Тема",
        pr_light: "Светлая", pr_dark: "Тёмная", pr_orders_empty: "Заказов нет", pr_orders_empty_text: "Вы пока не делали заказов.", pr_order_no: "Заказ №{n}",
        st_new: "Принят", st_confirmed: "Подтверждён", st_shipping: "В пути", st_delivered: "Доставлен", st_cancelled: "Отменён",
        pr_total: "Итого", pr_address: "Адрес", pr_date: "Дата", pr_demo_deliver: "Демо: отметить как доставленный", pr_review_btn: "Оставить отзыв", pr_reviewed: "Отзыв оставлен",
        pr_rate_hint: "Вы можете оставить отзыв на доставленные товары", pr_edit_name: "Изменить имя", pr_saved: "Сохранено", pr_items: "Товары",
        a_tg_title: "Подтвердите номер телефона", a_tg_text: "Чтобы оформить заказ, подтвердите номер через Telegram.",
        a_tg_share: "Поделиться номером", a_tg_waiting: "Подтверждаем...",
        a_tg_bot_hint: "Если запрос не появился, откройте бота, нажмите там «Поделиться номером» и вернитесь сюда.", a_tg_open_bot: "Открыть бота",
        a_tg_ok: "Номер подтверждён", a_tg_timeout: "Подтверждение не пришло. Попробуйте ещё раз.",
        a_email: "Email", a_email_ph: "name@gmail.com", a_bad_email: "Введите email правильно",
        a_email_text: "Введите email, мы отправим код подтверждения. Заказ будет привязан к этому email.",
        a_email_sent: "Код отправлен на {email}", a_email_note: "Если письма нет, проверьте папку «Спам». Код действует 10 минут. Если вы уйдёте в почту, то продолжите отсюда же.",
        a_code_expired: "Код устарел. Получите новый.", a_change_email: "Изменить email", a_demo_email: "Тестовый режим: код {code}", a_not_ready: "Вход пока не настроен. Попробуйте позже.",
        c_contact_phone: "Телефон для связи", c_phone_ask: "Регистрация по номеру Telegram?", chat_mic_ask: "Разрешить микрофон для голосовых сообщений?", c_yes: "Да", map_geo_ask: "Разрешить определить ваше местоположение?", c_contact_hint: "Подтверждённый номер: {p}. Если заказ получит другой человек, можно указать другой номер.",
        c_contact_hint_email: "Курьер позвонит на этот номер", c_need_phone: "Введите номер полностью (9 цифр)", c_banned: "Заказ не может быть принят",
        pr_phone_verified: "Номер подтверждён", pr_verify_phone: "Подтвердить номер телефона"
      }
    };
    /* ---------------- Sozlama ---------------- */
    // API_BASE: server manzili. Sayt serverning o'zidan (Render) ochilsa BO'SH qoldiring.
    // Sayt boshqa joyda bo'lsa (masalan GitHub Pages): 'https://mini-shop-w7s5.onrender.com'
    const API_BASE = CONFIG.API_BASE;
    const API = API_BASE;
    const DB_URL = API_BASE ? API_BASE + '/database.json' : 'database.json';

    /* ---------------- Xotira (har bir foydalanuvchining o'z telefonida) ---------------- */
    const ls = {
      get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
      raw(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
      setRaw(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    };

    /* ---------------- Server bor-yo'qligini aniqlash (/api/health) ---------------- */
    // server = null  -> faqat sinov rejimi (hamma narsa shu qurilmada). server = {ok, telegram, bot, email} -> haqiqiy server.
    let server = ls.get('server_info', null);
    const isRemote = () => !!(server && server.ok);
    let readyP = null;
    function whenReady() { if (!readyP) readyP = detectServer(); return readyP; }
    async function detectServer() {
      if (!/^https?:$/.test(location.protocol)) { server = null; return null; }
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 70000);
      try {
        const r = await fetch(API + '/api/health', { cache: 'no-store', signal: ctl.signal });
        let j = null; if (r.ok) { try { j = await r.json(); } catch (e) {} }
        server = (j && j.ok) ? j : null; ls.set('server_info', server);   // server javob berdi: aniq natija
      } catch (e) { /* tarmoq yo'q yoki server uxlayapti: oxirgi ma'lum holatni saqlaymiz */ }
      finally { clearTimeout(timer); }
      return server;
    }
    // Telegram Web App ichidamizmi? (initData bor bo'lsagina)
    function tgApp() { const t = window.Telegram && window.Telegram.WebApp; return (t && t.initData && t.initDataUnsafe && t.initDataUnsafe.user) ? t : null; }

    /* ---------------- Til va tema ---------------- */
    function lang() { const l = ls.raw('selected_lang', 'uz'); return l === 'ru' ? 'ru' : 'uz'; }
    function theme() { return ls.raw('site_theme', 'light') === 'dark' ? 'dark' : 'light'; }
    function applyTheme() { if (theme() === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); }
    function setTheme(v) { ls.setRaw('site_theme', v === 'dark' ? 'dark' : 'light'); applyTheme(); }
    function setLang(v) { ls.setRaw('selected_lang', v === 'ru' ? 'ru' : 'uz'); document.documentElement.lang = lang(); }
    function tr(key, params) {
      let s = (DICT[lang()] && DICT[lang()][key]) || DICT.uz[key] || key;
      if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
      return s;
    }
    function applyI18n(root) {
      (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); });
      (root || document).querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = tr(el.getAttribute('data-i18n-ph')); });
    }
    function loc(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[lang()] || f.uz || Object.values(f)[0] || ''; }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    const MONTHS = {
      uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
      ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    };
    function fmtDate(d) {
      const x = new Date(String(d).length <= 10 ? d + 'T12:00:00' : d);
      if (isNaN(x)) return '';
      return x.getDate() + ' ' + MONTHS[lang()][x.getMonth()] + (x.getFullYear() !== new Date().getFullYear() ? ' ' + x.getFullYear() : '');
    }

    /* ---------------- Ma'lumotlar bazasi (database.json yoki backend) ---------------- */
    let db = { categories: [], products: [], reviews: [], settings: {} };
    async function loadDB(onUpdate) {
      const KEY = new URL(DB_URL, location.href).href;
      let cache = null, cachedText = null;
      try { cache = await caches.open('uzum-db-v1'); const hit = await cache.match(KEY); if (hit) cachedText = await hit.text(); } catch (e) {}
      const fetchFresh = async () => {
        const res = await fetch(KEY, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        if (cache && text !== cachedText) { try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {} }
        return text;
      };
      /* Avval YANGI bazani olishga urinamiz (6 soniyagacha). Server uyquda yoki internet yo'q bo'lsa, saqlangan nusxa ko'rsatiladi. */
      let data = null;
      try {
        const text = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
        data = JSON.parse(text);
      } catch (e) {
        if (cachedText) {
          try { data = JSON.parse(cachedText); } catch (x) { data = null; }
          fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
        }
        if (!data) data = JSON.parse(await fetchFresh());
      }
      return data;
    }
    function setDB(d) {
      db = Object.assign({ categories: [], products: [], reviews: [], settings: {} }, d || {});
      if (db.settings && db.settings.theme && ls.raw('site_theme', null) === null) ls.setRaw('site_theme', db.settings.theme);
      return db;
    }
    function product(id) { return (db.products || []).find(p => String(p.id) === String(id)); }
    function shopName() { return (db.settings && db.settings.shop_name) || 'Shop'; }

    /* ---------------- Mahsulot: variant, qoldiq, narx ---------------- */
    function num(s) { if (typeof s === 'number') return s; return parseInt(String(s || '').replace(/[^0-9]/g, ''), 10) || 0; }
    function money(n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ' + tr('currency'); }
    function vkey(color, size) { return (color == null ? '' : color) + '|' + (size == null ? '' : size); }
    function totalStock(p) {
      if (p.variant_stock) { let s = 0; for (const k in p.variant_stock) s += Number(p.variant_stock[k]) || 0; return s; }
      return p.stock !== undefined ? p.stock : 10;
    }
    // Tanlangan rang+o'lcham bo'yicha qoldiq
    function stockFor(p, color, size) {
      if (p.variant_stock) {
        const v = p.variant_stock[vkey(color, size)];
        if (v !== undefined) return Number(v) || 0;
        // faqat rang yoki faqat o'lcham bo'yicha berilgan bo'lsa
        const hasSizes = p.sizes && p.sizes.length, hasColors = p.colors && p.colors.length;
        if (!hasSizes || !hasColors) return 0;
        return 0;
      }
      return p.stock !== undefined ? p.stock : 10;
    }
    function colorOf(p, id) { return (p.colors || []).find(c => c.id === id) || null; }
    function defaultColor(p) { return p.colors && p.colors.length ? p.colors[0].id : null; }
    function defaultSize(p) { return p.sizes && p.sizes.length ? p.sizes[0] : null; }
    function productImage(p, colorId) {
      const c = colorId ? colorOf(p, colorId) : null;
      return (c && c.images && c.images[0]) || (p.images && p.images[0]) || (p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0]) || '';
    }

    /* ---------------- Savat va saralanganlar ---------------- */
    // Savat va sevimlilar akkauntga bog'lanadi: har o'zgarishda serverga yuboriladi, kirganda serverdan olinadi
    let statePushT = null;
    function statePush() { if (!isRemote() || !user()) return; clearTimeout(statePushT); statePushT = setTimeout(() => { api('/api/me/state', { method: 'PUT', body: { cart: getCart(), favs: getFavs() } }).catch(() => {}); }, 700); }
    async function syncState() {
      if (!isRemote() || !user()) return;
      try {
        const s = await api('/api/me/state');
        const srvHas = (s.cart && s.cart.length) || (s.favs && s.favs.length);
        const locHas = getCart().length || getFavs().length;
        if (srvHas) {
          const same = JSON.stringify(s.cart || []) === JSON.stringify(getCart()) && JSON.stringify(s.favs || []) === JSON.stringify(getFavs());
          if (!same) { ls.set('cart_products', s.cart || []); ls.set('fav_products', s.favs || []); if (!sessionStorage.getItem('st_reload')) { sessionStorage.setItem('st_reload', '1'); location.reload(); return; } }
          sessionStorage.removeItem('st_reload');
        } else if (locHas) statePush();
      } catch (e) {}
    }
    function getCart() { const c = ls.get('cart_products', []); return Array.isArray(c) ? c : []; }
    function saveCart(c) { statePush(); ls.set('cart_products', c.map(i => { const o = { id: i.id, selectedSize: i.selectedSize === undefined ? null : i.selectedSize, selectedColor: i.selectedColor === undefined ? null : i.selectedColor, qty: i.qty || 1 }; if (i.sel) o.sel = i.sel; return o; })); updateBadges(); }
    function sameLine(i, id, size, color) { return !i.sel && String(i.id) === String(id) && (i.selectedSize == null ? null : i.selectedSize) == (size == null ? null : size) && (i.selectedColor == null ? null : i.selectedColor) == (color == null ? null : color); }
    function cartFind(id, size, color) { return getCart().find(i => sameLine(i, id, size, color)); }
    function cartSet(id, size, color, qty) {
      let c = getCart(); const idx = c.findIndex(i => sameLine(i, id, size, color));
      if (qty <= 0) { if (idx >= 0) c.splice(idx, 1); }
      else if (idx >= 0) c[idx].qty = qty; else c.push({ id: id, selectedSize: size, selectedColor: color, qty: qty });
      saveCart(c);
    }
    function getFavs() { const f = ls.get('fav_products', []); return Array.isArray(f) ? f : []; }
    function toggleFav(id) { statePush(); let f = getFavs(); const i = f.findIndex(x => String(x) === String(id)); if (i >= 0) f.splice(i, 1); else f.push(id); ls.set('fav_products', f); updateBadges(); return i < 0; }
    function isFav(id) { return getFavs().some(x => String(x) === String(id)); }
    function getNotified() { return ls.get('notified_products', []); }
    function toggleNotify(id) { let n = getNotified(); const i = n.indexOf(id); if (i >= 0) n.splice(i, 1); else n.push(id); ls.set('notified_products', n); return i < 0; }
    function updateBadges() {
      const cb = document.getElementById('cartBadge'), fb = document.getElementById('favBadge');
      const cnt = getCart().reduce((s, i) => s + (i.qty || 1), 0), fc = getFavs().length;
      if (cb) { cb.textContent = cnt; cb.classList.toggle('show', cnt > 0); }
      if (fb) { fb.textContent = fc; fb.classList.toggle('show', fc > 0); }
    }

    /* ---------------- Sharhlar ---------------- */
    function allReviews() {
      const seen = {}, out = [];
      (db.reviews || []).concat(ls.get('local_reviews', [])).forEach(r => { const k = r.id; if (k != null && seen[k]) return; if (k != null) seen[k] = 1; out.push(r); });
      return out;
    }
    function reviewsFor(pid) { return allReviews().filter(r => String(r.product_id) === String(pid)).sort((a, b) => String(b.date).localeCompare(String(a.date))); }
    function ratingOf(p) {
      const rs = reviewsFor(p.id);
      if (rs.length) return { avg: rs.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rs.length, count: rs.length };
      if (p.rating && p.comments) return { avg: Number(p.rating), count: p.comments };
      return { avg: 0, count: 0 };
    }
    const STAR_PATH = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
    function starsHtml(n, size) {
      let h = '';
      for (let i = 1; i <= 5; i++) h += `<svg class="sh-star ${i <= Math.round(n) ? 'on' : ''}" style="width:${size || 15}px;height:${size || 15}px" viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg>`;
      return `<span class="sh-stars">${h}</span>`;
    }
    function reviewHtml(r, p) {
      const anon = !r.name;
      const name = anon ? tr('r_anon') : esc(r.name);
      let variant = '';
      if (p && (r.color || r.size)) {
        const c = r.color ? colorOf(p, r.color) : null;
        const parts = [];
        if (c) parts.push(tr('p_color') + ': ' + esc(loc(c.name)));
        if (r.size) parts.push(tr('p_size') + ': ' + esc(r.size));
        variant = parts.join('  ·  ');
      }
      const photos = (r.photos || []).map((u, i) => `<img src="${esc(u)}" alt="" loading="lazy" data-lb="${i}">`).join('');
      return `<div class="sh-review" data-rid="${esc(r.id)}">
        <div class="sh-review-head">
          <div class="sh-avatar ${anon ? 'anon' : ''}">${anon ? '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' : esc(String(r.name).trim().charAt(0).toUpperCase())}</div>
          <div class="sh-review-who"><div class="sh-review-name">${name}</div>${starsHtml(r.rating, 14)}</div>
          <div class="sh-review-date">${esc(fmtDate(r.date))}</div>
        </div>
        ${variant ? `<div class="sh-review-variant">${variant}</div>` : ''}
        ${r.pros ? `<div class="sh-review-text">${esc(r.pros)}</div>` : ''}
        ${r.text ? `<div class="sh-review-text">${esc(r.text)}</div>` : ''}
        ${r.cons ? `<div class="sh-review-text muted">${esc(r.cons)}</div>` : ''}
        ${photos ? `<div class="sh-review-photos">${photos}</div>` : ''}
        ${r.reply ? `<div class="sh-reply"><div class="sh-reply-name">${esc(r.reply.name || tr('r_seller'))}</div><div class="sh-reply-text">${esc(r.reply.text)}</div></div>` : ''}
      </div>`;
    }
    // Sharh ichidagi rasmni bosganda katta ko'rsatish
    function bindReviewPhotos(root, listFn) {
      root.addEventListener('click', e => {
        const img = e.target.closest('img[data-lb]'); if (!img) return;
        const card = img.closest('.sh-review'); const rid = card && card.getAttribute('data-rid');
        const r = listFn().find(x => String(x.id) === String(rid)); if (!r) return;
        lightbox(r.photos, parseInt(img.getAttribute('data-lb'), 10) || 0);
      });
    }

    /* ---------------- Oynalar (sheet / lightbox) va orqaga tugmasi ---------------- */
    const overlays = [];
    function pushOverlay(el) {
      overlays.push(el); lockScroll(); fitSheets(); history.pushState({ sh: overlays.length }, '');
      return () => { const i = overlays.indexOf(el); if (i === overlays.length - 1) history.back(); else if (i >= 0) { overlays.splice(i, 1); el.remove(); } };
    }
    window.addEventListener('popstate', () => {
      if (overlays.length) { window.__shOverlayPop = Date.now(); const el = overlays.pop(); el.classList.remove('show'); setTimeout(() => el.remove(), 220); lockScroll(); }
    });
    // Klaviatura chiqqanda oyna uning ustida qoladi (iOS: visualViewport, Android: oyna o'zi kichrayadi)
    function fitSheets() {
      const vv = window.visualViewport; const root = document.documentElement;
      const kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      root.style.setProperty('--kb', kb + 'px'); root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px');
    }
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitSheets); window.visualViewport.addEventListener('scroll', fitSheets); }
    window.addEventListener('resize', fitSheets);
    document.addEventListener('focusin', e => {
      const el = e.target; if (!el || !el.closest || !el.closest('.sh-sheet')) return;
      setTimeout(() => { fitSheets(); try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 320);
    });
    function lockScroll() { document.documentElement.style.overflow = overlays.length ? 'hidden' : ''; }
    function closeTop() { if (overlays.length) { history.back(); return true; } return false; }
    function sheet(opts) {
      const el = document.createElement('div'); el.className = 'sh-sheet-wrap';
      el.innerHTML = `<div class="sh-sheet-bg"></div><div class="sh-sheet" role="dialog"><div class="sh-sheet-grab"></div>
        ${opts.title ? `<div class="sh-sheet-title">${opts.title}</div>` : ''}<div class="sh-sheet-body">${opts.html || ''}</div></div>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      const close = pushOverlay(el);
      el.querySelector('.sh-sheet-bg').addEventListener('click', close);
      { const gr = el.querySelector('.sh-sheet-grab'); if (gr) gr.style.touchAction = 'none'; }
      // pastga surib yopish (xarita va matn kiritiladigan joylar bundan mustasno)
      { const panel = el.querySelector('.sh-sheet'), body = panel.querySelector('.sh-sheet-body'); let y0 = null, dy = 0;
        const begin = (y, target) => { if (target && target.closest && target.closest('input,textarea,select,.sh-map-view,.sh-map-wrap,.sh-map-s')) return; if (body && body.scrollTop > 0) return; y0 = y; dy = 0; panel.style.transition = 'none'; };
        const move = (y, ev) => { if (y0 === null) return; dy = Math.max(0, y - y0); if (dy > 6) { panel.style.transform = 'translateY(' + dy + 'px)'; if (ev && ev.cancelable) ev.preventDefault(); } };
        const endS = () => { if (y0 === null) return; const d = dy; y0 = null; panel.style.transition = ''; panel.style.transform = ''; if (d > 90) close(); };
        panel.addEventListener('touchstart', e => { const t = e.touches[0]; begin(t.clientY, e.target); }, { passive: true });
        panel.addEventListener('touchmove', e => { if (y0 !== null) move(e.touches[0].clientY, e); }, { passive: false });
        panel.addEventListener('touchend', endS); panel.addEventListener('touchcancel', endS);
        panel.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') begin(e.clientY, e.target); });
        panel.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientY, null); });
        panel.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') endS(); });
      }
      if (opts.onMount) opts.onMount(el.querySelector('.sh-sheet-body'), close);
      return { el, close, body: el.querySelector('.sh-sheet-body') };
    }
    function confirmSheet(message, okLabel, okCls) {
      return new Promise(resolve => {
        let done = false;
        const s = sheet({ html: `<div class="sh-confirm-text">${esc(message)}</div>
          <div class="sh-row"><button class="sh-btn ghost" data-a="no">${esc(tr('cancel'))}</button><button class="sh-btn ${okCls === undefined ? 'danger' : okCls}" data-a="yes">${esc(okLabel || tr('yes'))}</button></div>` });
        s.el.style.zIndex = '3500'; // xarita (3200) ustida ham ko'rinsin
        s.el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; done = true; const yes = b.getAttribute('data-a') === 'yes'; s.close(); setTimeout(() => resolve(yes), 0); });
        const obs = new MutationObserver(() => { if (!document.body.contains(s.el)) { obs.disconnect(); if (!done) resolve(false); } });
        obs.observe(document.body, { childList: true });
      });
    }
    function lightbox(images, start) {
      if (!images || !images.length) return;
      const el = document.createElement('div'); el.className = 'sh-lightbox';
      el.innerHTML = `<button class="sh-lb-close" aria-label="close"><svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
        <div class="sh-lb-track">${images.map(u => `<div class="sh-lb-slide"><img src="${esc(u)}" alt=""></div>`).join('')}</div>
        ${images.length > 1 ? `<div class="sh-lb-count"><span id="shLbN">${(start || 0) + 1}</span> / ${images.length}</div>` : ''}`;
      document.body.appendChild(el);
      requestAnimationFrame(() => { el.classList.add('show'); const tk = el.querySelector('.sh-lb-track'); tk.scrollLeft = (start || 0) * tk.clientWidth; });
      const close = pushOverlay(el);
      el.querySelector('.sh-lb-close').addEventListener('click', close);
      const tk = el.querySelector('.sh-lb-track');
      tk.addEventListener('scroll', () => { const n = el.querySelector('#shLbN'); if (n) n.textContent = Math.round(tk.scrollLeft / tk.clientWidth) + 1; });
    }
    let toastTimer = null;
    function toast(msg) {
      let t = document.getElementById('shToast');
      if (!t) { t = document.createElement('div'); t.id = 'shToast'; t.className = 'sh-toast'; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }
    function defaultBack() {
      if (location.hash && history.length > 1) { history.back(); return; }
      if (history.length > 1 && document.referrer) history.back(); else location.href = 'index.html';
    }
    let backHook = null;
    function onBack(fn) { backHook = fn; }
    function goBack() { if (closeTop()) return; if (backHook && backHook() === true) return; defaultBack(); }
    function setupTelegram() {
      const tg = window.Telegram && window.Telegram.WebApp; if (!tg) return;
      try { tg.ready(); tg.expand(); } catch (e) {}
      // To'liq ekran: birinchi bosishda (brauzer talabi), keyin ham urinib ko'radi
      const fs = () => { try { if (tg.requestFullscreen && !tg.isFullscreen && (!tg.isVersionAtLeast || tg.isVersionAtLeast('8.0'))) tg.requestFullscreen(); } catch (e) {} };
      fs(); ['pointerdown', 'touchstart', 'click'].forEach(ev => document.addEventListener(ev, fs, { capture: true }));
      // Telegram tugmalari (ustki) va tizim paneli (pastki) zonasi: CSS o'zgaruvchilari
      const insets = () => { const st = document.documentElement.style, mob = /android|ios/.test(tg.platform || ''), k = n => ((tg.contentSafeAreaInset && tg.contentSafeAreaInset[n]) || 0) + ((tg.safeAreaInset && tg.safeAreaInset[n]) || 0); st.setProperty('--tg-top', (k('top') || 56) + 'px'); st.setProperty('--tg-bottom', k('bottom') + 'px'); };
      insets(); try { ['contentSafeAreaChanged', 'safeAreaChanged', 'viewportChanged', 'fullscreenChanged'].forEach(ev => tg.onEvent(ev, insets)); } catch (e) {}
      if (tg.BackButton) { try { tg.BackButton.offClick(goBack); } catch (e) {} tg.BackButton.onClick(goBack); tg.BackButton.show(); }
      try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
    }
    function updateNavInset() {
      const tg = window.Telegram && window.Telegram.WebApp; let sys = 0;
      if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
      const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom')); if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
      document.body.appendChild(probe); const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0; probe.remove(); sys = Math.max(sys, envPx);
      let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0; const manual = parseFloat(ls.raw('nav_extra', NaN)); if (!isNaN(manual)) extra = manual;
      document.documentElement.style.setProperty('--nav-extra', extra + 'px');
    }
    // Server bor-yo'qligini aniqlash va (Telegramda) avtomatik kirish. Har bir sahifada bir marta chaqiriladi.
    function boot() { whenReady().then(() => { if (isRemote()) whenSession(); }); }
    function init() {
      whenReady().then(() => { if (isRemote()) whenSession(); });   // serverni erta uyg'otish va sessiyani tayyorlash
      applyTheme(); document.documentElement.lang = lang(); applyI18n(); updateNavInset(); setupTelegram(); updateBadges();
      window.addEventListener('pageshow', e => { if (e.persisted) { applyTheme(); applyI18n(); updateBadges(); setupTelegram(); } });
    }
    /* ============================================================================
       KIRISH (AKKAUNT)
       Uch xil rejim:
         1) Telegram ichida + server bor : avtomatik kirish (Telegram ID). Raqam: "Raqamni ulashish" tugmasi.
         2) Oddiy brauzer  + server bor : email + 6 xonali kod.
         3) Server yo'q (faqat sinov)   : telefon + demo kod, hammasi shu qurilmada saqlanadi.
       ============================================================================ */
    function getAuth() { return ls.get('auth', null); }
    function setAuth(a) { ls.set('auth', a); }
    function user() {
      const a = getAuth(); if (!a || !a.user) return null;
      if (isRemote() && a.token === 'local') return null;   // eski demo akkaunt serverda ishlamaydi
      return a.user;
    }
    function logout() {
      const tg = tgApp(); const tu = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      try {
        ['auth', 'pending_email', 'checkout_pending', 'checkout_draft', 'cart_products', 'fav_products', 'notified_products', 'notified_synced', 'last_address', 'last_geo'].forEach(k => localStorage.removeItem(k));
        ls.setRaw('no_auto', tu ? String(tu.id) : '');
      } catch (e) {}
    }
    // Buyurtma berish mumkinmi? (Telegramda raqam tasdiqlangan bo'lishi shart)
    function canOrder() { const u = user(); if (!u) return false; if (isRemote() && u.kind === 'tg' && !u.phone_verified) return false; return true; }

    async function api(path, o) {
      o = o || {};
      const h = { 'Content-Type': 'application/json' }, a = getAuth();
      if (o.auth !== false && a && a.token && a.token !== 'local') h.Authorization = 'Bearer ' + a.token;
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 70000);   // bepul server uyg'onishi uzoq bo'lishi mumkin
      let res;
      try { res = await fetch(API + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined, signal: ctl.signal }); }
      finally { clearTimeout(timer); }
      let data = null; try { data = await res.json(); } catch (e) {}
      if (!res.ok) { const err = new Error((data && (data.detail || data.error)) || ('HTTP ' + res.status)); err.status = res.status; err.code = data && data.code; throw err; }
      return data;
    }
    function cleanPhone(v) { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('998')) d = d.slice(3); return d.slice(0, 9); }
    function fmtPhoneInput(d) { return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' '); }
    function fullPhone(d9) { return '+998' + d9; }
    function showPhone(p) { const d = cleanPhone(p); return d.length === 9 ? '+998 ' + fmtPhoneInput(d) : String(p || ''); }

    /* ---- Server bilan sessiya ---- */
    let sessionP = null;
    function whenSession() { if (!sessionP) sessionP = startSession(); return sessionP; }
    async function tgLogin(tg) { const r = await api('/api/auth/telegram', { method: 'POST', auth: false, body: { initData: tg.initData, lang: lang() } }); setAuth({ token: r.token, user: r.user }); ls.setRaw('no_auto', ''); }
    async function startSession() {
      const srv = await whenReady(); if (!srv) return user();
      const tg = tgApp();
      try {
        const a = getAuth();
        if (tg && srv.telegram) {
          const tuid = tg.initDataUnsafe.user.id;
          if (!a || a.token === 'local' || !a.user || a.user.tg !== tuid) { if (ls.raw('no_auto', '') !== String(tuid)) await tgLogin(tg); }
          else { try { a.user = await api('/api/me'); setAuth(a); } catch (e) { if (e.status === 401) await tgLogin(tg); } }
        } else if (a && a.token && a.token !== 'local') {
          try { a.user = await api('/api/me'); setAuth(a); } catch (e) { if (e.status === 401) logout(); }
        }
      } catch (e) { /* tarmoq xatosi: eski ma'lumot bilan davom etamiz */ }
      syncNotified(); await syncState();
      return user();
    }
    // "Kelganda xabar qil": qurilmadagi ro'yxatni serverga moslab turadi (index/products sahifalari ham o'zlari shu ro'yxatni yuritadi)
    async function syncNotified() {
      try {
        if (!isRemote() || !getAuth() || getAuth().token === 'local') return;
        const now = getNotified().map(String), done = ls.get('notified_synced', []).map(String);
        for (const id of now) if (done.indexOf(id) < 0) await api('/api/notify', { method: 'POST', body: { product_id: id } });
        for (const id of done) if (now.indexOf(id) < 0) await api('/api/notify', { method: 'POST', body: { product_id: id, off: true } });
        ls.set('notified_synced', now);
      } catch (e) {}
    }

    /* ---- Qurilmadagi (demo) rejim ---- */
    async function requestCodeLocal(phone) {
      const code = String(Math.floor(10000 + Math.random() * 90000));
      ls.set('local_code', { phone: phone, code: code, exp: Date.now() + 5 * 60000 });
      return { ok: true, dev_code: code };
    }
    async function verifyCodeLocal(phone, code, name) {
      const c = ls.get('local_code', null);
      if (!c || c.phone !== phone || c.code !== String(code) || Date.now() > c.exp) throw new Error('wrong_code');
      const users = ls.get('local_users', {}); const u = users[phone] || { id: phone, phone: phone, name: '', kind: 'local' };
      if (name) u.name = name; users[phone] = u; ls.set('local_users', users); setAuth({ token: 'local', user: u });
      try { localStorage.removeItem('local_code'); } catch (e) {}
      return u;
    }
    async function updateName(name) {
      const a = getAuth(); if (!a) return;
      if (isRemote() && a.token !== 'local') { const r = await api('/api/me', { method: 'PUT', body: { name: name } }); a.user = r; }
      else { a.user.name = name; const users = ls.get('local_users', {}); if (users[a.user.phone]) users[a.user.phone].name = name; ls.set('local_users', users); }
      setAuth(a);
    }

    /* ---- Kirish oynasi: rejimga qarab to'g'ri oynani ochadi ---- */
    // opts.resume = true  -> avval boshlangan emailni tasdiqlashni davom ettirish
    function openLogin(onDone, opts) {
      const srv = server;
      if (srv && tgApp() && srv.telegram) return openTelegramVerify(onDone);
      if (srv && srv.email) return openEmailLogin(onDone, opts);
      if (srv) return sheet({ title: esc(tr('a_login_title')), html: `<div class="sh-sub">${esc(tr('a_not_ready'))}</div>` });
      return openLoginLocal(onDone);
    }

    /* ---- 1) Telegram: raqamni ulashish ---- */
    function openTelegramVerify(onDone) {
      const tg = tgApp(); let timer = null, busy = false, started = false;
      const s = sheet({
        title: esc(tr('a_tg_title')),
        html: `<div class="sh-sub">${esc(tr('a_tg_text'))}</div>
          <label class="sh-label">${esc(tr('a_name'))}</label>
          <input class="sh-input" id="shName" maxlength="40" placeholder="${esc(tr('a_name_ph'))}">
          <div class="sh-err" id="shErr"></div>
          <button class="sh-btn" id="shShare"><svg class="sh-btn-ic" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>${esc(tr('a_tg_share'))}</button>
          <div class="sh-note" id="shWait" style="display:none">${esc(tr('a_tg_waiting'))}</div>
          <div class="sh-note">${esc(tr('a_tg_bot_hint'))}</div>
          <button class="sh-btn ghost" id="shBot">${esc(tr('a_tg_open_bot'))}</button>`,
        onMount(body, close) {
          const $ = id => body.querySelector('#' + id);
          const u0 = user(); $('shName').value = (u0 && u0.name) || ls.raw('last_name', '');
          const stop = () => { clearInterval(timer); timer = null; document.removeEventListener('visibilitychange', check); };
          async function check() {
            if (!document.body.contains(s.el)) return stop();
            if (busy) return; busy = true;
            try {
              const me = await api('/api/me');
              if (me && me.phone_verified) { const a = getAuth(); a.user = me; setAuth(a); stop(); close(); setTimeout(() => { toast(tr('a_tg_ok')); if (onDone) onDone(me); }, 260); }
            } catch (e) {}
            busy = false;
          }
          function waitForPhone() {
            $('shWait').style.display = ''; $('shErr').textContent = ''; if (started) return; started = true;
            document.addEventListener('visibilitychange', check);
            let n = 0; timer = setInterval(() => { if (++n > 80) { stop(); started = false; $('shWait').style.display = 'none'; $('shErr').textContent = tr('a_tg_timeout'); return; } check(); }, 1500);
          }
          function openBot() { const link = 'https://t.me/' + ((server && server.bot) || ''); try { tg.openTelegramLink(link); } catch (e) { window.open(link, '_blank'); } }
          async function saveName() { const nm = $('shName').value.trim(); ls.setRaw('last_name', nm); try { await api('/api/me', { method: 'PUT', body: { name: nm } }); const a = getAuth(); if (a && a.user) { a.user.name = nm; setAuth(a); } } catch (e) {} }
          async function begin(viaBot) {
            if (!$('shName').value.trim()) { $('shErr').textContent = tr('a_need_name'); return; }
            $('shErr').textContent = '';
            await whenSession(); let a = getAuth(); if ((!a || a.token === 'local') && tg.initData) { try { await tgLogin(tg); } catch (e) {} a = getAuth(); } if (!a || a.token === 'local') { $('shErr').textContent = tr('error_generic'); return; }
            await saveName();
            const can = !viaBot && typeof tg.requestContact === 'function' && (!tg.isVersionAtLeast || tg.isVersionAtLeast('8.0'));
            if (can && !(await confirmSheet(tr('c_phone_ask'), tr('c_yes'), ''))) return;
            if (can) { try { tg.requestContact(function () { check(); }); } catch (e) { openBot(); } } else openBot();
            waitForPhone();
          }
          $('shShare').addEventListener('click', () => begin(false));
          $('shBot').addEventListener('click', () => begin(true));
        }
      });
      return s;
    }

    /* ---- 2) Brauzer: email + kod. Qolgan joyidan davom etadi (pending_email) ---- */
    function openEmailLogin(onDone, opts) {
      const pend = ls.get('pending_email', null);
      const resume = !!(opts && opts.resume && pend && Date.now() - pend.ts < 600000);
      let timer = null, email = resume ? pend.email : '';
      const s = sheet({
        title: esc(tr('a_login_title')),
        html: `<div id="shStep1">
            <div class="sh-sub">${esc(tr('a_email_text'))}</div>
            <label class="sh-label">${esc(tr('a_name'))}</label>
            <input class="sh-input" id="shName" maxlength="40" placeholder="${esc(tr('a_name_ph'))}" autocomplete="name">
            <label class="sh-label">${esc(tr('a_email'))}</label>
            <input class="sh-input" id="shEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="${esc(tr('a_email_ph'))}">
            <div class="sh-err" id="shErr1"></div>
            <button class="sh-btn" id="shGet">${esc(tr('a_get_code'))}</button>
          </div>
          <div id="shStep2" style="display:none">
            <div class="sh-sent" id="shSent"></div>
            <div class="sh-note" id="shNote"></div>
            <div class="sh-demo" id="shDemo" style="display:none"></div>
            <label class="sh-label">${esc(tr('a_code'))}</label>
            <input class="sh-input sh-code" id="shCode" inputmode="numeric" maxlength="6" placeholder="• • • • • •" autocomplete="one-time-code">
            <div class="sh-err" id="shErr2"></div>
            <button class="sh-btn" id="shOk">${esc(tr('a_confirm'))}</button>
            <button class="sh-btn ghost" id="shResend" disabled></button>
            <button class="sh-btn ghost" id="shChange">${esc(tr('a_change_email'))}</button>
          </div>`,
        onMount(body, close) {
          const $ = id => body.querySelector('#' + id);
          $('shName').value = (pend && pend.name) || ls.raw('last_name', ''); $('shEmail').value = (pend && pend.email) || ls.raw('last_email', '');
          function startTimer(from) {
            let left = from == null ? 45 : from; clearInterval(timer);
            const tick = () => { const b = $('shResend'); if (!b) return clearInterval(timer); if (left > 0) { b.disabled = true; b.textContent = tr('a_resend_in', { s: left }); left--; } else { b.disabled = false; b.textContent = tr('a_resend'); clearInterval(timer); } };
            tick(); timer = setInterval(tick, 1000);
          }
          function showDev(code) { if (code) { const d = $('shDemo'); d.style.display = ''; d.textContent = tr('a_demo_email', { code: code }); } }
          function showStep2(devCode) {
            $('shStep1').style.display = 'none'; $('shStep2').style.display = '';
            $('shSent').textContent = tr('a_email_sent', { email: email }); $('shNote').textContent = tr('a_email_note');
            showDev(devCode); setTimeout(() => $('shCode').focus(), 80);
          }
          $('shGet').addEventListener('click', async () => {
            const name = $('shName').value.trim(); email = $('shEmail').value.trim().toLowerCase();
            if (!name) { $('shErr1').textContent = tr('a_need_name'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('shErr1').textContent = tr('a_bad_email'); return; }
            $('shErr1').textContent = ''; const b = $('shGet'); b.disabled = true; b.textContent = tr('a_wait');
            try {
              await whenReady();
              const r = await api('/api/auth/email/request', { method: 'POST', auth: false, body: { email: email } });
              ls.setRaw('last_name', name); ls.setRaw('last_email', email); ls.set('pending_email', { email: email, name: name, ts: Date.now() });
              showStep2(r && r.dev_code); startTimer();
            } catch (e) { $('shErr1').textContent = (e && e.status ? e.message : tr('error_generic')); }
            b.disabled = false; b.textContent = tr('a_get_code');
          });
          $('shResend').addEventListener('click', async () => {
            $('shResend').disabled = true;
            try { const r = await api('/api/auth/email/request', { method: 'POST', auth: false, body: { email: email } }); ls.set('pending_email', { email: email, name: $('shName').value.trim(), ts: Date.now() }); showDev(r && r.dev_code); $('shErr2').textContent = ''; startTimer(); }
            catch (e) { $('shErr2').textContent = (e && e.status ? e.message : tr('error_generic')); startTimer(30); }
          });
          $('shChange').addEventListener('click', () => { try { localStorage.removeItem('pending_email'); } catch (e) {} clearInterval(timer); $('shStep2').style.display = 'none'; $('shStep1').style.display = ''; });
          $('shOk').addEventListener('click', async () => {
            const code = $('shCode').value.trim(); if (code.length < 6) { $('shErr2').textContent = tr('a_wrong_code'); return; }
            const b = $('shOk'); b.disabled = true;
            try {
              const r = await api('/api/auth/email/verify', { method: 'POST', auth: false, body: { email: email, code: code, name: $('shName').value.trim(), lang: lang() } });
              setAuth({ token: r.token, user: r.user }); try { localStorage.removeItem('pending_email'); } catch (e) {}
              clearInterval(timer); close();
              setTimeout(() => { toast(tr('a_welcome', { name: r.user.name || '' })); if (onDone) onDone(r.user); }, 260);
            } catch (e) { $('shErr2').textContent = (e && e.code === 'expired') ? tr('a_code_expired') : tr('a_wrong_code'); b.disabled = false; }
          });
          if (resume) { showStep2(null); startTimer(Math.max(0, 45 - Math.round((Date.now() - pend.ts) / 1000))); }
        }
      });
      return s;
    }
    // Emailga kod yuborilgan va hali tasdiqlanmagan bo'lsa true (sahifa qayta ochilganda oynani davom ettirish uchun)
    function hasPendingEmail() { const p = ls.get('pending_email', null); return !!(p && Date.now() - p.ts < 600000); }

    /* ---- 3) Demo rejim (server yo'q) ---- */
    function openLoginLocal(onDone) {
      const lastName = ls.raw('last_name', '');
      let phone9 = '';
      const s = sheet({
        title: esc(tr('a_login_title')),
        html: `<div class="sh-sub">${esc(tr('a_login_text'))}</div>
          <div id="shStep1">
            <label class="sh-label">${esc(tr('a_name'))}</label>
            <input class="sh-input" id="shName" maxlength="40" placeholder="${esc(tr('a_name_ph'))}" value="${esc(lastName)}">
            <label class="sh-label">${esc(tr('a_phone'))}</label>
            <div class="sh-phone"><span>+998</span><input id="shPhone" inputmode="numeric" autocomplete="tel" placeholder="90 123 45 67"></div>
            <div class="sh-err" id="shErr1"></div>
            <button class="sh-btn" id="shGet">${esc(tr('a_get_code'))}</button>
          </div>
          <div id="shStep2" style="display:none">
            <div class="sh-sent" id="shSent"></div>
            <div class="sh-demo" id="shDemo" style="display:none"></div>
            <label class="sh-label">${esc(tr('a_code'))}</label>
            <input class="sh-input sh-code" id="shCode" inputmode="numeric" maxlength="6" placeholder="• • • • •" autocomplete="one-time-code">
            <div class="sh-err" id="shErr2"></div>
            <button class="sh-btn" id="shOk">${esc(tr('a_confirm'))}</button>
          </div>`,
        onMount(body, close) {
          const $ = id => body.querySelector('#' + id);
          $('shPhone').addEventListener('input', e => { phone9 = cleanPhone(e.target.value); e.target.value = fmtPhoneInput(phone9); });
          $('shGet').addEventListener('click', async () => {
            const name = $('shName').value.trim();
            if (!name) { $('shErr1').textContent = tr('a_need_name'); return; }
            if (phone9.length !== 9) { $('shErr1').textContent = tr('a_bad_phone'); return; }
            const r = await requestCodeLocal(fullPhone(phone9)); ls.setRaw('last_name', name);
            $('shStep1').style.display = 'none'; $('shStep2').style.display = '';
            $('shSent').textContent = tr('a_code_sent', { phone: showPhone(phone9) });
            const d = $('shDemo'); d.style.display = ''; d.textContent = tr('a_demo_note', { code: r.dev_code }); setTimeout(() => $('shCode').focus(), 50);
          });
          $('shOk').addEventListener('click', async () => {
            const code = $('shCode').value.trim(); if (code.length < 4) { $('shErr2').textContent = tr('a_wrong_code'); return; }
            try {
              const u = await verifyCodeLocal(fullPhone(phone9), code, $('shName').value.trim());
              close(); setTimeout(() => { toast(tr('a_welcome', { name: u.name || '' })); if (onDone) onDone(u); }, 260);
            } catch (e) { $('shErr2').textContent = tr('a_wrong_code'); }
          });
        }
      });
      return s;
    }

    /* ---------------- Buyurtmalar ---------------- */
    function makeSnapshot(it) {
      const p = product(it.id) || {};
      if (it.sel && isGenericP(p)) {   // admin yaratgan xususiyatlar (voltaj, xotira...)
        const opts = axesOf(p).map(a => { const v = a.values.find(x => x.id === it.sel[a.key]); return { name: a.name, value: v ? v.name : '' }; });
        return { product_id: it.id, name: p.name || '', image: selImage(p, it.sel), price: num(p.price), sel: it.sel, opts: opts, qty: it.qty, reviewed: false };
      }
      const c = it.color ? colorOf(p, it.color) : null;
      return { product_id: it.id, name: p.name || '', image: productImage(p, it.color), price: num(p.price), color: it.color || null, color_name: c ? c.name : null, size: it.size == null ? null : it.size, qty: it.qty, reviewed: false };
    }
    async function listOrders() {
      if (isRemote()) { await whenSession(); return await api('/api/orders'); }
      const u = user(); if (!u) return [];
      return ls.get('local_orders', []).filter(o => o.phone === u.phone).sort((a, b) => String(b.created).localeCompare(String(a.created)));
    }
    // d: {items, name, phone, address, comment, cid}   cid = takroriy bosishdan himoya (bitta buyurtma = bitta cid)
    async function placeOrder(d) {
      if (isRemote()) {
        await whenSession();
        return await api('/api/orders', { method: 'POST', body: { name: d.name, phone: d.phone, address: d.address, geo: d.geo || undefined, payment: d.payment || 'cash', comment: d.comment, client_id: d.cid, items: d.items.map(i => ({ product_id: i.id, color: i.color, size: i.size, sel: i.sel || undefined, qty: i.qty })) } });
      }
      const u = user(); const all = ls.get('local_orders', []);
      const items = d.items.map(makeSnapshot);
      const order = { id: 'L' + Date.now().toString(36), number: all.length + 1001, status: 'new', created: new Date().toISOString(), phone: u.phone, contact_phone: d.phone || u.phone, name: d.name, address: d.address, geo: d.geo || null, payment: d.payment || 'cash', comment: d.comment || '', items: items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
      all.push(order); ls.set('local_orders', all); return order;
    }
    function localMarkDelivered(id) { const all = ls.get('local_orders', []); const o = all.find(x => x.id === id); if (o) { o.status = 'delivered'; ls.set('local_orders', all); } }
    function isReviewed(orderId, pid, item) { return !!(item && item.reviewed) || ls.get('reviewed_items', []).indexOf(orderId + ':' + pid) >= 0; }

    async function submitReview(d) {
      // d: {order_id, product_id, rating, text, anonymous, photos, color, size}
      const u = user(); let r;
      if (isRemote()) r = await api('/api/reviews', { method: 'POST', body: d });
      else r = { id: 'R' + Date.now().toString(36), product_id: d.product_id, name: d.anonymous ? null : (u && u.name) || null, rating: d.rating, text: d.text, date: new Date().toISOString().slice(0, 10), color: d.color, size: d.size, photos: d.photos || [] };
      const loc_ = ls.get('local_reviews', []); loc_.push(r); ls.set('local_reviews', loc_);
      const ri = ls.get('reviewed_items', []); ri.push(d.order_id + ':' + d.product_id); ls.set('reviewed_items', ri);
      return r;
    }
    function pickPhotos(files, max) {
      const list = Array.prototype.slice.call(files || [], 0, max);
      return Promise.all(list.map(f => new Promise(resolve => {
        const fr = new FileReader();
        fr.onload = () => { const img = new Image(); img.onload = () => {
          const k = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.78)); }; img.onerror = () => resolve(null); img.src = fr.result; };
        fr.onerror = () => resolve(null); fr.readAsDataURL(f);
      }))).then(a => a.filter(Boolean));
    }
    function openReviewSheet(order, item, onDone, ex) {
      const u = user() || {}; const p = product(item.product_id) || {};
      let rating = ex ? (ex.rating || 0) : 0, photos = ex ? (ex.photos || []).slice() : []; const anon0 = ex ? !!ex.anon : !u.name;
      const nm = loc(item.name);
      const s = sheet({
        title: esc(tr(ex ? 'r_edit' : 'r_write')),
        html: `<div class="sh-rv-prod"><img src="${esc(item.image || productImage(p, item.color))}" alt=""><div><div class="sh-rv-name">${esc(nm)}</div></div></div>
          <label class="sh-label">${esc(tr('r_rating_label'))}</label>
          <div class="sh-rate-pick" id="shRate">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" aria-label="${i}"><svg viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg></button>`).join('')}</div>
          <textarea class="sh-input sh-ta" id="shText" maxlength="600" placeholder="${esc(tr('r_text_ph'))}">${esc(ex ? (ex.text || '') : '')}</textarea>
          <div class="sh-photos" id="shPh"></div>
          <input type="file" id="shFile" accept="image/*" multiple style="display:none">
          <label class="sh-label">${esc(tr('r_post_as'))}</label>
          <div class="sh-seg" id="shAs"><button type="button" class="${anon0 ? '' : 'on'}" data-v="name" ${u.name ? '' : 'disabled'}>${esc(tr('r_as_name', { name: u.name || '—' }))}</button><button type="button" class="${anon0 ? 'on' : ''}" data-v="anon">${esc(tr('r_as_anon'))}</button></div>
          <div class="sh-err" id="shErr"></div>
          <button class="sh-btn" id="shSend">${esc(tr('r_send'))}</button>`,
        onMount(body, close) {
          const $ = id => body.querySelector('#' + id); let asAnon = anon0;
          const paintStars = () => $('shRate').querySelectorAll('button').forEach(b => b.classList.toggle('on', parseInt(b.dataset.v, 10) <= rating));
          $('shRate').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { rating = parseInt(b.dataset.v, 10); paintStars(); } });
          $('shAs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; asAnon = b.dataset.v === 'anon'; $('shAs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
          if (ex) paintStars();
          const paintPhotos = () => { $('shPh').innerHTML = photos.map((src, i) => `<div class="sh-ph"><img src="${src}" alt=""><button type="button" data-i="${i}">×</button></div>`).join('') + (photos.length < 3 ? `<button type="button" class="sh-ph-add" id="shAdd"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="3.2"/><path d="M8 5l1.5-2h5L16 5"/></svg><span>${esc(tr('r_add_photo'))}</span></button>` : ''); };
          paintPhotos();
          $('shPh').addEventListener('click', e => { if (e.target.closest('#shAdd')) $('shFile').click(); const x = e.target.closest('[data-i]'); if (x) { photos.splice(parseInt(x.dataset.i, 10), 1); paintPhotos(); } });
          $('shFile').addEventListener('change', async e => { const got = await pickPhotos(e.target.files, 3 - photos.length); photos = photos.concat(got).slice(0, 3); e.target.value = ''; paintPhotos(); });
          $('shSend').addEventListener('click', async () => {
            if (!rating) { $('shErr').textContent = tr('r_rate_required'); return; }
            const b = $('shSend'); b.disabled = true;
            try {
              const r = ex ? await editReview({ id: ex.id, rating: rating, text: $('shText').value.trim(), anonymous: asAnon, photos: photos }) : await submitReview({ order_id: order.id, product_id: item.product_id, rating: rating, text: $('shText').value.trim(), anonymous: asAnon, photos: photos, color: item.color, size: item.size });
              close(); setTimeout(() => { toast(tr(ex ? 'r_saved' : 'r_thanks')); if (onDone) onDone(r); }, 260);
            } catch (e) { $('shErr').textContent = tr('error_generic'); b.disabled = false; }
          });
        }
      });
      return s;
    }


    /* ============================================================================
       SHX-A. YANGI UMUMIY QISMLAR (hamma sahifada bir xil ishlaydi)
         A1. Variant o'qlari (rang, o'lcham, voltaj... admin yaratadi) va savat qatorlari
         A2. Mahsulot kartasidagi "Savatga" tugmasi  ->  -1+ hisoblagich  ->  yana tugma
         A3. "Kelganda xabar qil" (serverga yuboriladi, admin ko'radi)
         A4. Qidiruv: natijalar ro'yxati va moslik tartibi (hamma sahifada bir xil)
       ============================================================================ */
    Object.assign(DICT.uz, {
      cart_btn: "Savatga", notify_btn: "Kelganda xabar qilish", notify_active: "✓ Xabar beriladi", sel_title: "Variantni tanlang", sel_qty: "Soni", sel_add: "Savatga qo'shish",
      exit_btn: "Chiqish", exit_ask: "Ilovadan chiqasizmi?", exit_yes: "Chiqish", last_item: "Oxirgisi", out_of_stock: "Qolmadi",
      s_results: "Natijalar", s_others: "Boshqa mahsulotlar", s_no: "Hech narsa topilmadi...", s_all: "bo'yicha barcha natijalarni ko'rish", s_type: "Qidirish",
      s_product: "Mahsulot", s_cat: "Bo'lim", s_sub: "Turkum", s_hist: "Oxirgi qidiruvlar", s_clear: "Tozalash", s_ph: "Mahsulotlar va turkumlar izlash...",
      need_login_notify: "Xabar olish uchun avval kiring"
    });
    Object.assign(DICT.ru, {
      cart_btn: "В корзину", notify_btn: "Сообщить о поступлении", notify_active: "✓ Сообщим", sel_title: "Выберите вариант", sel_qty: "Количество", sel_add: "Добавить в корзину",
      exit_btn: "Выйти", exit_ask: "Выйти из приложения?", exit_yes: "Выйти", last_item: "Последний", out_of_stock: "Нет в наличии",
      s_results: "Результаты", s_others: "Другие товары", s_no: "Ничего не найдено...", s_all: "показать все результаты", s_type: "Поиск",
      s_product: "Товар", s_cat: "Раздел", s_sub: "Категория", s_hist: "Недавние запросы", s_clear: "Очистить", s_ph: "Поиск товаров и категорий...",
      need_login_notify: "Чтобы получать уведомления, сначала войдите"
    });

    Object.assign(DICT.uz, {
      pay_click: "Click (kartaga o'tkazish)", pay_card: "Karta raqami", pay_holder: "Karta egasi", pay_copy: "Nusxalash", pay_copied: "Karta raqami nusxalandi",
      pay_click_hint: "Buyurtmani olganingizdan keyin pulni shu kartaga o'tkazing.", pay_choose: "To'lov usulini tanlang",
      map_geo_denied: "Joylashuv ruxsati yo'q. Xaritadan qo'lda tanlang.",
      a_switch: "Hisobdan chiqish / hisobni almashtirish", a_tg_logout_note: "Telegram hisobingiz bilan kirgansiz. Boshqa hisob uchun ilovani boshqa Telegram akkauntdan oching."
    });
    Object.assign(DICT.ru, {
      pay_click: "Click (перевод на карту)", pay_card: "Номер карты", pay_holder: "Владелец карты", pay_copy: "Копировать", pay_copied: "Номер карты скопирован",
      pay_click_hint: "Переведите деньги на эту карту после получения заказа.", pay_choose: "Выберите способ оплаты",
      map_geo_denied: "Нет доступа к геолокации. Выберите точку на карте.",
      a_switch: "Выйти / сменить аккаунт", a_tg_logout_note: "Вы вошли через Telegram. Для другого аккаунта откройте приложение из другого аккаунта Telegram."
    });
    Object.assign(DICT.uz, { a_account: "Hisob" });
    Object.assign(DICT.ru, { a_account: "Аккаунт" });
    /* ---------- A1. Variant o'qlari ---------- */
    // Har bir mahsulotning "tanlanadigan xususiyatlari": rang, o'lcham, voltaj va h.k.
    // Yangi mahsulotda admin yaratgan  p.options = [{key, name:{uz,ru}, type:'color'|'text', values:[{id,name,hex,images}]}]
    // Eski mahsulotda p.colors va p.sizes avtomatik shunday o'qlarga aylantiriladi.
    function isGenericP(p) { return !!(p && p.options && p.options.length); }
    function axesOf(p) {
      if (!p) return [];
      if (isGenericP(p)) {
        return p.options.filter(a => a && a.key && (a.values || []).length).map(a => ({
          key: String(a.key), type: a.type === 'color' ? 'color' : 'text', name: a.name || a.key,
          values: a.values.map(v => (v && typeof v === 'object')
            ? { id: String(v.id != null ? v.id : (typeof v.name === 'object' ? (v.name.uz || v.name.ru) : v.name)), name: v.name != null ? v.name : v.id, hex: v.hex || '', images: v.images || [] }
            : { id: String(v), name: String(v), hex: '', images: [] })
        }));
      }
      const ax = [];
      if (p.colors && p.colors.length) ax.push({ key: 'color', type: 'color', name: { uz: 'Rang', ru: 'Цвет' }, values: p.colors.map(c => ({ id: String(c.id), name: c.name, hex: c.hex || '', images: c.images || [] })) });
      if (p.sizes && p.sizes.length) ax.push({ key: 'size', type: 'text', name: { uz: "O'lcham", ru: 'Размер' }, values: p.sizes.map(z => ({ id: String(z), name: String(z), hex: '', images: [] })) });
      return ax;
    }
    function needsChoice(p) { return axesOf(p).some(a => a.values.length > 1); }
    // sel = {color:'red', size:'M', voltage:'220V'}  ->  ombor kaliti
    function selKeyOf(p, sel) {
      sel = sel || {};
      if (!isGenericP(p)) return vkey(sel.color == null ? null : sel.color, sel.size == null ? null : sel.size);
      return axesOf(p).map(a => sel[a.key] == null ? '' : sel[a.key]).join('|');
    }
    function stockForSel(p, sel) {
      if (!p) return 0;
      if (p.variant_stock) { const v = p.variant_stock[selKeyOf(p, sel)]; return v === undefined ? 0 : (Number(v) || 0); }
      return p.stock !== undefined ? p.stock : 10;
    }
    function allSels(p) {
      const ax = axesOf(p); let out = [{}];
      ax.forEach(a => { const nx = []; out.forEach(o => a.values.forEach(v => { if (nx.length < 600) nx.push(Object.assign({}, o, { [a.key]: v.id })); })); out = nx; });
      return out;
    }
    function firstSel(p) { const all = allSels(p); return all.find(s => stockForSel(p, s) > 0) || all[0] || {}; }
    function lineSel(line) { return line.sel ? line.sel : { color: line.selectedColor == null ? null : line.selectedColor, size: line.selectedSize == null ? null : line.selectedSize }; }
    function lineKey(line) { const p = product(line.id); return String(line.id) + '#' + (p ? selKeyOf(p, lineSel(line)) : JSON.stringify(lineSel(line))); }
    function cartFindSel(id, sel) { const p = product(id); const k = String(id) + '#' + (p ? selKeyOf(p, sel) : JSON.stringify(sel)); return getCart().find(i => lineKey(i) === k); }
    function cartSetSel(id, sel, qty) {
      const p = product(id); const k = String(id) + '#' + (p ? selKeyOf(p, sel) : JSON.stringify(sel));
      const c = getCart(); const idx = c.findIndex(i => lineKey(i) === k);
      const clean = {}; if (isGenericP(p)) axesOf(p).forEach(a => { if (sel[a.key] != null) clean[a.key] = sel[a.key]; });
      if (qty <= 0) { if (idx >= 0) c.splice(idx, 1); }
      else if (idx >= 0) c[idx].qty = qty;
      else c.push({ id: id, selectedSize: sel.size == null ? null : sel.size, selectedColor: sel.color == null ? null : sel.color, sel: isGenericP(p) ? clean : undefined, qty: qty });
      saveCart(c);
    }
    function selImage(p, sel) {
      const ax = axesOf(p); sel = sel || {};
      for (const a of ax) { if (a.type !== 'color') continue; const v = a.values.find(x => x.id === sel[a.key]); if (v && v.images && v.images[0]) return v.images[0]; }
      return (p.images && p.images[0]) || (ax[0] && ax[0].values[0] && ax[0].values[0].images[0]) || '';
    }
    // Savatdagi qator uchun o'qiladigan yozuv:  "Qizil · M · 220V"
    function selLabel(p, sel) {
      return axesOf(p).map(a => { const v = a.values.find(x => x.id === (sel || {})[a.key]); return v ? loc(v.name) : ''; }).filter(Boolean).join(' · ');
    }

    /* ---------- A2. Mahsulot kartasidagi savat tugmasi ---------- */
    const CART_SVG = '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
    const jsId = id => "'" + String(id).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    function productLines(pid) { return getCart().filter(i => String(i.id) === String(pid)); }
    // Kartadagi tugma: qolmagan -> "xabar qil";  savatda yo'q -> "Savatga";  savatda bor -> -1+
    function cardButton(p) {
      if (totalStock(p) <= 0) {
        const on = getNotified().map(String).indexOf(String(p.id)) >= 0;
        return `<button class="notify-btn-sm ${on ? 'active-notified' : ''}" onclick="event.stopPropagation(); SH.cardNotify(${jsId(p.id)})">${esc(tr(on ? 'notify_active' : 'notify_btn'))}</button>`;
      }
      const lines = productLines(p.id);
      if (!lines.length) return `<button class="cart-btn-sm" onclick="event.stopPropagation(); SH.cardAdd(${jsId(p.id)})">${CART_SVG}<span>${esc(tr('cart_btn'))}</span></button>`;
      const last = lines[lines.length - 1], total = lines.reduce((s, i) => s + (i.qty || 1), 0);
      const maxed = (last.qty || 1) >= stockForSel(p, lineSel(last));
      return `<div class="cart-counter-box-sm" onclick="event.stopPropagation()">
          <button class="counter-btn-sm" aria-label="-" onclick="SH.cardQty(${jsId(p.id)}, -1)">−</button>
          <span class="counter-val-sm">${total}</span>
          <button class="counter-btn-sm" aria-label="+" onclick="SH.cardQty(${jsId(p.id)}, 1)" ${maxed ? 'disabled' : ''}>+</button>
        </div>`;
    }
    function afterCartChange(id) {
      updateBadges();
      try { if (typeof window.__shSync === 'function') window.__shSync(); } catch (e) {}
      if (typeof window.updateCardInfoOnly === 'function') { const n = Number(id); window.updateCardInfoOnly(isNaN(n) ? id : n); }
      try { window.dispatchEvent(new CustomEvent('sh-cart')); } catch (e) {}
    }
    function addSel(p, sel, n) {
      const st = stockForSel(p, sel), cur = cartFindSel(p.id, sel), q = (cur ? cur.qty : 0) + n;
      if (st <= 0) { toast(tr('p_variant_out')); return false; }
      if (q > st) { toast(tr('p_max', { n: st })); return false; }
      cartSetSel(p.id, sel, q); afterCartChange(p.id); return true;
    }
    function cardAdd(id) {
      const p = product(id); if (!p || totalStock(p) <= 0) return;
      if (needsChoice(p)) { openVariantSheet(p, (sel, q) => { addSel(p, sel, q || 1); }); return; }
      addSel(p, firstSel(p), 1);
    }
    function cardQty(id, d) {
      const p = product(id); if (!p) return;
      const lines = productLines(id); if (!lines.length) return;
      const line = lines[lines.length - 1], sel = lineSel(line), q = (line.qty || 1) + d, st = stockForSel(p, sel);
      if (d > 0 && q > st) { toast(tr('p_max', { n: st })); return; }
      cartSetSel(id, sel, q); afterCartChange(id);
    }
    // Rang/o'lcham/voltaj tanlanadigan mahsulotda "Savatga" bosilganda chiqadigan kichik oyna
    function openVariantSheet(p, onPick) {
      const ax = axesOf(p), sel = Object.assign({}, firstSel(p)); let qty = 1;
      const s = sheet({
        title: esc(tr('sel_title')),
        html: '<div id="shVar"></div>',
        onMount(body, close) {
          const paint = () => {
            const st = stockForSel(p, sel), img = selImage(p, sel); if (qty > st) qty = Math.max(1, st); if (qty < 1) qty = 1;
            body.querySelector('#shVar').innerHTML = `
              <div class="sh-var-head"><img src="${esc(img)}" alt=""><div><div class="sh-var-name">${esc(loc(p.name))}</div><div class="sh-var-price">${esc(money(num(p.price)))}</div>
                <div class="sh-var-stock ${st <= 0 ? 'out' : ''}">${st <= 0 ? esc(tr('p_variant_out')) : (st <= 3 ? esc(tr('p_left', { n: st })) : '')}</div></div></div>
              ${ax.map(a => `<div class="sh-var-axis"><div class="sh-var-lbl">${esc(loc(a.name))}: <b>${esc((() => { const v = a.values.find(x => x.id === sel[a.key]); return v ? loc(v.name) : ''; })())}</b></div>
                <div class="sh-var-chips">${a.values.map(v => {
                  const off = stockForSel(p, Object.assign({}, sel, { [a.key]: v.id })) <= 0;
                  const sw = a.type === 'color' ? (v.images && v.images[0] ? `<img src="${esc(v.images[0])}" alt="">` : `<i style="background:${esc(v.hex || '#ccc')}"></i>`) : '';
                  return `<button type="button" class="sh-chip ${v.id === sel[a.key] ? 'on' : ''} ${off ? 'off' : ''} ${sw ? 'has-sw' : ''}" data-k="${esc(a.key)}" data-v="${esc(v.id)}">${sw}<span>${esc(loc(v.name))}</span></button>`;
                }).join('')}</div></div>`).join('')}
              <div class="sh-var-qty"><span>${esc(tr('sel_qty'))}</span><div class="cart-counter-box-sm"><button type="button" class="counter-btn-sm" data-q="-1" ${qty <= 1 ? 'disabled' : ''}>−</button><span class="counter-val-sm">${qty}</span><button type="button" class="counter-btn-sm" data-q="1" ${qty >= st ? 'disabled' : ''}>+</button></div></div>
              <button class="sh-btn" id="shVarAdd" ${st <= 0 ? 'disabled' : ''}>${esc(tr('sel_add'))}</button>`;
          };
          paint();
          body.addEventListener('click', e => {
            const c = e.target.closest('.sh-chip');
            if (c) { sel[c.getAttribute('data-k')] = c.getAttribute('data-v'); paint(); return; }
            const qb = e.target.closest('[data-q]'); if (qb) { qty += parseInt(qb.getAttribute('data-q'), 10); paint(); return; }
            if (e.target.closest('#shVarAdd')) { close(); setTimeout(() => onPick(Object.assign({}, sel), qty), 240); }
          });
        }
      });
      return s;
    }

    /* ---------- A3. "Kelganda xabar qil" ---------- */
    // Ro'yxat qurilmada saqlanadi va serverga yuboriladi (admin panelda kim so'ragani ko'rinadi).
    async function cardNotify(id) {
      const p = product(id);
      if (isRemote()) { await whenSession(); if (!user()) { toast(tr('need_login_notify')); openLogin(() => cardNotify(id)); return; } }
      const on = toggleNotify(isNaN(Number(id)) ? id : Number(id));
      toast(tr(on ? 'p_notify_on' : 'p_notify_off'));
      afterCartChange(id);
      if (isRemote()) { try { await api('/api/notify', { method: 'POST', body: { product_id: String(id), off: !on } }); const d = ls.get('notified_synced', []).map(String); const k = String(id); const i = d.indexOf(k); if (on && i < 0) d.push(k); if (!on && i >= 0) d.splice(i, 1); ls.set('notified_synced', d); } catch (e) {} }
    }

    /* ---------- A4. Qidiruv ---------- */
    // Hamma sahifada bir xil: SH.searchRank(so'rov, mahsulotlar, bo'limlar)
    //  1) so'rovdagi HAMMA so'z mos kelgan mahsulotlar (masalan "gucci shim" -> Gucci shimlar)
    //  2) bir qismi mos kelganlar (boshqa turdagi shimlar)
    //  3) shu turkum / bo'limdagi qolganlar
    function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/[^a-z0-9а-я'Ѐ-ӿ\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
    const UZ_SUF = ['larning', 'lardan', 'larida', 'larga', 'lari', 'lar', 'ning', 'dagi', 'dan', 'ga', 'ni', 'si', 'im', 'i'];
    const RU_SUF = ['ами', 'ями', 'ого', 'ому', 'ыми', 'ими', 'ах', 'ях', 'ов', 'ев', 'ом', 'ем', 'ой', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ам', 'ям', 'а', 'я', 'ы', 'и', 'у', 'ю', 'е', 'о', 'ь'];
    function stem(w) {
      w = sNorm(w).replace(/'/g, '');
      const cyr = /[а-я]/.test(w);
      const list = cyr ? RU_SUF : UZ_SUF, minLen = cyr ? 3 : 3;
      for (const suf of list) if (w.length - suf.length >= minLen && w.endsWith(suf)) { w = w.slice(0, -suf.length); break; }
      return w;
    }
    function qTokens(q) { return sNorm(q).split(' ').filter(Boolean).map(w => ({ raw: w.replace(/'/g, ''), stem: stem(w) })).filter(t => t.raw.length > 0); }
    function strictLoc(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[lang()] || ''; }
    function textIn(f) { const s = strictLoc(f); return s || loc(f); }   // shu tilda yozilmagan bo'lsa, boshqa tildagisini olamiz
    function fieldWords(text) { return sNorm(text).split(' ').filter(Boolean).map(w => ({ w: w.replace(/'/g, ''), s: stem(w) })); }
    function tokenHits(tok, words) {
      for (const x of words) {
        if (x.w.startsWith(tok.raw) || (tok.stem.length >= 3 && (x.s === tok.stem || x.w.startsWith(tok.stem) || x.s.startsWith(tok.stem)))) return true;
      }
      return false;
    }
    function scoreProduct(toks, p, catName) {
      const fields = [[fieldWords(textIn(p.name)), 4], [fieldWords(p.brand || ''), 4], [fieldWords(textIn(p.subcat)), 3], [fieldWords(catName || ''), 2]];
      let score = 0, hit = 0;
      toks.forEach(t => { let best = 0; fields.forEach(f => { if (tokenHits(t, f[0])) best = Math.max(best, f[1]); }); if (best) { hit++; score += best; } });
      return { score, hit };
    }
    function searchRank(q, prods, cats, limit) {
      const toks = qTokens(q); const catMap = {}; (cats || []).forEach(c => { catMap[c.id] = textIn(c.name); });
      if (!toks.length) return { full: [], part: [], sameSub: [], sameCat: [], all: [] };
      const sc = (prods || []).map(p => Object.assign({ p }, scoreProduct(toks, p, catMap[p.category_id])));
      const byScore = (a, b) => b.score - a.score || (Number(b.p.sold_week) || 0) - (Number(a.p.sold_week) || 0) || String(textIn(a.p.name)).localeCompare(String(textIn(b.p.name)));
      const full = sc.filter(x => x.hit === toks.length).sort(byScore).map(x => x.p);
      const part = sc.filter(x => x.hit > 0 && x.hit < toks.length).sort(byScore).map(x => x.p);
      const got = new Set(full.concat(part)); const lead = full.concat(part);
      const subs = new Set(lead.slice(0, 8).map(p => textIn(p.subcat)).filter(Boolean)), cs = new Set(lead.slice(0, 8).map(p => p.category_id));
      const sameSub = (prods || []).filter(p => !got.has(p) && subs.has(textIn(p.subcat)));
      sameSub.forEach(p => got.add(p));
      const sameCat = (prods || []).filter(p => !got.has(p) && cs.has(p.category_id));
      const all = full.concat(part, sameSub, sameCat);
      return { full, part, sameSub, sameCat, all: limit ? all.slice(0, limit) : all };
    }
    function searchCats(q, cats) {
      const toks = qTokens(q), mc = [], ms = [];
      (cats || []).forEach(c => {
        const cw = fieldWords(textIn(c.name)); if (toks.length && toks.every(t => tokenHits(t, cw))) mc.push(c);
        (c.subcats || []).forEach(s => { const sw = fieldWords(textIn(s.name)); if (toks.length && toks.every(t => tokenHits(t, sw))) ms.push({ c, s }); });
      });
      return { cats: mc, subs: ms };
    }

    /* ---------- A5. Indeks sahifasi: "Chiqish" tugmasi (faqat bosilganda ishlaydi) ---------- */
    // Telefonning "orqaga" tugmasi va Telegramning "orqaga"i ilovani yopmaydi. Yopish faqat shu tugma orqali.
    function addExitButton() {
      const tg = tgApp() || (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined && window.Telegram.WebApp.platform && window.Telegram.WebApp.platform !== 'unknown' ? window.Telegram.WebApp : null);
      const host = document.querySelector('.sticky-header'); if (!tg || !host || document.getElementById('exitBtn')) return;
      const b = document.createElement('button'); b.id = 'exitBtn'; b.type = 'button'; b.className = 'exit-btn';
      b.setAttribute('aria-label', tr('exit_btn'));
      b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>' + esc(tr('exit_btn')) + '</span>';
      b.addEventListener('click', async () => { if (await confirmSheet(tr('exit_ask'), tr('exit_yes'))) { try { tg.close(); } catch (e) {} } });
      host.appendChild(b);
    }

    /* ============================================================================
       SHX-B. XARITADAN MANZIL TANLASH, SHARHLARIM, SOTUVCHI BILAN CHAT YORDAMCHILARI
         B1. Xarita oynasi (Namangan; kutubxonasiz, OpenStreetMap plitkalari)
         B2. Sharhlarni tahrirlash / o'chirish
         B3. Sotuvchi ma'lumotlari va chat (sayt <-> admin; Telegram botga bormaydi)
       ============================================================================ */
    Object.assign(DICT.uz, {
      map_pick: "Xaritadan tanlash", map_title: "Manzilni xaritadan tanlang", map_search_ph: "Manzil yoki joy nomini yozing...", map_addr: "Manzil",
      map_addr_ph: "Ko'cha, uy raqami, mo'ljal", map_ok: "Shu manzilni tanlash", map_me: "Mening joylashuvim", map_loading: "Manzil aniqlanmoqda...",
      map_need_addr: "Manzilni yozing yoki xaritadan tanlang", map_picked: "Xaritada belgilandi", map_fail: "Xarita yuklanmadi. Manzilni qo'lda yozing.",
      map_geo_fail: "Joylashuvni aniqlab bo'lmadi", map_hint: "Xaritani suring: nishon turgan joy manzil bo'ladi",
      my_reviews: "Sharhlarim", my_reviews_empty: "Hali sharh qoldirmagansiz", my_reviews_empty_text: "Yetkazilgan mahsulotlarga sharh yozishingiz mumkin",
      r_edit: "Sharhni tahrirlash", r_save: "Saqlash", r_edited: "tahrirlangan", r_del_ask: "Sharh o'chirilsinmi?", r_deleted: "Sharh o'chirildi", r_saved: "Sharh saqlandi",
      edit: "Tahrirlash", del: "O'chirish",
      seller_title: "Sotuvchiga murojaat", seller_call: "Qo'ng'iroq qilish", seller_write: "Saytda yozish", seller_tg: "Telegramda yozish", seller_ig: "Instagram",
      seller_hours: "Ish vaqti", seller_addr: "Manzil", seller_phone: "Telefon", seller_online: "Hozir onlayn", seller_text: "Savolingiz bormi? Sotuvchiga to'g'ridan-to'g'ri yozing yoki qo'ng'iroq qiling.",
      chat_edited: "tahrirlangan", chat_rec_slide: "← Chapga suring: bekor qilish", chat_rec_cancel: "Qo'yib yuboring: bekor bo'ladi", chat_reply_m: "Javob berish", chat_copy: "Nusxalash", chat_edit: "Tahrirlash", chat_del: "O'chirish", chat_del_ask: "Xabar o'chirilsinmi?", chat_editing: "Tahrirlash", chat_attach: "Rasm yoki video", chat_rec: "Yozilmoqda...", chat_no_mic: "Bu qurilmada ovoz yozib bo'lmaydi", chat_mic_denied: "Mikrofonga ruxsat bering", chat_big: "Fayl juda katta (video 15 MB gacha)", chat_sending: "Yuborilmoqda...", chat_photo: "Rasm", chat_video: "Video", chat_voice: "Ovozli xabar", chat_copied: "Nusxalandi", chat_title: "Sotuvchi bilan chat", chat_ph: "Xabar yozing...", chat_empty: "Savolingizni yozing, sotuvchi javob beradi", chat_send: "Yuborish", chat_reply: "Javob", chat_login: "Yozish uchun avval kiring",
      chat_online: "onlayn", chat_seen: "oxirgi marta {t}", chat_offline: "oflayn", chat_you: "Siz", chat_seller: "Sotuvchi", chat_from_bot: "bot orqali", chat_fail: "Xabar yuborilmadi",
      notify_list: "Kutayotgan mahsulotlarim", notify_list_empty: "Hozircha bo'sh", notify_list_text: "Qolmagan mahsulotda \"Kelganda xabar qilish\" tugmasini bossangiz shu yerda ko'rinadi",
      notify_back: "Qaytdi, mavjud", notify_waiting: "Kutilmoqda", notify_sent: "Xabar yuborildi", today: "Bugun", yesterday: "Kecha"
    });
    Object.assign(DICT.ru, {
      map_pick: "Выбрать на карте", map_title: "Выберите адрес на карте", map_search_ph: "Введите адрес или название места...", map_addr: "Адрес",
      map_addr_ph: "Улица, номер дома, ориентир", map_ok: "Выбрать этот адрес", map_me: "Моё местоположение", map_loading: "Определяем адрес...",
      map_need_addr: "Введите адрес или выберите на карте", map_picked: "Отмечено на карте", map_fail: "Карта не загрузилась. Введите адрес вручную.",
      map_geo_fail: "Не удалось определить местоположение", map_hint: "Двигайте карту: адрес берётся там, где стоит метка",
      my_reviews: "Мои отзывы", my_reviews_empty: "Вы ещё не оставляли отзывов", my_reviews_empty_text: "Вы можете оставить отзыв на доставленные товары",
      r_edit: "Редактировать отзыв", r_save: "Сохранить", r_edited: "изменён", r_del_ask: "Удалить отзыв?", r_deleted: "Отзыв удалён", r_saved: "Отзыв сохранён",
      edit: "Изменить", del: "Удалить",
      seller_title: "Связаться с продавцом", seller_call: "Позвонить", seller_write: "Написать на сайте", seller_tg: "Написать в Telegram", seller_ig: "Instagram",
      seller_hours: "Время работы", seller_addr: "Адрес", seller_phone: "Телефон", seller_online: "Сейчас онлайн", seller_text: "Есть вопрос? Напишите продавцу напрямую или позвоните.",
      chat_edited: "изменено", chat_rec_slide: "← Влево: отмена", chat_rec_cancel: "Отпустите: отмена", chat_reply_m: "Ответить", chat_copy: "Копировать", chat_edit: "Изменить", chat_del: "Удалить", chat_del_ask: "Удалить сообщение?", chat_editing: "Редактирование", chat_attach: "Фото или видео", chat_rec: "Запись...", chat_no_mic: "Запись голоса недоступна на этом устройстве", chat_mic_denied: "Разрешите доступ к микрофону", chat_big: "Файл слишком большой (видео до 15 МБ)", chat_sending: "Отправка...", chat_photo: "Фото", chat_video: "Видео", chat_voice: "Голосовое сообщение", chat_copied: "Скопировано", chat_title: "Чат с продавцом", chat_ph: "Напишите сообщение...", chat_empty: "Напишите свой вопрос, продавец ответит", chat_send: "Отправить", chat_reply: "Ответить", chat_login: "Чтобы написать, сначала войдите",
      chat_online: "онлайн", chat_seen: "был(а) {t}", chat_offline: "не в сети", chat_you: "Вы", chat_seller: "Продавец", chat_from_bot: "через бота", chat_fail: "Сообщение не отправлено",
      notify_list: "Ожидаемые товары", notify_list_empty: "Пока пусто", notify_list_text: "Нажмите «Сообщить о поступлении» у товара, которого нет в наличии, и он появится здесь",
      notify_back: "В наличии", notify_waiting: "Ожидание", notify_sent: "Сообщение отправлено", today: "Сегодня", yesterday: "Вчера"
    });

    /* ---------- B1. Xarita oynasi ---------- */
    // Ishlashi: xarita surilganda o'rtadagi nishon turgan joy manzil bo'ladi (Nominatim orqali nomi aniqlanadi).
    // Qidiruv maydoniga yozilsa takliflar chiqadi, birini bossangiz xarita o'sha joyga o'tadi.
    const MAP_CENTER = { lat: 41.0011, lng: 71.6726 };   // Namangan
    const MAP_PIN = '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" fill="#7c3aed" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="10" r="2.8" fill="#fff"/></svg>';
    const MAP_X = '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    const MAP_SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
    const MAP_LOCATE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/></svg>';
    function mapAddrText(j) {
      const a = (j && j.address) || {};
      const street = [a.road || a.pedestrian || a.footway || a.path || '', a.house_number || ''].filter(Boolean).join(' ');
      const area = a.neighbourhood || a.suburb || a.quarter || a.city_district || '';
      const city = a.city || a.town || a.village || a.county || '';
      const s = [street, area, city].filter(Boolean).join(', ');
      return s || String((j && j.display_name) || '').split(',').slice(0, 3).join(',').trim();
    }
    // init: {address, geo:{lat,lng}}   onDone({address, geo})
    function pickAddress(init, onDone) {
      init = init || {};
      const el = document.createElement('div'); el.className = 'sh-map-wrap';
      el.innerHTML = `<div class="sh-map-top"><button type="button" class="sh-map-x" id="mpX" aria-label="close">${MAP_X}</button>
          <div class="sh-map-search"><input id="mpQ" type="search" autocomplete="off" placeholder="${esc(tr('map_search_ph'))}"><span>${MAP_SEARCH}</span></div></div>
        <div class="sh-map-sug" id="mpSug"></div>
        <div class="sh-map-view" id="mpView"><div class="sh-map-tiles" id="mpTiles"></div><div class="sh-map-pin" id="mpPin">${MAP_PIN}</div>
          <div class="sh-map-ctl"><button type="button" id="mpZi" aria-label="+">+</button><button type="button" id="mpZo" aria-label="-">−</button><button type="button" id="mpMe" aria-label="${esc(tr('map_me'))}">${MAP_LOCATE}</button></div>
          <div class="sh-map-hint" id="mpHint">${esc(tr('map_hint'))}</div></div>
        <div class="sh-map-bottom"><label class="sh-label">${esc(tr('map_addr'))}</label>
          <textarea class="sh-input" id="mpAddr" rows="2" maxlength="160" placeholder="${esc(tr('map_addr_ph'))}"></textarea>
          <div class="sh-err" id="mpErr"></div><button type="button" class="sh-btn" id="mpOk">${esc(tr('map_ok'))}</button></div>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      const close = pushOverlay(el);
      const $ = id => el.querySelector('#' + id);
      const view = $('mpView'), tiles = $('mpTiles'), T = 256;
      let z = init.geo ? 17 : 14, c = init.geo ? { lat: Number(init.geo.lat), lng: Number(init.geo.lng) } : { lat: MAP_CENTER.lat, lng: MAP_CENTER.lng };
      let edited = !!init.address, rid = 0, rtimer = null, failed = 0;
      $('mpAddr').value = init.address || '';
      const toPx = (lat, lng, zz) => { const s = Math.sin(lat * Math.PI / 180), n = T * Math.pow(2, zz); return { x: (lng + 180) / 360 * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n }; };
      const fromPx = (x, y, zz) => { const n = T * Math.pow(2, zz), k = Math.PI - 2 * Math.PI * y / n; return { lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(k) - Math.exp(-k))), lng: x / n * 360 - 180 }; };
      const imgs = new Map();
      function render() {
        const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
        const p = toPx(c.lat, c.lng, z), x0 = p.x - w / 2, y0 = p.y - h / 2, n = Math.pow(2, z), want = new Set();
        for (let tx = Math.floor(x0 / T); tx <= Math.floor((x0 + w) / T); tx++) for (let ty = Math.floor(y0 / T); ty <= Math.floor((y0 + h) / T); ty++) {
          if (ty < 0 || ty >= n) continue;
          const wx = ((tx % n) + n) % n, key = z + '/' + wx + '/' + ty + '/' + tx; want.add(key);
          let im = imgs.get(key);
          if (!im) {
            im = new Image(); im.draggable = false; im.alt = ''; im.className = 'sh-map-tile';
            im.onerror = () => { failed++; if (failed === 6) { const hnt = $('mpHint'); if (hnt) hnt.textContent = tr('map_fail'); } };
            im.src = 'https://tile.openstreetmap.org/' + z + '/' + wx + '/' + ty + '.png'; tiles.appendChild(im); imgs.set(key, im);
          }
          im.style.transform = 'translate(' + Math.round(tx * T - x0) + 'px,' + Math.round(ty * T - y0) + 'px)';
        }
        imgs.forEach((im, k) => { if (!want.has(k)) { im.remove(); imgs.delete(k); } });
      }
      async function reverse() {
        const my = ++rid; $('mpAddr').placeholder = tr('map_loading');
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=' + lang() + '&lat=' + c.lat + '&lon=' + c.lng);
          const j = await r.json(); if (my !== rid || edited) return;
          const t = mapAddrText(j); if (t) $('mpAddr').value = t.slice(0, 160);
        } catch (e) {} finally { $('mpAddr').placeholder = tr('map_addr_ph'); }
      }
      function moved(userMoved) { render(); if (userMoved) edited = false; clearTimeout(rtimer); rtimer = setTimeout(reverse, 650); }
      function setZoom(nz) { nz = Math.max(10, Math.min(19, nz)); if (nz === z) return; z = nz; moved(false); }
      // surish va ikki barmoq bilan kattalashtirish
      const ptrs = new Map(); let lastDist = 0, dragMoved = false;
      view.addEventListener('pointerdown', e => { if (e.target.closest('.sh-map-ctl')) return; try { view.setPointerCapture(e.pointerId); } catch (x) {} ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = false; if (ptrs.size === 2) { const a = [...ptrs.values()]; lastDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); } });
      view.addEventListener('pointermove', e => {
        const q = ptrs.get(e.pointerId); if (!q) return;
        if (ptrs.size === 1) {
          const dx = e.clientX - q.x, dy = e.clientY - q.y; q.x = e.clientX; q.y = e.clientY; if (!dx && !dy) return; dragMoved = true;
          const p = toPx(c.lat, c.lng, z); c = fromPx(p.x - dx, p.y - dy, z); moved(true);
        } else if (ptrs.size === 2) {
          q.x = e.clientX; q.y = e.clientY; const a = [...ptrs.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
          if (lastDist && d / lastDist > 1.45) { lastDist = d; setZoom(z + 1); edited = false; } else if (lastDist && d / lastDist < 0.69) { lastDist = d; setZoom(z - 1); edited = false; }
        }
      });
      const up = e => { ptrs.delete(e.pointerId); lastDist = 0; };
      view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
      view.addEventListener('dblclick', e => { if (!e.target.closest('.sh-map-ctl')) setZoom(z + 1); });
      view.addEventListener('wheel', e => { e.preventDefault(); setZoom(z + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
      $('mpZi').addEventListener('click', () => setZoom(z + 1)); $('mpZo').addEventListener('click', () => setZoom(z - 1));
      $('mpMe').addEventListener('click', async () => {
        if (!(await confirmSheet(tr('map_geo_ask'), tr('c_yes'), ''))) return;
        const ok = (lat, lng) => { c = { lat: lat, lng: lng }; z = 17; moved(true); };
        const bad = () => toast(tr('map_geo_denied'));
        const browser = () => {
          if (!navigator.geolocation) return bad();
          navigator.geolocation.getCurrentPosition(pos => ok(pos.coords.latitude, pos.coords.longitude),
            () => navigator.geolocation.getCurrentPosition(pos => ok(pos.coords.latitude, pos.coords.longitude), bad, { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }),
            { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 });
        };
        const tg = tgApp(), LM = tg && tg.LocationManager;
        if (LM && (!tg.isVersionAtLeast || tg.isVersionAtLeast('8.0'))) {
          const get = () => { try { LM.getLocation(d => { if (d && d.latitude != null) ok(d.latitude, d.longitude); else { try { if (LM.isLocationAvailable && !LM.isAccessGranted) { toast(tr('map_geo_denied')); LM.openSettings(); } else browser(); } catch (x) { browser(); } } }); } catch (x) { browser(); } };
          try { if (LM.isInited) get(); else LM.init(get); } catch (x) { browser(); }
        } else browser();
      });

      $('mpAddr').addEventListener('input', () => { edited = true; $('mpErr').textContent = ''; });
      // qidiruv
      let qtimer = null, qid = 0; const sug = $('mpSug');
      async function search(q) {
        const my = ++qid;
        try {
          const qq = /namangan|наманган/i.test(q) ? q : q + ', Namangan';
          const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=uz&addressdetails=1&viewbox=71.50,41.10,71.85,40.90&accept-language=' + lang() + '&q=' + encodeURIComponent(qq));
          const arr = await r.json(); if (my !== qid) return;
          sug.innerHTML = (arr || []).map((x, i) => `<button type="button" class="sh-map-s" data-i="${i}"><b>${esc(String(x.display_name).split(',')[0])}</b><span>${esc(String(x.display_name).split(',').slice(1, 4).join(',').trim())}</span></button>`).join('');
          sug.classList.toggle('show', !!(arr && arr.length)); sug._arr = arr || [];
        } catch (e) { sug.classList.remove('show'); }
      }
      $('mpQ').addEventListener('input', e => { clearTimeout(qtimer); const q = e.target.value.trim(); if (q.length < 3) { sug.classList.remove('show'); return; } qtimer = setTimeout(() => search(q), 450); });
      sug.addEventListener('click', e => {
        const b = e.target.closest('.sh-map-s'); if (!b) return; const x = sug._arr[parseInt(b.getAttribute('data-i'), 10)]; if (!x) return;
        c = { lat: parseFloat(x.lat), lng: parseFloat(x.lon) }; z = 17; sug.classList.remove('show'); $('mpQ').blur();
        const t = mapAddrText(x) || String(x.display_name).split(',').slice(0, 3).join(',').trim(); $('mpAddr').value = t.slice(0, 160); edited = true; render();
      });
      $('mpX').addEventListener('click', close);
      $('mpOk').addEventListener('click', () => {
        const a = $('mpAddr').value.trim(); if (!a) { $('mpErr').textContent = tr('map_need_addr'); return; }
        const out = { address: a, geo: { lat: Math.round(c.lat * 1e6) / 1e6, lng: Math.round(c.lng * 1e6) / 1e6 } };
        close(); setTimeout(() => { if (onDone) onDone(out); }, 240);
      });
      setTimeout(() => { render(); if (!init.address) reverse(); }, 60);
      window.addEventListener('resize', render);
      return { close };
    }

    /* ---------- B2. Sharhlarim ---------- */
    async function myReviews() {
      if (isRemote()) { await whenSession(); return await api('/api/my-reviews'); }
      return ls.get('local_reviews', []).slice().reverse();
    }
    async function editReview(d) {
      if (isRemote()) return await api('/api/reviews/edit', { method: 'POST', body: d });
      const all = ls.get('local_reviews', []), r = all.find(x => String(x.id) === String(d.id)); if (!r) throw new Error('404');
      r.rating = d.rating; r.text = d.text; r.anon = !!d.anonymous; r.name = d.anonymous ? null : ((user() || {}).name || null); r.photos = d.photos || []; r.edited = new Date().toISOString().slice(0, 10);
      ls.set('local_reviews', all); return r;
    }
    async function deleteReview(id) {
      if (isRemote()) return await api('/api/reviews/delete', { method: 'POST', body: { id: id } });
      ls.set('local_reviews', ls.get('local_reviews', []).filter(x => String(x.id) !== String(id))); return { ok: true };
    }
    // Sharhni tahrirlash oynasi (yangi sharh oynasi bilan bir xil ko'rinadi)
    function editReviewSheet(r, onDone) { return openReviewSheet({ id: r.order_id }, { product_id: r.product_id, name: (product(r.product_id) || {}).name || '', image: productImage(product(r.product_id) || {}, r.color) }, onDone, r); }

    /* ---------- B3. Sotuvchi ma'lumotlari va chat ---------- */
    function shopInfo() { return (db && db.settings) || {}; }
    function telHref(p) { return 'tel:' + String(p || '').replace(/[^\d+]/g, ''); }
    function tgHref(u) { u = String(u || '').trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, ''); return u ? 'https://t.me/' + u : ''; }
    function igHref(u) { u = String(u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; return 'https://instagram.com/' + u.replace(/^@/, ''); }
    // Chat API: sayt <-> admin (Telegram botga yuborilmaydi)
    const chatApi = {
      list: () => api('/api/chat'),
      status: () => api('/api/chat/status'),
      send: (text, replyTo, media) => api('/api/chat/send', { method: 'POST', body: { text: text || '', reply_to: replyTo || undefined, media: media || undefined } }),
      edit: (id, text) => api('/api/chat/edit', { method: 'POST', body: { id: id, text: text } }),
      abs: u => /^https?:/i.test(u || '') ? u : API + u,
      del: id => api('/api/chat/delete', { method: 'POST', body: { id: id } }),
      upload: async (blob, mime) => {
        const a = getAuth(); const res = await fetch(API + '/api/chat/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + ((a && a.token) || ''), 'X-Mime': mime, 'Content-Type': mime }, body: blob });
        let d = null; try { d = await res.json(); } catch (e) {}
        if (!res.ok) { const er = new Error((d && (d.detail || d.error)) || ('HTTP ' + res.status)); er.status = res.status; throw er; } return d;
      }
    };
    function fmtClock(ts) { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    function fmtAgo(ts) {
      if (!ts) return '';
      const d = new Date(ts), now = new Date(), t = fmtClock(ts), same = d.toDateString() === now.toDateString();
      const y = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
      return same ? t : (y ? tr('yesterday') + ' ' + t : d.getDate() + ' ' + (MONTHS[lang()] || MONTHS.uz)[d.getMonth()].slice(0, 3).toLowerCase() + ' ' + t);
    }


    const PUB = {
      API_BASE, DB_URL, API, boot, isRemote, server: () => server, whenReady, whenSession, tgApp, ls, lang, theme, applyTheme, setTheme, setLang, tr, applyI18n, loc, esc, fmtDate,
      loadDB, setDB, db: () => db, product, shopName, num, money, vkey, totalStock, stockFor, colorOf, defaultColor, defaultSize, productImage,
      getCart, saveCart, cartFind, cartSet, getFavs, toggleFav, isFav, getNotified, toggleNotify, updateBadges,
      allReviews, reviewsFor, ratingOf, starsHtml, reviewHtml, bindReviewPhotos, STAR_PATH,
      sheet, confirmSheet, lightbox, toast, closeTop, goBack, onBack, defaultBack, updateNavInset, init,
      user, canOrder, getAuth, logout, openLogin, hasPendingEmail, updateName, listOrders, placeOrder, localMarkDelivered, isReviewed, openReviewSheet, showPhone, cleanPhone, fmtPhoneInput, fullPhone
    };
    Object.assign(PUB, { addExitButton, cardButton, cardAdd, cardQty, cardNotify, needsChoice, axesOf, isGenericP, selKeyOf, stockForSel, allSels, firstSel, lineSel, lineKey, cartFindSel, cartSetSel, selImage, selLabel, openVariantSheet, searchRank, searchCats, qTokens, sNorm, strictLoc, textIn
, pickAddress, myReviews, editReview, deleteReview, editReviewSheet, shopInfo, telHref, tgHref, igHref, chatApi, fmtClock, fmtAgo, api, MONTHS });
    return PUB;
  })();


/* ==================== 4. SAHIFALAR: har birining o'z kodi ==================== */
const PAGES = {};

/* ##########################################################################
   SAHIFA: BOSH SAHIFA (index.html)   ->   <html data-page="index">
   ########################################################################## */
PAGES.index = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                search_placeholder: "Mahsulotlar va turkumlar izlash...",
                history_title: "Oxirgi qidiruvlar",
                clear_history: "Tozalash",
                no_results: "Hech narsa topilmadi...",
                search_all_label: "bo'yicha barcha natijalarni ko'rish",
                search_type: "Qidirish",
                product_type: "Mahsulot",
                category_type: "Bo'lim",
                subcat_type: "Turkum",
                cart_btn: "Savatga",
                notify_btn: "Kelganda xabar qilish",
                choose_btn: "Tanlash",
                notify_active: "✓ Xabar beriladi",
                out_of_stock: "Qolmadi",
                recent_title: "Siz ko'rgansiz",
                weekly_sale_title: "Hafta aksiyalari",
                all_btn: "Barchasi >",
                cat_all: "Barchasi",
                see_all: "Barchasini ko'rish",
                last_item: "Oxirgisi",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                search_placeholder: "Поиск товаров и категорий...",
                history_title: "История поиска",
                clear_history: "Очистить",
                no_results: "Ничего не найдено...",
                search_all_label: "посмотреть все результаты для",
                search_type: "Поиск",
                product_type: "Товар",
                category_type: "Раздел",
                subcat_type: "Категория",
                cart_btn: "В корзину",
                notify_btn: "Сообщить о поступлении",
                choose_btn: "Выбрать",
                notify_active: "✓ Сообщим",
                out_of_stock: "Нет в наличии",
                recent_title: "Вы смотрели",
                weekly_sale_title: "Скидки недели",
                all_btn: "Все >",
                cat_all: "Все",
                see_all: "Смотреть все",
                last_item: "Последний",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let dbData = { categories: [], products: [], banners: [], stories: [], home_sections: [] };

        /* ---------- Kiyim: variant, qoldiq va reyting yordamchilari ---------- */

        /* ==================== YORDAMCHILAR: ombor qoldig'i, rang/o'lcham tanlash kerakmi, reyting ==================== */
        function stockOf(p) { return SH.totalStock(p); }
        function needsChoice(p) { return SH.needsChoice(p); }
        function defColor(p) { return p.colors && p.colors.length ? (p.colors[0].id || null) : null; }
        let _rvSrc = null, _rvN = -1, _rvMap = {};
        function ratingOf(p) {
            let loc = []; try { loc = JSON.parse(localStorage.getItem('local_reviews')) || []; } catch (e) {}
            const src = (typeof dbData !== 'undefined' && dbData.reviews) || [];
            if (_rvSrc !== src || _rvN !== loc.length) {
                _rvSrc = src; _rvN = loc.length; _rvMap = {};
                src.concat(loc).forEach(r => { const a = _rvMap[r.product_id] || (_rvMap[r.product_id] = { s: 0, n: 0 }); a.s += Number(r.rating) || 0; a.n++; });
            }
            const a = _rvMap[p.id];
            if (a && a.n) return { avg: (a.s / a.n).toFixed(1), count: a.n };
            if (p.rating && p.comments) return { avg: Number(p.rating).toFixed(1), count: p.comments };
            return { avg: '–', count: 0 };
        }

        /* ==================== SAQLANGAN MA'LUMOT: saralanganlar, savat, 'kelganda xabar qil' (telefon xotirasida) ==================== */
        let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
        let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
        let notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        let viewedStories = JSON.parse(localStorage.getItem('viewed_stories')) || [];

        /* ==================== KATEGORIYALAR ==================== */
        let activeCatId = 'all';
        let activeSub = null;

        // Olov ikonkasi (barcha joyda bir xil)

        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        const FIRE_ICON = `
            <svg viewBox="0 0 512 512">
                <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/>
                <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/>
            </svg>`;

        const DOWN_ARROW = `<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;
        function discountLabel(d) {
            const m = String(d || '').match(/\d+(?:[.,]\d+)?/);
            return m ? m[0] + '%' : '';
        }

        // Qidiruv matnini onclick ichida xavfsiz ishlatish uchun
        function escAttr(s) {
            return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        }

        window.addEventListener('DOMContentLoaded', () => {
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                tg.expand();
                if (tg.BackButton) { tg.BackButton.onClick(handleTgBack); tg.BackButton.show(); }
                try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
            }
            try { SH.addExitButton(); } catch (e) {}
            init();
        });

        window.history.pushState({ page: 'home' }, '', window.location.href);

        // Boshqa sahifadan orqaga qaytganda holatni yangilash
        window.addEventListener('pageshow', (e) => {
            if (!e.persisted) return;     // sahifa xotiradan qaytdi: joyi (scroll) o'zgarishsiz qoladi
            favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
            const tgb = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton;
            if (tgb) tgb.show();
            refreshTimeSensitive(false);
            const seen = new Set();
            document.querySelectorAll('.product-card[data-pid]').forEach(card => {
                const raw = card.dataset.pid;
                const pid = isNaN(Number(raw)) ? raw : Number(raw);
                const heart = card.querySelector('.heart-icon-sm');
                if (heart) heart.classList.toggle('liked', favs.includes(pid));
                if (!seen.has(pid)) { seen.add(pid); updateCardInfoOnly(pid); }
            });
            renderRecentProducts();
            updateBadges();
        });
        window.addEventListener('popstate', () => {
            if (window.__shOverlayPop && Date.now() - window.__shOverlayPop < 600) { window.__shOverlayPop = 0; return; }
            handleTgBack();
            history.pushState(null, '', window.location.href);
        });


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];

            let siteTheme = localStorage.getItem('site_theme') || 'light';
            if (siteTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            return typeof field === 'object' ? (field[currentLang] || field['uz'] || Object.values(field)[0]) : field;
        }

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}

            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };

            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        function setDB(d) {
            SH.setDB(d);
            dbData = Object.assign({ categories: [], products: [], banners: [], stories: [], home_sections: [] }, d || {});
        }

        /* ---------- Vaqt bo'yicha faol / tugagan elementlar (storis, banner) ---------- */

        /* ==================== VAQT BO'YICHA FILTR va kunlik aralashtirish ==================== */
        function parseTime(v) {
            if (v === null || v === undefined || v === '') return null;
            if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
            const n = Date.parse(String(v).trim().replace(' ', 'T'));
            return isNaN(n) ? null : n;
        }
        function isTimeActive(it) {
            const now = Date.now();
            const start = parseTime(it.start_at || it.start_time || it.start_date);
            let end = parseTime(it.expires_at || it.expire_at || it.end_at || it.end_time || it.end_date || it.timer_end);
            const created = parseTime(it.created_at || it.created);
            const hours = parseFloat(it.duration_hours || it.hours);
            if (end === null && created !== null && !isNaN(hours)) end = created + hours * 3600000;
            if (start !== null && now < start) return false;
            if (end !== null && now > end) return false;
            return true;
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function activeStories() { return (dbData.stories || []).filter(isTimeActive); }

        /* ==================== BANNER (bosh sahifadagi aylanuvchi rasmlar) ==================== */
        function activeBanners() { return (dbData.banners || []).filter(b => b && b.img && isTimeActive(b)); }

        /* ---------- Kunlik 50 ta mahsulot (har kuni almashadi, har kirganda emas) ---------- */

        /* ==================== VAQT BO'YICHA FILTR va kunlik aralashtirish ==================== */
        const DAILY_COUNT = 50;
        function dailySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
        function mulberry32(a) {
            return function () {
                a |= 0; a = a + 0x6D2B79F5 | 0;
                let t = Math.imul(a ^ a >>> 15, 1 | a);
                t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
        }
        function dailyShuffle(list) {
            const arr = [...list].sort((a, b) => (a.id > b.id) - (a.id < b.id));
            const rnd = mulberry32(dailySeed());
            for (let k = 0; k < 6; k++) rnd();
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(rnd() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        /* ---------- Bo'sh qolgan bo'limlar yig'ishtiriladi, qaytsa joyi ochiladi ---------- */
        let uiSig = {};
        function refreshTimeSensitive(force) {
            const sSig = activeStories().map(x => x.id).join(',');
            const bSig = activeBanners().map(x => x.img).join('|');
            const wSig = weeklyActive() ? '1' : '0';
            if (force || sSig !== uiSig.s) { uiSig.s = sSig; renderStories(); }
            if (force || bSig !== uiSig.b) { uiSig.b = bSig; renderBanners(); }
            if (force || wSig !== uiSig.w) {
                const changed = uiSig.w !== undefined && uiSig.w !== wSig;
                uiSig.w = wSig;
                renderWeeklySales();
                if (changed) { renderMainContent(); renderRecentProducts(); }
            }
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function renderAll() {
            applyThemeAndTranslations();
            uiSig = {};
            refreshTimeSensitive(true);
            renderCategoriesTrack();
            renderMainContent();
            renderRecentProducts();
            updateBadges();
        }

        async function init() {
            applyThemeAndTranslations();
            try {
                setDB(await loadDB(fresh => { setDB(fresh); renderAll(); }));
            } catch (e) { console.error(e); }
            renderAll();
            restoreIndexState();
            setInterval(() => refreshTimeSensitive(false), 20000);
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderStories() {
            const c = document.getElementById('storiesContainer');
            const list = activeStories();
            if (list.length === 0) { c.innerHTML = ''; c.style.display = 'none'; return; }
            c.style.display = '';

            c.innerHTML = list.map((s, index) => {
                let isViewed = viewedStories.includes(s.id);
                let ringClass = isViewed ? 'viewed' : 'unseen';

                return `
                    <div class="story-item" onclick="openStoryModal(${s.id})">
                        <div class="story-ring ${ringClass}" id="story-ring-${s.id}">
                            ${s.type === 'video' ? `<video class="story-video" src="${s.media}#t=0.1" ${s.poster ? `poster="${s.poster}"` : ''} muted playsinline preload="metadata"></video>` : `<img class="story-img" src="${s.media}" decoding="async">`}
                        </div>
                        <span class="story-title">${getLocalized(s.title)}</span>
                    </div>
                `;
            }).join('');
        }

        let modalStories = [];
        let currentStoryIdx = 0;
        let storyTimer = null;
        let storyStartedAt = 0;
        let storyRemaining = 0;
        let storyPausedPct = 0;
        let storyPaused = false;
        let storyTogglePaused = false;
        let storySoundOn = false;
        const STORY_TIME = 5000;
        const TEMP_STORY_ID = 99999;

        const ICON_SOUND_ON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
        const ICON_SOUND_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';

        function getStoryVideo() { return document.querySelector('#modalMediaContainer video'); }

        function markStoryViewed(id) {
            if (id === TEMP_STORY_ID || viewedStories.includes(id)) return;
            viewedStories.push(id);
            localStorage.setItem('viewed_stories', JSON.stringify(viewedStories));
            const ringEl = document.getElementById(`story-ring-${id}`);
            if (ringEl) ringEl.className = 'story-ring viewed';
        }

        function openStoryModal(id, list) {
            modalStories = list || activeStories();
            const foundIdx = modalStories.findIndex(s => s.id === id);
            currentStoryIdx = foundIdx !== -1 ? foundIdx : 0;

            document.getElementById('storyModal').style.display = 'flex';
            syncTgBack();
            initModalProgress();
            playModalStory(currentStoryIdx);
        }

        function closeStoryModal() {
            clearTimeout(storyTimer);
            storyPaused = false;
            storyTogglePaused = false;
            const v = getStoryVideo();
            if (v) v.pause();
            document.getElementById('modalMediaContainer').innerHTML = '';
            document.getElementById('modalPauseIcon').style.display = 'none';
            document.getElementById('modalSeekInfo').style.display = 'none';
            document.getElementById('storyModal').style.display = 'none';
            syncTgBack();
        }

        function initModalProgress() {
            const container = document.getElementById('modalProgressBars');
            container.innerHTML = modalStories.map((_, i) => `
                <div style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                    <div id="mprog-${i}" style="width: 0%; height: 100%; background: #fff;"></div>
                </div>
            `).join('');
        }

        // Taymer va progress chiziqni ishga tushirish (fromPct - qaysi foizdan davom etishi)
        function runStoryTimer(ms, fromPct) {
            clearTimeout(storyTimer);
            storyRemaining = ms;
            storyStartedAt = Date.now();
            const fill = document.getElementById(`mprog-${currentStoryIdx}`);
            if (fill) {
                fill.style.transition = 'none';
                fill.style.width = (fromPct || 0) + '%';
                void fill.offsetWidth;
                fill.style.transition = `width ${ms}ms linear`;
                fill.style.width = '100%';
            }
            storyTimer = setTimeout(() => playModalStory(currentStoryIdx + 1), ms);
        }

        function pauseStory() {
            if (storyPaused) return;
            storyPaused = true;
            clearTimeout(storyTimer);
            const fill = document.getElementById(`mprog-${currentStoryIdx}`);
            if (fill && fill.parentElement) {
                const total = fill.parentElement.getBoundingClientRect().width || 1;
                storyPausedPct = Math.min(100, (fill.getBoundingClientRect().width / total) * 100);
                fill.style.transition = 'none';
                fill.style.width = storyPausedPct + '%';
            }
            storyRemaining = Math.max(50, storyRemaining - (Date.now() - storyStartedAt));
            const v = getStoryVideo();
            if (v) v.pause();
        }

        function resumeStory() {
            if (!storyPaused) return;
            storyPaused = false;
            const v = getStoryVideo();
            if (v) v.play().catch(() => {});
            runStoryTimer(storyRemaining, storyPausedPct);
        }

        function toggleStoryPause() {
            const icon = document.getElementById('modalPauseIcon');
            if (storyTogglePaused) {
                storyTogglePaused = false;
                icon.style.display = 'none';
                resumeStory();
            } else {
                storyTogglePaused = true;
                icon.style.display = 'flex';
                pauseStory();
            }
        }

        function updateSoundBtn(v) {
            const btn = document.getElementById('modalSoundBtn');
            if (!btn) return;
            if (!v) { btn.style.display = 'none'; return; }
            const noAudio = (v.audioTracks && v.audioTracks.length === 0) || v.mozHasAudio === false;
            btn.style.display = noAudio ? 'none' : 'flex';
            btn.innerHTML = storySoundOn && !v.muted ? ICON_SOUND_ON : ICON_SOUND_OFF;
        }

        function toggleStorySound(e) {
            if (e) e.stopPropagation();
            const v = getStoryVideo();
            if (!v) return;
            storySoundOn = !storySoundOn;
            v.muted = !storySoundOn;
            if (storySoundOn && !storyPaused) {
                v.play().catch(() => { v.muted = true; storySoundOn = false; updateSoundBtn(v); });
            }
            updateSoundBtn(v);
        }

        function playModalStory(index) {
            if (index < 0) index = 0;
            if (index >= modalStories.length) { closeStoryModal(); return; }
            currentStoryIdx = index;
            const story = modalStories[currentStoryIdx];
            markStoryViewed(story.id);

            storyPaused = false;
            storyTogglePaused = false;
            document.getElementById('modalPauseIcon').style.display = 'none';

            for (let i = 0; i < modalStories.length; i++) {
                const fill = document.getElementById(`mprog-${i}`);
                if (fill) {
                    fill.style.transition = 'none';
                    fill.style.width = i < currentStoryIdx ? '100%' : '0%';
                }
            }

            const mediaContainer = document.getElementById('modalMediaContainer');
            mediaContainer.innerHTML = '';
            if (story.type === 'video') {
                const v = document.createElement('video');
                v.src = story.media;
                v.playsInline = true;
                v.setAttribute('playsinline', '');
                v.muted = !storySoundOn;
                v.autoplay = true;
                v.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                v.addEventListener('loadedmetadata', () => {
                    updateSoundBtn(v);
                    if (!storyPaused && isFinite(v.duration) && v.duration > 0) {
                        runStoryTimer(Math.min(v.duration * 1000, 60000), 0);
                    }
                });
                mediaContainer.appendChild(v);
                updateSoundBtn(v);
                const pr = v.play();
                if (pr && pr.catch) pr.catch(() => {
                    v.muted = true;
                    storySoundOn = false;
                    updateSoundBtn(v);
                    v.play().catch(() => {});
                });
            } else {
                mediaContainer.innerHTML = `<img src="${story.media}" style="width:100%; height:100%; object-fit:cover; pointer-events:none;">`;
                updateSoundBtn(null);
            }

            const footer = document.getElementById('modalStoryFooter');
            if (story.product_id) {
                const prod = dbData.products.find(p => String(p.id) === String(story.product_id));
                if (prod) {
                    document.getElementById('modalPrevImg').src = prod.images && prod.images[0] ? prod.images[0] : '';
                    document.getElementById('modalPrevTitle').textContent = getLocalized(prod.name);
                    document.getElementById('modalPrevPrice').textContent = isWeeklySaleExpired() ? (prod.oldPrice || prod.price) : prod.price;
                    document.getElementById('modalBtnText').textContent = currentLang === 'ru' ? 'Перейти к товару' : "Mahsulotga o'tish";
                    document.getElementById('modalProductCard').onclick = () => {
                        window.location.href = `product.html?id=${prod.id}`;
                    };
                    footer.style.display = 'block';
                } else {
                    footer.style.display = 'none';
                }
            } else {
                footer.style.display = 'none';
            }

            runStoryTimer(STORY_TIME, 0);
        }

        /* ---------- Storis: bosib turish = pauza (qo'yib yuborguncha), bosib turib surish = videoni oldinga/orqaga o'tkazish,
                      tez surish = keyingi/oldingi storis, bosish = o'tish/pauza ---------- */
        (function setupStoryGestures() {
            const modal = document.getElementById('storyModal');
            const chip = document.getElementById('modalSeekInfo');
            const HOLD_MS = 200;
            let ptr = null;

            function fmt(sec) {
                sec = Math.max(0, Math.floor(sec));
                return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
            }

            // Barmoq siljigan masofaga qarab videoning shu joyiga o'tadi (o'ngga = oldinga, chapga = orqaga)
            function scrubTo(p, clientX) {
                const v = getStoryVideo();
                if (!v || !isFinite(v.duration) || v.duration <= 0) return;
                const dur = v.duration;
                const span = Math.min(dur, 40);                       // butun ekran eni = 40 soniyagacha
                const t = Math.max(0, Math.min(dur - 0.05, p.startTime + ((clientX - p.x) / window.innerWidth) * span));
                try { if (v.fastSeek) v.fastSeek(t); else v.currentTime = t; } catch (_) {}
                const pct = (t / dur) * 100;
                const fill = document.getElementById(`mprog-${currentStoryIdx}`);
                if (fill) { fill.style.transition = 'none'; fill.style.width = pct + '%'; }
                storyPausedPct = pct;
                storyRemaining = Math.max(50, (dur - t) * 1000);
                chip.textContent = fmt(t) + ' / ' + fmt(dur);
                chip.style.display = 'block';
            }

            modal.addEventListener('contextmenu', (e) => e.preventDefault());

            modal.addEventListener('pointerdown', (e) => {
                if (e.target.closest('button') || e.target.closest('#modalProductCard')) { ptr = null; return; }
                if (ptr) return;
                ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, held: false, scrubbing: false, startTime: 0, timer: null };
                try { modal.setPointerCapture(e.pointerId); } catch (_) {}
                ptr.timer = setTimeout(() => {
                    if (ptr && !ptr.scrubbing) { ptr.held = true; pauseStory(); }
                }, HOLD_MS);
            });

            modal.addEventListener('pointermove', (e) => {
                if (!ptr || e.pointerId !== ptr.id) return;
                const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
                if (!ptr.held) {
                    // pauza boshlanmasdan katta siljish = tez surish (storis almashtirish)
                    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) clearTimeout(ptr.timer);
                    return;
                }
                if (!ptr.scrubbing) {
                    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
                    const v = getStoryVideo();
                    if (!v) return;                                   // rasmda faqat pauza
                    ptr.scrubbing = true;
                    ptr.startTime = v.currentTime || 0;
                    ptr.x = e.clientX;                                // sakrashsiz boshlash
                }
                scrubTo(ptr, e.clientX);
            });

            function finish(e, cancelled) {
                if (!ptr || e.pointerId !== ptr.id) return;
                clearTimeout(ptr.timer);
                const p = ptr;
                ptr = null;
                chip.style.display = 'none';
                try { modal.releasePointerCapture(p.id); } catch (_) {}

                if (p.held) {                                         // qo'yib yuborildi: shu joydan davom etadi
                    if (!storyTogglePaused) resumeStory();
                    return;
                }
                if (cancelled) return;

                const dx = e.clientX - p.x;
                const dy = e.clientY - p.y;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                    // chapga surish = keyingi, o'ngga surish = oldingi
                    playModalStory(dx < 0 ? currentStoryIdx + 1 : currentStoryIdx - 1);
                    return;
                }
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;

                const w = window.innerWidth;
                if (e.clientX < w * 0.3) playModalStory(currentStoryIdx - 1);
                else if (e.clientX > w * 0.7) playModalStory(currentStoryIdx + 1);
                else toggleStoryPause();
            }

            modal.addEventListener('pointerup', (e) => finish(e, false));
            modal.addEventListener('pointercancel', (e) => finish(e, true));
        })();

        // Mahsulot ustiga bosilsa to'g'ridan-to'g'ri o'zining sahifasiga o'tadi (storis faqat storis qatoridan ochiladi)

        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function goToProduct(id) {
            const prod = dbData.products.find(p => p.id === id);
            if (!prod) return;

            let recent = JSON.parse(localStorage.getItem('recent_products')) || [];
            recent = recent.filter(i => i !== id);
            recent.unshift(id);
            if (recent.length > 6) recent = recent.slice(0, 6);
            localStorage.setItem('recent_products', JSON.stringify(recent));

            saveIndexState();
            window.location.href = `product.html?id=${encodeURIComponent(id)}`;
        }

        /* ---------- Bannerlar ---------- */

        /* ==================== BANNER (bosh sahifadagi aylanuvchi rasmlar) ==================== */
        const bannerState = { list: [], index: 1, timer: null, ready: false, dragged: false };

        function bannerUpdate(animate = true) {
            const track = document.getElementById('bannerTrack');
            const dots = document.getElementById('bannerDots').children;
            const slideEl = track.querySelector('.banner-slide');
            if (!slideEl) return;
            const slideWidth = slideEl.offsetWidth + 10;
            track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
            track.style.transform = `translateX(-${bannerState.index * slideWidth}px)`;

            const n = bannerState.list.length;
            const realIndex = n > 1 ? (bannerState.index - 1 + n) % n : 0;
            for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === realIndex);
        }

        function bannerStartAuto() {
            clearInterval(bannerState.timer);
            if (bannerState.list.length < 2) return;
            bannerState.timer = setInterval(() => { bannerState.index++; bannerUpdate(true); }, 5000);
        }

        function renderBanners() {
            const track = document.getElementById('bannerTrack');
            const dotsContainer = document.getElementById('bannerDots');
            const container = document.getElementById('bannerContainer');
            const banners = activeBanners();
            clearInterval(bannerState.timer);
            bannerState.list = banners;

            // Banner yo'q yoki vaqti tugagan: joyi bo'sh qolmaydi, pastdagilar yuqoriga suriladi
            if (banners.length === 0) {
                track.innerHTML = ''; dotsContainer.innerHTML = '';
                container.style.display = 'none'; dotsContainer.style.display = 'none';
                return;
            }
            container.style.display = ''; dotsContainer.style.display = '';

            const multi = banners.length > 1;
            const realIdx = multi ? [banners.length - 1, ...banners.map((_, i) => i), 0] : [0];
            const slidesData = realIdx.map(i => banners[i]);
            bannerState.index = multi ? 1 : 0;

            dotsContainer.innerHTML = multi ? banners.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}"></div>`).join('') : '';
            track.innerHTML = slidesData.map((b, i) => `<div class="banner-slide" data-i="${realIdx[i]}"><img src="${(SH.lang() === 'ru' && b.img_ru) ? b.img_ru : b.img}" alt="" decoding="async" draggable="false"></div>`).join('');

            bannerUpdate(false);
            bannerStartAuto();

            if (bannerState.ready) return;
            bannerState.ready = true;

            track.addEventListener('transitionend', () => {
                const total = bannerState.list.length + 2;
                if (bannerState.list.length < 2) return;
                if (bannerState.index >= total - 1) { bannerState.index = 1; bannerUpdate(false); }
                else if (bannerState.index <= 0) { bannerState.index = total - 2; bannerUpdate(false); }
            });

            let startX = 0, down = false;
            container.addEventListener('pointerdown', (e) => {
                startX = e.clientX; down = true; bannerState.dragged = false;
                clearInterval(bannerState.timer);
            });
            container.addEventListener('pointerup', (e) => {
                if (!down) return;
                down = false;
                const diff = e.clientX - startX;
                if (Math.abs(diff) > 10) bannerState.dragged = true;      // surish bosish hisoblanmaydi
                if (bannerState.list.length > 1 && Math.abs(diff) > 40) {
                    if (diff > 0) bannerState.index--; else bannerState.index++;
                    bannerUpdate(true);
                }
                bannerStartAuto();
            });
            container.addEventListener('pointercancel', () => { down = false; bannerStartAuto(); });
            container.addEventListener('click', (e) => {
                if (bannerState.dragged) { bannerState.dragged = false; return; }
                const slide = e.target.closest('.banner-slide');
                if (!slide) return;
                handleBannerClick(bannerState.list[Number(slide.dataset.i)]);
            });
            window.addEventListener('resize', () => bannerUpdate(false));
        }

        // Banner turlari: mahsulot (product_id) yoki kategoriya / sub-kategoriya (category_id, subcat)
        function handleBannerClick(b) {
            if (!b) return;
            const subRef = b.subcat !== undefined ? b.subcat : (b.subcategory !== undefined ? b.subcategory : (b.sub_id !== undefined ? b.sub_id : null));
            let type = b.type || b.link_type || '';
            if (!type) {
                if (b.product_id !== undefined && b.product_id !== null && b.product_id !== '') type = 'product';
                else if (subRef !== null || (b.category_id !== undefined && b.category_id !== null)) type = 'category';
            }
            if (type === 'product') {
                if (b.product_id !== undefined && b.product_id !== null) goToProduct(b.product_id);
            } else if (type === 'category' || type === 'subcategory') {
                openCategoryFromBanner(b.category_id, subRef);
            }
        }

        function subMatches(sub, ref) {
            if (ref === null || ref === undefined) return false;
            if (sub.id !== undefined && String(sub.id) === String(ref)) return true;
            const names = typeof sub.name === 'object' && sub.name ? Object.values(sub.name) : [sub.name];
            return names.some(n => String(n || '').toLowerCase() === String(ref).toLowerCase());
        }

        // Banner kategoriyani reklama qilsa: categories.html da shu kategoriya (id bo'yicha) ochiladi.
        // Sub-kategoriya ko'rsatilgan bo'lsa: products.html da shu sub-kategoriya mahsulotlari.
        function openCategoryFromBanner(catId, subRef) {
            const cats = dbData.categories || [];
            let cat = (catId !== undefined && catId !== null) ? cats.find(c => String(c.id) === String(catId)) : null;
            let sub = null;
            if (subRef !== null && subRef !== undefined) {
                const pool = cat ? [cat] : cats;
                for (const c of pool) {
                    const f = (c.subcats || []).find(s => subMatches(s, subRef));
                    if (f) { cat = c; sub = f; break; }
                }
            }
            if (!cat) return;
            saveIndexState();
            if (sub) {
                window.location.href = `products.html?cat_id=${encodeURIComponent(cat.id)}&sub=${encodeURIComponent(getLocalized(sub.name))}`;
            } else {
                localStorage.setItem('active_cat_id', cat.id);
                window.location.href = `categories.html?cat_id=${encodeURIComponent(cat.id)}`;
            }
        }


        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function isWeeklySaleExpired() {
            let section = (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
            if (!section || !section.timer_end) return false;
            return new Date().getTime() > new Date(section.timer_end).getTime();
        }

        function weeklyActive() {
            const section = (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
            if (!section || isWeeklySaleExpired()) return false;
            return (section.product_ids || []).some(id => (dbData.products || []).some(p => p.id === id));
        }

        function renderWeeklySales() {
            const container = document.getElementById('weeklySaleContainer');
            let section = (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
            // O'chirilgan yoki vaqti tugagan bo'lsa: bo'lim butunlay olib tashlanadi, pastdagilar yuqoriga suriladi
            if (!section || !weeklyActive()) { clearInterval(weeklyTimerInterval); container.innerHTML = ''; return; }
            let promoProds = dbData.products.filter(p => section.product_ids.includes(p.id)).slice(0, 10);

            container.innerHTML = `
                <div class="weekly-sale-box">
                    <div class="weekly-header">
                        <div class="weekly-title-row">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span class="weekly-title">${getLocalized(section.title)}</span>
                        </div>
                        <a href="sales.html" class="weekly-all-btn">${t.all_btn}</a>
                    </div>
                    <div class="weekly-track-wrapper" id="weeklyTrackWrapper">
                        <div class="weekly-track">
                            ${promoProds.map(p => createProductCardHTML(p, true)).join('')}
                            <a href="sales.html" class="weekly-more-card">
                                <div class="weekly-more-circle"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                                <span class="weekly-more-text">${t.see_all}</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;

            if (section.timer_end) {
                startWeeklyCountdown(section.timer_end);
            }
            promoProds.forEach(p => updateCardInfoOnly(p.id));
            setupSliderStart('#weeklyTrackWrapper');
            setupDragScroll('weeklyTrackWrapper');
        }

        function setupDragScroll(id) {
            const slider = document.getElementById(id);
            if (!slider) return;
            let isDown = false;
            let startX, scrollLeft;

            slider.addEventListener('pointerdown', (e) => {
                if (e.pointerType !== 'mouse') return;
                isDown = true;
                startX = e.clientX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener('pointerleave', () => { isDown = false; });
            slider.addEventListener('pointerup', () => { isDown = false; });
            slider.addEventListener('pointermove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.clientX - slider.offsetLeft;
                const walk = (x - startX) * 1.5;
                slider.scrollLeft = scrollLeft - walk;
            });
        }

        let weeklyTimerInterval = null;
        function startWeeklyCountdown(endTimeStr) {
            function updateTimer() {
                let now = new Date().getTime();
                let endTime = new Date(endTimeStr).getTime();
                let distance = endTime - now;

                const timerEls = document.querySelectorAll('.card-timer-val');
                if (timerEls.length === 0) return;

                if (distance < 0) {
                    clearInterval(weeklyTimerInterval);
                    refreshTimeSensitive(false);      // bo'lim yig'ishtiriladi, narxlar asl holatga qaytadi
                    return;
                }

                let hours = Math.floor(distance / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                let timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                timerEls.forEach(el => el.textContent = timeStr);
            }
            clearInterval(weeklyTimerInterval);
            updateTimer();
            weeklyTimerInterval = setInterval(updateTimer, 1000);
        }


        /* ==================== KATEGORIYALAR ==================== */
        function renderCategoriesTrack() {
            const track = document.getElementById('categoriesTrack');
            let sortedCats = [...(dbData.categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

            track.innerHTML = `
                <div class="cat-text-pill ${activeCatId === 'all' ? 'active' : ''}" onclick="selectCategory('all')">${t.cat_all}</div>
                ${sortedCats.map(cat => `
                    <div class="cat-text-pill ${activeCatId === cat.id ? 'active' : ''}" onclick="selectCategory(${cat.id})">${getLocalized(cat.name)}</div>
                `).join('')}
            `;
            renderSubcategories();
        }

        function selectCategory(id) {
            activeCatId = id;
            activeSub = null;
            renderCategoriesTrack();
            renderMainContent();
        }

        function renderSubcategories() {
            const area = document.getElementById('subcatsRowContainer');
            if (activeCatId === 'all') { area.innerHTML = ''; return; }
            let cat = dbData.categories.find(c => c.id === activeCatId);
            if (!cat || !cat.subcats) { area.innerHTML = ''; return; }
            area.innerHTML = `
                <div class="subcats-row">
                    ${cat.subcats.map(sub => `
                        <div class="subcat-item" onclick="filterBySub('${escAttr(getLocalized(sub.name))}')">
                            <div class="subcat-circle"><img src="${sub.img}"></div>
                            <span class="subcat-name">${getLocalized(sub.name)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function filterBySub(subName) {
            activeSub = subName;
            renderMainContent();
        }

        // "Barchasi": har kuni almashadigan 50 ta aralash mahsulot. Kategoriya tanlansa: shu kategoriyaning hammasi (aralash tartibda)
        function renderMainContent() {
            let prods = [...dbData.products];
            if (activeCatId !== 'all') prods = prods.filter(p => p.category_id === activeCatId);
            if (activeSub) prods = prods.filter(p => getLocalized(p.subcat).toLowerCase() === activeSub.toLowerCase());
            prods = dailyShuffle(prods);
            if (activeCatId === 'all' && !activeSub) prods = prods.slice(0, DAILY_COUNT);
            renderProductsGrid(prods);
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function createProductCardHTML(p, isWeekly = false) {
            const isLiked = favs.includes(p.id) ? 'liked' : '';
            let pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];
            if (isWeekly) pImages = [pImages[0]]; // haftalik aksiya bo'limida faqat bitta rasm

            let loopImages = [];
            if (pImages.length > 1) {
                if (pImages.length === 2) {
                    loopImages = [pImages[1], pImages[0], pImages[1], pImages[0]];
                } else {
                    loopImages = [pImages[pImages.length - 1], ...pImages, pImages[0]];
                }
            } else {
                loopImages = pImages;
            }

            const prodName = getLocalized(p.name);
            let section = (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
            let isWeeklyItem = section && section.product_ids.includes(p.id);
            let expired = isWeeklySaleExpired();

            let ribbonBadge = (isWeeklyItem && !expired) ? `<div class="badge-action-ribbon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6" fill="#7a4cf5" stroke="none"/></svg>${currentLang === 'ru' ? 'АКЦИЯ' : 'AKSIYA'}</div>` : '';

            let badgesHtml = '';
            let timerHtml = (isWeeklyItem && !expired) ? `
                <div class="card-timer-badge">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.5"></circle><line x1="12" y1="14" x2="12" y2="10.5"></line><line x1="9.5" y1="2.5" x2="14.5" y2="2.5"></line><line x1="12" y1="2.5" x2="12" y2="6.5"></line></svg>
                    <span class="card-timer-val">00:00:00</span>
                </div>
            ` : '';

            let originalHtml = p.badgeType === 'original' ? `
                <div class="badge-original-sm">
                    <svg viewBox="0 0 24 24"><path fill="#007a28" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"></path><path fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-4.8"></path></svg>
                    <span>ORIGINAL</span>
                </div>
            ` : '';

            if (timerHtml || originalHtml) {
                badgesHtml = `<div class="card-image-badges">${timerHtml}${originalHtml}</div>`;
            }

            let dotsHtml = pImages.length > 1 ? `
                <div class="card-dots">
                    ${pImages.map((_, idx) => `<div class="card-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>
            ` : '';

            const imgAttrs = isWeekly ? 'decoding="async" draggable="false"' : 'loading="lazy" decoding="async" draggable="false"';

            return `
                <div class="product-card ${isWeekly ? 'weekly-card-item' : ''}" data-pid="${p.id}">
                    <div class="img-wrap">
                        ${ribbonBadge}
                        <button class="heart-icon-sm ${isLiked}" onclick="toggleHeart(event, ${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="product-img-box" onclick="goToProduct(${p.id})">
                            <div class="card-slider-container" data-original-length="${pImages.length}" onscroll="handleCardInfiniteScroll(event, ${pImages.length})">
                                ${loopImages.map(imgUrl => `<div class="card-slide"><img src="${imgUrl}" alt="${prodName}" ${imgAttrs}></div>`).join('')}
                            </div>
                            ${badgesHtml}
                        </div>
                    </div>
                    ${dotsHtml}
                    <div class="product-info" data-pid="${p.id}"></div>
                </div>
            `;
        }

        // Slayderlarni 2-slaydga (haqiqiy 1-rasm) o'rnatish: o'qish va yozish alohida (bitta layout)
        function setupSliderStart(scopeSelector) {
            requestAnimationFrame(() => {
                const sliders = [...document.querySelectorAll(`${scopeSelector} .card-slider-container`)].filter(c => c.children.length > 1);
                const widths = sliders.map(c => c.clientWidth);
                sliders.forEach(c => { c.style.scrollBehavior = 'auto'; });
                sliders.forEach((c, i) => { c.scrollLeft = widths[i]; });
                sliders.forEach(c => { c.style.scrollBehavior = 'smooth'; });
            });
        }

        function renderProductsGrid(list) {
            const grid = document.getElementById('productsGrid');
            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${t.no_results}</div>`;
                return;
            }

            grid.innerHTML = list.map(p => createProductCardHTML(p, false)).join('');
            list.forEach(p => updateCardInfoOnly(p.id));
            setupSliderStart('#productsGrid');
        }

        function updateCardInfoOnly(id) {
            const infoContainers = document.querySelectorAll(`.product-info[data-pid="${id}"]`);
            if (infoContainers.length === 0) return;
            const p = dbData.products.find(item => item.id === id);
            if (!p) return;

            const defaultSize = p.sizes ? p.sizes[0] : null;
            const cartItem = cart.find(item => item.id === p.id && item.selectedSize === defaultSize);
            const prodName = getLocalized(p.name);
            let stock = stockOf(p);
            let isOut = stock <= 0;
            let isLast = stock === 1;
            let isNotified = notifiedList.includes(p.id);

            let section = (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
            let isWeeklyItem = section && section.product_ids.includes(p.id);
            let expired = isWeeklySaleExpired();

            let displayPrice = p.price;
            let displayOldPrice = p.oldPrice;
            let displayDiscount = p.discount;

            if (isWeeklyItem && expired) {
                displayPrice = p.oldPrice || p.price;
                displayOldPrice = '';
                displayDiscount = '';
            }

            let cleanPrice = displayPrice ? displayPrice.replace(/\s*so['‘]m/gi, '').trim() : '';
            let cleanOldPrice = displayOldPrice ? displayOldPrice.replace(/\s*so['‘]m/gi, '').trim() : '';

            let priceHtml = isOut ? `<span class="main-price out-of-stock">${t.out_of_stock}</span>` : `
                <span class="main-price">${cleanPrice}</span>
                ${(isWeeklyItem && !expired && discountLabel(displayDiscount)) ? `<span class="discount-tag">${DOWN_ARROW}${discountLabel(displayDiscount)}</span>` : ''}
            `;

            let btnHtml = SH.cardButton(p);


            const lastBadgeHtml = (isLast && !isOut) ? `
                <div class="last-item-badge">
                    ${FIRE_ICON}
                    <span>${t.last_item}</span>
                </div>
            ` : '';

            infoContainers.forEach(infoContainer => {
                infoContainer.innerHTML = `
                    <div class="product-info-top">
                        <div class="price-row" onclick="goToProduct(${p.id})">${priceHtml}</div>
                        ${(!isOut && cleanOldPrice) ? `<div class="old-prices" onclick="goToProduct(${p.id})"><span class="price-old">${cleanOldPrice}</span></div>` : ''}
                        <div class="product-title" onclick="goToProduct(${p.id})">${prodName}</div>
                        <div class="product-rating">
                            <div class="rating-left" onclick="goToProduct(${p.id})">
                                <div class="rating-box"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span class="rating-num">${ratingOf(p).avg}</span></div>
                                <div class="comment-box"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="comments-num">${ratingOf(p).count}</span></div>
                            </div>
                            ${lastBadgeHtml}
                        </div>
                    </div>
                    <div class="card-action-container">${btnHtml}</div>
                `;
            });
        }

        window.handleCardInfiniteScroll = handleCardInfiniteScroll;
        function handleCardInfiniteScroll(e, originalLen) {
            if (originalLen <= 1) return;
            const container = e.target;
            const slideWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const maxScroll = slideWidth * (container.children.length - 1);

            if (scrollLeft >= maxScroll - 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth;
                container.style.scrollBehavior = 'smooth';
            } else if (scrollLeft <= 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth * originalLen;
                container.style.scrollBehavior = 'smooth';
            }

            let activeIndex = Math.round(container.scrollLeft / slideWidth) - 1;
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= originalLen) activeIndex = originalLen - 1;

            const cardBox = container.closest('.product-card');
            if (cardBox) {
                const dotsBox = cardBox.querySelector('.card-dots');
                if (dotsBox) {
                    const dots = dotsBox.children;
                    for (let i = 0; i < dots.length; i++) {
                        dots[i].classList.toggle('active', i === activeIndex);
                    }
                }
            }
        }

        function toggleHeart(e, id) {
            e.stopPropagation();
            if (favs.includes(id)) favs = favs.filter(i => i !== id);
            else favs.push(id);
            localStorage.setItem('fav_products', JSON.stringify(favs));
            e.currentTarget.classList.toggle('liked', favs.includes(id));
            updateBadges();
        }

        function addSimilarToCart(id) { SH.cardAdd(id); }

        function changeSimilarQty(id, delta) { SH.cardQty(id, delta); }

        function toggleNotify(id) { SH.cardNotify(id); }

        function updateCardActionUI(id) { updateCardInfoOnly(id); }

        function renderRecentProducts() {
            let recentIds = JSON.parse(localStorage.getItem('recent_products')) || [];
            if (recentIds.length === 0) return;
            document.getElementById('recentTitle').style.display = 'block';
            let recentList = dbData.products.filter(p => recentIds.includes(p.id));
            const grid = document.getElementById('recentProductsGrid');

            grid.innerHTML = recentList.map(p => createProductCardHTML(p, false)).join('');
            recentList.forEach(p => updateCardInfoOnly(p.id));
            setupSliderStart('#recentProductsGrid');
        }

        function updateBadges() {
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');
            let validFavs = favs.filter(id => dbData.products.some(p => p.id === id));
            if (validFavs.length > 0) { favBadge.textContent = validFavs.length; favBadge.classList.add('show'); }
            else { favBadge.classList.remove('show'); }

            let totalCart = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCart > 0) { cartBadge.textContent = totalCart; cartBadge.classList.add('show'); }
            else { cartBadge.classList.remove('show'); }
        }

        /* ================= QIDIRUV: index, products va categories sahifalarida bir xil ================= */

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        let searchActive = false;
        let searchBackdropTimer = null;
        let kbBaseH = 0;
        let kbShown = false;

        // Faqat sahifaning joriy tilidagi matn bo'yicha qidiriladi (ruscha sahifa = ruscha, o'zbekcha = o'zbekcha)
        function sTxt(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[currentLang] || ''; }
        function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/\s+/g, ' ').trim(); }
        function sMatch(text, q) { const tx = sNorm(text); if (!tx || !q) return false; return q.split(' ').every(w => tx.includes(w)); }
        function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function tt(key, fallback) { return (t && t[key]) || fallback; }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function getSearchHistory() { try { return JSON.parse(localStorage.getItem(window.shKey())) || []; } catch (e) { return []; } }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function saveSearchQuery(q) {
            if (!q) return;
            let history = getSearchHistory();
            history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
            history.unshift(q);
            if (history.length > 5) history = history.slice(0, 5);
            localStorage.setItem(window.shKey(), JSON.stringify(history));
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function removeHistoryItem(i) { const h = getSearchHistory(); h.splice(i, 1); localStorage.setItem(window.shKey(), JSON.stringify(h)); renderHistory(); }
        function clearAllHistory() { localStorage.removeItem(window.shKey()); closeSearchDropdown(); }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function currentVH() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
        function markSearchOpen() {
            clearTimeout(searchBackdropTimer);
            if (!searchActive) { kbBaseH = currentVH(); kbShown = false; }
            searchActive = true;
            const b = document.getElementById('searchBackdrop');
            if (b) b.classList.add('show');
        }
        function closeSearchDropdown() {
            searchActive = false;
            const dd = document.getElementById('searchDropdown');
            if (dd) dd.classList.remove('show');
            const inp = document.getElementById('searchInput');
            if (inp) inp.blur();                                   // klaviatura yopiladi
            clearTimeout(searchBackdropTimer);
            // fon biroz kechikib yopiladi, shunda bosish ostidagi kartaga o'tib ketmaydi
            searchBackdropTimer = setTimeout(() => {
                if (!searchActive) { const b = document.getElementById('searchBackdrop'); if (b) b.classList.remove('show'); }
            }, 300);
        }
        function closeSearchIfOpen() {
            const dd = document.getElementById('searchDropdown');
            if (searchActive || (dd && dd.classList.contains('show'))) { closeSearchDropdown(); return true; }
            return false;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderHistory() {
            const dd = document.getElementById('searchDropdown');
            const history = getSearchHistory();
            if (history.length === 0) { dd.classList.remove('show'); dd.innerHTML = ''; return; }
            let html = `<div class="search-header-row"><span>${tt('history_title', 'Oxirgi qidiruvlar')}</span><button class="clear-history-btn" data-act="clear">${tt('clear_history', 'Tozalash')}</button></div>`;
            history.forEach((item, i) => {
                html += `<div class="search-suggestion-item" data-act="hist" data-q="${escHtml(item)}"><div class="history-item-left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${escHtml(item)}</span></div><button class="remove-history-item" data-act="del" data-idx="${i}">&times;</button></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function renderSearchDropdown() {
            const dd = document.getElementById('searchDropdown');
            const raw = document.getElementById('searchInput').value.trim();
            if (!raw) { renderHistory(); return; }
            const src = getSearchSource();
            const sc = SH.searchCats(raw, src.cats);
            const rk = SH.searchRank(raw, src.prods, src.cats);
            const mp = rk.full.concat(rk.part);
            if (!sc.cats.length && !sc.subs.length && !mp.length) {
                dd.innerHTML = `<div class="search-suggestion-item" style="color: var(--muted); justify-content: center;">${tt('no_results', 'Hech narsa topilmadi...')}</div>`;
                dd.classList.add('show');
                return;
            }
            let html = `<div class="search-suggestion-item" data-act="all" data-q="${escHtml(raw)}"><span>"${escHtml(raw)}" ${tt('search_all_label', "bo'yicha barcha natijalarni ko'rish")}</span><span class="suggestion-type">${tt('search_type', 'Qidirish')}</span></div>`;
            sc.cats.slice(0, 3).forEach(c => {
                html += `<div class="search-suggestion-item" data-act="cat" data-cat="${escHtml(c.id)}"><span>${escHtml(SH.textIn(c.name))}</span><span class="suggestion-type">${tt('category_type', "Bo'lim")}</span></div>`;
            });
            sc.subs.slice(0, 4).forEach(x => {
                html += `<div class="search-suggestion-item" data-act="sub" data-cat="${escHtml(x.c.id)}" data-sub="${escHtml(SH.textIn(x.s.name))}"><span>${escHtml(SH.textIn(x.s.name))} <small style="color:var(--muted)">(${escHtml(SH.textIn(x.c.name))})</small></span><span class="suggestion-type">${tt('subcat_type', 'Turkum')}</span></div>`;
            });
            // Mahsulot taklifi bosilsa mahsulotga emas, shu so'z bo'yicha NATIJALAR RO'YXATIGA o'tadi
            mp.slice(0, 6).forEach(p => {
                const nm = SH.textIn(p.name);
                html += `<div class="search-suggestion-item" data-act="prod" data-id="${escHtml(p.id)}" data-q="${escHtml(nm)}"><div class="history-item-left"><span>${escHtml(nm)}</span></div><span class="suggestion-type">${tt('product_type', 'Mahsulot')}</span></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }

        function goSearch(q) {
            if (!q) return;
            saveSearchQuery(q);
            closeSearchDropdown();
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
        function pickCategory(id) {
            if (typeof onCategoryPicked === 'function') { onCategoryPicked(id); return; }
            localStorage.setItem('active_cat_id', id);
            window.location.href = `categories.html?cat_id=${encodeURIComponent(id)}`;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function showSearchHistory() { markSearchOpen(); renderSearchDropdown(); }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function handleLiveSearch() { markSearchOpen(); renderSearchDropdown(); }
        function handleSearch(e) { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) goSearch(q); } }

        document.getElementById('searchDropdown').addEventListener('click', (e) => {
            const el = e.target.closest('[data-act]');
            if (!el) return;
            e.stopPropagation();
            const d = el.dataset;
            if (d.act === 'all' || d.act === 'hist') goSearch(d.q);
            else if (d.act === 'cat') { closeSearchDropdown(); pickCategory(d.cat); }
            else if (d.act === 'sub') { window.location.href = `products.html?cat_id=${encodeURIComponent(d.cat)}&sub=${encodeURIComponent(d.sub)}`; }
            else if (d.act === 'prod') { goSearch(d.q); }
            else if (d.act === 'del') removeHistoryItem(parseInt(d.idx));
            else if (d.act === 'clear') clearAllHistory();
        });

        // Klaviatura yopilsa (orqaga surish), qidiruv ham yopiladi
        function onViewportResize() {
            if (!searchActive) return;
            const h = currentVH();
            if (h < kbBaseH - 100) kbShown = true;
            else if (kbShown && h >= kbBaseH - 60) closeSearchDropdown();
        }
        window.addEventListener('resize', onViewportResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportResize);
        window.addEventListener('DOMContentLoaded', () => {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) tg.onEvent('viewportChanged', onViewportResize);
        });

        function isInsideSearch(target) {
            return !!(target && target.closest && (target.closest('#searchBoxContainer') || target.closest('.search-box-wrapper') || target.closest('#searchDropdown')));
        }
        // Ekranga sal tegilsa yoki surilsa, qidiruv va klaviatura yopiladi
        ['touchstart', 'touchmove', 'wheel'].forEach(evName => {
            document.addEventListener(evName, (e) => {
                if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
            }, { passive: true });
        });
        document.addEventListener('click', (e) => {
            if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
        });

        function getSearchSource() { return { cats: dbData.categories || [], prods: dbData.products || [] }; }

        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */

        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }
        window.addEventListener('DOMContentLoaded', () => {
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
        });

        /* ---------- Telegram "orqaga": bosh sahifada ham ilova yopilmaydi ---------- */
        function getTg() { return window.Telegram && window.Telegram.WebApp; }
        function syncTgBack() { const tg = getTg(); if (tg && tg.BackButton) tg.BackButton.show(); }
        function handleTgBack() {
            const modal = document.getElementById('storyModal');
            if (modal && modal.style.display === 'flex') { closeStoryModal(); return; }
            if (closeSearchIfOpen()) return;
            if (activeCatId !== 'all' || activeSub) { selectCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
            if (window.scrollY > 5) window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        /* ---------- Kirgan joyga qaytish: scroll, kategoriya va sub-kategoriya saqlanadi ---------- */
        const NAV_KEY = 'index_state_v1';
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        function saveIndexState() {
            try { sessionStorage.setItem(NAV_KEY, JSON.stringify({ y: window.scrollY, cat: activeCatId, sub: activeSub })); } catch (e) {}
        }
        let scrollSaveTimer = null;
        window.addEventListener('scroll', () => { clearTimeout(scrollSaveTimer); scrollSaveTimer = setTimeout(saveIndexState, 150); }, { passive: true });
        window.addEventListener('pagehide', saveIndexState);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveIndexState(); });
        function restoreIndexState() {
            let nav = null;
            try { nav = performance.getEntriesByType('navigation')[0]; } catch (e) {}
            if (!nav || nav.type !== 'back_forward') return;
            let st = null;
            try { st = JSON.parse(sessionStorage.getItem(NAV_KEY)); } catch (e) {}
            if (!st) return;
            if (st.cat !== 'all' || st.sub) {
                activeCatId = st.cat;
                activeSub = st.sub || null;
                renderCategoriesTrack();
                renderMainContent();
            }
            requestAnimationFrame(() => window.scrollTo(0, st.y || 0));
        }
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        window.__shSync = function () { try { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); } catch (e) {} };
        Object.assign(window, { stockOf, needsChoice, defColor, ratingOf, discountLabel, escAttr, applyThemeAndTranslations, getLocalized, loadDB, setDB, parseTime, isTimeActive, activeStories, activeBanners, dailySeed, mulberry32, dailyShuffle, refreshTimeSensitive, renderAll, init, renderStories, getStoryVideo, markStoryViewed, openStoryModal, closeStoryModal, initModalProgress, runStoryTimer, pauseStory, resumeStory, toggleStoryPause, updateSoundBtn, toggleStorySound, playModalStory, goToProduct, bannerUpdate, bannerStartAuto, renderBanners, handleBannerClick, subMatches, openCategoryFromBanner, isWeeklySaleExpired, weeklyActive, renderWeeklySales, setupDragScroll, startWeeklyCountdown, renderCategoriesTrack, selectCategory, renderSubcategories, filterBySub, renderMainContent, createProductCardHTML, setupSliderStart, renderProductsGrid, updateCardInfoOnly, handleCardInfiniteScroll, toggleHeart, addSimilarToCart, changeSimilarQty, toggleNotify, updateCardActionUI, renderRecentProducts, updateBadges, sTxt, sNorm, sMatch, escHtml, tt, getSearchHistory, saveSearchQuery, removeHistoryItem, clearAllHistory, currentVH, markSearchOpen, closeSearchDropdown, closeSearchIfOpen, renderHistory, renderSearchDropdown, goSearch, pickCategory, showSearchHistory, handleLiveSearch, handleSearch, onViewportResize, isInsideSearch, getSearchSource, updateNavInset, getTg, syncTgBack, handleTgBack, saveIndexState, restoreIndexState });
};

/* ##########################################################################
   SAHIFA: MAHSULOTLAR RO'YXATI (products.html)   ->   <html data-page="products">
   ########################################################################## */
PAGES.products = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                products_title: "Mahsulotlar",
                search_placeholder: "Mahsulotlar va turkumlar izlash...",
                cart_btn: "Savatga",
                notify_btn: "Kelganda xabar qilish",
                choose_btn: "Tanlash",
                notify_active: "✓ Xabar beriladi",
                last_item: "Oxirgisi",
                out_of_stock: "Qolmadi",
                history_title: "Oxirgi qidiruvlar",
                clear_history: "Tozalash",
                no_results: "Hech narsa topilmadi...",
                search_all_label: "bo'yicha barcha natijalarni ko'rish",
                search_type: "Qidirish",
                product_type: "Mahsulot",
                category_type: "Bo'lim",
                subcat_type: "Turkum",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                products_title: "Товары",
                search_placeholder: "Поиск товаров и категорий...",
                cart_btn: "В корзину",
                notify_btn: "Сообщить о поступлении",
                choose_btn: "Выбрать",
                notify_active: "✓ Сообщим",
                last_item: "Последний",
                out_of_stock: "Нет в наличии",
                history_title: "История поиска",
                clear_history: "Очистить",
                no_results: "Ничего не найдено...",
                search_all_label: "посмотреть все результаты для",
                search_type: "Поиск",
                product_type: "Товар",
                category_type: "Раздел",
                subcat_type: "Категория",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        const categoryNames = {
            1: { uz: "Ayollar kiyimlari", ru: "Женская одежда" },
            2: { uz: "Erkaklar kiyimlari", ru: "Мужская одежда" },
            3: { uz: "Oyoq kiyimlar", ru: "Обувь" },
            4: { uz: "Aksessuarlar", ru: "Аксессуары" },
            5: { uz: "Uy buyumlari", ru: "Товары для дома" }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let allProducts = [];


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];

            let siteTheme = localStorage.getItem('site_theme') || 'light';
            if (siteTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || field['uz'] || Object.values(field)[0] || '';
            }
            return field;
        }

        function getStrictLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || '';
            }
            return '';
        }

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}

            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };

            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        let dbData = { products: [], home_sections: [] };

        /* ---------- Kiyim: variant, qoldiq va reyting yordamchilari ---------- */

        /* ==================== YORDAMCHILAR: ombor qoldig'i, rang/o'lcham tanlash kerakmi, reyting ==================== */
        function stockOf(p) { return SH.totalStock(p); }
        function needsChoice(p) { return SH.needsChoice(p); }
        function defColor(p) { return p.colors && p.colors.length ? (p.colors[0].id || null) : null; }
        let _rvSrc = null, _rvN = -1, _rvMap = {};
        function ratingOf(p) {
            let loc = []; try { loc = JSON.parse(localStorage.getItem('local_reviews')) || []; } catch (e) {}
            const src = (typeof dbData !== 'undefined' && dbData.reviews) || [];
            if (_rvSrc !== src || _rvN !== loc.length) {
                _rvSrc = src; _rvN = loc.length; _rvMap = {};
                src.concat(loc).forEach(r => { const a = _rvMap[r.product_id] || (_rvMap[r.product_id] = { s: 0, n: 0 }); a.s += Number(r.rating) || 0; a.n++; });
            }
            const a = _rvMap[p.id];
            if (a && a.n) return { avg: (a.s / a.n).toFixed(1), count: a.n };
            if (p.rating && p.comments) return { avg: Number(p.rating).toFixed(1), count: p.comments };
            return { avg: '–', count: 0 };
        }

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function setDB(d) {
            SH.setDB(d);
            dbData = Object.assign({ products: [], home_sections: [] }, d || {});
            allProducts = dbData.products || [];
            if (dbData.settings && dbData.settings.theme && !localStorage.getItem('site_theme')) {
                localStorage.setItem('site_theme', dbData.settings.theme);
            }
        }

        async function fetchAppDataAndInit() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            applyThemeAndTranslations();


            try {
                setDB(await loadDB(fresh => { setDB(fresh); initPage(); }));
            } catch (err) {
                try {
                    const res = await fetch(SH.API + '/api/products');
                    if (res.ok) setDB(await res.json());
                } catch (e) { console.error("Mahsulotlarni yuklab bo'lmadi:", e); }
            }
            initPage();
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        const SCROLL_KEY = 'products_scroll:' + location.search;
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        const urlParams = new URLSearchParams(window.location.search);

        /* ==================== KATEGORIYALAR ==================== */
        const catId = urlParams.get('cat_id') || '';
        const subName = urlParams.get('sub') || '';

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        const searchQueryParam = urlParams.get('q') || '';


        /* ==================== SAQLANGAN MA'LUMOT: saralanganlar, savat, 'kelganda xabar qil' (telefon xotirasida) ==================== */
        let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
        let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
        let notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
        let currentProductsList = [];


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function initPage() {
            applyThemeAndTranslations();
            if (!allProducts || allProducts.length === 0) {
                renderProducts([]);
                return;
            }

            const searchInput = document.getElementById('searchInput');
            const pageTitleEl = document.getElementById('pageTitle');

            if (searchQueryParam) {
                if (document.activeElement !== searchInput) searchInput.value = searchQueryParam;
                pageTitleEl.textContent = `${t.products_title}: "${searchQueryParam}"`;

                const cats_ = dbData.categories || [];
                const rk = SH.searchRank(searchQueryParam, allProducts, cats_);
                const cs = SH.searchCats(searchQueryParam, cats_);
                let list = rk.full.slice();
                // bo'lim yoki turkum nomi yozilgan bo'lsa (masalan "Ayollar", "Shimlar"), o'sha mahsulotlar ham shu yerda
                const catIds = new Set(cs.cats.map(c => c.id));
                const subNames = new Set(cs.subs.map(x => SH.textIn(x.s.name)));
                const byCat = allProducts.filter(p => !list.includes(p) && (catIds.has(p.category_id) || subNames.has(SH.textIn(p.subcat))));
                list = list.concat(byCat);
                rk.part.concat(rk.sameSub, rk.sameCat).forEach(p => { if (!list.includes(p)) list.push(p); });
                if (list.length < 8) {   // natija juda kam: tavsiyalar bilan to'ldiramiz
                    const rest = allProducts.filter(p => !list.includes(p)).sort(() => Math.random() - 0.5);
                    list = list.concat(rest.slice(0, 20 - list.length));
                }
                currentProductsList = list.slice(0, 80);
            } else {
                if (document.activeElement !== searchInput) searchInput.value = '';
                if (subName) {
                    let decodedSub = decodeURIComponent(subName).trim();
                    let foundProduct = allProducts.find(p => {
                        let subUz = (p.subcat && p.subcat.uz) ? p.subcat.uz.trim().toLowerCase() : '';
                        let subRu = (p.subcat && p.subcat.ru) ? p.subcat.ru.trim().toLowerCase() : '';
                        return subUz === decodedSub.toLowerCase() || subRu === decodedSub.toLowerCase();
                    });

                    if (foundProduct && foundProduct.subcat) {
                        pageTitleEl.textContent = getLocalized(foundProduct.subcat);
                    } else {
                        pageTitleEl.textContent = decodedSub;
                    }

                    currentProductsList = allProducts.filter(p => {
                        let subText = getStrictLocalized(p.subcat).trim().toLowerCase();
                        return subText === decodedSub.toLowerCase();
                    });
                } else if (catId) {
                    if (categoryNames[catId]) {
                        pageTitleEl.textContent = categoryNames[catId][currentLang] || categoryNames[catId]['uz'];
                    } else {
                        pageTitleEl.textContent = t.products_title;
                    }
                    currentProductsList = allProducts.filter(p => String(p.category_id) === String(catId));
                } else {
                    pageTitleEl.textContent = t.products_title;
                    currentProductsList = allProducts;
                }
            }

            renderProducts(currentProductsList);
            updateBadges();

            let navType = '';
            try { navType = performance.getEntriesByType('navigation')[0].type; } catch (e) {}
            const savedScroll = sessionStorage.getItem(SCROLL_KEY);
            if (savedScroll && navType === 'back_forward') {
                window.scrollTo(0, parseInt(savedScroll));
                sessionStorage.removeItem(SCROLL_KEY);
            }
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        const FIRE_ICON = `
            <svg viewBox="0 0 512 512">
                <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/>
                <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/>
            </svg>`;
        const DOWN_ARROW = `<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        const STOPWATCH = `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.5"></circle><line x1="12" y1="14" x2="12" y2="10.5"></line><line x1="9.5" y1="2.5" x2="14.5" y2="2.5"></line><line x1="12" y1="2.5" x2="12" y2="6.5"></line></svg>`;


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function discountLabel(d) {
            const m = String(d || '').match(/\d+(?:[.,]\d+)?/);
            return m ? m[0] + '%' : '';
        }

        /* ---------- Hafta aksiyasi (index bilan bir xil mantiq) ---------- */

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function getWeeklySection() {
            return (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
        }
        function isWeeklyExpired() {
            const s = getWeeklySection();
            if (!s || !s.timer_end) return false;
            return Date.now() > new Date(s.timer_end).getTime();
        }
        function isWeeklyItem(p) {
            const s = getWeeklySection();
            return !!(s && (s.product_ids || []).includes(p.id));
        }

        let weeklyTimerInterval = null;
        function startWeeklyCountdown() {
            clearInterval(weeklyTimerInterval);
            const section = getWeeklySection();
            if (!section || !section.timer_end) return;
            const endTime = new Date(section.timer_end).getTime();
            if (endTime - Date.now() < 0) return;   // aksiya allaqachon tugagan: taymer kerak emas (aks holda cheksiz qayta chizish bo'lardi)

            function tick() {
                const els = document.querySelectorAll('.card-timer-val');
                const distance = endTime - Date.now();
                if (distance < 0) {
                    clearInterval(weeklyTimerInterval);
                    renderProducts(currentProductsList);   // aksiya tugadi: nishon va chegirma olinadi
                    return;
                }
                if (els.length === 0) return;
                const h = Math.floor(distance / 3600000);
                const m = Math.floor((distance % 3600000) / 60000);
                const sec = Math.floor((distance % 60000) / 1000);
                const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                els.forEach(el => el.textContent = str);
            }
            tick();
            weeklyTimerInterval = setInterval(tick, 1000);
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function createProductCardHTML(p) {
            const isLiked = favs.includes(p.id) ? 'liked' : '';
            const pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

            let loopImages = pImages;
            if (pImages.length === 2) loopImages = [pImages[1], pImages[0], pImages[1], pImages[0]];
            else if (pImages.length > 2) loopImages = [pImages[pImages.length - 1], ...pImages, pImages[0]];

            const prodName = getLocalized(p.name);
            const weekly = isWeeklyItem(p) && !isWeeklyExpired();

            const ribbonBadge = weekly ? `<div class="badge-action-ribbon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6" fill="#7a4cf5" stroke="none"/></svg>${currentLang === 'ru' ? 'АКЦИЯ' : 'AKSIYA'}</div>` : '';
            const timerHtml = weekly ? `
                <div class="card-timer-badge">
                    ${STOPWATCH}
                    <span class="card-timer-val">00:00:00</span>
                </div>` : '';
            const originalHtml = p.badgeType === 'original' ? `
                <div class="badge-original-sm">
                    <svg viewBox="0 0 24 24"><path fill="#007a28" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"></path><path fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-4.8"></path></svg>
                    <span>ORIGINAL</span>
                </div>` : '';
            const badgesHtml = (timerHtml || originalHtml) ? `<div class="card-image-badges">${timerHtml}${originalHtml}</div>` : '';
            const dotsHtml = pImages.length > 1 ? `
                <div class="card-dots">
                    ${pImages.map((_, idx) => `<div class="card-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>` : '';

            return `
                <div class="product-card" id="product-card-${p.id}">
                    <div class="img-wrap">
                        ${ribbonBadge}
                        <button class="heart-icon-sm ${isLiked}" onclick="toggleHeart(event, ${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="product-img-box" onclick="goToProduct(${p.id})">
                            <div class="card-slider-container" onscroll="handleCardInfiniteScroll(event, ${pImages.length})">
                                ${loopImages.map(imgUrl => `<div class="card-slide"><img src="${imgUrl}" alt="${prodName}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}
                            </div>
                            ${badgesHtml}
                        </div>
                    </div>
                    ${dotsHtml}
                    <div class="product-info" id="product-info-${p.id}"></div>
                </div>
            `;
        }

        function renderProducts(list) {
            const grid = document.getElementById('productsGrid');

            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${t.no_results}</div>`;
                return;
            }

            grid.innerHTML = list.map(p => createProductCardHTML(p)).join('');
            list.forEach(p => updateCardInfoOnly(p.id));

            // Slayderlarni 2-slaydga o'rnatish (o'qish va yozish alohida: bitta layout)
            requestAnimationFrame(() => {
                const sliders = [...grid.querySelectorAll('.card-slider-container')].filter(c => c.children.length > 1);
                const widths = sliders.map(c => c.clientWidth);
                sliders.forEach(c => { c.style.scrollBehavior = 'auto'; });
                sliders.forEach((c, i) => { c.scrollLeft = widths[i]; });
                sliders.forEach(c => { c.style.scrollBehavior = 'smooth'; });
            });
            startWeeklyCountdown();
        }

        function updateCardInfoOnly(id) {
            const infoContainer = document.getElementById(`product-info-${id}`);
            if (!infoContainer) return;

            const p = allProducts.find(item => item.id === id);
            if (!p) return;

            const defaultSize = p.sizes ? p.sizes[0] : null;
            const cartItem = cart.find(item => item.id === p.id && item.selectedSize === defaultSize);
            const prodName = getLocalized(p.name);
            const stock = stockOf(p);
            const isOut = stock <= 0;
            const isLast = stock === 1;
            const isNotified = notifiedList.includes(p.id);

            const weeklyItem = isWeeklyItem(p);
            const expired = isWeeklyExpired();
            let displayPrice = p.price, displayOldPrice = p.oldPrice, displayDiscount = p.discount;
            if (weeklyItem && expired) { displayPrice = p.oldPrice || p.price; displayOldPrice = ''; displayDiscount = ''; }

            const cleanPrice = displayPrice ? String(displayPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const cleanOldPrice = displayOldPrice ? String(displayOldPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const showDiscount = (weeklyItem && !expired) && discountLabel(displayDiscount);

            const priceHtml = isOut ? `<span class="main-price out-of-stock">${t.out_of_stock}</span>` : `
                <span class="main-price">${cleanPrice}</span>
                ${showDiscount ? `<span class="discount-tag">${DOWN_ARROW}${discountLabel(displayDiscount)}</span>` : ''}
            `;

            let btnHtml = SH.cardButton(p);


            const lastBadgeHtml = (isLast && !isOut) ? `<div class="last-item-badge">${FIRE_ICON}<span>${t.last_item}</span></div>` : '';

            infoContainer.innerHTML = `
                <div class="product-info-top">
                    <div class="price-row" onclick="goToProduct(${p.id})">${priceHtml}</div>
                    ${(!isOut && cleanOldPrice) ? `<div class="old-prices" onclick="goToProduct(${p.id})"><span class="price-old">${cleanOldPrice}</span></div>` : ''}
                    <div class="product-title" onclick="goToProduct(${p.id})" title="${prodName}">${prodName}</div>
                    <div class="product-rating">
                        <div class="rating-left" onclick="goToProduct(${p.id})">
                            <div class="rating-box"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span class="rating-num">${ratingOf(p).avg}</span></div>
                            <div class="comment-box"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="comments-num">${ratingOf(p).count}</span></div>
                        </div>
                        ${lastBadgeHtml}
                    </div>
                </div>
                <div class="card-action-container card-action-container-${p.id}">${btnHtml}</div>
            `;
        }

        /* ================= QIDIRUV: index, products va categories sahifalarida bir xil ================= */

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        let searchActive = false;
        let searchBackdropTimer = null;
        let kbBaseH = 0;
        let kbShown = false;

        // Faqat sahifaning joriy tilidagi matn bo'yicha qidiriladi (ruscha sahifa = ruscha, o'zbekcha = o'zbekcha)
        function sTxt(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[currentLang] || ''; }
        function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/\s+/g, ' ').trim(); }
        function sMatch(text, q) { const tx = sNorm(text); if (!tx || !q) return false; return q.split(' ').every(w => tx.includes(w)); }
        function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function tt(key, fallback) { return (t && t[key]) || fallback; }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function getSearchHistory() { try { return JSON.parse(localStorage.getItem(window.shKey())) || []; } catch (e) { return []; } }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function saveSearchQuery(q) {
            if (!q) return;
            let history = getSearchHistory();
            history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
            history.unshift(q);
            if (history.length > 5) history = history.slice(0, 5);
            localStorage.setItem(window.shKey(), JSON.stringify(history));
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function removeHistoryItem(i) { const h = getSearchHistory(); h.splice(i, 1); localStorage.setItem(window.shKey(), JSON.stringify(h)); renderHistory(); }
        function clearAllHistory() { localStorage.removeItem(window.shKey()); closeSearchDropdown(); }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function currentVH() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
        function markSearchOpen() {
            clearTimeout(searchBackdropTimer);
            if (!searchActive) { kbBaseH = currentVH(); kbShown = false; }
            searchActive = true;
            const b = document.getElementById('searchBackdrop');
            if (b) b.classList.add('show');
        }
        function closeSearchDropdown() {
            searchActive = false;
            const dd = document.getElementById('searchDropdown');
            if (dd) dd.classList.remove('show');
            const inp = document.getElementById('searchInput');
            if (inp) inp.blur();                                   // klaviatura yopiladi
            clearTimeout(searchBackdropTimer);
            // fon biroz kechikib yopiladi, shunda bosish ostidagi kartaga o'tib ketmaydi
            searchBackdropTimer = setTimeout(() => {
                if (!searchActive) { const b = document.getElementById('searchBackdrop'); if (b) b.classList.remove('show'); }
            }, 300);
        }
        function closeSearchIfOpen() {
            const dd = document.getElementById('searchDropdown');
            if (searchActive || (dd && dd.classList.contains('show'))) { closeSearchDropdown(); return true; }
            return false;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderHistory() {
            const dd = document.getElementById('searchDropdown');
            const history = getSearchHistory();
            if (history.length === 0) { dd.classList.remove('show'); dd.innerHTML = ''; return; }
            let html = `<div class="search-header-row"><span>${tt('history_title', 'Oxirgi qidiruvlar')}</span><button class="clear-history-btn" data-act="clear">${tt('clear_history', 'Tozalash')}</button></div>`;
            history.forEach((item, i) => {
                html += `<div class="search-suggestion-item" data-act="hist" data-q="${escHtml(item)}"><div class="history-item-left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${escHtml(item)}</span></div><button class="remove-history-item" data-act="del" data-idx="${i}">&times;</button></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function renderSearchDropdown() {
            const dd = document.getElementById('searchDropdown');
            const raw = document.getElementById('searchInput').value.trim();
            if (!raw) { renderHistory(); return; }
            const src = getSearchSource();
            const sc = SH.searchCats(raw, src.cats);
            const rk = SH.searchRank(raw, src.prods, src.cats);
            const mp = rk.full.concat(rk.part);
            if (!sc.cats.length && !sc.subs.length && !mp.length) {
                dd.innerHTML = `<div class="search-suggestion-item" style="color: var(--muted); justify-content: center;">${tt('no_results', 'Hech narsa topilmadi...')}</div>`;
                dd.classList.add('show');
                return;
            }
            let html = `<div class="search-suggestion-item" data-act="all" data-q="${escHtml(raw)}"><span>"${escHtml(raw)}" ${tt('search_all_label', "bo'yicha barcha natijalarni ko'rish")}</span><span class="suggestion-type">${tt('search_type', 'Qidirish')}</span></div>`;
            sc.cats.slice(0, 3).forEach(c => {
                html += `<div class="search-suggestion-item" data-act="cat" data-cat="${escHtml(c.id)}"><span>${escHtml(SH.textIn(c.name))}</span><span class="suggestion-type">${tt('category_type', "Bo'lim")}</span></div>`;
            });
            sc.subs.slice(0, 4).forEach(x => {
                html += `<div class="search-suggestion-item" data-act="sub" data-cat="${escHtml(x.c.id)}" data-sub="${escHtml(SH.textIn(x.s.name))}"><span>${escHtml(SH.textIn(x.s.name))} <small style="color:var(--muted)">(${escHtml(SH.textIn(x.c.name))})</small></span><span class="suggestion-type">${tt('subcat_type', 'Turkum')}</span></div>`;
            });
            // Mahsulot taklifi bosilsa mahsulotga emas, shu so'z bo'yicha NATIJALAR RO'YXATIGA o'tadi
            mp.slice(0, 6).forEach(p => {
                const nm = SH.textIn(p.name);
                html += `<div class="search-suggestion-item" data-act="prod" data-id="${escHtml(p.id)}" data-q="${escHtml(nm)}"><div class="history-item-left"><span>${escHtml(nm)}</span></div><span class="suggestion-type">${tt('product_type', 'Mahsulot')}</span></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }

        function goSearch(q) {
            if (!q) return;
            saveSearchQuery(q);
            closeSearchDropdown();
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
        function pickCategory(id) {
            if (typeof onCategoryPicked === 'function') { onCategoryPicked(id); return; }
            localStorage.setItem('active_cat_id', id);
            window.location.href = `categories.html?cat_id=${encodeURIComponent(id)}`;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function showSearchHistory() { markSearchOpen(); renderSearchDropdown(); }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function handleLiveSearch() { markSearchOpen(); renderSearchDropdown(); }
        function handleSearch(e) { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) goSearch(q); } }

        document.getElementById('searchDropdown').addEventListener('click', (e) => {
            const el = e.target.closest('[data-act]');
            if (!el) return;
            e.stopPropagation();
            const d = el.dataset;
            if (d.act === 'all' || d.act === 'hist') goSearch(d.q);
            else if (d.act === 'cat') { closeSearchDropdown(); pickCategory(d.cat); }
            else if (d.act === 'sub') { window.location.href = `products.html?cat_id=${encodeURIComponent(d.cat)}&sub=${encodeURIComponent(d.sub)}`; }
            else if (d.act === 'prod') { goSearch(d.q); }
            else if (d.act === 'del') removeHistoryItem(parseInt(d.idx));
            else if (d.act === 'clear') clearAllHistory();
        });

        // Klaviatura yopilsa (orqaga surish), qidiruv ham yopiladi
        function onViewportResize() {
            if (!searchActive) return;
            const h = currentVH();
            if (h < kbBaseH - 100) kbShown = true;
            else if (kbShown && h >= kbBaseH - 60) closeSearchDropdown();
        }
        window.addEventListener('resize', onViewportResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportResize);
        window.addEventListener('DOMContentLoaded', () => {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) tg.onEvent('viewportChanged', onViewportResize);
        });

        function isInsideSearch(target) {
            return !!(target && target.closest && (target.closest('#searchBoxContainer') || target.closest('.search-box-wrapper') || target.closest('#searchDropdown')));
        }
        // Ekranga sal tegilsa yoki surilsa, qidiruv va klaviatura yopiladi
        ['touchstart', 'touchmove', 'wheel'].forEach(evName => {
            document.addEventListener(evName, (e) => {
                if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
            }, { passive: true });
        });
        document.addEventListener('click', (e) => {
            if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
        });

        function getSearchSource() { return { cats: dbData.categories || [], prods: allProducts }; }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function toggleNotify(id) { SH.cardNotify(id); }

        window.handleCardInfiniteScroll = handleCardInfiniteScroll;
        function handleCardInfiniteScroll(e, originalLen) {
            if (originalLen <= 1) return;
            const container = e.target;
            const slideWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const maxScroll = slideWidth * (container.children.length - 1);

            if (scrollLeft >= maxScroll - 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth;
                container.style.scrollBehavior = 'smooth';
            } else if (scrollLeft <= 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth * originalLen;
                container.style.scrollBehavior = 'smooth';
            }

            let activeIndex = Math.round(container.scrollLeft / slideWidth) - 1;
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= originalLen) activeIndex = originalLen - 1;

            const cardBox = container.closest('.product-card');
            const dotsBox = cardBox && cardBox.querySelector('.card-dots');
            if (dotsBox) {
                for (let i = 0; i < dotsBox.children.length; i++) {
                    dotsBox.children[i].classList.toggle('active', i === activeIndex);
                }
            }
        }

        function toggleHeart(e, id) {
            e.stopPropagation();
            if (favs.includes(id)) {
                favs = favs.filter(item => item !== id);
            } else {
                favs.push(id);
            }
            localStorage.setItem('fav_products', JSON.stringify(favs));
            const btn = e.currentTarget;
            btn.classList.toggle('liked', favs.includes(id));
            updateBadges();
        }

        function addSimilarToCart(id) { SH.cardAdd(id); }

        function changeSimilarQty(id, delta) { SH.cardQty(id, delta); }

        function updateCardActionUI(id) { updateCardInfoOnly(id); }

        function updateBadges() {
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');
            let validFavs = favs.filter(id => allProducts.some(p => p.id === id));

            if (validFavs.length > 0) {
                favBadge.textContent = validFavs.length;
                favBadge.classList.add('show');
            } else {
                favBadge.classList.remove('show');
            }

            let totalCartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCartCount > 0) {
                cartBadge.textContent = totalCartCount;
                cartBadge.classList.add('show');
            } else {
                cartBadge.classList.remove('show');
            }
        }

        function goToProduct(id) {
            sessionStorage.setItem(SCROLL_KEY, window.scrollY);
            window.location.href = `product.html?id=${id}`;
        }

        /* ---------- Orqaga: telefon tugmasi, chetdan surish va strelka bir xil ishlaydi, ilova yopilmaydi ---------- */

        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function goBack() {
            if (closeSearchIfOpen()) return;                    // avval qidiruv oynasi yopiladi
            sessionStorage.removeItem(SCROLL_KEY);
            if (history.length > 1 && document.referrer) history.back();
            else window.location.href = 'index.html';           // tarix bo'sh bo'lsa ham bosh sahifaga qaytadi
        }

        function setupTelegramBack() {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (!tg) return;
            try { tg.ready(); tg.expand(); } catch (e) {}
            if (tg.BackButton) {
                tg.BackButton.offClick(goBack);
                tg.BackButton.onClick(goBack);
                tg.BackButton.show();                           // ko'rinib tursa, telefonning "orqaga" tugmasi ilovani yopmaydi
            }
            try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
        }

        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }

        // Boshqa sahifadan orqaga qaytilganda holatni yangilash (ikki marta yuklanmaydi)
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
            setupTelegramBack();
            initPage();
        });

        window.addEventListener('DOMContentLoaded', () => {
            setupTelegramBack();
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
            fetchAppDataAndInit();
        });
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        window.__shSync = function () { try { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); } catch (e) {} };
        Object.assign(window, { applyThemeAndTranslations, getLocalized, getStrictLocalized, loadDB, stockOf, needsChoice, defColor, ratingOf, setDB, fetchAppDataAndInit, initPage, discountLabel, getWeeklySection, isWeeklyExpired, isWeeklyItem, startWeeklyCountdown, createProductCardHTML, renderProducts, updateCardInfoOnly, sTxt, sNorm, sMatch, escHtml, tt, getSearchHistory, saveSearchQuery, removeHistoryItem, clearAllHistory, currentVH, markSearchOpen, closeSearchDropdown, closeSearchIfOpen, renderHistory, renderSearchDropdown, goSearch, pickCategory, showSearchHistory, handleLiveSearch, handleSearch, onViewportResize, isInsideSearch, getSearchSource, toggleNotify, handleCardInfiniteScroll, toggleHeart, addSimilarToCart, changeSimilarQty, updateCardActionUI, updateBadges, goToProduct, goBack, setupTelegramBack, updateNavInset });
};

/* ##########################################################################
   SAHIFA: KATALOG (categories.html)   ->   <html data-page="categories">
   ########################################################################## */
PAGES.categories = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                search_placeholder: "Mahsulotlar va turkumlar izlash...",
                history_title: "Oxirgi qidiruvlar",
                clear_history: "Tozalash",
                no_results: "Hech narsa topilmadi...",
                search_all_label: "bo'yicha barcha natijalarni ko'rish",
                search_type: "Qidirish",
                category_type: "Bo'lim",
                subcat_type: "Turkum",
                product_type: "Mahsulot",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                search_placeholder: "Поиск товаров и категорий...",
                history_title: "История поиска",
                clear_history: "Очистить",
                no_results: "Ничего не найдено...",
                search_all_label: "посмотреть все результаты для",
                search_type: "Поиск",
                category_type: "Раздел",
                subcat_type: "Категория",
                product_type: "Товар",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let dbData = {};
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        let categoriesData = [];
        let allProducts = [];

        /* ==================== KATEGORIYALAR ==================== */
        let activeCatId = parseInt(localStorage.getItem('active_cat_id')) || 1;


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];

            let siteTheme = localStorage.getItem('site_theme') || 'light';
            if (siteTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || field['uz'] || Object.values(field)[0] || '';
            }
            return field;
        }

        function getStrictLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || '';
            }
            return '';
        }

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}
            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };
            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        function setDB(d) {
            SH.setDB(d);
            dbData = d || {};
            categoriesData = dbData.categories || [];
            allProducts = dbData.products || [];
            if (dbData.settings && dbData.settings.theme && !localStorage.getItem('site_theme')) {
                localStorage.setItem('site_theme', dbData.settings.theme);
            }
        }


        /* ==================== KATEGORIYALAR ==================== */
        function centerActiveCat() {
            const sidebar = document.getElementById('sidebarCategories');
            const a = sidebar && sidebar.querySelector('.sidebar-item.active');
            if (a) sidebar.scrollTop = Math.max(0, a.offsetTop - sidebar.clientHeight / 2 + a.offsetHeight / 2);
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        async function fetchDatabaseAndInit() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            applyThemeAndTranslations();
            try {
                setDB(await loadDB(fresh => { setDB(fresh); renderCatalog(); updateBadges(); }));
            } catch (err) {
                try {
                    const res = await fetch(SH.API + '/api/products');
                    if (res.ok) setDB(await res.json());
                } catch (e) { console.error("Bazadan ma'lumotlarni o'qib bo'lmadi:", e); }
            }

            // Banner yoki qidiruvdan kelgan bo'lsa: ?cat_id=... bo'yicha shu kategoriya ochiladi
            const urlCat = parseInt(new URLSearchParams(location.search).get('cat_id'));
            if (!isNaN(urlCat)) {
                activeCatId = urlCat;
                localStorage.setItem('active_cat_id', urlCat);
                localStorage.removeItem('catalog_content_scroll');
            }

            renderCatalog();
            updateBadges();
            centerActiveCat();

            const savedScroll = localStorage.getItem('catalog_content_scroll');
            if (savedScroll) {
                setTimeout(() => {
                    const panel = document.getElementById('contentPanel');
                    if (panel) panel.scrollTop = parseInt(savedScroll);
                }, 50);
            }
        }


        /* ==================== KATEGORIYALAR ==================== */
        function renderCatalog() {
            applyThemeAndTranslations();
            const sidebar = document.getElementById('sidebarCategories');
            const panel = document.getElementById('contentPanel');

            if (!categoriesData || categoriesData.length === 0) return;

            sidebar.innerHTML = categoriesData.map(c => `
                <div class="sidebar-item ${c.id === activeCatId ? 'active' : ''}" onclick="selectCategory(${c.id})">
                    ${getLocalized(c.name)}
                </div>
            `).join('');

            const currentCat = categoriesData.find(c => c.id === activeCatId) || categoriesData[0];

            panel.innerHTML = `
                <div class="panel-title">${getLocalized(currentCat.name)}</div>
                <div class="subcats-grid">
                    ${currentCat.subcats.map(sub => {
                        const subName = getLocalized(sub.name);
                        return `
                            <a href="products.html?cat_id=${currentCat.id}&sub=${encodeURIComponent(subName)}" class="subcat-card" onclick="saveScrollPosition()">
                                <div class="subcat-img-wrap">
                                    <img src="${sub.img}" alt="${subName}" class="subcat-img">
                                </div>
                                <span class="subcat-name">${subName}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            `;
        }

        function selectCategory(id) {
            activeCatId = id;
            localStorage.setItem('active_cat_id', id);
            const panel = document.getElementById('contentPanel');
            if (panel) panel.scrollTop = 0;
            localStorage.removeItem('catalog_content_scroll');
            renderCatalog();
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function saveScrollPosition() {
            localStorage.setItem('active_cat_id', activeCatId);
            const panel = document.getElementById('contentPanel');
            if (panel) {
                localStorage.setItem('catalog_content_scroll', panel.scrollTop);
            }
        }

        /* ================= QIDIRUV: index, products va categories sahifalarida bir xil ================= */

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        let searchActive = false;
        let searchBackdropTimer = null;
        let kbBaseH = 0;
        let kbShown = false;

        // Faqat sahifaning joriy tilidagi matn bo'yicha qidiriladi (ruscha sahifa = ruscha, o'zbekcha = o'zbekcha)
        function sTxt(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[currentLang] || ''; }
        function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/\s+/g, ' ').trim(); }
        function sMatch(text, q) { const tx = sNorm(text); if (!tx || !q) return false; return q.split(' ').every(w => tx.includes(w)); }
        function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function tt(key, fallback) { return (t && t[key]) || fallback; }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function getSearchHistory() { try { return JSON.parse(localStorage.getItem(window.shKey())) || []; } catch (e) { return []; } }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function saveSearchQuery(q) {
            if (!q) return;
            let history = getSearchHistory();
            history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
            history.unshift(q);
            if (history.length > 5) history = history.slice(0, 5);
            localStorage.setItem(window.shKey(), JSON.stringify(history));
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function removeHistoryItem(i) { const h = getSearchHistory(); h.splice(i, 1); localStorage.setItem(window.shKey(), JSON.stringify(h)); renderHistory(); }
        function clearAllHistory() { localStorage.removeItem(window.shKey()); closeSearchDropdown(); }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function currentVH() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
        function markSearchOpen() {
            clearTimeout(searchBackdropTimer);
            if (!searchActive) { kbBaseH = currentVH(); kbShown = false; }
            searchActive = true;
            const b = document.getElementById('searchBackdrop');
            if (b) b.classList.add('show');
        }
        function closeSearchDropdown() {
            searchActive = false;
            const dd = document.getElementById('searchDropdown');
            if (dd) dd.classList.remove('show');
            const inp = document.getElementById('searchInput');
            if (inp) inp.blur();                                   // klaviatura yopiladi
            clearTimeout(searchBackdropTimer);
            // fon biroz kechikib yopiladi, shunda bosish ostidagi kartaga o'tib ketmaydi
            searchBackdropTimer = setTimeout(() => {
                if (!searchActive) { const b = document.getElementById('searchBackdrop'); if (b) b.classList.remove('show'); }
            }, 300);
        }
        function closeSearchIfOpen() {
            const dd = document.getElementById('searchDropdown');
            if (searchActive || (dd && dd.classList.contains('show'))) { closeSearchDropdown(); return true; }
            return false;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderHistory() {
            const dd = document.getElementById('searchDropdown');
            const history = getSearchHistory();
            if (history.length === 0) { dd.classList.remove('show'); dd.innerHTML = ''; return; }
            let html = `<div class="search-header-row"><span>${tt('history_title', 'Oxirgi qidiruvlar')}</span><button class="clear-history-btn" data-act="clear">${tt('clear_history', 'Tozalash')}</button></div>`;
            history.forEach((item, i) => {
                html += `<div class="search-suggestion-item" data-act="hist" data-q="${escHtml(item)}"><div class="history-item-left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${escHtml(item)}</span></div><button class="remove-history-item" data-act="del" data-idx="${i}">&times;</button></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function renderSearchDropdown() {
            const dd = document.getElementById('searchDropdown');
            const raw = document.getElementById('searchInput').value.trim();
            if (!raw) { renderHistory(); return; }
            const src = getSearchSource();
            const sc = SH.searchCats(raw, src.cats);
            const rk = SH.searchRank(raw, src.prods, src.cats);
            const mp = rk.full.concat(rk.part);
            if (!sc.cats.length && !sc.subs.length && !mp.length) {
                dd.innerHTML = `<div class="search-suggestion-item" style="color: var(--muted); justify-content: center;">${tt('no_results', 'Hech narsa topilmadi...')}</div>`;
                dd.classList.add('show');
                return;
            }
            let html = `<div class="search-suggestion-item" data-act="all" data-q="${escHtml(raw)}"><span>"${escHtml(raw)}" ${tt('search_all_label', "bo'yicha barcha natijalarni ko'rish")}</span><span class="suggestion-type">${tt('search_type', 'Qidirish')}</span></div>`;
            sc.cats.slice(0, 3).forEach(c => {
                html += `<div class="search-suggestion-item" data-act="cat" data-cat="${escHtml(c.id)}"><span>${escHtml(SH.textIn(c.name))}</span><span class="suggestion-type">${tt('category_type', "Bo'lim")}</span></div>`;
            });
            sc.subs.slice(0, 4).forEach(x => {
                html += `<div class="search-suggestion-item" data-act="sub" data-cat="${escHtml(x.c.id)}" data-sub="${escHtml(SH.textIn(x.s.name))}"><span>${escHtml(SH.textIn(x.s.name))} <small style="color:var(--muted)">(${escHtml(SH.textIn(x.c.name))})</small></span><span class="suggestion-type">${tt('subcat_type', 'Turkum')}</span></div>`;
            });
            // Mahsulot taklifi bosilsa mahsulotga emas, shu so'z bo'yicha NATIJALAR RO'YXATIGA o'tadi
            mp.slice(0, 6).forEach(p => {
                const nm = SH.textIn(p.name);
                html += `<div class="search-suggestion-item" data-act="prod" data-id="${escHtml(p.id)}" data-q="${escHtml(nm)}"><div class="history-item-left"><span>${escHtml(nm)}</span></div><span class="suggestion-type">${tt('product_type', 'Mahsulot')}</span></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }

        function goSearch(q) {
            if (!q) return;
            saveSearchQuery(q);
            closeSearchDropdown();
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
        function pickCategory(id) {
            if (typeof onCategoryPicked === 'function') { onCategoryPicked(id); return; }
            localStorage.setItem('active_cat_id', id);
            window.location.href = `categories.html?cat_id=${encodeURIComponent(id)}`;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function showSearchHistory() { markSearchOpen(); renderSearchDropdown(); }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function handleLiveSearch() { markSearchOpen(); renderSearchDropdown(); }
        function handleSearch(e) { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) goSearch(q); } }

        document.getElementById('searchDropdown').addEventListener('click', (e) => {
            const el = e.target.closest('[data-act]');
            if (!el) return;
            e.stopPropagation();
            const d = el.dataset;
            if (d.act === 'all' || d.act === 'hist') goSearch(d.q);
            else if (d.act === 'cat') { closeSearchDropdown(); pickCategory(d.cat); }
            else if (d.act === 'sub') { window.location.href = `products.html?cat_id=${encodeURIComponent(d.cat)}&sub=${encodeURIComponent(d.sub)}`; }
            else if (d.act === 'prod') { goSearch(d.q); }
            else if (d.act === 'del') removeHistoryItem(parseInt(d.idx));
            else if (d.act === 'clear') clearAllHistory();
        });

        // Klaviatura yopilsa (orqaga surish), qidiruv ham yopiladi
        function onViewportResize() {
            if (!searchActive) return;
            const h = currentVH();
            if (h < kbBaseH - 100) kbShown = true;
            else if (kbShown && h >= kbBaseH - 60) closeSearchDropdown();
        }
        window.addEventListener('resize', onViewportResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportResize);
        window.addEventListener('DOMContentLoaded', () => {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) tg.onEvent('viewportChanged', onViewportResize);
        });

        function isInsideSearch(target) {
            return !!(target && target.closest && (target.closest('#searchBoxContainer') || target.closest('.search-box-wrapper') || target.closest('#searchDropdown')));
        }
        // Ekranga sal tegilsa yoki surilsa, qidiruv va klaviatura yopiladi
        ['touchstart', 'touchmove', 'wheel'].forEach(evName => {
            document.addEventListener(evName, (e) => {
                if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
            }, { passive: true });
        });
        document.addEventListener('click', (e) => {
            if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
        });

        function getSearchSource() { return { cats: categoriesData, prods: allProducts }; }
        // Qidiruvdan kategoriya tanlansa shu sahifaning o'zida ochiladi
        function onCategoryPicked(id) {
            const n = parseInt(id);
            localStorage.setItem('active_cat_id', n);
            selectCategory(n);
            centerActiveCat();
            document.getElementById('searchInput').value = '';
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function updateBadges() {
            let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');

            if (favs.length > 0) {
                favBadge.textContent = favs.length;
                favBadge.classList.add('show');
            } else {
                favBadge.classList.remove('show');
            }

            let totalCartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCartCount > 0) {
                cartBadge.textContent = totalCartCount;
                cartBadge.classList.add('show');
            } else {
                cartBadge.classList.remove('show');
            }
        }

        /* ---------- Orqaga: telefon tugmasi, chetdan surish va strelka bir xil, ilova yopilmaydi ---------- */

        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function pageGoBack() {
            if (closeSearchIfOpen()) return;                       // avval qidiruv oynasi yopiladi
            if (history.length > 1 && document.referrer) history.back();
            else window.location.href = 'index.html';              // tarix bo'sh bo'lsa ham bosh sahifaga qaytadi
        }
        function setupTelegramBack(handler) {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (!tg) return;
            try { tg.ready(); tg.expand(); } catch (e) {}
            if (tg.BackButton) {
                try { tg.BackButton.offClick(handler); } catch (e) {}
                tg.BackButton.onClick(handler);
                tg.BackButton.show();                              // ko'rinib tursa, telefonning "orqaga" tugmasi ilovani yopmaydi
            }
            try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
        }
        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }
        window.addEventListener('DOMContentLoaded', () => {
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
        });

        window.addEventListener('pageshow', (e) => {
            if (!e.persisted) return;
            updateBadges();
            setupTelegramBack(pageGoBack);
        });
        window.addEventListener('DOMContentLoaded', () => {
            setupTelegramBack(pageGoBack);
            fetchDatabaseAndInit();
        });
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        Object.assign(window, { applyThemeAndTranslations, getLocalized, getStrictLocalized, loadDB, setDB, centerActiveCat, fetchDatabaseAndInit, renderCatalog, selectCategory, saveScrollPosition, sTxt, sNorm, sMatch, escHtml, tt, getSearchHistory, saveSearchQuery, removeHistoryItem, clearAllHistory, currentVH, markSearchOpen, closeSearchDropdown, closeSearchIfOpen, renderHistory, renderSearchDropdown, goSearch, pickCategory, showSearchHistory, handleLiveSearch, handleSearch, onViewportResize, isInsideSearch, getSearchSource, onCategoryPicked, updateBadges, pageGoBack, setupTelegramBack, updateNavInset });
};

/* ##########################################################################
   SAHIFA: AKSIYALAR (sales.html)   ->   <html data-page="sales">
   ########################################################################## */
PAGES.sales = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                cart_btn: "Savatga",
                notify_btn: "Kelganda xabar qilish",
                choose_btn: "Tanlash",
                notify_active: "✓ Xabar beriladi",
                out_of_stock: "Qolmadi",
                last_item: "Oxirgisi",
                sale_title: "Hafta aksiyalari",
                sale_ended: "Aksiya tugadi",
                no_results: "Hech narsa topilmadi...",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                cart_btn: "В корзину",
                notify_btn: "Сообщить о поступлении",
                choose_btn: "Выбрать",
                notify_active: "✓ Сообщим",
                out_of_stock: "Нет в наличии",
                last_item: "Последний",
                sale_title: "Скидки недели",
                sale_ended: "Акция закончилась",
                no_results: "Ничего не найдено...",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let dbData = { products: [], home_sections: [] };

        /* ---------- Kiyim: variant, qoldiq va reyting yordamchilari ---------- */

        /* ==================== YORDAMCHILAR: ombor qoldig'i, rang/o'lcham tanlash kerakmi, reyting ==================== */
        function stockOf(p) { return SH.totalStock(p); }
        function needsChoice(p) { return SH.needsChoice(p); }
        function defColor(p) { return p.colors && p.colors.length ? (p.colors[0].id || null) : null; }
        let _rvSrc = null, _rvN = -1, _rvMap = {};
        function ratingOf(p) {
            let loc = []; try { loc = JSON.parse(localStorage.getItem('local_reviews')) || []; } catch (e) {}
            const src = (typeof dbData !== 'undefined' && dbData.reviews) || [];
            if (_rvSrc !== src || _rvN !== loc.length) {
                _rvSrc = src; _rvN = loc.length; _rvMap = {};
                src.concat(loc).forEach(r => { const a = _rvMap[r.product_id] || (_rvMap[r.product_id] = { s: 0, n: 0 }); a.s += Number(r.rating) || 0; a.n++; });
            }
            const a = _rvMap[p.id];
            if (a && a.n) return { avg: (a.s / a.n).toFixed(1), count: a.n };
            if (p.rating && p.comments) return { avg: Number(p.rating).toFixed(1), count: p.comments };
            return { avg: '–', count: 0 };
        }

        /* ==================== SAQLANGAN MA'LUMOT: saralanganlar, savat, 'kelganda xabar qil' (telefon xotirasida) ==================== */
        let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
        let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
        let notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        let timerInterval = null;


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        const FIRE_ICON = `
            <svg viewBox="0 0 512 512">
                <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/>
                <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/>
            </svg>`;
        const DOWN_ARROW = `<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        const STOPWATCH = `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.5"></circle><line x1="12" y1="14" x2="12" y2="10.5"></line><line x1="9.5" y1="2.5" x2="14.5" y2="2.5"></line><line x1="12" y1="2.5" x2="12" y2="6.5"></line></svg>`;


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function discountLabel(d) {
            const m = String(d || '').match(/\d+(?:[.,]\d+)?/);
            return m ? m[0] + '%' : '';
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            return typeof field === 'object' ? (field[currentLang] || field['uz'] || Object.values(field)[0]) : field;
        }


        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function getSection() {
            return (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
        }

        function isExpired() {
            const s = getSection();
            if (!s || !s.timer_end) return false;
            return Date.now() > new Date(s.timer_end).getTime();
        }


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];
            if ((localStorage.getItem('site_theme') || 'light') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
        }

        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            // 32px dan kichik bo'lsa - jestli (tugmasiz) navigatsiya, joyida qoladi
            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }

        window.addEventListener('DOMContentLoaded', () => {
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
        });

        /* ---------- Telegram orqaga tugmasi ---------- */
        function goBack() {
            if (history.length > 1 && document.referrer) history.back();
            else window.location.href = 'index.html';
        }

        function setupTelegramBack() {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (!tg) return;
            tg.expand();
            if (tg.BackButton) {
                try { tg.BackButton.offClick(goBack); } catch (e) {}
                tg.BackButton.onClick(goBack);
                tg.BackButton.show();
            }
            try { tg.ready(); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
        }

        window.addEventListener('DOMContentLoaded', () => {
            setupTelegramBack();
            init();
        });

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                favs = JSON.parse(localStorage.getItem('fav_products')) || [];
                cart = JSON.parse(localStorage.getItem('cart_products')) || [];
                notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
                setupTelegramBack();
                renderList();
                updateBadges();
            }
        });

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}

            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };

            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        function setDB(d) {
            SH.setDB(d);
            dbData = Object.assign({ products: [], home_sections: [] }, d || {});
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function renderAll() {
            applyThemeAndTranslations();
            const section = getSection();
            document.getElementById('pageTitle').textContent = section ? getLocalized(section.title) : t.sale_title;
            renderList();
            updateBadges();
            if (section && section.timer_end) startCountdown(section.timer_end);
        }

        async function init() {
            applyThemeAndTranslations();
            try {
                setDB(await loadDB(fresh => { setDB(fresh); renderAll(); }));
            } catch (e) { console.error(e); }
            renderAll();
            restoreSalesScroll();
        }

        try { history.scrollRestoration = 'manual'; } catch (e) {}
        function restoreSalesScroll() {
            let nav = null;
            try { nav = performance.getEntriesByType('navigation')[0]; } catch (e) {}
            if (!nav || nav.type !== 'back_forward') return;
            const y = parseInt(sessionStorage.getItem('sales_scroll'));
            if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function renderList() {
            const grid = document.getElementById('productsGrid');
            const section = getSection();

            if (!section || isExpired()) {
                grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${section ? t.sale_ended : t.no_results}</div>`;
                return;
            }

            const list = dbData.products.filter(p => section.product_ids.includes(p.id));
            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${t.no_results}</div>`;
                return;
            }

            grid.innerHTML = list.map(p => createProductCardHTML(p)).join('');
            list.forEach(p => updateCardInfoOnly(p.id));

            requestAnimationFrame(() => {
                const sliders = [...document.querySelectorAll('.card-slider-container')].filter(c => c.children.length > 1);
                const widths = sliders.map(c => c.clientWidth);
                sliders.forEach(c => { c.style.scrollBehavior = 'auto'; });
                sliders.forEach((c, i) => { c.scrollLeft = widths[i]; });
                sliders.forEach(c => { c.style.scrollBehavior = 'smooth'; });
            });
        }


        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function startCountdown(endTimeStr) {
            const endTime = new Date(endTimeStr).getTime();
            const header = document.getElementById('headerTimer');
            const headerVal = document.getElementById('headerTimerVal');
            if (endTime - Date.now() < 0) { header.classList.remove('show'); return; }   // aksiya allaqachon tugagan

            function tick() {
                const distance = endTime - Date.now();
                if (distance < 0) {
                    clearInterval(timerInterval);
                    header.classList.remove('show');
                    renderList();
                    return;
                }
                const h = Math.floor(distance / 3600000);
                const m = Math.floor((distance % 3600000) / 60000);
                const s = Math.floor((distance % 60000) / 1000);
                const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                header.classList.add('show');
                headerVal.textContent = str;
                document.querySelectorAll('.card-timer-val').forEach(el => el.textContent = str);
            }
            clearInterval(timerInterval);
            tick();
            timerInterval = setInterval(tick, 1000);
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function createProductCardHTML(p) {
            const isLiked = favs.includes(p.id) ? 'liked' : '';
            const pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

            let loopImages = pImages;
            if (pImages.length === 2) loopImages = [pImages[1], pImages[0], pImages[1], pImages[0]];
            else if (pImages.length > 2) loopImages = [pImages[pImages.length - 1], ...pImages, pImages[0]];

            const prodName = getLocalized(p.name);

            const timerHtml = `
                <div class="card-timer-badge">
                    ${STOPWATCH}
                    <span class="card-timer-val">00:00:00</span>
                </div>`;
            const originalHtml = p.badgeType === 'original' ? `
                <div class="badge-original-sm">
                    <svg viewBox="0 0 24 24"><path fill="#007a28" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"></path><path fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-4.8"></path></svg>
                    <span>ORIGINAL</span>
                </div>` : '';

            const dotsHtml = pImages.length > 1 ? `
                <div class="card-dots">
                    ${pImages.map((_, idx) => `<div class="card-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>` : '';

            return `
                <div class="product-card" id="product-card-${p.id}">
                    <div class="img-wrap">
                        <div class="badge-action-ribbon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6" fill="#7a4cf5" stroke="none"/></svg>${currentLang === 'ru' ? 'АКЦИЯ' : 'AKSIYA'}</div>
                        <button class="heart-icon-sm ${isLiked}" onclick="toggleHeart(event, ${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="product-img-box" onclick="goToProduct(${p.id})">
                            <div class="card-slider-container" onscroll="handleCardInfiniteScroll(event, ${pImages.length})">
                                ${loopImages.map(imgUrl => `<div class="card-slide"><img src="${imgUrl}" alt="${prodName}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}
                            </div>
                            <div class="card-image-badges">${timerHtml}${originalHtml}</div>
                        </div>
                    </div>
                    ${dotsHtml}
                    <div class="product-info" id="product-info-${p.id}"></div>
                </div>
            `;
        }

        function updateCardInfoOnly(id) {
            const infoContainer = document.getElementById(`product-info-${id}`);
            if (!infoContainer) return;
            const p = dbData.products.find(item => item.id === id);
            if (!p) return;

            const defaultSize = p.sizes ? p.sizes[0] : null;
            const cartItem = cart.find(item => item.id === p.id && item.selectedSize === defaultSize);
            const prodName = getLocalized(p.name);
            const stock = stockOf(p);
            const isOut = stock <= 0;
            const isLast = stock === 1;
            const isNotified = notifiedList.includes(p.id);

            const cleanPrice = p.price ? p.price.replace(/\s*so['‘]m/gi, '').trim() : '';
            const cleanOldPrice = p.oldPrice ? p.oldPrice.replace(/\s*so['‘]m/gi, '').trim() : '';
            const discount = discountLabel(p.discount);

            const priceHtml = isOut ? `<span class="main-price out-of-stock">${t.out_of_stock}</span>` : `
                <span class="main-price">${cleanPrice}</span>
                ${discount ? `<span class="discount-tag">${DOWN_ARROW}${discount}</span>` : ''}
            `;

            let btnHtml = SH.cardButton(p);


            const lastBadgeHtml = (isLast && !isOut) ? `<div class="last-item-badge">${FIRE_ICON}<span>${t.last_item}</span></div>` : '';

            infoContainer.innerHTML = `
                <div class="product-info-top">
                    <div class="price-row" onclick="goToProduct(${p.id})">${priceHtml}</div>
                    ${(!isOut && cleanOldPrice) ? `<div class="old-prices" onclick="goToProduct(${p.id})"><span class="price-old">${cleanOldPrice}</span></div>` : ''}
                    <div class="product-title" onclick="goToProduct(${p.id})">${prodName}</div>
                    <div class="product-rating">
                        <div class="rating-left" onclick="goToProduct(${p.id})">
                            <div class="rating-box"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span class="rating-num">${ratingOf(p).avg}</span></div>
                            <div class="comment-box"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="comments-num">${ratingOf(p).count}</span></div>
                        </div>
                        ${lastBadgeHtml}
                    </div>
                </div>
                <div class="card-action-container">${btnHtml}</div>
            `;
        }

        window.handleCardInfiniteScroll = handleCardInfiniteScroll;
        function handleCardInfiniteScroll(e, originalLen) {
            if (originalLen <= 1) return;
            const container = e.target;
            const slideWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const maxScroll = slideWidth * (container.children.length - 1);

            if (scrollLeft >= maxScroll - 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth;
                container.style.scrollBehavior = 'smooth';
            } else if (scrollLeft <= 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth * originalLen;
                container.style.scrollBehavior = 'smooth';
            }

            let activeIndex = Math.round(container.scrollLeft / slideWidth) - 1;
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= originalLen) activeIndex = originalLen - 1;

            const cardBox = container.closest('.product-card');
            if (cardBox) {
                const dotsBox = cardBox.querySelector('.card-dots');
                if (dotsBox) {
                    for (let i = 0; i < dotsBox.children.length; i++) {
                        dotsBox.children[i].classList.toggle('active', i === activeIndex);
                    }
                }
            }
        }

        function toggleHeart(e, id) {
            e.stopPropagation();
            if (favs.includes(id)) favs = favs.filter(i => i !== id);
            else favs.push(id);
            localStorage.setItem('fav_products', JSON.stringify(favs));
            e.currentTarget.classList.toggle('liked', favs.includes(id));
            updateBadges();
        }

        function addToCart(id) { SH.cardAdd(id); }

        function changeQty(id, delta) { SH.cardQty(id, delta); }

        function toggleNotify(id) { SH.cardNotify(id); }

        function updateBadges() {
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');
            const validFavs = favs.filter(id => dbData.products.some(p => p.id === id));
            if (validFavs.length > 0) { favBadge.textContent = validFavs.length; favBadge.classList.add('show'); }
            else favBadge.classList.remove('show');

            const totalCart = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCart > 0) { cartBadge.textContent = totalCart; cartBadge.classList.add('show'); }
            else cartBadge.classList.remove('show');
        }

        function goToProduct(id) {
            let recent = JSON.parse(localStorage.getItem('recent_products')) || [];
            recent = recent.filter(i => i !== id);
            recent.unshift(id);
            if (recent.length > 6) recent = recent.slice(0, 6);
            localStorage.setItem('recent_products', JSON.stringify(recent));
            sessionStorage.setItem('sales_scroll', window.scrollY);
            window.location.href = `product.html?id=${id}`;
        }
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        window.__shSync = function () { try { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); } catch (e) {} };
        Object.assign(window, { stockOf, needsChoice, defColor, ratingOf, discountLabel, getLocalized, getSection, isExpired, applyThemeAndTranslations, updateNavInset, goBack, setupTelegramBack, loadDB, setDB, renderAll, init, restoreSalesScroll, renderList, startCountdown, createProductCardHTML, updateCardInfoOnly, handleCardInfiniteScroll, toggleHeart, addToCart, changeQty, toggleNotify, updateBadges, goToProduct });
};

/* ##########################################################################
   SAHIFA: MAHSULOT SAHIFASI (product.html)   ->   <html data-page="product">
   ########################################################################## */
PAGES.product = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                products_title: "Mahsulotlar",
                search_placeholder: "Mahsulotlar va turkumlar izlash...",
                cart_btn: "Savatga",
                notify_btn: "Kelganda xabar qilish",
                choose_btn: "Tanlash",
                notify_active: "✓ Xabar beriladi",
                last_item: "Oxirgisi",
                out_of_stock: "Qolmadi",
                history_title: "Oxirgi qidiruvlar",
                clear_history: "Tozalash",
                no_results: "Hech narsa topilmadi...",
                search_all_label: "bo'yicha barcha natijalarni ko'rish",
                search_type: "Qidirish",
                product_type: "Mahsulot",
                category_type: "Bo'lim",
                subcat_type: "Turkum",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                products_title: "Товары",
                search_placeholder: "Поиск товаров и категорий...",
                cart_btn: "В корзину",
                notify_btn: "Сообщить о поступлении",
                choose_btn: "Выбрать",
                notify_active: "✓ Сообщим",
                last_item: "Последний",
                out_of_stock: "Нет в наличии",
                history_title: "История поиска",
                clear_history: "Очистить",
                no_results: "Ничего не найдено...",
                search_all_label: "посмотреть все результаты для",
                search_type: "Поиск",
                product_type: "Товар",
                category_type: "Раздел",
                subcat_type: "Категория",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        const categoryNames = {
            1: { uz: "Ayollar kiyimlari", ru: "Женская одежда" },
            2: { uz: "Erkaklar kiyimlari", ru: "Мужская одежда" },
            3: { uz: "Oyoq kiyimlar", ru: "Обувь" },
            4: { uz: "Aksessuarlar", ru: "Аксессуары" },
            5: { uz: "Uy buyumlari", ru: "Товары для дома" }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let allProducts = [];


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];

            let siteTheme = localStorage.getItem('site_theme') || 'light';
            if (siteTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || field['uz'] || Object.values(field)[0] || '';
            }
            return field;
        }

        function getStrictLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || '';
            }
            return '';
        }

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}

            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };

            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        let dbData = { products: [], home_sections: [] };

        /* ---------- Kiyim: variant, qoldiq va reyting yordamchilari ---------- */

        /* ==================== YORDAMCHILAR: ombor qoldig'i, rang/o'lcham tanlash kerakmi, reyting ==================== */
        function stockOf(p) { return SH.totalStock(p); }
        function needsChoice(p) { return SH.needsChoice(p); }
        function defColor(p) { return p.colors && p.colors.length ? (p.colors[0].id || null) : null; }
        let _rvSrc = null, _rvN = -1, _rvMap = {};
        function ratingOf(p) {
            let loc = []; try { loc = JSON.parse(localStorage.getItem('local_reviews')) || []; } catch (e) {}
            const src = (typeof dbData !== 'undefined' && dbData.reviews) || [];
            if (_rvSrc !== src || _rvN !== loc.length) {
                _rvSrc = src; _rvN = loc.length; _rvMap = {};
                src.concat(loc).forEach(r => { const a = _rvMap[r.product_id] || (_rvMap[r.product_id] = { s: 0, n: 0 }); a.s += Number(r.rating) || 0; a.n++; });
            }
            const a = _rvMap[p.id];
            if (a && a.n) return { avg: (a.s / a.n).toFixed(1), count: a.n };
            if (p.rating && p.comments) return { avg: Number(p.rating).toFixed(1), count: p.comments };
            return { avg: '–', count: 0 };
        }

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function setDB(d) {
            SH.setDB(d);
            dbData = Object.assign({ products: [], home_sections: [] }, d || {});
            allProducts = dbData.products || [];
            if (dbData.settings && dbData.settings.theme && !localStorage.getItem('site_theme')) {
                localStorage.setItem('site_theme', dbData.settings.theme);
            }
        }

        async function fetchAppDataAndInit() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            applyThemeAndTranslations();


            try {
                setDB(await loadDB(fresh => { setDB(fresh); initPage(); }));
            } catch (err) {
                try {
                    const res = await fetch(SH.API + '/api/products');
                    if (res.ok) setDB(await res.json());
                } catch (e) { console.error("Mahsulotlarni yuklab bo'lmadi:", e); }
            }
            initPage();
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        const SCROLL_KEY = 'products_scroll:' + location.search;
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        const urlParams = new URLSearchParams(window.location.search);

        /* ==================== KATEGORIYALAR ==================== */
        const catId = urlParams.get('cat_id') || '';
        const subName = urlParams.get('sub') || '';

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        const searchQueryParam = urlParams.get('q') || '';


        /* ==================== SAQLANGAN MA'LUMOT: saralanganlar, savat, 'kelganda xabar qil' (telefon xotirasida) ==================== */
        let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
        let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
        let notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
        let currentProductsList = [];

        /* ================= Mahsulot sahifasi: mantiq ================= */

        /* ==================== MAHSULOT SAHIFASI (rasmlar, rang, o'lcham, tavsif, o'xshash) ==================== */
        const PDP_ID = new URLSearchParams(location.search).get('id');
        const PDP = { color: null, size: null, p: null, descOpen: false, init: false };
        const IC = {
            layers: '<svg viewBox="0 0 24 24"><path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></svg>',
            globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
            sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>',
            tag: '<svg viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.2"/></svg>',
            chat: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>',
            bag: '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
            trend: '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
            ruler: '<svg viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></svg>',
            chevR: '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
            fire: '<svg viewBox="0 0 512 512"> <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/> <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/> </svg>',
            heart: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
        };
        function pdpSyncGlobals() { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); }
        function pdpSyncSel() { PDP.color = PDP.sel.color == null ? null : PDP.sel.color; PDP.size = PDP.sel.size == null ? null : PDP.sel.size; }
        function pdpPick(p) { PDP.sel = Object.assign({}, SH.firstSel(p)); pdpSyncSel(); }
        function pdpColorImgs(p) {
            let imgs = null;
            SH.axesOf(p).forEach(a => { if (imgs || a.type !== 'color') return; const v = a.values.find(x => x.id === PDP.sel[a.key]); if (v && v.images && v.images.length) imgs = v.images; });
            return imgs || [];
        }
        function pdpImages(p) {
            const own = (p.images || []).filter(Boolean), col = pdpColorImgs(p);
            const all = own.concat(col.filter(u => own.indexOf(u) < 0));
            return all.length ? all : [SH.productImage(p)];
        }
        function pdpVariantStock(p) { return SH.stockForSel(p, PDP.sel); }
        // xususiyat tanlanganda: shu birikma tugagan bo'lsa, boshqa xususiyatlar mavjud variantga o'tadi
        function pdpSet(p, key, val) {
            PDP.sel = Object.assign({}, PDP.sel, { [key]: val });
            if (SH.stockForSel(p, PDP.sel) <= 0) { const alt = SH.allSels(p).find(s => s[key] === val && SH.stockForSel(p, s) > 0); if (alt) PDP.sel = Object.assign({}, alt); }
            pdpSyncSel();
        }
        // Tanlanadigan xususiyatlar (rang, o'lcham, voltaj va h.k.): admin panelda yaratilgani shu yerda chiqadi
        function pdpOptsHtml(p) {
            const ax = SH.axesOf(p); if (!ax.length) return '';
            return `<div id="pdpOpts">` + ax.map(a => {
                const cur = a.values.find(v => v.id === PDP.sel[a.key]);
                const items = a.values.map(v => {
                    const probe = Object.assign({}, PDP.sel, { [a.key]: v.id });
                    const ok = a.type === 'color' ? SH.allSels(p).some(s => s[a.key] === v.id && SH.stockForSel(p, s) > 0) : SH.stockForSel(p, probe) > 0;
                    const on = v.id === PDP.sel[a.key];
                    if (a.type === 'color') return `<div class="pdp-col ${on ? 'on' : ''} ${ok ? '' : 'off'}" data-k="${SH.esc(a.key)}" data-v="${SH.esc(v.id)}">${v.images && v.images[0] ? `<img src="${SH.esc(v.images[0])}" alt="">` : `<i class="pdp-sw" style="background:${SH.esc(v.hex || '#ccc')}"></i>`}<span>${SH.esc(SH.loc(v.name))}</span></div>`;
                    return `<div class="pdp-size ${on ? 'on' : ''} ${ok ? '' : 'off'}" data-k="${SH.esc(a.key)}" data-v="${SH.esc(v.id)}">${SH.esc(SH.loc(v.name))}</div>`;
                }).join('');
                return `<div class="pdp-opt"><div class="pdp-opt-h"><span>${SH.esc(SH.loc(a.name))}: <b>${SH.esc(cur ? SH.loc(cur.name) : '')}</b></span>${a.key === 'size' && p.size_chart ? `<button class="pdp-link" id="pdpGuide">${IC.ruler}${SH.esc(SH.tr('p_size_guide'))}</button>` : ''}</div>
                  <div class="${a.type === 'color' ? 'pdp-colors' : 'pdp-sizes'}">${items}</div></div>`;
            }).join('') + `</div>`;
        }
        function pdpRender() {
            const root = document.getElementById('pdp');
            const p = PDP.p = SH.product(PDP_ID);
            if (!p) { root.innerHTML = allProducts.length ? `<div class="sh-empty"><h3>${SH.esc(SH.tr('not_found'))}</h3><a class="sh-btn" href="index.html">${SH.esc(SH.tr('go_home'))}</a></div>` : ''; document.getElementById('pdpBar').innerHTML = ''; document.getElementById('similarBlock').style.display = 'none'; return; }
            if (!PDP.init) { pdpPick(p); PDP.init = true; }
            document.title = SH.loc(p.name) + ' - ' + SH.shopName();
            pdpSyncGlobals();
            const imgs = pdpImages(p), R = SH.ratingOf(p), rvs = SH.reviewsFor(p.id);
            let price = SH.num(p.price), old = SH.num(p.oldPrice);
            if (typeof isWeeklyItem === 'function' && isWeeklyItem(p) && isWeeklyExpired()) { price = old || price; old = 0; }
            const disc = old > price ? Math.round((1 - price / old) * 100) : 0;
            const vs = pdpVariantStock(p), total = SH.totalStock(p);
            const colors = p.colors || [], sizes = p.sizes || [];
            const colObj = PDP.color ? SH.colorOf(p, PDP.color) : null;
            const specs = [];
            if (p.material) specs.push([IC.layers, SH.tr('p_material'), SH.loc(p.material)]);
            if (p.country) specs.push([IC.globe, SH.tr('p_country'), SH.loc(p.country)]);
            if (p.season) specs.push([IC.sun, SH.tr('p_season'), SH.loc(p.season)]);
            (p.specs || []).forEach(s => specs.push([IC.tag, SH.loc(s.k), SH.loc(s.v)]));
            (p.attrs || []).forEach(s => specs.push([IC.tag, SH.loc(s.name), SH.loc(s.value)]));
            const desc = SH.loc(p.description);
            const sold = Number(p.sold_week) || 0;
            const latest = rvs.slice(0, 3);
            root.innerHTML = `
              <div class="pdp-left"><div class="pdp-gal">
                <div class="pdp-slider" id="pdpSlider">${imgs.map((u, i) => `<div class="pdp-slide"><img src="${SH.esc(u)}" data-i="${i}" alt="" ${i ? 'loading="lazy"' : ''} decoding="async"></div>`).join('')}</div>
                <button class="pdp-heart ${SH.isFav(p.id) ? 'liked' : ''}" id="pdpHeart" aria-label="fav">${IC.heart}</button>
                ${imgs.length > 1 ? `<div class="pdp-count" id="pdpCount">1 / ${imgs.length}</div>` : ''}
                ${total <= 0 ? `<div class="pdp-flag">${SH.esc(SH.tr('p_out'))}</div>` : ''}
              </div>
              ${imgs.length > 1 ? `<div class="pdp-thumbs" id="pdpThumbs">${imgs.map((u, i) => `<img src="${SH.esc(u)}" data-i="${i}" class="${i === 0 ? 'on' : ''}" alt="">`).join('')}</div>` : ''}</div>
              <div class="pdp-right"><div class="pdp-card">
                <div class="pdp-price"><b>${SH.money(price)}</b>${disc ? `<span class="pdp-disc">-${disc}%</span><span class="pdp-old">${SH.money(old)}</span>` : ''}</div>
                ${total <= 0 ? `<div class="pdp-stock out">${SH.esc(SH.tr('p_out'))}</div>` : (vs > 0 && vs <= 3 ? `<div class="pdp-stock"><span class="pdp-fire">${IC.fire}</span>${SH.esc(SH.tr('p_left', { n: vs }))}</div>` : (vs <= 0 ? `<div class="pdp-stock out">${SH.esc(SH.tr('p_variant_out'))}</div>` : ''))}
                <h1 class="pdp-title">${SH.esc(SH.loc(p.name))}</h1>
                <div class="pdp-meta">
                  <a href="reviews.html?id=${SH.esc(p.id)}">${SH.starsHtml(R.avg, 15)}<b>${R.count ? R.avg.toFixed(1) : '–'}</b></a>
                  <a href="reviews.html?id=${SH.esc(p.id)}">${IC.chat}<span>${R.count} ${SH.esc(SH.tr('p_reviews').toLowerCase())}</span></a>
                  ${sold > 0 ? `<span class="m">${IC.bag}<span>${sold}</span></span>` : ''}
                </div>
                ${pdpOptsHtml(p)}
              </div>
              ${specs.length ? `<div class="pdp-card"><div class="pdp-h">${SH.esc(SH.tr('p_specs'))}</div><div class="pdp-specs">${specs.map(s => `<div class="pdp-spec">${s[0]}<span class="k">${SH.esc(s[1])}</span><span class="v">${SH.esc(s[2])}</span></div>`).join('')}</div></div>` : ''}
              ${desc ? `<div class="pdp-card"><div class="pdp-h">${SH.esc(SH.tr('p_about'))}</div><div class="pdp-desc ${PDP.descOpen ? 'open' : ''}" id="pdpDesc">${SH.esc(desc)}</div>
                <button class="pdp-link" id="pdpMore" style="margin-top:8px;display:none">${SH.esc(SH.tr(PDP.descOpen ? 'p_hide' : 'p_show_all'))}</button></div>` : ''}
              <div class="pdp-card" id="pdpReviews"><div class="pdp-h"><span>${SH.esc(SH.tr('p_reviews'))}</span></div>
                ${R.count ? `<div class="pdp-rv-sum"><b>${R.avg.toFixed(1)}</b>${SH.starsHtml(R.avg, 18)}<span style="color:var(--muted);font-size:13px">${SH.esc(SH.tr('r_count', { n: R.count }))}</span></div>` : `<div style="color:var(--muted);font-size:14px;padding:6px 0">${SH.esc(SH.tr('p_no_reviews'))}</div>`}
                <div id="pdpRvList">${latest.map(r => SH.reviewHtml(r, p)).join('')}</div>
                ${R.count > latest.length ? `<button class="pdp-rv-all" onclick="location.href='reviews.html?id=${SH.esc(p.id)}'">${SH.esc(SH.tr('p_all_reviews'))} (${R.count})${IC.chevR}</button>` : ''}
              </div>
              ${sold > 0 ? `<div class="pdp-card pdp-sold"><div class="ic">${IC.trend}</div><div>${SH.esc(SH.tr('p_sold_week', { n: sold }))}</div></div>` : ''}</div>`;
            // galereya
            const sl = document.getElementById('pdpSlider');
            if (PDP.jump) { const j = PDP.jump; PDP.jump = 0; requestAnimationFrame(() => { sl.scrollLeft = j * sl.clientWidth; }); }
            sl.addEventListener('scroll', () => { const i = Math.round(sl.scrollLeft / sl.clientWidth); const c = document.getElementById('pdpCount'); if (c) c.textContent = (i + 1) + ' / ' + imgs.length; document.querySelectorAll('#pdpThumbs img').forEach((t, k) => t.classList.toggle('on', k === i)); }, { passive: true });
            sl.addEventListener('click', e => { const im = e.target.closest('img[data-i]'); if (im) SH.lightbox(imgs, parseInt(im.dataset.i, 10)); });
            const th = document.getElementById('pdpThumbs'); if (th) th.addEventListener('click', e => { const im = e.target.closest('img[data-i]'); if (im) sl.scrollTo({ left: parseInt(im.dataset.i, 10) * sl.clientWidth, behavior: 'smooth' }); });
            // sevimli
            document.getElementById('pdpHeart').addEventListener('click', e => { const on = SH.toggleFav(p.id); e.currentTarget.classList.toggle('liked', on); pdpSyncGlobals(); updateBadges(); });
            // rang / o'lcham
            const po = document.getElementById('pdpOpts'); if (po) po.addEventListener('click', e => { const t = e.target.closest('[data-k]'); if (!t) return; pdpSet(p, t.getAttribute('data-k'), t.getAttribute('data-v')); const own = (p.images || []).filter(Boolean); const cc = pdpColorImgs(p).filter(u => own.indexOf(u) < 0); PDP.jump = cc.length ? own.length : 0; pdpRender(); });
            const g = document.getElementById('pdpGuide'); if (g) g.addEventListener('click', () => pdpGuide(p));
            // tavsif
            const d = document.getElementById('pdpDesc'), more = document.getElementById('pdpMore');
            if (d && more) { if (PDP.descOpen || d.scrollHeight > d.clientHeight + 2) more.style.display = ''; more.addEventListener('click', () => { PDP.descOpen = !PDP.descOpen; d.classList.toggle('open', PDP.descOpen); more.textContent = SH.tr(PDP.descOpen ? 'p_hide' : 'p_show_all'); }); }
            SH.bindReviewPhotos(document.getElementById('pdpRvList'), () => latest);
            pdpBar(p);
        }
        function pdpGuide(p) {
            const sc = p.size_chart; const cols = sc.cols || [];
            SH.sheet({ title: SH.esc(SH.tr('p_size_guide')), html: `<table class="size-table"><thead><tr><th>${SH.esc(SH.tr('p_size'))}</th>${cols.map(c => `<th>${SH.esc(typeof c === 'object' ? SH.loc(c) : c)}</th>`).join('')}</tr></thead><tbody>${Object.keys(sc.rows || {}).map(k => `<tr><td>${SH.esc(k)}</td>${(sc.rows[k] || []).map(v => `<td>${SH.esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>` });
        }
        function pdpBar(p) {
            const bar = document.getElementById('pdpBar'), vs = pdpVariantStock(p);
            let price = SH.num(p.price); if (typeof isWeeklyItem === 'function' && isWeeklyItem(p) && isWeeklyExpired()) price = SH.num(p.oldPrice) || price;
            const line = SH.cartFindSel(p.id, PDP.sel);
            const left = `<div class="bp"><small>${SH.esc(SH.tr('p_price_from'))}</small><b>${SH.money(price)}</b></div>`;
            if (vs <= 0) {
                const on = SH.getNotified().includes(p.id);
                bar.innerHTML = `${left}<div class="grow"><button class="pdp-btn ${on ? 'ok' : 'soft'}" id="pdpNotify">${SH.esc(SH.tr(on ? 'p_notified' : 'p_notify'))}</button></div>`;
                document.getElementById('pdpNotify').addEventListener('click', () => { SH.cardNotify(p.id).then(() => pdpBar(p)); });
            } else if (!line) {
                bar.innerHTML = `${left}<div class="grow"><button class="pdp-btn" id="pdpAdd">${SH.esc(SH.tr('p_add_cart'))}</button></div>`;
                document.getElementById('pdpAdd').addEventListener('click', () => { SH.cartSetSel(p.id, PDP.sel, 1); pdpSyncGlobals(); updateBadges(); pdpBar(p); });
            } else {
                bar.innerHTML = `<div class="pdp-cnt"><button id="pdpMinus">−</button><span>${line.qty || 1}</span><button id="pdpPlus" ${(line.qty || 1) >= vs ? 'disabled' : ''}>+</button></div><div class="grow"><button class="pdp-btn soft" onclick="location.href='cart.html'">${SH.esc(SH.tr('p_go_cart'))}</button></div>`;
                document.getElementById('pdpMinus').addEventListener('click', () => { SH.cartSetSel(p.id, PDP.sel, (line.qty || 1) - 1); pdpSyncGlobals(); updateBadges(); pdpBar(p); });
                document.getElementById('pdpPlus').addEventListener('click', () => { if ((line.qty || 1) >= vs) { SH.toast(SH.tr('p_max', { n: vs })); return; } SH.cartSetSel(p.id, PDP.sel, (line.qty || 1) + 1); pdpSyncGlobals(); updateBadges(); pdpBar(p); });
            }
        }
        function pdpSimilar(p) {
            const sub = SH.loc(p.subcat);
            const same = allProducts.filter(x => x.id !== p.id && SH.loc(x.subcat) === sub);
            const cat = allProducts.filter(x => x.id !== p.id && String(x.category_id) === String(p.category_id) && !same.includes(x));
            const list = same.concat(cat).slice(0, 20);
            const block = document.getElementById('similarBlock');
            if (!list.length) { block.style.display = 'none'; return; }
            block.style.display = '';
            document.getElementById('similarTitle').textContent = SH.tr('p_similar');
            currentProductsList = list; renderProducts(list);
        }
        function pdpRecent(id) { try { let r = JSON.parse(localStorage.getItem('recent_products')) || []; r = r.filter(i => String(i) !== String(id)); r.unshift(isNaN(Number(id)) ? id : Number(id)); localStorage.setItem('recent_products', JSON.stringify(r.slice(0, 6))); } catch (e) {} }

        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function initPage() {
            applyThemeAndTranslations();
            SH.setDB(dbData);
            if (!allProducts || allProducts.length === 0) return;
            pdpRender();
            if (PDP.p) { pdpRecent(PDP.p.id); pdpSimilar(PDP.p); }
            updateBadges();
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        const FIRE_ICON = `
            <svg viewBox="0 0 512 512">
                <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/>
                <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/>
            </svg>`;
        const DOWN_ARROW = `<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        const STOPWATCH = `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.5"></circle><line x1="12" y1="14" x2="12" y2="10.5"></line><line x1="9.5" y1="2.5" x2="14.5" y2="2.5"></line><line x1="12" y1="2.5" x2="12" y2="6.5"></line></svg>`;


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function discountLabel(d) {
            const m = String(d || '').match(/\d+(?:[.,]\d+)?/);
            return m ? m[0] + '%' : '';
        }

        /* ---------- Hafta aksiyasi (index bilan bir xil mantiq) ---------- */

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function getWeeklySection() {
            return (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
        }
        function isWeeklyExpired() {
            const s = getWeeklySection();
            if (!s || !s.timer_end) return false;
            return Date.now() > new Date(s.timer_end).getTime();
        }
        function isWeeklyItem(p) {
            const s = getWeeklySection();
            return !!(s && (s.product_ids || []).includes(p.id));
        }

        let weeklyTimerInterval = null;
        function startWeeklyCountdown() {
            clearInterval(weeklyTimerInterval);
            const section = getWeeklySection();
            if (!section || !section.timer_end) return;
            const endTime = new Date(section.timer_end).getTime();
            if (endTime - Date.now() < 0) return;   // aksiya allaqachon tugagan: taymer kerak emas (aks holda cheksiz qayta chizish bo'lardi)

            function tick() {
                const els = document.querySelectorAll('.card-timer-val');
                const distance = endTime - Date.now();
                if (distance < 0) {
                    clearInterval(weeklyTimerInterval);
                    renderProducts(currentProductsList);   // aksiya tugadi: nishon va chegirma olinadi
                    return;
                }
                if (els.length === 0) return;
                const h = Math.floor(distance / 3600000);
                const m = Math.floor((distance % 3600000) / 60000);
                const sec = Math.floor((distance % 60000) / 1000);
                const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                els.forEach(el => el.textContent = str);
            }
            tick();
            weeklyTimerInterval = setInterval(tick, 1000);
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function createProductCardHTML(p) {
            const isLiked = favs.includes(p.id) ? 'liked' : '';
            const pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

            let loopImages = pImages;
            if (pImages.length === 2) loopImages = [pImages[1], pImages[0], pImages[1], pImages[0]];
            else if (pImages.length > 2) loopImages = [pImages[pImages.length - 1], ...pImages, pImages[0]];

            const prodName = getLocalized(p.name);
            const weekly = isWeeklyItem(p) && !isWeeklyExpired();

            const ribbonBadge = weekly ? `<div class="badge-action-ribbon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6" fill="#7a4cf5" stroke="none"/></svg>${currentLang === 'ru' ? 'АКЦИЯ' : 'AKSIYA'}</div>` : '';
            const timerHtml = weekly ? `
                <div class="card-timer-badge">
                    ${STOPWATCH}
                    <span class="card-timer-val">00:00:00</span>
                </div>` : '';
            const originalHtml = p.badgeType === 'original' ? `
                <div class="badge-original-sm">
                    <svg viewBox="0 0 24 24"><path fill="#007a28" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"></path><path fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-4.8"></path></svg>
                    <span>ORIGINAL</span>
                </div>` : '';
            const badgesHtml = (timerHtml || originalHtml) ? `<div class="card-image-badges">${timerHtml}${originalHtml}</div>` : '';
            const dotsHtml = pImages.length > 1 ? `
                <div class="card-dots">
                    ${pImages.map((_, idx) => `<div class="card-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>` : '';

            return `
                <div class="product-card" id="product-card-${p.id}">
                    <div class="img-wrap">
                        ${ribbonBadge}
                        <button class="heart-icon-sm ${isLiked}" onclick="toggleHeart(event, ${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="product-img-box" onclick="goToProduct(${p.id})">
                            <div class="card-slider-container" onscroll="handleCardInfiniteScroll(event, ${pImages.length})">
                                ${loopImages.map(imgUrl => `<div class="card-slide"><img src="${imgUrl}" alt="${prodName}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}
                            </div>
                            ${badgesHtml}
                        </div>
                    </div>
                    ${dotsHtml}
                    <div class="product-info" id="product-info-${p.id}"></div>
                </div>
            `;
        }

        function renderProducts(list) {
            const grid = document.getElementById('productsGrid');

            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${t.no_results}</div>`;
                return;
            }

            grid.innerHTML = list.map(p => createProductCardHTML(p)).join('');
            list.forEach(p => updateCardInfoOnly(p.id));

            // Slayderlarni 2-slaydga o'rnatish (o'qish va yozish alohida: bitta layout)
            requestAnimationFrame(() => {
                const sliders = [...grid.querySelectorAll('.card-slider-container')].filter(c => c.children.length > 1);
                const widths = sliders.map(c => c.clientWidth);
                sliders.forEach(c => { c.style.scrollBehavior = 'auto'; });
                sliders.forEach((c, i) => { c.scrollLeft = widths[i]; });
                sliders.forEach(c => { c.style.scrollBehavior = 'smooth'; });
            });
            startWeeklyCountdown();
        }

        function updateCardInfoOnly(id) {
            const infoContainer = document.getElementById(`product-info-${id}`);
            if (!infoContainer) return;

            const p = allProducts.find(item => item.id === id);
            if (!p) return;

            const defaultSize = p.sizes ? p.sizes[0] : null;
            const cartItem = cart.find(item => item.id === p.id && item.selectedSize === defaultSize);
            const prodName = getLocalized(p.name);
            const stock = stockOf(p);
            const isOut = stock <= 0;
            const isLast = stock === 1;
            const isNotified = notifiedList.includes(p.id);

            const weeklyItem = isWeeklyItem(p);
            const expired = isWeeklyExpired();
            let displayPrice = p.price, displayOldPrice = p.oldPrice, displayDiscount = p.discount;
            if (weeklyItem && expired) { displayPrice = p.oldPrice || p.price; displayOldPrice = ''; displayDiscount = ''; }

            const cleanPrice = displayPrice ? String(displayPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const cleanOldPrice = displayOldPrice ? String(displayOldPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const showDiscount = (weeklyItem && !expired) && discountLabel(displayDiscount);

            const priceHtml = isOut ? `<span class="main-price out-of-stock">${t.out_of_stock}</span>` : `
                <span class="main-price">${cleanPrice}</span>
                ${showDiscount ? `<span class="discount-tag">${DOWN_ARROW}${discountLabel(displayDiscount)}</span>` : ''}
            `;

            let btnHtml = SH.cardButton(p);


            const lastBadgeHtml = (isLast && !isOut) ? `<div class="last-item-badge">${FIRE_ICON}<span>${t.last_item}</span></div>` : '';

            infoContainer.innerHTML = `
                <div class="product-info-top">
                    <div class="price-row" onclick="goToProduct(${p.id})">${priceHtml}</div>
                    ${(!isOut && cleanOldPrice) ? `<div class="old-prices" onclick="goToProduct(${p.id})"><span class="price-old">${cleanOldPrice}</span></div>` : ''}
                    <div class="product-title" onclick="goToProduct(${p.id})" title="${prodName}">${prodName}</div>
                    <div class="product-rating">
                        <div class="rating-left" onclick="goToProduct(${p.id})">
                            <div class="rating-box"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span class="rating-num">${ratingOf(p).avg}</span></div>
                            <div class="comment-box"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="comments-num">${ratingOf(p).count}</span></div>
                        </div>
                        ${lastBadgeHtml}
                    </div>
                </div>
                <div class="card-action-container card-action-container-${p.id}">${btnHtml}</div>
            `;
        }

        /* ================= QIDIRUV: index, products va categories sahifalarida bir xil ================= */

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        let searchActive = false;
        let searchBackdropTimer = null;
        let kbBaseH = 0;
        let kbShown = false;

        // Faqat sahifaning joriy tilidagi matn bo'yicha qidiriladi (ruscha sahifa = ruscha, o'zbekcha = o'zbekcha)
        function sTxt(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[currentLang] || ''; }
        function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/\s+/g, ' ').trim(); }
        function sMatch(text, q) { const tx = sNorm(text); if (!tx || !q) return false; return q.split(' ').every(w => tx.includes(w)); }
        function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function tt(key, fallback) { return (t && t[key]) || fallback; }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function getSearchHistory() { try { return JSON.parse(localStorage.getItem(window.shKey())) || []; } catch (e) { return []; } }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function saveSearchQuery(q) {
            if (!q) return;
            let history = getSearchHistory();
            history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
            history.unshift(q);
            if (history.length > 5) history = history.slice(0, 5);
            localStorage.setItem(window.shKey(), JSON.stringify(history));
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function removeHistoryItem(i) { const h = getSearchHistory(); h.splice(i, 1); localStorage.setItem(window.shKey(), JSON.stringify(h)); renderHistory(); }
        function clearAllHistory() { localStorage.removeItem(window.shKey()); closeSearchDropdown(); }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function currentVH() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
        function markSearchOpen() {
            clearTimeout(searchBackdropTimer);
            if (!searchActive) { kbBaseH = currentVH(); kbShown = false; }
            searchActive = true;
            const b = document.getElementById('searchBackdrop');
            if (b) b.classList.add('show');
        }
        function closeSearchDropdown() {
            searchActive = false;
            const dd = document.getElementById('searchDropdown');
            if (dd) dd.classList.remove('show');
            const inp = document.getElementById('searchInput');
            if (inp) inp.blur();                                   // klaviatura yopiladi
            clearTimeout(searchBackdropTimer);
            // fon biroz kechikib yopiladi, shunda bosish ostidagi kartaga o'tib ketmaydi
            searchBackdropTimer = setTimeout(() => {
                if (!searchActive) { const b = document.getElementById('searchBackdrop'); if (b) b.classList.remove('show'); }
            }, 300);
        }
        function closeSearchIfOpen() {
            const dd = document.getElementById('searchDropdown');
            if (searchActive || (dd && dd.classList.contains('show'))) { closeSearchDropdown(); return true; }
            return false;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderHistory() {
            const dd = document.getElementById('searchDropdown');
            const history = getSearchHistory();
            if (history.length === 0) { dd.classList.remove('show'); dd.innerHTML = ''; return; }
            let html = `<div class="search-header-row"><span>${tt('history_title', 'Oxirgi qidiruvlar')}</span><button class="clear-history-btn" data-act="clear">${tt('clear_history', 'Tozalash')}</button></div>`;
            history.forEach((item, i) => {
                html += `<div class="search-suggestion-item" data-act="hist" data-q="${escHtml(item)}"><div class="history-item-left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${escHtml(item)}</span></div><button class="remove-history-item" data-act="del" data-idx="${i}">&times;</button></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function renderSearchDropdown() {
            const dd = document.getElementById('searchDropdown');
            const raw = document.getElementById('searchInput').value.trim();
            if (!raw) { renderHistory(); return; }
            const src = getSearchSource();
            const sc = SH.searchCats(raw, src.cats);
            const rk = SH.searchRank(raw, src.prods, src.cats);
            const mp = rk.full.concat(rk.part);
            if (!sc.cats.length && !sc.subs.length && !mp.length) {
                dd.innerHTML = `<div class="search-suggestion-item" style="color: var(--muted); justify-content: center;">${tt('no_results', 'Hech narsa topilmadi...')}</div>`;
                dd.classList.add('show');
                return;
            }
            let html = `<div class="search-suggestion-item" data-act="all" data-q="${escHtml(raw)}"><span>"${escHtml(raw)}" ${tt('search_all_label', "bo'yicha barcha natijalarni ko'rish")}</span><span class="suggestion-type">${tt('search_type', 'Qidirish')}</span></div>`;
            sc.cats.slice(0, 3).forEach(c => {
                html += `<div class="search-suggestion-item" data-act="cat" data-cat="${escHtml(c.id)}"><span>${escHtml(SH.textIn(c.name))}</span><span class="suggestion-type">${tt('category_type', "Bo'lim")}</span></div>`;
            });
            sc.subs.slice(0, 4).forEach(x => {
                html += `<div class="search-suggestion-item" data-act="sub" data-cat="${escHtml(x.c.id)}" data-sub="${escHtml(SH.textIn(x.s.name))}"><span>${escHtml(SH.textIn(x.s.name))} <small style="color:var(--muted)">(${escHtml(SH.textIn(x.c.name))})</small></span><span class="suggestion-type">${tt('subcat_type', 'Turkum')}</span></div>`;
            });
            // Mahsulot taklifi bosilsa mahsulotga emas, shu so'z bo'yicha NATIJALAR RO'YXATIGA o'tadi
            mp.slice(0, 6).forEach(p => {
                const nm = SH.textIn(p.name);
                html += `<div class="search-suggestion-item" data-act="prod" data-id="${escHtml(p.id)}" data-q="${escHtml(nm)}"><div class="history-item-left"><span>${escHtml(nm)}</span></div><span class="suggestion-type">${tt('product_type', 'Mahsulot')}</span></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }

        function goSearch(q) {
            if (!q) return;
            saveSearchQuery(q);
            closeSearchDropdown();
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
        function pickCategory(id) {
            if (typeof onCategoryPicked === 'function') { onCategoryPicked(id); return; }
            localStorage.setItem('active_cat_id', id);
            window.location.href = `categories.html?cat_id=${encodeURIComponent(id)}`;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function showSearchHistory() { markSearchOpen(); renderSearchDropdown(); }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function handleLiveSearch() { markSearchOpen(); renderSearchDropdown(); }
        function handleSearch(e) { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) goSearch(q); } }

        document.getElementById('searchDropdown').addEventListener('click', (e) => {
            const el = e.target.closest('[data-act]');
            if (!el) return;
            e.stopPropagation();
            const d = el.dataset;
            if (d.act === 'all' || d.act === 'hist') goSearch(d.q);
            else if (d.act === 'cat') { closeSearchDropdown(); pickCategory(d.cat); }
            else if (d.act === 'sub') { window.location.href = `products.html?cat_id=${encodeURIComponent(d.cat)}&sub=${encodeURIComponent(d.sub)}`; }
            else if (d.act === 'prod') { goSearch(d.q); }
            else if (d.act === 'del') removeHistoryItem(parseInt(d.idx));
            else if (d.act === 'clear') clearAllHistory();
        });

        // Klaviatura yopilsa (orqaga surish), qidiruv ham yopiladi
        function onViewportResize() {
            if (!searchActive) return;
            const h = currentVH();
            if (h < kbBaseH - 100) kbShown = true;
            else if (kbShown && h >= kbBaseH - 60) closeSearchDropdown();
        }
        window.addEventListener('resize', onViewportResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportResize);
        window.addEventListener('DOMContentLoaded', () => {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) tg.onEvent('viewportChanged', onViewportResize);
        });

        function isInsideSearch(target) {
            return !!(target && target.closest && (target.closest('#searchBoxContainer') || target.closest('.search-box-wrapper') || target.closest('#searchDropdown')));
        }
        // Ekranga sal tegilsa yoki surilsa, qidiruv va klaviatura yopiladi
        ['touchstart', 'touchmove', 'wheel'].forEach(evName => {
            document.addEventListener(evName, (e) => {
                if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
            }, { passive: true });
        });
        document.addEventListener('click', (e) => {
            if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
        });

        function getSearchSource() { return { cats: dbData.categories || [], prods: allProducts }; }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function toggleNotify(id) { SH.cardNotify(id); }

        window.handleCardInfiniteScroll = handleCardInfiniteScroll;
        function handleCardInfiniteScroll(e, originalLen) {
            if (originalLen <= 1) return;
            const container = e.target;
            const slideWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const maxScroll = slideWidth * (container.children.length - 1);

            if (scrollLeft >= maxScroll - 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth;
                container.style.scrollBehavior = 'smooth';
            } else if (scrollLeft <= 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth * originalLen;
                container.style.scrollBehavior = 'smooth';
            }

            let activeIndex = Math.round(container.scrollLeft / slideWidth) - 1;
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= originalLen) activeIndex = originalLen - 1;

            const cardBox = container.closest('.product-card');
            const dotsBox = cardBox && cardBox.querySelector('.card-dots');
            if (dotsBox) {
                for (let i = 0; i < dotsBox.children.length; i++) {
                    dotsBox.children[i].classList.toggle('active', i === activeIndex);
                }
            }
        }

        function toggleHeart(e, id) {
            e.stopPropagation();
            if (favs.includes(id)) {
                favs = favs.filter(item => item !== id);
            } else {
                favs.push(id);
            }
            localStorage.setItem('fav_products', JSON.stringify(favs));
            const btn = e.currentTarget;
            btn.classList.toggle('liked', favs.includes(id));
            updateBadges();
        }

        function addSimilarToCart(id) { SH.cardAdd(id); }

        function changeSimilarQty(id, delta) { SH.cardQty(id, delta); }

        function updateCardActionUI(id) { updateCardInfoOnly(id); }

        function updateBadges() {
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');
            let validFavs = favs.filter(id => allProducts.some(p => p.id === id));

            if (validFavs.length > 0) {
                favBadge.textContent = validFavs.length;
                favBadge.classList.add('show');
            } else {
                favBadge.classList.remove('show');
            }

            let totalCartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCartCount > 0) {
                cartBadge.textContent = totalCartCount;
                cartBadge.classList.add('show');
            } else {
                cartBadge.classList.remove('show');
            }
        }

        function goToProduct(id) {
            sessionStorage.setItem(SCROLL_KEY, window.scrollY);
            window.location.href = `product.html?id=${id}`;
        }

        /* ---------- Orqaga: telefon tugmasi, chetdan surish va strelka bir xil ishlaydi, ilova yopilmaydi ---------- */

        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function goBack() {
            if (SH.closeTop()) return;
            if (closeSearchIfOpen()) return;                    // avval qidiruv oynasi yopiladi
            sessionStorage.removeItem(SCROLL_KEY);
            if (history.length > 1 && document.referrer) history.back();
            else window.location.href = 'index.html';           // tarix bo'sh bo'lsa ham bosh sahifaga qaytadi
        }

        function setupTelegramBack() {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (!tg) return;
            try { tg.ready(); tg.expand(); } catch (e) {}
            if (tg.BackButton) {
                tg.BackButton.offClick(goBack);
                tg.BackButton.onClick(goBack);
                tg.BackButton.show();                           // ko'rinib tursa, telefonning "orqaga" tugmasi ilovani yopmaydi
            }
            try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
        }

        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }

        // Boshqa sahifadan orqaga qaytilganda holatni yangilash (ikki marta yuklanmaydi)
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
            setupTelegramBack();
            initPage();
        });

        window.addEventListener('DOMContentLoaded', () => {
            setupTelegramBack();
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
            fetchAppDataAndInit();
        });
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        window.__shSync = function () { try { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); } catch (e) {} };
        Object.assign(window, { applyThemeAndTranslations, getLocalized, getStrictLocalized, loadDB, stockOf, needsChoice, defColor, ratingOf, setDB, fetchAppDataAndInit, pdpSyncGlobals, pdpPick, pdpImages, pdpVariantStock, pdpRender, pdpGuide, pdpBar, pdpSimilar, pdpRecent, initPage, discountLabel, getWeeklySection, isWeeklyExpired, isWeeklyItem, startWeeklyCountdown, createProductCardHTML, renderProducts, updateCardInfoOnly, sTxt, sNorm, sMatch, escHtml, tt, getSearchHistory, saveSearchQuery, removeHistoryItem, clearAllHistory, currentVH, markSearchOpen, closeSearchDropdown, closeSearchIfOpen, renderHistory, renderSearchDropdown, goSearch, pickCategory, showSearchHistory, handleLiveSearch, handleSearch, onViewportResize, isInsideSearch, getSearchSource, toggleNotify, handleCardInfiniteScroll, toggleHeart, addSimilarToCart, changeSimilarQty, updateCardActionUI, updateBadges, goToProduct, goBack, setupTelegramBack, updateNavInset });
};

/* ##########################################################################
   SAHIFA: SARALANGANLAR (heart.html)   ->   <html data-page="heart">
   ########################################################################## */
PAGES.heart = function () {


        /* ==================== MATNLAR (o'zbekcha / ruscha) va joriy til ==================== */
        const translations = {
            uz: {
                products_title: "Mahsulotlar",
                search_placeholder: "Mahsulotlar va turkumlar izlash...",
                cart_btn: "Savatga",
                notify_btn: "Kelganda xabar qilish",
                choose_btn: "Tanlash",
                fav_title: "Saralanganlar",
                fav_empty_title: "Saralanganlar mavjud emas",
                fav_empty_text: "Yoqqan mahsulotlarni yurakcha bilan belgilang.",
                rec_title: "Sizga tavsiya etamiz",
                notify_active: "✓ Xabar beriladi",
                last_item: "Oxirgisi",
                out_of_stock: "Qolmadi",
                history_title: "Oxirgi qidiruvlar",
                clear_history: "Tozalash",
                no_results: "Hech narsa topilmadi...",
                search_all_label: "bo'yicha barcha natijalarni ko'rish",
                search_type: "Qidirish",
                product_type: "Mahsulot",
                category_type: "Bo'lim",
                subcat_type: "Turkum",
                nav_home: "Bosh sahifa",
                nav_catalog: "Katalog",
                nav_cart: "Savatcha",
                nav_fav: "Saralangan",
                nav_profile: "Profil"
            },
            ru: {
                products_title: "Товары",
                search_placeholder: "Поиск товаров и категорий...",
                cart_btn: "В корзину",
                notify_btn: "Сообщить о поступлении",
                choose_btn: "Выбрать",
                fav_title: "Избранное",
                fav_empty_title: "В избранном пока пусто",
                fav_empty_text: "Отмечайте понравившиеся товары сердечком.",
                rec_title: "Рекомендуем вам",
                notify_active: "✓ Сообщим",
                last_item: "Последний",
                out_of_stock: "Нет в наличии",
                history_title: "История поиска",
                clear_history: "Очистить",
                no_results: "Ничего не найдено...",
                search_all_label: "посмотреть все результаты для",
                search_type: "Поиск",
                product_type: "Товар",
                category_type: "Раздел",
                subcat_type: "Категория",
                nav_home: "Главная",
                nav_catalog: "Каталог",
                nav_cart: "Корзина",
                nav_fav: "Избранное",
                nav_profile: "Профиль"
            }
        };

        const categoryNames = {
            1: { uz: "Ayollar kiyimlari", ru: "Женская одежда" },
            2: { uz: "Erkaklar kiyimlari", ru: "Мужская одежда" },
            3: { uz: "Oyoq kiyimlar", ru: "Обувь" },
            4: { uz: "Aksessuarlar", ru: "Аксессуары" },
            5: { uz: "Uy buyumlari", ru: "Товары для дома" }
        };

        let currentLang = localStorage.getItem('selected_lang') || 'uz';
        let t = translations[currentLang] || translations['uz'];

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        let allProducts = [];


        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function applyThemeAndTranslations() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            t = translations[currentLang] || translations['uz'];

            let siteTheme = localStorage.getItem('site_theme') || 'light';
            if (siteTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });
        }


        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function getLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || field['uz'] || Object.values(field)[0] || '';
            }
            return field;
        }

        function getStrictLocalized(field) {
            if (!field) return '';
            if (typeof field === 'object') {
                return field[currentLang] || '';
            }
            return '';
        }

        /* ---------- Ma'lumotlar: keshdan darhol, fonda yangilash ---------- */
        async function loadDB(onUpdate) {
            const DB_URL = SH.DB_URL; /* manzilni script.js boshidagi CONFIG.API_BASE da o'zgartiring */
            const KEY = new URL(DB_URL, location.href).href;
            let cache = null, cachedText = null;
            try {
                cache = await caches.open('uzum-db-v1');
                const hit = await cache.match(KEY);
                if (hit) cachedText = await hit.text();
            } catch (e) {}

            const fetchFresh = async () => {
                const res = await fetch(KEY, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                if (cache && text !== cachedText) {
                    try { await cache.put(KEY, new Response(text, { headers: { 'Content-Type': 'application/json' } })); } catch (e) {}
                }
                return text;
            };

            /* Avval YANGI bazani olamiz (6 soniyagacha); server uyquda bo'lsa, saqlangan nusxa ko'rsatiladi. */
            try {
                const fresh = await Promise.race([fetchFresh(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))]);
                return JSON.parse(fresh);
            } catch (e) {
                if (cachedText) {
                    try {
                        const data = JSON.parse(cachedText);
                        fetchFresh().then(text => { if (text !== cachedText && onUpdate) { try { onUpdate(JSON.parse(text)); } catch (x) {} } }).catch(() => {});
                        return data;
                    } catch (x) {}
                }
                return JSON.parse(await fetchFresh());
            }
        }

        let dbData = { products: [], home_sections: [] };

        /* ---------- Kiyim: variant, qoldiq va reyting yordamchilari ---------- */

        /* ==================== YORDAMCHILAR: ombor qoldig'i, rang/o'lcham tanlash kerakmi, reyting ==================== */
        function stockOf(p) { return SH.totalStock(p); }
        function needsChoice(p) { return SH.needsChoice(p); }
        function defColor(p) { return p.colors && p.colors.length ? (p.colors[0].id || null) : null; }
        let _rvSrc = null, _rvN = -1, _rvMap = {};
        function ratingOf(p) {
            let loc = []; try { loc = JSON.parse(localStorage.getItem('local_reviews')) || []; } catch (e) {}
            const src = (typeof dbData !== 'undefined' && dbData.reviews) || [];
            if (_rvSrc !== src || _rvN !== loc.length) {
                _rvSrc = src; _rvN = loc.length; _rvMap = {};
                src.concat(loc).forEach(r => { const a = _rvMap[r.product_id] || (_rvMap[r.product_id] = { s: 0, n: 0 }); a.s += Number(r.rating) || 0; a.n++; });
            }
            const a = _rvMap[p.id];
            if (a && a.n) return { avg: (a.s / a.n).toFixed(1), count: a.n };
            if (p.rating && p.comments) return { avg: Number(p.rating).toFixed(1), count: p.comments };
            return { avg: '–', count: 0 };
        }

        /* ==================== MA'LUMOTNI YUKLASH (database.json) va tilga mos matn olish ==================== */
        function setDB(d) {
            SH.setDB(d);
            dbData = Object.assign({ products: [], home_sections: [] }, d || {});
            allProducts = dbData.products || [];
            if (dbData.settings && dbData.settings.theme && !localStorage.getItem('site_theme')) {
                localStorage.setItem('site_theme', dbData.settings.theme);
            }
        }

        async function fetchAppDataAndInit() {
            currentLang = localStorage.getItem('selected_lang') || 'uz';
            applyThemeAndTranslations();


            try {
                setDB(await loadDB(fresh => { setDB(fresh); initPage(); }));
            } catch (err) {
                try {
                    const res = await fetch(SH.API + '/api/products');
                    if (res.ok) setDB(await res.json());
                } catch (e) { console.error("Mahsulotlarni yuklab bo'lmadi:", e); }
            }
            initPage();
        }


        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        const SCROLL_KEY = 'products_scroll:' + location.search;
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        const urlParams = new URLSearchParams(window.location.search);

        /* ==================== KATEGORIYALAR ==================== */
        const catId = urlParams.get('cat_id') || '';
        const subName = urlParams.get('sub') || '';

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        const searchQueryParam = urlParams.get('q') || '';


        /* ==================== SAQLANGAN MA'LUMOT: saralanganlar, savat, 'kelganda xabar qil' (telefon xotirasida) ==================== */
        let favs = JSON.parse(localStorage.getItem('fav_products')) || [];
        let cart = JSON.parse(localStorage.getItem('cart_products')) || [];
        let notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
        let currentProductsList = [];


        /* ==================== VAQT BO'YICHA FILTR va kunlik aralashtirish ==================== */
        function dayHash(id) { const d = new Date(); let h = (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) ^ (Number(id) || 0); h = Math.imul(h ^ (h >>> 15), 2246822507); return (h ^ (h >>> 13)) >>> 0; }

        /* ==================== SAHIFANI ISHGA TUSHIRISH ==================== */
        function initPage() {
            applyThemeAndTranslations();
            favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
            document.getElementById('pageTitle').textContent = t.fav_title;
            document.title = t.fav_title + ' - ' + ((dbData.settings && dbData.settings.shop_name) || '');
            if (!allProducts || allProducts.length === 0) { document.getElementById('productsGrid').innerHTML = ''; return; }
            const favList = allProducts.filter(p => favs.some(f => String(f) === String(p.id)));
            const grid = document.getElementById('productsGrid');
            if (!favList.length) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px 20px;color:var(--muted)"><svg viewBox="0 0 24 24" style="width:58px;height:58px;stroke:var(--muted);fill:none;stroke-width:1.4;opacity:.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><h3 style="color:var(--text);font-size:18px;margin:10px 0 6px">${t.fav_empty_title}</h3><p style="font-size:14px">${t.fav_empty_text}</p></div>`;
            } else renderProducts(favList, 'productsGrid');
            const rec = allProducts.filter(p => !favList.includes(p)).sort((a, b) => dayHash(a.id) - dayHash(b.id)).slice(0, 20);
            document.getElementById('recTitle').textContent = rec.length ? t.rec_title : '';
            renderProducts(rec, 'recGrid');
            updateBadges();
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        const FIRE_ICON = `
            <svg viewBox="0 0 512 512">
                <path fill="#ff3d00" d="M192 480c-70.7 0-128-57.3-128-128 0-48.4 27.2-90.3 67.2-111.4 5.3-2.8 11.8.6 12.8 6.5 5.2 32.1 23.3 60.1 48.9 78.4 4.1 2.9 9.9-.1 10.2-5.1 2-35.3-11.4-74.8-40.2-118.4C145.4 179.8 192 110.1 192 48c0-8.8 10.7-13.1 16.9-6.9 72.8 72.8 111.1 168.1 87.4 256.4 1.4-.9 2.8-1.9 4.1-2.9 33.7-25.9 55.6-67.6 55.6-114.6 0-8.8 10.7-13.1 16.9-6.9 65 65 91.1 155.1 68.3 234.9C425.4 430.4 316.5 480 192 480z"/>
                <path fill="#ffab00" d="M192 448c-53 0-96-43-96-96 0-36.3 20.4-67.7 50.4-83.6 4-2.1 8.9.5 9.6 4.9 3.9 24.1 17.5 45.1 36.7 58.8 3.1 2.2 7.4-.1 7.6-3.9 1.5-26.5-8.5-56.1-30.1-88.8C159.9 203.4 195.1 151 208 96c2.4-10.2 16.6-10.7 19.8-.7 41.5 130.8-21.7 220.7 41.4 286.7 1.1-1.2 2.3-2.5 3.4-3.8 25.3-29.4 41.6-68.5 41.6-111.8 0-8.8 10.7-13.1 16.9-6.9 48.8 48.8 68.4 116.4 51.3 176.2C365.1 411.3 283.3 448 192 448z"/>
            </svg>`;
        const DOWN_ARROW = `<svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        const STOPWATCH = `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7.5"></circle><line x1="12" y1="14" x2="12" y2="10.5"></line><line x1="9.5" y1="2.5" x2="14.5" y2="2.5"></line><line x1="12" y1="2.5" x2="12" y2="6.5"></line></svg>`;


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function discountLabel(d) {
            const m = String(d || '').match(/\d+(?:[.,]\d+)?/);
            return m ? m[0] + '%' : '';
        }

        /* ---------- Hafta aksiyasi (index bilan bir xil mantiq) ---------- */

        /* ==================== HAFTA AKSIYALARI va taymer ==================== */
        function getWeeklySection() {
            return (dbData.home_sections || []).find(s => s.id === 'weekly_discounts' && s.enabled);
        }
        function isWeeklyExpired() {
            const s = getWeeklySection();
            if (!s || !s.timer_end) return false;
            return Date.now() > new Date(s.timer_end).getTime();
        }
        function isWeeklyItem(p) {
            const s = getWeeklySection();
            return !!(s && (s.product_ids || []).includes(p.id));
        }

        let weeklyTimerInterval = null;
        function startWeeklyCountdown() {
            clearInterval(weeklyTimerInterval);
            const section = getWeeklySection();
            if (!section || !section.timer_end) return;
            const endTime = new Date(section.timer_end).getTime();
            if (endTime - Date.now() < 0) return;   // aksiya allaqachon tugagan: taymer kerak emas (aks holda cheksiz qayta chizish bo'lardi)

            function tick() {
                const els = document.querySelectorAll('.card-timer-val');
                const distance = endTime - Date.now();
                if (distance < 0) {
                    clearInterval(weeklyTimerInterval);
                    renderProducts(currentProductsList);   // aksiya tugadi: nishon va chegirma olinadi
                    return;
                }
                if (els.length === 0) return;
                const h = Math.floor(distance / 3600000);
                const m = Math.floor((distance % 3600000) / 60000);
                const sec = Math.floor((distance % 60000) / 1000);
                const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                els.forEach(el => el.textContent = str);
            }
            tick();
            weeklyTimerInterval = setInterval(tick, 1000);
        }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function createProductCardHTML(p) {
            const isLiked = favs.includes(p.id) ? 'liked' : '';
            const pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"];

            let loopImages = pImages;
            if (pImages.length === 2) loopImages = [pImages[1], pImages[0], pImages[1], pImages[0]];
            else if (pImages.length > 2) loopImages = [pImages[pImages.length - 1], ...pImages, pImages[0]];

            const prodName = getLocalized(p.name);
            const weekly = isWeeklyItem(p) && !isWeeklyExpired();

            const ribbonBadge = weekly ? `<div class="badge-action-ribbon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.6" fill="#7a4cf5" stroke="none"/></svg>${currentLang === 'ru' ? 'АКЦИЯ' : 'AKSIYA'}</div>` : '';
            const timerHtml = weekly ? `
                <div class="card-timer-badge">
                    ${STOPWATCH}
                    <span class="card-timer-val">00:00:00</span>
                </div>` : '';
            const originalHtml = p.badgeType === 'original' ? `
                <div class="badge-original-sm">
                    <svg viewBox="0 0 24 24"><path fill="#007a28" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"></path><path fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-4.8"></path></svg>
                    <span>ORIGINAL</span>
                </div>` : '';
            const badgesHtml = (timerHtml || originalHtml) ? `<div class="card-image-badges">${timerHtml}${originalHtml}</div>` : '';
            const dotsHtml = pImages.length > 1 ? `
                <div class="card-dots">
                    ${pImages.map((_, idx) => `<div class="card-dot ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                </div>` : '';

            return `
                <div class="product-card" id="product-card-${p.id}">
                    <div class="img-wrap">
                        ${ribbonBadge}
                        <button class="heart-icon-sm ${isLiked}" onclick="toggleHeart(event, ${p.id})">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="product-img-box" onclick="goToProduct(${p.id})">
                            <div class="card-slider-container" onscroll="handleCardInfiniteScroll(event, ${pImages.length})">
                                ${loopImages.map(imgUrl => `<div class="card-slide"><img src="${imgUrl}" alt="${prodName}" loading="lazy" decoding="async" draggable="false"></div>`).join('')}
                            </div>
                            ${badgesHtml}
                        </div>
                    </div>
                    ${dotsHtml}
                    <div class="product-info" id="product-info-${p.id}"></div>
                </div>
            `;
        }

        function renderProducts(list, gridId) {
            const grid = document.getElementById(gridId || 'productsGrid');

            if (list.length === 0) {
                if (!gridId || gridId === 'productsGrid') grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);">${t.no_results}</div>`; else grid.innerHTML = '';
                return;
            }

            grid.innerHTML = list.map(p => createProductCardHTML(p)).join('');
            list.forEach(p => updateCardInfoOnly(p.id));

            // Slayderlarni 2-slaydga o'rnatish (o'qish va yozish alohida: bitta layout)
            requestAnimationFrame(() => {
                const sliders = [...grid.querySelectorAll('.card-slider-container')].filter(c => c.children.length > 1);
                const widths = sliders.map(c => c.clientWidth);
                sliders.forEach(c => { c.style.scrollBehavior = 'auto'; });
                sliders.forEach((c, i) => { c.scrollLeft = widths[i]; });
                sliders.forEach(c => { c.style.scrollBehavior = 'smooth'; });
            });
            startWeeklyCountdown();
        }

        function updateCardInfoOnly(id) {
            const infoContainer = document.getElementById(`product-info-${id}`);
            if (!infoContainer) return;

            const p = allProducts.find(item => item.id === id);
            if (!p) return;

            const defaultSize = p.sizes ? p.sizes[0] : null;
            const cartItem = cart.find(item => item.id === p.id && item.selectedSize === defaultSize);
            const prodName = getLocalized(p.name);
            const stock = stockOf(p);
            const isOut = stock <= 0;
            const isLast = stock === 1;
            const isNotified = notifiedList.includes(p.id);

            const weeklyItem = isWeeklyItem(p);
            const expired = isWeeklyExpired();
            let displayPrice = p.price, displayOldPrice = p.oldPrice, displayDiscount = p.discount;
            if (weeklyItem && expired) { displayPrice = p.oldPrice || p.price; displayOldPrice = ''; displayDiscount = ''; }

            const cleanPrice = displayPrice ? String(displayPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const cleanOldPrice = displayOldPrice ? String(displayOldPrice).replace(/\s*so['‘]m/gi, '').trim() : '';
            const showDiscount = (weeklyItem && !expired) && discountLabel(displayDiscount);

            const priceHtml = isOut ? `<span class="main-price out-of-stock">${t.out_of_stock}</span>` : `
                <span class="main-price">${cleanPrice}</span>
                ${showDiscount ? `<span class="discount-tag">${DOWN_ARROW}${discountLabel(displayDiscount)}</span>` : ''}
            `;

            let btnHtml = SH.cardButton(p);


            const lastBadgeHtml = (isLast && !isOut) ? `<div class="last-item-badge">${FIRE_ICON}<span>${t.last_item}</span></div>` : '';

            infoContainer.innerHTML = `
                <div class="product-info-top">
                    <div class="price-row" onclick="goToProduct(${p.id})">${priceHtml}</div>
                    ${(!isOut && cleanOldPrice) ? `<div class="old-prices" onclick="goToProduct(${p.id})"><span class="price-old">${cleanOldPrice}</span></div>` : ''}
                    <div class="product-title" onclick="goToProduct(${p.id})" title="${prodName}">${prodName}</div>
                    <div class="product-rating">
                        <div class="rating-left" onclick="goToProduct(${p.id})">
                            <div class="rating-box"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span class="rating-num">${ratingOf(p).avg}</span></div>
                            <div class="comment-box"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg><span class="comments-num">${ratingOf(p).count}</span></div>
                        </div>
                        ${lastBadgeHtml}
                    </div>
                </div>
                <div class="card-action-container card-action-container-${p.id}">${btnHtml}</div>
            `;
        }

        /* ================= QIDIRUV: index, products va categories sahifalarida bir xil ================= */

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        let searchActive = false;
        let searchBackdropTimer = null;
        let kbBaseH = 0;
        let kbShown = false;

        // Faqat sahifaning joriy tilidagi matn bo'yicha qidiriladi (ruscha sahifa = ruscha, o'zbekcha = o'zbekcha)
        function sTxt(f) { if (!f) return ''; if (typeof f === 'string') return f; return f[currentLang] || ''; }
        function sNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[ʻʼ’‘`´ʹ]/g, "'").replace(/\s+/g, ' ').trim(); }
        function sMatch(text, q) { const tx = sNorm(text); if (!tx || !q) return false; return q.split(' ').every(w => tx.includes(w)); }
        function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
        function tt(key, fallback) { return (t && t[key]) || fallback; }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function getSearchHistory() { try { return JSON.parse(localStorage.getItem(window.shKey())) || []; } catch (e) { return []; } }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function saveSearchQuery(q) {
            if (!q) return;
            let history = getSearchHistory();
            history = history.filter(item => item.toLowerCase() !== q.toLowerCase());
            history.unshift(q);
            if (history.length > 5) history = history.slice(0, 5);
            localStorage.setItem(window.shKey(), JSON.stringify(history));
        }

        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function removeHistoryItem(i) { const h = getSearchHistory(); h.splice(i, 1); localStorage.setItem(window.shKey(), JSON.stringify(h)); renderHistory(); }
        function clearAllHistory() { localStorage.removeItem(window.shKey()); closeSearchDropdown(); }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function currentVH() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
        function markSearchOpen() {
            clearTimeout(searchBackdropTimer);
            if (!searchActive) { kbBaseH = currentVH(); kbShown = false; }
            searchActive = true;
            const b = document.getElementById('searchBackdrop');
            if (b) b.classList.add('show');
        }
        function closeSearchDropdown() {
            searchActive = false;
            const dd = document.getElementById('searchDropdown');
            if (dd) dd.classList.remove('show');
            const inp = document.getElementById('searchInput');
            if (inp) inp.blur();                                   // klaviatura yopiladi
            clearTimeout(searchBackdropTimer);
            // fon biroz kechikib yopiladi, shunda bosish ostidagi kartaga o'tib ketmaydi
            searchBackdropTimer = setTimeout(() => {
                if (!searchActive) { const b = document.getElementById('searchBackdrop'); if (b) b.classList.remove('show'); }
            }, 300);
        }
        function closeSearchIfOpen() {
            const dd = document.getElementById('searchDropdown');
            if (searchActive || (dd && dd.classList.contains('show'))) { closeSearchDropdown(); return true; }
            return false;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function renderHistory() {
            const dd = document.getElementById('searchDropdown');
            const history = getSearchHistory();
            if (history.length === 0) { dd.classList.remove('show'); dd.innerHTML = ''; return; }
            let html = `<div class="search-header-row"><span>${tt('history_title', 'Oxirgi qidiruvlar')}</span><button class="clear-history-btn" data-act="clear">${tt('clear_history', 'Tozalash')}</button></div>`;
            history.forEach((item, i) => {
                html += `<div class="search-suggestion-item" data-act="hist" data-q="${escHtml(item)}"><div class="history-item-left"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${escHtml(item)}</span></div><button class="remove-history-item" data-act="del" data-idx="${i}">&times;</button></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }


        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function renderSearchDropdown() {
            const dd = document.getElementById('searchDropdown');
            const raw = document.getElementById('searchInput').value.trim();
            if (!raw) { renderHistory(); return; }
            const src = getSearchSource();
            const sc = SH.searchCats(raw, src.cats);
            const rk = SH.searchRank(raw, src.prods, src.cats);
            const mp = rk.full.concat(rk.part);
            if (!sc.cats.length && !sc.subs.length && !mp.length) {
                dd.innerHTML = `<div class="search-suggestion-item" style="color: var(--muted); justify-content: center;">${tt('no_results', 'Hech narsa topilmadi...')}</div>`;
                dd.classList.add('show');
                return;
            }
            let html = `<div class="search-suggestion-item" data-act="all" data-q="${escHtml(raw)}"><span>"${escHtml(raw)}" ${tt('search_all_label', "bo'yicha barcha natijalarni ko'rish")}</span><span class="suggestion-type">${tt('search_type', 'Qidirish')}</span></div>`;
            sc.cats.slice(0, 3).forEach(c => {
                html += `<div class="search-suggestion-item" data-act="cat" data-cat="${escHtml(c.id)}"><span>${escHtml(SH.textIn(c.name))}</span><span class="suggestion-type">${tt('category_type', "Bo'lim")}</span></div>`;
            });
            sc.subs.slice(0, 4).forEach(x => {
                html += `<div class="search-suggestion-item" data-act="sub" data-cat="${escHtml(x.c.id)}" data-sub="${escHtml(SH.textIn(x.s.name))}"><span>${escHtml(SH.textIn(x.s.name))} <small style="color:var(--muted)">(${escHtml(SH.textIn(x.c.name))})</small></span><span class="suggestion-type">${tt('subcat_type', 'Turkum')}</span></div>`;
            });
            // Mahsulot taklifi bosilsa mahsulotga emas, shu so'z bo'yicha NATIJALAR RO'YXATIGA o'tadi
            mp.slice(0, 6).forEach(p => {
                const nm = SH.textIn(p.name);
                html += `<div class="search-suggestion-item" data-act="prod" data-id="${escHtml(p.id)}" data-q="${escHtml(nm)}"><div class="history-item-left"><span>${escHtml(nm)}</span></div><span class="suggestion-type">${tt('product_type', 'Mahsulot')}</span></div>`;
            });
            dd.innerHTML = html;
            dd.classList.add('show');
        }

        function goSearch(q) {
            if (!q) return;
            saveSearchQuery(q);
            closeSearchDropdown();
            window.location.href = `products.html?q=${encodeURIComponent(q)}`;
        }
        function pickCategory(id) {
            if (typeof onCategoryPicked === 'function') { onCategoryPicked(id); return; }
            localStorage.setItem('active_cat_id', id);
            window.location.href = `categories.html?cat_id=${encodeURIComponent(id)}`;
        }


        /* ==================== STORISLAR (yuqoridagi aylanalar va to'liq ekranli oyna) ==================== */
        function showSearchHistory() { markSearchOpen(); renderSearchDropdown(); }

        /* ==================== QIDIRUV (qidiruv qatori, takliflar, tarix) ==================== */
        function handleLiveSearch() { markSearchOpen(); renderSearchDropdown(); }
        function handleSearch(e) { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) goSearch(q); } }

        document.getElementById('searchDropdown').addEventListener('click', (e) => {
            const el = e.target.closest('[data-act]');
            if (!el) return;
            e.stopPropagation();
            const d = el.dataset;
            if (d.act === 'all' || d.act === 'hist') goSearch(d.q);
            else if (d.act === 'cat') { closeSearchDropdown(); pickCategory(d.cat); }
            else if (d.act === 'sub') { window.location.href = `products.html?cat_id=${encodeURIComponent(d.cat)}&sub=${encodeURIComponent(d.sub)}`; }
            else if (d.act === 'prod') { goSearch(d.q); }
            else if (d.act === 'del') removeHistoryItem(parseInt(d.idx));
            else if (d.act === 'clear') clearAllHistory();
        });

        // Klaviatura yopilsa (orqaga surish), qidiruv ham yopiladi
        function onViewportResize() {
            if (!searchActive) return;
            const h = currentVH();
            if (h < kbBaseH - 100) kbShown = true;
            else if (kbShown && h >= kbBaseH - 60) closeSearchDropdown();
        }
        window.addEventListener('resize', onViewportResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportResize);
        window.addEventListener('DOMContentLoaded', () => {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) tg.onEvent('viewportChanged', onViewportResize);
        });

        function isInsideSearch(target) {
            return !!(target && target.closest && (target.closest('#searchBoxContainer') || target.closest('.search-box-wrapper') || target.closest('#searchDropdown')));
        }
        // Ekranga sal tegilsa yoki surilsa, qidiruv va klaviatura yopiladi
        ['touchstart', 'touchmove', 'wheel'].forEach(evName => {
            document.addEventListener(evName, (e) => {
                if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
            }, { passive: true });
        });
        document.addEventListener('click', (e) => {
            if (searchActive && !isInsideSearch(e.target)) closeSearchDropdown();
        });

        function getSearchSource() { return { cats: dbData.categories || [], prods: allProducts }; }


        /* ==================== MAHSULOT KARTASI: chizish, yurakcha, savatga qo'shish, miqdor, 'xabar qil' ==================== */
        function toggleNotify(id) { SH.cardNotify(id); }

        window.handleCardInfiniteScroll = handleCardInfiniteScroll;
        function handleCardInfiniteScroll(e, originalLen) {
            if (originalLen <= 1) return;
            const container = e.target;
            const slideWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            const maxScroll = slideWidth * (container.children.length - 1);

            if (scrollLeft >= maxScroll - 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth;
                container.style.scrollBehavior = 'smooth';
            } else if (scrollLeft <= 5) {
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = slideWidth * originalLen;
                container.style.scrollBehavior = 'smooth';
            }

            let activeIndex = Math.round(container.scrollLeft / slideWidth) - 1;
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= originalLen) activeIndex = originalLen - 1;

            const cardBox = container.closest('.product-card');
            const dotsBox = cardBox && cardBox.querySelector('.card-dots');
            if (dotsBox) {
                for (let i = 0; i < dotsBox.children.length; i++) {
                    dotsBox.children[i].classList.toggle('active', i === activeIndex);
                }
            }
        }

        function toggleHeart(e, id) {
            e.stopPropagation();
            if (favs.includes(id)) {
                favs = favs.filter(item => item !== id);
            } else {
                favs.push(id);
            }
            localStorage.setItem('fav_products', JSON.stringify(favs));
            const btn = e.currentTarget;
            btn.classList.toggle('liked', favs.includes(id));
            updateBadges();
        }

        function addSimilarToCart(id) { SH.cardAdd(id); }

        function changeSimilarQty(id, delta) { SH.cardQty(id, delta); }

        function updateCardActionUI(id) { updateCardInfoOnly(id); }

        function updateBadges() {
            const favBadge = document.getElementById('favBadge');
            const cartBadge = document.getElementById('cartBadge');
            let validFavs = favs.filter(id => allProducts.some(p => p.id === id));

            if (validFavs.length > 0) {
                favBadge.textContent = validFavs.length;
                favBadge.classList.add('show');
            } else {
                favBadge.classList.remove('show');
            }

            let totalCartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
            if (totalCartCount > 0) {
                cartBadge.textContent = totalCartCount;
                cartBadge.classList.add('show');
            } else {
                cartBadge.classList.remove('show');
            }
        }

        function goToProduct(id) {
            sessionStorage.setItem(SCROLL_KEY, window.scrollY);
            window.location.href = `product.html?id=${id}`;
        }

        /* ---------- Orqaga: telefon tugmasi, chetdan surish va strelka bir xil ishlaydi, ilova yopilmaydi ---------- */

        /* ==================== TEMA, TILNI QO'LLASH, TELEGRAM 'ORQAGA' TUGMASI ==================== */
        function goBack() {
            if (SH.closeTop()) return;
            if (closeSearchIfOpen()) return;                    // avval qidiruv oynasi yopiladi
            sessionStorage.removeItem(SCROLL_KEY);
            if (history.length > 1 && document.referrer) history.back();
            else window.location.href = 'index.html';           // tarix bo'sh bo'lsa ham bosh sahifaga qaytadi
        }

        function setupTelegramBack() {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (!tg) return;
            try { tg.ready(); tg.expand(); } catch (e) {}
            if (tg.BackButton) {
                tg.BackButton.offClick(goBack);
                tg.BackButton.onClick(goBack);
                tg.BackButton.show();                           // ko'rinib tursa, telefonning "orqaga" tugmasi ilovani yopmaydi
            }
            try { if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {}
        }

        /* ---------- Pastki navigatsiya: 3 tugmali telefonlarda yuqoriga ko'tariladi ---------- */
        function updateNavInset() {
            const tg = window.Telegram && window.Telegram.WebApp;
            let sys = 0;
            if (tg && tg.safeAreaInset && tg.safeAreaInset.bottom) sys = tg.safeAreaInset.bottom;
            const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-inset-bottom'));
            if (!isNaN(cssVar)) sys = Math.max(sys, cssVar);

            const probe = document.createElement('div');
            probe.style.cssText = 'position:fixed;left:0;bottom:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom, 0px);';
            document.body.appendChild(probe);
            const envPx = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
            probe.remove();
            sys = Math.max(sys, envPx);

            let extra = sys >= 32 ? Math.max(0, sys - envPx) : 0;
            const manual = parseFloat(localStorage.getItem('nav_extra'));
            if (!isNaN(manual)) extra = manual;
            document.documentElement.style.setProperty('--nav-extra', extra + 'px');
        }

        // Boshqa sahifadan orqaga qaytilganda holatni yangilash (ikki marta yuklanmaydi)
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            favs = JSON.parse(localStorage.getItem('fav_products')) || [];
            cart = JSON.parse(localStorage.getItem('cart_products')) || [];
            notifiedList = JSON.parse(localStorage.getItem('notified_products')) || [];
            setupTelegramBack();
            initPage();
        });

        window.addEventListener('DOMContentLoaded', () => {
            setupTelegramBack();
            updateNavInset();
            window.addEventListener('resize', updateNavInset);
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.onEvent) {
                tg.onEvent('safeAreaChanged', updateNavInset);
                tg.onEvent('contentSafeAreaChanged', updateNavInset);
                tg.onEvent('viewportChanged', updateNavInset);
            }
            fetchAppDataAndInit();
        });
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        window.__shSync = function () { try { cart = SH.getCart(); favs = SH.getFavs(); notifiedList = SH.getNotified(); } catch (e) {} };
        Object.assign(window, { applyThemeAndTranslations, getLocalized, getStrictLocalized, loadDB, stockOf, needsChoice, defColor, ratingOf, setDB, fetchAppDataAndInit, dayHash, initPage, discountLabel, getWeeklySection, isWeeklyExpired, isWeeklyItem, startWeeklyCountdown, createProductCardHTML, renderProducts, updateCardInfoOnly, sTxt, sNorm, sMatch, escHtml, tt, getSearchHistory, saveSearchQuery, removeHistoryItem, clearAllHistory, currentVH, markSearchOpen, closeSearchDropdown, closeSearchIfOpen, renderHistory, renderSearchDropdown, goSearch, pickCategory, showSearchHistory, handleLiveSearch, handleSearch, onViewportResize, isInsideSearch, getSearchSource, toggleNotify, handleCardInfiniteScroll, toggleHeart, addSimilarToCart, changeSimilarQty, updateCardActionUI, updateBadges, goToProduct, goBack, setupTelegramBack, updateNavInset });
};

/* ##########################################################################
   SAHIFA: SAVAT (cart.html)   ->   <html data-page="cart">
   ########################################################################## */
PAGES.cart = function () {


        /* ==================== SAVAT: ro'yxat, tanlash, buyurtma berish ==================== */
        const TRASH = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
        const CHECK = '<svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>';
        let selected = null;   // tanlangan qatorlar kaliti
        let ready = false;
        const lineKey = i => SH.lineKey(i);

        function lines() {
            return SH.getCart().map(i => {
                const p = SH.product(i.id);
                const stock = p ? SH.stockForSel(p, SH.lineSel(i)) : 0;
                return { i, p, stock, ok: !!p && stock > 0, key: lineKey(i) };
            });
        }
        function render() {
            SH.applyTheme(); SH.applyI18n();
            if (!ready) return;
            const L = lines(), page = document.getElementById('page');
            if (!L.length) {
                page.innerHTML = `<div class="sh-empty"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><h3>${SH.esc(SH.tr('c_empty_title'))}</h3><p>${SH.esc(SH.tr('c_empty_text'))}</p><a class="sh-btn" href="index.html">${SH.esc(SH.tr('c_go_shop'))}</a></div>`;
                document.getElementById('bar').classList.remove('show'); SH.updateBadges(); return;
            }
            if (selected === null) selected = new Set(L.filter(x => x.ok).map(x => x.key));
            [...selected].forEach(k => { const x = L.find(y => y.key === k); if (!x || !x.ok) selected.delete(k); });
            const okLines = L.filter(x => x.ok), allOn = okLines.length > 0 && okLines.every(x => selected.has(x.key));
            const notified = SH.getNotified();
            page.innerHTML = `
              <div class="toolbar">
                <div class="sel-all" id="selAll"><div class="chk ${allOn ? 'on' : ''}">${CHECK}</div><span>${SH.esc(SH.tr('c_select_all'))}</span></div>
                <button class="del-sel" id="delSel" ${selected.size ? '' : 'disabled'}>${TRASH}<span>${SH.esc(SH.tr('c_remove'))}</span></button>
              </div>` + L.map(x => {
                const p = x.p, i = x.i;
                if (!p) return `<div class="cart-item unavail" data-k="${SH.esc(x.key)}"><div class="chk dis"></div><div class="ci-info"><div class="ci-title">#${SH.esc(i.id)}</div><div class="out-tag">${SH.esc(SH.tr('c_unavailable'))}</div><div class="ci-bottom"><span></span><button class="ci-rm" data-act="rm">${TRASH}</button></div></div></div>`;
                                const price = SH.num(p.price), old = SH.num(p.oldPrice);
                const img = SH.selImage(p, SH.lineSel(i));
                const varLine = SH.esc(SH.selLabel(p, SH.lineSel(i)));
                let bottom;
                if (!x.ok) bottom = `<span class="out-tag">${SH.esc(SH.tr('c_unavailable'))}</span><button class="notify-mini ${notified.includes(p.id) ? 'on' : ''}" data-act="notify">${SH.esc(notified.includes(p.id) ? SH.tr('p_notified') : SH.tr('p_notify'))}</button>`;
                else bottom = `<div class="qty"><button data-act="minus">−</button><span>${i.qty || 1}</span><button data-act="plus" ${(i.qty || 1) >= x.stock ? 'disabled' : ''}>+</button></div><button class="ci-rm" data-act="rm" aria-label="rm">${TRASH}</button>`;
                return `<div class="cart-item ${x.ok ? '' : 'unavail'}" data-k="${SH.esc(x.key)}">
                    <div class="chk ${selected.has(x.key) ? 'on' : ''} ${x.ok ? '' : 'dis'}" data-act="sel">${CHECK}</div>
                    <div class="ci-img" data-act="open"><img src="${SH.esc(img)}" alt=""></div>
                    <div class="ci-info">
                      <div class="ci-title" data-act="open">${SH.esc(SH.loc(p.name))}</div>
                      ${varLine ? `<div class="ci-var">${varLine}</div>` : ''}
                      <div class="ci-price">${SH.money(price)}${old > price ? `<span class="ci-old">${SH.money(old)}</span>` : ''}</div>
                      <div class="ci-bottom">${bottom}</div>
                    </div></div>`;
            }).join('');
            renderBar(L); SH.updateBadges();
        }
        function renderBar(L) {
            L = L || lines();
            const sel = L.filter(x => x.ok && selected.has(x.key));
            const total = sel.reduce((s, x) => s + SH.num(x.p.price) * (x.i.qty || 1), 0);
            const bar = document.getElementById('bar'), btn = document.getElementById('barBtn');
            bar.classList.add('show');
            document.getElementById('barLbl').textContent = SH.tr('c_total') + (sel.length ? ' · ' + SH.tr('c_selected', { n: sel.length }) : '');
            document.getElementById('barSum').textContent = SH.money(total);
            btn.textContent = SH.tr('c_checkout'); btn.classList.toggle('off', !sel.length);
        }
        function findLine(k) { return lines().find(x => x.key === k); }
        document.getElementById('page').addEventListener('click', async e => {
            if (e.target.closest('#selAll')) {
                const L = lines().filter(x => x.ok); const allOn = L.length && L.every(x => selected.has(x.key));
                selected = new Set(allOn ? [] : L.map(x => x.key)); render(); return;
            }
            if (e.target.closest('#delSel')) {
                if (!selected.size) return;
                if (!(await SH.confirmSheet(SH.tr('c_ask_delete'), SH.tr('c_remove')))) return;
                let c = SH.getCart().filter(i => !selected.has(lineKey(i))); SH.saveCart(c); selected = new Set(); render(); return;
            }
            const card = e.target.closest('.cart-item'); const act = e.target.closest('[data-act]'); if (!card || !act) return;
            const x = findLine(card.getAttribute('data-k')); if (!x) return; const a = act.getAttribute('data-act'), i = x.i;
            if (a === 'sel') { if (!x.ok) return; if (selected.has(x.key)) selected.delete(x.key); else selected.add(x.key); render(); }
            else if (a === 'open') { location.href = 'product.html?id=' + encodeURIComponent(i.id); }
            else if (a === 'rm') { SH.cartSetSel(i.id, SH.lineSel(i), 0); selected.delete(x.key); render(); }
            else if (a === 'minus') { SH.cartSetSel(i.id, SH.lineSel(i), (i.qty || 1) - 1); render(); }
            else if (a === 'plus') { if ((i.qty || 1) >= x.stock) { SH.toast(SH.tr('c_limit', { n: x.stock })); return; } SH.cartSetSel(i.id, SH.lineSel(i), (i.qty || 1) + 1); render(); }
            else if (a === 'notify') { await SH.cardNotify(x.p.id); render(); }
        });
        document.getElementById('barBtn').addEventListener('click', () => {
            const sel = lines().filter(x => x.ok && selected.has(x.key));
            if (!sel.length) { SH.toast(SH.tr('c_choose_items')); return; }
            startCheckout();
        });
        /* ---- Buyurtma jarayoni: u yarim qolsa ham (kod ko'rgani chiqib ketsa) joyidan davom etadi ---- */
        const draft = { get() { return SH.ls.get('checkout_draft', {}); }, set(p) { SH.ls.set('checkout_draft', Object.assign(draft.get(), p)); }, clear() { try { localStorage.removeItem('checkout_draft'); localStorage.removeItem('checkout_pending'); } catch (e) {} } };
        async function startCheckout() {
            draft.set({ sel: [...selected] }); SH.ls.set('checkout_pending', Date.now());
            await SH.whenReady(); await SH.whenSession();
            if (!SH.canOrder()) { SH.openLogin(() => openCheckout()); return; }
            openCheckout();
        }
        function openCheckout() {
            const sel = lines().filter(x => x.ok && selected.has(x.key));
            if (!sel.length) return;
            const u = SH.user(); let d = draft.get(); const total = sel.reduce((s, x) => s + SH.num(x.p.price) * (x.i.qty || 1), 0);
            const count = sel.reduce((s, x) => s + (x.i.qty || 1), 0);
            if (!d.geo && !d.address && SH.ls.raw('last_address', '')) { const lg = SH.ls.get('last_geo', null); if (lg) draft.set({ geo: lg }); }
            if (!d.cid) draft.set({ cid: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) });
            let phone9 = d.phone9 || (u.phone ? SH.cleanPhone(u.phone) : '');
            const verified = !!(u.phone_verified && u.phone);
            const hint = verified ? SH.tr('c_contact_hint', { p: SH.showPhone(u.phone) }) : SH.tr('c_contact_hint_email');
            const ST = SH.shopInfo() || {}; const CLICK = !!(ST.pay_click && String(ST.pay_card || '').replace(/\D/g, '').length >= 16), CASH = ST.pay_cash !== false || !CLICK;
            let pay = (d.pay === 'click' && CLICK) ? 'click' : (CASH ? 'cash' : 'click');
            const fmtCard = c => String(c || '').replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
            const IC_CASH = '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>', IC_CARD = '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
            function payHtml() {
                const chips = [];
                if (CASH) chips.push(`<button type="button" class="pay-chip ${pay === 'cash' ? 'on' : ''}" data-pay="cash">${IC_CASH}<span>${SH.esc(SH.tr('c_cash'))}</span></button>`);
                if (CLICK) chips.push(`<button type="button" class="pay-chip ${pay === 'click' ? 'on' : ''}" data-pay="click">${IC_CARD}<span>${SH.esc(SH.tr('pay_click'))}</span></button>`);
                const card = (CLICK && pay === 'click') ? `<div class="pay-card"><div class="pc-lbl">${SH.esc(SH.tr('pay_card'))}</div><div class="pc-num" id="coCardNum">${SH.esc(fmtCard(ST.pay_card))}</div>${ST.pay_holder ? `<div class="pc-lbl" style="margin-top:8px">${SH.esc(SH.tr('pay_holder'))}</div><div class="pc-hold">${SH.esc(ST.pay_holder)}</div>` : ''}<button type="button" class="pc-copy" id="coCopy">${SH.esc(SH.tr('pay_copy'))}</button><div class="pc-hint">${SH.esc(ST.pay_note || SH.tr('pay_click_hint'))}</div></div>` : '';
                return `<div class="pay-chips">${chips.join('')}</div>${card}`;
            }
            SH.sheet({
                title: SH.esc(SH.tr('c_checkout_title')),
                html: `<label class="sh-label">${SH.esc(SH.tr('c_name'))}</label><input class="sh-input" id="coName" value="${SH.esc(d.name || u.name || '')}" maxlength="40">
                  <label class="sh-label">${SH.esc(SH.tr('c_contact_phone'))}</label>
                  <div class="sh-phone"><span>+998</span><input id="coPhone" inputmode="numeric" autocomplete="tel" placeholder="90 123 45 67" value="${SH.esc(SH.fmtPhoneInput(phone9))}"></div>
                  <div class="sh-note">${SH.esc(hint)}</div>
                  <label class="sh-label">${SH.esc(SH.tr('c_address'))}</label><input class="sh-input" id="coAddr" placeholder="${SH.esc(SH.tr('c_address_ph'))}" value="${SH.esc(d.address || SH.ls.raw('last_address', ''))}" maxlength="160">
                  <button type="button" class="sh-map-btn" id="coMap"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg><span>${SH.esc(SH.tr('map_pick'))}</span></button>
                  <div class="sh-note geo-ok" id="coGeo" ${d.geo ? '' : 'hidden'}>✓ ${SH.esc(SH.tr('map_picked'))}</div>
                  <label class="sh-label">${SH.esc(SH.tr('c_comment'))}</label><input class="sh-input" id="coCom" maxlength="160" value="${SH.esc(d.comment || '')}">
                  <label class="sh-label">${SH.esc(SH.tr('c_payment'))}</label>
                  <div id="coPay">${payHtml()}</div>                  <div style="margin-top:14px"><div class="sum-line"><span>${SH.esc(SH.tr('c_items_count', { n: count }))}</span><span>${SH.money(total)}</span></div><div class="sum-line total"><span>${SH.esc(SH.tr('c_total'))}</span><span>${SH.money(total)}</span></div></div>
                  <div class="sh-err" id="coErr"></div><button class="sh-btn" id="coGo">${SH.esc(SH.tr('c_confirm'))}</button>`,
                onMount(body, close) {
                    const $ = id => body.querySelector('#' + id);
                    body.addEventListener('click', e => {
                        const pc = e.target.closest('[data-pay]'); if (pc) { pay = pc.getAttribute('data-pay'); draft.set({ pay: pay }); $('coPay').innerHTML = payHtml(); return; }
                        if (e.target.closest('#coCopy')) { const t = String(ST.pay_card || '').replace(/\D/g, ''); try { navigator.clipboard.writeText(t).then(() => SH.toast(SH.tr('pay_copied'))); } catch (x) { SH.toast(fmtCard(t)); } }
                    });
                    $('coPhone').addEventListener('input', e => { phone9 = SH.cleanPhone(e.target.value); e.target.value = SH.fmtPhoneInput(phone9); draft.set({ phone9: phone9 }); });
                    $('coName').addEventListener('input', () => draft.set({ name: $('coName').value }));
                    $('coAddr').addEventListener('input', () => draft.set({ address: $('coAddr').value }));
                    $('coMap').addEventListener('click', () => {
                        const g = draft.get();
                        SH.pickAddress({ address: $('coAddr').value.trim(), geo: g.geo }, r => { $('coAddr').value = r.address; draft.set({ address: r.address, geo: r.geo }); $('coGeo').hidden = false; });
                    });
                    $('coCom').addEventListener('input', () => draft.set({ comment: $('coCom').value }));
                    $('coGo').addEventListener('click', async () => {
                        const name = $('coName').value.trim(), addr = $('coAddr').value.trim();
                        if (!name) { $('coErr').textContent = SH.tr('c_need_name'); return; }
                        if (phone9.length !== 9) { $('coErr').textContent = SH.tr('c_need_phone'); return; }
                        if (!addr) { $('coErr').textContent = SH.tr('c_need_address'); return; }
                        // oxirgi marta qoldiqni tekshirish
                        const fresh = lines().filter(x => x.ok && selected.has(x.key));
                        if (fresh.length !== sel.length) SH.toast(SH.tr('c_removed_out'));
                        if (!fresh.length) { close(); render(); return; }
                        const b = $('coGo'); b.disabled = true; b.textContent = SH.tr('a_wait'); $('coErr').textContent = '';
                        try {
                            const items = fresh.map(x => ({ id: x.i.id, color: x.i.selectedColor, size: x.i.selectedSize, sel: x.i.sel, qty: Math.min(x.i.qty || 1, x.stock) }));
                            const order = await SH.placeOrder({ items, name, phone: SH.fullPhone(phone9), address: addr, comment: $('coCom').value.trim(), cid: draft.get().cid, geo: draft.get().geo || null, payment: pay });
                            SH.ls.setRaw('last_address', addr); SH.ls.set('last_geo', draft.get().geo || null); if (name !== u.name) { try { await SH.updateName(name); } catch (e) {} }
                            const keys = new Set(fresh.map(x => x.key)); SH.saveCart(SH.getCart().filter(i => !keys.has(lineKey(i)))); selected = null;
                            draft.clear(); close();
                            setTimeout(() => { render(); showSuccess(order); }, 260);
                        } catch (e) {
                            b.disabled = false; b.textContent = SH.tr('c_confirm');
                            if (e && e.code === 'phone_not_verified') { close(); setTimeout(() => SH.openLogin(() => openCheckout()), 260); return; }
                            if (e && e.code === 'banned') { $('coErr').textContent = SH.tr('c_banned'); return; }
                            $('coErr').textContent = (e && e.status ? e.message : SH.tr('c_order_fail'));
                        }
                    });
                }
            });
        }
        function showSuccess(order) {
            SH.sheet({ html: `<div class="ok-ic">${CHECK}</div><div class="ok-title">${SH.esc(SH.tr('c_order_ok_title'))}</div><div class="ok-text">${SH.esc(SH.tr('c_order_ok_text', { n: order.number || order.id }))}</div>
                <button class="sh-btn" id="toOrders">${SH.esc(SH.tr('c_my_orders'))}</button><button class="sh-btn ghost" id="toShop">${SH.esc(SH.tr('c_go_shop'))}</button>`,
                onMount(body) { body.querySelector('#toOrders').addEventListener('click', () => { location.href = 'profil.html#orders'; }); body.querySelector('#toShop').addEventListener('click', () => { location.href = 'index.html'; }); } });
        }
        (async function start() {
            SH.init(); render();
            const pend = SH.ls.get('checkout_pending', 0), dr = draft.get();
            if (pend && dr.sel) selected = new Set(dr.sel);   // yarim qolgan buyurtma: tanlovni tiklash
            try { SH.setDB(await SH.loadDB(fresh => { SH.setDB(fresh); render(); })); } catch (e) {}
            ready = true;
            document.title = SH.tr('c_title') + ' - ' + SH.shopName(); render();
            // Buyurtma yarim qolgan bo'lsa (masalan emailga kod olish uchun chiqib ketgan) shu joyidan davom ettiramiz
            if (pend) {
                if (Date.now() - pend > 30 * 60000) { draft.clear(); return; }
                await SH.whenReady(); await SH.whenSession();
                if (!selected || !selected.size) return;
                if (SH.canOrder()) openCheckout();
                else if (SH.hasPendingEmail() || SH.tgApp()) SH.openLogin(() => openCheckout(), { resume: true });
            }
        })();
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        Object.assign(window, { lines, render, renderBar, findLine, startCheckout, openCheckout, showSuccess });
};

/* ##########################################################################
   SAHIFA: PROFIL (profil.html)   ->   <html data-page="profil">
   ########################################################################## */
PAGES.profil = function () {


        /* ==================== PROFIL: karta, buyurtmalar, sozlamalar ==================== */
        const I = {
            orders: '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
            heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
            gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
            chev: '<svg class="chev" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
            sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>',
            moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
            globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
            user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            check: '<svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>',
            box: '<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
            star: '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
            headset: '<svg viewBox="0 0 24 24"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-5h3zM3 15a2 2 0 0 0 2 2h1v-5H3z"/><path d="M18 17v1a3 3 0 0 1-3 3h-2"/></svg>',
            bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
            phone: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
            chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            send: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
            tg: '<svg viewBox="0 0 24 24"><path d="M21.5 3.5L2.5 11l6 2.2L18 6.5l-7.4 8 .4 5.3 3-3.3 4.6 3.4z"/></svg>',
            ig: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
            pin: '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
            clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
            c1: '<svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg>',
            c2: '<svg viewBox="0 0 24 24"><polyline points="1.5 12.5 7 18 17 6"/><polyline points="9 15 12 18 22.5 6"/></svg>'
        };
        let orders = null, ordersErr = false, chatUnread = 0, chatTimer = null;
        const page = document.getElementById('page'), hdr = document.getElementById('hdr');
        const st = o => ['new', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(o.status) ? o.status : 'new';

        function contactLine(u) { return u.kind === 'tg' ? ((u.phone ? SH.showPhone(u.phone) : '') || (u.username ? '@' + u.username : '')) : (u.email || SH.showPhone(u.phone)); }
        function view() { const h = location.hash.replace('#', ''); if (h.startsWith('order=')) return { v: 'order', id: decodeURIComponent(h.slice(6)) }; return { v: h || 'main' }; }

        /* ==================== SAVAT: ro'yxat, tanlash, buyurtma berish ==================== */
        function render() {
            SH.applyTheme(); SH.applyI18n();
            const V = view(), u = SH.user();
            if (V.v === 'orders') return renderOrders();
            if (V.v === 'order') return renderOrder(V.id);
            if (V.v !== 'chat') stopChat();
            document.body.classList.toggle('chat-open', V.v === 'chat');
            document.body.classList.toggle('sub-seller', V.v === 'seller');
            if (V.v === 'settings') return renderSettings();
            if (V.v === 'myreviews') return renderMyReviews();
            if (V.v === 'seller') return renderSeller();
            if (V.v === 'chat') return renderChat();
            if (V.v === 'waiting') return renderWaiting();
            hdr.textContent = SH.tr('pr_title');
            const initial = u && u.name ? SH.esc(u.name.trim().charAt(0).toUpperCase()) : I.user;
            page.innerHTML = `<div class="pcard"><div class="pavatar">${initial}</div><div class="pinfo">
                <h3>${SH.esc(u ? (u.name || SH.tr('a_guest')) : SH.tr('a_guest'))}</h3>
                <p>${u ? SH.esc(contactLine(u)) : SH.esc(SH.tr('a_guest_text'))}</p>${u && u.phone_verified ? `<p class="verified">${I.check}${SH.esc(SH.tr('pr_phone_verified'))}</p>` : ''}</div></div>
              ${u ? (SH.isRemote() && u.kind === 'tg' && !u.phone_verified ? `<button class="sh-btn" id="verifyBtn">${SH.esc(SH.tr('pr_verify_phone'))}</button>` : '') : `<button class="sh-btn" id="loginBtn">${SH.esc(SH.tr('c_login_btn'))}</button>`}
              <div class="menu">
                <div class="mrow" data-go="orders"><div class="mic">${I.orders}</div>${SH.esc(SH.tr('pr_orders'))}${I.chev}</div>
                <div class="mrow" data-go="myreviews"><div class="mic">${I.star}</div>${SH.esc(SH.tr('my_reviews'))}${I.chev}</div>
                <div class="mrow" data-go="seller"><div class="mic">${I.headset}</div>${SH.esc(SH.tr('seller_title'))}<span class="mbadge" id="chatBadge" ${chatUnread ? '' : 'hidden'}>${chatUnread}</span>${I.chev}</div>
                <a class="mrow" href="heart.html"><div class="mic">${I.heart}</div>${SH.esc(SH.tr('pr_favs'))}${I.chev}</a>
                <div class="mrow" data-go="waiting"><div class="mic">${I.bell}</div>${SH.esc(SH.tr('notify_list'))}${I.chev}</div>
                <div class="mrow" data-go="settings"><div class="mic">${I.gear}</div>${SH.esc(SH.tr('pr_settings'))}${I.chev}</div>
              </div>`;
        }

        /* ==================== PROFIL: karta, buyurtmalar, sozlamalar ==================== */
        function renderSettings() {
            hdr.textContent = SH.tr('pr_settings'); const u = SH.user(), L = SH.lang(), T = SH.theme();
            page.innerHTML = `<div class="block"><h4>${SH.esc(SH.tr('pr_lang'))}</h4><div class="seg2" id="langSeg">
                <button data-l="uz" class="${L === 'uz' ? 'on' : ''}">${I.globe}O'zbekcha</button><button data-l="ru" class="${L === 'ru' ? 'on' : ''}">${I.globe}Русский</button></div></div>
              <div class="block"><h4>${SH.esc(SH.tr('pr_theme'))}</h4><div class="seg2" id="themeSeg">
                <button data-t="light" class="${T === 'light' ? 'on' : ''}">${I.sun}${SH.esc(SH.tr('pr_light'))}</button><button data-t="dark" class="${T === 'dark' ? 'on' : ''}">${I.moon}${SH.esc(SH.tr('pr_dark'))}</button></div></div>
              ${u ? `<div class="block"><h4>${SH.esc(SH.tr('pr_edit_name'))}</h4><input class="sh-input" id="nameInp" maxlength="40" value="${SH.esc(u.name || '')}"><button class="sh-btn soft" id="nameSave">${SH.esc(SH.tr('save'))}</button></div>` : ''}`;
        if (SH.user()) page.insertAdjacentHTML('beforeend', `<div class="block"><h4>${SH.esc(SH.tr('a_account'))}</h4><div class="mrow danger" id="logoutRow"><div class="mic">${I.logout}</div>${SH.esc(SH.tr('a_switch'))}</div></div>`);
        }
        async function ensureOrders(force) {
            if (orders && !force) return;
            if (!SH.user()) { orders = []; return; }
            try { orders = await SH.listOrders(); ordersErr = false; } catch (e) { orders = []; ordersErr = true; }
        }
        async function renderOrders() {
            hdr.textContent = SH.tr('pr_orders');
            if (!SH.user()) { page.innerHTML = `<div class="sh-empty"><h3>${SH.esc(SH.tr('c_need_login_title'))}</h3><p>${SH.esc(SH.tr('c_need_login_text'))}</p><button class="sh-btn" id="loginBtn">${SH.esc(SH.tr('c_login_btn'))}</button></div>`; return; }
            if (!orders) { page.innerHTML = `<div class="sh-empty"><p>${SH.esc(SH.tr('loading'))}</p></div>`; await ensureOrders(); if (view().v !== 'orders') return; }
            if (ordersErr) { page.innerHTML = `<div class="sh-empty"><p>${SH.esc(SH.tr('error_generic'))}</p></div>`; return; }
            if (!orders.length) { page.innerHTML = `<div class="sh-empty">${I.box}<h3>${SH.esc(SH.tr('pr_orders_empty'))}</h3><p>${SH.esc(SH.tr('pr_orders_empty_text'))}</p><a class="sh-btn" href="index.html">${SH.esc(SH.tr('c_go_shop'))}</a></div>`; return; }
            page.innerHTML = (orders.some(o => st(o) === 'delivered') ? `<div class="hint">${SH.esc(SH.tr('pr_rate_hint'))}</div>` : '') + orders.map(o => {
                const th = (o.items || []).slice(0, 4).map(i => `<img src="${SH.esc(i.image)}" alt="">`).join('') + ((o.items || []).length > 4 ? `<div class="omore">+${o.items.length - 4}</div>` : '');
                return `<div class="ocard" data-oid="${SH.esc(o.id)}"><div class="ohead"><span class="ono">${SH.esc(SH.tr('pr_order_no', { n: o.number || o.id }))}</span><span class="chip ${st(o)}">${SH.esc(SH.tr('st_' + st(o)))}</span></div>
                  <div class="odate">${SH.esc(SH.fmtDate(String(o.created).slice(0, 10)))}</div><div class="othumbs">${th}</div><div class="ototal"><span>${SH.esc(SH.tr('pr_total'))}</span><span>${SH.money(o.total)}</span></div></div>`;
            }).join('');
        }
        async function renderOrder(id) {
            hdr.textContent = SH.tr('pr_orders'); await ensureOrders();
            const o = (orders || []).find(x => String(x.id) === String(id)); if (!o) { page.innerHTML = `<div class="sh-empty"><p>${SH.esc(SH.tr('not_found'))}</p></div>`; return; }
            hdr.textContent = SH.tr('pr_order_no', { n: o.number || o.id });
            const delivered = st(o) === 'delivered';
            page.innerHTML = `<div class="block"><div class="ohead"><span class="ono">${SH.esc(SH.tr('pr_order_no', { n: o.number || o.id }))}</span><span class="chip ${st(o)}">${SH.esc(SH.tr('st_' + st(o)))}</span></div>
              ${(o.items || []).map((i, idx) => {
                const p = SH.product(i.product_id) || {};
                const col = i.color ? SH.colorOf(p, i.color) : null, cname = col ? SH.loc(col.name) : (i.color_name ? SH.loc(i.color_name) : '');
                const v = (i.opts && i.opts.length) ? i.opts.map(o => SH.esc(SH.loc(o.name)) + ': ' + SH.esc(SH.loc(o.value))).join(' · ') : [cname ? SH.tr('p_color') + ': ' + SH.esc(cname) : '', i.size != null ? SH.tr('p_size') + ': ' + SH.esc(i.size) : ''].filter(Boolean).join(' · ');
                let act = '';
                if (delivered) act = SH.isReviewed(o.id, i.product_id, i) ? `<span class="oi-done">${SH.esc(SH.tr('pr_reviewed'))}</span>` : `<button class="oi-btn" data-rv="${idx}">${SH.esc(SH.tr('pr_review_btn'))}</button>`;
                return `<div class="oitem"><img src="${SH.esc(i.image)}" alt="" data-p="${SH.esc(i.product_id)}"><div class="oi-info"><div class="oi-name">${SH.esc(SH.loc(i.name))}</div>${v ? `<div class="oi-var">${v}</div>` : ''}<div class="oi-price">${SH.money(i.price)} × ${i.qty}</div>${act}</div></div>`;
              }).join('')}</div>
              <div class="block"><div class="kv"><span>${SH.esc(SH.tr('pr_date'))}</span><span>${SH.esc(SH.fmtDate(String(o.created).slice(0, 10)))}</span></div>
                <div class="kv"><span>${SH.esc(SH.tr('pr_address'))}</span><span>${SH.esc(o.address || '')}${o.geo ? ` <a class="geo-link" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${SH.esc(o.geo.lat)},${SH.esc(o.geo.lng)}">${I.pin}</a>` : ''}</span></div>
                <div class="kv"><span>${SH.esc(SH.tr('c_payment'))}</span><span>${SH.esc(SH.tr(o.payment === 'click' ? 'pay_click' : 'c_cash'))}</span></div>
                <div class="kv"><span>${SH.esc(SH.tr('pr_total'))}</span><span>${SH.money(o.total)}</span></div></div>
              ${(!SH.isRemote() && !delivered) ? `<button class="sh-btn ghost demo-btn" id="demoDeliver">${SH.esc(SH.tr('pr_demo_deliver'))}</button>` : ''}`;
        }

        const imgSrc = u => /^(data:|https?:)/.test(String(u || '')) ? u : (String(u || '').charAt(0) === '/' ? SH.API_BASE + u : u);
        function needLoginBlock() { page.innerHTML = `<div class="sh-empty"><h3>${SH.esc(SH.tr('c_need_login_title'))}</h3><p>${SH.esc(SH.tr('c_need_login_text'))}</p><button class="sh-btn" id="loginBtn">${SH.esc(SH.tr('c_login_btn'))}</button></div>`; }

        /* ---------- Sharhlarim: tahrirlash va o'chirish ---------- */
        async function renderMyReviews() {
            hdr.textContent = SH.tr('my_reviews');
            if (!SH.user()) { needLoginBlock(); return; }
            page.innerHTML = `<div class="sh-empty"><p>${SH.esc(SH.tr('loading'))}</p></div>`;
            let list = []; try { list = await SH.myReviews(); } catch (e) { page.innerHTML = `<div class="sh-empty"><p>${SH.esc(SH.tr('error_generic'))}</p></div>`; return; }
            if (view().v !== 'myreviews') return;
            if (!list.length) { page.innerHTML = `<div class="sh-empty">${I.star}<h3>${SH.esc(SH.tr('my_reviews_empty'))}</h3><p>${SH.esc(SH.tr('my_reviews_empty_text'))}</p></div>`; return; }
            page.innerHTML = list.map(r => {
                const p = SH.product(r.product_id) || {}, img = (p.images && p.images[0]) || SH.productImage(p);
                return `<div class="myrv" data-rid="${SH.esc(r.id)}"><div class="myrv-head"><img src="${SH.esc(img)}" alt="" data-p="${SH.esc(r.product_id)}"><div class="myrv-info"><div class="myrv-name">${SH.esc(SH.loc(p.name) || '—')}</div>
                    <div class="myrv-stars">${SH.starsHtml(r.rating, 16)}<span>${SH.esc(SH.fmtDate(String(r.date || '').slice(0, 10)))}${r.edited ? ' · ' + SH.esc(SH.tr('r_edited')) : ''}</span></div></div></div>
                  ${r.text ? `<div class="myrv-text">${SH.esc(r.text)}</div>` : ''}
                  ${(r.photos || []).length ? `<div class="myrv-photos">${r.photos.map((u, k) => `<img src="${SH.esc(imgSrc(u))}" alt="" data-lb="${k}">`).join('')}</div>` : ''}
                  <div class="myrv-act"><button class="oi-btn" data-edit="${SH.esc(r.id)}">${SH.esc(SH.tr('edit'))}</button><button class="oi-btn danger" data-del="${SH.esc(r.id)}">${SH.esc(SH.tr('del'))}</button></div></div>`;
            }).join('');
            page.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => { const r = list.find(x => String(x.id) === btn.getAttribute('data-edit')); if (r) SH.editReviewSheet(Object.assign({}, r, { photos: (r.photos || []) }), () => renderMyReviews()); }));
            page.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
                if (!(await SH.confirmSheet(SH.tr('r_del_ask'), SH.tr('del')))) return;
                try { await SH.deleteReview(btn.getAttribute('data-del')); SH.toast(SH.tr('r_deleted')); renderMyReviews(); } catch (e) { SH.toast(SH.tr('error_generic')); }
            }));
            page.querySelectorAll('img[data-lb]').forEach(im => im.addEventListener('click', () => { const card = im.closest('.myrv'); const r = list.find(x => String(x.id) === card.getAttribute('data-rid')); SH.lightbox((r.photos || []).map(imgSrc), parseInt(im.getAttribute('data-lb'), 10) || 0); }));
        }

        /* ---------- Sotuvchiga murojaat ---------- */
        function renderSeller() {
            hdr.textContent = SH.tr('seller_title'); const s = SH.shopInfo(), tg = SH.tgHref(s.tg_username), ig = SH.igHref(s.instagram);
            const btn = (cls, icon, label, attrs) => `<a class="sl-btn ${cls}" ${attrs}>${icon}<span>${SH.esc(label)}</span></a>`;
            page.innerHTML = `<div class="block sl-card"><div class="sl-ava">${I.headset}</div><h3>${SH.esc(SH.shopName())}</h3><p>${SH.esc(SH.tr('seller_text'))}</p>
                <div class="sl-btns">${btn('main', I.chat, SH.tr('seller_write'), 'data-go="chat" href="#chat"')}
                  ${s.phone ? btn('call', I.phone, SH.tr('seller_call') + ' ' + s.phone, 'href="' + SH.esc(SH.telHref(s.phone)) + '"') : ''}
                  ${tg ? btn('', I.tg, SH.tr('seller_tg'), 'target="_blank" rel="noopener" href="' + SH.esc(tg) + '"') : ''}
                  ${ig ? btn('', I.ig, SH.tr('seller_ig'), 'target="_blank" rel="noopener" href="' + SH.esc(ig) + '"') : ''}</div></div>
              ${(s.phone || s.work_hours || s.address) ? `<div class="block">${s.phone ? `<div class="kv"><span>${I.phone}${SH.esc(SH.tr('seller_phone'))}</span><span>${SH.esc(s.phone)}</span></div>` : ''}
                ${s.work_hours ? `<div class="kv"><span>${I.clock}${SH.esc(SH.tr('seller_hours'))}</span><span>${SH.esc(s.work_hours)}</span></div>` : ''}
                ${s.address ? `<div class="kv"><span>${I.pin}${SH.esc(SH.tr('seller_addr'))}</span><span>${SH.esc(s.address)}</span></div>` : ''}</div>` : ''}`;
        }

        /* ---------- Chat (sayt <-> admin). Xabarlar Telegram botga yuborilmaydi ---------- */
        let chatCleanup = null;
        function stopChat() { if (chatTimer) { clearInterval(chatTimer); chatTimer = null; } if (chatCleanup) { try { chatCleanup(); } catch (e) {} chatCleanup = null; } document.body.classList.remove('kb-open'); }
        const chatSig = r => (r.msgs || []).map(m => m.id + ':' + (m.read ? 1 : 0) + ':' + (m.edited || 0)).join(',') + '|' + ((r.admin && r.admin.online) ? 1 : 0);
        async function renderChat() {
            hdr.textContent = SH.tr('chat_title');
            if (!SH.user()) { needLoginBlock(); return; }
            if (!SH.isRemote()) { page.innerHTML = `<div class="sh-empty">${I.chat}<p>${SH.esc(SH.tr('error_generic'))}</p></div>`; return; }
            stopChat();
            let reply = null, editing = null, last = '', busy = false, rec = null, chatLast = null, micStream = null;
            const CI = {
                clip: '<svg viewBox="0 0 24 24"><path d="M21.4 11.1l-9.2 9.2a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/></svg>',
                mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>',
                more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>',
                reply: '<svg viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>',
                copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
                edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
                trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>'
            };
            page.innerHTML = `<div class="chat-wrap" id="chatWrap"><div class="chat-head"><div class="chat-ava">${I.headset}</div><div><b>${SH.esc(SH.shopName())}</b><small id="chatStat"></small></div></div>
                <div class="chat-list" id="chatList"></div><div class="chat-rp" id="chatRp" hidden></div>
                <div class="chat-rec" id="chatRec" hidden><i class="rec-dot"></i><span id="recT">0:00</span><em>${SH.esc(SH.tr('chat_rec'))}</em><button id="recCancel" aria-label="x">×</button></div>
                <div class="chat-input" id="chatIn"><label class="chat-clip" id="chatClip" aria-label="${SH.esc(SH.tr('chat_attach'))}">${CI.clip}<input type="file" id="chatFile" accept="image/*,video/*" hidden></label><textarea id="chatTx" rows="1" maxlength="1500" placeholder="${SH.esc(SH.tr('chat_ph'))}"></textarea><button id="chatSend" aria-label="${SH.esc(SH.tr('chat_send'))}">${CI.mic}</button></div></div>`;
            const $ = id => document.getElementById(id), list = $('chatList'), tx = $('chatTx'), wrap = $('chatWrap');
            const tick = m => m.from === 'u' ? `<span class="tick ${m.read ? 'read' : ''}">${m.read ? I.c2 : I.c1}</span>` : '';
            const mediaHtml = m => { if (!m.media) return ''; const u = SH.esc(SH.chatApi.abs(m.media.url));
                if (m.media.type === 'image') return `<img class="cm-img" src="${u}" alt="" data-lb="1" loading="lazy">`;
                if (m.media.type === 'video') return `<video class="cm-vid" src="${u}#t=0.1" controls playsinline preload="metadata"></video>`;
                return `<audio class="cm-aud" src="${u}" controls preload="metadata"></audio>`; };
            const prevText = m => m.text ? String(m.text).slice(0, 90) : (m.media ? SH.tr(m.media.type === 'image' ? 'chat_photo' : m.media.type === 'video' ? 'chat_video' : 'chat_voice') : '');
            const mainBtn = () => { const has = tx.value.trim().length > 0 || editing || rec; $('chatSend').innerHTML = has ? I.send : CI.mic; $('chatSend').classList.toggle('is-mic', !has); };
            /* --- klaviatura: oyna klaviatura ustida turadi, yopilganda pastga tushadi --- */
            const vv = window.visualViewport; let wasEnd = true;
            function fitChat() {
                if (!document.body.contains(wrap)) return; const tgw = window.Telegram && window.Telegram.WebApp;
                // Telegram ustki tugmalari (Orqaga, ⋮, ⌄) ostiga tushmasin: real qiymat yo'q bo'lsa mobil ilovada 56px
                const tgI = tgw ? (((tgw.contentSafeAreaInset && tgw.contentSafeAreaInset.top) || 0) + ((tgw.safeAreaInset && tgw.safeAreaInset.top) || 0) || (/android|ios/.test(tgw.platform || '') ? 56 : 0)) : 0;
                // Klaviatura faqat yozish maydoni fokusda bo'lganda hisobga olinadi (Telegram viewportHeight noto'g'ri farq berishi mumkin)
                const vvH = vv ? vv.height : window.innerHeight, ot = vv ? vv.offsetTop : 0;
                const kb = document.activeElement === tx;
                let vh = kb ? Math.min(vvH, tgw && tgw.viewportHeight ? tgw.viewportHeight : Infinity) : vvH;
                // Klaviatura balandligi WebView'da o'zgarmasa: fokusda yozish oynasi ekranning yarmida turadi
                const stableH = tgw && tgw.viewportStableHeight ? tgw.viewportStableHeight : window.innerHeight;
                if (kb && vh > stableH * 0.9) vh = Math.round(stableH * 0.5);
                document.body.classList.toggle('kb-open', !!kb);
                const top = tgI; wrap.style.top = Math.max(0, ot + top) + 'px'; wrap.style.height = Math.max(200, vh - top) + 'px';
                if (kb || wasEnd) list.scrollTop = list.scrollHeight;
            }
            list.addEventListener('scroll', () => { wasEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 80; }, { passive: true });
            if (vv) { vv.addEventListener('resize', fitChat); vv.addEventListener('scroll', fitChat); }
            window.addEventListener('resize', fitChat); tx.addEventListener('focus', () => { fitChat(); setTimeout(fitChat, 350); }); tx.addEventListener('blur', () => setTimeout(fitChat, 150));
            const tgw0 = window.Telegram && window.Telegram.WebApp; if (tgw0 && tgw0.onEvent) { try { tgw0.onEvent('viewportChanged', fitChat); } catch (e) {} }
            chatCleanup = () => { try { if (tgw0 && tgw0.offEvent) tgw0.offEvent('viewportChanged', fitChat); } catch (e) {} if (vv) { vv.removeEventListener('resize', fitChat); vv.removeEventListener('scroll', fitChat); } window.removeEventListener('resize', fitChat); if (rec) recStop(true); if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; } };
            fitChat();
            function paint(r, force) {
                const sig = chatSig(r); const st = $('chatStat'); if (!st) return;
                const a = r.admin || {};
                st.className = a.online ? 'on' : ''; st.textContent = a.online ? SH.tr('chat_online') : (a.seen ? SH.tr('chat_seen', { t: SH.fmtAgo(a.seen) }) : SH.tr('chat_offline'));
                if (sig === last && !force) return; last = sig;
                const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
                list.innerHTML = (r.msgs || []).length ? r.msgs.map(m => `<div class="cm ${m.from === 'u' ? 'me' : 'them'}" data-id="${m.id}">
                    <button class="cm-more" aria-label="menu">${CI.more}</button>
                    ${m.rt ? `<div class="cm-q" data-goto="${m.rt.id}"><b>${SH.esc(SH.tr(m.rt.from === 'u' ? 'chat_you' : 'chat_seller'))}</b>${SH.esc(m.rt.text || '')}</div>` : ''}
                    ${mediaHtml(m)}${m.text ? `<div class="cm-t">${SH.esc(m.text)}</div>` : ''}
                    <div class="cm-m">${m.src === 'bot' && m.from === 'u' ? `<em>${SH.esc(SH.tr('chat_from_bot'))}</em>` : ''}${m.edited ? `<em>${SH.esc(SH.tr('chat_edited'))}</em>` : ''}<time>${SH.esc(SH.fmtClock(m.ts))}</time>${tick(m)}</div></div>`).join('')
                    : `<div class="chat-empty">${I.chat}<p>${SH.esc(SH.tr('chat_empty'))}</p></div>`;
                if (atEnd || force) list.scrollTop = list.scrollHeight;
            }
            async function load(force) { try { const r = await SH.chatApi.list(); chatLast = r; paint(r, force); chatUnread = 0; } catch (e) { if (e && e.status === 401) { stopChat(); needLoginBlock(); } } }
            const msgOf = el => (chatLast ? chatLast.msgs : []).find(x => String(x.id) === el.getAttribute('data-id'));
            /* --- javob / tahrirlash paneli --- */
            function bar() {
                const rp = $('chatRp'); const m = editing || reply; rp.hidden = !m; if (!m) { mainBtn(); return; }
                rp.innerHTML = `<div><b>${SH.esc(SH.tr(editing ? 'chat_editing' : (m.from === 'u' ? 'chat_you' : 'chat_seller')))}</b><span>${SH.esc(prevText(m))}</span></div><button aria-label="x">×</button>`;
                rp.querySelector('button').onclick = () => { if (editing) { editing = null; tx.value = ''; tx.style.height = ''; } reply = null; bar(); }; mainBtn();
            }
            function setReply(m) { editing = null; reply = m; bar(); tx.focus(); }
            function startEdit(m) { reply = null; editing = m; tx.value = m.text || ''; bar(); tx.focus(); tx.style.height = 'auto'; tx.style.height = Math.min(tx.scrollHeight, 120) + 'px'; }
            function menu(m) {
                const own = m.from === 'u' && m.src !== 'bot';
                const s = SH.sheet({ html: `<div class="cm-menu"><button data-a="reply">${CI.reply}${SH.esc(SH.tr('chat_reply_m'))}</button>${m.text ? `<button data-a="copy">${CI.copy}${SH.esc(SH.tr('chat_copy'))}</button>` : ''}${own && m.text ? `<button data-a="edit">${CI.edit}${SH.esc(SH.tr('chat_edit'))}</button>` : ''}${own ? `<button data-a="del" class="danger">${CI.trash}${SH.esc(SH.tr('chat_del'))}</button>` : ''}</div>`,
                    onMount(body, close) { body.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (!b) return; const a = b.getAttribute('data-a'); close();
                        if (a === 'reply') setTimeout(() => setReply(m), 260);
                        else if (a === 'copy') { try { await navigator.clipboard.writeText(m.text); SH.toast(SH.tr('chat_copied')); } catch (x) {} }
                        else if (a === 'edit') setTimeout(() => startEdit(m), 260);
                        else if (a === 'del') { setTimeout(async () => { if (await SH.confirmSheet(SH.tr('chat_del_ask'), SH.tr('chat_del'))) { try { await SH.chatApi.del(m.id); if (reply && reply.id === m.id) { reply = null; bar(); } await load(true); } catch (er) { SH.toast(SH.tr('chat_fail')); } } }, 260); } }); } });
            }
            /* --- surib javob berish (Telegramdagidek) + uzoq bosish / ⋯ menyu --- */
            let g = null;
            list.addEventListener('pointerdown', e => {
                const c = e.target.closest('.cm'); if (!c || e.target.closest('video,audio,.cm-more')) return;
                g = { c: c, x: e.clientX, y: e.clientY, dx: 0, drag: false, id: e.pointerId, lp: setTimeout(() => { if (g && !g.drag) { const m = msgOf(c); g.done = true; if (m) { if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {} menu(m); } } }, 520) };
            });
            list.addEventListener('pointermove', e => {
                if (!g || g.done) return; const dx = e.clientX - g.x, dy = e.clientY - g.y;
                if (!g.drag) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { clearTimeout(g.lp); g = null; return; } if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.4) { g.drag = true; clearTimeout(g.lp); try { list.setPointerCapture(e.pointerId); } catch (x) {} g.c.classList.add('swiping'); } else return; }
                g.dx = dx; const t = Math.max(-84, Math.min(84, dx)); g.c.style.transform = 'translateX(' + t + 'px)'; g.c.classList.toggle('armed', Math.abs(dx) >= 56);
            });
            const endG = e => {
                if (!g) return; clearTimeout(g.lp); const c = g.c, was = g;
                if (was.drag) { const arm = Math.abs(was.dx) >= 56; c.style.transition = 'transform .18s'; c.style.transform = ''; c.classList.remove('armed', 'swiping'); setTimeout(() => { c.style.transition = ''; }, 200); if (arm) { const m = msgOf(c); if (m) { if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) {} setReply(m); } } }
                g = null;
            };
            list.addEventListener('pointerup', endG); list.addEventListener('pointercancel', endG);
            list.addEventListener('contextmenu', e => { const c = e.target.closest('.cm'); if (c) { e.preventDefault(); const m = msgOf(c); if (m) menu(m); } });
            list.addEventListener('click', e => {
                const more = e.target.closest('.cm-more'); if (more) { const m = msgOf(more.closest('.cm')); if (m) menu(m); return; }
                const im = e.target.closest('.cm-img'); if (im) { SH.lightbox([im.getAttribute('src')], 0); return; }
                const q = e.target.closest('.cm-q'); if (q) { const el = list.querySelector('.cm[data-id="' + q.getAttribute('data-goto') + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } }
            });
            /* --- yuborish --- */
            async function send() {
                if (busy) return; const text = tx.value.trim();
                if (editing) { if (!text) return; busy = true; const m = editing; editing = null; tx.value = ''; tx.style.height = ''; bar();
                    try { await SH.chatApi.edit(m.id, text); await load(true); } catch (e) { SH.toast(SH.tr('chat_fail')); } busy = false; return; }
                if (rec) { recStop(rec.cancel); return; }
                if (!text) return;
                busy = true; tx.value = ''; tx.style.height = ''; const rt = reply ? reply.id : null; reply = null; bar(); mainBtn();
                try { await SH.chatApi.send(text, rt); await load(true); } catch (e) { tx.value = text; mainBtn(); SH.toast(e && e.status === 429 ? SH.tr('error_generic') : SH.tr('chat_fail')); }
                busy = false;
            }
            async function sendMedia(blob, mime, type, dur) {
                busy = true; const rt = reply ? reply.id : null; SH.toast(SH.tr('chat_sending'));
                try { const up = await SH.chatApi.upload(blob, mime); await SH.chatApi.send(tx.value.trim(), rt, { type: up.type || type, url: up.url, dur: dur || undefined }); tx.value = ''; tx.style.height = ''; reply = null; bar(); await load(true); }
                catch (e) { SH.toast(e && e.message && e.status ? e.message : SH.tr('chat_fail')); }
                busy = false; mainBtn();
            }
            $('chatSend').addEventListener('click', send);
            // Telegramdagi kabi: mikrofonni BOSIB TURING - yozadi; QO'YIB YUBORING - jo'natadi; CHAPGA SURING - bekor qiladi
            const sbtn = $('chatSend');
            sbtn.addEventListener('pointerdown', e => {
                if (tx.value.trim() || editing || rec || busy || e.button > 0) return;
                e.preventDefault(); micDown = { x: e.clientX, cancel: false, up: false };
                try { sbtn.setPointerCapture(e.pointerId); } catch (x) {}
                recStart();
            });
            sbtn.addEventListener('pointermove', e => {
                if (!micDown || micDown.up) return; const c = e.clientX - micDown.x < -60; micDown.cancel = c;
                if (rec) { rec.cancel = c; const em = $('chatRec').querySelector('em'); if (em) em.innerHTML = recHint(c); }
            });
            sbtn.addEventListener('contextmenu', e => e.preventDefault());
            sbtn.addEventListener('pointerup', () => { if (micDown && !micDown.up) { micDown.up = true; if (rec) recStop(micDown.cancel); } });
            sbtn.addEventListener('pointercancel', () => { if (micDown && !micDown.up) { micDown.up = true; micDown.cancel = true; if (rec) recStop(true); } });
            tx.addEventListener('input', () => { tx.style.height = 'auto'; tx.style.height = Math.min(tx.scrollHeight, 120) + 'px'; mainBtn(); });
            tx.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 768px)').matches) { e.preventDefault(); send(); } });
            /* --- rasm / video --- */
            function shrink(file) { return new Promise(resolve => { const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1280 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => resolve(b), 'image/jpeg', 0.82); }; img.onerror = () => resolve(null); img.src = fr.result; }; fr.onerror = () => resolve(null); fr.readAsDataURL(file); }); }
            $('chatFile').addEventListener('change', async e => {
                const f = e.target.files[0]; e.target.value = ''; if (!f || busy) return;
                if (/^image\//.test(f.type)) { const b = await shrink(f); if (b) sendMedia(b, 'image/jpeg', 'image'); else SH.toast(SH.tr('chat_fail')); }
                else if (/^video\//.test(f.type)) { if (f.size > 15 * 1024 * 1024) { SH.toast(SH.tr('chat_big')); return; } sendMedia(f, f.type || 'video/mp4', 'video'); }
            });
            /* --- ovozli xabar --- */
            let micDown = null;
            // Bekor qilish belgisi: ← va korzinka (matnsiz); chapga surilganda qizil
            const recHint = c => `<span class="rec-hint${c ? ' armed' : ''}"><svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></span>`;
            async function recStart() {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { SH.toast(SH.tr('chat_no_mic')); return; }
                let stream = micStream;
                if (!stream || !stream.getTracks().some(t => t.readyState === 'live')) {
                    // Mikrofon uchun qisqa rozilik: akkauntga bir marta so'raladi
                    const mk = 'mic_ok:' + (SH.user() ? SH.user().id : 'guest');
                    if (!localStorage.getItem(mk)) { if (!(await SH.confirmSheet(SH.tr('chat_mic_ask'), SH.tr('c_yes'), ''))) return; try { localStorage.setItem(mk, '1'); } catch (e) {} }
                    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { SH.toast(SH.tr('chat_mic_denied')); return; }
                    micStream = stream;
                }
                const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'], mt = mimes.find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
                let mr; try { mr = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined); } catch (e) { stream.getTracks().forEach(t => t.stop()); SH.toast(SH.tr('chat_no_mic')); return; }
                const chunks = []; mr.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
                rec = { mr: mr, stream: stream, chunks: chunks, t0: Date.now(), cancel: false, mime: (mr.mimeType || mt || 'audio/webm').split(';')[0] };
                mr.onstop = () => { const r = rec; rec = null; clearInterval(r.timer); $('chatRec').hidden = true; mainBtn(); const dur = Math.round((Date.now() - r.t0) / 1000);
                    if (!r.cancel && dur >= 1 && r.chunks.length) sendMedia(new Blob(r.chunks, { type: r.mime }), r.mime, 'voice', dur); };
                mr.start(); $('chatRec').hidden = false; mainBtn(); { const em0 = $('chatRec').querySelector('em'); if (em0) em0.innerHTML = recHint(false); }
                rec.timer = setInterval(() => { const s = Math.floor((Date.now() - rec.t0) / 1000); $('recT').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (s >= 120) recStop(false); }, 250);
                if (micDown && micDown.up) recStop(!!micDown.cancel);   // barmoq ovoz yozish tayyor bo'lguncha qo'yib yuborilgan bo'lsa
            }
            function recStop(cancel) { if (!rec || rec.stopping) return; rec.stopping = true; rec.cancel = !!cancel; try { rec.mr.stop(); } catch (e) { rec = null; } }
            $('recCancel').addEventListener('click', () => recStop(true));
            await load(true); mainBtn(); fitChat(); stopChatTimerOnly(); chatTimer = setInterval(() => { if (!document.hidden && view().v === 'chat') load(); }, 4000);
        }
        function stopChatTimerOnly() { if (chatTimer) { clearInterval(chatTimer); chatTimer = null; } }

        /* ---------- Kutayotgan mahsulotlar ("Kelganda xabar qil") ---------- */
        function renderWaiting() {
            hdr.textContent = SH.tr('notify_list'); const ids = SH.getNotified().map(String);
            const items = ids.map(id => SH.product(isNaN(Number(id)) ? id : Number(id)) || SH.product(id)).filter(Boolean);
            if (!items.length) { page.innerHTML = `<div class="sh-empty">${I.bell}<h3>${SH.esc(SH.tr('notify_list_empty'))}</h3><p>${SH.esc(SH.tr('notify_list_text'))}</p></div>`; return; }
            page.innerHTML = items.map(p => { const back = SH.totalStock(p) > 0; return `<div class="wt-row"><img src="${SH.esc((p.images && p.images[0]) || SH.productImage(p))}" alt="" data-p="${SH.esc(p.id)}"><div class="wt-info"><div class="wt-name">${SH.esc(SH.loc(p.name))}</div><div class="wt-st ${back ? 'ok' : ''}">${SH.esc(back ? SH.tr('notify_back') : SH.tr('notify_waiting'))}</div></div><button class="oi-btn danger" data-off="${SH.esc(p.id)}">${SH.esc(SH.tr('del'))}</button></div>`; }).join('');
            page.querySelectorAll('[data-off]').forEach(b => b.addEventListener('click', async () => { await SH.cardNotify(b.getAttribute('data-off')); renderWaiting(); }));
        }
        async function loadChatBadge() { if (!SH.isRemote() || !SH.user()) return; try { const s = await SH.chatApi.status(); chatUnread = s.unread || 0; const el = document.getElementById('chatBadge'); if (el) { el.textContent = chatUnread; el.hidden = !chatUnread; } } catch (e) {} }
        function go(h) { location.hash = h; }
        page.addEventListener('click', async e => {
            const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
            if (e.target.closest('#loginBtn') && view().v !== 'main') { SH.openLogin(() => render()); return; }
            if (e.target.closest('#verifyBtn')) { SH.openLogin(() => { orders = null; render(); }); return; }
            if (e.target.closest('#loginBtn')) { SH.openLogin(() => { orders = null; render(); }); return; }
            if (e.target.closest('#logoutRow')) { const was = SH.user(); if (await SH.confirmSheet(SH.tr('a_logout_ask'), SH.tr('a_logout'))) { SH.logout(); orders = null; if (was && was.kind === 'tg') { location.href = 'index.html'; } else { render(); } } return; }
            const oc = e.target.closest('[data-oid]'); if (oc) { go('order=' + encodeURIComponent(oc.getAttribute('data-oid'))); return; }
            const ls_ = e.target.closest('#langSeg [data-l]'); if (ls_) { SH.setLang(ls_.getAttribute('data-l')); SH.applyI18n(); document.title = SH.tr('pr_title'); renderNav(); render(); return; }
            const ts = e.target.closest('#themeSeg [data-t]'); if (ts) { SH.setTheme(ts.getAttribute('data-t')); render(); return; }
            if (e.target.closest('#nameSave')) { const v = document.getElementById('nameInp').value.trim(); if (!v) return; try { await SH.updateName(v); SH.toast(SH.tr('pr_saved')); } catch (er) { SH.toast(SH.tr('error_generic')); } return; }
            const pi = e.target.closest('img[data-p]'); if (pi) { location.href = 'product.html?id=' + encodeURIComponent(pi.getAttribute('data-p')); return; }
            const rv = e.target.closest('[data-rv]');
            if (rv) { const o = orders.find(x => String(x.id) === String(view().id)); const it = o.items[parseInt(rv.getAttribute('data-rv'), 10)]; SH.openReviewSheet(o, it, () => renderOrder(o.id)); return; }
            if (e.target.closest('#demoDeliver')) { SH.localMarkDelivered(view().id); orders = null; renderOrder(view().id); }
        });
        function renderNav() { document.querySelectorAll('.bottom-nav [data-i18n]').forEach(el => { el.textContent = SH.tr(el.getAttribute('data-i18n')); }); }
        window.addEventListener('hashchange', render); window.addEventListener('pagehide', stopChat);
        (async function start() {
            SH.init(); document.title = SH.tr('pr_title');
            try { SH.setDB(await SH.loadDB(fresh => { SH.setDB(fresh); })); } catch (e) {}
            document.title = SH.tr('pr_title') + ' - ' + SH.shopName();
            render();
            SH.whenSession().then(() => { orders = null; render(); loadChatBadge(); });   // Telegram sessiyasi tayyor bo'lgach akkaunt ko'rinadi
            if (new URLSearchParams(location.search).get('login') === '1' && !SH.user()) SH.openLogin(() => render());
        })();
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        Object.assign(window, { contactLine, view, render, renderSettings, ensureOrders, renderOrders, renderOrder, go, renderNav });
};

/* ##########################################################################
   SAHIFA: SHARHLAR (reviews.html)   ->   <html data-page="reviews">
   ########################################################################## */
PAGES.reviews = function () {


        /* ==================== SHARHLAR SAHIFASI: ro'yxat, filtr, sharh yozish ==================== */
        const pid = new URLSearchParams(location.search).get('id');
        let filter = 'all', eligible = null;

        /* ==================== PROFIL: karta, buyurtmalar, sozlamalar ==================== */
        const page = document.getElementById('page');

        /* ==================== SAVAT: ro'yxat, tanlash, buyurtma berish ==================== */
        function render() {
            SH.applyTheme(); SH.applyI18n();
            const p = SH.product(pid); if (!p) { page.innerHTML = `<div class="sh-empty"><h3>${SH.esc(SH.tr('not_found'))}</h3><a class="sh-btn" href="index.html">${SH.esc(SH.tr('go_home'))}</a></div>`; return; }
            const all = SH.reviewsFor(p.id), R = SH.ratingOf(p);
            const cnt = [0, 0, 0, 0, 0, 0]; all.forEach(r => { cnt[Math.max(1, Math.min(5, Math.round(r.rating)))]++; });
            const photos = []; all.forEach(r => (r.photos || []).forEach(u => photos.push(u)));
            let list = all;
            if (filter === 'photo') list = all.filter(r => (r.photos || []).length); else if (filter !== 'all') list = all.filter(r => Math.round(r.rating) === parseInt(filter, 10));
            const chip = (k, label) => `<button class="fchip ${filter === k ? 'on' : ''}" data-f="${k}">${label}</button>`;
            const star = '<svg viewBox="0 0 24 24"><path d="' + SH.STAR_PATH + '"/></svg>';
            page.innerHTML = `
              <div class="box"><div class="pm" onclick="location.href='product.html?id=${SH.esc(p.id)}'"><img src="${SH.esc(SH.productImage(p))}" alt=""><div><div class="pm-name">${SH.esc(SH.loc(p.name))}</div></div></div></div>
              <div class="box">${all.length ? `<div class="sum"><div class="sum-big"><b>${R.avg.toFixed(1)}</b>${SH.starsHtml(R.avg, 14)}<small>${SH.esc(SH.tr('r_based', { n: all.length }))}</small></div>
                <div class="bars">${[5, 4, 3, 2, 1].map(n => `<div class="bar-row"><span>${n}</span><div class="bar"><i style="width:${all.length ? Math.round(cnt[n] * 100 / all.length) : 0}%"></i></div><span>${cnt[n]}</span></div>`).join('')}</div></div>`
                : `<div class="sh-empty" style="padding:24px 0"><p>${SH.esc(SH.tr('p_no_reviews'))}</p></div>`}</div>
              ${photos.length ? `<div class="box"><div class="ph-title">${SH.esc(SH.tr('r_buyers_photos'))}</div><div class="ph-row" id="phRow">${photos.map((u, i) => `<img src="${SH.esc(u)}" data-i="${i}" alt="" loading="lazy">`).join('')}</div></div>` : ''}
              ${all.length ? `<div class="filters">${chip('all', SH.esc(SH.tr('r_all')))}${[5, 4, 3, 2, 1].map(n => chip(String(n), n + star)).join('')}${photos.length ? chip('photo', SH.esc(SH.tr('r_with_photos'))) : ''}</div>` : ''}
              <div class="box" id="list">${list.length ? list.map(r => SH.reviewHtml(r, p)).join('') : (all.length ? `<div class="sh-empty" style="padding:24px 0"><p>${SH.esc(SH.tr('r_none_filter'))}</p></div>` : '')}</div>`;
            if (!all.length) document.getElementById('list').style.display = 'none';
            document.getElementById('phRow') && document.getElementById('phRow').addEventListener('click', e => { const im = e.target.closest('img[data-i]'); if (im) SH.lightbox(photos, parseInt(im.dataset.i, 10)); });
            SH.bindReviewPhotos(document.getElementById('list'), () => list);
            page.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { filter = b.getAttribute('data-f'); render(); }));
            renderWrite(p);
        }

        /* ==================== SHARHLAR SAHIFASI: ro'yxat, filtr, sharh yozish ==================== */
        function renderWrite(p) {
            const bar = document.getElementById('writeBar'); bar.innerHTML = '';
            if (!eligible) return;
            bar.innerHTML = `<button class="sh-btn" id="wr">${SH.esc(SH.tr('r_write'))}</button>`;
            bar.querySelector('#wr').addEventListener('click', () => SH.openReviewSheet(eligible.order, eligible.item, () => { eligible = null; render(); }));
        }
        async function findEligible() {
            if (!SH.user()) return;
            try {
                const os = await SH.listOrders();
                for (const o of os) { if (o.status !== 'delivered') continue; const it = (o.items || []).find(i => String(i.product_id) === String(pid) && !SH.isReviewed(o.id, i.product_id, i)); if (it) { eligible = { order: o, item: it }; break; } }
            } catch (e) {}
        }
        (async function start() {
            SH.init(); SH.onBack(null);
            try { SH.setDB(await SH.loadDB(fresh => { SH.setDB(fresh); render(); })); } catch (e) {}
            const p = SH.product(pid); document.title = SH.tr('r_title') + (p ? ' - ' + SH.loc(p.name) : '');
            render(); await findEligible(); if (eligible) renderWrite(p);
        })();
    
        // HTML dagi onclick="..." ishlashi uchun funksiyalarni ochiq qilish
        Object.assign(window, { render, renderWrite, findEligible });
};

/* ==================== 5. ISHGA TUSHIRISH ==================== */
(function boot() {
  const page = document.documentElement.getAttribute('data-page');
  if (PAGES[page]) PAGES[page]();
  SH.boot();   // serverni aniqlash va (Telegramda) avtomatik kirish
})();
