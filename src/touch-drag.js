import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const weekStorageKey='k3paalbos-weekcalendar-v2';
let touchDrag=null;
let overElement=null;

function isTouchPointer(e){return e.pointerType==='touch'||e.pointerType==='pen'}
function clearOver(){if(overElement){overElement.classList.remove('over');overElement=null}}
function pointTarget(e,selector){return document.elementFromPoint(e.clientX,e.clientY)?.closest(selector)||null}
function readWeek(){try{return {days:{},activities:{},...(JSON.parse(localStorage.getItem(weekStorageKey))||{})}}catch{return {days:{},activities:{}}}}
function saveWeek(state){localStorage.setItem(weekStorageKey,JSON.stringify(state))}
function rerenderWeek(){document.querySelector('.nav-item[data-page="week"]')?.click()}

function startTouchDrag(e){
 if(!isTouchPointer(e)||e.button!==0)return;
 const source=e.target.closest('.icon,.day-token,.placed-day,.activity-token,.week-activity');
 if(!source||e.target.closest('.remove-week,.remove'))return;
 if(source.matches('.icon')){
   touchDrag={kind:'calendar',icon:source.querySelector('span')?.textContent||'',label:source.querySelector('small')?.textContent||''};
 }else if(source.matches('.day-token,.placed-day')){
   const id=Number(source.dataset.dayId);if(!id)return;
   const names=['','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
   const colors=['','green','green','wednesday','green','green','blue','blue'];
   touchDrag={kind:'week-day',day:{id,name:names[id],color:colors[id]}};
 }else if(source.matches('.activity-token')){
   touchDrag={kind:'week-activity',activity:{icon:source.querySelector('span')?.textContent||'',label:source.querySelector('small')?.textContent||''}};
 }else if(source.matches('.week-activity')){
   const state=readWeek(),from=Number(source.dataset.actDay),index=Number(source.dataset.actIndex),activity=(state.activities[from]||[])[index];
   if(!activity)return;
   touchDrag={kind:'week-move-activity',activity:{...activity},from,index};
 }
 if(!touchDrag)return;
 e.preventDefault();e.stopImmediatePropagation();
 source.classList.add('touch-dragging');
 touchDrag.source=source;touchDrag.pointerId=e.pointerId;
 try{source.setPointerCapture(e.pointerId)}catch{}
}

function moveTouchDrag(e){
 if(!touchDrag||e.pointerId!==touchDrag.pointerId)return;
 e.preventDefault();clearOver();
 const selector=touchDrag.kind==='calendar'?'.day:not(.empty)':touchDrag.kind==='week-day'?'.week-column':'.activity-zone';
 const target=pointTarget(e,selector);
 if(target){target.classList.add('over');overElement=target}
}

async function finishTouchDrag(e){
 if(!touchDrag||e.pointerId!==touchDrag.pointerId)return;
 e.preventDefault();e.stopImmediatePropagation();
 const drag=touchDrag;touchDrag=null;clearOver();drag.source?.classList.remove('touch-dragging');
 try{drag.source?.releasePointerCapture(e.pointerId)}catch{}

 if(drag.kind==='calendar'){
   const day=pointTarget(e,'.day:not(.empty)');if(!day)return;
   const dayKey=day.dataset.day;
   const {count}=await supabase.from('calendar_items').select('id',{count:'exact',head:true}).eq('day',dayKey);
   const {error}=await supabase.from('calendar_items').insert({day:dayKey,icon:drag.icon,label:drag.label,position:count||0});
   if(error){console.error('Touch calendar drop failed',error);alert(`Kon activiteit niet opslaan: ${error.message}`);return}
   location.reload();
   return;
 }

 if(drag.kind==='week-day'){
   const column=pointTarget(e,'.week-column');if(!column)return;
   const slot=Number(column.dataset.slot),state=readWeek();
   Object.keys(state.days).forEach(k=>{if(state.days[k]?.id===drag.day.id)delete state.days[k]});
   state.days[slot]=drag.day;saveWeek(state);rerenderWeek();return;
 }

 const zone=pointTarget(e,'.activity-zone');if(!zone)return;
 const day=Number(zone.dataset.activityDay),state=readWeek(),max=day===3?4:5;
 if(drag.kind==='week-activity'){
   if((state.activities[day]||[]).length>=max)return;
   (state.activities[day]||(state.activities[day]=[])).push(drag.activity);
 }else if(drag.kind==='week-move-activity'){
   if(day!==drag.from&&(state.activities[day]||[]).length>=max)return;
   state.activities[drag.from]=(state.activities[drag.from]||[]).filter((_,i)=>i!==drag.index);
   (state.activities[day]||(state.activities[day]=[])).push(drag.activity);
 }
 saveWeek(state);rerenderWeek();
}

function cancelTouchDrag(e){if(!touchDrag||e.pointerId!==touchDrag.pointerId)return;touchDrag.source?.classList.remove('touch-dragging');touchDrag=null;clearOver()}

document.addEventListener('pointerdown',startTouchDrag,true);
document.addEventListener('pointermove',moveTouchDrag,{capture:true,passive:false});
document.addEventListener('pointerup',finishTouchDrag,{capture:true,passive:false});
document.addEventListener('pointercancel',cancelTouchDrag,true);
