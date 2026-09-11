import { createClient } from '@supabase/supabase-js';
import './attendance.css';

const classroomImageModules=import.meta.glob('./classroom/*_kinderen.png',{eager:true,query:'?url',import:'default'});
const classroomImages=Object.fromEntries(
  Object.entries(classroomImageModules).map(([path,url])=>{
    const match=path.match(/\/(\d{2})_kinderen\.png$/);
    return [match?.[1],url];
  }).filter(([key])=>key)
);

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const app=()=>document.querySelector('#app');

let pageActive=false;
let profile=null;
let students=[];
let presentIds=new Set();
let statusMessage='';
let saveQueue=Promise.resolve();
let initialImagePreloaded=false;
let imagesPreloaded=false;
const preloadedImages=[];

function attendanceDate(){
  const now=new Date();
  const y=now.getFullYear();
  const m=String(now.getMonth()+1).padStart(2,'0');
  const d=String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function imagePathForCount(count){
  const key=String(Math.min(Math.max(count,0),25)).padStart(2,'0');
  return classroomImages[key]||classroomImages['00']||'';
}

function imagePath(){
  return imagePathForCount(presentIds.size);
}

function preloadInitialClassroomImage(){
  if(initialImagePreloaded)return;
  const src=imagePathForCount(0);
  if(!src)return;
  initialImagePreloaded=true;
  const image=new Image();
  image.decoding='async';
  image.fetchPriority='high';
  image.src=src;
  preloadedImages.push(image);
}

function preloadClassroomImages(){
  if(imagesPreloaded)return;
  imagesPreloaded=true;
  preloadInitialClassroomImage();
  for(let count=1;count<=25;count++){
    const image=new Image();
    image.decoding='async';
    image.src=imagePathForCount(count);
    preloadedImages.push(image);
  }
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
      updateStatus();
    }
  });
  return saveQueue;
}

async function clearAttendance(){
  await saveQueue;
  const {error}=await supabase
    .from('attendance_day_state')
    .delete()
    .eq('attendance_date',attendanceDate());

  if(error){
    statusMessage=`Aanwezigheden wissen mislukt: ${error.message}`;
    updateStatus();
    return;
  }

  presentIds=new Set();
  statusMessage='';
  updateAttendanceView();
}

function showClearConfirmation(){
  document.querySelector('.attendance-confirm-overlay')?.remove();

  const overlay=document.createElement('div');
  overlay.className='attendance-confirm-overlay';
  overlay.innerHTML=`
    <div class="attendance-confirm-card" role="dialog" aria-modal="true" aria-labelledby="attendance-confirm-title">
      <div class="attendance-confirm-icon">🦊</div>
      <h3 id="attendance-confirm-title">Alles wissen?</h3>
      <p>Ben je zeker dat je alle aanwezigheden van vandaag wil wissen?</p>
      <div class="attendance-confirm-actions">
        <button type="button" class="attendance-confirm-no">Nee</button>
        <button type="button" class="attendance-confirm-yes">Ja, wissen</button>
      </div>
    </div>`;

  const close=()=>overlay.remove();
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  overlay.querySelector('.attendance-confirm-no')?.addEventListener('click',close);
  overlay.querySelector('.attendance-confirm-yes')?.addEventListener('click',async()=>{
    const yesButton=overlay.querySelector('.attendance-confirm-yes');
    if(yesButton)yesButton.disabled=true;
    await clearAttendance();
    close();
  });

  document.body.appendChild(overlay);
  overlay.querySelector('.attendance-confirm-no')?.focus();
}

function header(){
  const name=profile?.display_name||'Welkom';
  return `<header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wie is er vandaag?</p></div></div><nav class="main-nav"><button class="nav-item active"><span>🙋</span><small>Aanwezigheden</small></button><button class="nav-item"><span>📅</span><small>Maandkalender</small></button><button class="nav-item"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item"><span>➡️</span><small>Dagverloop</small></button><button class="nav-item"><span>🌤️</span><small>Weer</small></button><button class="nav-item"><span>👕</span><small>Kleding</small></button><button class="nav-item"><span>🎲</span><small>Klastaken</small></button></nav><div class="account">${name} <button id="attendance-logout">Uitloggen</button></div></header>`;
}

function updateStatus(){
  const board=document.querySelector('.attendance-board');
  if(!board)return;
  let status=document.querySelector('.attendance-status');
  if(statusMessage){
    if(!status){
      status=document.createElement('p');
      status.className='attendance-status';
      board.appendChild(status);
    }
    status.textContent=statusMessage;
  }else{
    status?.remove();
  }
}

function updateAttendanceView(){
  if(!pageActive)return;
  const count=presentIds.size;
  const image=document.querySelector('.attendance-image');
  if(image){
    image.src=imagePath();
    image.alt=`Klas met ${count} aanwezige kinderen`;
  }

  const counter=document.querySelector('.attendance-counter');
  if(counter){
    counter.setAttribute('aria-label',`${count} van ${students.length||25} kinderen aanwezig`);
    counter.innerHTML=`<strong>${count}</strong><span>/${students.length||25}</span>`;
  }

  document.querySelectorAll('.attendance-student').forEach(button=>{
    const present=presentIds.has(button.dataset.studentId);
    button.classList.toggle('present',present);
    button.setAttribute('aria-pressed',String(present));
  });

  updateStatus();
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
  document.querySelector('#attendance-clear')?.addEventListener('click',showClearConfirmation);
  document.querySelectorAll('.attendance-student').forEach(button=>{
    button.addEventListener('click',()=>toggleStudent(button.dataset.studentId));
  });
}

function toggleStudent(id){
  if(presentIds.has(id))presentIds.delete(id);
  else if(presentIds.size<25)presentIds.add(id);
  statusMessage='';
  updateAttendanceView();
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
  preloadClassroomImages();
}

preloadInitialClassroomImage();

window.addEventListener('k3paalbos:navigate',event=>{
  const page=event.detail?.page;
  if(page==='attendance')openAttendance();
  else pageActive=false;
});
