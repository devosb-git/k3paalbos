import { createClient } from '@supabase/supabase-js';
import puppet1 from './puppets/puppet-1.svg';
import puppet2 from './puppets/puppet-2.svg';
import './puppets.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let profile=null;
let students=[];
let selections=[];
let loaded=false;
const app=()=>document.querySelector('#app');
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);

async function loadStudents(){
 const {data}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');
 students=data||[];
 loaded=true;
}
function choose(){
 if(students.length<2){selections=students.map(s=>s.id);return}
 selections=shuffle(students).slice(0,2).map(s=>s.id);
}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog niemand gekozen';}
function nav(active){const name=profile?.display_name||'Welkom';return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie mag er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item ${active==='calendar'?'active':''}" data-page="calendar"><span>📅</span><small>Maandkalender</small></button><button class="nav-item ${active==='week'?'active':''}" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item ${active==='weather'?'active':''}" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item ${active==='clothing'?'active':''}" data-page="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item active" data-puppets-nav="true"><span>🧸</span><small>Klaspoppen</small></button></nav><div class="account">${name} <button id="puppets-logout">Uitloggen</button></div></header>`}
export async function showPuppets(p,navigate){
 profile=p||profile;
 if(!loaded)await loadStudents();
 choose();
 app().innerHTML=`<main class="page puppets-page">${nav('puppets')}<section class="puppets-card"><div class="puppets-title"><h2>Wie mag er vandaag?</h2><p>Elke klaspop kiest een ander kindje.</p></div><div class="puppet-grid"><article class="puppet-card"><img src="${puppet1}" alt="Klaspop 1"><h3>${studentName(selections[0])}</h3></article><article class="puppet-card"><img src="${puppet2}" alt="Klaspop 2"><h3>${studentName(selections[1])}</h3></article></div>${students.length>=2?'<button class="puppet-roll" id="puppet-roll">🎲 Opnieuw kiezen</button>':`<p class="puppet-warning">Voeg minstens twee actieve kinderen toe bij Klastaken om te kunnen kiezen.</p>`}</section></main>`;
 document.querySelector('#puppets-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
 document.querySelector('#puppet-roll')?.addEventListener('click',()=>showPuppets(profile,navigate));
 bindInjectedNavigation();
}
function bindInjectedNavigation(){
 const buttons=document.querySelectorAll('[data-puppets-nav]');
 buttons.forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>showPuppets(profile,window.__vosjesNavigate||(()=>{}));});
}
function injectNav(){
 const navEl=document.querySelector('.main-nav');
 if(!navEl||navEl.querySelector('[data-puppets-nav]'))return;
 const b=document.createElement('button');b.className='nav-item';b.dataset.puppetsNav='true';b.innerHTML='<span>🧸</span><small>Klaspoppen</small>';navEl.appendChild(b);b.onclick=()=>showPuppets(profile,window.__vosjesNavigate||(()=>{}));
}
const observer=new MutationObserver(()=>injectNav());observer.observe(document.body,{childList:true,subtree:true});
setTimeout(injectNav,0);
export function setPuppetProfile(p){profile=p}
