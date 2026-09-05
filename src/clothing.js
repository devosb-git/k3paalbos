import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const clothingAssets=import.meta.glob('./clothing-builder/*.png',{eager:true,query:'?url',import:'default'});
function assetUrl(filename){return clothingAssets[`./clothing-builder/${filename}`]||'';}

const buttonFiles={
  'korte-broek':'korte-broek.png','lange-broek':'lange-broek.png','zwembroek':'zwembroek.png',
  'tshirt':'t-shirt.png','trui':'trui.png','regenjas':'regenjas.png','winterjas':'winterjas.png',
  'schoenen':'gewone-schoenen.png','laarzen':'laarzen.png','zomer':'zomeraccessoires.png','winter':'winteraccessoires.png'
};
const rows=[
  {id:'pants',title:'1. Broeken',hint:'Kies eerst een broek.',options:[['korte-broek','Korte broek'],['lange-broek','Lange broek'],['zwembroek','Zwembroek']]},
  {id:'top',title:'2. Bovenkledij',hint:'Je mag meerdere laagjes boven elkaar kiezen.',options:[['tshirt','T-shirt'],['trui','Trui'],['regenjas','Regenjas'],['winterjas','Winterjas']]},
  {id:'shoes',title:'3. Schoenen',hint:'Nu mag je schoenen kiezen.',options:[['schoenen','Gewone schoenen'],['laarzen','Laarzen']]},
  {id:'accessory',title:'4. Accessoires',hint:'Kijk tot slot of je accessoires nodig hebt.',options:[['zomer','Zomeraccessoires'],['winter','Winteraccessoires']]}
];
const dayNames=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag'];
let weekDates=[];
let weekStates={};
let activeDate='';
let pendingGenderDate='';
let currentUserId=null;
let eraseConfirmResolver=null;

function emptyDay(gender=''){return {gender,pants:'',tops:[],shoes:'',accessory:''};}
function normalizeDay(row){return {gender:row.gender||'',pants:row.pants||'',tops:Array.isArray(row.tops)?row.tops:[],shoes:row.shoes||'',accessory:row.accessory||''};}
function formatDateLocal(date){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
function shortDate(dateString){const [,m,d]=dateString.split('-');return `${Number(d)}/${Number(m)}`;}
function getWeekDates(){const now=new Date();const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate());monday.setDate(monday.getDate()-((monday.getDay()+6)%7));return Array.from({length:5},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return formatDateLocal(d);});}
function currentState(){return activeDate&&weekStates[activeDate]?weekStates[activeDate]:null;}
function hasTop(state,id){return !!state?.tops?.includes(id);}
function hasAnyTop(state){return !!state?.tops?.length;}

function visibleTopKey(state){
  if(hasTop(state,'winterjas'))return 'winterjas';
  if(hasTop(state,'regenjas')&&hasTop(state,'trui')&&hasTop(state,'tshirt'))return 'tshirt-trui-regenjas';
  if(hasTop(state,'regenjas'))return 'regenjas';
  if(hasTop(state,'trui'))return 'trui';
  if(hasTop(state,'tshirt'))return 'tshirt';
  return '';
}
function fallbackVisibleTopKey(state){
  if(hasTop(state,'winterjas'))return 'winterjas';
  if(hasTop(state,'regenjas'))return 'regenjas';
  if(hasTop(state,'trui'))return 'trui';
  if(hasTop(state,'tshirt'))return 'tshirt';
  return '';
}
function buildModelKey(state,topKey){
  if(!state?.pants)return 'neutraal';
  if(state.pants==='zwembroek'){
    if(!state.shoes)return 'zwembroek';
    return state.accessory==='zomer'?'zwembroek-schoenen-zomer':'zwembroek-schoenen';
  }
  let key=state.pants;
  if(topKey)key+=`-${topKey}`;
  if(state.shoes)key+=`-${state.shoes}`;
  if(state.accessory)key+=`-${state.accessory}`;
  return key;
}
function modelSrc(gender,state){
  const preferred=`kleding-${gender}-${buildModelKey(state,visibleTopKey(state))}.png`;
  const fallback=`kleding-${gender}-${buildModelKey(state,fallbackVisibleTopKey(state))}.png`;
  return assetUrl(preferred)||assetUrl(fallback)||assetUrl(`kleding-${gender}-neutraal.png`);
}
function buttonImage(id,label){return `<img class="clothing-choice-image" src="${assetUrl(buttonFiles[id])}" alt="${label}" draggable="false">`;}

