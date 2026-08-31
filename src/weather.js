import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);

const weekDays=[
  {id:1,name:'Maandag'},
  {id:2,name:'Dinsdag'},
  {id:3,name:'Woensdag'},
  {id:4,name:'Donderdag'},
  {id:5,name:'Vrijdag'}
];

const weatherGroups=[
  {id:'sun',label:'Zon',items:[
    {id:'sunny',label:'Zon',image:new URL('./weather/sunny.svg',import.meta.url).href},
    {id:'cloudy',label:'Bewolkt',image:new URL('./weather/cloudy.svg',import.meta.url).href},
    {id:'partly-cloudy',label:'Licht bewolkt',image:new URL('./weather/partly-cloudy.svg',import.meta.url).href}
  ]},
  {id:'precipitation',label:'Neerslag',items:[
    {id:'rain',label:'Regen',image:new URL('./weather/rain.svg',import.meta.url).href},
    {id:'hail',label:'Hagel',image:new URL('./weather/hail.svg',import.meta.url).href},
    {id:'snow',label:'Sneeuw',image:new URL('./weather/snow.svg',import.meta.url).href},
    {id:'fog',label:'Mist',image:new URL('./weather/fog.svg',import.meta.url).href}
  ]},
  {id:'wind',label:'Wind',items:[
    {id:'calm',label:'Windstil',emoji:'🪶'},
    {id:'light',label:'Weinig',emoji:'🍃'},
    {id:'strong',label:'Veel',emoji:'💨'},
    {id:'very-strong',label:'Storm',emoji:'🌪️'}
  ]}
];

const storageKeyPrefix='k3paalbos-weather-week-v2';
let dragged=null;
let activeNavigate=null;
let currentState=emptyState();

