const mobileBackupButton=$('#export');mobileBackupButton.textContent='备份';$('.import').childNodes[0].textContent='恢复';
document.querySelector('main').insertAdjacentHTML('afterbegin',`<section class="install-card"><div class="install-copy"><p class="install-instruction">添加到主屏幕，随时记录旅行。</p><p id="mobile-cache-status" role="status">正在准备离线资源…</p></div><div class="install-actions"><button id="apply-update" type="button" hidden>更新界面</button></div></section>`);
document.body.insertAdjacentHTML('beforeend',`<dialog id="mobile-help" aria-labelledby="help-title"><button id="help-close" aria-label="关闭说明">✕</button><h2 id="help-title">装进口袋里的山河</h2><ol><li>使用 Safari 打开此页面。</li><li>点击“分享”，选择“添加到主屏幕”；如有“作为网页 App 打开”，保持开启。</li><li>从主屏幕图标进入，等待页面提示“离线资源已就绪”，以后可断网使用。</li></ol><p><a href="install.html">查看手机安装说明 ↗</a></p><h3>两个足迹页面</h3><p>底部切换“省市足迹”和“遗产探索”，各自保留筛选条件和浏览位置。省市页默认只显示省名和到访勾选。点省名展开下级、日期备注及照片入口；再次点击收起，勾选与展开互相独立。点击“日期与备注”添加多次到访日期和可选备注，切换“照片”即可添加省市旅行照片。列表上的“照片”数量也可直接打开相册；这些内容随完整备份迁移。两页的地区筛选互相独立。</p><h3>替换景点展示图</h3><p>在景点图片下点击“上传替换”，选择每张8MB以内的照片。替换图仅本机可见，刷新后仍保留，支持恢复默认图，并随完整备份迁移。</p><h3>自动更新</h3><p>联网打开、切回应用或恢复网络时会自动检查新版。没有未保存内容、所选照片或正在进行的操作时自动切换，无需重新添加桌面图标。正在编辑或保存时会暂缓，操作结束后自动继续。</p><h3>记录和备份</h3><p>无需登录。评论、照片、游记和打卡只保存在当前设备，换手机不会自动同步。</p><p>在右上角“更多”中点击“备份”，将文件保存到“文件”App 或 iCloud Drive；换设备后使用“恢复”导入。恢复会合并记录。</p><p>删除网页应用、清除网站数据或系统回收存储空间，可能丢失记录。请定期备份，特别是在清理空间和更换手机之前。</p><p>Safari 页面和主屏幕应用的存储可能分开；请先添加到主屏幕，再开始记录。网站和电脑版的旧打卡可以用其导出的 JSON 导入；云端游记、照片不会自动迁移。</p><button id="request-persistence">申请保留本机存储</button><p id="persistence-status" role="status"></p></dialog>`);
$('#install-help').onclick=()=>$('#mobile-help').showModal();$('#help-close').onclick=()=>$('#mobile-help').close();
$('#request-persistence').onclick=async()=>{try{const kept=await navigator.storage?.persist?.();$('#persistence-status').textContent=kept?'已获持久存储许可，仍建议保留备份。':'系统暂未授予持久存储，请定期备份。'}catch{$('#persistence-status').textContent='请定期备份到“文件”App。'}};
let preparedBackup=null,mobileRestoreBusy=false;
mobileBackupButton.onclick=async()=>{if(!preparedBackup){mobileBackupButton.disabled=true;mobileBackupButton.textContent='准备中…';try{const drafts={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('shanhe-journal-draft-'))drafts[k]=localStorage.getItem(k)}const v=await MobileStore.backup({...state},drafts);preparedBackup=new File([JSON.stringify(v)],'山河足迹备份-'+new Date().toISOString().slice(0,10)+'.json',{type:'application/json'});mobileBackupButton.textContent='保存备份';toast('备份已准备好，请再点“保存备份”')}catch(e){toast('备份失败：'+e.message);mobileBackupButton.textContent='备份'}finally{mobileBackupButton.disabled=false}return}try{if(navigator.canShare?.({files:[preparedBackup]})){await navigator.share({files:[preparedBackup],title:'山河足迹备份'})}else{const a=document.createElement('a'),url=URL.createObjectURL(preparedBackup);a.href=url;a.download=preparedBackup.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}preparedBackup=null;mobileBackupButton.textContent='备份'}catch(e){if(e.name!=='AbortError')toast('保存失败，请重试')}};
function invalidateBackup(){preparedBackup=null;mobileBackupButton.textContent='备份'}
document.addEventListener('input',invalidateBackup);document.addEventListener('change',invalidateBackup);document.addEventListener('submit',invalidateBackup);
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;mobileRestoreBusy=true;try{if(file.size>300*1024*1024)throw Error('备份过大，请先在有足够空间的设备上恢复');const value=JSON.parse(await file.text());const restored=await MobileStore.restore(value);for(const k of ['done','todo','components','provinces','subdivisions'])state[k]={...state[k],...restored.preferences[k]};state.visitDetails=VisitDetails.merge(state.visitDetails,restored.preferences.visitDetails);for(const [k,v] of Object.entries(restored.drafts))localStorage.setItem(k,v);save();invalidateBackup();if(typeof refreshCovers==='function')await refreshCovers();if(typeof refreshVisitAlbums==='function')await refreshVisitAlbums();if(typeof travelSite==='string'&&travelSite)await loadTravelEntries();toast('已恢复并合并 '+restored.count+' 条记录'+(restored.coverCount?'、'+restored.coverCount+' 张展示图':'')+(restored.visitPhotoCount?'、'+restored.visitPhotoCount+' 张省市照片':''))}catch(error){toast('恢复失败：'+error.message)}finally{mobileRestoreBusy=false;e.target.value='';queueMobileUpdate()}};
let mobileRegistration=null,mobileUpdateTimer=null,mobileActivationWorker=null,mobileControllerPending=false,mobileReloading=false,mobileLastActivity=0,mobileLastCheck=0,mobileComposing=false;
let mobileHadController=!!navigator.serviceWorker?.controller;
const watchedMobileWorkers=new Set();
function mobileUpdateBlocked(){
 const journalText=$('#journal-title-input').value.trim()||$('#journal-body-input').value.trim();
 const journalDirty=journalText&&$('#draft-status').textContent!=='游记已保存到本机';
 const focus=document.activeElement,editing=focus&&(focus.matches('input:not([type=checkbox]):not([type=button]):not([type=submit]),textarea,select')||focus.isContentEditable);
 return mobileComposing||mobileRestoreBusy||mobileBackupButton.disabled||preparedBackup||document.querySelector('form button:disabled')||(typeof coverSaving!=='undefined'&&coverSaving)||(typeof visitPhotosBusy!=='undefined'&&visitPhotosBusy)||(typeof visitEditorDirty==='function'&&visitEditorDirty())||$('#comment-body').value.trim()||$('#travel-files').files.length||journalDirty||document.querySelector('dialog[open]')||$('#app-more').open||(editing&&Date.now()-mobileLastActivity<10000);
}
function queueMobileUpdate(delay=1800){if(mobileUpdateTimer!==null)clearTimeout(mobileUpdateTimer);mobileUpdateTimer=setTimeout(()=>{mobileUpdateTimer=null;tryMobileUpdate()},delay)}
function tryMobileUpdate(manual=false){
 if(mobileReloading)return;
 const waiting=mobileRegistration?.waiting;
 if(!waiting&&!mobileControllerPending)return;
 if(document.visibilityState!=='visible')return;
 if(mobileUpdateBlocked()){
  $('#mobile-cache-status').textContent='新版已下载，当前操作结束后会自动更新。';$('#apply-update').hidden=false;
  if(manual)toast('请先保存未完成的内容并结束当前操作，随后会自动更新');
  queueMobileUpdate(10000);return;
 }
 const idle=Date.now()-mobileLastActivity;if(idle<1800){queueMobileUpdate(1800-idle);return}
 $('#mobile-cache-status').textContent='正在自动更新…';$('#apply-update').hidden=true;
 if(mobileControllerPending){mobileReloading=true;if(typeof preserveAppView==='function')preserveAppView();location.reload();return}
 if(mobileActivationWorker!==waiting){mobileActivationWorker=waiting;try{waiting.postMessage({type:'ACTIVATE_UPDATE'})}catch{mobileActivationWorker=null;$('#mobile-cache-status').textContent='新版已下载，将稍后自动重试。';queueMobileUpdate(10000)}}
}
function offerMobileUpdate(registration){if(registration.waiting){$('#mobile-cache-status').textContent='新版已下载，将自动更新。';queueMobileUpdate()}}
function watchMobileInstaller(registration){const worker=registration.installing;if(!worker||watchedMobileWorkers.has(worker))return;watchedMobileWorkers.add(worker);worker.addEventListener('statechange',()=>{if(worker.state==='installed')offerMobileUpdate(registration)});if(worker.state==='installed')offerMobileUpdate(registration)}
async function checkMobileUpdates(force=false){
 if(!mobileRegistration||document.visibilityState!=='visible'||navigator.onLine===false)return;
 const now=Date.now();if(!force&&now-mobileLastCheck<60000){offerMobileUpdate(mobileRegistration);return}mobileLastCheck=now;
 try{await mobileRegistration.update();offerMobileUpdate(mobileRegistration)}catch{offerMobileUpdate(mobileRegistration)}
}
$('#apply-update').onclick=()=>tryMobileUpdate(true);
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{
 if(!mobileHadController){mobileHadController=true;return}
 mobileControllerPending=true;queueMobileUpdate();
});
async function offlineStatus(){const label=$('#mobile-cache-status');if(!('serviceWorker' in navigator)){label.textContent='当前浏览器不支持离线缓存，请使用 Safari。';return}try{
 const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});mobileRegistration=registration;
 registration.addEventListener('updatefound',()=>watchMobileInstaller(registration));watchMobileInstaller(registration);
 await navigator.serviceWorker.ready;label.textContent='离线资源已就绪 · 自动更新已开启';offerMobileUpdate(registration);checkMobileUpdates(true);
}catch{label.textContent='离线资源准备失败，请联网后重新打开。'}}offlineStatus();
function mobileUpdateActivity(){mobileLastActivity=Date.now();queueMobileUpdate()}
for(const type of ['input','change','click','focusin','focusout'])document.addEventListener(type,mobileUpdateActivity,true);
document.addEventListener('scroll',mobileUpdateActivity,{capture:true,passive:true});
document.addEventListener('close',()=>queueMobileUpdate(),true);
document.addEventListener('compositionstart',()=>{mobileComposing=true;mobileUpdateActivity()},true);
document.addEventListener('compositionend',()=>{mobileComposing=false;mobileUpdateActivity()},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkMobileUpdates();queueMobileUpdate()}else if(mobileUpdateTimer!==null){clearTimeout(mobileUpdateTimer);mobileUpdateTimer=null}});
window.addEventListener('online',()=>{checkMobileUpdates(true);queueMobileUpdate()});
window.addEventListener('pageshow',()=>{checkMobileUpdates();queueMobileUpdate()});
window.addEventListener('shanhe-records-changed',()=>queueMobileUpdate());
function fitMobileDialog(){if(window.visualViewport&&Math.abs(window.visualViewport.scale-1)<.05)document.documentElement.style.setProperty('--mobile-dialog-height',window.visualViewport.height+'px')}
window.visualViewport?.addEventListener('resize',fitMobileDialog);window.addEventListener('resize',fitMobileDialog);fitMobileDialog();

window.addEventListener('shanhe-records-changed',invalidateBackup);document.addEventListener('click',e=>{if(e.target.closest('[data-action]'))invalidateBackup()});
