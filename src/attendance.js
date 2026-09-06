import { createClient } from '@supabase/supabase-js';
import './attendance.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const app=()=>document.querySelector('#app');

let pageActive=false;
let profile=null;
let students=[];
let presentIds=new Set();
let statusMessage='';
let saveQueue=Promise.resolve();

function attendanceDate(){
  const now=new Date();
  const y=now.getFullYear();
  const m=String(now.getMonth()+1).padStart(2,'0');
  const d=String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

async function getProfile(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data}=await supabase.from('profiles').select('id,display_name,role,active').eq('id',user.id).maybeSingle();
  return data?.active?data:null;
}

async function loadStudents(){
  const {data,error}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');
  if(error){
    statusMessage=`Leerlingen laden mislukt: ${error.message}`;
    students=[];
    return;
  }
  students=(data||[]).slice(0,25);
  if((data||[]).length>25)statusMessage='Er zijn meer dan 25 actieve leerlingen. Voor aanwezigheden worden de eerste 25 namen getoond.';
}

async function loadAttendance(){
  const {data,error}=await supabase
    .from('attendance_day_state')
    .select('present_ids')
    .eq('attendance_date',attendanceDate())
    .maybeSingle();

  if(error){
    statusMessage=`Aanwezigheden laden mislukt: ${error.message}`;
    presentIds=new Set();
    return;
  }

  const validIds=new Set(students.map(student=>student.id));
  presentIds=new Set((data?.present_ids||[]).filter(id=>validIds.has(id)).slice(0,25));
}

function queueAttendanceSave(){
  const snapshot=[...presentIds];
  saveQueue=saveQueue.then(async()=>{
    const {error}=await supabase
      .from('attendance_day_state')
      .upsert({
        attendance_date:attendanceDate(),
        present_ids:snapshot,
        updated_by:profile.id,
        updated_at:new Date().toISOString()
      },{onConflict:'attendance_date'});

    if(error){
      statusMessage=`Aanwezigheden opslaan mislukt: ${error.message}`;
      render();
    }
  });
  return saveQueue;
}

async function clearAttendance(){
  const {error}=await supabase
    .from('attendance_day_state')
    .delete()
    .eq('attendance_date',attendanceDate());

  if(error){
    statusMessage=`Aanwezigheden wissen mislukt: ${error.message}`;
    render();
    return;
  }

  presentIds=new Set();
  statusMessage='';
  render();
}

function imagePath(){
  const count=Math.min(presentIds.size,25);
  return `/src/classroom/${String(count).padStart(2,'0')}_kinderen.png`;
}

function header(){
  const name=profile?.display_name||'Welkom';
  return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie is er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item"><span>📅</span><small>Maandkalender</small></button><button class="nav-item"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item"><span>➡️</span><small>Dagverloop</small></button><button class="nav-item"><span>🌤️</span><small>Weer</small></button><button class="nav-item"><span>👕</span><small>Kleding</small></button><button class="nav-item"><span>🎲</span><small>Klastaken</small></button><button class="nav-item active"><span>🙋</span><small>Aanwezigheden</small></button></nav><div class="account">${name} <button id="attendance-logout">Uitloggen</button></div></header>`;
}

function render(){
  if(!pageActive)return;
  const count=presentIds.size;
  const buttons=students.map(student=>{
    const present=presentIds.has(student.id);
    return `<button type="button" class="attendance-student ${present?'present':''}" data-student-id="${student.id}" aria-pressed="${present}">${student.name}</button>`;
  }).join('');

  app().innerHTML=`<main class="page attendance-page">${header()}<section class="attendance-board"><div class="attendance-image-wrap"><img class="attendance-image" src="${imagePath()}" alt="Klas met ${count} aanwezige kinderen"></div><div class="attendance-controls"><div class="attendance-counter" aria-label="${count} van ${students.length||25} kinderen aanwezig"><strong>${count}</strong><span>/${students.length||25}</span></div><button type="button" class="attendance-clear" id="attendance-clear">🗑️ Wissen</button></div><div class="attendance-students">${buttons||'<p class="attendance-empty">Nog geen leerlingen gevonden. Voeg ze eerst toe bij Klastaken.</p>'}</div>${statusMessage?`<p class="attendance-status">${statusMessage}</p>`:''}</section></main>`;

  document.querySelector('#attendance-logout')?.addEventListener('click',()=>supabase.auth.signOut());
  document.querySelector('#attendance-clear')?.addEventListener('click',clearAttendance);
  document.querySelectorAll('.attendance-student').forEach(button=>{
    button.addEventListener('click',()=>toggleStudent(button.dataset.studentId));
  });
}

function toggleStudent(id){
  if(presentIds.has(id))presentIds.delete(id);
  else if(presentIds.size<25)presentIds.add(id);
  statusMessage='';
  render();
  queueAttendanceSave();
}

async function openAttendance(){
  profile=await getProfile();
  if(!profile)return;
  pageActive=true;
  statusMessage='';
  await loadStudents();
  await loadAttendance();
  render();
}

window.addEventListener('k3paalbos:navigate',event=>{
  const page=event.detail?.page;
  if(page==='attendance')openAttendance();
  else pageActive=false;
});
