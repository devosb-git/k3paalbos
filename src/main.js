import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const icons = [
  ['🦊','Vosje'],['☀️','Zon'],['🌧️','Regen'],['☁️','Wolk'],['🌈','Regenboog'],['🌳','Buiten'],['🍎','Fruit'],['📚','Lezen'],['🎨','Knutselen'],['🎵','Muziek'],['🏃','Bewegen'],['🍽️','Eten'],['🚌','Bus'],['🎉','Feest'],['📖','Bib'],['🚌','Uitstap'],['🤸','Turnen'],['🏊','Zwemmen'],['⭐','Speciale act.'],['🎂','Verjaardag']
].map(([icon,label])=>({icon,label}));
const months=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const weekdays=['ma','di','wo','do','vr','za','zo'];
const now=new Date(); let viewDate=new Date(now.getFullYear(),now.getMonth(),1); let items=[]; let profile=null; let draggedIcon=null;
const app=document.querySelector('#app');
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const firstMonday=d=>d.getDay()===0?6:d.getDay()-1;
const daysIn=d=>new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
const today=d=>key(d)===key(now);

function login(message=''){
 app.innerHTML=`<main class="login-page"><section class="login-card"><div class="login-fox">🦊</div><h1>De Vosjeskalender</h1><p>Welkom! Log in om de kalender te bekijken.</p><form id="login"><label>E-mailadres<input id="email" type="email" autocomplete="username" required placeholder="juf@school.be"></label><label>Wachtwoord<input id="password" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">🦊 Inloggen</button><div class="error">${message}</div></form></section></main>`;
 document.querySelector('#login').onsubmit=async e=>{e.preventDefault(); const b=e.target.querySelector('button');b.disabled=true;b.textContent='Even wachten…';const {error}=await supabase.auth.signInWithPassword({email:email.value.trim(),password:password.value}); if(error)return login('E-mailadres of wachtwoord klopt niet.'); await start();};
}
async function getProfile(id){const {data,error}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',id).single();return error||!data||!data.active?null:data;}
function denied(){app.innerHTML=`<main class="login-page"><section class="login-card"><div class="login-fox">🦊</div><h1>Geen toegang</h1><p>Dit account heeft geen toegang tot de Vosjeskalender.</p><button class="primary" id="out">Uitloggen</button></section></main>`;document.querySelector('#out').onclick=()=>supabase.auth.signOut();}
async function load(){const {data,error}=await supabase.from('calendar_items').select('*').order('position');if(!error)items=data||[];}
function render(){
 const y=viewDate.getFullYear(),m=viewDate.getMonth(),canEdit=profile.role==='teacher';let cells='';for(let i=0;i<firstMonday(viewDate);i++)cells+='<div class="day empty"></div>';
 for(let d=1;d<=daysIn(viewDate);d++){const date=new Date(y,m,d),k=key(date),di=items.filter(x=>x.day===k).sort((a,b)=>a.position-b.position);cells+=`<div class="day ${today(date)?'today':''}" data-day="${k}"><div class="day-number">${d}</div><div class="day-items">${di.map(x=>`<div class="placed"><span>${x.icon}</span><small>${x.label}</small>${canEdit?`<button class="remove" data-id="${x.id}">×</button>`:''}</div>`).join('')}</div></div>`;}
 app.innerHTML=`<main class="page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjeskalender</h1><p>${canEdit?'Beheer de activiteiten':'Bekijk de activiteiten'}</p></div></div><nav class="main-nav" aria-label="Hoofdnavigatie"><button class="nav-item active"><span>📅</span><small>Kalender</small></button><button class="nav-item" disabled><span>🌤️</span><small>Weer</small></button><button class="nav-item" disabled><span>👕</span><small>Kleding</small></button></nav><div class="account">${profile.display_name||'Welkom'} <button id="logout">Uitloggen</button></div></header><section class="content">${canEdit?`<aside class="panel"><h2>Sleep een plaatje</h2><p>Sleep of tik op een icoontje en kies daarna een dag.</p><div class="icons">${icons.map((x,i)=>`<button class="icon" draggable="true" data-i="${i}"><span>${x.icon}</span><small>${x.label}</small></button>`).join('')}</div><button class="todaybtn" id="todaybtn">📅 Naar vandaag</button></aside>`:`<aside class="panel readonly"><div class="bigfox">🦊</div><h2>Welkom!</h2><p>Je kunt de kalender bekijken. Alleen de juf kan activiteiten aanpassen.</p><button class="todaybtn" id="todaybtn">📅 Naar vandaag</button></aside>`}<section class="calendar-wrap"><div class="calendar-head"><button class="nav" id="prev">‹</button><h2>${months[m]} ${y}</h2><button class="nav" id="next">›</button></div><div class="weekdays">${weekdays.map(x=>`<div>${x}</div>`).join('')}</div><div class="calendar">${cells}</div></section></section><footer>🦊 Een fijne dag begint met weten wat er komt.</footer></main>`;
 document.querySelector('#logout').onclick=()=>supabase.auth.signOut();document.querySelector('#prev').onclick=()=>{viewDate=new Date(y,m-1,1);render()};document.querySelector('#next').onclick=()=>{viewDate=new Date(y,m+1,1);render()};document.querySelector('#todaybtn').onclick=()=>{viewDate=new Date(now.getFullYear(),now.getMonth(),1);render()};
 if(!canEdit)return;
 document.querySelectorAll('.icon').forEach(b=>{b.ondragstart=()=>draggedIcon=icons[+b.dataset.i];b.onclick=()=>draggedIcon=icons[+b.dataset.i]});
 document.querySelectorAll('.day:not(.empty)').forEach(day=>{day.ondragover=e=>{e.preventDefault();day.classList.add('over')};day.ondragleave=()=>day.classList.remove('over');day.ondrop=async e=>{e.preventDefault();day.classList.remove('over');if(draggedIcon)await add(day.dataset.day,draggedIcon)};day.onclick=async()=>{if(draggedIcon){const x=draggedIcon;draggedIcon=null;await add(day.dataset.day,x)}}});
 document.querySelectorAll('.remove').forEach(b=>b.onclick=async e=>{e.stopPropagation();const {error}=await supabase.from('calendar_items').delete().eq('id',b.dataset.id);if(!error){items=items.filter(x=>x.id!==b.dataset.id);render()}});
 // Touch-friendly dragging: pointer events allow the same drag gesture on iPhone/iPad as on a mouse.
 document.querySelectorAll('.icon').forEach(b=>{b.addEventListener('pointerdown',e=>{draggedIcon=icons[+b.dataset.i];b.setPointerCapture?.(e.pointerId)});b.addEventListener('pointerup',e=>{const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.day:not(.empty)');if(el&&draggedIcon){const x=draggedIcon;draggedIcon=null;add(el.dataset.day,x)}})});
}
async function add(day,icon){const position=items.filter(x=>x.day===day).length;const {data,error}=await supabase.from('calendar_items').insert({day,icon:icon.icon,label:icon.label,position}).select().single();if(!error){items.push(data);draggedIcon=null;render()}}
async function start(){const {data:{user}}=await supabase.auth.getUser();if(!user)return login();profile=await getProfile(user.id);if(!profile)return denied();await load();render();}
supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){profile=null;items=[];login()}});
start();
