// Nearby Services — asosiy dastur kodi
(() => {
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ic = n => `<svg class="i" aria-hidden="true"><use href="#ic-${n}"/></svg>`;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- dunyo koordinatalari (metr), 24 x 18 km ---------- */
const W = 24000, H = 18000;
const ORIGIN = {x:12000, y:9000, lat:41.3111, lng:69.2797};
const toLatLng = (x,y) => ({lat: ORIGIN.lat - (y-ORIGIN.y)/111000, lng: ORIGIN.lng + (x-ORIGIN.x)/83900});
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);   // dunyo koordinatalarida tekis masofa (faqat geometriya uchun)
/* Foydalanuvchiga ko'rsatiladigan masofa: xarita nuqtalari avval haqiqiy kenglik/uzunlikka qaytariladi, so'ng haversine.
   Tekis xarita hisobi Toshkentdan uzoqda 5% gacha adashadi. */
const EARTH_R=6371008.8, RAD=Math.PI/180;
function gdist(a,b){
  const la1=(ORIGIN.lat-(a.y-ORIGIN.y)/111000)*RAD, la2=(ORIGIN.lat-(b.y-ORIGIN.y)/111000)*RAD;
  const dlo=(b.x-a.x)/83900*RAD, dla=la2-la1;
  const h=Math.sin(dla/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dlo/2)**2;
  return 2*EARTH_R*Math.asin(Math.min(1,Math.sqrt(h)));
}

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(20261022);
const pick = a => a[Math.floor(rnd()*a.length)];
const range = (a,b) => a + rnd()*(b-a);

const DISTRICTS = [
  {name:"Yunusobod",x:12900,y:4300},{name:"Olmazor",x:7600,y:5200},{name:"Shayxontohur",x:8900,y:8300},
  {name:"Mirzo Ulug'bek",x:17200,y:7000},{name:"Mirobod",x:14300,y:10600},{name:"Yakkasaroy",x:11700,y:11900},
  {name:"Chilonzor",x:7200,y:12300},{name:"Uchtepa",x:3600,y:10600},{name:"Yashnobod",x:18600,y:11900},
  {name:"Sergeli",x:10600,y:16300},{name:"Bektemir",x:21000,y:15600},{name:"Yangihayot",x:5600,y:16200}
];
function ellipsePts(cx,cy,rx,ry,n){const p=[];for(let i=0;i<=n;i++){const t=i/n*Math.PI*2;p.push([Math.round(cx+rx*Math.cos(t)),Math.round(cy+ry*Math.sin(t))]);}return p;}
const ROADS = [
  {name:"Amir Temur shoh ko'chasi",major:true,label:true,pts:[[12000,9000],[12250,6500],[12600,3800],[12900,1200],[13000,-300]]},
  {name:"Shota Rustaveli ko'chasi",major:false,label:true,pts:[[12100,9150],[12400,11500],[12700,13200],[13100,18300]]},
  {name:"Bunyodkor shoh ko'chasi",major:true,label:true,pts:[[11400,9800],[9600,11200],[7400,12600],[4600,14300],[-300,16800]]},
  {name:"Mustaqillik shoh ko'chasi",major:true,label:true,pts:[[12300,8800],[14500,7900],[17300,6600],[20200,5200],[24300,3600]]},
  {name:"Navoiy ko'chasi",major:false,label:true,pts:[[11800,8900],[10000,8500],[8000,7900],[5600,7600],[2400,7500],[-300,7600]]},
  {name:"Farg'ona yo'li",major:true,label:true,pts:[[12600,9500],[14800,11000],[17400,12700],[20300,14700],[24300,17000]]},
  {name:"Labzak ko'chasi",major:false,label:true,pts:[[8800,5400],[10700,6700],[12250,7600]]},
  {name:"Qatortol ko'chasi",major:false,label:true,pts:[[6900,9000],[6600,12500],[6300,16800]]},
  {name:"Osiyo ko'chasi",major:false,label:true,pts:[[15200,2800],[15600,6800],[15900,10800],[16400,14800]]},
  {name:"Kichik halqa yo'li",major:false,label:false,pts:ellipsePts(11900,9100,4300,3600,56)},
  {name:"Katta halqa yo'li",major:true,label:false,pts:ellipsePts(12000,9300,10200,7600,80)}
];
const WATER = [
  {name:"Anhor kanali",pts:[[10300,-300],[10900,2500],[11300,5200],[11500,7600],[11650,9200],[11900,11200],[12500,13700],[13700,16300],[14400,18300]]},
  {name:"Bo'zsuv kanali",pts:[[5800,-300],[6600,3000],[7300,6200],[7900,9400],[8500,12800],[9200,15800],[9800,18300]]},
  {name:"Salor kanali",pts:[[16000,-300],[16600,3000],[17200,6000],[18300,9000],[19600,12500],[21200,18300]]}
];
const PARKS = [
  [12000,9000,270,250,0],[12900,5750,360,260,-10],[13900,4900,720,480,15],[13250,9700,430,250,-20],
  [13700,11300,620,420,10],[10500,10600,460,330,0],[16800,8200,500,300,25],[5200,9800,520,340,-15],[19400,10100,420,300,0]
];

/* ---------- toifalar ---------- */
const CATS = {
  barber:{label:"Sartaroshxona",color:"#4f46e5"},
  shop:{label:"Do'kon",color:"#db2777"},
  food:{label:"Oziq-ovqat",color:"#ea580c"},
  pharm:{label:"Dorixona",color:"#16a34a"},
  auto:{label:"Avtoservis",color:"#57534e"},
  repair:{label:"Maishiy ta'mir",color:"#7c3aed"}
};
const CAT_KEYS = Object.keys(CATS);
const PTYPES = {
  gov:{label:"Davlat tashkilotlari",one:"Davlat tashkiloti",color:"#1e3a8a",hours:"Du–Ju, 09:00–18:00"},
  park:{label:"Parklar",one:"Park",color:"#4d7c0f",hours:"Har kuni, 07:00–23:00"},
  tour:{label:"Turistik joylar",one:"Turistik joy",color:"#b45309",hours:"Har kuni, 09:00–20:00"},
  school:{label:"Maktablar",one:"Maktab",color:"#0369a1",hours:"Du–Sh, 08:00–18:00"},
  kinder:{label:"Bog'chalar",one:"Bog'cha (DMTT)",color:"#c026d3",hours:"Du–Ju, 07:00–19:00"},
  airport:{label:"Aeroport",one:"Aeroport",color:"#334155",hours:"Har kuni, 24 soat"},
  museum:{label:"Muzeylar",one:"Muzey",color:"#7f1d1d",hours:"Se–Ya, 10:00–17:00"}
};
const DAYS = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const DAYS_FULL = ["dushanba","seshanba","chorshanba","payshanba","juma","shanba","yakshanba"];
const ALL=[0,1,2,3,4,5,6], WK=[0,1,2,3,4,5];

const NAMES = {
  barber:["Usta Barber","Sharq sartaroshxonasi","Kamalak barbershop","Javohir sartaroshxonasi","Klassik erkaklar","Oydin go'zallik saloni","Shox Barber","Ustoz Hair Studio","Navbahor sartaroshxonasi","Qaychi va ustara","Yangi Uslub","Bek Barber"],
  shop:["Baraka do'koni","Mahalla market","Kundalik 24","Xonadon savdo","Oila market","Nur do'koni","Yangi Kun minimarket","Do'stlik savdo","Tejamkor","Bozorcha","Orzu market","Saxovat do'koni"],
  food:["Bahor choyxonasi","Somsa uyi","Lazzat oshxonasi","Tandir non","Milliy taomlar","Sharq kafesi","Palov markazi","Mazali lavash","Qozon kabob","Tushlik vaqti","Shirin non","Do'mbira kafe"],
  pharm:["Shifo dorixonasi","Salomatlik","Dori-Darmon 24","Malham dorixonasi","Sog'lom oila","Davo dorixonasi","Hayot dorixonasi","Malhambaxsh","Sihat","Tabib"],
  auto:["Usta Avto","Tez shina","Motor servis","Avto Yordam","Moy almashtirish nuqtasi","G'ildirak ustaxonasi","Avto Diagnostika","Kuzov ustasi","Yo'lchi servis","Tormoz markazi"],
  repair:["Telefon ustasi","Poyabzal ta'miri","Soat ustaxonasi","Kalit va qulf","Maishiy texnika ta'miri","Tikuvchilik ustaxonasi","Kompyuter servis","Muzlatkich ustasi","Elektrik usta","Mebel ta'miri"]
};
const DESCS = {
  barber:["Erkaklar va bolalar uchun soch olish, soqol dizayni. Oldindan yozilish mumkin.","Klassik va zamonaviy soch turmaklari, issiq sochiq bilan soqol olish."],
  shop:["Kundalik oziq-ovqat, ichimliklar, maishiy kimyo. Kartadan to'lov qabul qilinadi.","Yangi non har kuni ertalab, sut mahsulotlari va meva-sabzavot."],
  food:["Milliy taomlar, tushlik menyusi. Olib ketish va yetkazib berish bor.","Tandir somsa, palov, sho'rva. Oilaviy xonalar mavjud."],
  pharm:["Retseptli va retseptsiz dorilar, tibbiy buyumlar. Farmatsevt maslahati.","Dorilar, vitaminlar, bolalar uchun mahsulotlar."],
  auto:["Moy almashtirish, diagnostika, yurish qismi ta'miri.","Shina montaji, balansirovka, tormoz tizimi."],
  repair:["Telefon, planshet va noutbuk ta'miri. Ehtiyot qismlar joyida.","Tez va kafolatli ta'mir, narx oldindan aytiladi."]
};
const PRICES = {
  barber:[["Erkaklar soch olishi",35000,60000],["Soqol olish",20000,35000],["Bolalar soch olishi",25000,40000]],
  shop:[["Non (dona)",3000,4500],["Sut, 1 litr",11000,14000],["Tuxum, 10 dona",15000,19000]],
  food:[["Osh (porsiya)",35000,50000],["Somsa (dona)",7000,10000],["Lag'mon",30000,42000]],
  pharm:[["Paratsetamol, 10 tabletka",4000,7000],["Tibbiy niqob, 10 dona",8000,12000],["Termometr",25000,45000]],
  auto:[["Moy almashtirish (ish haqi)",50000,90000],["Shina montaji, 4 dona",80000,140000],["Kompyuter diagnostikasi",100000,180000]],
  repair:[["Telefon ekranini almashtirish",250000,600000],["Poyabzal tagini almashtirish",60000,120000],["Kalit nusxasi",15000,30000]]
};
const REVIEWS = {
  barber:{pos:["Usta juda e'tiborli, soch olish 20 daqiqada tayyor bo'ldi.","Navbat tez yurdi, narxi ham mos.","Doim shu yerga kelaman, soqolni juda toza olishadi."],mid:["Yaxshi, lekin dam olish kunlari navbat uzun."],neg:["Yozilgan vaqtimda 30 daqiqa kutib qoldim."]},
  shop:{pos:["Mahsulotlar yangi, kassada kutish yo'q.","Narxlar atrofdagi do'konlardan arzonroq.","Kech soatlarda ham ochiq, juda qulay."],mid:["Assortiment yomon emas, lekin kechqurun non tugab qoladi."],neg:["Bir mahsulotning muddati o'tgan ekan, tekshirib oling."]},
  food:{pos:["Palovi zo'r, porsiya katta.","Somsa issiq va mazali, xizmat tez.","Oila bilan kelish uchun qulay joy."],mid:["Taom yaxshi, ammo tushlikda joy topish qiyin."],neg:["Buyurtma 40 daqiqa kechikdi."]},
  pharm:{pos:["Farmatsevt yaxshi maslahat berdi.","Kerakli dorilar doim bor.","Tunda ham yordam berishdi, rahmat."],mid:["Narxlar biroz qimmatroq."],neg:["Retseptdagi dori yo'q ekan, boshqa joyga bordim."]},
  auto:{pos:["Moy almashtirish 15 daqiqada tugadi.","Usta muammoni tez topdi, ortiqcha pul so'ramadi.","Shina montaji sifatli."],mid:["Ish yaxshi, lekin oldindan yozilish kerak."],neg:["Aytilgan vaqtda tayyor bo'lmadi."]},
  repair:{pos:["Telefon ekranini bir kunda almashtirib berishdi.","Poyabzalni yangidek qilib berishdi.","Narxi oldindan aytildi, keyin oshmadi."],mid:["Sifat yaxshi, lekin 3 kun kutdim."],neg:["Ta'mirdan keyin muammo yana takrorlandi."]}
};
const PEOPLE = ["Dilnoza R.","Jasur T.","Malika A.","Sardor X.","Nodira S.","Bekzod M.","Gulnora Q.","Otabek N.","Shahzoda U.","Aziz K.","Madina Y.","Javlon E.","Feruza B.","Sherzod I.","Kamola O.","Doniyor F."];
const MAHALLA = ["Bodomzor","Navbahor","Do'stlik","Mehrjon","Bog'ishamol","Ko'kcha","Beshyog'och","Qoratosh","Nurafshon","Guliston","Olmazor","Ziyokor","Tinchlik","Istiqlol"];
const HOURS = {
  barber:()=>({open:pick(["09:00","10:00"]),close:pick(["20:00","21:00"]),days:rnd()<.5?ALL:WK}),
  shop:()=>rnd()<.25?{h24:true,days:ALL}:{open:"07:00",close:pick(["22:00","23:00"]),days:ALL},
  food:()=>({open:pick(["08:00","09:00","11:00"]),close:pick(["22:00","23:00"]),days:ALL}),
  pharm:()=>rnd()<.3?{h24:true,days:ALL}:{open:"08:00",close:"22:00",days:ALL},
  auto:()=>({open:"09:00",close:pick(["18:00","19:00"]),days:WK}),
  repair:()=>({open:"10:00",close:"19:00",days:WK})
};

/* ---------- geometriya ---------- */
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const t=clamp(((px-ax)*dx+(py-ay)*dy)/((dx*dx+dy*dy)||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
/* ---------- Toshkent markazi: OpenStreetMap ma'lumotlari (fayl ichiga joylangan — tashqi so'rov, kutish yo'q) ---------- */
const REAL=(()=>{try{return (window.NS_DATA&&window.NS_DATA.osm)||null;}catch(e){return null;}})();
const decPts=a=>{const p=[[a[0],a[1]]];for(let i=2;i<a.length;i+=2){const l=p[p.length-1];p.push([l[0]+a[i],l[1]+a[i+1]]);}return p;};
const REAL_AREAS=REAL?REAL.areas.filter(a=>a.r.length||(a.b&&a.b.length)):[];
// kichik hudud (masalan, Toshkent markazi) katta hududdan (butun Toshkent) ustun turadi — ro'yxatda keyinroq
function realAreaAt(x,y){for(let i=REAL_AREAS.length-1;i>=0;i--){const b=REAL_AREAS[i].bbox;if(x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3])return REAL_AREAS[i];}return null;}
function areaNamed(a){ if(!a._named) a._named=a.r.filter(r=>r[1]>=0&&r[0]!=="foot").map(r=>({name:REAL.names[r[1]],cls:r[0],pts:decPts(r[2])})); return a._named; }
function nearestRoad(x,y){let best={dist:Infinity,road:null};
  const area=realAreaAt(x,y);
  if(area){ // haqiqiy hududda — faqat haqiqiy ko'cha nomlari
    for(const r of areaNamed(area)){for(let i=0;i<r.pts.length-1;i++){const d=segDist(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(d<best.dist)best={dist:d,road:r};}}
    if(best.road) return best;
  }
  for(const r of ROADS){for(let i=0;i<r.pts.length-1;i++){const d=segDist(x,y,r.pts[i][0],r.pts[i][1],r.pts[i+1][0],r.pts[i+1][1]);if(d<best.dist)best={dist:d,road:r};}}return best;}
/* ---------- Haqiqiy ko'chalar bo'yicha yo'l topish (A*) ----------
   Graf OSM ko'chalaridan yig'iladi (chorrahalar yo'lning umumiy nuqtalari). Piyoda: barcha yo'llar, 4,8 km/soat.
   Mashinada: yo'l toifasiga qarab shahar ichidagi o'rtacha tezlik. Bir tomonlama harakat va svetoforlar hisobga olinmagan. */
const WALK_MS=4.8/3.6;
const CAR_MS={major:42/3.6,sec:34/3.6,ter:28/3.6,min:22/3.6,svc:12/3.6};
const JUNCTION_S=7; // chorrahada o'rtacha kechikish (svetofor, burilish), faqat mashinada
class MinHeap{constructor(){this.a=[];}
  push(f,n){const a=this.a;a.push([f,n]);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m;}}return top;}
  get size(){return this.a.length;}}
function* graphGen(area){
  if(area._g) return area._g;
  const idx=new Map(), X=[], Y=[], adj=[], EI=[], EJ=[], EL=[], EC=[], C=100, cells=new Map();
  const node=(x,y)=>{const k=(x+2000000)*4194304+(y+2000000);let i=idx.get(k);if(i===undefined){i=X.length;idx.set(k,i);X.push(x);Y.push(y);adj.push([]);}return i;};
  let gn=0;
  for(const r of area.r){ if((++gn&255)===0) yield; const cls=r[0]; if(cls==="rail") continue; const p=decPts(r[2]);
    for(let t=0;t<p.length-1;t++){
      const i=node(p[t][0],p[t][1]), j=node(p[t+1][0],p[t+1][1]); if(i===j) continue;
      const len=Math.hypot(p[t+1][0]-p[t][0],p[t+1][1]-p[t][1]), e=EI.length;
      EI.push(i);EJ.push(j);EL.push(len);EC.push(cls);adj[i].push(e);adj[j].push(e);
      const n=Math.max(1,Math.ceil(len/40)); let last=null;
      for(let q=0;q<=n;q++){const x=p[t][0]+(p[t+1][0]-p[t][0])*q/n,y=p[t][1]+(p[t+1][1]-p[t][1])*q/n,k=Math.floor(x/C)*100003+Math.floor(y/C);
        if(k===last) continue; last=k; (cells.get(k)||cells.set(k,[]).get(k)).push(e);} } }
  return area._g={X,Y,adj,EI,EJ,EL,EC,C,cells};
}
function graphOf(area){ if(area._g) return area._g; const it=graphGen(area); let r; while(!(r=it.next()).done); return r.value; }
// og'ir hisoblash bo'sh vaqtda ~8 ms lik bo'laklarda bajariladi (sahifa qotmaydi)
function stepGen(it,done){ const run=()=>{ const dl=performance.now()+8; let r; do{ r=it.next(); }while(!r.done&&performance.now()<dl); if(r.done){ if(done) done(r.value); } else idle(run); }; idle(run); }
function snapTo(G,x,y,carOnly){
  const C=G.C, cx=Math.floor(x/C), cy=Math.floor(y/C); let best=null;
  for(let r=0;r<=6;r++){
    for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++){ if(Math.max(Math.abs(i),Math.abs(j))!==r) continue;
      const arr=G.cells.get((cx+i)*100003+(cy+j)); if(!arr) continue;
      for(const e of arr){ if(carOnly&&G.EC[e]==="foot") continue;
        const ax=G.X[G.EI[e]],ay=G.Y[G.EI[e]],bx=G.X[G.EJ[e]],by=G.Y[G.EJ[e]],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,
          t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/L2)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);
        if(!best||d<best.d) best={e,t,px,py,d}; } }
    if(best&&best.d<=r*C) break; }
  return best&&best.d<500?best:null;
}
function solveRoute(G,S,T,mode,a,b){
  const SP=G.speeds||CAR_MS, speed=e=>mode==="walk"?WALK_MS:(SP[G.EC[e]]||SP.min||CAR_MS.min);
  const allowed=e=>mode==="walk"||G.EC[e]!=="foot";
  if(!allowed(S.e)||!allowed(T.e)) return null;
  const vmax=mode==="walk"?WALK_MS:Math.max(...Object.values(SP)), heap=new MinHeap(), NN=G.X.length, gc=new Float64Array(NN).fill(Infinity), pnA=new Int32Array(NN).fill(-2), peA=new Int32Array(NN);
  const relax=(n,c,pn,pe)=>{ if(c<gc[n]){ gc[n]=c; pnA[n]=pn; peA[n]=pe; heap.push(c+Math.hypot(G.X[n]-T.px,G.Y[n]-T.py)/vmax,n); } };
  const sl=G.EL[S.e], tl=G.EL[T.e], sv=speed(S.e), tv=speed(T.e);
  relax(G.EI[S.e],S.t*sl/sv,-1,S.e); relax(G.EJ[S.e],(1-S.t)*sl/sv,-1,S.e);
  let best=Infinity, bestNode=-1;
  if(S.e===T.e){ best=Math.abs(S.t-T.t)*sl/sv; }   // bir xil yo'l bo'lagida: to'g'ridan-to'g'ri
  while(heap.size){
    const [f,n]=heap.pop(), g=gc[n], h=Math.hypot(G.X[n]-T.px,G.Y[n]-T.py)/vmax;
    if(f-h>g+1e-6) continue;           // eskirgan yozuv
    if(f>=best) break;
    if(n===G.EI[T.e]){ const c=g+T.t*tl/tv; if(c<best){best=c;bestNode=n;} }
    if(n===G.EJ[T.e]){ const c=g+(1-T.t)*tl/tv; if(c<best){best=c;bestNode=n;} }
    for(const e of G.adj[n]){ if(!allowed(e)) continue; const m=G.EI[e]===n?G.EJ[e]:G.EI[e]; relax(m,g+G.EL[e]/speed(e)+(mode==='drive'&&G.adj[m].length>=3?JUNCTION_S:0),n,e); }
  }
  if(best===Infinity) return null;
  const pts=[[a.x,a.y],[S.px,S.py]];
  if(bestNode>=0){ const nodes=[]; let n=bestNode; for(;;){ nodes.push(n); const pn=pnA[n]; if(pn<0) break; n=pn; }
    nodes.reverse().forEach(i=>pts.push([G.X[i],G.Y[i]])); }
  pts.push([T.px,T.py],[b.x,b.y]);
  let len=0; for(let i=0;i<pts.length-1;i++) len+=gdist({x:pts[i][0],y:pts[i][1]},{x:pts[i+1][0],y:pts[i+1][1]});
  const off=(S.d+T.d)/WALK_MS; // nuqtadan ko'chagacha piyoda
  return {len,min:(best+off)/60,pts};
}
const routeCache=new Map();
/* Shaharlararo yo'l: magistral va viloyatlararo yo'llar (REAL.hw + links) grafi. Boshlang'ich va oxirgi nuqta eng yaqin yo'lga
   to'g'ri chiziq bilan ulanadi (shahar ichida ~30 km/soat, 1.3x egri). Yo'l topilmasa taxminiy hisob qoladi. */
