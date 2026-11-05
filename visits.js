let selectedVisitProvince=null;
const visitPhotoCounts=new Map();
function visitPhotoCountButton(key){return `<button type="button" class="visit-photo-count" data-visit-photos="${esc(key)}" aria-label="查看${esc(VisitDetails.place(key)?.name||key)}照片，相册${visitPhotoCounts.get(key)||0}张">照片 <span>${visitPhotoCounts.get(key)||0}</span></button>`}
let visitRegion='全部',visitStatus='all';
function visibleVisitProvinces(){return visitRegion==='全部'?provinces:regions[visitRegion]}
function visitTotals(list=provinces){return list.reduce((totals,province)=>{
 const children=DIVISIONS[province]||[];
 totals.provincesTotal++;
 if(state.provinces[province]===true)totals.provincesVisited++;
 totals.subdivisionsTotal+=children.length;
 totals.subdivisionsVisited+=children.filter(name=>state.subdivisions[province+'|'+name]===true).length;
 return totals;
},{provincesVisited:0,provincesTotal:0,subdivisionsVisited:0,subdivisionsTotal:0})}
function visitSummaryMarkup(){
 const local=visitTotals(visibleVisitProvinces()),all=visitTotals(),scope=visitRegion==='全部'?'全部地区':visitRegion;
 function metric(label,value,total,key){return `<div class="visit-metric"><span class="visit-metric-label">${label}</span><div class="visit-metric-number"><strong data-visit-count="${key}">${value}</strong><span> / ${total}</span></div><progress value="${value}" max="${Math.max(1,total)}" aria-label="${esc(scope+label+' '+value+' / '+total)}"></progress></div>`}
 return `<div class="visit-summary-scope"><span>${esc(scope)} · 到访统计</span><span>按勾选计数</span></div><div class="visit-metrics">${metric('已访省份',local.provincesVisited,local.provincesTotal,'provinces')}${metric('已访下级',local.subdivisionsVisited,local.subdivisionsTotal,'subdivisions')}</div>${visitRegion!=='全部'?`<p class="visit-total-note">全国累计 <b>${all.provincesVisited}</b> / ${all.provincesTotal} 省级地区 · <b>${all.subdivisionsVisited}</b> / ${all.subdivisionsTotal} 下级地区</p>`:''}<p class="visit-count-note">省份与下级分别勾选、分别计数。下级含城市、自治州及区县等。</p>`;
}
function visitMatches(checked){return visitStatus==='all'||(visitStatus==='visited'?checked:!checked)}
function visitNoteMarkup(key){const details=state.visitDetails[key];return details&&(details.date||details.note)?`<p class="visit-note-preview">${details.date?`<time>${esc(details.date)}</time>`:''}${details.note?`<span>${esc(details.note)}</span>`:''}</p>`:''}
function provinceVisitsMarkup(){
 const visible=visibleVisitProvinces().filter(province=>visitMatches(state.provinces[province]===true)||(DIVISIONS[province]||[]).some(name=>visitMatches(state.subdivisions[province+'|'+name]===true)));
 if(!visible.length)return '<div class="empty">当前地区没有符合条件的到访记录。</div>';
 return visible.map(province=>{
  const children=DIVISIONS[province]||[],count=children.filter(name=>state.subdivisions[province+'|'+name]===true).length,expanded=selectedVisitProvince===province,checked=state.provinces[province]===true;
  const shownChildren=children.filter(name=>visitMatches(state.subdivisions[province+'|'+name]===true));
  const details=expanded?`<progress class="visit-province-progress" value="${count}" max="${Math.max(1,children.length)}" aria-label="${esc(province)}下级到访 ${count} / ${children.length}"></progress>${visitNoteMarkup(province)}<div class="visit-row-actions"><button type="button" data-edit-visit="${esc(province)}">${state.visitDetails[province]?'编辑记录':'日期与备注'}</button>${visitPhotoCountButton(province)}<button type="button" data-visit-heritage="${esc(province)}">查看当地遗产 ↗</button></div><h3 class="visit-subdivision-title">下级到访 <span>${count} / ${children.length}</span></h3><div class="visit-children">${shownChildren.length?shownChildren.map(name=>{const key=province+'|'+name,checked=state.subdivisions[key]===true;return `<div class="visit-child ${checked?'is-visited':''}"><div class="visit-child-heading"><label class="visit-check"><input type="checkbox" data-subdivision="${esc(key)}" aria-label="到访过${esc(province+name)}" ${checked?'checked':''}></label><button type="button" class="visit-place-name" data-edit-visit="${esc(key)}" aria-label="编辑${esc(name)}到访记录">${esc(name)}</button></div>${visitNoteMarkup(key)}<div class="visit-row-actions"><button type="button" data-edit-visit="${esc(key)}">${state.visitDetails[key]?'编辑记录':'日期与备注'}</button>${visitPhotoCountButton(key)}<button type="button" data-visit-heritage="${esc(key)}">查看遗产 ↗</button></div></div>`}).join(''):'<p class="visit-child-empty">该省暂无符合条件的下级记录。</p>'}</div>`:'';
  return `<section class="province-visit ${checked?'is-visited':''} ${expanded?'is-expanded':''}"><div class="visit-heading"><label class="visit-check"><input type="checkbox" data-province="${esc(province)}" aria-label="到访过${esc(province)}" ${checked?'checked':''}></label><button type="button" class="visit-province-name" data-select-province="${esc(province)}" aria-expanded="${expanded}" aria-controls="province-details-${provinces.indexOf(province)}" aria-label="${expanded?'收起':'展开'}${esc(province)}详情">${esc(province)}${expanded?'<span class="visit-collapse-hint" aria-hidden="true">收起 ▴</span>':''}</button></div><div class="province-details" id="province-details-${provinces.indexOf(province)}" ${expanded?'':'hidden'}>${details}</div></section>`
 }).join('')
}
function renderVisits(){
 const summary=visitSummaryMarkup();if($('#visit-summary').innerHTML!==summary)$('#visit-summary').innerHTML=summary;
 $('#provinces').innerHTML=provinceVisitsMarkup();
 $('#visit-regions').innerHTML=['全部',...Object.keys(regions)].map(r=>`<button type="button" data-visit-region="${r}" class="${visitRegion===r?'active':''}" aria-pressed="${visitRegion===r}">${r==='全部'?'全部地区':r}</button>`).join('');
}
