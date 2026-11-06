// Each destination has private comments, photos and travel journals stored on this device.
$('main footer').insertAdjacentHTML('beforebegin',`<section id="travel-page" class="app-page" aria-labelledby="travel-title" hidden><div class="travel-top"><button id="travel-close" type="button">← 返回景点列表</button><span>我的旅行记录</span></div><div id="travel-heading"></div><div class="travel-tabs" role="tablist" aria-label="景点记录"><button role="tab" id="tab-comment" data-travel-tab="comment" aria-controls="panel-comment">评论</button><button role="tab" id="tab-photo" data-travel-tab="photo" aria-controls="panel-photo">照片</button><button role="tab" id="tab-journal" data-travel-tab="journal" aria-controls="panel-journal">游记</button></div><p id="travel-status" role="status"></p><button id="travel-retry" hidden>重新加载</button><div class="travel-panel" id="panel-comment" role="tabpanel" aria-labelledby="tab-comment"><form id="comment-form"><label for="comment-body">写下你的感受</label><textarea id="comment-body" maxlength="2000" required placeholder="风景如何？有哪些值得记住的小细节？"></textarea><div class="form-bottom"><span>仅自己可见 · 最多2000字</span><button class="primary" type="submit">保存评论</button></div></form><h3>我的评论</h3><div id="comment-list"></div></div><div class="travel-panel" id="panel-photo" role="tabpanel" aria-labelledby="tab-photo" hidden><form id="photo-form"><label for="travel-files">上传旅行照片</label><input type="file" id="travel-files" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required><p class="field-help">每次最多6张，每张不超过8MB，支持 JPG、PNG、WebP 和可读取的 HEIC 照片。上传后保存至本机，仅自己可见。</p><div id="photo-preview"></div><label for="photo-caption-input">照片说明（可选）</label><input id="photo-caption-input" maxlength="500" placeholder="记录拍摄地点或当时的心情"><button class="primary" type="submit">上传照片</button><p id="upload-status" role="status"></p></form><h3>我的相册</h3><div id="travel-gallery"></div></div><div class="travel-panel" id="panel-journal" role="tabpanel" aria-labelledby="tab-journal" hidden><form id="journal-form" autocomplete="off"><label for="journal-title-input">游记标题</label><input type="text" id="journal-title-input" autocomplete="off" maxlength="120" placeholder="例如：秋日龙门石窟"><label for="journal-body-input">游记正文</label><textarea id="journal-body-input" maxlength="40000" required placeholder="从出发开始，记下路线、见闻和旅途里的心情…"></textarea><div class="form-bottom"><span id="draft-status">点击保存游记后保存至本机</span><button type="submit" class="primary">保存游记</button><button type="button" id="new-journal">另写一篇</button></div></form><h3>已保存的游记</h3><div id="journal-list"></div></div><p class="travel-private">这里的评论、照片和游记保存到你的私人旅行记录中。</p></section>`);
const travelPage=$('#travel-page');let travelSite=null,travelTab='comment',travelEntries=[],journalEditing=null,loadVersion=0,previewUrls=[];
function switchTravelTab(tab){travelTab=tab;for(const name of ['comment','photo','journal']){const active=name===tab;$('#panel-'+name).hidden=!active;const b=$('#tab-'+name);b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1}}
$('.travel-tabs').onclick=e=>{const t=e.target.closest('[data-travel-tab]');if(t)switchTravelTab(t.dataset.travelTab)};
$('.travel-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const tabs=['comment','photo','journal'];switchTravelTab(tabs[(tabs.indexOf(travelTab)+(e.key==='ArrowRight'?1:2))%3]);$('#tab-'+travelTab).focus();e.preventDefault()};
async function travelApi(path='',options={}){return MobileStore.request(path,options)}
function travelDate(date){return new Date(date).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function renderTravelEntries(){const comments=travelEntries.filter(x=>x.kind==='comment'),photos=travelEntries.filter(x=>x.kind==='photo'),journals=travelEntries.filter(x=>x.kind==='journal');$('#comment-list').innerHTML=comments.length?comments.map(x=>`<section class="travel-entry"><time>${esc(travelDate(x.createdAt))}</time><p class="preserve-lines">${esc(x.body)}</p></section>`).join(''):'<p class="travel-empty">还没有评论，写下第一条旅行感受吧。</p>';$('#travel-gallery').innerHTML=photos.length?photos.map(x=>`<figure><button type="button" data-user-photo="${esc(x.id)}" aria-label="放大旅行照片"><img loading="lazy" src="${esc(x.url)}" alt="${esc(x.body||'我的旅行照片')}"></button><figcaption>${esc(x.body||travelDate(x.createdAt))}</figcaption></figure>`).join(''):'<p class="travel-empty">还没有照片，上传属于你的旅行瞬间。</p>';$('#journal-list').innerHTML=journals.length?journals.map(x=>`<section class="travel-entry"><time>${esc(travelDate(x.updatedAt))}</time><h3>${esc(x.title||'未命名游记')}</h3><p class="preserve-lines">${esc(x.body)}</p><button type="button" data-edit-journal="${esc(x.id)}">编辑游记</button></section>`).join(''):'<p class="travel-empty">还没有游记，将这段旅程写下来吧。</p>'}
async function loadTravelEntries(){const site=travelSite,version=++loadVersion;$('#travel-status').textContent='正在读取本机旅行记录…';$('#travel-retry').hidden=true;try{const data=await travelApi('?site='+site);if(site!==travelSite||version!==loadVersion)return;travelEntries=data.entries;renderTravelEntries();$('#travel-status').textContent='已从本机读取 · 仅自己可见'}catch(e){if(site!==travelSite||version!==loadVersion)return;$('#travel-status').textContent=e.message;$('#travel-retry').hidden=false}}
function draftKey(){return 'shanhe-journal-draft-'+travelSite}
function saveDraft(){try{localStorage.setItem(draftKey(),JSON.stringify({id:journalEditing,title:$('#journal-title-input').value,body:$('#journal-body-input').value}));$('#draft-status').textContent='草稿已保存在本机，点击保存后保存至本机'}catch{$('#draft-status').textContent='请点击保存游记，将内容保存到本机'}}
function restoreDraft(){clearUnsavedFields('#journal-form');journalEditing=null;$('#journal-form').reset();$('#draft-status').textContent='点击保存游记后保存至本机';try{const d=JSON.parse(localStorage.getItem(draftKey())||'null');if(d){journalEditing=d.id||null;$('#journal-title-input').value=d.title||'';$('#journal-body-input').value=d.body||'';$('#draft-status').textContent='已恢复本机草稿，点击保存后保存至本机'}}catch{}}
$('#journal-title-input').oninput=saveDraft;$('#journal-body-input').oninput=saveDraft;
function clearPreviews(){previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];$('#photo-preview').innerHTML=''}
function renderTravelHeading(id){const x=DATA.items.find(x=>x.id===id),p=displayPhoto(id);if(!x||!p)return;$('#travel-heading').innerHTML=`<div class="travel-cover-block"><img class="travel-cover" src="${esc(p.url)}" alt="${esc(p.caption||x.name)}">${coverTools(id)}</div><div><p class="eyebrow">${esc(x.type)} · ${esc(x.provinces.join(' / '))}</p><h2 id="travel-title" tabindex="-1">${esc(x.name)}</h2><p>${esc(INTROS[id]||'')}</p>${p.custom?'<p class="cover-personal-note">我的照片 · 保存在本机</p>':`<a href="${esc(p.source)}" target="_blank" rel="noopener">封面来源：UNESCO 世界遗产中心 ↗</a>`}</div>`}
function isTravelPageOpen(){return !travelPage.hidden}
function openTravelSite(id){
 const site=DATA.items.find(item=>item.id===id);
 if(!site)return;
 if(activeAppPage!=='heritage'&&!showAppPage('heritage',{top:true})){
  history.replaceState(null,'',location.pathname+location.search);
  return;
 }
 if(!isTravelPageOpen())appPageScroll.heritage=$('main').scrollTop;
 if(travelSite!==id){
  travelSite=id;
  travelEntries=[];
  $('#comment-form').reset();
  $('#photo-form').reset();
  clearPreviews();
  restoreDraft();
  renderTravelEntries();
 }
 renderTravelHeading(id);
 switchTravelTab('comment');
 $('#heritage-page').hidden=true;
 travelPage.hidden=false;
 document.title=site.name+' · 山河足迹';
 $('#travel-title')?.focus({preventScroll:true});
 $('main').scrollTo({top:0,behavior:'instant'});
 loadTravelEntries();
}
document.addEventListener('click',e=>{const a=e.target.closest('[data-detail]');if(a){e.preventDefault();const id=a.dataset.detail;if(location.hash==='#site='+id)openTravelSite(id);else location.hash='site='+id}});
function readTravelHash(){
 const match=location.hash.match(/^#site=(\d+)$/);
 if(match)openTravelSite(match[1]);
 else if(isTravelPageOpen())showAppPage('heritage');
}
window.addEventListener('hashchange',readTravelHash);
$('#travel-close').onclick=()=>{
 const id=travelSite;
 if(showAppPage('heritage'))$('#results').querySelector('[data-detail="'+id+'"]')?.focus({preventScroll:true});
};
$('#travel-retry').onclick=loadTravelEntries;
async function submitTravelForm(form,task){const buttons=form.querySelectorAll('button,input,textarea');buttons.forEach(b=>b.disabled=true);try{await task()}catch(e){$('#travel-status').textContent=e.message;toast(e.message)}finally{buttons.forEach(b=>b.disabled=false)}}
$('#comment-form').onsubmit=e=>{e.preventDefault();const site=travelSite,body=$('#comment-body').value.trim();if(!body)return;submitTravelForm(e.target,async()=>{await travelApi('?site='+site,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'comment',body})});if(travelSite===site){$('#comment-form').reset();await loadTravelEntries()}toast('评论已保存')})};
$('#journal-form').onsubmit=e=>{e.preventDefault();const site=travelSite,id=journalEditing,title=$('#journal-title-input').value.trim(),body=$('#journal-body-input').value.trim();if(!body)return;submitTravelForm(e.target,async()=>{const data=await travelApi('?site='+site,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,kind:'journal',title,body})});if(travelSite===site){journalEditing=data.id;try{localStorage.removeItem(draftKey())}catch{}$('#draft-status').textContent='游记已保存到本机';clearUnsavedFields('#journal-form');await loadTravelEntries()}toast('游记已保存')})};
function canSwitchJournal(){
 const fields=['#journal-title-input','#journal-body-input'].filter(selector=>$(selector).value.trim());
 if(!fields.length||$('#draft-status').textContent==='游记已保存到本机')return true;
 highlightUnsavedFields(fields);
 toast('请先保存框中的游记');
 return false;
}
$('#new-journal').onclick=()=>{if(!canSwitchJournal())return;journalEditing=null;$('#journal-form').reset();saveDraft();$('#journal-title-input').focus()};
$('#journal-list').onclick=e=>{const b=e.target.closest('[data-edit-journal]');if(!b)return;if(!canSwitchJournal())return;const x=travelEntries.find(x=>x.id===b.dataset.editJournal);if(!x)return;journalEditing=x.id;$('#journal-title-input').value=x.title;$('#journal-body-input').value=x.body;saveDraft();$('#journal-title-input').focus()};
$('#travel-files').onchange=e=>{clearPreviews();const files=[...e.target.files];if(files.length>6||files.some(f=>f.size>8*1024*1024||!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(f.type))){$('#upload-status').textContent='请选择最多6张照片，每张8MB以内，格式为 JPG、PNG、WebP 或 HEIC。';e.target.value='';return}$('#upload-status').textContent='';$('#photo-preview').innerHTML=files.map(f=>{const url=URL.createObjectURL(f);previewUrls.push(url);return `<img src="${url}" alt="待上传照片预览">`}).join('')};
$('#photo-form').onsubmit=e=>{e.preventDefault();const site=travelSite,files=[...$('#travel-files').files],caption=$('#photo-caption-input').value.trim();if(!files.length)return;submitTravelForm(e.target,async()=>{let n=0;for(const file of files){$('#upload-status').textContent=`正在上传 ${n+1} / ${files.length}…`;const data=new FormData();data.append('photo',file);data.append('caption',caption);try{await travelApi('/upload?site='+site,{method:'POST',body:data});n++}catch(error){if(travelSite===site){$('#travel-files').value='';clearPreviews();await loadTravelEntries();$('#upload-status').textContent=`已上传 ${n} 张；未上传的照片请重新选择。`}throw error}}if(travelSite===site){$('#photo-form').reset();clearPreviews();$('#upload-status').textContent=`${n} 张照片已保存到本机`;await loadTravelEntries()}toast('照片上传完成')})};
$('#travel-gallery').onclick=e=>{const b=e.target.closest('[data-user-photo]');if(!b)return;const p=travelEntries.find(x=>x.id===b.dataset.userPhoto);if(!p)return;photoCoverSite=null;$('#photo-cover-tools').innerHTML='';$('#photo-title').textContent='我的旅行照片';$('#photo-full').src=p.url;$('#photo-full').alt=p.body||'我的旅行照片';$('#photo-caption').textContent=travelDate(p.createdAt);$('#photo-intro').textContent=p.body;$('#photo-credit').textContent='我的原图 ↗';$('#photo-credit').href=p.url;$('#photo-dialog .photo-note').textContent='照片来自你的私人旅行相册。';$('#photo-dialog').showModal()};
