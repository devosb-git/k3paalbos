import { createClient } from '@supabase/supabase-js';
import { activityIconMarkup } from './activity-icon.js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);

const groups=[
  {name:'Vaak',items:[['asset:speeltijd','Speeltijd'],['asset:kring','Kring'],['📖','Voorlezen'],['🤸','Turnen'],['asset:fruit','Fruit'],['🥣','Soep'],['🎨','Knutselen'],['🎵','Muziek'],['asset:buiten','Buiten']]},
  {name:'Bewegen',items:[['asset:buiten','Buiten'],['asset:speeltijd','Speeltijd'],['🏃','Bewegen'],['🤸','Turnen'],['🏊','Zwemmen'],['🧘','Yoga'],['🏅','Sportdag']]},
  {name:'Samen',items:[['🤲','Hartje'],['❤️','Zorg'],['👥','Kleine groep'],['asset:kring','Kring'],['💬','Babbelronde'],['🗣️','Gespreksmoment']]},
  {name:'Dagritme',items:[['asset:wc','WC'],['asset:middag','Middag'],['🥣','Soep'],['asset:fruit','Fruit']]},
  {name:'Leren',items:[['asset:wiskunde','Wiskunde'],['🗣️','Taal'],['🔠','Letters'],['✏️','Schrijven'],['🔬','STEM'],['🚦','Verkeer'],['🇫🇷','Frans']]},
  {name:'Creatief',items:[['📚','Lezen'],['🎨','Knutselen'],['🎵','Muziek'],['🎲','Opvoedende spelen'],['🧩','Puzzelen'],['🎭','Toneel'],['🎬','Film'],['📖','Voorlezen'],['🗄️','Kiesbak'],['asset:bib','Bib']]},
  {name:'Op stap',items:[['🚌','Bus'],['🚶','Op stap'],['⭐','Speciale act.']]},
  {name:'Feest',items:[['🌷','Moederdag'],['💙','Vaderdag'],['🎉','Feest'],['🎄','Kerst'],['🐣','Pasen'],['asset:sinterklaas-mijter','Sinterklaas'],['asset:verjaardag','Verjaardag']]}
];

let openPopover=null;

function addStyles(){
  if(document.getElementById('day-picker-test-styles'))return;
  const style=document.createElement('style');
  style.id='day-picker-test-styles';
  style.textContent=`
    .day-calendar-content .day-sidebar{display:none!important}
    .day-slot.empty-slot{cursor:pointer}
    .day-slot.empty-slot:hover{background:#f5faf3}
    .week-picker-popover{position:fixed;z-index:9999;width:min(370px,calc(100vw - 16px));max-height:min(390px,calc(100vh - 16px));overflow:auto;background:#fff;border:2px solid #d8e7d5;border-radius:17px;box-shadow:0 14px 36px #234c2730;padding:10px}
    .week-picker-popover-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
    .week-picker-popover-head strong{color:#31593b;font-size:14px}
    .week-picker-close{width:27px;height:27px;border:0;border-radius:50%;background:#f3f6f1;color:#607768;font-size:19px;line-height:1;padding:0;cursor:pointer}
    .week-picker-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;overflow-x:visible;padding:1px 0 8px}
    .week-picker-tab{width:100%;min-width:0;border:1px solid #d8e7d5;background:#f6faf4;color:#47614f;border-radius:999px;padding:5px 4px;font-size:10px;font-weight:800;white-space:nowrap;text-align:center;cursor:pointer}
    .week-picker-tab.active{background:#e4f2e1;border-color:#a9cba6;color:#285d39}
    .week-picker-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
    .week-picker-option{border:1px solid #dfe9dc;background:#fff;border-radius:11px;min-height:68px;padding:5px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#405d49;min-width:0;cursor:pointer}
    .week-picker-option:hover{background:#f3f8f1}
    .week-picker-option .option-icon{height:36px;display:flex;align-items:center;justify-content:center;font-size:30px}
    .week-picker-option .option-icon>img{max-height:36px!important;max-width:50px!important;width:auto!important;height:auto!important;object-fit:contain}
    .week-picker-option small{font-size:9.5px;font-weight:800;line-height:1.05;text-align:center;overflow-wrap:anywhere}
  `;
  document.head.appendChild(style);
}

function closePicker(){
  openPopover?.remove();
  openPopover=null;
}

