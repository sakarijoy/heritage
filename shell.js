let activeAppPage='heritage';
const appPageScroll={visits:0,heritage:0};
function showAppPage(page,{top=false}={}){
 if(!['visits','heritage'].includes(page))return;
 const content=$('main');appPageScroll[activeAppPage]=content.scrollTop;
 activeAppPage=page;
 for(const name of ['visits','heritage'])$('#'+name+'-page').hidden=name!==page;
 document.querySelectorAll('[data-app-page]').forEach(button=>{if(button.dataset.appPage===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
 document.title=(page==='visits'?'省市足迹':'遗产探索')+' · 山河足迹';
 content.scrollTo({top:top?0:appPageScroll[page],behavior:'instant'});
}
$('#app-navigation').onclick=e=>{const button=e.target.closest('[data-app-page]');if(button)showAppPage(button.dataset.appPage)};
$('#visit-regions').onclick=e=>{const button=e.target.closest('[data-visit-region]');if(!button)return;visitRegion=button.dataset.visitRegion;selectedVisitProvince=null;renderVisits()};
$('#visit-status').onchange=()=>{visitStatus=$('#visit-status').value;renderVisits()};
function showLocalHeritage(key){
 const place=VisitDetails.place(key);if(!place||!VisitDetails.hasHeritage(key))return;
 region=Object.keys(regions).find(r=>regions[r].includes(place.province))||'全部';syncProvinceOptions();$('#province').value=place.province;syncRegionButtons();
 heritageCity=place.city;mode='all';$('#search').value='';$('#type').value='';currentPage=1;
 document.querySelectorAll('.tab').forEach(button=>button.classList.toggle('active',button.dataset.mode==='all'));
 render();showAppPage('heritage',{top:true});
}
$('#clear-location').onclick=()=>{heritageCity='';render()};
let visitEditorKey=null,visitEditorOriginal='',visitEditorDates=[];
function visitEditorValue(){const pending=$('#visit-date').value;return VisitDetails.normalize({dates:[...visitEditorDates,...(pending?[pending]:[])],note:$('#visit-note').value})}
function renderVisitDates(){
 $('#visit-dates-count').textContent=visitEditorDates.length+' 个日期';
 $('#visit-dates-list').innerHTML=visitEditorDates.length?[...visitEditorDates].reverse().map(date=>`<div class="visit-date-item"><time datetime="${esc(date)}">${esc(date)}</time><button type="button" data-remove-visit-date="${esc(date)}" aria-label="移除${esc(date)}到访日期">移除</button></div>`).join(''):'<p class="visit-dates-empty">还没有到访日期，可在下方添加。</p>';
}
$('#visit-date-add').onclick=()=>{const date=$('#visit-date').value;if(!date||!VisitDetails.validDate(date)){toast('请先选择有效日期');return}if(visitEditorDates.includes(date)){$('#visit-date').value='';toast('这个日期已添加');return}visitEditorDates.push(date);visitEditorDates.sort();$('#visit-date').value='';renderVisitDates()};
$('#visit-dates-list').onclick=e=>{const button=e.target.closest('[data-remove-visit-date]');if(!button)return;visitEditorDates=visitEditorDates.filter(date=>date!==button.dataset.removeVisitDate);if($('#visit-date').value===button.dataset.removeVisitDate)$('#visit-date').value='';renderVisitDates()};
function visitEditorDirty(){return $('#visit-dialog').open&&(JSON.stringify(visitEditorValue())!==visitEditorOriginal||(typeof hasPendingVisitPhotos==='function'&&hasPendingVisitPhotos()))}
function openVisitEditor(key,tab='record'){
 const place=VisitDetails.place(key);if(!place)return;
 visitEditorKey=key;$('#visit-editor-heritage').hidden=!VisitDetails.hasHeritage(key);const details=state.visitDetails[key]||{date:'',note:''};
 $('#visit-editor-title').textContent=place.name;
 const visited=(place.city?state.subdivisions[key]:state.provinces[key])===true;
 $('#visit-editor-status').textContent=(place.city?place.province+' · ':'')+(visited?'已勾选到访':'尚未勾选到访');
 visitEditorDates=VisitDetails.dates(details);$('#visit-date').value='';$('#visit-note').value=details.note;renderVisitDates();visitEditorOriginal=JSON.stringify(visitEditorValue());if(typeof initVisitAlbum==='function')initVisitAlbum(key,tab);if(!$('#visit-dialog').open)$('#visit-dialog').showModal();
}
$('#provinces').addEventListener('click',e=>{
 const photos=e.target.closest('[data-visit-photos]');if(photos){openVisitEditor(photos.dataset.visitPhotos,'album');return}
 const edit=e.target.closest('[data-edit-visit]');if(edit){openVisitEditor(edit.dataset.editVisit);return}
 const heritage=e.target.closest('[data-visit-heritage]');if(heritage){showLocalHeritage(heritage.dataset.visitHeritage);return}
 const select=e.target.closest('[data-select-province]');if(select){const province=select.dataset.selectProvince;selectedVisitProvince=selectedVisitProvince===province?null:province;renderVisits();$('#provinces').querySelector('[data-select-province="'+province+'"]')?.focus({preventScroll:true})}
});
$('#visit-editor-close').onclick=()=>{if(typeof canCloseVisitAlbum==='function'&&!canCloseVisitAlbum())return;$('#visit-dialog').close()};
$('#visit-dialog').addEventListener('close',()=>{$('#provinces').querySelector('[data-edit-visit="'+visitEditorKey+'"]')?.focus({preventScroll:true})});
$('#visit-editor-form').onsubmit=e=>{
 e.preventDefault();if(!visitEditorKey)return;
 const details=visitEditorValue();details.note=details.note.trim();
 if(!VisitDetails.valid({[visitEditorKey]:details})){toast('请填写有效的到访日期，备注最多500字');return}
 const previous=state.visitDetails[visitEditorKey];state.visitDetails[visitEditorKey]=details;
 if(!save()){if(previous)state.visitDetails[visitEditorKey]=previous;else delete state.visitDetails[visitEditorKey];renderVisits();return}
 visitEditorDates=[...details.dates];$('#visit-date').value='';$('#visit-note').value=details.note;renderVisitDates();visitEditorOriginal=JSON.stringify(visitEditorValue());invalidateBackup();toast('全部到访日期与备注已保存');
};
$('#visit-editor-heritage').onclick=()=>{if(visitEditorDirty()){toast('请先保存当前日期和备注，再查看遗产');return}const key=visitEditorKey;$('#visit-dialog').close();showLocalHeritage(key)};
document.addEventListener('click',e=>{if(e.target.closest('#app-more button'))$('#app-more').open=false});
// Keep only view settings in session storage while the app automatically reloads.
function preserveAppView(){try{const scroll={...appPageScroll,[activeAppPage]:$('main').scrollTop};sessionStorage.setItem('shanhe-update-view',JSON.stringify({page:activeAppPage,scroll,mode,region,province:$('#province').value,search:$('#search').value,type:$('#type').value,heritageCity,currentPage,pageSize,visitRegion,visitStatus,selectedVisitProvince}))}catch{}}
function restoreAppView(){try{
 const raw=sessionStorage.getItem('shanhe-update-view');sessionStorage.removeItem('shanhe-update-view');if(!raw)return;
 const view=JSON.parse(raw);if(!view||!['heritage','visits'].includes(view.page))return;
 region=view.region==='全部'||Object.hasOwn(regions,view.region)?view.region:'全部';syncProvinceOptions();$('#province').value=provinces.includes(view.province)?view.province:'';syncRegionButtons();
 mode=['all','todo','done'].includes(view.mode)?view.mode:'all';document.querySelectorAll('.tab').forEach(button=>button.classList.toggle('active',button.dataset.mode===mode));
 $('#search').value=typeof view.search==='string'?view.search:'';$('#type').value=['','文化遗产','自然遗产','双重遗产'].includes(view.type)?view.type:'';
 heritageCity=(DIVISIONS[$('#province').value]||[]).includes(view.heritageCity)?view.heritageCity:'';
 pageSize=[8,16,32].includes(view.pageSize)?view.pageSize:8;$('#page-size').value=String(pageSize);
 visitRegion=view.visitRegion==='全部'||Object.hasOwn(regions,view.visitRegion)?view.visitRegion:'全部';visitStatus=['all','visited','unvisited'].includes(view.visitStatus)?view.visitStatus:'all';$('#visit-status').value=visitStatus;
 selectedVisitProvince=provinces.includes(view.selectedVisitProvince)?view.selectedVisitProvince:null;
 render();currentPage=Number.isSafeInteger(view.currentPage)&&view.currentPage>0?view.currentPage:1;render();showAppPage(view.page,{top:true});
 for(const name of ['heritage','visits'])appPageScroll[name]=Number.isFinite(view.scroll?.[name])&&view.scroll[name]>0?view.scroll[name]:0;
 $('main').scrollTo({top:appPageScroll[view.page],behavior:'instant'});
}catch{}}
// Heritage exploration is the default home page; automatic updates restore the view.
showAppPage('heritage',{top:true});restoreAppView();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#site=')&&activeAppPage!=='heritage')showAppPage('heritage',{top:true})});
