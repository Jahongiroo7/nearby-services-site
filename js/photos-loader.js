// Nearby Services — rasmlar (1,7 MB) sahifa ochilgandan keyin, bo'sh vaqtda yuklanadi
(() => {
"use strict";
function load() {
  const s = document.createElement("script");
  s.src = "js/data/photos.js?v=1.0.6";
  s.async = true;
  s.onload = () => dispatchEvent(new Event("ns-photos"));
  document.head.appendChild(s);
}
function go() { if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 1200); }
if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
})();
