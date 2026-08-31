import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const weekStorageKey='k3paalbos-weekcalendar-v2';
const extraActivities=[
  {icon:'🧱',label:'Hoekenwerk'},
  {icon:'😌',label:'Rust'},
  {icon:'❄️',label:'Winter'},
  {icon:'🍂',label:'Herfst'},
  {icon:'🌷',label:'Lente'},
  {icon:'☀️',label:'Zomer'}
];
let canEdit=false;
let extraDrag=null;

async function refreshRole(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){canEdit=false;return}
  const {data}=await supabase.from('profiles').select('role,active').eq('id',user.id).maybeSingle();
  canEdit=!!data?.active&&data.role==='teacher';
}

function rerender(page){
  window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page}}));
}

async function addMonthActivity(day,activity){
  if(!day)return;
  const {count,error:countError}=await supabase.from('calendar_items').select('id',{count:'exact',head:true}).eq('day',day);
  if(countError)throw countError;
  const {error}=await supabase.from('calendar_items').insert({day,icon:activity.icon,label:activity.label,position:count||0});
  if(error)throw error;
  rerender('calendar');
}

function readWeek(){
  try{return JSON.parse(localStorage.getItem(weekStorageKey))||{}}
  catch{return {}}
}

function addWeekActivity(slot,activity){
  const state=readWeek();
  const activities={...(state.activities||{})};
  const current=[...(activities[slot]||[])];
  const max=Number(slot)===3?4:5;
  if(current.length>=max)return;
  current.push({icon:activity.icon,label:activity.label});
  activities[slot]=current;
  localStorage.setItem(weekStorageKey,JSON.stringify({...state,activities}));
  rerender('week');
}

async function addDayActivity(slot,activity){
  const {data:calendar,error:calendarError}=await supabase.from('day_calendars').select('id').order('created_at').limit(1).single();
  if(calendarError)throw calendarError;
  const {data:existing,error:existingError}=await supabase.from('day_calendar_activities').select('id').eq('day_calendar_id',calendar.id).eq('slot',slot).maybeSingle();
  if(existingError)throw existingError;
  if(existing)return;
  const {error}=await supabase.from('day_calendar_activities').insert({day_calendar_id:calendar.id,slot,icon:activity.icon,label:activity.label});
  if(error)throw error;
  rerender('day');
}

async function dropOnTarget(target){
  if(!extraDrag||!target)return;
  const activity=extraDrag.activity;
  const page=extraDrag.page;
  extraDrag=null;
  try{
    if(page==='calendar')await addMonthActivity(target.dataset.day,activity);
    if(page==='week')addWeekActivity(+target.dataset.activityDay,activity);
    if(page==='day')await addDayActivity(+target.dataset.slot,activity);
  }catch(error){
    console.error('Extra activiteit opslaan mislukt',error);
    alert('De activiteit kon niet worden opgeslagen.');
  }
}

function targetFor(page,x,y){
  const element=document.elementFromPoint(x,y);
  if(page==='calendar')return element?.closest('.day:not(.empty)');
  if(page==='week')return element?.closest('.activity-zone');
  if(page==='day')return element?.closest('.day-slot');
  return null;
}

function bindToken(button,page,activity){
  const start=()=>{extraDrag={page,activity}};
  button.ondragstart=start;
  button.ondragend=()=>{setTimeout(()=>{extraDrag=null},0)};
  button.addEventListener('pointerdown',start);
  button.addEventListener('pointerup',event=>dropOnTarget(targetFor(page,event.clientX,event.clientY)));
}

function mountMonth(){
  const groups=document.querySelector('.content .calendar-activity-groups');
  if(groups){
    if(groups.querySelector('[data-extra-month-group]'))return;
    const details=document.createElement('details');
    details.dataset.extraMonthGroup='true';
    details.className='activity-group';
    details.innerHTML=`<summary>Extra activiteiten</summary><div class="activity-palette">${extraActivities.map((activity,index)=>`<button class="activity-token calendar-activity-token" draggable="true" data-extra-index="${index}" data-extra-calendar-activity="${activity.label}"><span>${activity.icon}</span><small>${activity.label}</small></button>`).join('')}</div>`;
    groups.appendChild(details);
    details.querySelectorAll('[data-extra-index]').forEach(button=>bindToken(button,'calendar',extraActivities[+button.dataset.extraIndex]));
    return;
  }

  const icons=document.querySelector('.content .icons');
  if(!icons||icons.querySelector('[data-extra-calendar-activity]'))return;
  extraActivities.forEach(activity=>{
    const button=document.createElement('button');
    button.className='icon';
    button.draggable=true;
    button.dataset.extraCalendarActivity=activity.label;
    button.innerHTML=`<span>${activity.icon}</span><small>${activity.label}</small>`;
    bindToken(button,'calendar',activity);
    icons.appendChild(button);
  });
}

function mountWeek(){
  const groups=document.querySelector('.week-content .activity-groups');
  if(!groups||groups.querySelector('[data-extra-week-group]'))return;
  const details=document.createElement('details');
  details.dataset.extraWeekGroup='true';
  details.className='activity-group';
  details.innerHTML=`<summary>Extra activiteiten</summary><div class="activity-palette">${extraActivities.map((activity,index)=>`<button class="activity-token" draggable="true" data-extra-index="${index}"><span>${activity.icon}</span><small>${activity.label}</small></button>`).join('')}</div>`;
  groups.appendChild(details);
  details.querySelectorAll('[data-extra-index]').forEach(button=>bindToken(button,'week',extraActivities[+button.dataset.extraIndex]));
}

function mountDay(){
  const groups=document.querySelector('.day-calendar-content .day-groups');
  if(!groups||groups.querySelector('[data-extra-day-group]'))return;
  const details=document.createElement('details');
  details.dataset.extraDayGroup='true';
  details.innerHTML=`<summary>Extra activiteiten</summary><div class="day-palette">${extraActivities.map((activity,index)=>`<button class="day-token" draggable="true" data-extra-index="${index}" data-icon="${activity.icon}" data-label="${activity.label}"><span>${activity.icon}</span><small>${activity.label}</small></button>`).join('')}</div>`;
  groups.appendChild(details);
  details.querySelectorAll('[data-extra-index]').forEach(button=>bindToken(button,'day',extraActivities[+button.dataset.extraIndex]));
}

function mount(){
  if(!canEdit)return;
  mountMonth();
  mountWeek();
  mountDay();
}

document.addEventListener('dragover',event=>{
  if(!extraDrag)return;
  const target=targetFor(extraDrag.page,event.clientX,event.clientY);
  if(target)event.preventDefault();
},true);

document.addEventListener('drop',event=>{
  if(!extraDrag)return;
  const target=targetFor(extraDrag.page,event.clientX,event.clientY);
  if(!target)return;
  event.preventDefault();
  event.stopPropagation();
  dropOnTarget(target);
},true);

const app=document.querySelector('#app');
const observer=new MutationObserver(()=>queueMicrotask(mount));
if(app)observer.observe(app,{childList:true,subtree:true});

supabase.auth.onAuthStateChange(()=>{setTimeout(async()=>{await refreshRole();mount()},0)});
await refreshRole();
mount();
