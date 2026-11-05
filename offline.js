let offlineReady=false,offlineBusy=false,offlineAttempt=0,offlinePhotoCursor=0,offlinePhotoBusy=false,offlinePhotoTimer=null,offlineNeedsCoreRetry=false;
const offlineRegistrations=new Set();
function offlineLabel(text){if(mobileReloading||mobileControllerPending||mobileRegistration?.waiting)return;const label=$('#mobile-cache-status');if(label.textContent!==text)label.textContent=text}
function offlineRetryLabel(text){$('#offline-retry').textContent=text;$('#offline-retry').hidden=false;$('#offline-retry').disabled=false}
function offlinePreparationFailed(){offlineBusy=false;offlineNeedsCoreRetry=true;$('#offline-repair').disabled=false;offlineLabel(offlineReady?'当前页面可离线，新版暂未准备完成。':'离线准备暂未完成，可继续联网使用。');offlineRetryLabel('重试离线准备')}
function offlineTimeout(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Offline preparation timed out')),ms)})]).finally(()=>clearTimeout(timer))}
async function waitForOfflineWorker(registration){for(let i=0;i<60;i++){if(registration.active?.state==='activated')return registration.active;if(registration.installing?.state==='redundant'&&!registration.active)throw Error('Offline installation failed');await new Promise(resolve=>setTimeout(resolve,500))}throw Error('Offline installation timed out')}
function requestOfflinePhotos(cursor=0){
 if(!offlineReady||offlinePhotoBusy||document.visibilityState!=='visible')return;
 const worker=mobileRegistration?.active;if(!worker?.postMessage)return;
 offlinePhotoBusy=true;offlinePhotoCursor=cursor;
 clearTimeout(offlinePhotoTimer);offlinePhotoTimer=setTimeout(()=>{offlinePhotoBusy=false;offlineLabel('查询与记录可离线，景点图片稍后可重试。');offlineRetryLabel('补齐景点图片')},30000);
 try{worker.postMessage({type:'CACHE_PHOTOS',cursor})}catch{clearTimeout(offlinePhotoTimer);offlinePhotoBusy=false;offlineRetryLabel('补齐景点图片')}
}
async function offlineStatus(repair=false){
 if(!('serviceWorker' in navigator)){offlineLabel('此浏览器暂不支持离线，仍可联网使用。');return}
 const attempt=++offlineAttempt;offlineBusy=true;$('#offline-retry').disabled=true;$('#offline-repair').disabled=true;
 offlineLabel(repair?'正在重新准备基础离线资源…':'正在准备基础离线资源…');
 try{
  const registration=await offlineTimeout(navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}),15000);if(attempt!==offlineAttempt)return;mobileRegistration=registration;
  if(!offlineRegistrations.has(registration)){offlineRegistrations.add(registration);registration.addEventListener('updatefound',()=>watchMobileInstaller(registration))}watchMobileInstaller(registration);offerMobileUpdate(registration);
  const worker=await waitForOfflineWorker(registration);if(attempt!==offlineAttempt)return;
  offlineReady=true;offlineBusy=false;offlineNeedsCoreRetry=false;$('#offline-repair').disabled=false;$('#offline-retry').hidden=true;$('#offline-retry').disabled=false;
  offlineLabel('查询与记录已可离线 · 自动更新已开启');checkMobileUpdates(true);
  if(repair){offlineBusy=true;worker.postMessage({type:'REPAIR_CORE'});setTimeout(()=>{if(attempt===offlineAttempt&&offlineBusy)offlinePreparationFailed()},30000)}else requestOfflinePhotos(0);
 }catch{if(attempt===offlineAttempt)offlinePreparationFailed()}
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{
 const data=event.data,registration=mobileRegistration;
 if(!data||data.type!=='SHANHE_OFFLINE'||!registration||![registration.active,registration.installing,registration.waiting].includes(event.source))return;
 if(!Number.isInteger(data.completed)||!Number.isInteger(data.total)||data.completed<0||data.total<0||data.total>1000||data.completed>data.total)return;
 if(data.phase==='core'&&offlineBusy){offlineLabel('准备基础离线资源 '+data.completed+' / '+data.total);return}
 if(data.phase==='core-failed'){offlinePreparationFailed();return}
 if(data.phase==='core-ready'&&event.source===registration.active){offlineReady=true;offlineBusy=false;offlineNeedsCoreRetry=false;$('#offline-repair').disabled=false;$('#offline-retry').hidden=true;offlineLabel('查询与记录已可离线 · 自动更新已开启');requestOfflinePhotos(0);return}
 if(data.phase!=='photos'||event.source!==registration.active||!Number.isInteger(data.next)||data.next<0||data.next>data.total)return;
 clearTimeout(offlinePhotoTimer);offlinePhotoBusy=false;offlinePhotoCursor=data.next;
 if(data.completed===data.total){offlineLabel('离线资源已就绪 · 自动更新已开启');$('#offline-retry').hidden=true;return}
 offlineLabel('查询与记录可离线 · 景点图片 '+data.completed+' / '+data.total);
 if(data.next<data.total){if(document.visibilityState==='visible')requestOfflinePhotos(data.next)}else{offlineLabel('查询与记录可离线 · 景点图片未齐（'+data.completed+'/'+data.total+'）');offlineRetryLabel('补齐景点图片');offlinePhotoCursor=0}
});
$('#offline-retry').onclick=()=>{if(offlineNeedsCoreRetry){offlineStatus(offlineReady);return}if(offlineReady){$('#offline-retry').hidden=true;requestOfflinePhotos(0)}else offlineStatus()};
$('#offline-repair').onclick=()=>offlineStatus(true);
function resumeOfflinePreparation(){if(!offlineReady){if(!offlineBusy)offlineStatus();return}if(!offlinePhotoBusy)requestOfflinePhotos(offlinePhotoCursor)}
window.addEventListener('online',resumeOfflinePreparation);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resumeOfflinePreparation()});
offlineStatus();
