const storageKey='k3paalbos-weekcalendar-v2';
const relativeTerms=[
  {id:'day-before-yesterday',label:'Eergisteren'},
  {id:'yesterday',label:'Gisteren'},
  {id:'today',label:'Vandaag'},
  {id:'tomorrow',label:'Morgen'},
  {id:'day-after-tomorrow',label:'Overmorgen'}
];
let draggedTerm=null;
let mounting=false;

function loadState(){
  try{return JSON.parse(localStorage.getItem(storageKey))||{}}
  catch{return {}}
}

function saveRelative(slot,term){
  const state=loadState();
  const relativeDays={...(state.relativeDays||{})};
  Object.keys(relativeDays).forEach(key=>{if(relativeDays[key]===term.id)delete relativeDays[key]});
  relativeDays[slot]=term.id;
  localStorage.setItem(storageKey,JSON.stringify({...state,relativeDays}));
  mount(true);
}

function termById(id){return relativeTerms.find(term=>term.id===id)}

function addStyles(){
  if(document.getElementById('week-relative-days-styles'))return;
  const style=document.createElement('style');
  style.id='week-relative-days-styles';
  style.textContent=`
    .week-relative-drop{min-height:48px;margin:7px 7px 0;border:2px dashed #c7d7c4;border-radius:11px;background:#fff;display:flex;align-items:center;justify-content:center;padding:5px;color:#7b8d80;font-size:11px;font-weight:700;text-align:center}
    .week-relative-drop.over{background:#edf8ea;border-color:#72ae79;box-shadow:inset 0 0 0 2px #72ae7928}
    .week-relative-placed{width:100%;min-height:34px;border:2px solid #cfe1cb;border-radius:9px;background:#f2f8f0;color:#31593b;font-size:12px;font-weight:800;padding:5px 3px;cursor:grab;touch-action:none}
    .week-relative-palette{margin-top:10px;padding-top:10px;border-top:2px solid #edf2eb}
    .week-relative-palette h3{margin:0;color:#285d39;font-size:16px}
    .week-relative-palette p{color:#718176;font-size:12px;margin:2px 0 7px}
    .week-relative-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
    .week-relative-token{min-width:0;border:2px solid #d6e8d3;background:#eef8ec;color:#284a33;border-radius:10px;padding:6px 4px;min-height:38px;font-size:12px;font-weight:800;white-space:nowrap;touch-action:none}
    @media(max-width:560px){.week-relative-palette{min-width:760px}.week-relative-token{font-size:11px}}
  `;
  document.head.appendChild(style);
}

function bindDraggable(button,term){
  const set=()=>{draggedTerm=term};
  button.ondragstart=set;
  button.addEventListener('pointerdown',set);
  button.addEventListener('pointerup',event=>{
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.week-relative-drop');
    if(target&&draggedTerm)saveRelative(+target.dataset.slot,draggedTerm);
    draggedTerm=null;
  });
}

function mount(force=false){
  if(mounting)return;
  const wrap=document.querySelector('.week-wrap');
  const columns=[...document.querySelectorAll('.week-column[data-slot]')];
  if(!wrap||columns.length!==7)return;
  if(!force&&wrap.querySelector('.week-relative-palette')&&columns.every(column=>column.querySelector('.week-relative-drop')))return;
  mounting=true;
  addStyles();
  const state=loadState();
  const placements=state.relativeDays||{};
  const canEdit=!!document.querySelector('#clear-week');

  columns.forEach(column=>{
    column.querySelector('.week-relative-drop')?.remove();
    const slot=+column.dataset.slot;
    const term=termById(placements[slot]);
    const drop=document.createElement('div');
    drop.className='week-relative-drop';
    drop.dataset.slot=String(slot);
    drop.innerHTML=term?`<button class="week-relative-placed" ${canEdit?'draggable="true"':''} data-relative-id="${term.id}">${term.label}</button>`:'Begrip';
    const head=column.querySelector('.week-day-head');
    head?.insertAdjacentElement('afterend',drop);
    if(canEdit){
      drop.ondragover=event=>{if(draggedTerm){event.preventDefault();drop.classList.add('over')}};
      drop.ondragleave=()=>drop.classList.remove('over');
      drop.ondrop=event=>{event.preventDefault();drop.classList.remove('over');if(draggedTerm)saveRelative(slot,draggedTerm);draggedTerm=null};
      const placed=drop.querySelector('.week-relative-placed');
      if(placed&&term)bindDraggable(placed,term);
    }
  });

  wrap.querySelector('.week-relative-palette')?.remove();
  if(canEdit){
    const palette=document.createElement('div');
    palette.className='week-relative-palette';
    palette.innerHTML=`<h3>Tijdbegrippen</h3><p>Sleep elk begrip onder de juiste dag.</p><div class="week-relative-list">${relativeTerms.map(term=>`<button class="week-relative-token" draggable="true" data-relative-id="${term.id}">${term.label}</button>`).join('')}</div>`;
    const dayPalette=wrap.querySelector('.day-palette-bottom');
    (dayPalette||wrap).insertAdjacentElement(dayPalette?'afterend':'beforeend',palette);
    palette.querySelectorAll('.week-relative-token').forEach(button=>bindDraggable(button,termById(button.dataset.relativeId)));
  }
  mounting=false;
}

const observer=new MutationObserver(()=>queueMicrotask(()=>mount()));
const app=document.querySelector('#app');
if(app)observer.observe(app,{childList:true,subtree:true});
window.addEventListener('week-calendar-synced',()=>setTimeout(()=>mount(true),0));
mount();
