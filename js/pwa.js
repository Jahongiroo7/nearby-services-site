// Nearby Services: internetsiz ishlash va telefonga o'rnatish
(() => {
"use strict";
if (!("serviceWorker" in navigator)) return;
const ok = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
if (!ok) return;
addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
})();
