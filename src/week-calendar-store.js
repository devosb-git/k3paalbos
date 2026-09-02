import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const empty=()=>({dayNumbers:{},dayNames:{},activities:{},relativeDays:{}});
const clone=value=>structuredClone(value);

function normalize(raw){
  const state={...empty(),...(raw||{})};
  state.dayNumbers={...(raw?.dayNumbers||{})};
  state.dayNames={...(raw?.dayNames||{})};
  state.activities={...(raw?.activities||{})};
  state.relativeDays={...(raw?.relativeDays||{})};
  if(raw?.days)state.days={...raw.days};
  return state;
}

let state=empty(),loaded=false,saving=false,pendingState=null;
function notify(reason){window.dispatchEvent(new CustomEvent('week-calendar-state-changed',{detail:{reason}}))}
export function getWeekState(){return clone(state)}

export async function loadWeekState(){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user){state=empty();loaded=false;notify('signed-out');return getWeekState()}
  const {data,error}=await supabase.from('week_calendar_state').select('state').eq('id',1).maybeSingle();
  if(error)throw error;
  state=normalize(data?.state);loaded=true;notify('loaded');return getWeekState();
}

async function flush(){
  if(saving)return;
  saving=true;
  try{
    while(pendingState){
      const snapshot=pendingState;pendingState=null;
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error('Niet ingelogd');
      const {error}=await supabase.from('week_calendar_state').upsert({id:1,state:snapshot,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'id'});
      if(error)throw error;
    }
  }catch(error){
    console.error('Weekkalender opslaan mislukt:',error);pendingState=null;
    try{await loadWeekState()}catch(loadError){console.error('Weekkalender opnieuw laden mislukt:',loadError)}
    window.dispatchEvent(new CustomEvent('week-calendar-save-error',{detail:{error}}));
  }finally{saving=false;if(pendingState)void flush()}
}

export function updateWeekState(mutator){
  if(!loaded)return false;
  const next=getWeekState();mutator(next);state=normalize(next);pendingState=getWeekState();
  notify('optimistic-update');void flush();return true;
}

export function clearWeekState(){
  return updateWeekState(next=>{Object.keys(next).forEach(key=>delete next[key]);Object.assign(next,empty())});
}
