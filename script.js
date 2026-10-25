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
        a_tg_title: "Telefon raqamni tasdiqlang", a_tg_text: "Buyurtma berish uchun raqamingizni Telegram orqali tasdiqlang. Bu faqat bir marta so'raladi, kod yozish shart emas.",
        a_tg_share: "Raqamni ulashish", a_tg_waiting: "Tasdiqlash kutilmoqda... Telegramdagi so'rovda «Ulashish» tugmasini bosing.",
        a_tg_bot_hint: "So'rov chiqmasa, botni oching va u yerdagi «Raqamni ulashish» tugmasini bosing, so'ng shu yerga qayting.", a_tg_open_bot: "Botni ochish",
        a_tg_ok: "Raqamingiz tasdiqlandi", a_tg_timeout: "Tasdiqlash kelmadi. Qayta urinib ko'ring.",
        a_email: "Email", a_email_ph: "nom@gmail.com", a_bad_email: "Email manzilni to'g'ri kiriting",
        a_email_text: "Emailingizni kiriting, tasdiqlash kodini yuboramiz. Buyurtmangiz shu email bilan bog'lanadi.",
        a_email_sent: "Kod {email} manziliga yuborildi", a_email_note: "Xat kelmasa «Spam» papkasini tekshiring. Kod 10 daqiqa amal qiladi. Pochtaga o'tib kelsangiz ham, shu yerdan davom etasiz.",
        a_code_expired: "Kod eskirgan. Yangi kod oling.", a_change_email: "Emailni o'zgartirish", a_demo_email: "Sinov rejimi: kod {code}", a_not_ready: "Hozircha kirish sozlanmagan. Keyinroq urinib ko'ring.",
        c_contact_phone: "Aloqa uchun telefon", c_contact_hint: "Tasdiqlangan raqamingiz: {p}. Buyurtmani boshqa kishi qabul qilsa, boshqa raqam yozishingiz mumkin.",
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
        a_tg_title: "Подтвердите номер телефона", a_tg_text: "Чтобы оформить заказ, подтвердите номер через Telegram. Это нужно один раз, вводить код не нужно.",
        a_tg_share: "Поделиться номером", a_tg_waiting: "Ожидаем подтверждение... Нажмите «Поделиться» в запросе Telegram.",
        a_tg_bot_hint: "Если запрос не появился, откройте бота, нажмите там «Поделиться номером» и вернитесь сюда.", a_tg_open_bot: "Открыть бота",
        a_tg_ok: "Номер подтверждён", a_tg_timeout: "Подтверждение не пришло. Попробуйте ещё раз.",
        a_email: "Email", a_email_ph: "name@gmail.com", a_bad_email: "Введите email правильно",
        a_email_text: "Введите email, мы отправим код подтверждения. Заказ будет привязан к этому email.",
        a_email_sent: "Код отправлен на {email}", a_email_note: "Если письма нет, проверьте папку «Спам». Код действует 10 минут. Если вы уйдёте в почту, то продолжите отсюда же.",
        a_code_expired: "Код устарел. Получите новый.", a_change_email: "Изменить email", a_demo_email: "Тестовый режим: код {code}", a_not_ready: "Вход пока не настроен. Попробуйте позже.",
        c_contact_phone: "Телефон для связи", c_contact_hint: "Подтверждённый номер: {p}. Если заказ получит другой человек, можно указать другой номер.",
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
    function getCart() { const c = ls.get('cart_products', []); return Array.isArray(c) ? c : []; }
    function saveCart(c) { ls.set('cart_products', c.map(i => { const o = { id: i.id, selectedSize: i.selectedSize === undefined ? null : i.selectedSize, selectedColor: i.selectedColor === undefined ? null : i.selectedColor, qty: i.qty || 1 }; if (i.sel) o.sel = i.sel; return o; })); updateBadges(); }
    function sameLine(i, id, size, color) { return !i.sel && String(i.id) === String(id) && (i.selectedSize == null ? null : i.selectedSize) == (size == null ? null : size) && (i.selectedColor == null ? null : i.selectedColor) == (color == null ? null : color); }
    function cartFind(id, size, color) { return getCart().find(i => sameLine(i, id, size, color)); }
    function cartSet(id, size, color, qty) {
      let c = getCart(); const idx = c.findIndex(i => sameLine(i, id, size, color));
      if (qty <= 0) { if (idx >= 0) c.splice(idx, 1); }
      else if (idx >= 0) c[idx].qty = qty; else c.push({ id: id, selectedSize: size, selectedColor: color, qty: qty });
      saveCart(c);
    }
    function getFavs() { const f = ls.get('fav_products', []); return Array.isArray(f) ? f : []; }
    function toggleFav(id) { let f = getFavs(); const i = f.findIndex(x => String(x) === String(id)); if (i >= 0) f.splice(i, 1); else f.push(id); ls.set('fav_products', f); updateBadges(); return i < 0; }
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
      if (overlays.length) { const el = overlays.pop(); el.classList.remove('show'); setTimeout(() => el.remove(), 220); lockScroll(); }
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
      if (opts.onMount) opts.onMount(el.querySelector('.sh-sheet-body'), close);
      return { el, close, body: el.querySelector('.sh-sheet-body') };
    }
    function confirmSheet(message, okLabel) {
      return new Promise(resolve => {
        let done = false;
        const s = sheet({ html: `<div class="sh-confirm-text">${esc(message)}</div>
          <div class="sh-row"><button class="sh-btn ghost" data-a="no">${esc(tr('cancel'))}</button><button class="sh-btn danger" data-a="yes">${esc(okLabel || tr('yes'))}</button></div>` });
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
    function logout() { try { localStorage.removeItem('auth'); localStorage.removeItem('pending_email'); localStorage.removeItem('checkout_pending'); } catch (e) {} }
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
    async function tgLogin(tg) { const r = await api('/api/auth/telegram', { method: 'POST', auth: false, body: { initData: tg.initData, lang: lang() } }); setAuth({ token: r.token, user: r.user }); }
    async function startSession() {
      const srv = await whenReady(); if (!srv) return user();
      const tg = tgApp();
      try {
        const a = getAuth();
        if (tg && srv.telegram) {
          const tuid = tg.initDataUnsafe.user.id;
          if (!a || a.token === 'local' || !a.user || a.user.tg !== tuid) await tgLogin(tg);
          else { try { a.user = await api('/api/me'); setAuth(a); } catch (e) { if (e.status === 401) await tgLogin(tg); } }
        } else if (a && a.token && a.token !== 'local') {
          try { a.user = await api('/api/me'); setAuth(a); } catch (e) { if (e.status === 401) logout(); }
        }
      } catch (e) { /* tarmoq xatosi: eski ma'lumot bilan davom etamiz */ }
      syncNotified();
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
            await whenSession(); const a = getAuth(); if (!a || a.token === 'local') { $('shErr').textContent = tr('error_generic'); return; }
            await saveName();
            const can = !viaBot && typeof tg.requestContact === 'function' && (!tg.isVersionAtLeast || tg.isVersionAtLeast('8.0'));
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
        return await api('/api/orders', { method: 'POST', body: { name: d.name, phone: d.phone, address: d.address, geo: d.geo || undefined, comment: d.comment, client_id: d.cid, items: d.items.map(i => ({ product_id: i.id, color: i.color, size: i.size, sel: i.sel || undefined, qty: i.qty })) } });
      }
      const u = user(); const all = ls.get('local_orders', []);
      const items = d.items.map(makeSnapshot);
      const order = { id: 'L' + Date.now().toString(36), number: all.length + 1001, status: 'new', created: new Date().toISOString(), phone: u.phone, contact_phone: d.phone || u.phone, name: d.name, address: d.address, geo: d.geo || null, comment: d.comment || '', items: items, total: items.reduce((s, i) => s + i.price * i.qty, 0) };
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
      cart_btn: "Savatga", notify_btn: "Kelganda xabar qilish", notify_active: "✓ Xabar beriladi", sel_title: "Variantni tanlang", sel_add: "Savatga qo'shish",
      exit_btn: "Chiqish", exit_ask: "Ilovadan chiqasizmi?", exit_yes: "Chiqish", last_item: "Oxirgisi", out_of_stock: "Qolmadi",
      s_results: "Natijalar", s_others: "Boshqa mahsulotlar", s_no: "Hech narsa topilmadi...", s_all: "bo'yicha barcha natijalarni ko'rish", s_type: "Qidirish",
      s_product: "Mahsulot", s_cat: "Bo'lim", s_sub: "Turkum", s_hist: "Oxirgi qidiruvlar", s_clear: "Tozalash", s_ph: "Mahsulotlar va turkumlar izlash...",
      need_login_notify: "Xabar olish uchun avval kiring"
    });
    Object.assign(DICT.ru, {
      cart_btn: "В корзину", notify_btn: "Сообщить о поступлении", notify_active: "✓ Сообщим", sel_title: "Выберите вариант", sel_add: "Добавить в корзину",
      exit_btn: "Выйти", exit_ask: "Выйти из приложения?", exit_yes: "Выйти", last_item: "Последний", out_of_stock: "Нет в наличии",
      s_results: "Результаты", s_others: "Другие товары", s_no: "Ничего не найдено...", s_all: "показать все результаты", s_type: "Поиск",
      s_product: "Товар", s_cat: "Раздел", s_sub: "Категория", s_hist: "Недавние запросы", s_clear: "Очистить", s_ph: "Поиск товаров и категорий...",
      need_login_notify: "Чтобы получать уведомления, сначала войдите"
    });

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
      if (needsChoice(p)) { openVariantSheet(p, sel => { if (addSel(p, sel, 1)) toast(tr('p_added')); }); return; }
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
      const ax = axesOf(p), sel = Object.assign({}, firstSel(p));
      const s = sheet({
        title: esc(tr('sel_title')),
        html: '<div id="shVar"></div>',
        onMount(body, close) {
          const paint = () => {
            const st = stockForSel(p, sel), img = selImage(p, sel);
            body.querySelector('#shVar').innerHTML = `
              <div class="sh-var-head"><img src="${esc(img)}" alt=""><div><div class="sh-var-name">${esc(loc(p.name))}</div><div class="sh-var-price">${esc(money(num(p.price)))}</div>
                <div class="sh-var-stock ${st <= 0 ? 'out' : ''}">${st <= 0 ? esc(tr('p_variant_out')) : (st <= 3 ? esc(tr('p_left', { n: st })) : '')}</div></div></div>
              ${ax.map(a => `<div class="sh-var-axis"><div class="sh-var-lbl">${esc(loc(a.name))}: <b>${esc((() => { const v = a.values.find(x => x.id === sel[a.key]); return v ? loc(v.name) : ''; })())}</b></div>
                <div class="sh-var-chips">${a.values.map(v => {
                  const off = stockForSel(p, Object.assign({}, sel, { [a.key]: v.id })) <= 0;
                  const sw = a.type === 'color' ? (v.images && v.images[0] ? `<img src="${esc(v.images[0])}" alt="">` : `<i style="background:${esc(v.hex || '#ccc')}"></i>`) : '';
                  return `<button type="button" class="sh-chip ${v.id === sel[a.key] ? 'on' : ''} ${off ? 'off' : ''} ${sw ? 'has-sw' : ''}" data-k="${esc(a.key)}" data-v="${esc(v.id)}">${sw}<span>${esc(loc(v.name))}</span></button>`;
                }).join('')}</div></div>`).join('')}
              <button class="sh-btn" id="shVarAdd" ${st <= 0 ? 'disabled' : ''}>${esc(tr('sel_add'))}</button>`;
          };
          paint();
          body.addEventListener('click', e => {
            const c = e.target.closest('.sh-chip');
            if (c) { sel[c.getAttribute('data-k')] = c.getAttribute('data-v'); paint(); return; }
            if (e.target.closest('#shVarAdd')) { close(); setTimeout(() => onPick(Object.assign({}, sel)), 240); }
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
      chat_title: "Sotuvchi bilan chat", chat_ph: "Xabar yozing...", chat_empty: "Savolingizni yozing, sotuvchi javob beradi", chat_send: "Yuborish", chat_reply: "Javob", chat_login: "Yozish uchun avval kiring",
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
      chat_title: "Чат с продавцом", chat_ph: "Напишите сообщение...", chat_empty: "Напишите свой вопрос, продавец ответит", chat_send: "Отправить", chat_reply: "Ответить", chat_login: "Чтобы написать, сначала войдите",
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
      $('mpMe').addEventListener('click', () => {
        if (!navigator.geolocation) { toast(tr('map_geo_fail')); return; }
        navigator.geolocation.getCurrentPosition(pos => { c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; z = 17; moved(true); }, () => toast(tr('map_geo_fail')), { enableHighAccuracy: true, timeout: 12000 });
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
      send: (text, replyTo) => api('/api/chat/send', { method: 'POST', body: { text: text, reply_to: replyTo || undefined } })
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
                const prod = dbData.products.find(p => p.id === story.product_id);
                if (prod) {
                    document.getElementById('modalPrevImg').src = prod.images && prod.images[0] ? prod.images[0] : '';
                    document.getElementById('modalPrevTitle').textContent = getLocalized(prod.name);
                    document.getElementById('modalPrevPrice').textContent = isWeeklySaleExpired() ? (prod.oldPrice || prod.price) : prod.price;
                    document.getElementById('modalBtnText').textContent = currentLang === 'ru' ? 'Смотреть' : "Ko'rish";
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
                try { if (v.fas
Preview truncated for large file