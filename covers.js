// Covers use the same private device database as the travel journal.
document.body.insertAdjacentHTML('beforeend','<input id="cover-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" aria-label="选择景点展示图" hidden>');
let coverTarget=null;
function syncCoverControls(){document.querySelectorAll('[data-cover-upload],[data-cover-reset]').forEach(button=>button.disabled=!coverReady||coverSaving)}
async function refreshCovers(){
 const rows=await MobileStore.getCovers();
 coverPhotos.clear();
 for(const row of rows){const site=DATA.items.find(x=>x.id===row.site);if(site)coverPhotos.set(row.site,{url:row.url,caption:site.name+' · 我的照片',custom:true})}
 coverReady=true;
 render();
 if(travelSite)renderTravelHeading(travelSite);
 if(photoCoverSite&&$('#photo-dialog').open)openPhoto(photoCoverSite);
 syncCoverControls();
}
async function updateCover(site,task,message){
 if(coverSaving)return;
 coverSaving=true;syncCoverControls();toast('正在保存景点展示图…');
 try{await task();await refreshCovers();toast(message)}
 catch(error){toast('展示图保存失败：'+error.message)}
 finally{coverSaving=false;syncCoverControls();const parent=document.querySelector('dialog[open]')||document;parent.querySelector('[data-cover-upload="'+site+'"]')?.focus({preventScroll:true})}
}
document.addEventListener('click',event=>{
 const upload=event.target.closest('[data-cover-upload]'),reset=event.target.closest('[data-cover-reset]');
 if((!upload&&!reset)||!coverReady||coverSaving)return;
 if(upload){coverTarget=upload.dataset.coverUpload;const picker=$('#cover-file');picker.value='';(document.querySelector('dialog[open]')||document.body).append(picker);picker.click()}
 else{const site=reset.dataset.coverReset;updateCover(site,()=>MobileStore.resetCover(site),'已恢复默认展示图')}
});
$('#cover-file').onchange=event=>{
 const file=event.target.files[0],site=coverTarget;event.target.value='';coverTarget=null;
 if(!file||!site)return;
 updateCover(site,()=>MobileStore.setCover(site,file),'展示图已替换 · 刷新后仍会保留');
};
window.addEventListener('shanhe-storage-blocked',()=>toast('请关闭其他已打开的山河足迹页面，再重新打开以更新本机存储。'));
refreshCovers().catch(error=>toast('自定义展示图读取失败：'+error.message));