async function loadWeek(){
  weekDates=getWeekDates();
  const {data:{user}}=await supabase.auth.getUser();
  currentUserId=user?.id||null;
  const {data,error}=await supabase.from('clothing_week_days').select('clothing_date,gender,pants,tops,shoes,accessory').gte('clothing_date',weekDates[0]).lte('clothing_date',weekDates[4]).order('clothing_date');
  if(error)throw error;
  weekStates={};
  (data||[]).forEach(row=>{weekStates[row.clothing_date]=normalizeDay(row);});
  if(activeDate&&!weekStates[activeDate])activeDate='';
  if(!activeDate){activeDate=weekDates.find(date=>weekStates[date])||'';}
}
async function saveDay(date){
  const state=weekStates[date];
  if(!state?.gender)return;
  const payload={clothing_date:date,gender:state.gender,pants:state.pants,tops:state.tops,shoes:state.shoes,accessory:state.accessory,updated_at:new Date().toISOString()};
  if(currentUserId)payload.updated_by=currentUserId;
  const {error}=await supabase.from('clothing_week_days').upsert(payload,{onConflict:'clothing_date'});
  if(error)throw error;
}
function setStatus(message='',isError=false){const el=document.getElementById('clothing-status');if(!el)return;el.textContent=message;el.classList.toggle('error',!!isError);}

function weekCards(){
  return weekDates.map((date,index)=>{
    const state=weekStates[date];
    const active=date===activeDate;
    const body=state?.gender
      ? `<img class="clothing-day-figure" src="${modelSrc(state.gender,state)}" alt="${state.gender==='meisje'?'Meisje':'Jongen'}">`
      : `<button class="clothing-day-plus" type="button" data-add-day="${date}" aria-label="Figuur kiezen voor ${dayNames[index]}">+</button>`;
    return `<article class="clothing-day-card ${active?'active':''}" data-day-card="${date}"><div class="clothing-day-heading"><strong>${dayNames[index]}</strong><small>${shortDate(date)}</small></div><div class="clothing-day-body">${body}</div></article>`;
  }).join('');
}
function editorIntro(){
  if(!activeDate)return `<div class="clothing-editor-empty"><strong>Kies eerst een dag.</strong><span>Klik bovenaan op een + en kies een jongen of meisje.</span></div>`;
  const i=weekDates.indexOf(activeDate);
  const state=currentState();
  return `<div class="clothing-editor-title"><strong>${dayNames[i]||''} aankleden</strong><span>${state?.gender==='meisje'?'Meisje':'Jongen'} geselecteerd</span></div>`;
}
function rowEnabled(row,state){
  if(!state?.gender)return false;
  if(row==='pants')return true;
  if(row==='top')return !!state.pants&&state.pants!=='zwembroek';
  if(row==='shoes')return !!state.pants&&(state.pants==='zwembroek'||hasAnyTop(state));
  if(row==='accessory')return !!state.shoes;
  return false;
}
function optionAllowed(row,id,state){
  if(!rowEnabled(row,state))return false;
  if(row==='top'){
    if(state.pants==='korte-broek'&&id==='winterjas')return false;
    return state.pants==='korte-broek'||state.pants==='lange-broek';
  }
  if(row==='shoes'&&state.pants==='zwembroek')return id==='schoenen';
  if(row==='accessory'){
    if(id==='zomer')return (state.pants==='korte-broek'&&hasTop(state,'tshirt')&&!hasTop(state,'trui')&&!hasTop(state,'regenjas')&&!hasTop(state,'winterjas'))||state.pants==='zwembroek';
    if(id==='winter')return state.pants==='lange-broek'&&hasTop(state,'winterjas');
  }
  return true;
}
function rowMessage(row,state){
  if(!state?.gender)return 'Kies eerst bovenaan een dag en een figuur.';
  if(row==='top'&&state.pants==='zwembroek')return 'Bij een zwembroek ga je meteen verder naar de schoenen.';
  if(row==='top'&&!state.pants)return 'Kies eerst een broek.';
  if(row==='shoes'&&!rowEnabled('shoes',state))return state.pants?'Kies eerst minstens één kledingstuk voor bovenaan.':'Kies eerst een broek en bovenkledij.';
  if(row==='accessory'&&!state.shoes)return 'Kies eerst de schoenen.';
  if(row==='accessory'&&state.shoes&&!optionAllowed('accessory','zomer',state)&&!optionAllowed('accessory','winter',state))return 'Bij deze combinatie zijn geen extra accessoires nodig.';
  return '';
}
function renderRows(){
  const state=currentState();
  return rows.map(row=>{
    const enabled=rowEnabled(row.id,state);
    const options=row.options.map(([id,label])=>{
      const allowed=optionAllowed(row.id,id,state);
      const selected=row.id==='top'?hasTop(state,id):state?.[row.id]===id;
      return `<button type="button" class="clothing-choice ${selected?'selected':''}" data-row="${row.id}" data-value="${id}" ${allowed?'':'disabled'} aria-pressed="${selected}" aria-label="${label}">${buttonImage(id,label)}<span class="clothing-choice-check">✓</span></button>`;
    }).join('');
    return `<section class="clothing-builder-row ${enabled?'enabled':'locked'}"><div class="clothing-row-copy"><h3>${row.title}</h3><p>${rowMessage(row.id,state)||row.hint}</p></div><div class="clothing-row-options">${options}</div></section>`;
  }).join('');
}

