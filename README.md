# Nearby Services

Toshkent va butun O'zbekiston bo'yicha yaqin atrofdagi xizmatlar va jamoat joylari xaritasi.
Oddiy HTML, CSS va JavaScript. Backend, o'rnatish va build kerak emas: faqat statik fayllar.

## Serverga joylash (qisqa)

1. **Papkaning ichidagi hamma narsani** serverning ildiz papkasiga (public_html, www, /var/www/...) yuklang. `index.html` ildizda turishi kerak.
2. **HTTPS yoqing.** Joylashuvni aniqlash ("Joylashuvimni aniqlash") faqat HTTPS orqali ishlaydi.
3. Hosting turiga qarab sozlama faylini ishlating (ichiga kesh, siqish va xavfsizlik sarlavhalari yozilgan):

| Hosting | Fayl |
|---|---|
| Netlify, Cloudflare Pages | `_headers` (tayyor) |
| Vercel | `vercel.json` (tayyor) |
| Apache / oddiy hosting (cPanel) | `.htaccess` (tayyor) |
| Nginx (VPS) | `server/nginx.conf.example` ni nusxalab, domeningizni yozing |
| GitHub Pages | alohida sozlama kerak emas |

`server/` papkasi va `video/` papkasini hosting uchun yuklash shart emas (video kerak bo'lmasa).

## Joylashdan keyin tekshiring

- Sayt ochiladi va xarita chiqadi (birinchi yuklanishda ~8 MB ma'lumot, siqilgach ~3,5 MB, shriftlar bilan).
- Brauzer konsolida (F12) xato yo'q.
- Telefonda pastki panel tortiladi.
- `https://domeningiz/yoq-sahifa` 404 sahifasini ko'rsatadi.

## Ishga tushirish (kompyuterda)

`index.html` ni ikki marta bosing. Yoki lokal server bilan:

    cd nearby-services
    python3 -m http.server 8000      # so'ng http://localhost:8000

## Papka tuzilishi

    index.html              sahifa tuzilishi
    css/style.css           barcha uslublar (kunduzgi/tungi rejim, telefon paneli)
    js/app.js               asosiy dastur: xarita, filtrlar, qidiruv, tillar
    js/data/*.js            xarita (osm), rasmlar (photos), tarjimalar (i18n), chegaralar (bounds)
    fonts/                  Inter va Manrope shriftlari (o'z serveringizdan beriladi, Google'ga so'rov yo'q)
    favicon.svg, manifest.webmanifest, robots.txt, 404.html
    _headers, vercel.json, .htaccess, server/   hosting sozlamalari
    video/                  tushuntiruvchi video (MP4), subtitr (SRT), interaktiv HTML

## Internetsiz ishlash va telefonga o'rnatish

Sayt birinchi ochilgandan keyin (HTTPS orqali) internetsiz ham ochiladi: `sw.js` ilova fayllarini va xarita ma'lumotlarini brauzerda saqlaydi. Telefonda brauzer menyusidan "Bosh ekranga qo'shish" orqali ilova kabi o'rnatiladi. Fayllarni yangilasangiz, `sw.js` ichidagi `VER` qiymatini ham oshiring (masalan `ns-v2`), aks holda eski nusxa ko'rinishi mumkin.

## Kodni o'zgartirsangiz

`index.html` ichida fayllar `?v=1.0.0` bilan ulangan. `css/` yoki `js/` fayllarini o'zgartirgach, `index.html` da shu raqamni oshiring (masalan `?v=1.0.1`), aks holda foydalanuvchilar eski keshni ko'radi.

## Maxfiylik va xavfsizlik

- Tashqi kutubxona, reklama va kuzatuv yo'q. Faqat "Yo'nalish" tugmasi Google Maps yoki Yandex Maps'ni ochadi.
- Joylashuv faqat foydalanuvchi tugmani bossa so'raladi va serverga yuborilmaydi.
- Content-Security-Policy yoqilgan: faqat o'z fayllaringizdan skript va shrift yuklanadi.

Xarita ma'lumotlari: © OpenStreetMap hissadorlari.

## Render.com'ga joylash

1. Shu papka ichidagi fayllarni (papkaning o'zini emas) yangi GitHub repozitoriyaga yuklang.
2. render.com → **New +** → **Blueprint** → repozitoriyani tanlang. `render.yaml` o'zi hamma narsani sozlaydi.
   Yoki **New +** → **Static Site**: Build Command bo'sh, Publish Directory `.`
3. **Deploy** bosing. Sayt `https://nearby-services.onrender.com` ko'rinishidagi HTTPS manzilda chiqadi.
