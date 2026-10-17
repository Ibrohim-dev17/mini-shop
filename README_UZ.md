# Do'kon: o'rnatish (telefondan)

Hamma fayl BIR papkada turadi (server.js ham, html lar ham). Render shu papkadan ishlaydi.

## 1. GitHub'ga yuklash
Repozitoriyga shu fayllarni yuklang (eskilarini almashtiring):
- `server.js`, `package.json` (yangilari; Express endi kerak emas)
- `index, products, categories, sales, product, heart, cart, profil, reviews .html`
- `style.css`, `script.js`
- `admin.html`, `admin.css`, `admin.js`
- `database.json` (sizning mahsulotlaringiz; hozirgisi namuna, kiyim)

`stories.html` fayli sizda alohida bo'lsa, o'sha yerda qoladi.

## 2. Render -> Environment (o'zgaruvchilar)
| Nomi | Nima |
|---|---|
| `BOT_TOKEN` | BotFather bergan token |
| `OWNER_CHAT_ID` | buyurtma xabari boradigan chat ID (bir nechta bo'lsa vergul bilan) |
| `ADMIN_KEY` | admin.html paroli (uzun, o'zingiz o'ylab toping) |
| `DATABASE_URL` | Neon.tech manzili (pastga qarang). BO'LMASA buyurtmalar yo'qoladi |
| `BREVO_API_KEY` | brauzerda email kod yuborish uchun (ixtiyoriy) |
| `EMAIL_FROM` | `Do'kon nomi <sizning@gmail.com>` |

Saqlagach Render o'zi qayta ishga tushadi. Server ishga tushganda Telegram webhook'ni o'zi o'rnatadi (logda `webhook: OK`).

## 3. Neon (bepul baza, buyurtmalar yo'qolmasligi uchun)
neon.tech -> ro'yxatdan o'tish -> yangi loyiha -> "Connection string" ni nusxalang -> Render'da `DATABASE_URL` ga qo'ying. Jadvallarni server o'zi yaratadi.

## 4. Brevo (email kodi, bepul)
brevo.com -> ro'yxatdan o'tish -> Senders -> o'z gmail'ingizni tasdiqlang -> SMTP & API -> API key yarating -> `BREVO_API_KEY`.
Telegram ichida email kerak emas, u faqat oddiy brauzer uchun.

## 5. Telegram
BotFather -> botingiz -> Menu Button / Web App manzili = Render manzilingiz (`https://...onrender.com`).
Mijoz birinchi buyurtmada "Raqamni ulashish" tugmasini bosadi; bot raqamni Telegramdan oladi. Kod yozish kerak emas.

## 6. Admin
`https://SIZNING-MANZIL/admin.html` -> `ADMIN_KEY` ni kiriting. Buyurtma holatini o'zgartirsangiz, mijozga Telegramda xabar boradi. "Bekor" qilsangiz qoldiq qaytadi.

## Fayllar tuzilishi (o'zgartirish uchun)
- `style.css`: bo'limlarga bo'lingan (qidiruv, banner, storis, savat, profil...). Ranglar tepada `--primary`, `--bg`.
- `script.js`: tepada `CONFIG`, so'ng umumiy kod, so'ng har sahifa uchun `PAGES.index`, `PAGES.cart`... Har bir bo'lim sarlavhali.
- Sayt boshqa joyda (masalan GitHub Pages) bo'lsa, `script.js` tepasida `CONFIG.API_BASE` ga Render manzilini yozing.

## Eslatma
- Storis `created_at + duration_hours` o'tgach o'zi yashirinadi. Storislar qatori yo'qolsa, sanani yangilang.
- Hafta aksiyasi `timer_end` o'tgach o'chadi.
- Mahsulot qoldig'ini `database.json` da o'zgartirasiz; sotilganlari serverda alohida hisoblanadi (`/api/admin/reset-sold` bilan nolga tushiriladi).
