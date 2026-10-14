Backend (FastAPI) — telefon bilan ishga tushirish
1. Fayllar
main.py, requirements.txt — GitHub'da yangi repo oching va ikkalasini yuklang.
2. Bepul baza (PostgreSQL)
neon.tech yoki supabase.com da ro'yxatdan o'ting, yangi baza yarating va "connection string" ni nusxalang
(postgresql://...).
SQLite bepul hostingda ishlamaydi: disk vaqtinchalik, ma'lumot o'chib ketadi. Shuning uchun PostgreSQL.
3. Hosting (Render.com, bepul)
New → Web Service → GitHub repo'ni tanlang.
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Environment:
DATABASE_URL = Neon/Supabase manzili
MASTER_KEY = o'zingiz o'ylab topgan uzun maxfiy parol
CORS_ORIGINS = frontend manzili (yoki * sinov uchun)

Bepul Render 15 daqiqa ishlatilmasa uxlaydi, birinchi kirish sekin bo'ladi. Frontend keshdan ochgani uchun bu bilinmaydi.
4. Birinchi mijoz (do'kon) yaratish
https://HOST/docs ni oching (Swagger):
POST /api/master/shops → Authorize/header X-Master-Key ni kiriting, body: {"slug":"mijoz1","name":"Mijoz do'koni","plan":"trial"}. Javobda api_key chiqadi, uni saqlang.
POST /api/admin/mijoz1/import-file → header X-Admin-Key = api_key, database.json faylini yuklang.
5. Frontend'ni ulash
Har bir html faylda const DB_URL = 'database.json' qatori bor (index, products, categories, sales, product, heart, cart, profil, reviews; ba'zilarida 2 joyda).
Backend manzili tayyor bo'lgach menga yuboring, hammasini o'zim almashtirib beraman. Yoki qo'lda:
const DB_URL = 'https://HOST/api/products?shop=mijoz1'
6. Tariflar va sinov
PATCH /api/master/shops/mijoz1 (X-Master-Key) bilan plan, active, expires_at o'zgartiriladi.
Muddat tugasa /api/products 402 qaytaradi.
7. Mijozlar: kirish (SMS kod), buyurtma, sharh
Frontend DB_URL ni backend manziliga o'zgartirsangiz, ro'yxatdan o'tish, buyurtmalar va sharhlar serverda saqlanadi (har bir mijozning o'ziniki, boshqasiga ko'rinmaydi).
Qo'shimcha o'zgaruvchilar (Render > Environment):
SECRET_KEY = uzun maxfiy qator (tokenlar uchun, o'zgarmasin)
ESKIZ_EMAIL, ESKIZ_PASSWORD = eskiz.uz hisobingiz (SMS yuborish uchun). Bular bo'lmasa kod SMS bilan yuborilmaydi, javobda ko'rinadi (faqat sinov uchun!). Haqiqiy mijozga berishdan oldin Eskiz ulang va SMS_DEV=0 qo'ying.
Buyurtma holatini o'zgartirish (Swagger): PATCH /api/orders-admin/{shop}/{id} body {"status":"delivered"}. Holat delivered bo'lgach mijoz sharh qoldira oladi.
Buyurtmalar ro'yxati: GET /api/orders-admin/{shop} (X-Admin-Key).
Eslatma: bu kod kompyuterimda kutubxonalar o'rnatilmagani uchun ishga tushirib sinalmagan. Birinchi ishga tushirishda xato chiqsa, Render logini yuboring, tuzataman.