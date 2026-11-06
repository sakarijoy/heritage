const CACHE="shanhe-iphone-463274eba37b",ASSETS=["./","./app-frame.css","./app.js","./covers.js","./data.js","./divisions.js","./favicon.svg","./icons-apple-touch-icon.png","./icons-icon-192.png","./icons-icon-512.png","./images-1001.jpg","./images-1002.jpg","./images-1003.jpg","./images-1004.jpg","./images-1039.jpg","./images-1083.jpg","./images-1110.jpg","./images-1111.jpg","./images-1112.jpg","./images-1113.jpg","./images-1114.jpg","./images-1135.jpg","./images-1213.jpg","./images-1248.jpg","./images-1279.jpg","./images-1292.jpg","./images-1305.jpg","./images-1334.jpg","./images-1335.jpg","./images-1388.jpg","./images-1389.jpg","./images-1414.jpg","./images-1442.jpg","./images-1443.jpg","./images-1474.jpg","./images-1508.jpg","./images-1509.jpg","./images-1540.jpg","./images-1541.jpg","./images-1559.jpg","./images-1561.jpg","./images-1592.jpg","./images-1606.jpg","./images-1638.jpg","./images-1665.jpg","./images-1714.jpg","./images-1736.jpg","./images-1765.jpg","./images-437.jpg","./images-438.jpg","./images-439.jpg","./images-440.jpg","./images-441.jpg","./images-449.jpg","./images-547.jpg","./images-637.jpg","./images-638.jpg","./images-640.jpg","./images-703.jpg","./images-704.jpg","./images-705.jpg","./images-707.jpg","./images-778.jpg","./images-779.jpg","./images-811.jpg","./images-812.jpg","./images-813.jpg","./images-880.jpg","./images-881.jpg","./images-911.jpg","./images-912.jpg","./index.html","./install.css","./install.html","./intros.js","./journal.css","./journal.js","./manifest.webmanifest","./mobile-store.js","./mobile.css","./mobile.js","./offline.js","./photos.css","./photos.js","./photos.json","./responsive.css","./shell.css","./shell.js","./style.css","./visit-model.js","./visit-photos.css","./visit-photos.js","./visit-records.css","./visits.js"];
const PHOTO_REV="d5bfbf049907dadb";
// This file is compiled after the version and asset declarations by build-sw.cjs.
const PHOTO_ASSETS=ASSETS.filter(asset=>/(?:^|\/)images(?:\/|-)/.test(asset));
const CORE_ASSETS=ASSETS.filter(asset=>!PHOTO_ASSETS.includes(asset));
const PHOTO_CACHE='shanhe-photos-'+PHOTO_REV;
const assetURLs=new Map(ASSETS.map(asset=>[new URL(asset,self.registration.scope).pathname,asset]));
const photoJobs=new Map();
async function download(request,timeout=10000){
 const controller=new AbortController();let timer;
 try{return await Promise.race([fetch(request,{signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Download timed out'))},timeout)})])}finally{clearTimeout(timer)}
}
async function notify(data,source){
 const message={type:'SHANHE_OFFLINE',cache:CACHE,...data};
 try{if(source){source.postMessage(message);return}for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(client.url.startsWith(self.registration.scope))client.postMessage(message)}catch{}
}
async function pool(items,limit,task){let next=0,failure;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length&&!failure){const item=items[next++];try{await task(item)}catch(error){failure=error}}}));if(failure)throw failure}
async function prepareCore(force=false,source){
 const cache=await caches.open(CACHE);let completed=0;
 await notify({phase:'core',completed,total:CORE_ASSETS.length},source);
 try{
  await pool(CORE_ASSETS,4,async asset=>{
   const existing=!force&&await cache.match(asset);
   if(!existing){let failure;for(let attempt=0;attempt<2;attempt++){try{const response=await download(new Request(new URL(asset,self.registration.scope),{cache:'reload'}));if(!response.ok)throw Error('HTTP '+response.status);await cache.put(asset,response);failure=null;break}catch(error){failure=error}}if(failure)throw failure}
   completed++;if(completed%4===0||completed===CORE_ASSETS.length)await notify({phase:'core',completed,total:CORE_ASSETS.length},source);
  });
  await notify({phase:'core-ready',completed,total:CORE_ASSETS.length},source);
 }catch(error){await notify({phase:'core-failed',completed,total:CORE_ASSETS.length},source);throw error}
}
async function photoCount(cache){const expected=new Set(PHOTO_ASSETS.map(asset=>new URL(asset,self.registration.scope).href));return (await cache.keys()).filter(request=>expected.has(request.url)).length}
async function preparePhotoBatch(cursor){
 const cache=await caches.open(PHOTO_CACHE),batch=PHOTO_ASSETS.slice(cursor,cursor+6);
 await pool(batch,3,async asset=>{try{if(await cache.match(asset))return;const response=await download(new Request(new URL(asset,self.registration.scope),{cache:'reload'}),12000);if(response.ok)await cache.put(asset,response)}catch{}});
 return {phase:'photos',completed:await photoCount(cache),total:PHOTO_ASSETS.length,next:Math.min(cursor+6,PHOTO_ASSETS.length)};
}
self.addEventListener('install',event=>event.waitUntil(prepareCore()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if((key.startsWith('shanhe-iphone-')&&key!==CACHE)||(key.startsWith('shanhe-photos-')&&key!==PHOTO_CACHE))await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 const message=event.data||{};
 if(message.type==='ACTIVATE_UPDATE'){self.skipWaiting();return}
 if(message.type==='REPAIR_CORE'){event.waitUntil(prepareCore(true,event.source).catch(()=>{}));return}
 if(message.type!=='CACHE_PHOTOS'||!Number.isInteger(message.cursor)||message.cursor<0||message.cursor>PHOTO_ASSETS.length)return;
 const cursor=message.cursor;
 if(!photoJobs.has(cursor))photoJobs.set(cursor,preparePhotoBatch(cursor).catch(()=>({phase:'photos',completed:0,total:PHOTO_ASSETS.length,next:PHOTO_ASSETS.length})).finally(()=>photoJobs.delete(cursor)));
 event.waitUntil(photoJobs.get(cursor).then(status=>notify(status,event.source)));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const asset=assetURLs.get(url.pathname);if(!asset)return;
 event.respondWith((async()=>{
  let cache;try{cache=await caches.open(PHOTO_ASSETS.includes(asset)?PHOTO_CACHE:CACHE);const hit=await cache.match(asset);if(hit)return hit}catch{}
  try{const response=await download(event.request,15000);if(response.ok&&cache)event.waitUntil(cache.put(asset,response.clone()).catch(()=>{}));return response}
  catch{if(event.request.mode==='navigate'){try{return (await caches.match(new URL('./index.html',self.registration.scope)))||Response.error()}catch{}}return Response.error()}
 })());
});
