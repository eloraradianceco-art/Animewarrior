/* Hybrid Warrior service worker — makes the app open instantly and work offline.
   Bump CACHE when you upload a new index.html so phones refresh. */
const CACHE="hybrid-warrior-v5";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  const isPage=req.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/");
  if(isPage){
    /* network first so updates show up right away; cached copy when offline */
    const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),3500)); /* weak gym signal: fall back to cache */
    e.respondWith(Promise.race([fetch(req),timeout]).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r;}).catch(()=>caches.match(req).then(m=>m||caches.match("./index.html"))));
    return;
  }
  /* everything else (fonts, icons): cache first, refresh in background */
  e.respondWith(caches.match(req).then(m=>{
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==="opaque")){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;}).catch(()=>m);
    return m||net;
  }));
});
