import { createClient } from '@supabase/supabase-js';
import './class-dolls.css';
import vosImage from './class-dolls/vos.png';
import pompomImage from './class-dolls/pompom.png';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const app=()=>document.querySelector('#app');
let pageActive=false;
let profile=null;
let students=[];
let current=[];
let history=[];
let rolling=false;
let statusMessage='';
let statusError=false;

const dolls=[
  {slot:1,key:'vos',name:'Vos',image:vosImage,accent:'fox'},
  {slot:2,key:'pompom',name:'Pompom',image:pompomImage,accent:'pompom'}
];

function mondayKey(){
  const d=new Date();
  const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1);
  d.setHours(12,0,0,0);
  return d.toISOString().slice(0,10);
}
function shuffle(values){
  return values.map(value=>({value,order:Math.random()})).sort((a,b)=>a.order-b.order).map(x=>x.value);
}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog te kiezen'}
function weekLabel(key){
  const start=new Date(`${key}T12:00:00`);
  const end=new Date(start);end.setDate(start.getDate()+6);
  const fmt=new Intl.DateTimeFormat('nl-BE',{day:'numeric',month:'short'});
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
async function getProfile(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle();
  return data?.active?data:null;
}
async function loadData(){
  const week=mondayKey();
  const [studentResult,currentResult,historyResult]=await Promise.all([
    supabase.from('class_students').select('id,name,active').eq('active',true).order('name'),
    supabase.from('class_puppet_assignments').select('id,week_start,puppet_slot,student_id,puppet_cycle,created_at').eq('week_start',week).order('puppet_slot'),
    supabase.from('class_puppet_assignments').select('id,week_start,puppet_slot,student_id,puppet_cycle,created_at').order('week_start',{ascending:false}).order('puppet_slot')
  ]);
  students=studentResult.data||[];
  current=currentResult.data||[];
  history=historyResult.data||[];
}
function go(page){
  pageActive=false;
  window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page}}));
}
function header(){
  const name=profile?.display_name||'Welkom';
  return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Klaspoppen op avontuur</p></div></div><nav class="main-nav"><button class="nav-item" data-dolls-go="calendar"><span>📅</span><small>Maandkalender</small></button><button class="nav-item" data-dolls-go="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item" data-dolls-go="day"><span>➡️</span><small>Dagverloop</small></button><button class="nav-item" data-dolls-go="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-dolls-go="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-dolls-go="tasks"><span>🎲</span><small>Klastaken</small></button><button class="nav-item active"><span>🧸</span><small>Klaspoppen</small></button></nav><div class="account">${name} <button id="dolls-logout">Uitloggen</button></div></header>`;
}
function currentFor(slot){return current.find(row=>row.puppet_slot===slot)}
function historyRows(){
  const weeks=[...new Set(history.map(row=>row.week_start))].slice(0,8);
  if(!weeks.length)return '<p class="dolls-empty-history">Nog geen historiek. Deze week wordt de eerste echte verdeling.</p>';
  return weeks.map(week=>{
    const rows=history.filter(row=>row.week_start===week);
    const vos=rows.find(row=>row.puppet_slot===1);
    const pompom=rows.find(row=>row.puppet_slot===2);
    return `<div class="dolls-history-row"><span class="dolls-history-week">${weekLabel(week)}</span><span><strong>Vos:</strong> ${vos?studentName(vos.student_id):'—'}</span><span><strong>Pompom:</strong> ${pompom?studentName(pompom.student_id):'—'}</span></div>`;
  }).join('');
}
function render(){
  if(!pageActive)return;
  const canEdit=profile?.role==='teacher';
  const vos=currentFor(1),pompom=currentFor(2);
  app().innerHTML=`<main class="page dolls-page">${header()}<section class="dolls-shell"><div class="dolls-heading"><span class="dolls-kicker">🧸 Elke week een nieuw avontuur</span><h2>Wie mag onze klaspoppen meenemen?</h2><p>De dobbelsteen kiest voor elke pop een ander kindje. De historiek zorgt ervoor dat iedereen per pop aan de beurt komt.</p></div><div class="dolls-stage"><article class="doll-card doll-card-fox"><div class="doll-image-wrap"><img src="${vosImage}" alt="Klaspop Vos"></div><div class="doll-label">Vos</div><div class="doll-student ${vos?'chosen':''}">${vos?studentName(vos.student_id):'Nog te kiezen'}</div></article><div class="dolls-dice-column"><div class="dice-hint">Wie mag deze week mee?</div><button class="dolls-dice ${rolling?'rolling':''}" id="roll-dolls" ${!canEdit||students.length<2||rolling?'disabled':''} aria-label="Dobbel voor de klaspoppen"><span class="dice-face">⚄</span></button><div class="dice-caption">${canEdit?'Tik op de dobbelsteen':'Alleen de juf kan dobbelen'}</div></div><article class="doll-card doll-card-pompom"><div class="doll-image-wrap"><img src="${pompomImage}" alt="Klaspop Pompom"></div><div class="doll-label">Pompom</div><div class="doll-student ${pompom?'chosen':''}">${pompom?studentName(pompom.student_id):'Nog te kiezen'}</div></article></div>${students.length<2?'<div class="dolls-warning">Voeg minstens twee actieve kleuters toe bij Klastaken.</div>':''}${statusMessage?`<div class="dolls-status ${statusError?'error':''}">${statusMessage}</div>`:''}<details class="dolls-history"><summary>📚 Historiek bekijken</summary><div class="dolls-history-list">${historyRows()}</div></details></section></main>`;
  bind(canEdit);
}
function bind(canEdit){
  document.querySelector('#dolls-logout').onclick=()=>supabase.auth.signOut();
  document.querySelectorAll('[data-dolls-go]').forEach(button=>button.onclick=()=>go(button.dataset.dollsGo));
  if(canEdit)document.querySelector('#roll-dolls')?.addEventListener('click',rollDolls);
}
function slotChoice(slot,historyWithoutCurrent,excludeId=null){
  const slotHistory=historyWithoutCurrent.filter(row=>row.puppet_slot===slot);
  const maxCycle=Math.max(1,...slotHistory.map(row=>row.puppet_cycle||1));
  let cycle=maxCycle;
  let used=new Set(slotHistory.filter(row=>(row.puppet_cycle||1)===cycle).map(row=>row.student_id));
  let available=students.filter(student=>!used.has(student.id)&&student.id!==excludeId);
  if(!available.length){
    cycle=maxCycle+1;
    used=new Set();
    available=students.filter(student=>student.id!==excludeId);
  }
  return {student:shuffle(available)[0]||null,cycle};
}
async function rollDolls(){
  if(rolling||students.length<2)return;
  const week=mondayKey();
  if(current.length){
    const again=window.confirm('Er is al een klaspoppenverdeling voor deze week. Wil je opnieuw dobbelen? De huidige namen worden vervangen.');
    if(!again)return;
  }
  rolling=true;statusMessage='';statusError=false;render();
  const historyWithoutCurrent=history.filter(row=>row.week_start!==week);
  const first=slotChoice(1,historyWithoutCurrent);
  const second=slotChoice(2,historyWithoutCurrent,first.student?.id||null);
  if(!first.student||!second.student){rolling=false;statusMessage='Er zijn niet genoeg actieve kleuters om twee verschillende namen te kiezen.';statusError=true;render();return;}
  if(current.length){
    const {error:deleteError}=await supabase.from('class_puppet_assignments').delete().eq('week_start',week);
    if(deleteError){rolling=false;statusMessage=`Opnieuw dobbelen lukt niet: ${deleteError.message}`;statusError=true;render();return;}
  }
  const rows=[
    {week_start:week,puppet_slot:1,student_id:first.student.id,puppet_cycle:first.cycle,created_by:profile?.id||null},
    {week_start:week,puppet_slot:2,student_id:second.student.id,puppet_cycle:second.cycle,created_by:profile?.id||null}
  ];
  const {error}=await supabase.from('class_puppet_assignments').insert(rows);
  if(error){rolling=false;statusMessage=`Opslaan mislukt: ${error.message}`;statusError=true;await loadData();render();return;}
  await loadData();
  rolling=false;
  statusMessage='🎉 De klaspoppen hebben hun logeeradres voor deze week gekozen!';
  render();
}

async function openDolls(){
  pageActive=true;
  profile=await getProfile();
  if(!profile)return;
  await loadData();
  render();
}

window.addEventListener('k3paalbos:dolls',()=>openDolls());
