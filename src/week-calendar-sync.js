import { createClient } from '@supabase/supabase-js';
const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const key='k3paalbos-weekcalendar-v2';
let ready=false,last='',saving=false,timer=null;
const empty=()=>({days:{},activities:{}});
function local(){try{return {...empty(),...(JSON.parse(localStorage.getItem(key))||{})}}catch{return empty()}}
function scheduleSync(){clearTimeout(timer);timer=setTimeout(sync,100)}
async function init(){
 const {data:{user}}=await supabase.auth.getUser();if(!user)return;
 const {data,error}=await supabase.from('week_calendar_state').select('state').eq('id',1).maybeSingle();
 if(!error&&data?.state){
   localStorage.setItem(key,JSON.stringify(data.state));
   last=JSON.stringify(data.state);
   window.dispatchEvent(new CustomEvent('week-calendar-synced'));
   // main.js may already have rendered the Weekkalender before this async load finished.
   // Re-render it when the persisted state arrives instead of requiring a page refresh.
   document.querySelector('.nav-item[data-page="week"].active')?.click();
 } else last=JSON.stringify(local());
 ready=true;
 scheduleSync();
}
async function sync(){
 if(!ready||saving)return;const state=local(),json=JSON.stringify(state);if(json===last)return;
 saving=true;
 const {data:{user}}=await supabase.auth.getUser();
 if(user){const {error}=await supabase.from('week_calendar_state').upsert({id:1,state,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'id'});if(!error)last=json;else console.error('Weekkalender opslaan mislukt',error)}
 saving=false;
}
const originalSetItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(name,value){originalSetItem.call(this,name,value);if(name===key)scheduleSync()};
init();
window.addEventListener('beforeunload',sync);