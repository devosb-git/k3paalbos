import { getWeekState, updateWeekState } from './week-calendar-store.js';
import { activityIconMarkup } from './activity-icon.js';

const weekDayNames=[
  {id:1,name:'Maandag',color:'green'},{id:2,name:'Dinsdag',color:'green'},
  {id:3,name:'Woensdag',color:'wednesday'},{id:4,name:'Donderdag',color:'green'},
  {id:5,name:'Vrijdag',color:'green'},{id:6,name:'Zaterdag',color:'blue'},
  {id:7,name:'Zondag',color:'blue'}
];
const weekNumbers=weekDayNames.map(day=>({id:day.id,label:String(day.id),color:day.color}));
const relativeTerms=[
  {id:'day-before-yesterday',label:'Eergisteren',arrow:'←←'},
  {id:'yesterday',label:'Gisteren',arrow:'←'},
  {id:'today',label:'Vandaag',arrow:'↑'},
  {id:'tomorrow',label:'Morgen',arrow:'→'},
  {id:'day-after-tomorrow',label:'Overmorgen',arrow:'→→'}
];
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
let mounting=false;

function addStyles(){
  if(document.getElementById('week-picker-test-styles'))return;
  const style=document.createElement('style');
  style.id='week-picker-test-styles';
  style.textContent=`
    .week-content.compact-picker-layout{grid-template-columns:1fr!important;max-width:1500px}
    .compact-picker-layout .week-sidebar{display:none!important}
    .compact-picker-layout .week-wrap{grid-column:1!important;grid-row:1!important;width:100%;overflow:visible!important}
    .compact-picker-layout .day-palette-bottom{display:none!important}
    .compact-picker-layout .week-grid{min-width:0!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:8px}
    .compact-picker-layout .week-column{min-width:0;min-height:570px}
    .compact-picker-layout .week-title{padding-bottom:10px}
    .compact-picker-layout .week-title p{font-size:13px}
    .compact-picker-layout .week-head-drop{cursor:pointer;min-height:58px!important}
    .week-picker-head-button{width:100%;height:100%;min-height:52px;border:0;border-radius:8px;background:#fff;color:#31543a;font-weight:800;padding:4px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.05}
    .week-picker-head-button.number{font-size:20px}
    .week-picker-head-button.empty{background:transparent;color:#7f9385;font-size:12px}
    .week-picker-relative{margin:7px 7px 0;min-height:48px;border:2px dashed #c7d7c4;border-radius:11px;background:#fff;color:#607768;font-weight:800;font-size:11px;padding:5px;display:flex;align-items:center;justify-content:center;text-align:center;width:calc(100% - 14px)}
    .week-picker-relative.filled{border-style:solid;background:#f2f8f0;color:#31593b}
    .week-picker-relative .arrow{font-size:16px;line-height:1;display:block;margin-bottom:2px}
    .compact-picker-layout .activity-zone{padding:7px;gap:6px;min-height:405px}
    .week-picker-slot{position:relative;width:100%;min-height:52px;border:2px dashed #cad8c7;border-radius:11px;background:#ffffffa8;color:#849389;padding:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;text-align:center;overflow:hidden}
    .week-picker-slot.filled{border-style:solid;border-color:#dce7d9;background:#fff;color:#355a40;box-shadow:0 2px 5px #254d2610}
    .week-picker-slot .activity-visual{height:31px;display:flex;align-items:center;justify-content:center}
    .week-picker-slot .activity-visual>img{max-height:31px!important;max-width:42px!important;width:auto!important;height:auto!important;object-fit:contain}
    .week-picker-slot .activity-visual>.activity-icon-emoji,.week-picker-slot .activity-visual{font-size:28px}
    .week-picker-slot .slot-label{font-size:10px;font-weight:800;line-height:1.05;white-space:normal;color:#47614f}
    .week-picker-slot .slot-plus{font-size:22px;line-height:1;color:#88a08d}
    .week-picker-remove{position:absolute;right:2px;top:2px;width:20px;height:20px;border:0;border-radius:50%;background:#fff;color:#a46d60;font-size:15px;line-height:1;padding:0;display:grid;place-items:center;box-shadow:0 1px 3px #0001}
    .week-picker-popover{position:fixed;z-index:9999;width:min(370px,calc(100vw - 16px));max-height:min(390px,calc(100vh - 16px));overflow:auto;background:#fff;border:2px solid #d8e7d5;border-radius:17px;box-shadow:0 14px 36px #234c2730;padding:10px}
    .week-picker-popover-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
    .week-picker-popover-head strong{color:#31593b;font-size:14px}
    .week-picker-close{width:27px;height:27px;border:0;border-radius:50%;background:#f3f6f1;color:#607768;font-size:19px;line-height:1;padding:0}
    .week-picker-tabs{display:flex;gap:5px;overflow-x:auto;padding:1px 0 8px;scrollbar-width:thin}
    .week-picker-tab{flex:0 0 auto;border:1px solid #d8e7d5;background:#f6faf4;color:#47614f;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;white-space:nowrap}
    .week-picker-tab.active{background:#e4f2e1;border-color:#a9cba6;color:#285d39}
    .week-picker-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
    .week-picker-option{border:1px solid #dfe9dc;background:#fff;border-radius:11px;min-height:68px;padding:5px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#405d49;min-width:0}
    .week-picker-option:hover{background:#f3f8f1}
    .week-picker-option .option-icon{height:36px;display:flex;align-items:center;justify-content:center;font-size:30px}
    .week-picker-option .option-icon>img{max-height:36px!important;max-width:50px!important;width:auto!important;height:auto!important;object-fit:contain}
    .week-picker-option small{font-size:9.5px;font-weight:800;line-height:1.05;text-align:center;overflow-wrap:anywhere}
    .week-picker-simple-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .week-picker-simple-grid.days{grid-template-columns:1fr}
    .week-picker-simple{border:1px solid #dce8d9;background:#f8fbf7;color:#34563e;border-radius:10px;padding:8px 7px;font-size:12px;font-weight:800;text-align:center}
    @media(max-width:1000px){.compact-picker-layout .week-grid{min-width:980px!important}.compact-picker-layout .week-wrap{overflow-x:auto!important}}
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
  pop.className='week-picker-popover';
  pop.innerHTML=`<div class="week-picker-popover-head"><strong>${title}</strong><button type="button" class="week-picker-close" aria-label="Sluiten">×</button></div><div class="week-picker-body"></div>`;
  document.body.appendChild(pop);
  pop.querySelector('.week-picker-close').onclick=closePicker;
  openPopover=pop;
  requestAnimationFrame(()=>positionPicker(pop,anchor));
  return {pop,body:pop.querySelector('.week-picker-body')};
}

function refreshWeek(){
  closePicker();
  window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page:'week'}}));
}

function setUniquePart(slot,kind,value){
  updateWeekState(state=>{
    const bucket=kind==='number'?'dayNumbers':'dayNames';
    const id=value.id;
    Object.keys(state[bucket]||{}).forEach(key=>{if(state[bucket][key]?.id===id)delete state[bucket][key]});
    state[bucket]=state[bucket]||{};
    state[bucket][slot]=value;
  });
  refreshWeek();
}

function openDayPartPicker(anchor,slot,kind){
  const number=kind==='number';
  const {body}=openBasePicker(anchor,number?'Kies een cijfer':'Kies een dag');
  const options=number?weekNumbers:weekDayNames;
  body.className=`week-picker-body week-picker-simple-grid ${number?'':'days'}`;
  body.innerHTML=options.map(item=>`<button type="button" class="week-picker-simple" data-id="${item.id}">${number?item.label:item.name}</button>`).join('');
  body.querySelectorAll('.week-picker-simple').forEach(button=>button.onclick=()=>setUniquePart(slot,kind,options.find(item=>item.id===+button.dataset.id)));
}

function setRelative(slot,term){
  updateWeekState(state=>{
    state.relativeDays=state.relativeDays||{};
    Object.keys(state.relativeDays).forEach(key=>{if(state.relativeDays[key]===term.id)delete state.relativeDays[key]});
    state.relativeDays[slot]=term.id;
  });
  refreshWeek();
}

function openRelativePicker(anchor,slot){
  const {body}=openBasePicker(anchor,'Kies een begrip');
  body.className='week-picker-body week-picker-simple-grid';
  body.innerHTML=relativeTerms.map(term=>`<button type="button" class="week-picker-simple" data-id="${term.id}">${term.arrow} ${term.label}</button>`).join('');
  body.querySelectorAll('.week-picker-simple').forEach(button=>button.onclick=()=>setRelative(slot,relativeTerms.find(term=>term.id===button.dataset.id)));
}

function saveActivity(slot,index,item){
  updateWeekState(state=>{
    state.activities=state.activities||{};
    const list=[...(state.activities[slot]||[])];
    if(index<list.length)list[index]={icon:item[0],label:item[1]};
    else list.push({icon:item[0],label:item[1]});
    state.activities[slot]=list;
  });
  refreshWeek();
}

function removeActivity(slot,index){
  updateWeekState(state=>{
    state.activities=state.activities||{};
    state.activities[slot]=(state.activities[slot]||[]).filter((_,i)=>i!==index);
  });
  refreshWeek();
}

function renderActivityOptions(body,slot,index,groupIndex){
  const group=groups[groupIndex];
  body.innerHTML=`<div class="week-picker-tabs">${groups.map((g,i)=>`<button type="button" class="week-picker-tab ${i===groupIndex?'active':''}" data-group="${i}">${g.name}</button>`).join('')}</div><div class="week-picker-options">${group.items.map((item,i)=>`<button type="button" class="week-picker-option" data-item="${i}"><span class="option-icon">${activityIconMarkup(item[0],item[1])}</span><small>${item[1]}</small></button>`).join('')}</div>`;
  body.querySelectorAll('.week-picker-tab').forEach(button=>button.onclick=()=>renderActivityOptions(body,slot,index,+button.dataset.group));
  body.querySelectorAll('.week-picker-option').forEach(button=>button.onclick=()=>saveActivity(slot,index,group.items[+button.dataset.item]));
  requestAnimationFrame(()=>{if(openPopover)positionPicker(openPopover,document.querySelector(`.week-picker-slot[data-slot="${slot}"][data-index="${index}"]`)||document.body)});
}

function openActivityPicker(anchor,slot,index){
  const {body}=openBasePicker(anchor,index<(getWeekState().activities?.[slot]||[]).length?'Vervang activiteit':'Kies activiteit');
  renderActivityOptions(body,slot,index,0);
  requestAnimationFrame(()=>positionPicker(openPopover,anchor));
}

function mount(){
  if(mounting)return;
  const wrap=document.querySelector('.week-wrap');
  const content=document.querySelector('.week-content');
  const columns=[...document.querySelectorAll('.week-column[data-slot]')];
  if(!wrap||!content||columns.length!==7||wrap.dataset.compactPicker==='1')return;
  const canEdit=!!document.querySelector('#clear-week');
  if(!canEdit)return;
  mounting=true;
  addStyles();
  wrap.dataset.compactPicker='1';
  content.classList.add('compact-picker-layout');
  const intro=wrap.querySelector('.week-title p');
  if(intro)intro.textContent='Tik op een vakje om een dag, begrip of activiteit te kiezen.';
  wrap.querySelector('.day-palette-bottom')?.remove();
  const state=getWeekState();

  columns.forEach(column=>{
    const slot=+column.dataset.slot;
    const number=state.dayNumbers?.[slot];
    const name=state.dayNames?.[slot];
    const head=column.querySelector('.week-day-head');
    const numberDrop=head?.querySelector('.week-head-drop.number');
    const nameDrop=head?.querySelector('.week-head-drop.name');
    if(numberDrop){
      numberDrop.innerHTML=`<button type="button" class="week-picker-head-button number ${number?'':'empty'}">${number?.label||'Cijfer +'}</button>`;
      numberDrop.onclick=()=>openDayPartPicker(numberDrop,slot,'number');
    }
    if(nameDrop){
      nameDrop.innerHTML=`<button type="button" class="week-picker-head-button ${name?'':'empty'}">${name?.name||'Dag +'}</button>`;
      nameDrop.onclick=()=>openDayPartPicker(nameDrop,slot,'name');
    }

    const relativeId=state.relativeDays?.[slot];
    const term=relativeTerms.find(item=>item.id===relativeId);
    const relative=document.createElement('button');
    relative.type='button';
    relative.className=`week-picker-relative ${term?'filled':''}`;
    relative.innerHTML=term?`<span><span class="arrow">${term.arrow}</span>${term.label}</span>`:'Begrip +';
    relative.onclick=()=>openRelativePicker(relative,slot);
    head?.insertAdjacentElement('afterend',relative);

    const zone=column.querySelector('.activity-zone');
    if(zone){
      const activities=state.activities?.[slot]||[];
      const max=slot===3?4:7;
      zone.innerHTML=Array.from({length:max},(_,index)=>{
        const activity=activities[index];
        if(!activity)return `<button type="button" class="week-picker-slot" data-slot="${slot}" data-index="${index}" aria-label="Activiteit kiezen"><span class="slot-plus">+</span></button>`;
        return `<div class="week-picker-slot filled" data-slot="${slot}" data-index="${index}"><button type="button" class="week-picker-slot filled" data-slot="${slot}" data-index="${index}" aria-label="${activity.label} vervangen"><span class="activity-visual">${activityIconMarkup(activity.icon,activity.label)}</span><span class="slot-label">${activity.label}</span></button><button type="button" class="week-picker-remove" data-remove-slot="${slot}" data-remove-index="${index}" aria-label="Activiteit verwijderen">×</button></div>`;
      }).join('');
      zone.querySelectorAll('.week-picker-slot[data-slot][data-index]').forEach(button=>{
        if(button.closest('.week-picker-slot.filled')&&button.classList.contains('filled')&&button.tagName!=='BUTTON')return;
        button.onclick=event=>{if(event.target.closest('.week-picker-remove'))return;openActivityPicker(button,slot,+button.dataset.index)};
      });
      zone.querySelectorAll('.week-picker-remove').forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();removeActivity(+button.dataset.removeSlot,+button.dataset.removeIndex)});
    }
  });
  mounting=false;
}

const observer=new MutationObserver(()=>queueMicrotask(mount));
const app=document.querySelector('#app');
if(app)observer.observe(app,{childList:true,subtree:true});
document.addEventListener('pointerdown',event=>{if(openPopover&&!openPopover.contains(event.target)&&!event.target.closest('.week-picker-slot,.week-head-drop,.week-picker-relative'))closePicker()},true);
window.addEventListener('resize',closePicker);
window.addEventListener('scroll',event=>{if(openPopover&&!event.target.closest?.('.week-picker-popover'))closePicker()},true);
mount();
