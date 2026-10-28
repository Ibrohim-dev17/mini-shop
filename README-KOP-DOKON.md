# Ko'p do'konli platforma (ijaraga berish)

Bitta server, bitta baza, har bir sotuvchi uchun ajratilgan ma'lumot.

## Muhit o'zgaruvchilari (Render → Environment)
| Nom | Vazifasi |
|---|---|
| `OWNER_KEY` | **Egasi paneli** kaliti (`owner.html`). Sizda yagona, maxfiy saqlang. |
| `ADMIN_KEY` | Asosiy do'kon admin kaliti |
| `BOT_TOKEN` | Asosiy do'kon boti (ixtiyoriy). Sotuvchilar o'z botini egasi panelidan ulaydi. |
| `DATABASE_URL` | Neon/Supabase (ma'lumot o'chmasligi uchun tavsiya) |
| `PUBLIC_URL` | Server manzili, masalan `https://domen.uz` |
| `SECRET_KEY` | Tokenlarni imzolash uchun (ixtiyoriy, lekin tavsiya) |

## Sotuvchi qo'shish
1. `owner.html` ga `OWNER_KEY` bilan kiring.
2. "Yangi do'kon": nomi (a-z, 0-9, -), do'kon nomi, admin kaliti, to'lov muddati.
3. Sotuvchiga manzil: `https://domen.uz/?shop=nom` va admin: `https://domen.uz/admin.html?shop=nom`.
4. "Bot" tugmasi: sotuvchi botining tokenini (BotFather) va buyurtma chat ID sini kiriting. Bo'sh qoldirsa asosiy bot ishlatiladi.

## Boshqaruv
- **Muzlatish:** to'lov qilmagan do'kon to'xtaydi (saytda va admin panelda xabar chiqadi).
- **Muddat:** to'lov muddati tugasa do'kon muzlatilgan holatga o'tadi.
- **Funksiyalar:** chat, storislar, bannerlarni do'kon bo'yicha yoqish/o'chirish.
- **Yangilik** va **Chat:** barcha sotuvchilarga yoki alohida bittasiga xabar. Sotuvchi o'z admin panelidagi "Egasi bilan chat" bo'limidan javob yozadi.

## Xavfsizlik
- Kalitlar va bot tokenlari faqat Render muhit o'zgaruvchilarida yoki egasi panelida saqlanadi, kodga yozilmaydi.
- Egasi paneli va admin kalitlarini sotuvchilarga almashtirish: "Kalit" tugmasi.
