import { createClient } from '@supabase/supabase-js';
import puppet1 from './puppets/puppet-1.svg';
import puppet2 from './puppets/puppet-2.svg';
import './puppets.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let profile=null,students=[],selections=[],loaded=false,mainNavHandlers={};
const app=()=>document.querySelector('#app');
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
const weekStart=()=>{const d=new Date();const day=d.getDay();const diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return d.toISOString().slice(0,10)};
async function loadStudents(){const {data}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');students=data||[];loaded=true}
async function loadProfile(){const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle();return data?.active?data:null}
async function chooseFromHistory(){
 const week=weekStart();
 const {data:history}=await supabase.from('class_puppet_assignments').select('student_id,puppet_cycle,puppet_slot').order('week_start',{ascending:false}).order('puppet_slot');
 const used=new Set((history||[]).map(x=>x.student_id));
 const maxCycle=Math.max(1,...(history||[]).map(x=>x.puppet_cycle||1));
 let available=students.filter(s=>!used.has(s.id));
 let cycle=maxCycle;
 if(available.length<2){available=students;cycle=maxCycle+1}
 const picked=shuffle(available).slice(0,2);
 selections=picked.map(s=>s.id);
 if(picked.length===2){
   const rows=picked.map((s,i)=>({week_start:week,puppet_slot:i+1,student_id:s.id,puppet_cycle:cycle,created_by:profile?.id||null}));
   const {error}=await supabase.from('class_puppet_assignments').upsert(rows,{onConflict:'week_start,puppet_slot'});
   if(error)console.error('Klaspoppen opslaan mislukt',error);
 }
}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog niemand gekozen'}
function captureMainNav(){mainNavHandlers={};document.querySelectorAll('.main-nav .nav-item[data-page]').forEach(b=>{if(typeof b.onclick==='function')mainNavHandlers[b.dataset.page]=b.onclick})}
function navigateBack(page){const fn=mainNavHandlers[page];if(typeof fn==='function'){fn(new Event('click'));return}window.location.hash=page;location.reload()}
function nav(){const name=profile?.display_name||'Welkom';return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie mag er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Maandkalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item active" data-puppets-nav="true"><span>🧸</span><small>Klaspoppen</small></button></nav><div class="account">${name} <button id="puppets-logout">Uitloggen</button></div></header>`}
export async function showPuppets(p){
 captureMainNav();profile=p||profile||await loadProfile();if(!loaded)await loadStudents();await chooseFromHistory();
 app().innerHTML=`<main class="page puppets-page">${nav()}<section class="puppets-card"><div class="puppets-title"><h2>Wie mag er vandaag?</h2><p>Elke klaspop kiest een ander kindje.</p></div><div class="puppet-grid"><article class="puppet-card"><img src="${puppet1}" alt="Klaspop 1"><h3>${studentName(selections[0])}</h3></article><article class="puppet-card"><img src="${puppet2}" alt="Klaspop 2"><h3>${studentName(selections[1])}</h3></article></div>${students.length>=2?'<button class="puppet-roll" id="puppet-roll">🎲 Opnieuw kiezen</button>':`<p class="puppet-warning">Voeg minstens twee actieve kinderen toe bij Klastaken om te kunnen kiezen.</p>`}</section></main>`;
 document.querySelector('#puppets-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.onclick=()=>navigateBack(b.dataset.page));
 document.querySelector('#puppet-roll')?.addEventListener('click',()=>showPuppets(profile));
 bindPuppetButtons();
}
function bindPuppetButtons(){document.querySelectorAll('[data-puppets-nav]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>showPuppets(profile)})}
function injectNav(){const navEl=document.querySelector('.main-nav');if(!navEl)return;const calendar=navEl.querySelector('.nav-item[data-page="calendar"] small,.nav-item[data-task-go="calendar"] small');if(calendar)calendar.textContent='Maandkalender';if(navEl.querySelector('[data-puppets-nav]'))return;captureMainNav();const b=document.createElement('button');b.className='nav-item';b.dataset.puppetsNav='true';b.innerHTML='<span>🧸</span><small>Klaspoppen</small>';navEl.appendChild(b);b.onclick=()=>showPuppets(profile)}
const observer=new MutationObserver(()=>injectNav());observer.observe(document.body,{childList:true,subtree:true});setTimeout(injectNav,0);