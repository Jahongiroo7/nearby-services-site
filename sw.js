/* Nearby Services: internetsiz ishlash (service worker)
   - ilova fayllari birinchi ochilishda saqlanadi, keyin internetsiz ham ochiladi
   - index.html: avval tarmoq, bo'lmasa saqlangani; qolgan fayllar: avval saqlangani */
const VER = "ns-v25";
const SHELL = ["./", "index.html", "css/style.css?v=1.0.61", "favicon.svg", "manifest.webmanifest", "fonts/fonts.css"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // tashqi manzillar (Google Maps va b.) tegilmaydi
  if (/\/video\//.test(url.pathname)) return;           // katta video saqlanmaydi
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    const key = /admin(\.html)?$/.test(url.pathname) ? "admin.html" : "index.html";
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VER).then(c => c.put(key, copy)); } return r; })
      .catch(() => caches.match(key).then(r => r || caches.match("index.html") || caches.match("./"))));

    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VER).then(c => c.put(req, copy)); }
    return r;
  })));
});