let HWG=null, hwStarted=false;
function* hwGen(){
  const r=[]; for(const h of REAL.hw) r.push([h[0]==="major"?"major":"sec",-1,h[1]]); for(const l of (REAL.links||[])) r.push(["sec",-1,l]);
  // shahar hududlaridagi asosiy yo'llar: magistrallarni shahar ichida ulaydi
  for(const z of REAL_AREAS) for(const q of z.r) if(q[0]==="major"||q[0]==="sec"||q[0]==="ter") r.push([q[0],-1,q[2]]);
  yield;
  const G=yield* graphGen({r}); G.speeds={major:85/3.6,sec:62/3.6,ter:50/3.6,min:40/3.6};
  // aniq tutashmagan yaqin uchlarni ulash (<=700 m): bo'laklar birlashadi
  const n=G.X.length, par=new Int32Array(n); for(let i=0;i<n;i++) par[i]=i;
  const find=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
  for(let e=0;e<G.EI.length;e++){ const a=find(G.EI[e]),b=find(G.EJ[e]); if(a!==b) par[a]=b; }
  const CS=700, grid=new Map(), gk=(x,y)=>Math.floor(x/CS)*100003+Math.floor(y/CS);
  for(let i=0;i<n;i++){ const k=gk(G.X[i],G.Y[i]); (grid.get(k)||grid.set(k,[]).get(k)).push(i); }
  yield;
  const deg=i=>G.adj[i].length;
  for(let i=0;i<n;i++){ if((i&4095)===0) yield; if(deg(i)>2) continue;   // faqat uchlar (tutashmagan chekkalar)
    const cx=Math.floor(G.X[i]/CS), cy=Math.floor(G.Y[i]/CS); let best=-1,bd=CS*CS;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){ const arr=grid.get((cx+a)*100003+(cy+b)); if(!arr) continue;
      for(const j of arr){ if(find(j)===find(i)) continue; const d=(G.X[j]-G.X[i])**2+(G.Y[j]-G.Y[i])**2; if(d<bd){bd=d;best=j;} } }
    if(best>=0){ const e=G.EI.length; G.EI.push(i); G.EJ.push(best); G.EL.push(Math.sqrt(bd)); G.EC.push("sec"); G.adj[i].push(e); G.adj[best].push(e); par[find(i)]=find(best); } }
  return HWG=G;
}
function startHw(){
  if(hwStarted||!REAL||!REAL.hw) return; hwStarted=true;
  stepGen(hwGen(),()=>{ routeCache.clear(); try{ renderOverlays(); }catch(e){} });   // tayyor bo'lgach tanlangan marshrut yo'l bo'ylab qayta chiziladi
}
function snapFar(G,p){
  let best=null;
  for(let e=0;e<G.EI.length;e++){
    const ax=G.X[G.EI[e]],ay=G.Y[G.EI[e]],bx=G.X[G.EJ[e]],by=G.Y[G.EJ[e]],dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,
      t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/L2)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(p.x-px,p.y-py);
    if(!best||d<best.d) best={e,t,px,py,d}; }
  return best&&best.d<60000?best:null;
}
function farRoute(a,b){
  try{
    const G=HWG; if(!G){ startHw(); return null; }
    const S=snapFar(G,a), T=snapFar(G,b); if(!S||!T) return null;
    const acc=S.d+T.d; S.d=0; T.d=0;
    const r=solveRoute(G,S,T,"drive",a,b); if(!r) return null;
    r.len+=acc*.3; r.min+=acc*1.3/(30/3.6)/60;
    return {walk:null,drive:r,far:true};
  }catch(e){ return null; }
}
function getRoute(a,b){
  const key=`${a.x},${a.y}>${b.x},${b.y}`; if(routeCache.has(key)) return routeCache.get(key);
  let res=null;
  if(REAL&&gdist(a,b)<30000){
    // ikkala nuqtani qamrab oladigan eng kichik haqiqiy hudud
    let area=null;
    for(const z of REAL_AREAS){ const bb=z.bbox;
      if(a.x>=bb[0]&&a.x<=bb[2]&&a.y>=bb[1]&&a.y<=bb[3]&&b.x>=bb[0]&&b.x<=bb[2]&&b.y>=bb[1]&&b.y<=bb[3]&&z.r.length){
        if(!area||(bb[2]-bb[0])*(bb[3]-bb[1])<(area.bbox[2]-area.bbox[0])*(area.bbox[3]-area.bbox[1])) area=z; } }
    if(area){ try{
      const G=graphOf(area), r={};
      for(const mode of ["walk","drive"]){ const S=snapTo(G,a.x,a.y,mode==="drive"), T=snapTo(G,b.x,b.y,mode==="drive"); r[mode]=S&&T?solveRoute(G,S,T,mode,a,b):null; }
      if(r.walk||r.drive) res=r;
    }catch(e){ res=null; } }
  }
  if(!res&&REAL&&REAL.hw){ res=farRoute(a,b); if(!res&&!HWG){ return null; } }   // graf hali qurilmoqda: keshlanmaydi
  routeCache.set(key,res); return res;
}
/* tashqi xaritalarda yo'nalish: bosilgandagina ochiladi, koordinatalar faqat shu havolaga qo'yiladi */
function mapLinks(t){
  const u=toLatLng(state.user.x,state.user.y), d=toLatLng(t.x,t.y), f=v=>v.toFixed(6);
  const g=`https://www.google.com/maps/dir/?api=1&origin=${f(u.lat)},${f(u.lng)}&destination=${f(d.lat)},${f(d.lng)}&travelmode=driving`;
  const y=`https://yandex.com/maps/?rtext=${f(u.lat)},${f(u.lng)}~${f(d.lat)},${f(d.lng)}&rtt=auto`;
  return `<a class="btn mapext g" href="${g}" target="_blank" rel="noopener noreferrer">${ic("map")} Google Maps</a><a class="btn mapext y" href="${y}" target="_blank" rel="noopener noreferrer">${ic("map")} Yandex Maps</a>`;
}
/* Joy haqida rasmlar: tashqi manba bloklanadi, shuning uchun har bir turga 3 ta illyustratsiya sahifaning o'zida chiziladi
   (tashqi ko'rinish, ichki makon, xizmat). Rang va tafsilotlar joyning id'siga qarab o'zgaradi. */
