import { createClient } from '@supabase/supabase-js';
import puppet1 from './puppets/puppet-1.svg';
import puppet2 from './puppets/puppet-2.svg';
import './puppets.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let students=[],selections=[],loaded=false,profile=null,mainNavigation={};
const app=()=>document.querySelector('#app');
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);

async function loadStudents(){const {data}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');students=data||[];loaded=true}
async function loadProfile(){const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle();return data?.active?data:null}
function captureNavigation(){mainNavigation={};document.querySelectorAll('.main-nav .nav-item').forEach(b=>{const page=b.dataset.page;if(page&&typeof b.onclick==='function')mainNavigation[page]=b.onclick;if(b.classList.contains('tasks-nav')&&typeof b.onclick==='function')mainNavigation.tasks=b.onclick});}
function choose(){selections=students.length<2?students.map(s=>s.id):shuffle(students).slice(0,2).map(s=>s.id)}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog niemand gekozen'}
function nav(){const name=profile?.display_name||'Welkom';return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie mag er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item" data-puppet-page="calendar"><span>📅</span><small>Maandkalender</small></button><button class="nav-item" data-puppet-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item" data-puppet-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-puppet-page="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-puppet-page="tasks"><span>🎲</span><small>Klastaken</small></button><button class="nav-item active"><span>🧸</span><small>Klaspoppen</small></button></nav><div class="account">${name} <button id="puppets-logout">Uitloggen</button></div></header>`}
export async function showPuppets(){
 profile=await loadProfile();
 if(!profile){window.location.reload();return}
 if(!loaded)await loadStudents();
 choose();
 app().innerHTML=`<main class="page puppets-page">${nav()}<section class="puppets-card"><div class="puppets-title"><h2>Wie mag er vandaag?</h2><p>Elke klaspop kiest een ander kindje.</p></div><div class="puppet-grid"><article class="puppet-card"><img src="${puppet1}" alt="Klaspop 1"><h3>${studentName(selections[0])}</h3></article><article class="puppet-card"><img src="${puppet2}" alt="Klaspop 2"><h3>${studentName(selections[1])}</h3></article></div>${students.length>=2?'<button class="puppet-roll" id="puppet-roll">🎲 Opnieuw kiezen</button>':`<p class="puppet-warning">Voeg minstens twee actieve kinderen toe bij Klastaken om te kunnen kiezen.</p>`}</section></main>`;
 document.querySelector('#puppets-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('[data-puppet-page]').forEach(b=>b.onclick=()=>{const fn=mainNavigation[b.dataset.puppetPage];if(typeof fn==='function')fn(new Event('click'))});
 document.querySelector('[data-puppet-page="tasks"]').onclick=()=>{if(typeof mainNavigation.tasks==='function')mainNavigation.tasks(new Event('click'));else document.querySelector('.tasks-nav')?.click()};
 document.querySelector('#puppet-roll')?.addEventListener('click',()=>showPuppets());
}
function openFromMain(){captureNavigation();showPuppets()}
function enhanceNavigation(){document.querySelectorAll('.main-nav').forEach(navEl=>{if(navEl.querySelector('[data-puppets-nav]'))return;const b=document.createElement('button');b.className='nav-item puppets-nav';b.dataset.puppetsNav='true';b.innerHTML='<span>🧸</span><small>Klaspoppen</small>';b.onclick=openFromMain;navEl.appendChild(b);});document.querySelectorAll('.main-nav .nav-item small').forEach(s=>{if(s.textContent.trim()==='Kalender')s.textContent='Maandkalender'})}
const observer=new MutationObserver(enhanceNavigation);observer.observe(document.body,{childList:true,subtree:true});enhanceNavigation();
