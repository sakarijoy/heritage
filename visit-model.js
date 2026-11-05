// Optional notes are separate from the independent province/city checkboxes.
const VisitDetails=(()=>{
 function place(key){if(typeof key!=='string')return null;const [province,city,...extra]=key.split('|');if(extra.length||!Object.hasOwn(DIVISIONS,province))return null;if(city!==undefined&&!DIVISIONS[province].includes(city))return null;return {province,city:city||'',name:city||province}}
 function validDate(date){if(date==='')return true;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const value=new Date(date+'T00:00:00Z');return Number.isFinite(value.getTime())&&value.getUTCFullYear()>0&&value.toISOString().slice(0,10)===date}
 function validEntry(key,value){return !!place(key)&&!!value&&typeof value==='object'&&!Array.isArray(value)&&validDate(value.date)&&typeof value.note==='string'&&value.note.length<=500}
 function valid(map){return !!map&&typeof map==='object'&&!Array.isArray(map)&&Object.entries(map).every(([key,value])=>validEntry(key,value))}
 function clean(map){if(!map||typeof map!=='object'||Array.isArray(map))return {};return Object.fromEntries(Object.entries(map).filter(([key,value])=>validEntry(key,value)).map(([key,value])=>[key,{date:value.date,note:value.note}]))}
 return {place,validDate,valid,clean};
})();