function genderPopup(){
  return `<div class="clothing-popup-backdrop" id="clothing-gender-popup" hidden><div class="clothing-popup" role="dialog" aria-modal="true" aria-labelledby="clothing-popup-title"><button class="clothing-popup-close" id="clothing-popup-close" type="button" aria-label="Sluiten">×</button><h3 id="clothing-popup-title">Kies een figuur</h3><p>Kies wie je voor deze dag wilt aankleden.</p><div class="clothing-gender-options"><button type="button" class="clothing-gender-choice" data-gender="jongen"><img src="${assetUrl('kleding-jongen-neutraal.png')}" alt="Jongen"><span>JONGEN</span></button><button type="button" class="clothing-gender-choice" data-gender="meisje"><img src="${assetUrl('kleding-meisje-neutraal.png')}" alt="Meisje"><span>MEISJE</span></button></div></div></div>`;
}
function eraseConfirmPopup(){
  return `<div class="clothing-confirm-overlay" id="clothing-confirm-overlay" hidden><div class="clothing-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="clothing-confirm-title"><div class="clothing-confirm-icon">🧹</div><h2 id="clothing-confirm-title">Week wissen?</h2><p>Wil je alle figuren en kleding van maandag tot en met vrijdag wissen? Deze actie kan niet ongedaan worden gemaakt.</p><div class="clothing-confirm-actions"><button type="button" class="clothing-confirm-cancel" id="clothing-confirm-cancel">Annuleren</button><button type="button" class="clothing-confirm-ok" id="clothing-confirm-ok">Alles wissen</button></div></div></div>`;
}
function openGenderPopup(date){pendingGenderDate=date;const popup=document.getElementById('clothing-gender-popup');if(popup)popup.hidden=false;}
function closeGenderPopup(){pendingGenderDate='';const popup=document.getElementById('clothing-gender-popup');if(popup)popup.hidden=true;}
function askEraseConfirmation(){
  return new Promise(resolve=>{
    eraseConfirmResolver=resolve;
    const overlay=document.getElementById('clothing-confirm-overlay');
    if(overlay){overlay.hidden=false;document.body.classList.add('clothing-confirm-open');}
  });
}
function closeEraseConfirmation(result){
  const overlay=document.getElementById('clothing-confirm-overlay');
  if(overlay)overlay.hidden=true;
  document.body.classList.remove('clothing-confirm-open');
  const resolve=eraseConfirmResolver;eraseConfirmResolver=null;
  if(resolve)resolve(result);
}

