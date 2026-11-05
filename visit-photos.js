let visitPhotoPlace=null,visitAlbumRows=[],visitPhotoSelection=[],visitPhotoPreviewURLs=[],visitPhotosBusy=false,visitAlbumLoad=0,visitPhotoViewing=null;
function switchVisitEditorTab(tab){
 for(const name of ['record','album']){const active=name===tab,button=$('#visit-tab-'+name);$('#visit-'+name+'-panel').hidden=!active;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1}
}
$('.visit-editor-tabs').onclick=e=>{const button=e.target.closest('[data-visit-tab]');if(button)switchVisitEditorTab(button.dataset.visitTab)};
$('.visit-editor-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tab=$('#visit-record-panel').hidden?'record':'album';switchVisitEditorTab(tab);$('#visit-tab-'+tab).focus()};
function clearVisitPhotoSelection(){visitPhotoPreviewURLs.forEach(URL.revokeObjectURL);visitPhotoPreviewURLs=[];visitPhotoSelection=[];$('#visit-photo-previews').innerHTML='';$('#visit-photo-caption').value='';$('#visit-photo-files').value='';$('#visit-photo-form').hidden=true;$('#visit-photo-add').disabled=visitPhotosBusy}
function hasPendingVisitPhotos(){return visitPhotoSelection.length>0||visitPhotosBusy||($('#visit-photo-viewer').open&&$('#visit-photo-edit-caption').value!==(visitPhotoViewing?.caption||''))}
function canCloseVisitAlbum(){if(visitPhotosBusy){toast('正在保存照片，请稍候');return false}if(visitPhotoSelection.length){switchVisitEditorTab('album');toast('请先保存所选照片，或点击“取消选择”');return false}return true}
$('#visit-dialog').addEventListener('cancel',e=>{if(!canCloseVisitAlbum())e.preventDefault()});
function setVisitPhotosBusy(busy){visitPhotosBusy=busy;document.querySelectorAll('#visit-dialog button,#visit-dialog input,#visit-dialog textarea,#visit-photo-viewer button,#visit-photo-viewer textarea').forEach(node=>node.disabled=busy);$('#visit-photo-add').disabled=busy||visitPhotoSelection.length>0}
function initVisitAlbum(place,tab){visitPhotoPlace=place;visitAlbumRows=[];visitPhotoViewing=null;clearVisitPhotoSelection();$('#visit-photo-gallery').innerHTML='';$('#visit-album-count').textContent=visitPhotoCounts.get(place)||0;switchVisitEditorTab(tab);loadVisitAlbum()}
function renderVisitAlbum(){
 $('#visit-album-count').textContent=visitAlbumRows.length;
 $('#visit-photo-gallery').innerHTML=visitAlbumRows.length?visitAlbumRows.map((row,i)=>`<figure><button type="button" data-open-visit-photo="${esc(row.id)}" aria-label="查看第${i+1}张省市照片"><img src="${esc(row.url)}" alt="${esc(row.caption||VisitDetails.place(row.place)?.name+'旅行照片')}" loading="lazy" decoding="async" width="400" height="400"></button><figcaption>${esc(row.caption||'点击查看，添加照片说明')}</figcaption></figure>`).join(''):'<div class="visit-album-empty"><span aria-hidden="true">▧</span><strong>这里还没有旅行照片</strong><p>点击“添加照片”，留下属于这里的回忆。</p></div>';
}
async function loadVisitAlbum(){
 const place=visitPhotoPlace,version=++visitAlbumLoad;if(!place)return;
 $('#visit-photo-status').textContent='正在读取本机照片…';$('#visit-photo-retry').hidden=true;
 try{const rows=await MobileStore.getVisitPhotos(place);if(place!==visitPhotoPlace||version!==visitAlbumLoad)return;visitAlbumRows=rows;renderVisitAlbum();$('#visit-photo-status').textContent=rows.length?'共 '+rows.length+' 张 · 点击照片可放大、修改说明或删除':''}
 catch(error){if(place!==visitPhotoPlace||version!==visitAlbumLoad)return;$('#visit-photo-status').textContent='读取失败：'+error.message;$('#visit-photo-retry').hidden=false}
}
async function refreshVisitAlbums(){const counts=await MobileStore.getVisitPhotoCounts();visitPhotoCounts.clear();for(const [key,count] of Object.entries(counts))visitPhotoCounts.set(key,count);renderVisits();if($('#visit-dialog').open&&visitPhotoPlace)await loadVisitAlbum()}
async function refreshVisitAlbumsAfterSave(){try{await refreshVisitAlbums()}catch(error){$('#visit-photo-status').textContent='照片已保存，但列表读取失败：'+error.message;$('#visit-photo-retry').hidden=false}}
$('#visit-photo-retry').onclick=()=>refreshVisitAlbums().catch(error=>{$('#visit-photo-status').textContent='读取失败：'+error.message});
$('#visit-photo-add').onclick=()=>{if(!visitPhotosBusy&&!visitPhotoSelection.length)$('#visit-photo-files').click()};
$('#visit-photo-files').onchange=e=>{
 const files=Array.from(e.target.files);e.target.value='';if(!files.length)return;
 if(files.length>6||files.some(file=>!file.size||file.size>8*1024*1024||!(['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)||(!file.type&&/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))))){toast('请选择1至6张照片，每张8MB以内，支持 JPG、PNG、WebP 和可读取的 HEIC');return}
 clearVisitPhotoSelection();visitPhotoSelection=files;
 visitPhotoPreviewURLs=files.map(file=>URL.createObjectURL(file));
 $('#visit-photo-previews').innerHTML=visitPhotoPreviewURLs.map((url,i)=>`<figure><img src="${esc(url)}" alt="待保存照片${i+1}" width="400" height="400"><figcaption>照片 ${i+1}</figcaption></figure>`).join('');
 $('#visit-selection-count').textContent='已选择 '+files.length+' 张';$('#visit-photo-form').hidden=false;$('#visit-photo-add').disabled=true;$('#visit-photo-status').textContent='预览确认后点击“保存照片”。';invalidateBackup();
};
$('#visit-photo-cancel').onclick=()=>{if(visitPhotosBusy)return;clearVisitPhotoSelection();$('#visit-photo-status').textContent='已取消选择';$('#visit-photo-add').focus()};
$('#visit-photo-form').onsubmit=async e=>{
 e.preventDefault();if(visitPhotosBusy||!visitPhotoSelection.length||!visitPhotoPlace)return;
 const place=visitPhotoPlace,files=[...visitPhotoSelection],caption=$('#visit-photo-caption').value;
 setVisitPhotosBusy(true);$('#visit-photo-save').textContent='正在保存…';$('#visit-photo-status').textContent='正在压缩并保存 '+files.length+' 张照片…';
 try{await MobileStore.addVisitPhotos(place,files,caption);clearVisitPhotoSelection();invalidateBackup();await refreshVisitAlbumsAfterSave();toast('已保存 '+files.length+' 张照片')}
 catch(error){$('#visit-photo-status').textContent='保存失败：'+error.message+' 所选照片仍保留，可重试。';toast('照片未保存，请查看提示后重试')}
 finally{setVisitPhotosBusy(false);$('#visit-photo-save').textContent='保存照片'}
};
function openVisitPhoto(id){
 const row=visitAlbumRows.find(row=>row.id===id);if(!row)return;
 visitPhotoViewing=row;$('#visit-photo-viewer-title').textContent=VisitDetails.place(row.place).name+' · 旅行照片';$('#visit-photo-full').src=row.url;$('#visit-photo-full').alt=row.caption||VisitDetails.place(row.place).name+'旅行照片';$('#visit-photo-edit-caption').value=row.caption;$('#visit-photo-saved-date').textContent='保存于 '+new Date(row.createdAt).toLocaleDateString('zh-CN');$('#visit-photo-delete-confirm').hidden=true;if(!$('#visit-photo-viewer').open)$('#visit-photo-viewer').showModal();
}
$('#visit-photo-gallery').onclick=e=>{const button=e.target.closest('[data-open-visit-photo]');if(button)openVisitPhoto(button.dataset.openVisitPhoto)};
$('#visit-photo-viewer-close').onclick=()=>{if(!visitPhotosBusy)$('#visit-photo-viewer').close()};
$('#visit-photo-viewer').addEventListener('cancel',e=>{if(visitPhotosBusy)e.preventDefault()});
$('#visit-photo-viewer').addEventListener('close',()=>{$('#visit-photo-gallery').querySelector('[data-open-visit-photo="'+visitPhotoViewing?.id+'"]')?.focus({preventScroll:true});$('#visit-photo-delete-confirm').hidden=true});
$('#visit-photo-caption-form').onsubmit=async e=>{
 e.preventDefault();if(visitPhotosBusy||!visitPhotoViewing)return;
 const {place,id}=visitPhotoViewing,caption=$('#visit-photo-edit-caption').value;setVisitPhotosBusy(true);
 try{await MobileStore.editVisitPhoto(place,id,caption);invalidateBackup();visitPhotoViewing={...visitPhotoViewing,caption:caption.trim()};await refreshVisitAlbumsAfterSave();$('#visit-photo-edit-caption').value=visitPhotoViewing.caption;$('#visit-photo-full').alt=visitPhotoViewing.caption||VisitDetails.place(place).name+'旅行照片';toast('照片说明已保存')}
 catch(error){toast('保存失败：'+error.message)}finally{setVisitPhotosBusy(false)}
};
$('#visit-photo-delete').onclick=()=>{if(visitPhotosBusy)return;$('#visit-photo-delete-confirm').hidden=false;$('#visit-photo-delete-cancel').focus()};
$('#visit-photo-delete-cancel').onclick=()=>{$('#visit-photo-delete-confirm').hidden=true;$('#visit-photo-delete').focus()};
$('#visit-photo-delete-confirm-button').onclick=async()=>{
 if(visitPhotosBusy||!visitPhotoViewing)return;const {place,id}=visitPhotoViewing;setVisitPhotosBusy(true);
 try{await MobileStore.deleteVisitPhoto(place,id);$('#visit-photo-viewer').close();invalidateBackup();await refreshVisitAlbumsAfterSave();toast('这张照片已删除')}
 catch(error){toast('删除失败：'+error.message)}finally{setVisitPhotosBusy(false)}
};
refreshVisitAlbums().catch(error=>toast('省市照片读取失败：'+error.message));
