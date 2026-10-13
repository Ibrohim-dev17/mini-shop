# Backend (FastAPI) — telefon bilan ishga tushirish

## 1. Fayllar
`main.py`, `requirements.txt` — GitHub'da yangi repo oching va ikkalasini yuklang.

## 2. Bepul baza (PostgreSQL)
neon.tech yoki supabase.com da ro'yxatdan o'ting, yangi baza yarating va "connection string" ni nusxalang
(`postgresql://...`).
SQLite bepul hostingda ishlamaydi: disk vaqtinchalik, ma'lumot o'chib ketadi. Shuning uchun PostgreSQL.

## 3. Hosting (Render.com, bepul)
New → Web Service → GitHub repo'ni tanlang.
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment:
  - `DATABASE_URL` = Neon/Supabase manzili
  - `MASTER_KEY` = o'zingiz o'ylab topgan uzun maxfiy parol
  - `CORS_ORIGINS` = frontend manzili (yoki `*` sinov uchun)

Bepul Render 15 daqiqa ishlatilmasa uxlaydi, birinchi kirish sekin bo'ladi. Frontend keshdan ochgani uchun bu bilinmaydi.

## 4. Birinchi mijoz (do'kon) yaratish
`https://HOST/docs` ni oching (Swagger):
1. `POST /api/master/shops` → Authorize/header `X-Master-Key` ni kiriting, body: `{"slug":"mijoz1","name":"Mijoz do'koni","plan":"trial"}`. Javobda `api_key` chiqadi, uni saqlang.
2. `POST /api/admin/mijoz1/import-file` → header `X-Admin-Key` = api_key, `database.json` faylini yuklang.

## 5. Frontend'ni ulash
`index.html`, `products.html`, `categories.html`, `sales.html`, `common.js` ichida:
`const DB_URL = 'database.json'` ni
`const DB_URL = 'https://HOST/api/products?shop=mijoz1'` ga almashtiring.

## 6. Tariflar va sinov
`PATCH /api/master/shops/mijoz1` (X-Master-Key) bilan `plan`, `active`, `expires_at` o'zgartiriladi.
Muddat tugasa `/api/products` 402 qaytaradi.

Eslatma: bu kod kompyuterimda kutubxonalar o'rnatilmagani uchun ishga tushirib sinalmagan. Birinchi ishga tushirishda xato chiqsa, Render logini yuboring, tuzataman.
