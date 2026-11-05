const expandedVisitProvinces=new Set();
function visibleVisitProvinces(){return region==='全部'?provinces:regions[region]}
function visitTotals(list=provinces){return list.reduce((totals,province)=>{
 const children=DIVISIONS[province]||[];
 totals.provincesTotal++;
 if(state.provinces[province]===true)totals.provincesVisited++;
 totals.subdivisionsTotal+=children.length;
 totals.subdivisionsVisited+=children.filter(name=>state.subdivisions[province+'|'+name]===true).length;
 return totals;
},{provincesVisited:0,provincesTotal:0,subdivisionsVisited:0,subdivisionsTotal:0})}
function visitSummaryMarkup(){
 const local=visitTotals(visibleVisitProvinces()),all=visitTotals(),scope=region==='全部'?'全部地区':region;
 function metric(label,value,total,key){return `<div class="visit-metric"><span class="visit-metric-label">${label}</span><div class="visit-metric-number"><strong data-visit-count="${key}">${value}</strong><span> / ${total}</span></div><progress value="${value}" max="${Math.max(1,total)}" aria-label="${esc(scope+label+' '+value+' / '+total)}"></progress></div>`}
 return `<div class="visit-summary-scope"><span>${esc(scope)} · 到访统计</span><span>按勾选计数</span></div><div class="visit-metrics">${metric('已访省份',local.provincesVisited,local.provincesTotal,'provinces')}${metric('已访下级',local.subdivisionsVisited,local.subdivisionsTotal,'subdivisions')}</div>${region!=='全部'?`<p class="visit-total-note">全国累计 <b>${all.provincesVisited}</b> / ${all.provincesTotal} 省级地区 · <b>${all.subdivisionsVisited}</b> / ${all.subdivisionsTotal} 下级地区</p>`:''}<p class="visit-count-note">省份与下级分别勾选、分别计数。下级含城市、自治州及区县等。</p>`;
}
function provinceVisitsMarkup(){const visible=visibleVisitProvinces(),selected=$('#province').value;return '<p class="visit-help">点击省名筛选遗产；勾选记录到访。下级到访单独保存。</p>'+visible.map(province=>{const children=DIVISIONS[province]||[],count=children.filter(name=>state.subdivisions[province+'|'+name]===true).length,expanded=expandedVisitProvinces.has(province),active=selected===province;return `<section class="province-visit ${state.provinces[province]===true?'is-visited':''}"><div class="visit-heading"><label class="visit-check"><input type="checkbox" data-province="${esc(province)}" aria-label="到访过${esc(province)}" ${state.provinces[province]===true?'checked':''}></label><button type="button" class="visit-province-name ${active?'active':''}" data-filter-province="${esc(province)}" aria-pressed="${active}">${esc(province)}</button><button type="button" data-expand-visits="${esc(province)}" aria-expanded="${expanded}" aria-label="${expanded?'收起':'展开'}${esc(province)}下级到访记录">下级 ${count}/${children.length} ${expanded?'▴':'▾'}</button></div><progress class="visit-province-progress" value="${count}" max="${Math.max(1,children.length)}" aria-label="${esc(province)}下级到访 ${count} / ${children.length}"></progress><div class="visit-children" ${expanded?'':'hidden'}>${children.map(name=>{const key=province+'|'+name,checked=state.subdivisions[key]===true;return `<label class="${checked?'is-visited':''}"><input type="checkbox" data-subdivision="${esc(key)}" ${checked?'checked':''}>${esc(name)}</label>`}).join('')}</div></section>`}).join('')}