function emptyState(){return {days:{},weather:{}}}
function weekStartKey(){
  const d=new Date();
  d.setHours(12,0,0,0);
  const day=d.getDay();
  d.setDate(d.getDate()+(day===0?-6:1-day));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function localStorageKey(){return `${storageKeyPrefix}-${weekStartKey()}`}
function loadLocalState(){try{return {...emptyState(),...(JSON.parse(localStorage.getItem(localStorageKey()))||{})}}catch{return emptyState()}}
function saveLocalState(state){localStorage.setItem(localStorageKey(),JSON.stringify(state))}

async function loadState(){
  const fallback=loadLocalState();
  try{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return fallback;
    const {data,error}=await supabase.from('weather_week_state').select('state').eq('week_start',weekStartKey()).maybeSingle();
    if(error){console.warn('Weerweek kon niet uit Supabase worden geladen:',error.message);return fallback}
    if(data?.state){saveLocalState(data.state);return {...emptyState(),...data.state}}
  }catch(error){console.warn('Weerweek kon niet worden geladen:',error)}
  return fallback;
}

async function saveState(state){
  currentState=state;
  saveLocalState(state);
  try{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return;
    const {error}=await supabase.from('weather_week_state').upsert({week_start:weekStartKey(),state,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'week_start'});
    if(error)console.warn('Weerweek kon niet in Supabase worden opgeslagen:',error.message);
  }catch(error){console.warn('Weerweek kon niet worden opgeslagen:',error)}
}

function itemFor(groupId,itemId){return weatherGroups.find(g=>g.id===groupId)?.items.find(i=>i.id===itemId)}
function renderIcon(item,size='large'){
  if(item.image)return `<img class="weather-picto ${size}" src="${item.image}" alt="${item.label}">`;
  return `<span class="weather-emoji ${size}">${item.emoji}</span>`;
}

function addStyles(){
  if(document.getElementById('weather-table-styles'))return;
  const style=document.createElement('style');
  style.id='weather-table-styles';
  style.textContent=`
    .weather-page{min-height:100vh}.weather-board{max-width:1500px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:24px;box-shadow:0 8px 24px #234c2712;padding:22px}.weather-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.weather-title h2{color:#285d39;font-size:30px;margin:0}.weather-title p{color:#718176;font-size:14px;margin:5px 0 0}.weather-clear{border:2px solid #e6aaaa;background:#fff;color:#b44f4f;border-radius:13px;padding:9px 13px;font-weight:bold}.weather-table-wrap{overflow-x:auto}.weather-table{display:grid;grid-template-columns:270px repeat(5,minmax(145px,1fr));min-width:995px;border:2px solid #dce9db;border-radius:18px;overflow:hidden}.weather-corner,.weather-day-cell,.weather-row-label,.weather-drop-cell{border-right:1px solid #dce9db;border-bottom:1px solid #dce9db}.weather-corner{background:#f5f9f2;padding:14px;display:flex;align-items:center;justify-content:center;color:#58705e;font-weight:bold}.weather-day-cell{min-height:78px;background:#eef8ec;padding:8px;display:flex;align-items:center;justify-content:center}.weather-day-cell.over{background:#dff0db}.weather-day-token{border:2px solid #b8d8b5;background:#fff;border-radius:13px;padding:8px 12px;display:flex;align-items:center;gap:9px;font-weight:bold;color:#284a33;touch-action:none}.weather-day-token span{width:30px;height:30px;background:#eef8ec;border-radius:8px;display:grid;place-items:center}.weather-empty-day{border:2px dashed #b7cfb4;border-radius:10px;padding:9px;color:#799080;font-size:13px}.weather-row-label{background:#fbfdf9;padding:10px;display:flex;flex-direction:column;gap:7px}.weather-row-label h3{margin:0;color:#285d39;font-size:18px}.weather-palette{display:flex;gap:6px;align-items:stretch;flex-wrap:nowrap}.weather-palette-item{border:2px solid #e1e9df;background:#fff;border-radius:12px;min-width:0;flex:1 1 0;min-height:70px;padding:5px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:none}.weather-palette-item small{font-size:9px;line-height:1.05;color:#55705f;text-align:center}.weather-picto.large{width:40px;height:40px;object-fit:contain}.weather-picto.small{width:55px;height:55px;object-fit:contain}.weather-emoji.large{font-size:30px}.weather-emoji.small{font-size:37px}.weather-drop-cell{min-height:118px;padding:8px;background:#fff;display:flex;align-items:center;justify-content:center;position:relative}.weather-drop-cell.over{background:#edf8ea;box-shadow:inset 0 0 0 3px #72ae79}.weather-placed{width:100%;height:100%;min-height:92px;border:2px solid #e1e9df;border-radius:14px;background:#fbfdf9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;position:relative}.weather-placed strong{font-size:12px;color:#45614e;text-align:center}.weather-remove{position:absolute;right:6px;top:6px;border:0;background:#fff;color:#9b7a69;width:24px;height:24px;border-radius:50%;padding:0}.weather-drop-hint{color:#8b9a90;font-size:12px;border:2px dashed #cbd9c8;border-radius:10px;padding:10px;text-align:center}.weather-day-palette-bottom{margin-top:12px;padding-top:10px;border-top:2px solid #edf2eb}.weather-day-palette-bottom h3{margin:0;color:#285d39;font-size:18px}.weather-day-palette-bottom p{color:#718176;font-size:13px;margin:3px 0 8px}.weather-day-palette-list{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:700px){.weather-board{padding:12px}.weather-title{align-items:flex-start}.weather-table{grid-template-columns:230px repeat(5,140px);min-width:930px}.weather-row-label{padding:7px}.weather-palette{gap:4px}.weather-palette-item{min-height:62px;padding:4px 2px}.weather-picto.large{width:34px;height:34px}.weather-emoji.large{font-size:27px}.weather-palette-item small{font-size:8px}}
  `;
  document.head.appendChild(style);
}

export async function showWeather(navigate){
  activeNavigate=navigate;
  currentState=await loadState();
  renderWeather();
}

function renderWeather(){
  addStyles();
  document.title='Weer | De Vosjes';
  const state=currentState;
  const oldAccount=document.querySelector('.account');
  const accountName=oldAccount?.childNodes?.[0]?.textContent?.trim()||'Welkom';

  const headerCells=weekDays.map(slot=>{
    const placed=state.days[slot.id];
    return `<div class="weather-day-cell" data-day-slot="${slot.id}">${placed?`<button class="weather-day-token" draggable="true" data-day-id="${placed.id}"><span>${placed.id}</span>${placed.name}</button>`:'<div class="weather-empty-day">Sleep dag hier</div>'}</div>`;
  }).join('');

  const rows=weatherGroups.map(group=>{
    const palette=`<div class="weather-row-label"><h3>${group.label}</h3><div class="weather-palette">${group.items.map(item=>`<button class="weather-palette-item" draggable="true" data-weather-group="${group.id}" data-weather-id="${item.id}">${renderIcon(item,'large')}<small>${item.label}</small></button>`).join('')}</div></div>`;
    const cells=weekDays.map(slot=>{
      const selected=state.weather?.[slot.id]?.[group.id];
      const item=selected?itemFor(group.id,selected):null;
      return `<div class="weather-drop-cell" data-weather-day="${slot.id}" data-weather-category="${group.id}">${item?`<div class="weather-placed">${renderIcon(item,'small')}<strong>${item.label}</strong><button class="weather-remove" data-remove-day="${slot.id}" data-remove-category="${group.id}">×</button></div>`:'<div class="weather-drop-hint">Sleep pictogram hier</div>'}</div>`;
    }).join('');
    return palette+cells;
  }).join('');

  const dayPalette=weekDays.map(day=>`<button class="weather-day-token" draggable="true" data-day-id="${day.id}"><span>${day.id}</span>${day.name}</button>`).join('');

  document.querySelector('#app').innerHTML=`<main class="page weather-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Maak samen het weer van de week.</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Maandkalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagverloop</small></button><button class="nav-item active" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item tasks-nav" data-page="tasks"><span>🎲</span><small>Klastaken</small></button></nav><div class="account">${accountName} <button id="weather-logout">Uitloggen</button></div></header><section class="weather-board"><div class="weather-title"><div><h2>Weer van de week</h2><p>Sleep eerst de weekdagen naar boven en daarna per dag een pictogram voor zon, neerslag en wind.</p></div><button class="weather-clear" id="weather-clear">🗑️ Wissen</button></div><div class="weather-table-wrap"><div class="weather-table"><div class="weather-corner">Categorie</div>${headerCells}${rows}</div></div><div class="weather-day-palette-bottom"><h3>Dagen van de week</h3><p>Sleep maandag tot vrijdag naar de vakken bovenaan de tabel.</p><div class="weather-day-palette-list">${dayPalette}</div></div></section></main>`;

  document.querySelector('#weather-logout').onclick=()=>supabase.auth.signOut();
  document.querySelectorAll('.nav-item[data-page]').forEach(button=>button.onclick=()=>activeNavigate(button.dataset.page));
  document.querySelector('#weather-clear').onclick=()=>{saveState(emptyState());renderWeather()};

  document.querySelectorAll('.weather-day-token').forEach(button=>{
    const set=()=>{dragged={type:'day',value:weekDays.find(day=>day.id===+button.dataset.dayId)}};
    button.ondragstart=set;
    button.addEventListener('pointerdown',set);
    button.addEventListener('pointerup',event=>dropDayAtPoint(event));
  });

  document.querySelectorAll('.weather-day-cell').forEach(cell=>{
    cell.ondragover=event=>{if(dragged?.type==='day'){event.preventDefault();cell.classList.add('over')}};
    cell.ondragleave=()=>cell.classList.remove('over');
    cell.ondrop=event=>{event.preventDefault();cell.classList.remove('over');if(dragged?.type==='day')placeDay(+cell.dataset.daySlot,dragged.value);dragged=null};
  });

  document.querySelectorAll('.weather-palette-item').forEach(button=>{
    const set=()=>{dragged={type:'weather',group:button.dataset.weatherGroup,item:button.dataset.weatherId}};
    button.ondragstart=set;
    button.addEventListener('pointerdown',set);
    button.addEventListener('pointerup',event=>dropWeatherAtPoint(event));
  });

  document.querySelectorAll('.weather-drop-cell').forEach(cell=>{
    cell.ondragover=event=>{if(dragged?.type==='weather'&&dragged.group===cell.dataset.weatherCategory){event.preventDefault();cell.classList.add('over')}};
    cell.ondragleave=()=>cell.classList.remove('over');
    cell.ondrop=event=>{event.preventDefault();cell.classList.remove('over');if(dragged?.type==='weather'&&dragged.group===cell.dataset.weatherCategory)placeWeather(+cell.dataset.weatherDay,cell.dataset.weatherCategory,dragged.item);dragged=null};
  });

  document.querySelectorAll('.weather-remove').forEach(button=>button.onclick=event=>{
    event.stopPropagation();
    const state=structuredClone(currentState);
    const day=button.dataset.removeDay,category=button.dataset.removeCategory;
    if(state.weather?.[day])delete state.weather[day][category];
    saveState(state);
    renderWeather();
  });
}

function placeDay(slot,day){
  if(!day)return;
  const state=structuredClone(currentState);
  Object.keys(state.days).forEach(key=>{if(state.days[key]?.id===day.id)delete state.days[key]});
  state.days[slot]=day;
  saveState(state);
  renderWeather();
}

function placeWeather(day,category,itemId){
  const state=structuredClone(currentState);
  state.weather[day]=state.weather[day]||{};
  state.weather[day][category]=itemId;
  saveState(state);
  renderWeather();
}

function dropDayAtPoint(event){
  if(dragged?.type!=='day')return;
  const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('.weather-day-cell');
  if(cell)placeDay(+cell.dataset.daySlot,dragged.value);
  dragged=null;
}

function dropWeatherAtPoint(event){
  if(dragged?.type!=='weather')return;
  const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('.weather-drop-cell');
  if(cell&&cell.dataset.weatherCategory===dragged.group)placeWeather(+cell.dataset.weatherDay,cell.dataset.weatherCategory,dragged.item);
  dragged=null;
}
