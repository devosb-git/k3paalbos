import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);

function addStyles(){
  if(document.getElementById('day-activity-remove-styles'))return;
  const style=document.createElement('style');
  style.id='day-activity-remove-styles';
  style.textContent=`
    .day-activity{position:relative}
    .day-activity-remove{
      position:absolute;
      top:4px;
      right:4px;
      width:22px;
      height:22px;
      padding:0;
      border:0;
      border-radius:50%;
      background:#fff;
      color:#9b6f67;
      font-size:17px;
      font-weight:800;
      line-height:22px;
      display:grid;
      place-items:center;
      box-shadow:0 1px 4px #234c2720;
      cursor:pointer;
      z-index:3;
    }
    .day-activity-remove:hover{background:#fff0ed;color:#b44f4f}
  `;
  document.head.appendChild(style);
}

async function removeActivity(slot,button){
  button.disabled=true;
  try{
    const {data:dayCalendar,error:calendarError}=await supabase
      .from('day_calendars')
      .select('id')
      .order('created_at')
      .limit(1)
      .single();
    if(calendarError)throw calendarError;

    const {error}=await supabase
      .from('day_calendar_activities')
      .delete()
      .eq('day_calendar_id',dayCalendar.id)
      .eq('slot',slot);
    if(error)throw error;

    window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page:'day'}}));
  }catch(error){
    console.error('Dagactiviteit verwijderen mislukt:',error);
    button.disabled=false;
    alert('De activiteit kon niet worden verwijderd.');
  }
}

function mountRemoveButtons(){
  if(!document.querySelector('#day-clear'))return;
  document.querySelectorAll('.day-activity[data-index]').forEach(activity=>{
    if(activity.querySelector('.day-activity-remove'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='day-activity-remove';
    button.textContent='×';
    button.setAttribute('aria-label','Activiteit verwijderen');
    button.draggable=false;
    button.addEventListener('pointerdown',event=>event.stopPropagation());
    button.addEventListener('dragstart',event=>{event.preventDefault();event.stopPropagation()});
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      removeActivity(Number(activity.dataset.index),button);
    });
    activity.appendChild(button);
  });
}

addStyles();
const app=document.querySelector('#app');
if(app)new MutationObserver(mountRemoveButtons).observe(app,{childList:true,subtree:true});
mountRemoveButtons();
