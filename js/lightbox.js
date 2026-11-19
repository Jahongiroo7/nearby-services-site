// Nearby Services — rasmni bosganda butun ekranga ochish
(() => {
"use strict";
let box = null, items = [], idx = 0, lastFocus = null, sx = 0;

function build() {
  box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Rasm");
  box.innerHTML =
    '<button type="button" class="lb-x" aria-label="Yopish">×</button>' +
    '<button type="button" class="lb-n lb-prev" aria-label="Oldingi rasm">‹</button>' +
    '<div class="lb-stage"></div>' +
    '<button type="button" class="lb-n lb-next" aria-label="Keyingi rasm">›</button>' +
    '<div class="lb-cnt" aria-live="polite"></div>';
  document.body.appendChild(box);
  box.addEventListener("click", e => {
    if (e.target.closest(".lb-x") || e.target === box || e.target.classList.contains("lb-stage")) close();
    else if (e.target.closest(".lb-prev")) step(-1);
    else if (e.target.closest(".lb-next")) step(1);
  });
  box.addEventListener("touchstart", e => { sx = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function show() {
  const el = items[idx], st = box.querySelector(".lb-stage");
  st.textContent = "";
  let n;
  if (el.tagName === "IMG") {
    n = document.createElement("img");
    n.src = el.currentSrc || el.src;
    n.alt = el.alt || "";
  } else {
    n = el.cloneNode(true);
    n.removeAttribute("width");
    n.removeAttribute("height");
  }
  st.appendChild(n);
  const many = items.length > 1;
  box.querySelector(".lb-prev").hidden = !many;
  box.querySelector(".lb-next").hidden = !many;
  box.querySelector(".lb-cnt").textContent = many ? (idx + 1) + " / " + items.length : "";
}

function step(d) {
  if (items.length < 2) return;
  idx = (idx + d + items.length) % items.length;
  show();
}

function open(fig) {
  if (!box) build();
  const gal = fig.closest(".gallery");
  items = [...gal.querySelectorAll("figure")].map(f => f.querySelector("img,svg")).filter(Boolean);
  idx = Math.max(0, items.indexOf(fig.querySelector("img,svg")));
  lastFocus = document.activeElement;
  show();
  box.hidden = false;
  document.documentElement.classList.add("lb-open");
  box.querySelector(".lb-x").focus({ preventScroll: true });
}

function close() {
  if (!box || box.hidden) return;
  box.hidden = true;
  box.querySelector(".lb-stage").textContent = "";
  document.documentElement.classList.remove("lb-open");
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
}

document.addEventListener("click", e => {
  if (e.target.closest("a, button")) return;
  const fig = e.target.closest(".gallery figure");
  if (fig && fig.querySelector("img,svg")) open(fig);
});

document.addEventListener("keydown", e => {
  if (!box || box.hidden) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  else if (e.key === "ArrowLeft") { e.stopImmediatePropagation(); step(-1); }
  else if (e.key === "ArrowRight") { e.stopImmediatePropagation(); step(1); }
}, true);
})();
