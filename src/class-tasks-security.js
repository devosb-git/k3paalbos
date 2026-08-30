import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let busy=false;

async function secureAdmin(){
  const admin=document.querySelector('.tasks-admin');
  if(!admin||admin.dataset.securityReady==='1'||busy)return;
  busy=true;
  const {data:isSet,error}=await supabase.rpc('class_tasks_password_is_set');
  busy=false;
  if(error||!document.body.contains(admin))return;
  admin.dataset.securityReady='1';

  const setButton=admin.querySelector('#set-reset-password');
  const setRow=setButton?.closest('.admin-row');
  if(isSet&&setRow)setRow.remove();

  const saveButton=admin.querySelector('#save-students');
  const saveRow=saveButton?.closest('.admin-row');
  if(saveRow&&!saveRow.querySelector('#students-password')){
    const password=document.createElement('input');
    password.id='students-password';
    password.type='password';
    password.placeholder='Beheerwachtwoord';
    saveRow.insertBefore(password,saveButton);
  }
}

async function saveStudentsSecure(event){
  const button=event.target.closest?.('#save-students');
  if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const editor=document.querySelector('#student-editor');
  const password=document.querySelector('#students-password')?.value||'';
  if(!password){alert('Vul eerst het beheerwachtwoord in.');return;}
  const seen=new Set();
  const names=editor.value.split(/\n+/).map(x=>x.trim()).filter(name=>{const key=name.toLocaleLowerCase('nl');if(!name||seen.has(key))return false;seen.add(key);return true;});
  button.disabled=true;
  const {error}=await supabase.rpc('class_tasks_save_students',{p_password:password,p_names:names});
  button.disabled=false;
  if(error){alert(error.message);return;}
  alert('Leerlingenlijst opgeslagen.');
  location.reload();
}

document.addEventListener('click',saveStudentsSecure,true);
const observer=new MutationObserver(()=>secureAdmin());
observer.observe(document.documentElement,{childList:true,subtree:true});
secureAdmin();
