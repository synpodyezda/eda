const C='dnevnik-v3';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
const CDN=['unpkg.com','cdn.jsdelivr.net','cdn.sheetjs.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname.includes('openfoodfacts'))return; // база продуктов — всегда из сети
  if(u.origin===location.origin){
    // сначала из кэша (быстро и без интернета), параллельно обновляем
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true});
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
      return hit||net;
    }));return;
  }
  if(CDN.includes(u.hostname)){
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(r);if(hit)return hit;
      const res=await fetch(r);if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;
    }));
  }
});
