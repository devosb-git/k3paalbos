import { createClient } from '@supabase/supabase-js';
import puppet1 from './puppets/puppet-1.svg';
import puppet2 from './puppets/puppet-2.svg';
import './puppets.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let profile=null,students=[],selections=[],loaded=false;
const app=()=>document.querySelector('#app');
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);

async function loadStudents(){const {data}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');students=data||[];loaded=true}
function choose(){selections=students.length<2?students.map(s=>s.id):shuffle(students).slice(0,2).map(s=>s.id)}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog niemand gekozen'}
function go(page){
 const target=document.querySelector(`.main-nav .nav-item[data-page="${page}"]:not([data-puppet-page="true"])`);
 if(target){target.click();return}
 if(typeof window.__vosjesNavigate==='function')window.__vosjesNavigate(page);
}
function nav(){const name=profile?.display_name||'Welkom';return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie mag er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item puppet-nav-item" data-page="calendar" data-puppet-page="true"><span>📅</span><small>Maandkalender</small></button><button class="nav-item puppet-nav-item" data-page="week" data-puppet-page="true"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item puppet-nav-item" data-page="weather" data-puppet-page="true"><span>🌤️</span><small>Weer</small></button><button class="nav-item puppet-nav-item" data-page="clothing" data-puppet-page="true"><span>👕</span><small>Kleding</small></button><button class="nav-item puppet-nav-item" data-puppet-tasks="true"><span>🎲</span><small>Klastaken</small></button><button class="nav-item puppet-nav-item active" data-puppets-nav="true"><span>🧸</span><small>Klaspoppen</small></button></nav><div class="account">${name} <button id="puppets-logout">Uitloggen</button></div></header>`}

export async function showPuppets(p){
 profile=p||profile;
 if(!loaded)await loadStudents();
 choose();
 app().innerHTML=`<main class="page puppets-page">${nav()}<section class="puppets-card"><div class="puppets-title"><h2>Wie mag er vandaag?</h2><p>Elke klaspop kiest een ander kindje.</p></div><div class="puppet-grid"><article class="puppet-card"><img src="${puppet1}" alt="Klaspop 1"><h3>${studentName(selections[0])}</h3></article><article class="puppet-card"><img src="${puppet2}" alt="Klaspop 2"><h3>${studentName(selections[1])}</h3></article></div>${students.length>=2?'<button class="puppet-roll" id="puppet-roll">🎲 Opnieuw kiezen</button>':`<p class="puppet-warning">Voeg minstens twee actieve kinderen toe bij Klastaken om te kunnen kiezen.</p>`}</section></main>`;
 document.querySelector('#puppets-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('.puppet-nav-item[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
 document.querySelector('[data-puppet-tasks]')?.addEventListener('click',()=>{const existing=document.querySelector('.tasks-nav,[data-task-go="tasks"]');if(existing&&existing!==document.querySelector('[data-puppet-tasks]'))existing.click();else window.__vosjesOpenTasks?.()});
 document.querySelector('#puppet-roll')?.addEventListener('click',()=>showPuppets(profile));
}

window.__vosjesShowPuppets=showPuppets;
window.__vosjesNavigate=page=>{const b=document.querySelector(`.main-nav .nav-item[data-page="${page}"]:not([data-puppet-page="true"])`);if(b)b.click()};

function enhanceNavigation(){
 document.querySelectorAll('.main-nav .nav-item small').forEach(s=>{if(s.textContent.trim()==='Kalender')s.textContent='Maandkalender'});
 document.querySelectorAll('.main-nav').forEach(nav=>{
  if(nav.querySelector('[data-puppets-nav]'))return;
  const b=document.createElement('button');b.className='nav-item puppets-nav';b.dataset.puppetsNav='true';b.innerHTML='<span>🧸</span><small>Klaspoppen</small>';nav.appendChild(b);b.onclick=()=>window.__vosjesShowPuppets?.(profile);
 });
}
const observer=new MutationObserver(enhanceNavigation);
observer.observe(document.body,{childList:true,subtree:true});
enhanceNavigation();