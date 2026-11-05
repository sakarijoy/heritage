let activeAppPage='visits';
const appPageScroll={visits:0,heritage:0};
function showAppPage(page,{top=false}={}){
 if(!['visits','heritage'].includes(page))return;
 appPageScroll[activeAppPage]=window.scrollY;
 activeAppPage=page;
 for(const name of ['visits','heritage'])$('#'+name+'-page').hidden=name!==page;
 document.querySelectorAll('[data-app-page]').forEach(button=>{if(button.dataset.appPage===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
 document.title=(page==='visits'?'省市足迹':'遗产探索')+' · 山河足迹';
 window.scrollTo({top:top?0:appPageScroll[page],behavior:'instant'});
}
$('#app-navigation').onclick=e=>{const button=e.target.closest('[data-app-page]');if(button)showAppPage(button.dataset.appPage)};
$('#visit-regions').onclick=e=>{const button=e.target.closest('[data-visit-region]');if(!button)return;visitRegion=button.dataset.visitRegion;renderVisits()};
$('#visit-status').onchange=()=>{visitStatus=$('#visit-status').value;renderVisits()};
function showLocalHeritage(key){
 const place=VisitDetails.place(key);if(!place)return;
 region=Object.keys(regions).find(r=>regions[r].includes(place.province))||'全部';syncProvinceOptions();$('#province').value=place.province;syncRegionButtons();
 heritageCity=place.city;mode='all';$('#search').value='';$('#type').value='';currentPage=1;
 document.querySelectorAll('.tab').forEach(button=>button.classList.toggle('active',button.dataset.mode==='all'));
 render();showAppPage('heritage',{top:true});
}
$('#clear-location').onclick=()=>{heritageCity='';render()};
let visitEditorKey=null,visitEditorOriginal='';
function visitEditorValue(){return {date:$('#visit-date').value,note:$('#visit-note').value}}
function visitEditorDirty(){return $('#visit-dialog').open&&JSON.stringify(visitEditorValue())!==visitEditorOriginal}
function openVisitEditor(key){
 const place=VisitDetails.place(key);if(!place)return;
 visitEditorKey=key;const details=state.visitDetails[key]||{date:'',note:''};
 $('#visit-editor-title').textContent=place.name;
 const visited=(place.city?state.subdivisions[key]:state.provinces[key])===true;
 $('#visit-editor-status').textContent=(place.city?place.province+' · ':'')+(visited?'已勾选到访':'尚未勾选到访');
 $('#visit-date').value=details.date;$('#visit-note').value=details.note;visitEditorOriginal=JSON.stringify(visitEditorValue());$('#visit-dialog').showModal();
}
$('#provinces').addEventListener('click',e=>{
 const edit=e.target.closest('[data-edit-visit]');if(edit){openVisitEditor(edit.dataset.editVisit);return}
 const heritage=e.target.closest('[data-visit-heritage]');if(heritage){showLocalHeritage(heritage.dataset.visitHeritage);return}
 const expand=e.target.closest('[data-expand-visits]');if(expand){const province=expand.dataset.expandVisits;if(expandedVisitProvinces.has(province))expandedVisitProvinces.delete(province);else expandedVisitProvinces.add(province);renderVisits();$('#provinces').querySelector('[data-expand-visits="'+province+'"]')?.focus({preventScroll:true})}
});
$('#visit-editor-close').onclick=()=>$('#visit-dialog').close();
$('#visit-dialog').addEventListener('close',()=>{$('#provinces').querySelector('[data-edit-visit="'+visitEditorKey+'"]')?.focus({preventScroll:true})});
$('#visit-editor-form').onsubmit=e=>{
 e.preventDefault();if(!visitEditorKey)return;
 const details=visitEditorValue();details.note=details.note.trim();
 if(!VisitDetails.valid({[visitEditorKey]:details})){toast('请填写有效日期，备注最多500字');return}
 const previous=state.visitDetails[visitEditorKey];state.visitDetails[visitEditorKey]=details;
 if(!save()){if(previous)state.visitDetails[visitEditorKey]=previous;else delete state.visitDetails[visitEditorKey];renderVisits();return}
 visitEditorOriginal=JSON.stringify(visitEditorValue());$('#visit-dialog').close();invalidateBackup();toast('到访记录已保存');
};
$('#visit-editor-heritage').onclick=()=>{if(visitEditorDirty()){toast('请先保存当前日期和备注，再查看遗产');return}const key=visitEditorKey;$('#visit-dialog').close();showLocalHeritage(key)};
document.addEventListener('click',e=>{if(e.target.closest('#app-more button'))$('#app-more').open=false});
// A direct destination link opens the heritage page; normal launches start on visits.
if(location.hash.startsWith('#site='))showAppPage('heritage',{top:true});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#site=')&&activeAppPage!=='heritage')showAppPage('heritage',{top:true})});
