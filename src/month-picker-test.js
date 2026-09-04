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
let saving=false;

function addStyles(){
  if(document.getElementById('month-picker-test-styles'))return;
  const style=document.createElement('style');
  style.id='month-picker-test-styles';
  style.textContent=`
    .content.month-popup-layout{grid-template-columns:1fr!important}
    .content.month-popup-layout>.panel{display:none!important}
    .content.month-popup-layout>.calendar-wrap{grid-column:1!important;width:100%;max-width:none!important}
    .content.month-popup-layout .day:not(.empty){cursor:pointer}
    .content.month-popup-layout .day:not(.empty):hover{box-shadow:inset 0 0 0 2px #cfe0cb}
    .content.month-popup-layout .day-items{display:flex;flex-direction:column;flex-wrap:nowrap;width:100%}
    .content.month-popup-layout .day-items .placed{width:100%;max-width:none}
    .content.month-popup-layout .day-items .placed small{flex:1;min-width:0}
    .content.month-popup-layout .day-items .placed .remove{margin-left:auto;flex:0 0 auto}
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

function openBasePicker(anchor){
  closePicker();
  const pop=document.createElement('div');
  pop.className='week-picker-popover month-activity-picker';
  pop.innerHTML='<div class="week-picker-popover-head"><strong>Kies activiteit</strong><button type="button" class="week-picker-close" aria-label="Sluiten">×</button></div><div class="week-picker-body"></div>';
  document.body.appendChild(pop);
  pop.querySelector('.week-picker-close').onclick=closePicker;
  openPopover=pop;
  requestAnimationFrame(()=>positionPicker(pop,anchor));
  return pop.querySelector('.week-picker-body');
}

async function saveActivity(day,item){
  if(saving)return;
  saving=true;
  try{
    const {count,error:countError}=await supabase
      .from('calendar_items')
      .select('id',{count:'exact',head:true})
      .eq('day',day);
    if(countError)throw countError;

    const {error}=await supabase
      .from('calendar_items')
      .insert({day,icon:item[0],label:item[1],position:count||0});
    if(error)throw error;

    closePicker();
    window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page:'calendar'}}));
  }catch(error){
    console.error('Maandactiviteit opslaan mislukt',error);
    alert('De activiteit kon niet worden opgeslagen.');
  }finally{
    saving=false;
  }
}

function renderOptions(body,anchor,day,groupIndex){
  const group=groups[groupIndex];
  body.innerHTML=`<div class="week-picker-tabs">${groups.map((g,i)=>`<button type="button" class="week-picker-tab ${i===groupIndex?'active':''}" data-group="${i}">${g.name}</button>`).join('')}</div><div class="week-picker-options">${group.items.map((item,i)=>`<button type="button" class="week-picker-option" data-item="${i}"><span class="option-icon">${activityIconMarkup(item[0],item[1])}</span><small>${item[1]}</small></button>`).join('')}</div>`;
  body.querySelectorAll('.week-picker-tab').forEach(button=>button.onclick=()=>renderOptions(body,anchor,day,+button.dataset.group));
  body.querySelectorAll('.week-picker-option').forEach(button=>button.onclick=async()=>{
    button.disabled=true;
    await saveActivity(day,group.items[+button.dataset.item]);
    if(document.body.contains(button))button.disabled=false;
  });
  requestAnimationFrame(()=>{if(openPopover)positionPicker(openPopover,anchor)});
}

function openActivityPicker(anchor,day){
  const body=openBasePicker(anchor);
  renderOptions(body,anchor,day,0);
}

function mount(){
  addStyles();
  const calendar=document.querySelector('.calendar-wrap .calendar');
  const content=calendar?.closest('.content');
  if(!calendar||!content){closePicker();return}

  const canEdit=!!content.querySelector(':scope>.panel:not(.readonly)');
  if(!canEdit)return;
  content.classList.add('month-popup-layout');

  calendar.querySelectorAll('.day:not(.empty)[data-day]').forEach(day=>{
    if(day.dataset.monthPopupReady==='1')return;
    day.dataset.monthPopupReady='1';
    day.setAttribute('aria-label',`Activiteit kiezen voor ${day.dataset.day}`);
    day.addEventListener('click',event=>{
      if(event.target.closest('.placed,.remove'))return;
      openActivityPicker(day,day.dataset.day);
    });
  });
}

const app=document.querySelector('#app');
if(app)new MutationObserver(()=>queueMicrotask(mount)).observe(app,{childList:true,subtree:true});
document.addEventListener('pointerdown',event=>{
  if(openPopover&&!openPopover.contains(event.target)&&!event.target.closest('.calendar .day:not(.empty)'))closePicker();
},true);
window.addEventListener('resize',closePicker);
window.addEventListener('scroll',event=>{if(openPopover&&!event.target.closest?.('.week-picker-popover'))closePicker()},true);
mount();