function updGalArrows(g){
  const w=g.parentNode, p=w.querySelector(".prev"), n=w.querySelector(".next"); if(!p||!n) return;
  p.disabled=g.scrollLeft<4; n.disabled=g.scrollLeft+g.clientWidth>=g.scrollWidth-4;
}
document.addEventListener("scroll",e=>{ if(e.target.classList&&e.target.classList.contains("gallery")) updGalArrows(e.target); },true);
/* Haqiqiy fotolar: Wikimedia Commons (erkin litsenziyalar), har tur uchun 4 ta; muallif va litsenziya rasmning ustida ko'rsatiladi */
let PHOTOS=null;
const photosOf=k=>{ if(PHOTOS===null){ try{ PHOTOS=((window.NS_DATA&&window.NS_DATA.photos)||{}); }catch(e){ PHOTOS={}; } } return PHOTOS[k]; };
function photoGallery(key,seedStr){
  const ph=photosOf(key); if(!ph||ph.length<3) return null;
  const off=(parseInt(String(seedStr).replace(/\D/g,""),10)||1)%ph.length, alt=(CATS[key]&&CATS[key].label)||(PTYPES[key]&&PTYPES[key].one)||"";
  const sel=[0,1,2].map(i=>ph[(off+i)%ph.length]);
  return `<div class="galwrap"><div class="gallery" role="group" aria-label="Rasmlar">${sel.map(p=>`<figure><img src="${p.d}" alt="${esc(alt)}" loading="lazy" decoding="async"><a class="credit" href="${esc(p.u)}" target="_blank" rel="noopener noreferrer" title="${esc(p.a)} · ${esc(p.l)} · Wikimedia Commons">© ${esc(p.a)} · ${esc(p.l)}</a></figure>`).join("")}</div>
    <button type="button" class="garrow prev" data-act="gal-prev" aria-label="Oldingi rasm" disabled>${ic("back")}</button>
    <button type="button" class="garrow next" data-act="gal-next" aria-label="Keyingi rasm">${ic("back")}</button></div>
    <p class="gnote">Namunaviy foto (turga mos), Wikimedia Commons</p>`;
}
function galleryHtml(key,color,seedStr){
  const real=photoGallery(key,seedStr); if(real) return real;
  const sd=(parseInt(String(seedStr).replace(/\D/g,""),10)||1)*131, R=i=>hh(sd,i,3), id="gl"+(sd%100000);
  const ico=(x,y,w,c)=>`<svg x="${x}" y="${y}" width="${w}" height="${w}" style="color:${c};fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><use href="#ic-${key}"/></svg>`;
  const defsS=`<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="#0b1a4d"/></linearGradient></defs>`,
    defsW=`<defs><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f1ff"/><stop offset="1" stop-color="#b9cdf0"/></linearGradient></defs>`,
    defsR=`<defs><radialGradient id="${id}r" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#03195b"/></radialGradient></defs>`;
  // 1) tashqi ko'rinish
  const bh=62+R(1)*38, bw=176+R(2)*30, bx=(320-bw)/2, by=138-bh; let far="",win="",tree="";
  for(let i=0;i<6;i++){ const w=28+R(10+i)*26, h=30+R(20+i)*50; far+=`<rect x="${i*56-10+R(30+i)*14}" y="${138-h}" width="${w}" height="${h}" fill="#fff" opacity=".10"/>`; }
  const cols=Math.floor(bw/34), rows=Math.max(1,Math.floor((bh-46)/22));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) win+=`<rect x="${bx+14+c*34}" y="${by+42+r*22}" width="20" height="13" rx="2" fill="#fff" opacity="${(.22+R(40+r*9+c)*.55).toFixed(2)}"/>`;
  for(const tx of [bx-26,bx+bw+26]) tree+=`<rect x="${tx-2}" y="116" width="4" height="22" fill="#0a1538"/><circle cx="${tx}" cy="108" r="${13+R(50)*5}" fill="#2fa56a" opacity=".85"/>`;
  const ext=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsS}<rect width="320" height="180" fill="url(#${id}s)"/><circle cx="${40+R(3)*220}" cy="${28+R(4)*20}" r="14" fill="#fff" opacity=".35"/>${far}
    <rect y="138" width="320" height="42" fill="#07122f"/><rect y="156" width="320" height="3" fill="#fff" opacity=".14"/>
    ${tree}<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${color}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#fff" opacity=".08"/>
    <rect x="${bx+14}" y="${by+8}" width="${bw-28}" height="28" rx="8" fill="#fff"/>${ico(bx+bw/2-11,by+11,22,color)}
    ${win}<rect x="${bx+bw/2-12}" y="116" width="24" height="22" rx="3" fill="#07122f" opacity=".85"/></svg>`;
  // 2) ichki makon
  let shelf="";
  for(let r=0;r<3;r++){ shelf+=`<rect x="22" y="${36+r*34}" width="276" height="4" rx="2" fill="#7d93c4"/>`;
    let x=26; for(let i=0;x<286;i++){ const w=10+R(60+r*20+i)*16, h=12+R(100+r*20+i)*14; shelf+=`<rect x="${x}" y="${36+r*34-h}" width="${w}" height="${h}" rx="2" fill="${R(140+r*20+i)>.55?color:"#fff"}" opacity="${(.55+R(180+r*20+i)*.4).toFixed(2)}"/>`; x+=w+4+R(220+i)*6; } }
  const inn=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsW}<rect width="320" height="180" fill="url(#${id}w)"/>${shelf}
    <rect y="140" width="320" height="40" fill="#8aa3d6"/><rect x="40" y="124" width="240" height="26" rx="8" fill="${color}"/><rect x="40" y="124" width="240" height="8" rx="4" fill="#fff" opacity=".25"/>
    ${[70,160,250].map((x,i)=>`<line x1="${x}" y1="0" x2="${x}" y2="${14+R(240+i)*10}" stroke="#506090" stroke-width="2"/><circle cx="${x}" cy="${20+R(240+i)*10}" r="8" fill="#ffd66b"/>`).join("")}
    ${ico(144,98,32,"#fff")}</svg>`;
  // 3) xizmat
  let dots="";
  for(let i=0;i<14;i++) dots+=`<circle cx="${R(300+i)*320}" cy="${R(320+i)*180}" r="${2+R(340+i)*6}" fill="#fff" opacity="${(.06+R(360+i)*.14).toFixed(2)}"/>`;
  const det=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">${defsR}<rect width="320" height="180" fill="url(#${id}r)"/>${dots}
    <circle cx="160" cy="90" r="64" fill="none" stroke="#fff" opacity=".18" stroke-width="2"/><circle cx="160" cy="90" r="46" fill="#fff" opacity=".12"/>
    <rect x="118" y="48" width="84" height="84" rx="24" fill="#fff" opacity=".95"/>${ico(132,62,56,color)}</svg>`;
  const cap=["Tashqi ko'rinish","Ichki makon","Xizmat"];
  return `<div class="galwrap"><div class="gallery" role="group" aria-label="Rasmlar">${[ext,inn,det].map((svg,i)=>`<figure>${svg}<figcaption>${cap[i]}</figcaption></figure>`).join("")}</div>
    <button type="button" class="garrow prev" data-act="gal-prev" aria-label="Oldingi rasm" disabled>${ic("back")}</button>
    <button type="button" class="garrow next" data-act="gal-next" aria-label="Keyingi rasm">${ic("back")}</button></div>
    <p class="gnote">Namuna illyustratsiya, haqiqiy foto emas</p>`;
}
function routeHtml(t){
  const u=state.user, d=gdist(u,t), rt=getRoute(u,t);
  if(!rt) return `<div>${travelTxt(d)} <span class="muted">(taxminiy: bu masofa uchun yo'l ma'lumoti yo'q)</span></div>`;
  if(rt.far) return `<div class="muted">To'g'ri chiziqda ${fmtKm(d)}</div><div>Mashinada: <b>${fmtKm(rt.drive.len)} · ~${fmtMin(rt.drive.min)}</b></div>`+
    `<div class="muted small">Magistral va viloyatlararo yo'llar bo'yicha; shahar ichidagi qismi taxminiy, tirbandlik hisobga olinmagan.</div>`;
  const line=(label,r,fallback)=>r?`<div>${label}: <b>${fmtKm(r.len)} · ~${fmtMin(r.min)}</b></div>`:`<div>${label}: <span class="muted">${fallback}</span></div>`;
  return `<div class="muted">To'g'ri chiziqda ${fmtKm(d)}</div>`+line("Piyoda",rt.walk,`~${fmtMin(walkMin(d))} (taxminiy)`)+line("Mashinada",rt.drive,`~${fmtMin(driveMin(d))} (taxminiy)`)+
    `<div class="muted small">Haqiqiy ko'chalar bo'yicha hisob; chorrahadagi o'rtacha kechikish bor, tirbandlik va bir tomonlama harakat hisobga olinmagan.</div>`;
}
function nearestDistrict(x,y){let b=DISTRICTS[0],bd=Infinity;for(const d of DISTRICTS){const dd=Math.hypot(d.x-x,d.y-y);if(dd<bd){bd=dd;b=d;}}return b.name;}
function smooth(p){
  let d=`M${p[0][0]},${p[0][1]}`;
  for(let i=0;i<p.length-1;i++){
    const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;
    const c1=[Math.round(p1[0]+(p2[0]-p0[0])/6),Math.round(p1[1]+(p2[1]-p0[1])/6)];
    const c2=[Math.round(p2[0]-(p3[0]-p1[0])/6),Math.round(p2[1]-(p3[1]-p1[1])/6)];
    d+=`C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function addressFor(x,y){
  const r=nearestRoad(x,y);
  if(r.dist<420) return `${r.road.name}, ${1+Math.floor(rnd()*140)}-uy`;
  return `${pick(MAHALLA)} MFY, ${1+Math.floor(rnd()*60)}-uy`;
}

/* ---------- formatlash ---------- */
const fmtKm = m => m<1000 ? `${Math.max(10,Math.round(m/10)*10)} m` : `${(m/1000).toFixed(m<10000?1:0).replace(".",",")} km`;
const fmtR = r => r.toFixed(1).replace(".",",");
const fmtSum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ")+" so'm";
const toMin = t => {const [h,m]=t.split(":").map(Number);return h*60+m;};
function relDays(n){if(n<=0)return"bugun";if(n===1)return"kecha";if(n<7)return`${n} kun oldin`;if(n<30)return`${Math.floor(n/7)} hafta oldin`;return`${Math.floor(n/30)} oy oldin`;}
function daysText(days){
  if(days.length===7) return "Har kuni";
  if(days.join()===WK.join()) return "Du–Sh";
  if(days.join()==="0,1,2,3,4") return "Du–Ju";
  return days.map(d=>DAYS[d]).join(", ");
}
function hoursText(s){ return s.h24 ? "Har kuni, 24 soat" : `${daysText(s.days)}, ${s.open}–${s.close}`; }
function status(s){
  if(s.h24) return {open:true,text:"24/7 ochiq"};
  const now=new Date(), d=(now.getDay()+6)%7, m=now.getHours()*60+now.getMinutes();
  const o=toMin(s.open), c=toMin(s.close);
  if(s.days.includes(d) && m>=o && m<c) return {open:true,text:`Ochiq · ${s.close} gacha`};
  for(let i=0;i<8;i++){
    const dd=(d+i)%7;
    if(!s.days.includes(dd)) continue;
    if(i===0){ if(m<o) return {open:false,text:`Yopiq · ${s.open} da ochiladi`}; continue; }
    return {open:false,text: i===1 ? `Yopiq · ertaga ${s.open} da` : `Yopiq · ${DAYS_FULL[dd]} ${s.open} da`};
  }
  return {open:false,text:"Yopiq"};
}
function starsHtml(n){const r=Math.round(n);return `<span class="stars" aria-label="${fmtR(n)} yulduz">${"★".repeat(r)}<span class="off">${"★".repeat(5-r)}</span></span>`;}
function ratingHtml(s){return s.count ? `<span class="rt"><span class="star">★</span>${fmtR(s.rating)} <span class="muted">(${s.count})</span></span>` : `<span class="pill new">Yangi</span>`;}
/* Yo'l ma'lumoti bo'lmagan uzoq masofalar uchun taxminiy model: yo'l uzunligi to'g'ri chiziqdan ~25-35% ko'p, tezlik masofaga qarab o'zgaradi. */
const roadKm=m=>m*(m<3000?1.35:m<30000?1.3:1.25);
function driveMin(m){const r=roadKm(m)/1000;return (Math.min(r,6)/25+Math.min(Math.max(r-6,0),40)/50+Math.max(r-46,0)/75)*60;}
function walkMin(m){return roadKm(m)/1000/4.8*60;}
function fmtMin(min){
  const t=Math.max(1,Math.round(min));
  if(t<60) return `${t} daq`;
  const h=Math.floor(t/60), r=t%60;
  return r?`${h} soat ${r} daq`:`${h} soat`;
}
function travelTxt(m){
  const base=`${fmtKm(m)} to'g'ri chiziqda · yo'l ~${fmtKm(roadKm(m))}`;
  return m>25000?`${base} · mashinada ~${fmtMin(driveMin(m))}`:`${base} · piyoda ~${fmtMin(walkMin(m))} · mashinada ~${fmtMin(driveMin(m))}`;
}
function travel(m){return {walk:Math.max(1,Math.round(walkMin(m))),car:Math.max(1,Math.round(driveMin(m)))};}

/* ---------- ma'lumotlarni yaratish ---------- */
const usedNames={};
function uniqueName(cat,scope="ts"){
  const u=usedNames[scope]||(usedNames[scope]={});
  const pool=NAMES[cat].filter(n=>!u[n]);
  const base = pool.length ? pick(pool) : pick(NAMES[cat]);
  u[base]=(u[base]||0)+1;
  return u[base]>1 ? `${base} (${u[base]}-filial)` : base;
}
function distFrom(avg){
  const w=[1,2,3,4,5].map(s=>Math.exp(-((s-avg)**2)/1.1)+0.03);
  const t=w.reduce((a,b)=>a+b,0);
  return w.map(x=>x/t);
}
function makeReviews(cat,avg){
  const n=3+Math.floor(rnd()*2), out=[], names=[...PEOPLE];
  const ages=Array.from({length:n},()=>Math.floor(rnd()*120)).sort((a,b)=>a-b);
  for(let i=0;i<n;i++){
    const roll=rnd(), posP=clamp((avg-3)/2,.2,.92);
    const tone = i===0 || roll<posP ? "pos" : roll<posP+(1-posP)*.6 ? "mid" : "neg";
    const stars = tone==="pos" ? (rnd()<.7?5:4) : tone==="mid" ? (rnd()<.5?4:3) : (rnd()<.5?2:1);
    const ni=Math.floor(rnd()*names.length);
    out.push({name:names.splice(ni,1)[0],stars,text:pick(REVIEWS[cat][tone]),ago:ages[i]});
  }
  return out;
}
let sid=0;
function makeService(cat,x,y,scope="ts"){
  const avg=Math.round(range(3.5,4.95)*10)/10;
  const s={id:"s"+(++sid),cat,name:uniqueName(cat,scope),region:"ts",x:Math.round(x),y:Math.round(y),
    phone:`+998 ${pick(["90","91","93","94","95","97","99","33","88"])} 000 ${String(Math.floor(rnd()*100)).padStart(2,"0")} ${String(Math.floor(rnd()*100)).padStart(2,"0")}`,
    ...HOURS[cat](),rating:avg,count:4+Math.floor(Math.pow(rnd(),1.6)*240),
    desc:pick(DESCS[cat]),
    prices:PRICES[cat].map(([n,a,b])=>[n,Math.round(range(a,b)/1000)*1000])};
  s.dist=distFrom(avg);
  s.reviews=makeReviews(cat,avg);
  s.district=nearestDistrict(s.x,s.y);
  s.address=addressFor(s.x,s.y);
  return s;
}
const services=[];
const USER0={x:12350,y:9450};
for(let i=0;i<12;i++){
  const ang=rnd()*Math.PI*2, r=150+Math.sqrt(rnd())*1100;
  services.push(makeService(CAT_KEYS[i%6],USER0.x+Math.cos(ang)*r,USER0.y+Math.sin(ang)*r));
}
DISTRICTS.forEach((d,di)=>{
  const n=["Yunusobod","Mirobod","Yakkasaroy","Chilonzor","Shayxontohur"].includes(d.name)?9:6;
  for(let i=0;i<n;i++){
    const ang=rnd()*Math.PI*2, r=300+Math.sqrt(rnd())*2000;
    services.push(makeService(CAT_KEYS[(i+di)%6],clamp(d.x+Math.cos(ang)*r,500,W-500),clamp(d.y+Math.sin(ang)*r*.85,500,H-500)));
  }
});

const places=[];
let pid=0;
function addPlace(t,name,x,y,desc,district){places.push({id:"p"+(++pid),t,name,x:Math.round(x),y:Math.round(y),desc,region:"ts",district:district||nearestDistrict(x,y)});}
const inRegion=p=>!state.region||(p.region||"ts")===state.region;
[
  ["airport","Toshkent xalqaro aeroporti",13300,14300,"Shaharning asosiy aeroporti: ichki va xalqaro reyslar. Shahar markazidan taxminan 6 km janubda."],
  ["park","Amir Temur xiyoboni",12000,9000,"Shahar markazidagi xiyobon: sayr yo'laklari, favvoralar, o'rindiqlar."],
  ["tour","Mustaqillik maydoni",11250,8650,"Shaharning bosh maydoni, bayram tadbirlari shu yerda o'tadi."],
  ["museum","Temuriylar tarixi davlat muzeyi",12350,8780,"Amir Temur va temuriylar davri tarixiga bag'ishlangan muzey."],
  ["museum","O'zbekiston tarixi davlat muzeyi",11800,8300,"Qadimgi davrdan bugungacha bo'lgan tarixiy ekspozitsiyalar."],
  ["museum","Amaliy san'at muzeyi",13200,10050,"Kashtachilik, kulolchilik va milliy hunarmandchilik namunalari."],
  ["tour","Toshkent teleminorasi",12350,5400,"Balandligi 375 m bo'lgan minora, kuzatuv maydonchasi bor."],
  ["tour","Hazrati Imom majmuasi",9300,6500,"Eski shahardagi tarixiy-me'moriy majmua."],
  ["tour","Chorsu bozori",9850,7650,"Gumbazli an'anaviy bozor: ziravorlar, non, quruq mevalar."],
  ["tour","Alisher Navoiy nomidagi teatr",11500,9350,"Opera va balet teatri, shahar markazida."],
  ["park","Yapon bog'i",12900,5750,"Yapon uslubidagi bog': ko'l, ko'prikchalar, toshli yo'laklar."],
  ["park","Botanika bog'i",13900,4900,"Ilmiy botanika bog'i, mingdan ortiq o'simlik turi."],
  ["park","Ekopark",13250,9700,"Markazdagi yashil hudud, velosiped yo'laklari bilan."],
  ["park","Bobur bog'i",13700,11300,"Katta bog': ko'l, bolalar maydonchalari, sayr yo'laklari."],
  ["park","Navro'z bog'i",10500,10600,"Dam olish bog'i, tadbirlar uchun ochiq maydon."],
  ["gov","Toshkent shahar hokimligi",11650,9100,"Shahar ijroiya hokimiyati organi. Fuqarolarni qabul qilish kunlari belgilangan."],
  ["gov","Davlat xizmatlari markazi",14100,10400,"Pasport, ma'lumotnoma va boshqa davlat xizmatlarini bir joyda olish."]
].forEach(p=>addPlace(...p));
DISTRICTS.forEach(d=>{
  addPlace("gov",`${d.name} tumani hokimligi`,d.x+range(-250,250),d.y+range(-250,250),"Tuman hokimligi: murojaatlar, fuqarolarni qabul qilish.");
  const a1=rnd()*6.28, a2=rnd()*6.28;
  addPlace("school",`${10+Math.floor(rnd()*300)}-umumta'lim maktabi`,d.x+Math.cos(a1)*range(700,1600),d.y+Math.sin(a1)*range(700,1400),"Davlat umumta'lim maktabi, 1–11-sinflar.");
  addPlace("kinder",`${100+Math.floor(rnd()*500)}-son DMTT (bog'cha)`,d.x+Math.cos(a2)*range(600,1500),d.y+Math.sin(a2)*range(600,1300),"Davlat maktabgacha ta'lim tashkiloti, 3–7 yoshli bolalar uchun.");
});

/* ---------- foydalanuvchi sharhlari (shu brauzerda saqlanadi) ---------- */
const STORE_REV="nearby-proto-reviews-v1";
const myReviews = LS.get(STORE_REV, {});
const byId = id => services.find(s=>s.id===id);
function applyReview(s,r){ s.rating = s.count ? (s.rating*s.count + r.stars)/(s.count+1) : r.stars; s.count++; s.reviews.unshift(r); }
Object.entries(myReviews).forEach(([id,list])=>{ const s=byId(id); if(s) list.forEach(r=>applyReview(s,r)); });

/* ---------- holat ---------- */
const state={q:"",cat:"all",radius:0,minRating:0,openNow:false,sort:"dist",region:null,
  layers:new Set(Object.keys(PTYPES)),sel:null,mark:null,user:{...USER0,label:"Toshkent markazi (namunaviy nuqta)",acc:0}};

/* ---------- xarita ---------- */
const svg=$("#map"), svgBase=$("#mapBase"), wrap=$("#mapwrap");
/* Haqiqiy qatlam canvas'da: 10 mingdan ortiq bino SVG'da surishni sekinlashtirardi, canvas'da esa bir kadr ~bir necha ms.
   Yo'llarning eni metrda (zoomga qarab o'sadi), lekin juda uzoqda ham ko'rinib turishi uchun pikselda minimum bor. */
const rc=$("#mapReal"), rctx=rc.getContext("2d");
let drawnView=null, lastDrawT=0, locPath=null;
let RC={}, RCG={}, realQueued=false, realFont="Inter, system-ui, sans-serif";
function sizeReal(){ const dpr=Math.min(2,window.devicePixelRatio||1); rc.width=Math.max(1,Math.round(pxW*dpr)); rc.height=Math.max(1,Math.round(pxH*dpr)); drawnView=null; rc.style.transform=""; queueReal(true); }
function readColors(){ const cs=getComputedStyle(document.documentElement), g=n=>cs.getPropertyValue(n).trim();
  RC={land:g("--map-land"),road:g("--map-road"),major:g("--map-road-major"),edge:g("--map-road-edge"),park:g("--map-park"),pitch:g("--map-pitch"),
      water:g("--map-water"),bldg:g("--map-bldg"),bldgEdge:g("--map-bldg-edge"),label:g("--muted"),rail:g("--map-label"),far:g("--muted")};
  const t=document.createElement("canvas").getContext("2d"); t.fillStyle=RC.land||"#000"; const fs=t.fillStyle; let rgb;
  if(fs[0]==="#") rgb=[parseInt(fs.slice(1,3),16),parseInt(fs.slice(3,5),16),parseInt(fs.slice(5,7),16)]; else rgb=(fs.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number);
  const dark=(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)<110;
  RCG=dark?{land:"#123a78",road:"#69707f",major:"#a3aab8",far:"#a3aab8",edge:"#0b1220",rail:"#4b5563",bldg:"#1a2233",bldgEdge:"#3a4256"}
          :{land:"#a4cbf1",road:"#6d7fa3",major:"#3f5280",far:"#3f5280",edge:"#dbe8fb",rail:"#8590a8",bldg:"#c9d6ee",bldgEdge:"#a6b6d8"};
  realFont=getComputedStyle(document.body).fontFamily||realFont; }
function onTheme(){ readColors(); queueReal(); }
try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",onTheme); }catch(e){}
new MutationObserver(onTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
// surish/zoom paytida tayyor canvas rasmi CSS transform bilan siljiydi (GPU), haqiqiy qayta chizish ~150 ms da bir marta
let realFirst=true;
function queueReal(imm){ if(realQueued) return; realQueued=true;
  const go=()=>{ if(realFirst){ realFirst=false; requestAnimationFrame(()=>requestAnimationFrame(()=>{ realQueued=false; drawReal(); })); return; }   // birinchi chizish: avval sahifa ko'rinadi
      requestAnimationFrame(()=>{ realQueued=false; drawReal(); }); }, wait=imm?0:Math.max(0,150-(performance.now()-lastDrawT));
  if(wait>0) setTimeout(go,wait); else go(); }
function syncReal(){ if(!drawnView||!pxW) return; const s=drawnView.w/view.w, tx=(drawnView.x-view.x)/view.w*pxW, ty=(drawnView.y-view.y)/view.w*pxW;
  rc.style.transformOrigin="0 0"; rc.style.transform=(Math.abs(s-1)<1e-6&&Math.abs(tx)<.01&&Math.abs(ty)<.01)?"":`translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s})`; }
const walkP=(p,a,close)=>{let x=a[0],y=a[1];p.moveTo(x,y);for(let i=2;i<a.length;i+=2){x+=a[i];y+=a[i+1];p.lineTo(x,y);}if(close)p.closePath();};
const polyP=list=>{const p=new Path2D();(list||[]).forEach(a=>walkP(p,a,true));return p;};
const lineP=list=>{const p=new Path2D();(list||[]).forEach(a=>walkP(p,a,false));return p;};
/* Bino ma'lumoti yo'q shaharlar uchun: haqiqiy ko'chalar bo'ylab uchastkalarga bino joylashtiriladi.
   Har bir bino ko'cha yo'nalishiga to'g'ri turadi; boshqa ko'cha va binolar bilan kesishsa tashlab yuboriladi. Natija doim bir xil (seed). */
const HALF_W={major:12,sec:8.5,ter:6.5,min:4.5};
const hh=(a,b,c)=>{let x=(Math.imul(a,374761393)+Math.imul(b,668265263)+Math.imul(c,1440670441))|0;x=Math.imul(x^(x>>>13),1274126177);x^=x>>>16;return (x>>>0)/4294967296;};
function makeBuildingGen(a){
  const roads=a.r.filter(r=>r[0] in HALF_W).map((r,idx)=>{const pts=decPts(r[2]),cum=[0];
    for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
    return {cls:r[0],pts,cum,pitch:15+(idx*7919%5)};});
  if(!roads.length) return null;
  const C=40, CS=1500, rh=new Map(), bh=new Map(), key=(x,y)=>Math.floor(x/C)*100003+Math.floor(y/C), cellSegs=new Map(), done=new Map();
  const addCell=(x,y,code)=>{const k=Math.floor(x/CS)*100003+Math.floor(y/CS);let s=cellSegs.get(k);if(!s)cellSegs.set(k,s=new Set());s.add(code);};
  roads.forEach((r,ri)=>{const h=HALF_W[r.cls];
    for(let i=0;i<r.pts.length-1;i++){const [ax,ay]=r.pts[i],[bx,by]=r.pts[i+1],L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(L/10)),code=ri*2000000+i;
      for(let j=0;j<=n;j++){const x=ax+(bx-ax)*j/n,y=ay+(by-ay)*j/n,k=key(x,y);(rh.get(k)||rh.set(k,[]).get(k)).push(x,y,h);
        if(j%20===0||j===n){addCell(x-45,y-45,code);addCell(x+45,y-45,code);addCell(x-45,y+45,code);addCell(x+45,y+45,code);}}}});
  // haqiqiy binolar sohasi ichkarisida (chekkadan 260 m dan keyin) generatsiya yo'q; chekkada esa haqiqiy binolarga tegmagan joylarga qo'yiladi
  const M=260, realZ=REAL_AREAS.filter(z=>z.b&&z!==a), skip=realZ.map(z=>[z.bbox[0]+M,z.bbox[1]+M,z.bbox[2]-M,z.bbox[3]-M]);
  const realHit=(cx,cy,m)=>{ for(const z of realZ){ const bb=z.bbox; if(cx<bb[0]||cx>bb[2]||cy<bb[1]||cy>bb[3]) continue;
      if(!z._rc){ const h=new Map(); for(const poly of z.b){ const pts=decPts(poly); let sx=0,sy=0; for(const q of pts){sx+=q[0];sy+=q[1];} const mx=sx/pts.length,my=sy/pts.length,k=Math.floor(mx/30)*100003+Math.floor(my/30); (h.get(k)||h.set(k,[]).get(k)).push(mx,my); } z._rc=h; }
      const k0=Math.floor(cx/30),k1=Math.floor(cy/30);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){ const arr=z._rc.get((k0+i)*100003+(k1+j)); if(!arr) continue; for(let t=0;t<arr.length;t+=2) if(Math.hypot(arr[t]-cx,arr[t+1]-cy)<m*.5+9) return true; } }
    return false; };
  const clear=(cx,cy,ux,uy,w,d)=>{const k0=Math.floor(cx/C),k1=Math.floor(cy/C);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const arr=rh.get((k0+i)*100003+(k1+j));if(!arr)continue;
      for(let t=0;t<arr.length;t+=3){const dx=arr[t]-cx,dy=arr[t+1]-cy,lx=dx*ux+dy*uy,ly=-dx*uy+dy*ux,
        ex=Math.max(Math.abs(lx)-w/2,0),ey=Math.max(Math.abs(ly)-d/2,0);if(Math.hypot(ex,ey)<arr[t+2]+2.2)return false;}}
    return true;};
  const free=(cx,cy,m)=>{const k0=Math.floor(cx/C),k1=Math.floor(cy/C);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const arr=bh.get((k0+i)*100003+(k1+j));if(!arr)continue;
      for(let t=0;t<arr.length;t+=3){if(Math.hypot(arr[t]-cx,arr[t+1]-cy)<(arr[t+2]+m)*.5)return false;}}
    return true;};
  function cell(kx,ky){
    const k=kx*100003+ky; if(done.has(k)) return done.get(k);
    const out=new Path2D(); done.set(k,out);
    const set=cellSegs.get(k); if(!set) return out;
    const x0=kx*CS,y0=ky*CS,x1=x0+CS,y1=y0+CS;
    const place=(cx,cy,ux,uy,w,d)=>{
      if(cx<x0||cx>=x1||cy<y0||cy>=y1) return false;
      for(const b of skip) if(cx>b[0]&&cx<b[2]&&cy>b[1]&&cy<b[3]) return false;
      const m=Math.min(w,d); if(realZ.length&&realHit(cx,cy,Math.max(w,d))) return false; if(!free(cx,cy,m)||!clear(cx,cy,ux,uy,w,d)) return false;
      const vx=-uy,vy=ux,hw=w/2,hd=d/2;
      out.moveTo(cx-ux*hw-vx*hd,cy-uy*hw-vy*hd);out.lineTo(cx+ux*hw-vx*hd,cy+uy*hw-vy*hd);out.lineTo(cx+ux*hw+vx*hd,cy+uy*hw+vy*hd);out.lineTo(cx-ux*hw+vx*hd,cy-uy*hw+vy*hd);out.closePath();
      const kk=key(cx,cy);(bh.get(kk)||bh.set(kk,[]).get(kk)).push(cx,cy,m); return true;};
    for(const code of set){
      const ri=Math.floor(code/2000000), i=code%2000000, r=roads[ri], h=HALF_W[r.cls];
      const [ax,ay]=r.pts[i],[bx,by]=r.pts[i+1], L=r.cum[i+1]-r.cum[i]; if(L<1) continue;
      const ux=(bx-ax)/L,uy=(by-ay)/L,nx=-uy,ny=ux, P=r.pitch;
      for(let j=Math.ceil((r.cum[i]-P/2)/P); (j+.5)*P<r.cum[i+1]; j++){
        const s=(j+.5)*P-r.cum[i]; if(s<0) continue;
        const cx=ax+ux*s,cy=ay+uy*s, w=P-3-hh(ri,j,1)*3;
        for(const sd of [1,-1]){
          const q=hh(ri,j,sd+5); if(q<.1) continue;
          const d=8+hh(ri,j,sd+9)*8, off=h+4+hh(ri,j,sd+13)*5+d/2;
          if(place(cx+nx*sd*off,cy+ny*sd*off,ux,uy,w,d)&&hh(ri,j,sd+17)<.45){const d2=7+hh(ri,j,sd+21)*6, o2=off+d/2+3+d2/2; place(cx+nx*sd*o2,cy+ny*sd*o2,ux,uy,w*(.8+hh(ri,j,sd+25)*.4),d2);}
        }
      }
    }
    return out;
  }
  // ko'rinib turgan kataklarning yo'llari (yaratilmagan bo'lsa, shu yerda yaratiladi)
  // vaqt byudjeti (deadline): yangi kataklar kadrga sig'masa keyingi kadrga qoladi (l.pending), sayt qotmaydi
  return (vx0,vy0,vx1,vy1,deadline)=>{const l=[],todo=[],mx=(vx0+vx1)/2,my=(vy0+vy1)/2;
    for(let kx=Math.floor(vx0/CS);kx<=Math.floor(vx1/CS);kx++)for(let ky=Math.floor(vy0/CS);ky<=Math.floor(vy1/CS);ky++){
      const k=kx*100003+ky; if(done.has(k)) l.push(done.get(k)); else todo.push([kx,ky,Math.hypot((kx+.5)*CS-mx,(ky+.5)*CS-my)]);}
    todo.sort((a,b)=>a[2]-b[2]);
    for(let i=0;i<todo.length;i++){ if(i>0&&deadline&&performance.now()>deadline){ l.pending=true; break; } l.push(cell(todo[i][0],todo[i][1])); }
    return l;};
}
function areaPaths(a){
  if(a._p) return a._p;
  const by={}; a.r.forEach(([c,,d])=>(by[c]=by[c]||[]).push(d));
  const needGen=!a.b&&a.r.some(r=>r[0] in HALF_W), det=!!a.b||needGen;
  const P={detail:det,gen:null,needGen,b:polyP(a.b),g:polyP(a.g),p:polyP(a.p),w:polyP(a.w),wl:lineP(a.wl),r:{},labels:[]};
  P.by=by;   // yo'l yo'llari (Path2D) sinf bo'yicha drawReal'da kadr byudjeti bilan quriladi
  const ord={major:0,sec:1,ter:2,min:3};
  areaNamed(a).forEach(r=>{ if(!(r.cls in ord)) return; let best=null,bl=0;
    for(let i=0;i<r.pts.length-1;i++){const [ax,ay]=r.pts[i],[bx,by2]=r.pts[i+1],l=Math.hypot(bx-ax,by2-ay);if(l>bl){bl=l;best=[ax,ay,bx,by2];}}
    if(best&&bl>40) P.labels.push({name:r.name,cls:r.cls,x:(best[0]+best[2])/2,y:(best[1]+best[3])/2,a:Math.atan2(best[3]-best[1],best[2]-best[0]),len:bl}); });
  P.labels.sort((x,y)=>(ord[x.cls]-ord[y.cls])||(y.len-x.len));
  return a._p=P;
}
let HW=null;
// [sinf, eni (m), min eni (px), rang, shu masshtabdan (m/px) yaqinda ko'rinadi]
const ROAD_STYLE=[["foot",2.5,.7,"edge",3],["svc",5,1,"road",5],["min",9,1.4,"road",13],["ter",13,2,"road",28],["sec",17,2.6,"major",40],["major",24,3.2,"major",40],["rail",4,1.3,"rail",40]];
function drawReal(){
  const ctx=rctx, dpr=rc.width/pxW, k=view.w/pxW;
  lastDrawT=performance.now(); drawnView={x:view.x,y:view.y,w:view.w}; rc.style.transform="";
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,rc.width,rc.height);
  if(!REAL){ $("#osmattr").hidden=true; return; }
  const s=dpr/k; ctx.setTransform(s,0,0,s,-view.x*s,-view.y*s);
  ctx.lineCap="round"; ctx.lineJoin="round";
  const vx0=view.x, vy0=view.y, vx1=view.x+view.w, vy1=view.y+view.h;
  const dl=performance.now()+10; let pend=false, fresh=false, builtRoad=false;   // kadr byudjeti: og'ir hisoblash kadrlarga bo'linadi
  // shaharlararo yo'llar: har qanday masshtabda, ingichka
  if(!HW){ HW={major:lineP(REAL.hw.filter(h=>h[0]==="major").map(h=>h[1])),sec:lineP(REAL.hw.filter(h=>h[0]!=="major").map(h=>h[1]).concat(REAL.links||[]))}; }
  const LOC=!!localLimit(), lf=LOC?.45:1;   // viloyat rejimi: butun ko'rinish bir xil fon, haqiqiy yo'llar uzoqroq masshtabgacha
  let LP=null;
  if(LOC){ ctx.fillStyle=RC.land; ctx.fillRect(vx0,vy0,view.w,view.h);
    // hudud chegarasi (shahar konturi): ichida - haqiqiy yo'llar, tashqarisi biroz to'qroq; chizma kontur bo'ylab qirqiladi
    const rid=state.region; LP=(locPath&&locPath.id===rid)?locPath.p:(locPath={id:rid,p:new Path2D(regionD(regionById(rid)))}).p;
  }
  ctx.save(); if(LP) ctx.clip(LP,"evenodd");   // viloyat rejimi: chegaradan tashqarida hech narsa chizilmaydi
  const RC0=RC; RC=Object.assign({},RC,RCG); if(!LOC) RC.land=RC0.land; else { ctx.fillStyle=RC.land; ctx.fillRect(vx0,vy0,view.w,view.h); }   // barcha chiziqlar (yo'l, temir yo'l) kulrang; chegaralar oq
  const hwW=k>150?1:k>40?1.4:2;
  const drawHW=()=>{
  if(k<40){ ctx.strokeStyle=RC.edge; ctx.lineWidth=(hwW+1.4)*k; ctx.stroke(HW.sec); ctx.stroke(HW.major); }
  // uzoqdan ko'rinish uchun ochiq rang (to'q fonda ham, yorug' fonda ham farqlanadi)
  ctx.strokeStyle=k>40?RC.far:RC.major; ctx.lineWidth=(k>40?2:hwW*.9)*k; ctx.stroke(HW.sec); ctx.lineWidth=(k>40?3:hwW*1.3)*k; ctx.stroke(HW.major);
  }; drawHW();
  ctx.globalAlpha=1;
  let any=REAL.hw.length>0;
  if(k<(LOC?90:40)) for(const a of REAL_AREAS){
    const bb=a.bbox; if(bb[2]<vx0||bb[0]>vx1||bb[3]<vy0||bb[1]>vy1) continue;
    const P=areaPaths(a); any=true;
    // viloyat rejimi: ma'lumot tugaydigan chetdagi uzilgan yo'l uchlari chizilmaydi (chekinib qirqiladi)
    const inset=LOC&&!a.b;   // viloyat rejimi: ma'lumot chegarasi to'rtburchak bo'lib ko'rinmasin, mayda yo'llar oval bo'ylab asta so'nadi
    if(inset){ ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip(); }   // chegaradan chiqib ketgan yo'l parchalari qirqiladi (so'nmay qolib, to'g'ri chiziq hosil qilmasin)
    if(!a.b&&!LOC){ ctx.fillStyle=RC.land; ctx.fillRect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); } // ostidagi sxematik chizmani yopadi (ichma-ich markaziy hudud katta hududning ustida, o'z to'rtburchagini bo'yamaydi)
    if(P.detail){ ctx.fillStyle=RC.park; ctx.fill(P.g); ctx.fillStyle=RC.pitch; ctx.fill(P.p); ctx.fillStyle=RC.water; ctx.fill(P.w); }
    ctx.strokeStyle=RC.water; ctx.lineWidth=Math.max(10,2.5*k); ctx.stroke(P.wl);
    if(P.detail&&k<11){ if(P.needGen&&!P.gen){ if(!fresh||performance.now()<dl){ P.gen=makeBuildingGen(a)||(()=>[]); fresh=true; } else pend=true; }
      const bl=P.needGen?(P.gen?P.gen(Math.max(vx0,bb[0]),Math.max(vy0,bb[1]),Math.min(vx1,bb[2]),Math.min(vy1,bb[3]),dl):[]):[P.b]; if(bl.pending) pend=true; ctx.fillStyle=RC.bldg; for(const b of bl) ctx.fill(b); if(k<3){ ctx.strokeStyle=RC.bldgEdge; ctx.lineWidth=.9*k; for(const b of bl) ctx.stroke(b); } }
    const st=[], wd=r=>Math.max(r[1],r[2]*k);
    for(const r of ROAD_STYLE){ if(k*lf>=r[4]||!P.by[r[0]]) continue;
      if(!P.r[r[0]]){ if(!builtRoad||performance.now()<dl){ P.r[r[0]]=lineP(P.by[r[0]]); builtRoad=true; } else { pend=true; continue; } }
      st.push(r); }
    for(const r of st){ if(r[0]==="foot"||r[0]==="rail") continue; ctx.strokeStyle=RC.edge; ctx.lineWidth=wd(r)+1.6*k; ctx.stroke(P.r[r[0]]); }
    for(const r of st){ ctx.strokeStyle=RC[r[3]]; ctx.lineWidth=wd(r); if(r[0]==="rail") ctx.setLineDash([7*k,6*k]); ctx.stroke(P.r[r[0]]); ctx.setLineDash([]); }
    // chegara qirrasi: ma'lumot tugaydigan joyda keskin chiziq bo'lmasligi uchun fon rangiga asta so'nadi
    if(!a.b&&!LOC){ const F=Math.min(Math.max(70*k,400),2500), N=10, W=bb[2]-bb[0], H=bb[3]-bb[1]; ctx.fillStyle=RC.land;
      for(let i=0;i<N;i++){ const d=F/N, a=1-i/N; ctx.globalAlpha=a*a;
        if(bb[0]+i*d<vx1&&bb[0]+(i+1)*d>vx0){ ctx.fillRect(bb[0]+i*d,bb[1],d+1,H); }
        if(bb[2]-(i+1)*d<vx1&&bb[2]-i*d>vx0){ ctx.fillRect(bb[2]-(i+1)*d-1,bb[1],d+1,H); }
        if(bb[1]+i*d<vy1&&bb[1]+(i+1)*d>vy0){ ctx.fillRect(bb[0],bb[1]+i*d,W,d+1); }
        if(bb[3]-(i+1)*d<vy1&&bb[3]-i*d>vy0){ ctx.fillRect(bb[0],bb[3]-(i+1)*d-1,W,d+1); } }
      ctx.globalAlpha=1; }
    if(inset){ const lc=rgbaOf(RC.land), cx=(bb[0]+bb[2])/2, cy=(bb[1]+bb[3])/2;
      ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip();
      ctx.translate(cx,cy); ctx.scale((bb[2]-bb[0])/2,(bb[3]-bb[1])/2);
      const g=ctx.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,lc(0)); g.addColorStop(.66,lc(0)); g.addColorStop(.84,lc(.5)); g.addColorStop(.95,lc(.92)); g.addColorStop(1,lc(1));
      ctx.fillStyle=g; ctx.fillRect(-1,-1,2,2); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]); ctx.clip(); drawHW(); ctx.restore(); ctx.restore(); }
  }
  ctx.restore();
  if(LP){ ctx.setLineDash([]); ctx.lineJoin="round"; ctx.strokeStyle="rgba(0,0,0,.38)"; ctx.lineWidth=4.4*k; ctx.stroke(LP);
    ctx.strokeStyle="#ffffff"; ctx.lineWidth=2.2*k; ctx.stroke(LP); }
  RC=RC0;
  $("#osmattr").hidden=!any;
  if(k<3.4){ ctx.setTransform(dpr,0,0,dpr,0,0); const placed=[], seen={};
    for(const a of REAL_AREAS){ const bb=a.bbox; if(bb[2]<vx0||bb[0]>vx1||bb[3]<vy0||bb[1]>vy1) continue; drawRealLabels(ctx,k,areaPaths(a).labels,placed,seen); } }
  if(pend) queueReal(true); else if(k<11) prefetchCells();
}
// ekran atrofidagi binolarni bo'sh vaqtda oldindan tayyorlash: tez surganda ham binolar kech chiqmaydi
let pfTok=0;
function prefetchCells(){
  const tok=++pfTok;
  const run=()=>{ if(tok!==pfTok) return; const dl=performance.now()+6; let more=false;
    const ex=.4, x0=view.x-view.w*ex, y0=view.y-view.h*ex, x1=view.x+view.w*(1+ex), y1=view.y+view.h*(1+ex);
    for(const a of REAL_AREAS){ const bb=a.bbox, P=a._p; if(!P||!P.needGen||!P.gen||bb[2]<x0||bb[0]>x1||bb[3]<y0||bb[1]>y1) continue;
      const l=P.gen(Math.max(x0,bb[0]),Math.max(y0,bb[1]),Math.min(x1,bb[2]),Math.min(y1,bb[3]),dl); if(l.pending) more=true; }
    if(more) idle(run); };
  idle(run);
}
function rgbaOf(col){ const C=rgbaOf.c||(rgbaOf.c={}); let m=C[col]; if(!m){ const cx=document.createElement("canvas").getContext("2d"); cx.fillStyle=col; const v=String(cx.fillStyle); let r,g,b; if(v[0]==="#"){ r=parseInt(v.slice(1,3),16); g=parseInt(v.slice(3,5),16); b=parseInt(v.slice(5,7),16); } else { const q=v.match(/[\d.]+/g)||[0,0,0]; r=+q[0]; g=+q[1]; b=+q[2]; } m=C[col]=a=>"rgba("+r+","+g+","+b+","+a+")"; } return m; }
const idle=f=>("requestIdleCallback" in window)?requestIdleCallback(f,{timeout:250}):setTimeout(f,40);
function drawRealLabels(ctx,k,labels,placed,seen){
  ctx.font=`600 11px ${realFont}`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.lineJoin="round";
  for(const L of labels){
    if(L.cls==="min"&&k>1.8) continue;
    const sx=(L.x-view.x)/k, sy=(L.y-view.y)/k;
    if(sx<-60||sx>pxW+60||sy<-20||sy>pxH+20) continue;
    const w=ctx.measureText(L.name).width; if(w>L.len/k*1.15) continue; // nom ko'cha bo'lagidan uzun bo'lsa yozilmaydi
    if((seen[L.name]||[]).some(p=>Math.hypot(p[0]-sx,p[1]-sy)<260)) continue;
    const r=w/2+6; if(placed.some(p=>Math.hypot(p[0]-sx,p[1]-sy)<r+p[2])) continue;
    placed.push([sx,sy,r]); (seen[L.name]=seen[L.name]||[]).push([sx,sy]);
    let a=L.a; if(a>Math.PI/2) a-=Math.PI; if(a<-Math.PI/2) a+=Math.PI;
    ctx.save(); ctx.translate(sx,sy); ctx.rotate(a);
    ctx.lineWidth=3.5; ctx.strokeStyle=RC.land; ctx.strokeText(L.name,0,0); ctx.fillStyle=RC.label; ctx.fillText(L.name,0,0);
    ctx.restore();
  }
}
let view={x:0,y:0,w:14000,h:10000}, pxW=800, pxH=600, anim=0, markersDirty=true, scaledEls=[], lastScaleK=-1;
const kpx=()=>view.w/pxW;
const W_MIN=1200, W_MAX=2200000;
function setCenter(cx,cy,w){view.w=clamp(w,W_MIN,W_MAX);view.h=view.w*pxH/pxW;view.x=cx-view.w/2;view.y=cy-view.h/2;clampView();}
/* "Faqat mening hududim" rejimida xarita hududdan tashqariga chiqmaydi va undan uzoqqa uzoqlashmaydi; "Butun davlat" bosilganda erkin */
const boxCache={};
function regionBox(r){
  if(boxCache[r.id]) return boxCache[r.id];
  let x0=1e12,y0=1e12,x1=-1e12,y1=-1e12; const add=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);};
  const g=typeof REG_RINGS!=="undefined"&&HAVE_REAL_REG?REG_RINGS[r.id]:null;
  if(g) g.o.forEach(ring=>ring.forEach(q=>add(q.x,q.y)));
  else if(r===TASH_CITY){ add(r.cx-r.rx,r.cy-r.ry); add(r.cx+r.rx,r.cy+r.ry); }
  else if(r.seeds) r.seeds.forEach(([a,b])=>{ const w=ll2w(a,b); add(w.x,w.y); });
  if(x1<x0) return null;
  return boxCache[r.id]={x0,y0,x1,y1};
}
function localLimit(){
  if(!state||!state.region||!state.user) return null;   // tanlangan har qanday viloyat (o'zimniki yoki boshqasi)
  const b=regionBox(regionById(state.region)); if(!b) return null;
  const px=(b.x1-b.x0)*.02, py=(b.y1-b.y0)*.02, x0=b.x0-px, x1=b.x1+px, y0=b.y0-py, y1=b.y1+py;
  return {x0,y0,x1,y1,w:Math.max(x1-x0,(y1-y0)*pxW/pxH)};   // eng uzoq ko'rinish: hudud ekranga aynan sig'adi
}
function clampView(){
  const L=localLimit();
  if(L&&view.w>L.w){ const mx=view.x+view.w/2,my=view.y+view.h/2; view.w=L.w; view.h=view.w*pxH/pxW; view.x=mx-view.w/2; view.y=my-view.h/2; }
  let cx=clamp(view.x+view.w/2,-1150000,420000),cy=clamp(view.y+view.h/2,-520000,540000);
  if(L){   // ko'rinish hudud ichida qoladi; hudud ekrandan kichik bo'lsa markazda turadi
    cx=(L.x1-L.x0<=view.w)?(L.x0+L.x1)/2:clamp(cx,L.x0+view.w/2,L.x1-view.w/2);
    cy=(L.y1-L.y0<=view.h)?(L.y0+L.y1)/2:clamp(cy,L.y0+view.h/2,L.y1-view.h/2);
  }
  view.x=cx-view.w/2;view.y=cy-view.h/2;
}
function toWorld(cx,cy){const r=svg.getBoundingClientRect();return {x:view.x+(cx-r.left)/pxW*view.w,y:view.y+(cy-r.top)/pxH*view.h};}
function applyView(){
  svg.setAttribute("viewBox",`${view.x} ${view.y} ${view.w} ${view.h}`); svgBase.setAttribute("viewBox",`${view.x} ${view.y} ${view.w} ${view.h}`);
  const k=kpx();
  const zl = k<6 ? "near" : k<13 ? "mid" : k<40 ? "far" : k<150 ? "region" : "country";
  const small = zl==="region"||zl==="country"; // uzoqda xizmat belgilari kichik nuqtaga aylanadi
  // belgilar o'lchami faqat masshtabga bog'liq: surishda (pan) qayta hisoblanmaydi — 1000+ element uchun tezlik
  // 2000+ element: belgilar qayta chizilganda hammasi bir marta, keyin faqat ko'rinib turganlari yangilanadi
  const all=markersDirty||k!==lastScaleK; lastScaleK=k;  // masshtab o'zgarsa hamma belgi yangilanadi: aks holda ko'rinmay turgan shahar nomlari eski (juda katta) o'lchamda qolib, yaqinlashganda ekranni to'sib qo'yadi
  if(markersDirty){ scaledEls=[...wrap.querySelectorAll("[data-sx]")].map(g=>({g,x:+g.dataset.sx,y:+g.dataset.sy,mk:g.classList.contains("mk"),s:-1})); markersDirty=false; }
  const mx=view.w*.2,my=view.h*.2,x0=view.x-mx,x1=view.x+view.w+mx,y0=view.y-my,y1=view.y+view.h+my;
  for(const e of scaledEls){
    if(!all&&(e.x<x0||e.x>x1||e.y<y0||e.y>y1)) continue;
    const s=small&&e.mk?k*(zl==="country"?.3:.42):k;
    if(e.s!==s){ e.s=s; e.g.setAttribute("transform",`translate(${e.x} ${e.y}) scale(${s})`); }
  }
  wrap.dataset.zoom = zl;
  layoutCityLabels(k,zl);
  queueReal(); syncReal();
  checkMarkerWindow(k);
  const rl=$("#gRoadLabels"); rl.setAttribute("font-size",(11*k).toFixed(1)); rl.setAttribute("stroke-width",(3.5*k).toFixed(1));
  const target=100*k, steps=[50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000,500000];
  const m=steps.filter(s=>s<=target).pop()||50;
  const sb=$("#scaleBar"), sw=(m/k).toFixed(0)+"px"; if(sb.style.width!==sw) sb.style.width=sw;
  const st=$("#scaleTxt"), stx=m>=1000?`${m/1000} km`:`${m} m`; if(st.textContent!==stx) st.textContent=stx;
}
/* Shahar nomlari ustma-ust tushmasligi uchun: hamma shahar nuqtasi doim ko'rinadi, nomi esa joy bo'lsa
   o'ngga, bo'lmasa chapga yoziladi; ikkalasida ham joy bo'lmasa yashiriladi (yaqinlashtirsa chiqadi).
   Joylashuv faqat masshtabga bog'liq, shuning uchun faqat k o'zgarganda hisoblanadi. */
