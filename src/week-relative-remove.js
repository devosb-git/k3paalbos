import { updateWeekState } from './week-calendar-store.js';

function addStyles(){
  if(document.getElementById('week-relative-remove-styles'))return;
  const style=document.createElement('style');
  style.id='week-relative-remove-styles';
  style.textContent=`
    .week-picker-relative.filled{position:relative;padding-right:26px!important}
    .week-relative-remove{
      position:absolute;
      top:3px;
      right:3px;
      width:19px;
      height:19px;
      border-radius:50%;
      background:#fff;
      color:#a46d60;
      font-size:14px;
      line-height:19px;
      font-weight:800;
      text-align:center;
      box-shadow:0 1px 3px #0001;
      cursor:pointer;
      z-index:3;
    }
    .week-relative-remove:hover{background:#fff0ed;color:#b44f4f}
  `;
  document.head.appendChild(style);
}

function removeRelative(slot){
  updateWeekState(state=>{
    state.relativeDays=state.relativeDays||{};
    delete state.relativeDays[slot];
  });
  window.dispatchEvent(new CustomEvent('k3paalbos:navigate',{detail:{page:'week'}}));
}

function mount(){
  addStyles();
  if(!document.querySelector('#clear-week'))return;

  document.querySelectorAll('.week-picker-relative.filled').forEach(relative=>{
    if(relative.querySelector('.week-relative-remove'))return;
    const column=relative.closest('.week-column[data-slot]');
    if(!column)return;
    const slot=Number(column.dataset.slot);

    const remove=document.createElement('span');
    remove.className='week-relative-remove';
    remove.setAttribute('role','button');
    remove.setAttribute('tabindex','0');
    remove.setAttribute('aria-label','Begrip verwijderen');
    remove.textContent='×';

    const doRemove=event=>{
      event.preventDefault();
      event.stopPropagation();
      removeRelative(slot);
    };

    remove.addEventListener('pointerdown',event=>event.stopPropagation());
    remove.addEventListener('click',doRemove);
    remove.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      doRemove(event);
    });

    relative.appendChild(remove);
  });
}

const app=document.querySelector('#app');
if(app)new MutationObserver(()=>queueMicrotask(mount)).observe(app,{childList:true,subtree:true});
mount();