function bindInteractions(){
  document.querySelectorAll('[data-add-day]').forEach(button=>button.onclick=event=>{event.stopPropagation();openGenderPopup(button.dataset.addDay);});
  document.querySelectorAll('[data-day-card]').forEach(card=>card.onclick=()=>{const date=card.dataset.dayCard;if(weekStates[date]){activeDate=date;refreshBuilder();}});
  document.querySelectorAll('.clothing-choice[data-row]').forEach(button=>button.onclick=()=>applyChoice(button.dataset.row,button.dataset.value));
  document.querySelectorAll('[data-gender]').forEach(button=>button.onclick=()=>chooseGender(button.dataset.gender));
  const close=document.getElementById('clothing-popup-close');if(close)close.onclick=closeGenderPopup;
  const popup=document.getElementById('clothing-gender-popup');if(popup)popup.onclick=e=>{if(e.target===popup)closeGenderPopup();};
}
function refreshBuilder(){
  const week=document.querySelector('.clothing-week-grid');if(week)week.innerHTML=weekCards();
  const intro=document.querySelector('.clothing-editor-head');if(intro)intro.innerHTML=editorIntro();
  const rowsBox=document.querySelector('.clothing-builder-rows');if(rowsBox)rowsBox.innerHTML=renderRows();
  bindInteractions();
}
async function chooseGender(gender){
  const date=pendingGenderDate;if(!date)return;
  weekStates[date]=emptyDay(gender);activeDate=date;closeGenderPopup();refreshBuilder();
  try{setStatus('Opslaan…');await saveDay(date);setStatus('Opgeslagen.');}catch(error){console.error(error);setStatus('Opslaan is niet gelukt.',true);}
}
function toggleTop(state,value){
  let tops=[...state.tops];
  if(tops.includes(value))tops=tops.filter(item=>item!==value);
  else{
    if(value==='regenjas')tops=tops.filter(item=>item!=='winterjas');
    if(value==='winterjas')tops=tops.filter(item=>item!=='regenjas');
    tops.push(value);
  }
  return {...state,tops,shoes:'',accessory:''};
}
async function applyChoice(row,value){
  if(!activeDate)return;
  const state=currentState();if(!optionAllowed(row,value,state))return;
  let next={...state,tops:[...state.tops]};
  if(row==='pants')next={...emptyDay(state.gender),pants:value};
  if(row==='top')next=toggleTop(state,value);
  if(row==='shoes')next={...state,tops:[...state.tops],shoes:value,accessory:''};
  if(row==='accessory')next={...state,tops:[...state.tops],accessory:state.accessory===value?'':value};
  weekStates[activeDate]=next;refreshBuilder();
  try{setStatus('Opslaan…');await saveDay(activeDate);setStatus('Opgeslagen.');}catch(error){console.error(error);setStatus('Opslaan is niet gelukt.',true);}
}
async function eraseWeek(){
  if(!(await askEraseConfirmation()))return;
  try{
    setStatus('Week wissen…');
    const {error}=await supabase.from('clothing_week_days').delete().gte('clothing_date',weekDates[0]).lte('clothing_date',weekDates[4]);
    if(error)throw error;
    weekStates={};activeDate='';refreshBuilder();setStatus('De volledige week is gewist.');
  }catch(error){console.error(error);setStatus('Wissen is niet gelukt.',true);}
}

