# Admin panel: o'rnatish va ishlatish

## 1. Qaysi fayllarni GitHub'ga yuklash kerak
Hammasini `mini-shop` repoga yuklang (eskilarini almashtiring), so'ng Render'da **Manual Deploy → Deploy latest commit**:

| Fayl | Nima |
|---|---|
| `server.js` | YANGI server (admin API, rasm yuklash, ombor, chat). **Albatta almashtiring** |
| `admin.html` | Boshqaruv (bosh sahifa) |
| `admin-orders.html`, `admin-reports.html`, `admin-stock.html`, `admin-products.html`, `admin-categories.html`, `admin-banners.html`, `admin-stories.html`, `admin-weekly.html`, `admin-users.html`, `admin-chat.html`, `admin-archive.html`, `admin-settings.html` | Admin sahifalari |
| `admin.css` | Admin dizayni (hamma sahifa uchun bitta) |
| `admin.js` | Admin yadrosi (kirish, menyu, diagrammalar). Server manzili shu faylning boshida (`ADMIN_CONFIG`) |
| `admin-dashboard.js`, `admin-orders.js`, `admin-reports.js`, `admin-stock.js`, `admin-products.js`, `admin-categories.js`, `admin-banners.js`, `admin-stories.js`, `admin-weekly.js`, `admin-users.js`, `admin-chat.js`, `admin-archive.js`, `admin-settings.js` | Har bir sahifaning o'z kodi |

`package.json`, `database.json`, `script.js`, `style.css` va sayt sahifalari o'zgarmadi.

## 2. Kirish
`https://ibrohim-dev17.github.io/mini-shop/admin.html` → Render'dagi `ADMIN_KEY` parolini kiriting. "Bu qurilmada eslab qolish" belgilansa, keyingi safar so'ramaydi.

## 3. Muhim: katalog qayerda saqlanadi
Admin panelda mahsulot, kategoriya, banner, storis, aksiyani o'zgartirsangiz, hammasi **Neon bazasiga** saqlanadi va sayt shu yerdan o'qiydi. Shuning uchun:
- Admin'da qilingan o'zgarish saytda **darhol** ko'rinadi (telefonda ilovani yopib-ochish kerak bo'lishi mumkin).
- GitHub'dagi `database.json` faqat BIRINCHI boshlang'ich katalog. Admin bilan o'zgartirgandan keyin u fayl hisobga olinmaydi. Qayta boshlash kerak bo'lsa: Sozlamalar → "Boshlang'ich katalogga qaytish".
- `DATABASE_URL` (Neon) bo'lmasa, katalog server qayta ishga tushganda yo'qoladi. Albatta ulang.
- Muntazam zaxira oling: Sozlamalar → "Zaxira faylini yuklab olish".

## 4. Bo'limlar
- **Boshqaruv:** bugungi/haftalik/oylik savdo, foyda, diagramma, kam qolgan mahsulotlar.
- **Buyurtmalar:** ko'rish, holatini o'zgartirish (mijozga Telegramdan xabar boradi), qidirish, CSV.
- **Hisobot:** davr tanlash, tushum, o'z narxi, foyda, kategoriya bo'yicha, sotilgan mahsulotlar jadvali, Excel (CSV).
- **Ombor:** har bir mahsulot va rang/o'lcham bo'yicha qoldiq, o'z narxi, ombor qiymati, tez o'zgartirish (+ / −), tarix.
- **Mahsulotlar:** qo'shish, tahrirlash, nusxalash, arxivlash, o'chirish. Rasmni tortib tashlash (drag & drop) yoki tugma bilan yuklanadi, avtomatik kichraytiriladi. Ranglar, o'lchamlar, o'z narxi, chegirma.
- **Kategoriyalar:** kategoriya va ichki kategoriyalar, tartibini o'zgartirish, arxivlash.
- **Bannerlar:** rasm, bosilganda kategoriya yoki mahsulotga o'tishi, ko'rsatish muddati, tartib.
- **Storislar:** rasm yoki video havola, mahsulotni mention qilish, muddat.
- **Hafta aksiyalari:** mahsulotlar, taymer (+1/3/7/14 kun tugmalari).
- **Foydalanuvchilar:** ro'yxat, buyurtmalari, jami xarid, chatga o'tish, bloklash.
- **Chat:** mijoz botga yozsa shu yerga tushadi, javobingiz mijozga Telegramda boradi.
- **Arxiv:** arxivlangan narsalarni bitta tugma bilan qaytarish.
- **Sozlamalar:** do'kon ma'lumoti, server holati, zaxira nusxa.

## 5. O'z narxi nima uchun
Har bir mahsulotga o'z narxingizni (tan narx) kiriting. U saytda ko'rinmaydi. Buyurtma berilgan paytdagi o'z narxi buyurtmaga yoziladi, shuning uchun narx keyin o'zgarsa ham eski hisob-kitob buzilmaydi. Foyda = sotuv narxi − o'z narxi.

## 6. Cheklovlar (halol)
- Chat mijozga faqat u botni ishga tushirgan bo'lsa yetadi (Telegram qoidasi).
- Videoni faylni yuklash orqali emas, havola bilan qo'shasiz (video juda og'ir).
- Storis va banner rasmi katta bo'lsa avtomatik kichraytiriladi (1080-1600 px).
- Bepul Render uxlaydi: admin birinchi ochilganda 30-60 soniya kutishi mumkin.