function positionPicker(pop,anchor){
  const margin=8,gap=6,rect=anchor.getBoundingClientRect();
  const width=pop.offsetWidth,height=pop.offsetHeight;
  let left=rect.left;
  if(left+width>window.innerWidth-margin)left=rect.right-width;
  left=Math.max(margin,Math.min(left,window.innerWidth-width-margin));
  let top=rect.bottom+gap;
  if(top+height>window.innerHeight-margin)top=rect.top-height-gap;
  top=Math.max(margin,Math.min(top,window.innerHeight-height-margin));
  pop.style.left=`${Math.round(left)}px`;
  pop.style.top=`${Math.round(top)}px`;
}

function openBasePicker(anchor,title){
  closePicker();
  const pop=document.createElement('div');
  pop.className='week-picker-popover day-activity-picker';
  pop.innerHTML=`<div class="week-picker-popover-head"><strong>${title}</strong><button type="button" class="week-picker-close" aria-label="Sluiten">×</button></div><div class="week-picker-body"></div>`;
  document.body.appendChild(pop);
  pop.querySelector('.week-picker-close').onclick=closePicker;
  openPopover=pop;
  requestAnimationFrame(()=>positionPicker(pop,anchor));
  return pop.querySelector('.week-picker-body');
}

async function saveActivity(slot,item){
  const {data:dayCalendar,error:calendarError}=await supabase
    .from('day_calendars')
    .select('id')
    .order('created_at')
    .limit(1)
    .single();
  if(calendarError)throw calendarError;

  const {data:existing,error:existingError}=await supabase
    .from('day_calendar_activities')
    .select('id')
    .eq('day_calendar_id',dayCalendar.id)
    .eq('slot',slot)
    .maybeSingle();
  if(existingError)throw existingError;
  if(existing)return;

  const {error}=await supabase
    .from('day_calendar_activities')
    .insert({day_calendar_id:dayCalendar.id,slot,icon:item[0],label:item[1]});
  if(error)throw error;

  closePicker();
  window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page:'day'}}));
}

function renderOptions(body,anchor,slot,groupIndex){
  const group=groups[groupIndex];
  body.innerHTML=`<div class="week-picker-tabs">${groups.map((g,i)=>`<button type="button" class="week-picker-tab ${i===groupIndex?'active':''}" data-group="${i}">${g.name}</button>`).join('')}</div><div class="week-picker-options">${group.items.map((item,i)=>`<button type="button" class="week-picker-option" data-item="${i}"><span class="option-icon">${activityIconMarkup(item[0],item[1])}</span><small>${item[1]}</small></button>`).join('')}</div>`;
  body.querySelectorAll('.week-picker-tab').forEach(button=>button.onclick=()=>renderOptions(body,anchor,slot,+button.dataset.group));
  body.querySelectorAll('.week-picker-option').forEach(button=>button.onclick=async()=>{
    button.disabled=true;
    try{await saveActivity(slot,group.items[+button.dataset.item])}
    catch(error){
      console.error('Dagactiviteit opslaan mislukt',error);
      button.disabled=false;
      alert('De activiteit kon niet worden opgeslagen.');
    }
  });
  requestAnimationFrame(()=>{if(openPopover)positionPicker(openPopover,anchor)});
}

function openActivityPicker(anchor,slot){
  const body=openBasePicker(anchor,'Kies activiteit');
  renderOptions(body,anchor,slot,0);
}

function mount(){
  addStyles();
  const canEdit=!!document.querySelector('#day-clear');
  if(!canEdit){closePicker();return}
  document.querySelectorAll('.day-slot.empty-slot[data-slot]').forEach(slot=>{
    if(slot.dataset.popupPickerReady==='1')return;
    slot.dataset.popupPickerReady='1';
    slot.setAttribute('role','button');
    slot.setAttribute('tabindex','0');
    slot.setAttribute('aria-label',`Activiteit kiezen voor vak ${Number(slot.dataset.slot)+1}`);
    slot.addEventListener('click',event=>{
      if(event.target.closest('.day-activity,.day-activity-remove'))return;
      openActivityPicker(slot,+slot.dataset.slot);
    });
    slot.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      openActivityPicker(slot,+slot.dataset.slot);
    });
  });
}

const observer=new MutationObserver(()=>queueMicrotask(mount));
const app=document.querySelector('#app');
if(app)observer.observe(app,{childList:true,subtree:true});
document.addEventListener('pointerdown',event=>{if(openPopover&&!openPopover.contains(event.target)&&!event.target.closest('.day-slot.empty-slot'))closePicker()},true);
window.addEventListener('resize',closePicker);
window.addEventListener('scroll',event=>{if(openPopover&&!event.target.closest?.('.week-picker-popover'))closePicker()},true);
mount();