function styles(){
  if(document.getElementById('clothing-builder-styles'))return;
  const style=document.createElement('style');style.id='clothing-builder-styles';style.textContent=`
.clothing-page{min-height:100vh}.clothing-builder-card{max-width:1500px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:24px;box-shadow:0 8px 24px #234c2712;padding:18px 22px 22px}.clothing-builder-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;text-align:left;margin:0 auto 12px}.clothing-builder-intro h2{font-size:28px;color:#285d39;margin:0}.clothing-builder-intro p{color:#718176;font-size:14px;margin:4px 0 0}.clothing-week-clear{border:2px solid #e6aaaa;background:#fff;color:#b44f4f;border-radius:13px;padding:9px 13px;font-weight:bold;cursor:pointer}.clothing-week-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:10px 0 18px}.clothing-day-card{min-height:245px;border:2px solid #e3ebe0;border-radius:18px;background:#fdf3de;overflow:hidden;cursor:pointer;transition:.14s;display:flex;flex-direction:column}.clothing-day-card:hover{transform:translateY(-2px);border-color:#bfd7ba}.clothing-day-card.active{border-color:#4f9a61;box-shadow:0 0 0 3px #d7ecd5}.clothing-day-heading{display:flex;align-items:baseline;justify-content:space-between;padding:10px 12px 5px;color:#31593b}.clothing-day-heading strong{font-size:17px}.clothing-day-heading small{color:#7f8f80}.clothing-day-body{flex:1;min-height:195px;display:grid;place-items:end center;padding:3px 8px 8px}.clothing-day-plus{width:74px;height:74px;align-self:center;border:2px dashed #b9cdb5;border-radius:50%;background:#fffaf0;color:#6f9271;font-size:48px;font-weight:300;line-height:1;cursor:pointer;margin:auto}.clothing-day-figure{display:block;width:100%;height:195px;object-fit:contain;object-position:center bottom;user-select:none;pointer-events:none}.clothing-editor-head{margin:4px 8px 8px}.clothing-editor-title,.clothing-editor-empty{display:flex;align-items:baseline;gap:10px;color:#31593b}.clothing-editor-title strong,.clothing-editor-empty strong{font-size:18px}.clothing-editor-title span,.clothing-editor-empty span{font-size:13px;color:#718176}.clothing-builder-row{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:center;padding:12px 8px;border-top:2px solid #edf2eb}.clothing-row-copy h3{margin:0;color:#31593b;font-size:20px}.clothing-row-copy p{margin:3px 0 0;color:#718176;font-size:13px;line-height:1.25}.clothing-builder-row.locked .clothing-row-copy{opacity:.65}.clothing-row-options{display:flex;justify-content:flex-start;gap:10px;flex-wrap:wrap}.clothing-choice{position:relative;width:180px;height:86px;border:2px solid #e2e9df;border-radius:15px;background:#fdf3de;padding:0;overflow:hidden;box-shadow:0 2px 5px #254d2610;transition:.12s}.clothing-choice:not(:disabled):hover{transform:translateY(-2px);border-color:#b8d7b6}.clothing-choice.selected{border-color:#4f9a61;box-shadow:0 0 0 3px #d7ecd5}.clothing-choice:disabled{opacity:.28;filter:grayscale(.35);cursor:not-allowed}.clothing-choice-image{display:block;width:100%;height:100%;object-fit:contain;user-select:none;pointer-events:none}.clothing-choice-check{display:none;position:absolute;right:6px;top:6px;width:25px;height:25px;border-radius:50%;background:#4f9a61;color:#fff;font-size:17px;font-weight:900;align-items:center;justify-content:center}.clothing-choice.selected .clothing-choice-check{display:flex}.clothing-status{min-height:20px;text-align:center;color:#66816b;font-size:13px;margin-top:8px}.clothing-status.error{color:#a84d4d}.clothing-popup-backdrop{position:fixed;inset:0;background:#24362b66;display:grid;place-items:center;z-index:1000;padding:18px}.clothing-popup-backdrop[hidden]{display:none}.clothing-popup{position:relative;width:min(620px,94vw);background:#fff;border-radius:24px;border:2px solid #dce9db;box-shadow:0 22px 70px #14271933;padding:24px}.clothing-popup h3{margin:0;color:#31593b;font-size:26px}.clothing-popup p{margin:4px 0 18px;color:#718176}.clothing-popup-close{position:absolute;right:14px;top:12px;width:38px;height:38px;border:0;border-radius:50%;background:#f3eee6;color:#6c6257;font-size:25px;cursor:pointer}.clothing-gender-options{display:grid;grid-template-columns:1fr 1fr;gap:16px}.clothing-gender-choice{border:2px solid #e2e9df;border-radius:20px;background:#fdf3de;padding:12px;cursor:pointer;color:#31593b;font-weight:900;font-size:17px}.clothing-gender-choice:hover{border-color:#77ad78;transform:translateY(-2px)}.clothing-gender-choice img{display:block;width:100%;height:250px;object-fit:contain;margin:0 auto 8px}.clothing-page .main-nav .nav-item.active{background:#e8f4e7;border-color:#cce2ca;color:#23623a}
.clothing-confirm-open{overflow:hidden}.clothing-confirm-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:rgba(48,48,39,.42);backdrop-filter:blur(3px);animation:clothing-confirm-fade-in 160ms ease-out}.clothing-confirm-overlay[hidden]{display:none}.clothing-confirm-dialog{width:min(470px,100%);padding:27px;border:2px solid #eadfce;border-radius:24px;background:#fffdf9;color:#4f493d;text-align:center;box-shadow:0 24px 70px rgba(55,45,29,.24);animation:clothing-confirm-rise 180ms ease-out}.clothing-confirm-icon{width:68px;height:68px;margin:0 auto 14px;display:grid;place-items:center;border:2px solid #f1d8b7;border-radius:20px;background:#fff3df;font-size:38px}.clothing-confirm-dialog h2{margin:0;color:#4f493d;font-size:25px}.clothing-confirm-dialog p{margin:10px auto 22px;max-width:390px;color:#766f63;font-size:15px;line-height:1.55}.clothing-confirm-actions{display:flex;justify-content:center;gap:10px}.clothing-confirm-actions button{min-height:44px;padding:10px 16px;border-radius:13px;font-weight:800;cursor:pointer}.clothing-confirm-cancel{border:2px solid #d9e5cf;background:#f4faef;color:#4f654b}.clothing-confirm-ok{border:2px solid #efc995;background:#f2a94f;color:#493019;box-shadow:0 5px 13px rgba(139,90,39,.16)}.clothing-confirm-actions button:hover,.clothing-confirm-actions button:focus-visible{transform:translateY(-1px);outline:3px solid rgba(79,154,97,.22);outline-offset:2px}@keyframes clothing-confirm-fade-in{from{opacity:0}}@keyframes clothing-confirm-rise{from{opacity:0;transform:translateY(10px) scale(.98)}}
@media(max-width:1000px){.clothing-week-grid{grid-template-columns:repeat(5,170px);overflow-x:auto;padding-bottom:8px}.clothing-day-card{min-height:220px}.clothing-day-figure{height:170px}.clothing-builder-row{grid-template-columns:1fr}.clothing-row-copy{text-align:left}.clothing-choice{width:162px;height:78px}}
@media(max-width:560px){.clothing-builder-card{padding:12px}.clothing-builder-intro{flex-direction:column}.clothing-week-grid{grid-template-columns:repeat(5,145px)}.clothing-day-card{min-height:200px}.clothing-day-figure{height:150px}.clothing-choice{width:144px;height:69px}.clothing-builder-intro h2{font-size:23px}.clothing-gender-choice img{height:190px}.clothing-confirm-dialog{padding:22px 17px}.clothing-confirm-actions{flex-direction:column-reverse}.clothing-confirm-actions button{width:100%}}
@media(prefers-reduced-motion:reduce){.clothing-confirm-overlay,.clothing-confirm-dialog{animation:none}}
`;document.head.appendChild(style);
}

