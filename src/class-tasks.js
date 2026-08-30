import { createClient } from '@supabase/supabase-js';
import './class-tasks.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const tasks=[
  ['first_in_line','🚶','Eerste in de rij'],
  ['schoolbags','🎒','Boekentassen'],
  ['jackets','🧥','Jassen'],
  ['bottles','🍼','Flessen'],
  ['mail','✉️','Briefwisseling'],
  ['wipe_table','🧽','Tafel poetsen'],
  ['sweep','🧹','Vegen'],
  ['empty_compost','🌱','Compost legen'],
  ['water_plants','🪴','Planten water geven'],
  ['update_calendar','📅','Kalender aanvullen']
].map(([key,icon,label])=>({key,icon,label}));

let navCallbacks={};
let pageActive=false;
let profile=null;
let students=[];
let currentAssignments=[];
let currentSunshine=null;
let statusMessage='';
let statusError=false;

const app=()=>document.querySelector('#app');
const mondayKey=()=>{const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()-day+1);d.setHours(12,0,0,0);return d.toISOString().slice(0,10)};
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);

async function getProfile(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle();
  return data?.active?data:null;
}

function captureNavigation(){
  navCallbacks={};
  document.querySelectorAll('.main-nav .nav-item').forEach(button=>{
    const label=button.querySelector('small')?.textContent?.trim();
    const page=button.dataset.page || ({Kalender:'calendar',Weekkalender:'week',Weer:'weather',Kleding:'clothing'})[label];
    if(page&&page!=='tasks'&&typeof button.onclick==='function')navCallbacks[page]=button.onclick;
  });
}

function go(page){
  pageActive=false;
  const fn=navCallbacks[page];
  if(fn){fn(new Event('click'));return;}
  location.reload();
}

async function loadData(){
  const week=mondayKey();
  const [{data:s},{data:a},{data:z}]=await Promise.all([
    supabase.from('class_students').select('id,name,active').eq('active',true).order('name'),
    supabase.from('class_task_assignments').select('id,week_start,task_key,slot,student_id,task_cycle').eq('week_start',week).order('task_key').order('slot'),
    supabase.from('class_week_sunshine').select('week_start,student_id,sunshine_cycle').eq('week_start',week).maybeSingle()
  ]);
  students=s||[];currentAssignments=a||[];currentSunshine=z||null;
}

function studentName(id){return students.find(s=>s.id===id)?.name||'—'}

