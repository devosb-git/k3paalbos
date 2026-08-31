function localDateKey(date){
  const pad=value=>String(value).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

function markPastDays(){
  const today=localDateKey(new Date());
  document.querySelectorAll('.calendar .day[data-day]').forEach(day=>{
    day.classList.toggle('past-day',day.dataset.day<today);
  });
}

function addStyles(){
  if(document.getElementById('calendar-past-days-styles'))return;
  const style=document.createElement('style');
  style.id='calendar-past-days-styles';
  style.textContent=`
    .calendar .day.past-day {
      background: #f0f2f0;
      border-color: #d7ddd7;
    }
    .calendar .day.past-day .day-number {
      color: #929a94;
    }
    .calendar .day.past-day .placed {
      opacity: .72;
      filter: grayscale(.35);
    }
    .calendar .day.past-day.over {
      background: #edf8ea;
      border-color: #4f9a61;
    }
  `;
  document.head.appendChild(style);
}

const observer=new MutationObserver(()=>markPastDays());
const app=document.querySelector('#app');
if(app)observer.observe(app,{childList:true,subtree:true});
addStyles();
markPastDays();