export async function showClothing(navigate,profile){
  styles();document.title='Kleding | De Vosjes';const name=profile?.display_name||'Welkom';
  document.querySelector('#app').innerHTML=`<main class="page clothing-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wat trek ik aan?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagkalender</small></button></nav><div class="account">${name} <button id="clothing-logout">Uitloggen</button></div></header><section class="clothing-builder-card"><div class="clothing-builder-intro"><div><h2>Kleed de kinderen aan</h2><p>Kies voor elke schooldag een figuur en kleed die aan. Je keuzes worden automatisch bewaard.</p></div><button type="button" class="clothing-week-clear" id="clothing-week-clear">🗑️ Wissen</button></div><div class="clothing-week-grid"></div><div class="clothing-editor-head"></div><div class="clothing-builder-rows"></div><div class="clothing-status" id="clothing-status"></div></section>${genderPopup()}${eraseConfirmPopup()}</main>`;
  document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.page)));
  document.getElementById('clothing-week-clear').onclick=eraseWeek;
  document.getElementById('clothing-confirm-cancel').onclick=()=>closeEraseConfirmation(false);
  document.getElementById('clothing-confirm-ok').onclick=()=>closeEraseConfirmation(true);
  document.getElementById('clothing-confirm-overlay').onclick=e=>{if(e.target===e.currentTarget)closeEraseConfirmation(false);};
  document.getElementById('clothing-logout').onclick=async()=>{await supabase.auth.signOut();location.reload();};
  try{setStatus('Week laden…');await loadWeek();refreshBuilder();setStatus('');}catch(error){console.error(error);refreshBuilder();setStatus('De week kon niet geladen worden.',true);}
}