let lblK=-1, lblSel="";
function layoutCityLabels(k,zl){
  if(zl==="near") return;   // yaqin ko'rinishda shahar nomlari yashirin
  const sel=state.region||"";
  if(k===lblK&&sel===lblSel) return; lblK=k; lblSel=sel;
  const boxes=[], hit=b=>boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]);
  const cities=[...document.querySelectorAll("#gCountry .city")].map(g=>({g,t:g.querySelector("text"),x:+g.dataset.sx/k,y:+g.dataset.sy/k,
    town:g.classList.contains("town"),cap:g.classList.contains("capital"),on:g.classList.contains("on")}));
  cities.forEach(c=>boxes.push([c.x-5,c.y-5,c.x+5,c.y+5]));
  // mamlakat va viloyat yozuvlari ham to'siq
  if(zl==="country"||zl==="region") document.querySelectorAll("#gCountry .ctry,#gCountry .rlbl").forEach(t=>{
    if(getComputedStyle(t).display==="none") return; const g=t.parentNode, w=t.textContent.length*8.5;
    const x=+g.dataset.sx/k, y=+g.dataset.sy/k; boxes.push([x-w/2,y-10,x+w/2,y+3]); });
  const rank=c=>c.cap?0:!c.town?1:c.on?2:3;
  cities.sort((a,b)=>rank(a)-rank(b));
  for(const c of cities){
    if(c.cap){ c.g.classList.remove("hidelbl"); const w=c.t.textContent.length*7.2; boxes.push([c.x-10-w,c.y-8,c.x-8,c.y+6]); continue; }
    const w=c.t.textContent.length*(c.town?(zl==="country"?5.8:6.4):7), R=[c.x+7,c.y-8,c.x+9+w,c.y+6], L=[c.x-9-w,c.y-8,c.x-7,c.y+6];
    let place=!hit(R)?"r":!hit(L)?"l":(c.town?"":"r"); // viloyat markazi nomi doim yoziladi
    c.g.classList.toggle("hidelbl",!place);
    if(place){ const left=place==="l"; c.t.setAttribute("x",left?-8:(c.town?8:9)); c.t.setAttribute("text-anchor",left?"end":"start"); boxes.push(left?L:R); }
  }
}
function flyTo(cx,cy,w,ms=420){
  cancelAnimationFrame(anim);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){setCenter(cx,cy,w);applyView();return;}
  const s={cx:view.x+view.w/2,cy:view.y+view.h/2,w:view.w},t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-p,3);setCenter(s.cx+(cx-s.cx)*e,s.cy+(cy-s.cy)*e,s.w*Math.pow(w/s.w,e));applyView();if(p<1)anim=requestAnimationFrame(step);};
  anim=requestAnimationFrame(step);
}
function fitPoints(pts,pad=1.35){
  if(!pts.length)return;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const w=Math.max((maxX-minX)*pad,((maxY-minY)*pad)*pxW/pxH,2600);
  flyTo((minX+maxX)/2,(minY+maxY)/2,w);
}
function inView(p,m=.12){return p.x>view.x+view.w*m&&p.x<view.x+view.w*(1-m)&&p.y>view.y+view.h*m&&p.y<view.y+view.h*(1-m);}

/* ---------- O'zbekiston (uzoqlashtirganda ko'rinadi) ---------- */
const ll2w=(lng,lat)=>({x:Math.round(ORIGIN.x+(lng-ORIGIN.lng)*83900),y:Math.round(ORIGIN.y+(ORIGIN.lat-lat)*111000)});
// Chegara soddalashtirilgan (Natural Earth 1:110m asosida), taxminiy
const UZB_OLD=[[66.52,37.36],[66.55,37.97],[65.22,38.40],[64.17,38.89],[63.52,39.36],[62.37,40.05],[61.88,41.08],[61.55,41.27],[60.47,41.22],[60.08,41.43],[59.98,42.22],[58.63,42.75],[57.79,42.17],[56.93,41.83],[57.10,41.32],[55.97,41.31],[55.93,45.00],[58.50,45.59],[58.69,45.50],[60.24,44.78],[61.06,44.41],[62.01,43.50],[63.19,43.65],[64.90,43.73],[66.10,43.00],[66.02,41.99],[66.51,41.99],[66.71,41.17],[67.99,41.14],[68.26,40.66],[68.63,40.67],[69.07,41.38],[70.39,42.08],[70.96,42.27],[71.26,42.17],[70.42,41.52],[71.16,41.14],[71.87,41.39],[73.06,40.87],[71.77,40.15],[71.01,40.24],[70.60,40.22],[70.46,40.50],[70.67,40.96],[69.33,40.73],[69.01,40.09],[68.54,39.53],[67.70,39.58],[67.44,39.14],[68.18,38.90],[68.39,38.16],[67.83,37.14],[67.08,37.36]].map(([a,b])=>ll2w(a,b));
/* Haqiqiy chegaralar (OpenStreetMap, 120 m aniqlikda soddalashtirilgan; fayl ichiga joylangan) */
const BOUNDS=(()=>{try{return window.NS_DATA.bounds;}catch(e){return null;}})();
const decRing=a=>{const p=[{x:a[0],y:a[1]}];for(let i=2;i<a.length;i+=2){const l=p[p.length-1];p.push({x:l.x+a[i],y:l.y+a[i+1]});}return p;};
const UZB_RINGS=BOUNDS?BOUNDS.country.map(decRing):[UZB_OLD];
const UZB=UZB_RINGS.slice().sort((a,b)=>b.length-a.length)[0];
const ringsD=rs=>rs.map(r=>`M${r.map(p=>`${p.x},${p.y}`).join("L")}Z`).join("");
const inRing=(r,p)=>{let ins=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)ins=!ins;}return ins;};
const CITIES=[
  ["Toshkent","Toshkent shahri",69.280,41.311],["Nurafshon","Toshkent viloyati",69.36,41.04],["Guliston","Sirdaryo viloyati",68.78,40.49],
  ["Jizzax","Jizzax viloyati",67.842,40.116],["Samarqand","Samarqand viloyati",66.976,39.654],["Qarshi","Qashqadaryo viloyati",65.789,38.861],
  ["Termiz","Surxondaryo viloyati",67.278,37.224],["Buxoro","Buxoro viloyati",64.421,39.768],["Navoiy","Navoiy viloyati",65.374,40.103],
  ["Urganch","Xorazm viloyati",60.63,41.55],["Nukus","Qoraqalpog'iston Respublikasi",59.61,42.46],["Namangan","Namangan viloyati",71.672,40.998],
  ["Andijon","Andijon viloyati",72.344,40.783],["Farg'ona","Farg'ona viloyati",71.786,40.384]
].map(([name,region,lng,lat],i)=>({id:"c"+i,name,region,capital:i===0,lat,lng,...ll2w(lng,lat)}));
const NEIGHBORS=[["Qozog'iston",65.5,45.2],["Turkmaniston",60.2,39.3],["Afg'oniston",66.5,36.8],["Tojikiston",70.3,38.6],["Qirg'iziston",73.6,41.9]];
function inUzb(p){return UZB_RINGS.some(r=>inRing(r,p));}
function nearestCity(p){let b=CITIES[0],bd=Infinity;for(const c of CITIES.concat(TOWNS)){const d=gdist(c,p);if(d<bd){bd=d;b=c;}}return {city:b,d:bd};}
/* Viloyatlar: har biriga bir nechta "urug'" nuqta beriladi, hudud = eng yaqin urug' (Voronoi), so'ng mamlakat chegarasi bilan kesiladi.
   Natija taxminiy, lekin viloyatlarning joylashuvi va qo'shnichiligi to'g'ri chiqadi. */
const RCOL=["#3b82f6","#16a34a","#8b5cf6","#ec4899","#0d9488","#ef4444"];
const REGIONS=[
  {id:"qq",name:"Qoraqalpog'iston Respublikasi",short:"Qoraqalpog'iston",center:"Nukus",c:0,lbl:[58.3,43.7],seeds:[[56.8,44.6],[56.8,42.6],[58.3,43.2],[58.6,44.8],[60.0,44.2],[61.0,43.4],[59.6,42.5],[60.3,42.6],[61.4,41.75]]},
  {id:"xo",name:"Xorazm viloyati",short:"Xorazm",center:"Urganch",c:3,small:true,lbl:[60.75,41.25],seeds:[[60.35,41.42],[60.7,41.6],[61.0,41.3]]},
  {id:"nv",name:"Navoiy viloyati",short:"Navoiy",center:"Navoiy",c:1,lbl:[64.0,42.4],seeds:[[62.6,42.9],[63.8,43.0],[65.0,43.1],[63.2,41.9],[64.6,41.9],[65.6,41.6],[65.4,40.5],[66.0,40.8]]},
  {id:"bx",name:"Buxoro viloyati",short:"Buxoro",center:"Buxoro",c:2,lbl:[63.2,40.45],seeds:[[64.4,39.75],[63.6,39.6],[63.2,40.3],[62.4,40.9],[64.1,40.4]]},
  {id:"sm",name:"Samarqand viloyati",short:"Samarqand",center:"Samarqand",c:4,small:true,lbl:[66.35,40.0],seeds:[[66.95,39.6],[66.2,39.85],[66.6,40.15],[67.4,39.4]]},
  {id:"jz",name:"Jizzax viloyati",short:"Jizzax",center:"Jizzax",c:2,small:true,lbl:[67.5,40.55],seeds:[[67.85,40.1],[67.3,40.6],[68.3,39.95],[67.9,40.7]]},
  {id:"sd",name:"Sirdaryo viloyati",short:"Sirdaryo",center:"Guliston",c:3,small:true,lbl:[68.62,40.68],seeds:[[68.8,40.45],[68.55,40.85],[68.8,40.2]]},
  {id:"tv",name:"Toshkent viloyati",short:"Toshkent vil.",center:"Nurafshon",c:0,small:true,lbl:[70.1,41.3],seeds:[[69.3,40.45],[69.0,41.15],[69.6,41.0],[70.15,41.0],[69.7,41.45],[70.1,41.7],[70.5,41.9]]},
  {id:"nm",name:"Namangan viloyati",short:"Namangan",center:"Namangan",c:1,small:true,lbl:[71.25,41.2],seeds:[[71.65,41.05],[71.1,40.95],[71.95,41.15]]},
  {id:"an",name:"Andijon viloyati",short:"Andijon",center:"Andijon",c:4,small:true,lbl:[72.75,40.95],seeds:[[72.35,40.78],[72.8,40.75]]},
  {id:"fg",name:"Farg'ona viloyati",short:"Farg'ona",center:"Farg'ona",c:2,small:true,lbl:[71.2,40.25],seeds:[[71.75,40.4],[71.0,40.5],[71.35,40.35],[72.05,40.45]]},
  {id:"qd",name:"Qashqadaryo viloyati",short:"Qashqadaryo",center:"Qarshi",c:0,lbl:[65.5,38.32],seeds:[[65.8,38.85],[66.6,38.95],[65.0,39.1],[66.3,38.4],[65.3,38.55],[64.6,38.9]]},
  {id:"sx",name:"Surxondaryo viloyati",short:"Surxondaryo",center:"Termiz",c:3,lbl:[67.75,38.15],seeds:[[67.3,37.4],[67.0,37.8],[67.6,38.1],[67.9,38.5],[67.9,37.9]]}
];
const TASH_CITY={id:"ts",name:"Toshkent shahri",short:"Toshkent sh.",center:"Toshkent",c:2,cx:12000,cy:9300,rx:12500,ry:9500};
const SEEDS=[]; REGIONS.forEach(r=>r.seeds.forEach(([lng,lat])=>SEEDS.push({...ll2w(lng,lat),r})));
function clipHalf(poly,a,b){
  const nx=b.x-a.x, ny=b.y-a.y, c=((a.x+b.x)/2)*nx+((a.y+b.y)/2)*ny, f=p=>p.x*nx+p.y*ny-c, out=[];
  for(let i=0;i<poly.length;i++){
    const P=poly[i], Q=poly[(i+1)%poly.length], fp=f(P), fq=f(Q);
    if(fp<=0) out.push(P);
    if((fp<0&&fq>0)||(fp>0&&fq<0)){const t=fp/(fp-fq);out.push({x:P.x+(Q.x-P.x)*t,y:P.y+(Q.y-P.y)*t});}
  }
  return out;
}
const CELLS=(()=>{
  const xs=UZB.map(p=>p.x), ys=UZB.map(p=>p.y);
  const x0=Math.min(...xs)-200000, x1=Math.max(...xs)+200000, y0=Math.min(...ys)-200000, y1=Math.max(...ys)+200000;
  return SEEDS.map((s,i)=>{let poly=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
    SEEDS.forEach((o,j)=>{ if(j!==i&&poly.length) poly=clipHalf(poly,s,o); }); return poly;});
})();
const RING_ID={"Navoiy Region":"nv","Xorazm Region":"xo","Bukhara Region":"bx","Surxondaryo Region":"sx","Samarqand Region":"sm","Jizzakh Region":"jz","Qashqadaryo Region":"qd","Namangan Region":"nm","Fergana Region":"fg","Tashkent Region":"tv","Sirdaryo Region":"sd","Tashkent":"ts","Andijan Region":"an","Republic of Karakalpakstan":"qq"};
const REG_RINGS={}; // id -> {o:[halqalar], i:[ichki halqalar]}
if(BOUNDS) Object.values(BOUNDS.regions).forEach(v=>{const id=RING_ID[v.alt[0]]; if(id) REG_RINGS[id]={o:v.o.map(decRing),i:v.i.map(decRing)};});
const HAVE_REAL_REG=Object.keys(REG_RINGS).length>=13;
const polyD=poly=>poly.length?`M${poly.map(p=>`${Math.round(p.x)},${Math.round(p.y)}`).join("L")}Z`:"";
const ellD=e=>`M${e.cx-e.rx},${e.cy}a${e.rx},${e.ry} 0 1 0 ${2*e.rx},0a${e.rx},${e.ry} 0 1 0 ${-2*e.rx},0Z`;
const regionD=r=>HAVE_REAL_REG&&REG_RINGS[r.id]?ringsD(REG_RINGS[r.id].o)+ringsD(REG_RINGS[r.id].i):r===TASH_CITY?ellD(r):SEEDS.map((s,i)=>s.r===r?polyD(CELLS[i]):"").join("")+(r.id==="tv"?ellD(TASH_CITY):""); // Toshkent viloyatidan shahar "teshik" qilib chiqariladi (evenodd)
function regionAt(p){
  if(HAVE_REAL_REG){
    for(const id in REG_RINGS){const g=REG_RINGS[id]; if(g.o.some(r=>inRing(r,p))&&!g.i.some(r=>inRing(r,p))) return regionById(id);}
  }
  const e=TASH_CITY; if(((p.x-e.cx)/e.rx)**2+((p.y-e.cy)/e.ry)**2<=1) return e;
  let b=SEEDS[0],bd=Infinity; for(const s of SEEDS){const d=dist(s,p);if(d<bd){bd=d;b=s;}} return b.r;
}
const realBorderD=()=>Object.values(REG_RINGS).map(g=>ringsD(g.o)+ringsD(g.i)).join("");
function regionsSvg(){
  let fill=REGIONS.map(r=>`<path d="${regionD(r)}" style="fill:${RCOL[r.c]};stroke:${RCOL[r.c]}"/>`).join("");
  fill+=`<path class="tsfill" d="${regionD(TASH_CITY)}" style="fill:${RCOL[TASH_CITY.c]};stroke:${RCOL[TASH_CITY.c]}"/>`;
  let bd="";
  CELLS.forEach((poly,i)=>{
    for(let k=0;k<poly.length;k++){
      const P=poly[k], Q=poly[(k+1)%poly.length], m={x:(P.x+Q.x)/2,y:(P.y+Q.y)/2}, di=dist(m,SEEDS[i]);
      let bj=-1,bdj=Infinity; SEEDS.forEach((s,j)=>{ if(j===i)return; const d=dist(m,s); if(d<bdj){bdj=d;bj=j;} });
      if(bj>i&&Math.abs(bdj-di)<5&&SEEDS[bj].r!==SEEDS[i].r) bd+=`M${Math.round(P.x)},${Math.round(P.y)}L${Math.round(Q.x)},${Math.round(Q.y)}`;
    }
  });
  if(HAVE_REAL_REG) bd="";
  return `<g class="regions" clip-path="url(#uzbClip)"><g class="rfill">${fill}</g><path class="rborder" d="${bd}"/><path class="rborder" d="${HAVE_REAL_REG?realBorderD():ellD(TASH_CITY)}"/><path class="rsel" id="rsel" d=""/></g>`;
}
function selectRegion(r){ const el=document.getElementById("rsel"); if(el) el.setAttribute("d",r?regionD(r):"");
  document.querySelectorAll(".city.town").forEach(t=>t.classList.toggle("on",!!r&&t.dataset.rid===r.id)); }
const regionById=id=>REGIONS.find(r=>r.id===id)||TASH_CITY;
function curRegion(){ return state.region?regionById(state.region):null; }
const locality=s=>(s.region||"ts")==="ts"?`${s.district} tumani, Toshkent`:`${s.district}, ${regionById(s.region).name}`;

/* ---------- Viloyat markazlari: Toshkentdagidek ko'chalar, park, kanal, aeroport, jamoat joylari va xizmatlar ----------
   (Toshkent ma'lumotlaridan keyin yaratiladi, ularning id'lari o'zgarmasin. Shahar sxemasi umumlashtirilgan, taxminiy.) */
