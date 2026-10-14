Kiyim do'koni: database.json tuzilmasi
Namuna: database.namuna.json (rasmlar o'rniga oddiy rangli rasm; o'zingiznikini rasm havolalari bilan almashtiring).
Kategoriyalar
{"id":1,"order":1,"name":{"uz":"Ayollar","ru":"Женщинам"},
 "subcats":[{"id":12,"name":{"uz":"Qishki kiyimlar","ru":"Зимняя одежда"},"img":"..."}]}
Mahsulot
{"id":101,"name":{"uz":"...","ru":"..."},"price":"220 000 so'm","oldPrice":"350 000 so'm","discount":"-37%",
 "category_id":1,"subcat":{"uz":"Qishki kiyimlar","ru":"Зимняя одежда"},
 "images":["..."],
 "colors":[{"id":"black","name":{"uz":"Qora","ru":"Чёрный"},"hex":"#1f2026","images":["...","..."]}],
 "sizes":["XS","S","M","L"],                 // bolalar uchun: "2-3 yosh"; shim uchun: "42","44"
 "material":{"uz":"Paxta","ru":"Хлопок"}, "country":{"uz":"Turkiya","ru":"Турция"}, "season":{"uz":"Qish","ru":"Зима"},
 "specs":[{"k":{"uz":"Bichimi","ru":"Крой"},"v":{"uz":"Erkin","ru":"Свободный"}}],   // ixtiyoriy qo'shimcha xususiyatlar
 "description":{"uz":"uzun matn...","ru":"..."},
 "stock":12,                                  // umumiy qoldiq (0 = "Qolmadi")
 "variant_stock":{"black|M":3,"black|L":0},   // ixtiyoriy: rang|o'lcham bo'yicha qoldiq (berilsa stock o'rniga shu ishlatiladi)
 "size_chart":{"cols":["Ko'krak","Bel"],"rows":{"S":[84,66],"M":[88,70]}},   // ixtiyoriy o'lchamlar jadvali
 "sold_week":34,                              // backend bo'lsa buyurtmalardan o'zi hisoblanadi
 "badgeType":"original"}

Rangi bitta bo'lsa colors ni, o'lchami bitta bo'lsa sizes ni yozmasangiz ham bo'ladi.
Bir nechta rang yoki o'lcham bo'lsa, kartadagi tugma "Tanlash" bo'ladi va mahsulot sahifasiga olib boradi.
Sharhlar (ixtiyoriy, boshlang'ich sharhlar)
"reviews":[{"id":1,"product_id":101,"name":"Gulhayo","rating":5,"text":"...","date":"2026-09-25","color":"black","size":"M","photos":["..."],
            "reply":{"name":"Do'kon","text":"Rahmat!"}}]
name bo'sh (null) bo'lsa "Anonim" deb chiqadi. Reyting va sharhlar soni shu sharhlardan o'zi hisoblanadi.
Sozlamalar
"settings":{"shop_name":"Moda Do'kon","theme":"light"}