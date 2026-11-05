// Optional notes are separate from the independent province/city checkboxes.
const VisitDetails=(()=>{
 function place(key){if(typeof key!=='string')return null;const [province,city,...extra]=key.split('|');if(extra.length||!Object.hasOwn(DIVISIONS,province))return null;if(city!==undefined&&!DIVISIONS[province].includes(city))return null;return {province,city:city||'',name:city||province}}
 function hasHeritage(key){const location=place(key);return !!location&&DATA.items.some(item=>item.provinces.includes(location.province)&&(!location.city||item.cities?.includes(location.city)))}
 function validDate(date){if(date==='')return true;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const value=new Date(date+'T00:00:00Z');return Number.isFinite(value.getTime())&&value.getUTCFullYear()>0&&value.toISOString().slice(0,10)===date}
 function validEntry(key,value){return !!place(key)&&!!value&&typeof value==='object'&&!Array.isArray(value)&&(value.date===undefined?Array.isArray(value.dates):validDate(value.date))&&(value.dates===undefined||Array.isArray(value.dates)&&value.dates.every(date=>date!==''&&validDate(date))&&new Set(value.dates).size===value.dates.length)&&typeof value.note==='string'&&value.note.length<=500}
 function dates(value){return [...new Set(Array.isArray(value?.dates)?value.dates:value?.date?[value.date]:[])].sort()}
 function normalize(value){const all=dates(value);return {date:all[all.length-1]||'',dates:all,note:value.note}}
 function valid(map){return !!map&&typeof map==='object'&&!Array.isArray(map)&&Object.entries(map).every(([key,value])=>validEntry(key,value))}
 function clean(map){if(!map||typeof map!=='object'||Array.isArray(map))return {};return Object.fromEntries(Object.entries(map).filter(([key,value])=>validEntry(key,value)).map(([key,value])=>[key,normalize(value)]))}
 function merge(current,incoming){const result=clean(current);for(const [key,value] of Object.entries(clean(incoming)))result[key]=normalize({dates:[...new Set([...dates(result[key]),...dates(value)])],note:value.note});return result}
 return {place,hasHeritage,validDate,valid,clean,dates,normalize,merge};
})();