function header(){
  const name=profile?.display_name||'Welkom';
  return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Klastaken van de week</p></div></div><nav class="main-nav"><button class="nav-item" data-task-go="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-task-go="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item" data-task-go="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-task-go="clothing"><span>👕</span><small>Kleding</small></button><button class="nav-item active"><span>🎲</span><small>Klastaken</small></button></nav><div class="account">${name} <button id="tasks-logout">Uitloggen</button></div></header>`;
}

function render(){
  if(!pageActive)return;
  const canEdit=profile?.role==='teacher';
  const assignmentMap=new Map();
  currentAssignments.forEach(a=>{if(!assignmentMap.has(a.task_key))assignmentMap.set(a.task_key,[]);assignmentMap.get(a.task_key).push(a)});
  const taskCards=tasks.map(task=>{
    const assigned=(assignmentMap.get(task.key)||[]).sort((a,b)=>a.slot-b.slot);
    return `<article class="task-card"><div class="task-icon">${task.icon}</div><div><h3>${task.label}</h3><div class="task-students">${[0,1].map(i=>assigned[i]?`<span class="student-chip">${studentName(assigned[i].student_id)}</span>`:'<span class="student-chip empty">Nog te verdelen</span>').join('')}</div></div></article>`;
  }).join('');
  const roster=students.map(s=>s.name).join('\n');
  app().innerHTML=`<main class="page tasks-page">${header()}<section class="tasks-board"><div class="tasks-title"><div><h2>🎲 Klastaken</h2><p>De dobbelsteen verdeelt elke taak eerlijk over twee kinderen.</p></div>${canEdit?'<button class="dice-button" id="roll-tasks"><span>🎲</span> Dobbelen!</button>':''}</div><section class="sunshine-card"><div class="sunshine-icon">☀️</div><div><h3>Zonnetje van de week</h3><div class="sunshine-name">${currentSunshine?studentName(currentSunshine.student_id):'Nog te kiezen'}</div></div></section><div class="tasks-grid">${taskCards}</div>${canEdit?`<details class="tasks-admin"><summary>⚙️ Beheer klastaken</summary><div class="tasks-admin-grid"><section class="admin-card"><h3>Leerlingen</h3><p>Eén naam per regel. Namen die je verwijdert worden inactief maar hun geschiedenis blijft bewaard.</p><textarea class="student-editor" id="student-editor" placeholder="Anna\nBram\n...">${roster}</textarea><div class="admin-row"><button class="admin-button" id="save-students">Leerlingen opslaan</button></div></section><section class="admin-card"><h3>Resetbeveiliging</h3><p>Stel een resetwachtwoord in. Een volledige reset wist de taakgeschiedenis en het zonnetje.</p><div class="admin-row"><input id="reset-new-password" type="password" placeholder="Nieuw resetwachtwoord"><button class="admin-button" id="set-reset-password">Wachtwoord instellen</button></div><div class="admin-row" style="margin-top:12px"><input id="reset-password" type="password" placeholder="Resetwachtwoord"><button class="danger-button" id="reset-tasks">Volledig resetten</button></div></section></div></details>`:''}${statusMessage?`<div class="tasks-status ${statusError?'tasks-error':''}">${statusMessage}</div>`:''}</section></main>`;
  bind(canEdit);
}

function bind(canEdit){
  document.querySelector('#tasks-logout').onclick=()=>supabase.auth.signOut();
  document.querySelectorAll('[data-task-go]').forEach(b=>b.onclick=()=>go(b.dataset.taskGo));
  if(!canEdit)return;
  document.querySelector('#roll-tasks').onclick=rollTasks;
  document.querySelector('#save-students').onclick=saveStudents;
  document.querySelector('#set-reset-password').onclick=setResetPassword;
  document.querySelector('#reset-tasks').onclick=resetAll;
}

async function saveStudents(){
  const names=[...new Set(document.querySelector('#student-editor').value.split(/\n+/).map(x=>x.trim()).filter(Boolean))];
  const {data:all,error}=await supabase.from('class_students').select('id,name,active');
  if(error)return showStatus(error.message,true);
  const lower=new Map((all||[]).map(s=>[s.name.toLocaleLowerCase('nl'),s]));
  for(const s of all||[]){if(s.active&&!names.some(n=>n.toLocaleLowerCase('nl')===s.name.toLocaleLowerCase('nl')))await supabase.from('class_students').update({active:false}).eq('id',s.id)}
  for(const name of names){const existing=lower.get(name.toLocaleLowerCase('nl'));if(existing){if(!existing.active)await supabase.from('class_students').update({active:true,name}).eq('id',existing.id)}else await supabase.from('class_students').insert({name,active:true})}
  await loadData();showStatus('Leerlingenlijst opgeslagen.');
}

function showStatus(message,error=false){statusMessage=message;statusError=error;render()}

async function rollTasks(){
  if(students.length<2)return showStatus('Voeg eerst minstens twee leerlingen toe.',true);
  const button=document.querySelector('#roll-tasks');button.disabled=true;button.classList.add('rolling');
  statusMessage='De dobbelsteen rolt…';statusError=false;render();
  await new Promise(r=>setTimeout(r,850));
  const week=mondayKey();
  if(currentAssignments.length||currentSunshine){
    if(!confirm('Er bestaat al een verdeling voor deze week. Opnieuw dobbelen? De huidige week wordt vervangen.')){await loadData();return showStatus('De bestaande verdeling bleef behouden.');}
    await supabase.from('class_task_assignments').delete().eq('week_start',week);
    await supabase.from('class_week_sunshine').delete().eq('week_start',week);
  }
  const {data:history,error}=await supabase.from('class_task_assignments').select('task_key,student_id,task_cycle,week_start');
  if(error)return showStatus(error.message,true);
  const newRows=[];
  const weekLoad=new Map(students.map(s=>[s.id,0]));
  for(const task of tasks){
    const taskHistory=(history||[]).filter(h=>h.task_key===task.key);
    let cycle=Math.max(1,...taskHistory.map(h=>h.task_cycle||1));
    let used=new Set(taskHistory.filter(h=>(h.task_cycle||1)===cycle).map(h=>h.student_id));
    if(used.size>=students.length){cycle++;used=new Set()}
    const picks=[];
    while(picks.length<2){
      let candidates=students.filter(s=>!picks.includes(s.id)&&!used.has(s.id));
      if(!candidates.length){cycle++;used=new Set();candidates=students.filter(s=>!picks.includes(s.id))}
      candidates=shuffle(candidates).sort((a,b)=>(weekLoad.get(a.id)||0)-(weekLoad.get(b.id)||0));
      const chosen=candidates[0];
      if(!chosen)break;
      picks.push(chosen.id);used.add(chosen.id);weekLoad.set(chosen.id,(weekLoad.get(chosen.id)||0)+1);
      newRows.push({week_start:week,task_key:task.key,slot:picks.length,student_id:chosen.id,task_cycle:cycle,created_by:profile.id});
    }
  }
  const {data:sunHistory}=await supabase.from('class_week_sunshine').select('student_id,sunshine_cycle');
  let sunCycle=Math.max(1,...(sunHistory||[]).map(x=>x.sunshine_cycle||1));
  let sunUsed=new Set((sunHistory||[]).filter(x=>(x.sunshine_cycle||1)===sunCycle).map(x=>x.student_id));
  if(sunUsed.size>=students.length){sunCycle++;sunUsed=new Set()}
  const sunshine=shuffle(students.filter(s=>!sunUsed.has(s.id)))[0]||shuffle(students)[0];
  const {error:insertError}=await supabase.from('class_task_assignments').insert(newRows);
  if(insertError)return showStatus(insertError.message,true);
  const {error:sunError}=await supabase.from('class_week_sunshine').insert({week_start:week,student_id:sunshine.id,sunshine_cycle:sunCycle,created_by:profile.id});
  if(sunError)return showStatus(sunError.message,true);
  await loadData();showStatus('🎉 Nieuwe klastaken zijn verdeeld!');
}

async function setResetPassword(){
  const value=document.querySelector('#reset-new-password').value;
  if(value.length<4)return showStatus('Het resetwachtwoord moet minstens 4 tekens lang zijn.',true);
  const {error}=await supabase.rpc('class_tasks_set_reset_password',{p_new_password:value});
  if(error)return showStatus(error.message,true);
  showStatus('Resetwachtwoord ingesteld.');
}

async function resetAll(){
  const value=document.querySelector('#reset-password').value;
  if(!value)return showStatus('Vul eerst het resetwachtwoord in.',true);
  if(!confirm('Zeker? Dit wist de volledige taakgeschiedenis en alle zonnetjes.'))return;
  const {error}=await supabase.rpc('class_tasks_reset',{p_password:value});
  if(error)return showStatus(error.message,true);
  await loadData();showStatus('Alle klastaken en geschiedenis zijn volledig gereset.');
}

async function openTasks(){
  captureNavigation();
  profile=await getProfile();
  if(!profile)return;
  pageActive=true;statusMessage='';statusError=false;
  await loadData();render();
}

function enhanceNavigation(){
  if(pageActive)return;
  document.querySelectorAll('.main-nav').forEach(nav=>{
    if(nav.querySelector('.tasks-nav'))return;
    const button=document.createElement('button');
    button.className='nav-item tasks-nav';
    button.innerHTML='<span>🎲</span><small>Klastaken</small>';
    button.onclick=openTasks;
    nav.appendChild(button);
  });
}

const observer=new MutationObserver(()=>enhanceNavigation());
const root=document.querySelector('#app');
if(root){observer.observe(root,{childList:true,subtree:true});enhanceNavigation()}
