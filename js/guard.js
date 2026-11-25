/* Xatolardan himoya: kutilmagan xato sayt ishlashini to'xtatmasin, xatolar eslab qolinsin,
   sayt umuman ochilmasa foydalanuvchiga "Yangilash" tugmasi ko'rinsin. */
(function(){
  "use strict";
  var KEY="ns_errlog";
  function save(msg){
    try{
      var a=JSON.parse(localStorage.getItem(KEY)||"[]");
      a.push({t:new Date().toISOString(),m:String(msg).slice(0,300)});
      localStorage.setItem(KEY,JSON.stringify(a.slice(-20)));
    }catch(e){}
  }
  addEventListener("error",function(e){ save((e&&e.message||"xato")+" @"+String(e&&e.filename||"").split("/").pop()+":"+(e&&e.lineno||0)); });
  addEventListener("unhandledrejection",function(e){ save("promise: "+(e&&e.reason&&e.reason.message||e&&e.reason||"xato")); });
  function banner(){
    if(document.getElementById("ns-guard")) return;
    var d=document.createElement("div"); d.id="ns-guard"; d.setAttribute("role","alert");
    d.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;padding:14px 16px;border-radius:14px;background:#0b1b45;color:#fff;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.4);display:flex;gap:12px;align-items:center;justify-content:space-between";
    d.innerHTML='<span>Sahifa to‘liq yuklanmadi. Internetni tekshirib, qayta yuklang.</span>';
    var b=document.createElement("button"); b.type="button"; b.textContent="Yangilash";
    b.style.cssText="border:0;border-radius:10px;padding:10px 16px;background:#1951fc;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer";
    b.onclick=function(){
      try{ if(navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){r.unregister();}); }); if(window.caches) caches.keys().then(function(ks){ ks.forEach(function(k){caches.delete(k);}); }); }catch(e){}
      setTimeout(function(){ location.reload(); },300);
    };
    d.appendChild(b); document.body.appendChild(d);
  }
  addEventListener("load",function(){
    setTimeout(function(){
      var ok=document.querySelector(".card,.pnl:not([hidden])");
      if(!ok) banner();
    },10000);
  });
})();