const STREETS=["Amir Temur ko'chasi","Alisher Navoiy ko'chasi","Mustaqillik ko'chasi","Bobur ko'chasi","Ibn Sino ko'chasi"];
const CITY_GRIDS=[], AIRPORTS=[{x:13300,y:14300,a:-8}];
const regionOfCity=c=>c.capital?TASH_CITY:c.rid?REGIONS.find(r=>r.id===c.rid):(REGIONS.find(r=>r.center===c.name)||regionAt(c));
// Taniqli joylar: [tur, nom, lng, lat, tavsif, joylashgan shahar (markazdan tashqarida bo'lsa)] — koordinatalar taxminiy
const LANDMARKS={
  "Samarqand":[["tour","Registon maydoni",66.9755,39.6547,"Uchta madrasa o'rab turgan tarixiy maydon, shaharning ramzi."],["tour","Go'ri Amir maqbarasi",66.9688,39.6485,"Amir Temur va temuriylar dafn etilgan maqbara."],["tour","Shohi Zinda majmuasi",66.9877,39.6630,"XI–XIX asrlarga oid maqbaralar ko'chasi."],["tour","Bibixonim masjidi",66.9790,39.6610,"Amir Temur davrida qurilgan ulkan jome masjidi."],["museum","Ulug'bek rasadxonasi muzeyi",67.0055,39.6748,"XV asr rasadxonasi qoldiqlari va muzey."]],
  "Buxoro":[["tour","Ark qal'asi",64.4097,39.7779,"Buxoro amirlarining qadimiy qal'asi."],["tour","Poyi Kalon majmuasi",64.4144,39.7757,"Minorai Kalon, masjid va madrasadan iborat majmua."],["tour","Labi Hovuz",64.4203,39.7741,"Hovuz atrofidagi madrasa va xonaqoh ansambli."],["tour","Somoniylar maqbarasi",64.4012,39.7774,"IX–X asrlarga oid g'ishtin maqbara."]],
  "Urganch":[["tour","Ichan Qal'a",60.3594,41.3783,"Devor bilan o'ralgan tarixiy ichki shahar.","Xiva"]],
  "Nukus":[["museum","Savitskiy nomidagi san'at muzeyi",59.6100,42.4650,"Qoraqalpog'iston davlat san'at muzeyi, avangard to'plami bilan mashhur."]],
  "Qarshi":[["tour","Oqsaroy",66.8270,39.0600,"Amir Temur saroyi qoldiqlari.","Shahrisabz"]],
  "Farg'ona":[["tour","Xudoyorxon o'rdasi",70.9420,40.5450,"Qo'qon xonlarining XIX asr saroyi.","Qo'qon"]],
  "Andijon":[["museum","Bobur adabiy-memorial muzeyi",72.3500,40.7850,"Zahiriddin Muhammad Boburga bag'ishlangan muzey."]],
  "Jizzax":[["park","Zomin milliy bog'i",68.40,39.62,"Tog'li milliy bog': archazorlar va dam olish maskanlari.","Zomin"]]
};
const HAS_AIRPORT=new Set(["Samarqand","Buxoro","Urganch","Nukus","Termiz","Qarshi","Navoiy","Andijon","Namangan","Farg'ona"]);
// Tuman markazlari va boshqa shaharlar (koordinatalar taxminiy) — viloyat faqat markazidan iborat bo'lib qolmasligi uchun
const TOWN_LIST={
  qq:[["Beruniy",60.75,41.69],["To'rtko'l",61.00,41.55],["Xo'jayli",59.45,42.40],["Qo'ng'irot",58.90,43.07],["Mo'ynoq",59.02,43.77],["Chimboy",59.78,42.94]],
  xo:[["Xiva",60.36,41.38],["Xonqa",60.79,41.47],["Hazorasp",61.07,41.32]],
  nv:[["Zarafshon",64.20,41.57],["Uchquduq",63.55,42.16],["Nurota",65.69,40.56]],
  bx:[["G'ijduvon",64.68,40.10],["Kogon",64.55,39.72],["Qorako'l",63.85,39.50]],
  sm:[["Kattaqo'rg'on",66.26,39.90],["Urgut",67.24,39.40]],
  jz:[["Zomin",68.40,39.96],["G'allaorol",67.59,40.02]],
  sd:[["Yangiyer",68.82,40.27],["Shirin",69.05,40.23],["Sirdaryo",68.66,40.84]],
  tv:[["Chirchiq",69.58,41.47],["Angren",70.14,41.02],["Olmaliq",69.60,40.85],["Bekobod",69.22,40.22],["Yangiyo'l",69.05,41.11]],
  nm:[["Chust",71.24,41.00],["Chortoq",71.82,41.07],["Pop",71.11,40.87]],
  an:[["Asaka",72.24,40.64],["Xonobod",72.93,40.80],["Shahrixon",72.06,40.71]],
  fg:[["Qo'qon",70.94,40.53],["Marg'ilon",71.72,40.47],["Quvasoy",71.98,40.30],["Rishton",71.28,40.36]],
  qd:[["Shahrisabz",66.83,39.06],["G'uzor",66.25,38.62],["Koson",65.58,39.04],["Muborak",65.15,39.26]],
  sx:[["Denov",67.90,38.27],["Sherobod",67.03,37.67],["Boysun",67.20,38.21],["Sho'rchi",67.79,38.00]]
};
const TOWNS=[];
Object.entries(TOWN_LIST).forEach(([rid,arr])=>arr.forEach(([name,lng,lat])=>TOWNS.push({id:"t"+TOWNS.length,name,rid,town:true,lng,lat,...ll2w(lng,lat)})));
const CITY_LABELS=[]; // shahar ichidagi mahalla nomlari (Toshkentdagi tuman yozuvlari kabi)
function buildCity(c,f=1){
  const real=!!realAreaAt(c.x,c.y);   // haqiqiy ko'chalar bor: sxematik ko'cha/park/kanal faqat ma'lumot uchun saqlanadi, chizilmaydi
  const rot=rnd()*Math.PI, streets=STREETS;
  const mh=[...MAHALLA];
  for(let i=0;i<5;i++){ const a=rot+i*1.257+range(-.3,.3), r=range(1600,4200)*f, ni=Math.floor(rnd()*mh.length);
    CITY_LABELS.push({x:Math.round(c.x+Math.cos(a)*r),y:Math.round(c.y+Math.sin(a)*r),name:mh.splice(ni,1)[0]}); }
  streets.forEach((name,i)=>{
    const a=rot+i*2*Math.PI/streets.length+range(-.2,.2), L=range(7000,9000)*f, pts=[];
    for(let t=0;t<=4;t++){const r=L*t/4, w=t>0&&t<4?range(-300,300)*f:0;pts.push([Math.round(c.x+Math.cos(a)*r-Math.sin(a)*w),Math.round(c.y+Math.sin(a)*r+Math.cos(a)*w)]);}
    ROADS.push({name,major:i<2,label:true,pts,city:c.name,skip:real});
  });
  ROADS.push({name:"Halqa yo'li",major:false,label:false,pts:ellipsePts(c.x,c.y,Math.round(range(3600,4600)*f),Math.round(range(3000,3800)*f),48),city:c.name,skip:real});
  if(!real) CITY_GRIDS.push({x:c.x,y:c.y,r:Math.round(6500*f),rot});
  for(let i=0;i<3;i++){const a=rnd()*6.28,r=range(900,3600)*f;PARKS.push([Math.round(c.x+Math.cos(a)*r),Math.round(c.y+Math.sin(a)*r),Math.round(range(260,520)),Math.round(range(180,360)),Math.round(range(-30,30)),real?1:0]);}
  const wa=rot+Math.PI/2+range(-.4,.4);
  WATER.push({name:"kanal",skip:real,pts:[-1,-.5,0,.5,1].map((t,i)=>{const off=(i%2?range(-600,600):0)+1200*f;return [Math.round(c.x+Math.cos(wa)*t*9000*f-Math.sin(wa)*off),Math.round(c.y+Math.sin(wa)*t*9000*f+Math.cos(wa)*off)];})});
  if(HAS_AIRPORT.has(c.name)){const a=rnd()*6.28;AIRPORTS.push({x:Math.round(c.x+Math.cos(a)*6800),y:Math.round(c.y+Math.sin(a)*6800),a:Math.round(range(-40,40)),city:c});}
}
function populate(c){
  const town=!!c.town;
  buildCity(c,town?.8:1);
  const r=regionOfCity(c), rs=r.short.replace(" vil.","");
  const near=(d0,d1)=>{const a=rnd()*6.28,rr=range(d0,d1);return [c.x+Math.cos(a)*rr,c.y+Math.sin(a)*rr];};
  const P=(t,name,xy,desc,town)=>{addPlace(t,name,xy[0],xy[1],desc,town||c.name);const p=places[places.length-1];p.city=c.name;p.region=r.id;p.area=`${town||c.name}${town?"":" shahri"}, ${r.name}`;};
  const addServices=(n,rad0)=>{for(let i=0;i<n;i++){
    const ang=rnd()*Math.PI*2, rad=200+Math.sqrt(rnd())*rad0;
    const s=makeService(CAT_KEYS[i%6],c.x+Math.cos(ang)*rad,c.y+Math.sin(ang)*rad,c.name);
    s.region=r.id; s.district=c.name;
    services.push(s);
    (myReviews[s.id]||[]).forEach(rv=>applyReview(s,rv));
  }};
  // Viloyat markazi ham, tuman shahri ham bir xil to'liq to'plamni oladi; markazda qo'shimcha viloyat muassasalari bor
  const pk=PARKS.length-3, f=town?.8:1;
  if(!town) P("gov",r.id==="qq"?"Qoraqalpog'iston Respublikasi Vazirlar Kengashi":`${rs} viloyati hokimligi`,near(200,700),"Hududiy ijroiya hokimiyati: murojaatlar, fuqarolarni qabul qilish.");
  P("gov",`${c.name} shahar hokimligi`,near(300,1300*f),"Shahar hokimligi: murojaatlar va fuqarolarni qabul qilish.");
  P("gov","Davlat xizmatlari markazi",near(600,2200*f),"Pasport, ma'lumotnoma va boshqa davlat xizmatlarini bir joyda olish.");
  for(let i=0;i<3;i++) P("school",`${1+Math.floor(rnd()*60)}-umumta'lim maktabi`,near(800,4800*f),"Davlat umumta'lim maktabi, 1–11-sinflar.");
  for(let i=0;i<2;i++) P("kinder",`${1+Math.floor(rnd()*90)}-son DMTT (bog'cha)`,near(700,4500*f),"Davlat maktabgacha ta'lim tashkiloti, 3–7 yoshli bolalar uchun.");
  P("park",`${c.name} markaziy bog'i`,[PARKS[pk][0],PARKS[pk][1]],"Shahar markaziy bog'i: sayr yo'laklari, bolalar maydonchalari.");
  P("park",`${c.name} istirohat bog'i`,[PARKS[pk+1][0],PARKS[pk+1][1]],"Dam olish bog'i, oilaviy sayr uchun.");
  P("museum",town?`${c.name} tarix muzeyi`:r.id==="qq"?"Qoraqalpog'iston o'lkashunoslik muzeyi":`${rs} viloyat o'lkashunoslik muzeyi`,near(300,1800*f),"Hudud tarixi, tabiati va madaniyatiga oid ekspozitsiyalar.");
  if(!town) (LANDMARKS[c.name]||[]).forEach(([t,name,lng,lat,desc,lt])=>{const p=ll2w(lng,lat);P(t,name,[p.x,p.y],desc,lt);});
  const ap=AIRPORTS.find(a=>a.city===c);
  if(ap) P("airport",`${c.name} aeroporti`,[ap.x,ap.y],"Viloyat aeroporti: ichki va xalqaro reyslar.");
  addServices(town?18:c.name==="Nurafshon"?14:24,town?4400:5500);
}
CITIES.forEach(c=>{ if(!c.capital) populate(c); });
TOWNS.forEach(populate);

function drawCountry(){
  let h=NEIGHBORS.map(([n,lng,lat])=>{const p=ll2w(lng,lat);return `<g data-sx="${p.x}" data-sy="${p.y}"><text class="ctry" text-anchor="middle">${esc(n)}</text></g>`;}).join("");
  h+=REGIONS.map(r=>{const p=ll2w(...r.lbl);return `<g data-sx="${p.x}" data-sy="${p.y}"><text class="rlbl${r.small?" small":""}" text-anchor="middle">${esc(r.short)}</text></g>`;}).join("");
  h+=CITIES.map(c=>`<g class="city${c.capital?" capital":""}" data-kind="city" data-id="${c.id}" data-sx="${c.x}" data-sy="${c.y}">
    <circle class="cdot" r="${c.capital?6:4.5}"/><text x="${c.capital?-10:9}" y="4" text-anchor="${c.capital?"end":"start"}">${esc(c.name)}</text></g>`).join("");
  h+=TOWNS.map(c=>`<g class="city town" data-kind="city" data-id="${c.id}" data-rid="${c.rid}" data-sx="${c.x}" data-sy="${c.y}"><circle class="cdot" r="3.5"/><text x="8" y="4">${esc(c.name)}</text></g>`).join("");
  $("#gCountry").innerHTML=h;
}

function drawBase(){
  let h=`<rect class="out" x="-3000000" y="-2000000" width="5000000" height="4000000"/>`;
  h+=`<path class="uzb" d="${ringsD(UZB_RINGS)}"/>`;
  h+=regionsSvg();
  let gd="";
  for(let x=600;x<W;x+=1100){const j=((x*7)%320)-160;gd+=`M${x+j},-300L${x-j},${H+300}`;}
  for(let y=500;y<H;y+=1000){const j=((y*5)%260)-130;gd+=`M-300,${y+j}L${W+300},${y-j}`;}
  CITY_GRIDS.forEach(g=>[g.rot,g.rot+Math.PI/2].forEach(th=>{
    const ux=Math.cos(th),uy=Math.sin(th);
    for(let k=-g.r+450;k<g.r;k+=950){const half=Math.sqrt(g.r*g.r-k*k);
      gd+=`M${Math.round(g.x-uy*k-ux*half)},${Math.round(g.y+ux*k-uy*half)}L${Math.round(g.x-uy*k+ux*half)},${Math.round(g.y+ux*k+uy*half)}`;}
  }));
  h+=`<path class="minor" d="${gd}"/>`;
  PARKS.forEach(([x,y,rx,ry,a,sk])=>{ if(!sk) h+=`<ellipse class="park" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`;});
  AIRPORTS.forEach(a=>h+=`<g transform="rotate(${a.a} ${a.x} ${a.y})"><rect class="air" x="${a.x-1400}" y="${a.y-550}" width="2800" height="1100" rx="160"/><line class="runway" x1="${a.x-1150}" y1="${a.y+120}" x2="${a.x+1150}" y2="${a.y+120}"/><line class="runway" x1="${a.x-950}" y1="${a.y-220}" x2="${a.x+950}" y2="${a.y-220}"/></g>`);
  WATER.forEach(w=>{ if(!w.skip) h+=`<path class="water" d="${smooth(w.pts)}"/>`; });
  ROADS.forEach(r=>{ if(!r.skip) h+=`<path class="road-edge${r.major?" major":""}" d="${smooth(r.pts)}"/>`; });
  ROADS.forEach(r=>{ if(!r.skip) h+=`<path class="road${r.major?" major":""}" d="${smooth(r.pts)}"/>`; });
  $("#gBase").innerHTML=h;
  let defs="",lbl="";
  ROADS.forEach((r,i)=>{ if(!r.label||r.skip)return; let p=r.pts; if(p[0][0]>p[p.length-1][0]) p=[...p].reverse();
    defs+=`<path id="rp${i}" d="${smooth(p)}"/>`;
    lbl+=`<text class="roadlbl" dy="-0.7em"><textPath href="#rp${i}" startOffset="58%" text-anchor="middle">${esc(r.name)}</textPath></text>`; });
  defs+=`<clipPath id="uzbClip"><path d="${ringsD(UZB_RINGS)}"/></clipPath>`;
  $("#mapDefs").innerHTML=defs; $("#gRoadLabels").innerHTML=lbl;
  $("#gDistricts").innerHTML=DISTRICTS.map(d=>`<g data-sx="${d.x}" data-sy="${d.y}"><text class="dlbl" text-anchor="middle" y="-24">${esc(d.name)}</text></g>`).join("")
    ;
}

const markerEls={};
/* Tezlik: belgilar ekrandagi hudud (+50% chegara) uchun to'liq chiziladi; uzoq ko'rinishda (k>=40) har biri bitta nuqta.
   Xarita surilganda/masshtab o'zgarganda oyna tashqarisiga chiqsa, qisqa kechikish bilan qayta chiziladi. */
