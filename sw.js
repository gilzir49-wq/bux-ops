/* Service Worker — טעינה מהירה + עמידות אופליין למעטפת האפליקציה.
   אסטרטגיה: network-first לכל מה שבאותו origin (כך שתמיד יש לוגיקה עדכנית כשיש רשת,
   ומעטפת מהקאש כשאין). בקשות ל-Firebase (origin אחר) לא נוגעים בהן בכלל. */
const CACHE = 'bux-ops-v1';
const SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  let url; try{ url=new URL(req.url); }catch(_){ return; }
  if(url.origin!==location.origin) return;            // Firebase וכו' — עוברים כרגיל
  e.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
  );
});
