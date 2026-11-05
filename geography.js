// Explicit district locations supplement municipality-wide labels in the heritage catalogue.
const SITE_DISTRICTS={
 '1714':{北京:['东城区','西城区']},'439':{北京:['东城区']},'1004':{北京:['昌平区']},
 '449':{北京:['房山区']},'880':{北京:['海淀区']},'881':{北京:['东城区']},
 '438':{北京:['延庆区']},'1443':{北京:['通州区']},
 '912':{重庆:['大足区']},'1248':{重庆:['武隆区','南川区']},'1110':{澳门:['澳门半岛']}
};
function siteSubdivisions(site,province){return SITE_DISTRICTS[site.id]?.[province]||(site.cities||[]).filter(city=>(DIVISIONS[province]||[]).includes(city))}
function matchesSubdivision(site,province,subdivision){return !subdivision||!!province&&site.provinces.includes(province)&&siteSubdivisions(site,province).includes(subdivision)}