let lastMarkerList=[], mWin=null, mTimer=0;
function renderMarkers(list){
  lastMarkerList=list;
  const k=kpx(), dot=k>=40, mx=view.w*.5, my=view.h*.5, x0=view.x-mx, x1=view.x+view.w+mx, y0=view.y-my, y1=view.y+view.h+my;
  mWin={x0,y0,x1,y1,dot,w:view.w};
  const inWin=o=>o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1, selId=state.sel&&state.sel.id, visible=new Set(list.map(r=>r.s.id));
  let h=""; const cs=k*9, seenP=new Set(), seenS=new Set(), gk=(x,y)=>Math.floor(x/cs)*100003+Math.floor(y/cs);
  places.forEach(p=>{
    if(!state.layers.has(p.t)||!inRegion(p))return;
    const sel=selId===p.id;
    if(dot){
      if(k>=150&&!state.region&&!sel) return;     // butun mamlakat ko'rinishida jamoat joylari faqat viloyat tanlanganda
      if(!sel){ const g=gk(p.x,p.y); if(seenP.has(g)) return; seenP.add(g); }
      h+=`<g class="mk pm dot${sel?" sel":""}" data-kind="place" data-id="${p.id}" data-sx="${p.x}" data-sy="${p.y}">${sel?'<rect class="halo" x="-14" y="-14" width="28" height="28" rx="9"/>':""}<rect class="ring" x="-10" y="-10" width="20" height="20" rx="6" style="fill:${PTYPES[p.t].color}"/></g>`;
      return;
    }
    if(!sel&&!inWin(p)) return;
    h+=`<g class="mk pm${sel?" sel":""}" data-kind="place" data-id="${p.id}" data-sx="${p.x}" data-sy="${p.y}">
      <rect class="halo" x="-14" y="-14" width="28" height="28" rx="9"/>
      <rect class="ring" x="-10" y="-10" width="20" height="20" rx="6" style="fill:${PTYPES[p.t].color}"/>
      <use href="#ic-${p.t}" x="-6.5" y="-6.5" width="13" height="13"/>
      <text class="lbl" x="15" y="4">${esc(p.name)}</text></g>`;
  });
  $("#gPlaces").innerHTML=h;
  h="";
  services.forEach(s=>{
    if(!visible.has(s.id))return;
    const sel=selId===s.id;
    if(dot){
      if(!sel){ const g=gk(s.x,s.y); if(seenS.has(g)) return; seenS.add(g); }
      h+=`<g class="mk sm dot${sel?" sel":""}" data-kind="service" data-id="${s.id}" data-sx="${s.x}" data-sy="${s.y}">${sel?'<circle class="halo" r="16"/>':""}<circle class="ring" r="11.5" style="fill:${CATS[s.cat].color}"/></g>`;
      return;
    }
    if(!sel&&!inWin(s)) return;
    h+=`<g class="mk sm${sel?" sel":""}" data-kind="service" data-id="${s.id}" data-sx="${s.x}" data-sy="${s.y}">
      <circle class="halo" r="16"/>
      <circle class="ring" r="11.5" style="fill:${CATS[s.cat].color}"/>
      <use href="#ic-${s.cat}" x="-7" y="-7" width="14" height="14"/>
      <text class="lbl" x="16" y="4">${esc(s.name)}</text></g>`;
  });
  $("#gServices").innerHTML=h;
  // tanlangan belgi eng ustda turishi uchun
  const selEl=svg.querySelector(".mk.sel"); if(selEl) selEl.parentNode.appendChild(selEl);
  for(const kk in markerEls) delete markerEls[kk];
  svg.querySelectorAll(".mk").forEach(el=>markerEls[el.dataset.id]=el);
  renderOverlays();
  applyView();
}
function checkMarkerWindow(k){
  if(!mWin) return;
  const dot=k>=40;
  if(view.x<mWin.x0||view.y<mWin.y0||view.x+view.w>mWin.x1||view.y+view.h>mWin.y1||dot!==mWin.dot||view.w>mWin.w*1.9||view.w<mWin.w/3){
    clearTimeout(mTimer); mTimer=setTimeout(()=>renderMarkers(lastMarkerList), dot!==mWin.dot?20:90);
  }
}
function renderOverlays(){
  markersDirty=true;
  const u=state.user;
  $("#gUser").innerHTML=(u.acc>5?`<circle class="acc" cx="${u.x}" cy="${u.y}" r="${u.acc}"/>`:"")+`<g class="user" data-sx="${u.x}" data-sy="${u.y}"><circle class="pulse" r="24"/><circle class="dot" r="8"/><text class="lbl" x="14" y="-10">Siz</text></g>`;
  { const lat=ORIGIN.lat-(u.y-ORIGIN.y)/111000, rm=state.radius*1000, rx=rm*83900/(111320*Math.cos(lat*RAD)), ry=rm*111000/111195;
    $("#gRadius").innerHTML=state.radius?`<ellipse class="radius" cx="${u.x}" cy="${u.y}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>`:""; }
  const t=selectedPoint();
  let routeSvg="";
  if(t){ const rt=getRoute(u,t), pd=r=>`M${r.pts.map(q=>`${Math.round(q[0])},${Math.round(q[1])}`).join("L")}`;
    if(rt&&(rt.drive||rt.walk)){
      if(rt.walk&&(!rt.drive||Math.abs(rt.walk.len-rt.drive.len)>rt.drive.len*.05)) routeSvg+=`<path class="route-walk" d="${pd(rt.walk)}"/>`;
      if(rt.drive) routeSvg+=`<path class="route-case" d="${pd(rt.drive)}"/><path class="route-car" d="${pd(rt.drive)}"/>`; }
    else routeSvg=`<line class="route" x1="${u.x}" y1="${u.y}" x2="${t.x}" y2="${t.y}"/>`; }
  $("#gRoute").innerHTML=routeSvg;
  const m=state.mark;
  $("#gMark").innerHTML=m?`<g data-sx="${m.x}" data-sy="${m.y}" style="pointer-events:none"><path class="markpin" d="M0,0 C-2,-7 -11,-11 -11,-20 A11,11 0 1 1 11,-20 C11,-11 2,-7 0,0Z"/><circle class="markpin-dot" cy="-20" r="4"/></g>`:"";
}
/* Hisoblash nuqtasi: barcha masofalar shu nuqtadan. GPS bo'lsa aniq joylashuv, bo'lmasa koordinata yoki xaritadan tanlash. */
function setUser(x,y,label,acc){
  const was=state.user?userRegion():null, follow=!!was&&state.region===was.id;
  state.user={x:Math.round(x),y:Math.round(y),label,acc:acc||0}; routeCache.clear();
  if(follow){ const nr=userRegion(); state.region=nr.id; selectRegion(nr); }
  renderOrigin(); renderOverlays(); render();
  const ll=toLatLng(state.user.x,state.user.y);
  toast(`Hisoblash nuqtasi: ${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`);
}
function renderOrigin(){ renderOrigin0(); enhanceSelects(); }
function renderOrigin0(){
  const u=state.user, ll=toLatLng(u.x,u.y), open=!$("#ocoord")||!$("#ocoord").hidden;
  $("#originBar").innerHTML=`<div class="origin"><div class="ot"><span class="eyebrow">Masofa shu nuqtadan hisoblanadi</span><b>${esc(u.label)}</b>
    <span class="muted">${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}${u.acc>5?` · ±${Math.round(u.acc)} m`:""}</span></div>
    <div class="oa"><button class="btn sm" data-act="geolocate">${ic("locate")} Joylashuvimni aniqlash</button><button class="btn sm" data-act="coord-toggle">${ic("pin")} Koordinata kiritish</button>
      <select class="citysel csel" id="citySel" aria-label="Shaharni tanlang"><option value="">Shaharni tanlang</option>${CITIES.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
    <form class="ocoord" id="ocoord" hidden novalidate><input class="input" id="ocin" inputmode="decimal" autocomplete="off" placeholder="41.29950, 69.24010" aria-label="Koordinata (kenglik, uzunlik)"><button class="btn btn-accent sm" type="submit">Qo'yish</button><em class="err" id="ocerr"></em></form></div>`;
}
document.addEventListener("change",e=>{
  if(!e.target||e.target.id!=="citySel"||!e.target.value) return;
  const c=CITIES.concat(TOWNS).find(x=>x.id===e.target.value); if(!c) return;
  setUser(c.x,c.y,`${c.name} markazi`,0); flyTo(c.x,c.y,Math.min(view.w,7000));
});
function parseCoord(txt){
  const n=(txt.replace(/[°NSEWnsew]/g," ").match(/-?\d+(?:[.,]\d+)?/g)||[]).map(v=>parseFloat(v.replace(",",".")));
  if(n.length<2) return null;
  let lat=n[0], lng=n[1];
  if(lat>46&&lng<46) [lat,lng]=[lng,lat];            // teskari yozilgan bo'lsa (uzunlik, kenglik)
  if(!(lat>=36&&lat<=46&&lng>=55&&lng<=74)) return {bad:true,lat,lng};
  return {lat,lng};
}
function originHelp(msg){
  const f=$("#ocoord"); if(f){ f.hidden=false; $("#ocerr").textContent=msg; $("#ocin").focus(); }
}
function geolocate(){
  if(!navigator.geolocation){ originHelp("Bu brauzerda joylashuv aniqlanmaydi. Koordinatani qo'lda kiriting."); return; }
  toast("Joylashuv aniqlanmoqda…");
  navigator.geolocation.getCurrentPosition(pos=>{
    const c=pos.coords, w=ll2w(c.longitude,c.latitude);
    setUser(w.x,w.y,"Mening joylashuvim",c.accuracy);
    if(!inUzb(w)) toast("Siz O'zbekiston tashqarisidasiz: masofalar baribir shu nuqtadan hisoblanadi");
    flyTo(w.x,w.y,Math.min(view.w,7000));
  },err=>originHelp(err&&err.code===1?"Brauzer bu sahifaga joylashuvni bermadi (artifact ichida GPS bloklangan). Koordinatani qo'lda kiriting: telefon xaritasida joyni bosib turing, koordinata chiqadi.":"Joylashuvni aniqlab bo'lmadi. Koordinatani qo'lda kiriting."),
  {enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}
function selectedPoint(){
  if(!state.sel)return null;
  if(state.sel.kind==="service")return byId(state.sel.id);
  if(state.sel.kind==="place")return places.find(p=>p.id===state.sel.id);
  if(state.sel.kind==="point")return state.mark;
  return null;
}

/* ---------- filtrlash va ro'yxat ---------- */
const norm = s => String(s).toLowerCase().replace(/[‘’ʻʼ`´]/g,"'").trim();
function matches(s,q){ return norm(`${s.name} ${CATS[s.cat].label} ${s.district} ${regionById(s.region||"ts").name} ${s.address} ${s.desc||""} ${lang!=="uz"?trText(CATS[s.cat].label)+" "+trText(s.desc||"")+" "+trText(s.district)+" "+trText(regionById(s.region||"ts").name):""}`).includes(q); }
function filtered(ignoreCat){
  const q=norm(state.q);
  let arr=services.map(s=>({s,d:gdist(s,state.user)})).filter(({s,d})=>
    (ignoreCat||state.cat==="all"||s.cat===state.cat) &&
    (!state.radius||d<=state.radius*1000) &&
    (!state.minRating||(s.count>0&&s.rating>=state.minRating)) &&
    (!state.openNow||status(s).open) &&
    (!q||matches(s,q)) &&
    (!state.region||(s.region||"ts")===state.region));
  if(!ignoreCat){
    const by={dist:(a,b)=>a.d-b.d,rating:(a,b)=>(b.s.rating-a.s.rating)||(b.s.count-a.s.count),reviews:(a,b)=>b.s.count-a.s.count}[state.sort];
    arr.sort(by);
  }
  return arr;
}
/* Har bir xizmatning o'z logotipi: s.logo (rasm manzili yoki data:) bo'lsa o'sha, bo'lmasa nomidan noyob belgi yaratiladi
   (bosh harflar, rang, shakl va bezak nomdan olingan hash'ga bog'liq; turi - burchakdagi kichik belgi) */
const LOGO_PAL=[["#1951fc","#6db4ff"],["#7c3aed","#c4a7ff"],["#0d9488","#5eead4"],["#ea580c","#fdba74"],["#db2777","#f9a8d4"],["#16a34a","#86efac"],["#0b2cb1","#3781fc"],["#be123c","#fda4af"],["#0369a1","#7dd3fc"],["#a16207","#fde047"]];
const logoCache=new Map();
function serviceLogo(s){
  if(s.logo) return `<img class="logoimg" src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy" decoding="async">`;
  let svg=logoCache.get(s.id); if(svg) return svg;
  const words=s.name.replace(/['’ʻ`]/g,"").split(/[\s\-–]+/).filter(Boolean);
  const ini=(words.length>1?words[0][0]+words[1][0]:words[0].slice(0,2)).toUpperCase();
  let h=2166136261; for(const ch of s.name){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } h>>>=0;
  const pal=LOGO_PAL[h%LOGO_PAL.length], shape=(h>>>4)%5, deco=(h>>>8)%4, rot=((h>>>12)%4)*15;
  const body=[`<circle cx="24" cy="24" r="24" fill="${pal[0]}"/>`,
    `<rect width="48" height="48" rx="13" fill="${pal[0]}"/>`,
    `<path d="M24 0C42 0 48 6 48 24S42 48 24 48 0 42 0 24 6 0 24 0z" fill="${pal[0]}"/>`,
    `<path d="M24 1l20 11.5v23L24 47 4 35.500v-23z" fill="${pal[0]}"/>`,
    `<path d="M6 4h36a2 2 0 0 1 2 2v20c0 11-9 17-20 21C13 43 4 37 4 26V6a2 2 0 0 1 2-2z" fill="${pal[0]}"/>`][shape];
  const clip=[`<clipPath id="c${h}"><circle cx="24" cy="24" r="24"/></clipPath>`,`<clipPath id="c${h}"><rect width="48" height="48" rx="13"/></clipPath>`,
    `<clipPath id="c${h}"><path d="M24 0C42 0 48 6 48 24S42 48 24 48 0 42 0 24 6 0 24 0z"/></clipPath>`,
    `<clipPath id="c${h}"><path d="M24 1l20 11.5v23L24 47 4 35.500v-23z"/></clipPath>`,
    `<clipPath id="c${h}"><path d="M6 4h36a2 2 0 0 1 2 2v20c0 11-9 17-20 21C13 43 4 37 4 26V6a2 2 0 0 1 2-2z"/></clipPath>`][shape];
  const dec=[`<rect x="-10" y="${6+rot/5}" width="70" height="12" fill="${pal[1]}" opacity=".35" transform="rotate(-30 24 24)"/>`,
    `<circle cx="38" cy="8" r="17" fill="${pal[1]}" opacity=".38"/>`,
    `<circle cx="24" cy="24" r="17" fill="none" stroke="${pal[1]}" stroke-width="2.500" opacity=".55"/>`,
    `<circle cx="8" cy="40" r="19" fill="${pal[1]}" opacity=".32"/>`][deco];
  const fs=ini.length>1?19:22, cat=CATS[s.cat];
  svg=`<svg viewBox="0 0 48 48" role="img" aria-label="${esc(s.name)}"><defs>${clip}</defs>${body}<g clip-path="url(#c${h})">${dec}<rect width="48" height="20" fill="#fff" opacity=".1"/></g>
    <text x="24" y="${ini.length>1?30:31}" text-anchor="middle" font-family="Manrope,Inter,system-ui,sans-serif" font-size="${fs}" font-weight="800" fill="#fff" letter-spacing="-.5">${esc(ini)}</text>
    <circle cx="38" cy="38" r="8.500" fill="${cat.color}" stroke="#fff" stroke-width="1.800"/><svg x="33.500" y="33.500" width="9" height="9" style="color:#fff;fill:none;stroke:currentColor;stroke-width:2.600;stroke-linecap:round;stroke-linejoin:round"><use href="#ic-${s.cat}"/></svg></svg>`;
  logoCache.set(s.id,svg); return svg;
}
function cardHtml(s,d){
  const c=CATS[s.cat],st=status(s);
  return `<li><button class="card" data-open="${s.id}"><span class="cicon logo">${serviceLogo(s)}</span>
    <span class="cbody"><span class="cname">${esc(s.name)}</span><span class="cmeta">${c.label} · ${esc(s.district)}</span>
    <span class="cline">${ratingHtml(s)}<span class="pill ${st.open?"open":"closed"}">${st.text}</span></span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
}
function placeCardHtml(p,d){
  const t=PTYPES[p.t];
  return `<li><button class="card" data-open="${p.id}"><span class="cicon sq" style="background:${t.color}">${ic(p.t)}</span>
    <span class="cbody"><span class="cname">${esc(p.name)}</span><span class="cmeta">${t.one} · ${esc(p.district)}</span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
}
function renderCats(){
  const base=filtered(true), cnt={all:base.length};
  CAT_KEYS.forEach(k=>cnt[k]=base.filter(r=>r.s.cat===k).length);
  $("#cats").innerHTML=[["all","Barchasi",null],...CAT_KEYS.map(k=>[k,CATS[k].label,CATS[k].color])].map(([k,l,c])=>
    `<button class="chip" data-cat="${k}" aria-pressed="${state.cat===k}">${c?`<span class="dot" style="background:${c}"></span>`:""}${l} <span class="n">${cnt[k]}</span></button>`).join("");
}
function userRegion(){ return regionAt(state.user); }
function syncScope(){
  const ur=userRegion(), pos=state.region?0:1;
  for(const sw of document.querySelectorAll(".sw")){
    sw.dataset.pos=pos;
    const bs=sw.querySelectorAll("button"); bs[0].setAttribute("aria-pressed",String(pos===0)); bs[1].setAttribute("aria-pressed",String(pos===1)); bs[0].title=ur.name;
  }
}
function scopeLocal(toggle){ if(state.region){ if(toggle){ state.pickOpen=!state.pickOpen; renderPick(); } } else { state.pickOpen=true; setRegion(userRegion()); } }
function scopeCountry(){ state.pickOpen=false; setRegion(null); fitPoints(CITIES.map(c=>({x:c.x,y:c.y})),1.25); }
/* suriladigan tanlagich: tutqichni sudrash yoki bosish; qo'yib yuborganda eng yaqin tomonga o'rnashadi */
let swDrag=null, swNoClick=false;
document.addEventListener("pointerdown",e=>{
  const sw=e.target.closest&&e.target.closest(".sw"); if(!sw||e.button>0) return;
  const th=sw.querySelector(".sthumb"); swDrag={sw,th,x0:e.clientX,pos:+sw.dataset.pos,step:th.offsetWidth+6,moved:false,off:0,id:e.pointerId};
});
document.addEventListener("pointermove",e=>{
  const d=swDrag; if(!d||e.pointerId!==d.id) return;
  const dx=e.clientX-d.x0;
  if(!d.moved&&Math.abs(dx)>6){ d.moved=true; try{ d.sw.setPointerCapture(e.pointerId); }catch(_){} d.th.style.transition="none"; d.sw.classList.add("dragging"); }
  if(d.moved){ d.off=Math.max(0,Math.min(d.step,d.pos*d.step+dx)); d.th.style.transform=`translateX(${d.off}px)`; }
});
function endSwDrag(e){
  const d=swDrag; if(!d||e.pointerId!==d.id) return; swDrag=null;
  if(!d.moved) return;
  d.th.style.transition=""; d.th.style.transform=""; d.sw.classList.remove("dragging"); swNoClick=true; setTimeout(()=>swNoClick=false,0);
  const pos=d.off>d.step/2?1:0;
  d.sw.dataset.pos=pos;
  if(pos===0) scopeLocal(false); else scopeCountry();
}
document.addEventListener("pointerup",endSwDrag); document.addEventListener("pointercancel",endSwDrag);
/* "Viloyatni ko'rish" bosilganda tugma ustida viloyat tanlash paneli ochiladi */
function renderPick(){
  const el=$("#regPick"); if(!el) return;
  if(!state.pickOpen){ el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML=`<div class="rp-t">Viloyatni tanlang</div><div class="rp-g">${[TASH_CITY,...REGIONS].map(r=>`<button type="button" data-act="pick-region" data-id="${r.id}" aria-pressed="${state.region===r.id}">${esc(r.name)}</button>`).join("")}</div>`;
}
// boshqa viloyat shaharlari va yozuvlari viloyat rejimida yashiriladi
let cityReg=null;
function syncOutside(){
  const wrap=$("#mapwrap"); wrap.classList.toggle("not-ts",!!state.region&&state.region!=="ts");
  if(!cityReg){ cityReg={}; for(const c of CITIES.concat(TOWNS)) cityReg[c.id]=regionAt(c).id; }
  document.querySelectorAll("#gCountry .city").forEach(g=>g.classList.toggle("outr",!!state.region&&cityReg[g.dataset.id]!==state.region));
}
function regionBarHtml(){
  const ur=userRegion(), local=state.region===ur.id, all=!state.region;
  let h="";
  if(state.region&&!local){
    const r=regionById(state.region), cc=CITIES.find(c=>c.name===r.center);
    h+=`<div class="rbanner"><span class="rsw" style="background:${RCOL[r.c]}"></span>
    <div class="rbt"><span class="eyebrow">Tanlangan hudud</span><b>${esc(r.name)}</b>${cc?`<span class="muted">Markazi: ${esc(cc.name)} · sizdan ${fmtKm(gdist(cc,state.user))}</span>`:""}</div>
    <button class="btn sm" data-act="clear-region">${ic("close")} Barcha hududlar</button></div>`;
  }
  return h;
}
let curList=[];
const moreLi=n=>`<li class="more"><button class="btn sm" data-act="more-list">Yana ${n} tasini ko'rsatish</button></li>`;
// ro'yxat oxiriga yetganda keyingi kartalar o'zi qo'shiladi (tugmasiz, cheklovsiz); faqat yangilari chiziladi
let moreT=0;
function checkMore(){
  const el=document.querySelector("#results .more"); if(!el) return;
  if(el.getBoundingClientRect().top<innerHeight+900) loadMore();
}
function onScrollMore(){ const n=performance.now(); if(n-moreT<60) return; moreT=n; checkMore(); }
$("#panel").addEventListener("scroll",onScrollMore,{passive:true}); addEventListener("scroll",onScrollMore,{passive:true});
function armMore(){ checkMore(); }
function loadMore(){
  const ul=$("#results"), el=ul.querySelector(".more"); if(!el) return;
  const from=state.listLimit; state.listLimit+=40; el.remove();
  const rest=curList.length-state.listLimit;
  ul.insertAdjacentHTML("beforeend",curList.slice(from,state.listLimit).map(r=>cardHtml(r.s,r.d)).join("")+(rest>0?moreLi(Math.min(40,rest)):""));
  armMore();
}
function render(){
  $("#regionBar").innerHTML=regionBarHtml();
  syncScope(); renderPick(); syncOutside();
  renderCats();
  const list=filtered(false);
  const q=norm(state.q);
  let sub=[];
  if(state.region) sub.push(regionById(state.region).short);
  if(state.radius) sub.push(`${state.radius} km radiusda`);
  if(state.minRating) sub.push(`reyting ${fmtR(state.minRating)}+`);
  if(state.openNow) sub.push("hozir ochiq");
  sub.push("to'g'ri chiziq masofasi"); sub.push({dist:"eng yaqini birinchi",rating:"reyting bo'yicha",reviews:"sharhlar soni bo'yicha"}[state.sort]);
  $("#rcount").textContent=`${list.length} ta xizmat`;
  $("#rsub").textContent=sub.join(" · ");
  // ro'yxat 1000+ bo'lishi mumkin: 80 tadan ko'rsatiladi; filtr o'zgarsa hisob boshidan
  const lkey=JSON.stringify([state.q,state.cat,state.radius,state.minRating,state.openNow,state.sort,state.region]);
  if(lkey!==state.listKey){ const first=state.listKey===undefined||state.listKey===null; state.listKey=lkey; state.listLimit=40; if(!first) $("#panel").scrollTop=0; }
  curList=list;
  $("#results").innerHTML=list.length?list.slice(0,state.listLimit).map(r=>cardHtml(r.s,r.d)).join("")+
    (list.length>state.listLimit?moreLi(Math.min(40,list.length-state.listLimit)):""):
    `<li class="empty"><span>Bu filtrlarga mos xizmat topilmadi. Radiusni kengaytiring yoki filtrlarni tozalang.</span><button class="btn sm" data-act="reset">Filtrlarni tozalash</button></li>`;
  armMore();
  // Jamoat joylari: qidiruvda yoki viloyat tanlanganda — xarita qatlamlari (Davlat, Park, Muzey…) bo'yicha
  wrap.classList.toggle("has-region",!!state.region);
  wrap.classList.toggle("local-scope",!!state.region);
  renderLayers();
  if(q||state.region){
    const all=places.filter(p=>state.layers.has(p.t)&&inRegion(p)&&(!q||norm(`${p.name} ${PTYPES[p.t].one} ${p.district} ${p.area||""} ${lang!=="uz"?trText(p.name)+" "+trText(PTYPES[p.t].one)+" "+trText(p.district):""}`).includes(q)))
      .map(p=>({p,d:gdist(p,state.user)})).sort((a,b)=>a.d-b.d);
    const lim=state.allPlaces?all.length:24, shown=all.slice(0,lim);
    $("#placeHits").innerHTML=all.length?`<div class="sec"><div class="subhead"><span>Jamoat joylari</span><span class="muted">${all.length} ta</span></div>
      <ul class="results">${shown.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul>
      ${all.length>lim?`<button class="btn sm" data-act="more-places">Yana ${all.length-lim} tasini ko'rsatish</button>`:""}</div>`
      :(state.region&&!q?`<p class="muted" style="margin:0">Xaritada jamoat joylari qatlami yoqilmagan.</p>`:"");
  } else $("#placeHits").innerHTML="";
  renderMarkers(list);
}
function setPressed(group,val){group.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.v===String(val))));}

/* ---------- tafsilot ko'rinishlari ---------- */
const vList=$("#viewList"), vDetail=$("#viewDetail"), panel=$("#panel");
function showDetail(html){
  vDetail.innerHTML=html; vList.hidden=true; vDetail.hidden=false; panel.scrollTop=0; selectRegion(curRegion());
}
function setRegion(r){
  state.region=r?r.id:null; state.sel=null; state.mark=null; state.allPlaces=false;
  vDetail.hidden=true; vList.hidden=false; vDetail.innerHTML="";
  render(); selectRegion(r); panel.scrollTop=0;
  if(r){
    // xarita viloyatdagi xizmatlarga yaqinlashadi (belgilar to'liq ko'rinishi uchun); xizmat bo'lmasa — butun viloyatga
    const pts=services.filter(s=>(s.region||"ts")===r.id).map(s=>({x:s.x,y:s.y}));
    if(!pts.length){ if(r===TASH_CITY) pts.push({x:r.cx-r.rx,y:r.cy-r.ry},{x:r.cx+r.rx,y:r.cy+r.ry}); else r.seeds.forEach(([a,b])=>pts.push(ll2w(a,b))); }
    fitPoints(pts,1.25);
  }
}
function showList(){
  selectRegion(curRegion());
  state.sel=null; state.mark=null;
  vDetail.hidden=true; vList.hidden=false; vDetail.innerHTML="";
  render();
}
function revealPanelOnPhone(){ if(matchMedia("(max-width:860px)").matches) panel.scrollIntoView({behavior:"smooth",block:"start"}); }
function nearbyServicesHtml(pt,maxM,limit,excludeId){
  const arr=services.filter(s=>s.id!==excludeId).map(s=>({s,d:gdist(s,pt)})).filter(r=>r.d<=maxM).sort((a,b)=>a.d-b.d).slice(0,limit);
  return arr.length?`<ul class="mini">${arr.map(r=>cardHtml(r.s,r.d)).join("")}</ul>`:`<p class="muted" style="margin:0">${fmtKm(maxM)} ichida xizmat topilmadi.</p>`;
}
function nearbyPlacesHtml(pt,maxM,limit,excludeId){
  const arr=places.filter(p=>p.id!==excludeId).map(p=>({p,d:gdist(p,pt)})).filter(r=>r.d<=maxM).sort((a,b)=>a.d-b.d).slice(0,limit);
  return arr.length?`<ul class="mini">${arr.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul>`:`<p class="muted" style="margin:0">${fmtKm(maxM)} ichida jamoat joyi yo'q.</p>`;
}
const dsec=(icon,title,rows)=>`<section class="dsec"><h3>${ic(icon)} ${title}</h3><dl class="info">${rows}</dl></section>`;
const telHref=ph=>"tel:"+String(ph).replace(/[^\d+]/g,"");
const phoneRow=ph=>`<div><dt>${ic("phone")} Telefon</dt><dd><a class="tel" href="${telHref(ph)}">${esc(ph)}</a><button class="btn sm" data-act="copy" data-copy="${esc(ph)}">${ic("copy")} Nusxa</button><span class="phnote">Namuna raqam, haqiqiy emas</span></dd></div>`;
function coordRow(p){
  const ll=toLatLng(p.x,p.y), txt=`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
  return `<div><dt>${ic("map")} Koordinata</dt><dd><span class="mono">${txt}</span><button class="btn sm" data-act="copy" data-copy="${txt}">${ic("copy")} Nusxa</button></dd></div>`;
}

function openService(id,opts={}){
  const s=byId(id); if(!s)return;
  state.sel={kind:"service",id}; state.mark=null;
  const c=CATS[s.cat], st=status(s), d=gdist(s,state.user), tr=travel(d);
  const total=s.count;
  const bars=[5,4,3,2,1].map(n=>{const p=s.count?Math.round((s.dist?s.dist[n-1]:0)*100):0;return `<div class="bar"><span>${n}</span><i><b style="width:${p}%"></b></i><span>${p}%</span></div>`;}).join("");
  const revs=s.reviews.map(r=>`<li class="rev"><div class="rv-h"><span class="av">${esc((r.name||"?")[0])}</span><b>${esc(r.name)}</b>${starsHtml(r.stars)}<span class="muted">${r.ts?relDays(Math.floor((Date.now()-r.ts)/864e5)):relDays(r.ago)}</span></div><p>${esc(r.text)}</p></li>`).join("");
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon logo">${serviceLogo(s)}</span>
      <div class="dtitle"><span class="eyebrow">${c.label}</span><h2>${esc(s.name)}</h2>
      <div class="cline">${ratingHtml(s)}<span class="pill ${st.open?"open":"closed"}">${st.text}</span></div></div></div>
    ${galleryHtml(s.cat,c.color,s.id)}
    <div class="actions">
      ${mapLinks(s)}<button class="btn btn-primary" data-act="route">${ic("route")} Yo'nalish</button>
      <a class="btn btn-accent" href="${telHref(s.phone)}">${ic("phone")} Qo'ng'iroq qilish</a>
      <button class="btn" data-act="to-review">${ic("star")} Sharh yozish</button>
    </div>
    ${dsec("phone","Aloqa",phoneRow(s.phone)+`<div><dt>${ic("pin")} Manzil</dt><dd>${esc(s.address)}, ${esc(locality(s))}</dd></div>`)}
    <section class="dsec"><h3>${ic("shop")} Narxlar <span class="note-t">taxminiy</span></h3>
      ${s.desc?`<p class="desc dsec-desc">${esc(s.desc)}</p>`:""}
      ${s.prices&&s.prices.length?`<ul class="prices pr-in">${s.prices.map(([n,p])=>`<li><span>${esc(n)}</span><b>${fmtSum(p)}</b></li>`).join("")}</ul>`:`<p class="muted pr-in" style="margin:0">Narxlar hali kiritilmagan.</p>`}
    </section>
    ${dsec("clock","Ish vaqti",`<div><dt>${ic("clock")} Jadval</dt><dd>${hoursText(s)}</dd></div><div><dt>${ic("star")} Holati</dt><dd><span class="pill ${st.open?"open":"closed"}">${st.text}</span></dd></div>`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(s)}</dd></div>`)}
    <section class="sec" id="revSec"><h3>Sharhlar <span class="muted">${total}</span></h3>
      ${s.count?`<div class="rsum"><div class="rbig"><b>${fmtR(s.rating)}</b>${starsHtml(s.rating)}<small>${s.count} ta baho</small></div><div class="bars">${bars}</div></div>`:`<p class="muted" style="margin:0">Hali sharh yo'q. Birinchi bo'lib baho bering.</p>`}
      <form class="revform" id="revForm" novalidate>
        <div class="starpick" role="radiogroup" aria-label="Bahongiz">${[5,4,3,2,1].map(n=>`<input type="radio" name="rs" id="rs${n}" value="${n}"><label for="rs${n}" title="${n} yulduz">★</label>`).join("")}</div>
        <input class="input" id="revName" maxlength="40" placeholder="Ismingiz (ixtiyoriy)" aria-label="Ismingiz">
        <textarea class="input" id="revText" rows="3" maxlength="500" placeholder="Xizmat sizga qanday yoqdi?" aria-label="Sharh matni"></textarea>
        <em class="err" id="errRev"></em>
        <div><button class="btn btn-accent" type="submit">Sharhni yuborish</button></div>
      </form>
      <ul class="revs">${revs}</ul>
    </section>
    <section class="sec"><h3>Yaqin atrofda</h3>${nearbyServicesHtml(s,1200,4,s.id)}</section>`);
  renderMarkers(filtered(false));
  ensureVisible(s);
  if(opts.fromMap) revealPanelOnPhone();
}
function openPlace(id,opts={}){
  const p=places.find(x=>x.id===id); if(!p)return;
  state.sel={kind:"place",id}; state.mark=null;
  const t=PTYPES[p.t], d=gdist(p,state.user), tr=travel(d);
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon sq" style="background:${t.color}">${ic(p.t)}</span>
      <div class="dtitle"><span class="eyebrow">${t.one}</span><h2>${esc(p.name)}</h2></div></div>
    <p class="desc">${esc(p.desc)}</p>
    ${galleryHtml(p.t,t.color,p.id)}
    <div class="actions">${mapLinks(p)}<button class="btn btn-primary" data-act="route">${ic("route")} Yo'nalish</button></div>
    ${dsec("building","Umumiy ma'lumot",`<div><dt>${ic("building")} Hudud</dt><dd>${esc(p.area||`${p.district} tumani, Toshkent`)}</dd></div><div><dt>${ic("clock")} Ish vaqti</dt><dd>${t.hours} <span class="muted small">(taxminiy)</span></dd></div>`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(p)}</dd></div>`)}
    ${dsec("map","Joylashuv",coordRow(p))}
    <section class="sec"><h3>Yaqin xizmatlar <span class="muted">1,5 km ichida</span></h3>${nearbyServicesHtml(p,1500,5)}</section>
    <section class="sec"><h3>Yaqin jamoat joylari</h3>${nearbyPlacesHtml(p,2000,4,p.id)}</section>`);
  renderMarkers(filtered(false));
  ensureVisible(p);
  if(opts.fromMap) revealPanelOnPhone();
}
function farHtml(p,eyebrow,title,sub){
  const d=gdist(p,state.user), drive=`~${fmtMin(driveMin(d))}`;
  return `
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">${eyebrow}</span><h2>${esc(title)}</h2>${sub?`<span class="muted">${esc(sub)}</span>`:""}</div></div>
    ${dsec("map","Joylashuv",coordRow(p))}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${fmtKm(d)} · mashinada ${drive} (taxminan)</dd></div>`)}
    <p class="desc">Bu nuqta O'zbekiston hududidan tashqarida. Xizmatlar faqat O'zbekiston bo'yicha ko'rsatiladi.</p>
    <div class="actions"><button class="btn btn-primary" data-act="to-tashkent">${ic("locate")} Toshkentga qaytish</button></div>`;
}
function openCity(id){
  const c=CITIES.concat(TOWNS).find(x=>x.id===id); if(!c)return;
  if(c.town){ setRegion(regionOfCity(c)); flyTo(c.x,c.y,8000,700); revealPanelOnPhone(); return; }
  setRegion(c.capital?TASH_CITY:(REGIONS.find(r=>r.center===c.name)||regionAt(c)));
  revealPanelOnPhone();
}
/* Aholi punktlaridan uzoqdagi nuqta: odam shu yerda bo'lsa nima kerak — eng yaqin shahar, xizmat va jamoat joylari, qancha masofa */
function ruralPoint(m){
  state.mark=m; state.sel={kind:"point"};
  const reg=regionAt(m), rd=nearestRoad(m.x,m.y);
  const cities=CITIES.concat(TOWNS).map(c=>({c,d:gdist(c,m)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const sv=services.map(s=>({s,d:gdist(s,m)})).sort((a,b)=>a.d-b.d).slice(0,5);
  const pl=places.map(p=>({p,d:gdist(p,m)})).sort((a,b)=>a.d-b.d).slice(0,3);
  const near=cities[0];
  const cityCard=({c,d})=>`<li><button class="card" data-city="${c.id}"><span class="cicon sq" style="background:#475569">${ic("building")}</span>
    <span class="cbody"><span class="cname">${esc(c.name)}</span><span class="cmeta">${c.town?"Tuman shahri":"Viloyat markazi"} · ${esc(regionOfCity(c).short)}</span><span class="cmeta">yo'l ~${fmtKm(roadKm(d))} · mashinada ~${fmtMin(driveMin(d))}</span></span>
    <span class="dist">${fmtKm(d)}</span></button></li>`;
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">Belgilangan joy</span><h2>Aholi punktlaridan tashqarida</h2>
      <span class="muted">${esc(reg.name)}</span></div></div>
    <p class="desc">Bu atrofda xizmatlar yo'q. Eng yaqin shahar: <b>${esc(near.c.name)}</b>, ${fmtKm(near.d)} narida (mashinada ~${fmtMin(driveMin(near.d))}).</p>
    ${dsec("map","Joylashuv",coordRow(m)+`<div><dt>${ic("building")} Viloyat</dt><dd>${esc(reg.name)}</dd></div>`+(rd.road&&rd.dist<3000?`<div><dt>${ic("map")} Yaqin yo'l</dt><dd>${esc(rd.road.name)} · ${fmtKm(rd.dist)}</dd></div>`:""))}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(m)}</dd></div>`)}
    <div class="actions">
      ${mapLinks(m)}
      <button class="btn btn-primary" data-city="${near.c.id}">${ic("route")} ${esc(near.c.name)} shahriga</button>
      <button class="btn" data-act="set-user">${ic("locate")} Joylashuvim shu yerda</button>
    </div>
    <section class="sec"><h3>Eng yaqin shaharlar</h3><ul class="mini">${cities.map(cityCard).join("")}</ul></section>
    <section class="sec"><h3>Eng yaqin xizmatlar</h3><ul class="mini">${sv.map(r=>cardHtml(r.s,r.d)).join("")}</ul></section>
    <section class="sec"><h3>Eng yaqin jamoat joylari</h3><ul class="mini">${pl.map(r=>placeCardHtml(r.p,r.d)).join("")}</ul></section>`);
  renderMarkers(filtered(false)); renderOverlays();
  // belgi va eng yaqin shahar ikkalasi ko'rinishi uchun
  fitPoints([m,near.c],1.9);
}
function openPoint(pt){
  const m={x:Math.round(pt.x),y:Math.round(pt.y)};
  const inTash=Math.hypot(m.x-ORIGIN.x,m.y-ORIGIN.y)<=20000;
  const nc=nearestCity(m), inCity=!inTash&&!nc.city.capital&&nc.d<=(nc.city.town?7000:12000);
  if(!inTash&&!inCity){
    if(inUzb(m)){ ruralPoint(m); return; }
    state.mark=m; state.sel={kind:"point"};
    showDetail(farHtml(m,"Belgilangan joy","O'zbekiston hududidan tashqarida",`Eng yaqin O'zbekiston shahri: ${nc.city.name} · ${fmtKm(nc.d)}`));
    renderMarkers(filtered(false)); return;
  }
  state.mark=m; state.sel={kind:"point"};
  const rd=nearestRoad(m.x,m.y), dn=inTash?nearestDistrict(m.x,m.y):nc.city.name, d=gdist(m,state.user);
  const area=inTash?`${dn} tumani, Toshkent`:`${dn} shahri, ${regionOfCity(nc.city).name}`;
  const title = rd.dist<500 ? rd.road.name : inTash?`${dn} tumani`:`${dn} shahri`;
  const inAirport = AIRPORTS.some(a=>Math.hypot(m.x-a.x,m.y-a.y)<1300);
  const inWaterLike = WATER.some(w=>{for(let i=0;i<w.pts.length-1;i++){if(segDist(m.x,m.y,w.pts[i][0],w.pts[i][1],w.pts[i+1][0],w.pts[i+1][1])<90)return true;}return false;});
  const hint = inAirport?"Aeroport hududi.":inWaterLike?"Kanal bo'yi.":"";
  showDetail(`
    <button class="back" data-act="back">${ic("back")} Ro'yxatga qaytish</button>
    <div class="dhead"><span class="dicon" style="background:#be123c">${ic("pin")}</span>
      <div class="dtitle"><span class="eyebrow">Belgilangan joy</span><h2>${esc(title)}</h2>${hint?`<span class="muted">${hint}</span>`:""}</div></div>
    ${dsec("map","Joylashuv",coordRow(m)+`<div><dt>${ic("building")} Hudud</dt><dd>${esc(area)}</dd></div><div><dt>${ic("map")} Yaqin ko'cha</dt><dd>${esc(rd.road.name)} · ${fmtKm(rd.dist)}</dd></div>`)}
    ${dsec("route","Masofa va yo'l",`<div><dt>${ic("route")} Sizdan</dt><dd>${routeHtml(m)}</dd></div>`)}
    <div class="actions">
      ${mapLinks(m)}
      <button class="btn" data-act="set-user">${ic("locate")} Joylashuvim shu yerda</button>
    </div>
    <section class="sec"><h3>Yaqin xizmatlar <span class="muted">1 km ichida</span></h3>${nearbyServicesHtml(m,1000,6)}</section>
    <section class="sec"><h3>Yaqin jamoat joylari <span class="muted">2 km ichida</span></h3>${nearbyPlacesHtml(m,2000,5)}</section>`);
  renderMarkers(filtered(false));
}
function ensureVisible(p){ if(!inView(p)||view.w>40000) flyTo(p.x,p.y,Math.min(view.w,9000)); }

/* ---------- xarita bilan ishlash ---------- */
const pointers=new Map(); let down=null, dragging=false, pinch=null;
let vq=0; function applyViewSoon(){ if(vq) return; vq=requestAnimationFrame(()=>{ vq=0; applyView(); }); }
let tipQ=0,tipX=0,tipY=0;
function tipSoon(x,y){ tipX=x; tipY=y; if(tipQ) return; tipQ=requestAnimationFrame(()=>{ tipQ=0; const ll=toLatLng(...Object.values(toWorld(tipX,tipY))); const t=`${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`; const el=$("#coordtip"); if(el.textContent!==t) el.textContent=t; }); }
function zoomAtScreen(sx,sy,newW){
  const r=svg.getBoundingClientRect(), fx=(sx-r.left)/pxW, fy=(sy-r.top)/pxH;
  const wx=view.x+fx*view.w, wy=view.y+fy*view.h;
  view.w=clamp(newW,W_MIN,W_MAX); view.h=view.w*pxH/pxW; view.x=wx-fx*view.w; view.y=wy-fy*view.h;
  clampView(); applyViewSoon();
}
svg.addEventListener("pointerdown",e=>{
  if(e.button>0)return;
  cancelAnimationFrame(anim);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){down={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,target:e.target};dragging=false;}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,w:view.w};down=null;dragging=true;}
});
svg.addEventListener("pointermove",e=>{
  tipSoon(e.clientX,e.clientY);
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1;zoomAtScreen((a.x+b.x)/2,(a.y+b.y)/2,pinch.w*pinch.d/d);pinch={d,w:view.w};return;}
  if(down){
    const dx=e.clientX-down.x, dy=e.clientY-down.y;
    if(!dragging&&Math.hypot(dx,dy)>5){dragging=true;try{svg.setPointerCapture(e.pointerId);}catch(_){}svg.classList.add("drag");}
    if(dragging){view.x=down.vx-dx*view.w/pxW;view.y=down.vy-dy*view.h/pxH;clampView();applyViewSoon();}
  }
});
function endPointer(e){
  if(!pointers.has(e.pointerId))return;
  pointers.delete(e.pointerId);
  if(pointers.size<2)pinch=null;
  if(e.type==="pointerup"&&down&&!dragging) handleMapClick(e,down.target);
  if(pointers.size===0){down=null;dragging=false;svg.classList.remove("drag");}
}
svg.addEventListener("pointerup",endPointer);
svg.addEventListener("pointercancel",endPointer);
svg.addEventListener("wheel",e=>{e.preventDefault();cancelAnimationFrame(anim);zoomAtScreen(e.clientX,e.clientY,view.w*Math.pow(1.0018,e.deltaY*(e.deltaMode===1?33:1)));},{passive:false});

function handleMapClick(e,target){
  const p=toWorld(e.clientX,e.clientY);
  const mk=target&&target.closest?target.closest("[data-kind]"):null;
  if(mk){ const k=mk.dataset.kind; k==="service"?openService(mk.dataset.id,{fromMap:true}):k==="city"?openCity(mk.dataset.id):openPlace(mk.dataset.id,{fromMap:true}); return; }
  const z=wrap.dataset.zoom;
  if((z==="region"||z==="country")&&inUzb(p)){
    const nc=nearestCity(p); // shahardan uzoq nuqta — viloyat ro'yxati emas, shu joy haqida ma'lumot (eng yaqin shahar, xizmat...)
    if(nc.d>Math.max(nc.city.town?7000:12000,18*(view.w/pxW))){ openPoint(p); revealPanelOnPhone(); return; }
    setRegion(regionAt(p)); revealPanelOnPhone(); return; }
  openPoint(p); revealPanelOnPhone();
}

/* ---------- qatlam tugmalari ---------- */
function renderLayers(){
  $("#layers").innerHTML=`<span class="lchip lead">${ic("map")} Xaritada</span>`+Object.entries(PTYPES).map(([k,t])=>
    `<button class="lchip" data-layer="${k}" aria-pressed="${state.layers.has(k)}"><span class="sq" style="background:${t.color}">${ic(k)}</span>${t.label} <span class="n">${places.filter(p=>p.t===k&&inRegion(p)).length}</span></button>`).join("");
}

/* ---------- sharh ---------- */
document.addEventListener("submit",e=>{
  if(e.target.id==="ocoord"){
    e.preventDefault();
    const c=parseCoord($("#ocin").value);
    if(!c){ $("#ocerr").textContent="Koordinatani shunday yozing: 41.29950, 69.24010"; return; }
    if(c.bad){ $("#ocerr").textContent="Bu nuqta O'zbekiston hududidan tashqarida ko'rinadi. Tekshiring: kenglik 37–45, uzunlik 56–73."; return; }
    const w=ll2w(c.lng,c.lat); setUser(w.x,w.y,"Kiritilgan koordinata"); flyTo(w.x,w.y,Math.min(view.w,7000)); return;
  }
  if(e.target.id!=="revForm")return;
  e.preventDefault();
  const s=byId(state.sel&&state.sel.id); if(!s)return;
  const st=e.target.querySelector('input[name="rs"]:checked'), text=$("#revText").value.trim();
  if(!st||text.length<3){$("#errRev").textContent=!st?"Yulduzcha bilan baho bering.":"Sharh matnini yozing (kamida 3 belgi).";return;}
  const r={name:$("#revName").value.trim()||"Mehmon",stars:+st.value,text,ts:Date.now()};
  const prevAvg=s.count?s.rating:0;
  applyReview(s,r);
  if(!s.dist||!prevAvg) s.dist=distFrom(s.rating);
  (myReviews[s.id]=myReviews[s.id]||[]).push(r); LS.set(STORE_REV,myReviews);
  openService(s.id);
  const sec=$("#revSec"); sec&&sec.scrollIntoView({block:"start"});
  toast("Sharhingiz qo'shildi");
});

/* ---------- umumiy tugmalar ---------- */
let toastT=0;
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600);}
function copyText(txt){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast(`Nusxalandi: ${txt}`)).catch(()=>toast("Nusxalab bo'lmadi — matnni belgilab, Ctrl+C bosing"));
  } else toast("Nusxalab bo'lmadi — matnni belgilab, Ctrl+C bosing");
}
document.addEventListener("click",e=>{
  const cityBtn=e.target.closest("[data-city]");
  if(cityBtn){ openCity(cityBtn.dataset.city); return; }
  const open=e.target.closest("[data-open]");
  if(open){ const id=open.dataset.open; id.startsWith("p")?openPlace(id):openService(id); return; }
  const cat=e.target.closest("[data-cat]");
  if(cat){ state.cat=cat.dataset.cat; render(); return; }
  const layer=e.target.closest("[data-layer]");
  if(layer){ const k=layer.dataset.layer, on=!state.layers.has(k);
    on?state.layers.add(k):state.layers.delete(k);
    if(vDetail.hidden) render(); else { renderLayers(); renderMarkers(filtered(false)); }
    // viloyat tanlangan bo'lsa, yoqilgan qatlam joylarini xaritada ko'rsatish
    if(on&&state.region){ const pts=places.filter(p=>p.t===k&&inRegion(p)); if(pts.length) fitPoints(pts,1.4); }
    return; }
  if(e.target.closest('[data-act="more-places"]')){ state.allPlaces=true; render(); return; }
  const rb=e.target.closest("#segRadius button");
  if(rb){ state.radius=+rb.dataset.v; setPressed($("#segRadius"),rb.dataset.v); render();
    if(state.radius){const r=state.radius*1000;flyTo(state.user.x,state.user.y,Math.max(2.3*r,2.3*r*pxW/pxH));} return; }
  const gb=e.target.closest("#segRating button");
  if(gb){ state.minRating=+gb.dataset.v; setPressed($("#segRating"),gb.dataset.v); render(); return; }
  if(state.pickOpen&&!e.target.closest("#regPick,#mapScope,#panelScope,#regionBar")){ state.pickOpen=false; renderPick(); }
  const act=e.target.closest("[data-act]"); if(!act)return;
  const a=act.dataset.act;
  if(a==="back") showList();
  else if(a==="zoom-in") flyTo(view.x+view.w/2,view.y+view.h/2,view.w/1.8,260);
  else if(a==="zoom-out") flyTo(view.x+view.w/2,view.y+view.h/2,view.w*1.8,260);
  else if(a==="locate") flyTo(state.user.x,state.user.y,Math.min(view.w,7000),view.w>40000?800:420);
  else if(a==="country") fitPoints(UZB,1.08);
  else if(a==="to-tashkent"){ showList(); flyTo(state.user.x,state.user.y,14000,800); }
  else if(a==="copy") copyText(act.dataset.copy);
  else if(a==="route"){ const t=selectedPoint(); if(t) fitPoints([state.user,t],1.5); }
  else if(a==="to-review"){ const f=$("#revForm"); if(f){f.scrollIntoView({behavior:"smooth",block:"center"}); setTimeout(()=>$("#rs5").focus({preventScroll:true}),350);} }
  else if(a==="set-user"){ const m=state.mark; state.mark=null; showList(); setUser(m.x,m.y,"Xaritadan tanlangan nuqta"); }
  else if(a==="geolocate") geolocate();
  else if(a==="coord-toggle"){ const f=$("#ocoord"); f.hidden=!f.hidden; $("#ocerr").textContent=""; if(!f.hidden) $("#ocin").focus(); }
  else if(a==="clear-region") setRegion(null);
  else if(a==="gal-prev"||a==="gal-next"){ const g=act.closest(".galwrap").querySelector(".gallery"), f=g.firstElementChild; g.scrollBy({left:(a==="gal-next"?1:-1)*(f.offsetWidth+10),behavior:"smooth"}); }
  else if(a==="scope-local"){ if(!swNoClick) scopeLocal(true); }
  else if(a==="pick-region"){ state.pickOpen=false; setRegion(regionById(act.dataset.id)); }
  else if(a==="scope-country"){ if(!swNoClick) scopeCountry(); }
  else if(a==="more-list"){ loadMore(); }
  else if(a==="reset"){ state.region=null;selectRegion(null);state.cat="all";state.radius=0;state.minRating=0;state.openNow=false;state.q="";$("#q").value="";$("#openNow").checked=false;setPressed($("#segRadius"),0);setPressed($("#segRating"),0);render(); }
});
document.addEventListener("mouseover",e=>{
  const c=e.target.closest(".card[data-open]");
  svg.querySelectorAll(".mk.hl").forEach(m=>m.classList.remove("hl"));
  if(c&&markerEls[c.dataset.open]) markerEls[c.dataset.open].classList.add("hl");
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  if(!vDetail.hidden) showList();
});
let qTimer=0;
$("#q").addEventListener("input",e=>{ state.q=e.target.value; if(!vDetail.hidden){vDetail.hidden=true;vList.hidden=false;state.sel=null;state.mark=null;} clearTimeout(qTimer); qTimer=setTimeout(render,140); });
$("#q").addEventListener("keydown",e=>{ if(e.key==="Enter"){ const l=filtered(false); if(l.length) fitPoints(l.slice(0,30).map(r=>r.s)); } });
// Qatlam tugmalari qatori: sichqoncha g'ildiragi (tepaga/pastga) qatorni chapga/o'ngga suradi
$("#layers").addEventListener("wheel",e=>{
  const el=e.currentTarget, d=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  if(el.scrollWidth<=el.clientWidth) return;
  e.preventDefault(); e.stopPropagation();
  el.scrollLeft+=d*(e.deltaMode===1?30:1);
},{passive:false});
$("#openNow").addEventListener("change",e=>{ state.openNow=e.target.checked; render(); });
$("#sort").addEventListener("change",e=>{ state.sort=e.target.value; render(); });

/* ---------- ishga tushirish ---------- */
let initPending=false; // sahifa ochilganda xarita hali o'lchamsiz bo'lsa, boshlang'ich ko'rinish o'lcham kelganda qo'yiladi
function measure(){ const r=svg.getBoundingClientRect(); const cx=view.x+view.w/2, cy=view.y+view.h/2, k=pxW?view.w/pxW:14; pxW=Math.max(1,r.width); pxH=Math.max(1,r.height); sizeReal();
  if(initPending&&r.width>=50){ initPending=false; setCenter(state.user.x,state.user.y,clamp(pxW*5.5,3200,6500)); } else setCenter(cx,cy,k*pxW); applyView(); }

/* ---------- tillar: O'zbekcha (asl), English, Русский, Français, Deutsch ----------
   Sahifadagi har bir matn (va placeholder/title/aria-label) asl o'zbekcha ko'rinishida saqlanadi va lug'at bo'yicha almashtiriladi.
   Lug'atda topilmagan matn (xizmat nomi, ko'cha nomi va h.k.) o'zgarmaydi. */
const LANG_KEY="nearby-proto-lang";
let lang="uz"; try{ const l=localStorage.getItem(LANG_KEY); if(["uz","en","ru","fr","de"].includes(l)) lang=l; }catch(e){}
const LI={en:1,ru:2,fr:3,de:4};
const DICT={en:new Map(),ru:new Map(),fr:new Map(),de:new Map()}, RULES=[], tcache={}, MISS=new Set();
let EXO={};
try{ const D=((window.NS_DATA&&window.NS_DATA.i18n)||{}); EXO=D.x||{}; for(const e of (D.e||[])) for(const L in LI) if(e[LI[L]]!==undefined&&e[LI[L]]!=="") DICT[L].set(e[0],e[LI[L]]); }catch(e){}
const UNIT={
  en:{min:"min",h:"h",km:"km",m:"m",sum:"UZS",dec:"."},
  ru:{min:"мин",h:"ч",km:"км",m:"м",sum:"сум",dec:","},
  fr:{min:"min",h:"h",km:"km",m:"m",sum:"UZS",dec:","},
  de:{min:"Min.",h:"Std.",km:"km",m:"m",sum:"UZS",dec:","}
};
function unitsFix(s){
  const U=UNIT[lang]; if(!U||!/\d/.test(s)) return s;
  return s.replace(/(\d) ?daq\b/g,"$1 "+U.min).replace(/(\d) ?soat\b/g,"$1 "+U.h)
          .replace(/(\d) km\b/g,"$1 "+U.km).replace(/(\d) m\b/g,"$1 "+U.m).replace(/(\d) so'm\b/g,"$1 "+U.sum)
          .replace(/(\d),(\d)/g,(m0,a,b)=>a+U.dec+b);
}
function plRu(n,a,b,c){ n=Math.abs(n)%100; const d=n%10; return n>10&&n<20?c:d===1?a:d>=2&&d<=4?b:c; }
let BIZ=null;
const isBizName=s=>{ if(!BIZ) BIZ=new Set([...services.map(x=>x.name),...places.map(x=>x.name)]); return BIZ.has(s); };
function trCore(s){
  const d=DICT[lang]; if(d.has(s)) return d.get(s);
  const ex=EXO[s]; if(ex) return ex[LI[lang]-1];
  if(lang==="ru"&&isBizName(s)) return uz2ru(s);   // korxona va joy nomlari ruscha yoziladi (kirillcha)
  for(const r of RULES){ const m=r[0].exec(s); if(m){ const o=r[1](m,lang); if(o!=null) return unitsFix(o); } }
  if(s.includes(" · ")) return s.split(" · ").map(trText).join(" · ");
  if(s.includes(", ")&&!/^[\d.,\s+-]+$/.test(s)) return s.split(", ").map(trText).join(", ");
  return unitsFix(s);
}
function trText(s){
  if(lang==="uz") return s;
  const c=tcache[lang]||(tcache[lang]=new Map()); let r=c.get(s); if(r!==undefined) return r;
  r=trCore(s); c.set(s,r);
  if(r===s&&/[A-Za-z']{3,}/.test(s)&&!/^[\d\s.,:;·+\-–—/()%°±~'’"№#★✓|]+$/.test(s)) MISS.add(s);
  return r;
}

/* ----- nomlar: ekzonim yoki (ruscha uchun) lotindan kirillga ----- */
function uz2ru(s){
  const pairs=[["O'","У"],["o'","у"],["G'","Г"],["g'","г"],["Sh","Ш"],["sh","ш"],["Ch","Ч"],["ch","ч"],["Yo'","Ю"],["yo'","ю"],["Yu","Ю"],["yu","ю"],["Ya","Я"],["ya","я"],["Ye","Е"],["ye","е"],["Yo","Ё"],["yo","ё"],["Ng","Нг"],["ng","нг"]];
  const L={a:"а",b:"б",d:"д",e:"е",f:"ф",g:"г",h:"х",i:"и",j:"дж",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",x:"х",y:"й",z:"з"};
  s=s.replace(/obod\b/g,"абад").replace(/Obod\b/g,"Абад");
  let out="",i=0;
  while(i<s.length){
    let hit=false;
    for(const [a,b] of pairs){ if(s.startsWith(a,i)){ out+=b; i+=a.length; hit=true; break; } }
    if(hit) continue;
    const c=s[i], lc=c.toLowerCase();
    if(c==="'"||c==="’"||c==="ʻ"||c==="ʼ"||c==="`"){ i++; continue; }
    if(L[lc]!==undefined){ let t=L[lc]; if(lc==="e"&&(i===0||/[\s-]/.test(s[i-1]))) t="э"; out+=c!==lc?t[0].toUpperCase()+t.slice(1):t; }
    else out+=c;
    i++;
  }
  return out;
}
function nm(x){ const e=EXO[x]; if(e) return e[LI[lang]-1]; return lang==="ru"?uz2ru(x):x; }
const DAYTOK={en:{Du:"Mon",Se:"Tue",Ch:"Wed",Pa:"Thu",Ju:"Fri",Sh:"Sat",Ya:"Sun"},ru:{Du:"Пн",Se:"Вт",Ch:"Ср",Pa:"Чт",Ju:"Пт",Sh:"Сб",Ya:"Вс"},fr:{Du:"lun.",Se:"mar.",Ch:"mer.",Pa:"jeu.",Ju:"ven.",Sh:"sam.",Ya:"dim."},de:{Du:"Mo",Se:"Di",Ch:"Mi",Pa:"Do",Ju:"Fr",Sh:"Sa",Ya:"So"}};
const DAYFULL={dushanba:["Monday","в понедельник","lundi","Montag"],seshanba:["Tuesday","во вторник","mardi","Dienstag"],chorshanba:["Wednesday","в среду","mercredi","Mittwoch"],payshanba:["Thursday","в четверг","jeudi","Donnerstag"],juma:["Friday","в пятницу","vendredi","Freitag"],shanba:["Saturday","в субботу","samedi","Samstag"],yakshanba:["Sunday","в воскресенье","dimanche","Sonntag"]};
const dayTr=t=>t.replace(/\b(Du|Se|Ch|Pa|Ju|Sh|Ya)\b/g,x=>DAYTOK[lang][x]);
const R=(re,f)=>RULES.push([re,(m,L)=>{ const o=f(m); return o?o[L]:null; }]);
const RD=(re,f)=>R(re,m=>/ · /.test(m[1])?null:f(m));   // ' · ' bor satr oldin bo'laklarga bo'linadi
const NR=(re,f)=>R(re,m=>/, | · /.test(m[1])?null:f(nm(m[1]),m));   // vergul/nuqta bor satr bo'laklarga bo'linadi, butun nom sifatida o'qilmaydi
const s1=n=>n==="1";
/* sonlar */
R(/^(\d+) ta xizmat$/,m=>({en:`${m[1]} service${s1(m[1])?"":"s"}`,ru:`${m[1]} ${plRu(+m[1],"услуга","услуги","услуг")}`,fr:`${m[1]} service${+m[1]>1?"s":""}`,de:`${m[1]} ${s1(m[1])?"Dienst":"Dienste"}`}));
R(/^(\d+) ta baho$/,m=>({en:`${m[1]} rating${s1(m[1])?"":"s"}`,ru:`${m[1]} ${plRu(+m[1],"оценка","оценки","оценок")}`,fr:`${m[1]} note${+m[1]>1?"s":""}`,de:`${m[1]} Bewertung${s1(m[1])?"":"en"}`}));
R(/^(\d+) ta$/,m=>({en:m[1],ru:m[1],fr:m[1],de:m[1]}));
R(/^Yana (\d+) tasini ko'rsatish · jami (\d+)$/,m=>({en:`Show ${m[1]} more · ${m[2]} in total`,ru:`Показать ещё ${m[1]} · всего ${m[2]}`,fr:`Afficher ${m[1]} de plus · ${m[2]} au total`,de:`${m[1]} weitere anzeigen · insgesamt ${m[2]}`}));
R(/^(\d+) km radiusda$/,m=>({en:`within ${m[1]} km`,ru:`в радиусе ${m[1]} км`,fr:`dans un rayon de ${m[1]} km`,de:`im Umkreis von ${m[1]} km`}));
RD(/^reyting (.+)$/,m=>({en:`rating ${m[1]}`,ru:`рейтинг ${m[1]}`,fr:`note ${m[1]}`,de:`Bewertung ${m[1]}`}));
R(/^(\d+) kun oldin$/,m=>({en:`${m[1]} day${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"день","дня","дней")} назад`,fr:`il y a ${m[1]} jour${+m[1]>1?"s":""}`,de:`vor ${m[1]} Tag${s1(m[1])?"":"en"}`}));
R(/^(\d+) hafta oldin$/,m=>({en:`${m[1]} week${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"неделю","недели","недель")} назад`,fr:`il y a ${m[1]} semaine${+m[1]>1?"s":""}`,de:`vor ${m[1]} Woche${s1(m[1])?"":"n"}`}));
R(/^(\d+) oy oldin$/,m=>({en:`${m[1]} month${s1(m[1])?"":"s"} ago`,ru:`${m[1]} ${plRu(+m[1],"месяц","месяца","месяцев")} назад`,fr:`il y a ${m[1]} mois`,de:`vor ${m[1]} Monat${s1(m[1])?"":"en"}`}));
/* holat va jadval */
R(/^Ochiq · (\d\d:\d\d) gacha$/,m=>({en:`Open until ${m[1]}`,ru:`Открыто до ${m[1]}`,fr:`Ouvert jusqu'à ${m[1]}`,de:`Geöffnet bis ${m[1]}`}));
R(/^Yopiq · (\d\d:\d\d) da ochiladi$/,m=>({en:`Closed · opens at ${m[1]}`,ru:`Закрыто · откроется в ${m[1]}`,fr:`Fermé · ouvre à ${m[1]}`,de:`Geschlossen · öffnet um ${m[1]}`}));
R(/^Yopiq · ertaga (\d\d:\d\d) da$/,m=>({en:`Closed · opens tomorrow at ${m[1]}`,ru:`Закрыто · откроется завтра в ${m[1]}`,fr:`Fermé · ouvre demain à ${m[1]}`,de:`Geschlossen · öffnet morgen um ${m[1]}`}));
R(/^Yopiq · (dushanba|seshanba|chorshanba|payshanba|juma|shanba|yakshanba) (\d\d:\d\d) da$/,m=>{const d=DAYFULL[m[1]];return {en:`Closed · opens ${d[0]} at ${m[2]}`,ru:`Закрыто · откроется ${d[1]} в ${m[2]}`,fr:`Fermé · ouvre ${d[2]} à ${m[2]}`,de:`Geschlossen · öffnet ${d[3]} um ${m[2]}`};});
R(/^(Har kuni|(?:Du|Se|Ch|Pa|Ju|Sh|Ya)(?:–(?:Du|Se|Ch|Pa|Ju|Sh|Ya))?(?:, (?:Du|Se|Ch|Pa|Ju|Sh|Ya))*), (\d\d:\d\d)–(\d\d:\d\d)$/,m=>{const d=m[1]==="Har kuni"?trText("Har kuni"):dayTr(m[1]),t=`${m[2]}–${m[3]}`;return {en:`${d}, ${t}`,ru:`${d}, ${t}`,fr:`${d}, ${t}`,de:`${d}, ${t}`};});
/* masofa */
RD(/^To'g'ri chiziqda (.+)$/,m=>({en:`Straight line: ${m[1]}`,ru:`По прямой: ${m[1]}`,fr:`À vol d'oiseau : ${m[1]}`,de:`Luftlinie: ${m[1]}`}));
RD(/^(.+) to'g'ri chiziqda$/,m=>({en:`${m[1]} in a straight line`,ru:`${m[1]} по прямой`,fr:`${m[1]} à vol d'oiseau`,de:`${m[1]} Luftlinie`}));
RD(/^yo'l ~(.+)$/,m=>({en:`road ~${m[1]}`,ru:`по дороге ~${m[1]}`,fr:`route ~${m[1]}`,de:`Straße ~${m[1]}`}));
RD(/^mashinada ~(.+)$/,m=>({en:`by car ~${m[1]}`,ru:`на машине ~${m[1]}`,fr:`en voiture ~${m[1]}`,de:`mit dem Auto ~${m[1]}`}));
RD(/^piyoda ~(.+)$/,m=>({en:`on foot ~${m[1]}`,ru:`пешком ~${m[1]}`,fr:`à pied ~${m[1]}`,de:`zu Fuß ~${m[1]}`}));
RD(/^sizdan (.+)$/,m=>({en:`${m[1]} from you`,ru:`${m[1]} от вас`,fr:`${m[1]} de vous`,de:`${m[1]} von Ihnen`}));
R(/^Markazi: (.+)$/,m=>{const x=trText(m[1]);return {en:`Center: ${x}`,ru:`Центр: ${x}`,fr:`Centre : ${x}`,de:`Zentrum: ${x}`};});
R(/^Eng yaqin O'zbekiston shahri: (.+)$/,m=>{const x=trText(m[1]);return {en:`Nearest city in Uzbekistan: ${x}`,ru:`Ближайший город Узбекистана: ${x}`,fr:`Ville ouzbèke la plus proche : ${x}`,de:`Nächste usbekische Stadt: ${x}`};});
R(/^, (.+) narida \(mashinada ~(.+)\)\.$/,m=>({en:`, ${m[1]} away (by car ~${m[2]}).`,ru:`, ${m[1]} отсюда (на машине ~${m[2]}).`,fr:`, à ${m[1]} (en voiture ~${m[2]}).`,de:`, ${m[1]} entfernt (mit dem Auto ~${m[2]}).`}));
RD(/^(.+) ichida xizmat topilmadi\.$/,m=>({en:`No services within ${m[1]}.`,ru:`В пределах ${m[1]} услуг нет.`,fr:`Aucun service à moins de ${m[1]}.`,de:`Keine Dienste innerhalb von ${m[1]}.`}));
RD(/^(.+) ichida jamoat joyi yo'q\.$/,m=>({en:`No public places within ${m[1]}.`,ru:`В пределах ${m[1]} общественных мест нет.`,fr:`Aucun lieu public à moins de ${m[1]}.`,de:`Keine öffentlichen Orte innerhalb von ${m[1]}.`}));
RD(/^(.+) ichida$/,m=>({en:`within ${m[1]}`,ru:`в пределах ${m[1]}`,fr:`à moins de ${m[1]}`,de:`innerhalb von ${m[1]}`}));
RD(/^Nusxalandi: (.+)$/,m=>({en:`Copied: ${m[1]}`,ru:`Скопировано: ${m[1]}`,fr:`Copié : ${m[1]}`,de:`Kopiert: ${m[1]}`}));
R(/^Hisoblash nuqtasi: (.+)$/,m=>({en:`Distance origin: ${m[1]}`,ru:`Точка отсчёта: ${m[1]}`,fr:`Point de départ : ${m[1]}`,de:`Ausgangspunkt: ${m[1]}`}));
/* joy va muassasa nomlari */
NR(/^(.+) tumani hokimligi$/,N=>({en:`${N} District Administration`,ru:`Хокимият района ${N}`,fr:`Mairie du district de ${N}`,de:`Bezirksverwaltung ${N}`}));
NR(/^(.+) viloyati hokimligi$/,N=>({en:`${N} Regional Administration`,ru:`Областной хокимият: ${N}`,fr:`Administration régionale de ${N}`,de:`Gebietsverwaltung ${N}`}));
NR(/^(.+) shahar hokimligi$/,N=>({en:`${N} City Administration`,ru:`Городской хокимият: ${N}`,fr:`Mairie de ${N}`,de:`Stadtverwaltung ${N}`}));
NR(/^(.+) hokimligi$/,N=>({en:`${N} Administration`,ru:`Хокимият: ${N}`,fr:`Administration de ${N}`,de:`Verwaltung ${N}`}));
R(/^(\d+)-umumta'lim maktabi$/,m=>({en:`School No. ${m[1]}`,ru:`Школа №${m[1]}`,fr:`École n° ${m[1]}`,de:`Schule Nr. ${m[1]}`}));
R(/^(\d+)-son DMTT \(bog'cha\)$/,m=>({en:`Kindergarten No. ${m[1]}`,ru:`Детский сад №${m[1]}`,fr:`Maternelle n° ${m[1]}`,de:`Kindergarten Nr. ${m[1]}`}));
NR(/^(.+) markaziy bog'i$/,N=>({en:`${N} Central Park`,ru:`Центральный парк: ${N}`,fr:`Parc central de ${N}`,de:`Zentralpark ${N}`}));
NR(/^(.+) istirohat bog'i$/,N=>({en:`${N} Recreation Park`,ru:`Парк отдыха: ${N}`,fr:`Parc de loisirs de ${N}`,de:`Erholungspark ${N}`}));
NR(/^(.+) aeroporti$/,N=>({en:`${N} Airport`,ru:`Аэропорт: ${N}`,fr:`Aéroport de ${N}`,de:`Flughafen ${N}`}));
NR(/^(.+) viloyat o'lkashunoslik muzeyi$/,N=>({en:`${N} Regional Museum`,ru:`Краеведческий музей: ${N}`,fr:`Musée régional de ${N}`,de:`Regionalmuseum ${N}`}));
NR(/^(.+) tarix muzeyi$/,N=>({en:`${N} History Museum`,ru:`Исторический музей: ${N}`,fr:`Musée d'histoire de ${N}`,de:`Geschichtsmuseum ${N}`}));
NR(/^(.+) tumani$/,N=>({en:`${N} District`,ru:`район ${N}`,fr:`arrondissement de ${N}`,de:`Bezirk ${N}`}));
NR(/^(.+) shahriga$/,N=>({en:`To ${N}`,ru:`В ${N}`,fr:`Vers ${N}`,de:`Nach ${N}`}));
NR(/^(.+) shahri$/,N=>({en:`${N} city`,ru:`город ${N}`,fr:`ville de ${N}`,de:`Stadt ${N}`}));
NR(/^(.+) viloyati$/,N=>({en:`${N} Region`,ru:`${N}ская область`,fr:`région de ${N}`,de:`Gebiet ${N}`}));
/* manzillar va ko'chalar */
R(/^(\d+)-uy$/,m=>({en:`house ${m[1]}`,ru:`д. ${m[1]}`,fr:`n° ${m[1]}`,de:`Haus ${m[1]}`}));
NR(/^(.+) MFY$/,N=>({en:`${N} neighbourhood`,ru:`махалля ${N}`,fr:`quartier ${N}`,de:`Viertel ${N}`}));
R(/^(.+?) (\d+)-o'tish ko'chasi$/,m=>{const N=nm(m[1]);return {en:`${N} Lane ${m[2]}`,ru:`${N}, проезд ${m[2]}`,fr:`Passage ${m[2]} ${N}`,de:`${N} Gasse ${m[2]}`};});
NR(/^(.+) shoh ko'chasi$/,N=>({en:`${N} Avenue`,ru:`проспект ${N}`,fr:`Avenue ${N}`,de:`${N}-Allee`}));
NR(/^(.+) ko'chasi$/,N=>({en:`${N} Street`,ru:`улица ${N}`,fr:`Rue ${N}`,de:`${N}-Straße`}));
NR(/^(.+) yo'li$/,N=>({en:`${N} Road`,ru:`дорога ${N}`,fr:`Route de ${N}`,de:`${N}-Straße`}));
R(/^(.+) \((\d+)-filial\)$/,m=>{const b=trText(m[1]);return {en:`${b} (branch ${m[2]})`,ru:`${b} (филиал ${m[2]})`,fr:`${b} (succursale ${m[2]})`,de:`${b} (Filiale ${m[2]})`};});
R(/^[A-Z][a-z'ʻ’]+ [A-Z]\.$/,m=>({ru:uz2ru(m[0])}));
R(/^(\d+(?:[.,]\d+)?) yulduz$/,m=>{ const frac=/[.,]/.test(m[1]), n=parseFloat(m[1].replace(",",".")), d=m[1].replace(",","."), c=m[1];
  return {en:`${d} star${n===1?"":"s"}`,ru:`${c} ${frac?"звезды":plRu(n,"звезда","звезды","звёзд")}`,fr:`${c} étoile${n>1?"s":""}`,de:`${c} Stern${n===1?"":"e"}`}; });
R(/^Yana (\d+) tasini ko'rsatish$/,m=>({en:`Show ${m[1]} more`,ru:`Показать ещё ${m[1]}`,fr:`Afficher ${m[1]} de plus`,de:`${m[1]} weitere anzeigen`}));

const origT=new WeakMap(), lastT=new WeakMap(), origA=new WeakMap();
const ATTRS=["placeholder","title","aria-label"];
function tNode(n){
  const p=n.parentNode; if(!p||p.nodeName==="SCRIPT"||p.nodeName==="STYLE") return;
  const cur=n.nodeValue; let o=origT.get(n);
  if(o===undefined||cur!==lastT.get(n)){ o=cur; origT.set(n,o); }
  const core=o.trim(); if(!core||!/[A-Za-zЀ-ӿ]/.test(core)){ lastT.set(n,o); return; }
  const out=trText(core), res=out===core?o:o.slice(0,o.indexOf(core))+out+o.slice(o.indexOf(core)+core.length);
  lastT.set(n,res); if(cur!==res) n.nodeValue=res;
}
function tAttr(el,a){
  const v=el.getAttribute(a); if(v==null) return;
  let m=origA.get(el); if(!m){ m={}; origA.set(el,m); }
  if(m[a]===undefined||m[a].last!==v) m[a]={orig:v,last:v};
  const out=trText(m[a].orig.trim()); const res=out===m[a].orig.trim()?m[a].orig:out;
  m[a].last=res; if(v!==res) el.setAttribute(a,res);
}
function tWalk(root){
  if(root.nodeType===3){ tNode(root); return; }
  if(root.nodeType!==1) return;
  for(const a of ATTRS) if(root.hasAttribute(a)) tAttr(root,a);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT); let n;
  while((n=w.nextNode())){ if(n.nodeType===3) tNode(n); else for(const a of ATTRS) if(n.hasAttribute(a)) tAttr(n,a); }
}
/* zamonaviy ro'yxatlar (saralash, shahar tanlash): haqiqiy <select> yashirin, o'rnida til menyusi uslubidagi tugma va menyu */
let selMenu=null;
function closeSelMenu(){ if(!selMenu) return; selMenu.m.remove(); selMenu.btn.setAttribute("aria-expanded","false"); selMenu=null; }
function syncSelLabels(){
  document.querySelectorAll(".selbtn").forEach(b=>{ const sel=b._sel; if(!sel||!sel.isConnected) return; const o=sel.options[sel.selectedIndex]; const t=b.querySelector(".sbl"); if(o&&t&&t.textContent!==o.textContent) t.textContent=o.textContent; });
}
function enhanceSelects(){
  document.querySelectorAll("select.csel:not([data-enh])").forEach(sel=>{
    sel.dataset.enh="1"; sel.classList.add("selhid"); sel.tabIndex=-1; sel.setAttribute("aria-hidden","true");
    const b=document.createElement("button"); b.type="button"; b.className="selbtn"; b._sel=sel; b.setAttribute("aria-haspopup","listbox"); b.setAttribute("aria-expanded","false");
    b.setAttribute("aria-label",sel.getAttribute("aria-label")||"");
    b.innerHTML=`<span class="sbl"></span><svg class="i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`;
    sel.insertAdjacentElement("afterend",b);
    sel.addEventListener("change",syncSelLabels);
  });
  syncSelLabels();
}
function openSelMenu(btn){
  const sel=btn._sel; if(!sel) return; const same=selMenu&&selMenu.btn===btn; closeSelMenu(); if(same) return;
  const m=document.createElement("ul"); m.className="langmenu selmenu"; m.setAttribute("role","listbox");
  m.innerHTML=[...sel.options].map((o,i)=>`<li role="option" tabindex="-1" data-i="${i}" aria-selected="${i===sel.selectedIndex}"><span class="ln">${esc(o.textContent)}</span><svg class="i ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></li>`).join("");
  document.body.appendChild(m);
  const r=btn.getBoundingClientRect(); m.style.minWidth=Math.max(r.width,180)+"px";
  const mh=m.offsetHeight, below=innerHeight-r.bottom-12, top=(below>=Math.min(mh,260)||r.top<mh)?r.bottom+8:r.top-mh-8;
  m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+"px"; m.style.top=top+"px"; m.style.maxHeight=Math.max(160,Math.min(340,(top>r.top?below:r.top-20)))+"px";
  btn.setAttribute("aria-expanded","true"); selMenu={m,btn};
  const li=m.querySelector('[aria-selected="true"]')||m.firstElementChild; li&&li.focus();
}
function pickSel(i){ const {btn}=selMenu; const sel=btn._sel; sel.selectedIndex=i; sel.dispatchEvent(new Event("change",{bubbles:true})); closeSelMenu(); btn.focus(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest(".selbtn"), li=e.target.closest&&e.target.closest(".selmenu li");
  if(li&&selMenu){ pickSel(+li.dataset.i); return; }
  if(b){ openSelMenu(b); return; }
  if(selMenu) closeSelMenu();
});
document.addEventListener("keydown",e=>{
  if(e.target.classList&&e.target.classList.contains("selbtn")&&(e.key==="ArrowDown"||e.key==="ArrowUp")){ e.preventDefault(); openSelMenu(e.target); return; }
  if(!selMenu) return;
  const items=[...selMenu.m.querySelectorAll("li")], i=items.indexOf(document.activeElement);
  if(e.key==="Escape"){ const b=selMenu.btn; closeSelMenu(); b.focus(); }
  else if(e.key==="ArrowDown"){ e.preventDefault(); items[(i+1)%items.length].focus(); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); items[(i-1+items.length)%items.length].focus(); }
  else if((e.key==="Enter"||e.key===" ")&&i>=0){ e.preventDefault(); pickSel(i); }
});
addEventListener("scroll",e=>{ if(selMenu&&e.target&&e.target.nodeType===1&&selMenu.m.contains(e.target)) return; closeSelMenu(); },true); addEventListener("resize",closeSelMenu);   // menyuning o'z aylanishi uni yopmaydi
/* zamonaviy til menyusi: haqiqiy <select> yashirin holda saqlanadi (mantiq o'zgarmaydi) */
const LANG_LIST=[["uz","UZ","O'zbekcha"],["en","EN","English"],["ru","RU","Русский"],["fr","FR","Français"],["de","DE","Deutsch"]];
function syncLangUi(){
  const cur=LANG_LIST.find(x=>x[0]===lang)||LANG_LIST[0];
  $("#langCode").textContent=cur[1]; $("#langName").textContent=cur[2];
  document.querySelectorAll("#langMenu li").forEach(li=>li.setAttribute("aria-selected",String(li.dataset.lang===lang)));
}
function buildLangMenu(){
  $("#langMenu").innerHTML=LANG_LIST.map(([c,k,n])=>`<li role="option" tabindex="-1" data-lang="${c}" aria-selected="${c===lang}"><span class="lc">${k}</span><span class="ln">${n}</span><svg class="i ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></li>`).join("");
}
function langMenu(open,focusSel){
  const menu=$("#langMenu"), btn=$("#langBtn"); menu.hidden=!open; btn.setAttribute("aria-expanded",String(open));
  if(open&&focusSel){ const li=menu.querySelector('[aria-selected="true"]')||menu.firstElementChild; li&&li.focus(); }
}
function pickLang(c){ const sel=$("#langSel"); sel.value=c; sel.dispatchEvent(new Event("change",{bubbles:true})); langMenu(false); $("#langBtn").focus(); }
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("#langBtn"), li=e.target.closest&&e.target.closest("#langMenu li");
  if(b){ langMenu($("#langMenu").hidden,false); return; }
  if(li){ pickLang(li.dataset.lang); return; }
  if(!$("#langMenu").hidden) langMenu(false);
});
document.addEventListener("keydown",e=>{
  const menu=$("#langMenu"); if(!menu) return;
  if(e.target.id==="langBtn"&&(e.key==="ArrowDown"||e.key==="ArrowUp")){ e.preventDefault(); langMenu(true,true); return; }
  if(menu.hidden) return;
  const items=[...menu.querySelectorAll("li")], i=items.indexOf(document.activeElement);
  if(e.key==="Escape"){ langMenu(false); $("#langBtn").focus(); }
  else if(e.key==="ArrowDown"){ e.preventDefault(); items[(i+1)%items.length].focus(); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); items[(i-1+items.length)%items.length].focus(); }
  else if((e.key==="Enter"||e.key===" ")&&i>=0){ e.preventDefault(); pickLang(items[i].dataset.lang); }
});
function setLang(l){
  lang=l; try{ localStorage.setItem(LANG_KEY,l); }catch(e){}
  document.documentElement.lang=l; const ls=$("#langSel"); if(ls) ls.value=l; syncLangUi();
  tWalk(document.body); syncSelLabels();
  if(typeof render==="function") render();
}
function initI18n(){
  const ls=$("#langSel"); ls.value=lang; ls.addEventListener("change",e=>setLang(e.target.value)); buildLangMenu(); syncLangUi(); enhanceSelects();
  document.documentElement.lang=lang;
  new MutationObserver(ms=>{ for(const m of ms){
    if(m.type==="childList") m.addedNodes.forEach(tWalk);
    else if(m.type==="characterData") tNode(m.target);
    else if(m.type==="attributes") tAttr(m.target,m.attributeName);
  }}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  tWalk(document.body);
}
window.__i18n={MISS,get lang(){return lang;},setLang,RULES,DICT};

/* ---------- kunduzgi / tungi rejim ---------- */
const THEME_KEY="nearby-proto-theme", THEMES=[["auto","Avto","theme-auto"],["light","Kunduzgi","sun"],["dark","Tungi","moon"]];
let theme="auto"; try{ const t=localStorage.getItem(THEME_KEY); if(THEMES.some(x=>x[0]===t)) theme=t; }catch(e){}
function applyTheme(){
  const r=document.documentElement; if(theme==="auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme",theme);
  const [,label,icon]=THEMES.find(x=>x[0]===theme);
  $("#themeBtn").innerHTML=`${ic(icon)}<span class="tlabel">${label}</span>`;
  $("#themeBtn").title=theme==="auto"?"Qurilma sozlamasiga qarab (hozir: "+(matchMedia("(prefers-color-scheme: dark)").matches?"tungi":"kunduzgi")+")":label+" rejim";
}
$("#themeBtn").addEventListener("click",()=>{
  theme=THEMES[(THEMES.findIndex(x=>x[0]===theme)+1)%THEMES.length][0];
  try{ localStorage.setItem(THEME_KEY,theme); }catch(e){}
  applyTheme();
});
applyTheme();
drawBase(); drawCountry(); renderLayers(); renderOrigin();
const r0=svg.getBoundingClientRect(); pxW=Math.max(1,r0.width); pxH=Math.max(1,r0.height); sizeReal(); readColors();
// boshlang'ich ko'rinish: Toshkent markazi, binolar ko'rinadigan masshtabda
initPending=r0.width<50;
setCenter(state.user.x,state.user.y,clamp(pxW*5.5,3200,6500));
{ const r0=userRegion(); state.region=r0.id; selectRegion(r0); }   // boshlanishda faqat foydalanuvchi turgan hudud
render();
if("ResizeObserver" in window) new ResizeObserver(measure).observe(svg); else addEventListener("resize",measure);
initI18n();
setTimeout(()=>idle(()=>{ try{
  startHw();   // shaharlararo yo'l grafi
  // foydalanuvchi turgan hududning ko'cha grafi (birinchi marshrut qotmasin)
  let area=null; for(const z of REAL_AREAS){ const bb=z.bbox; if(state.user.x>=bb[0]&&state.user.x<=bb[2]&&state.user.y>=bb[1]&&state.user.y<=bb[3]&&z.r.length&&(!area||(bb[2]-bb[0])*(bb[3]-bb[1])<(area.bbox[2]-area.bbox[0])*(area.bbox[3]-area.bbox[1]))) area=z; }
  if(area&&!area._g) stepGen(graphGen(area));
}catch(e){} }),2500);
})();
// telefon: pastdan tortib chiqariladigan panel (peek / yarim / to'liq)
(function(){
  const mq=matchMedia("(max-width:860px)"), app=document.querySelector(".app"), panel=document.getElementById("panel");
  if(!app||!panel) return;
  const hd=document.createElement("div"); hd.className="sheet-h"; hd.setAttribute("role","button"); hd.setAttribute("aria-label","Panelni ochish yoki yopish"); hd.innerHTML="<i></i>"; panel.prepend(hd);
  let idx=1, cur=0;
  const pts=()=>{ const H=app.clientHeight; return [Math.min(250,H*.36),H*.52,H-6]; };
  function set(px,anim){ cur=px; const H=app.clientHeight; app.style.setProperty("--sh",Math.round(px)+"px"); panel.style.transition=anim?"height .28s cubic-bezier(.2,.8,.2,1)":"none"; app.dataset.snap=px>H-40?"full":px>H*.4?"half":"peek"; }
  function go(i){ idx=i; set(pts()[i],true); }
  function apply(){ if(mq.matches) go(idx); else { app.style.removeProperty("--sh"); delete app.dataset.snap; panel.style.transition=""; } }
  let sy=0,sh=0,drag=false,moved=false;
  hd.addEventListener("pointerdown",e=>{ drag=true; moved=false; sy=e.clientY; sh=cur; try{hd.setPointerCapture(e.pointerId);}catch(_){} });
  hd.addEventListener("pointermove",e=>{ if(!drag) return; const dy=sy-e.clientY; if(Math.abs(dy)>4) moved=true; const H=app.clientHeight; set(Math.max(110,Math.min(H-6,sh+dy)),false); });
  const end=e=>{ if(!drag) return; drag=false; if(!moved){ go((idx+1)%3); return; } const p=pts(); let b=0; p.forEach((v,i)=>{ if(Math.abs(v-cur)<Math.abs(p[b]-cur)) b=i; }); go(b); };
  hd.addEventListener("pointerup",end); hd.addEventListener("pointercancel",end);
  mq.addEventListener("change",apply); addEventListener("resize",()=>{ if(mq.matches) set(pts()[idx],false); });
  const vd=document.getElementById("viewDetail");
  if(vd) new MutationObserver(()=>{ if(mq.matches&&!vd.hidden&&idx===0) go(1); }).observe(vd,{attributes:true,attributeFilter:["hidden"]});
  const q=document.getElementById("q"); if(q) q.addEventListener("focus",()=>{ if(mq.matches&&idx===0) go(1); });
  apply();
})();
