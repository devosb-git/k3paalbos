const storageKey='k3paalbos-weekcalendar-v2';
const relativeTerms=[
  {id:'day-before-yesterday',label:'Eergisteren',arrow:'←←'},
  {id:'yesterday',label:'Gisteren',arrow:'←'},
  {id:'today',label:'Vandaag',arrow:'↑'},
  {id:'tomorrow',label:'Morgen',arrow:'→'},
  {id:'day-after-tomorrow',label:'Overmorgen',arrow:'→→'}
];
let draggedTerm=null;
let mounting=false;

function loadState(){
  try{return JSON.parse(localStorage.getItem(storageKey))||{}}
  catch{return {}}
}

function writeRelative(relativeDays){
  const state=loadState();
  localStorage.setItem(storageKey,JSON.stringify({...state,relativeDays}));
  mount(true);
}

function saveRelative(slot,term){
  const state=loadState();
  const relativeDays={...(state.relativeDays||{})};
  Object.keys(relativeDays).forEach(key=>{if(relativeDays[key]===term.id)delete relativeDays[key]});
  relativeDays[slot]=term.id;
  writeRelative(relativeDays);
}

function removeRelative(slot){
  const state=loadState();
  const relativeDays={...(state.relativeDays||{})};
  delete relativeDays[slot];
  writeRelative(relativeDays);
}

function termById(id){return relativeTerms.find(term=>term.id===id)}
function termContent(term){return `<span class="week-relative-arrow">${term.arrow}</span><span>${term.label}</span>`}

function addStyles(){
  if(document.getElementById('week-relative-days-styles'))return;
  const style=document.createElement('style');
  style.id='week-relative-days-styles';
  style.textContent=`
    .week-relative-drop{min-height:48px;margin:7px 7px 0;border:2px dashed #c7d7c4;border-radius:11px;background:#fff;display:flex;align-items:center;justify-content:center;padding:5px;color:#7b8d80;font-size:11px;font-weight:700;text-align:center}
    .week-relative-drop.over{background:#edf8ea;border-color:#72ae79;box-shadow:inset 0 0 0 2px #72ae7928}
    .week-relative-filled{width:100%;display:grid;grid-template-columns:minmax(0,1fr) 24px;gap:3px;align-items:center}
    .week-relative-placed{width:100%;min-height:42px;border:2px solid #cfe1cb;border-radius:9px;background:#f2f8f0;color:#31593b;font-size:12px;font-weight:800;padding:4px 3px;cursor:grab;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0}
    .week-relative-arrow{font-size:17px;line-height:1;font-weight:900;white-space:nowrap;display:block;text-align:center}
    .week-relative-remove{width:24px;height:24px;border:0;border-radius:50%;background:#fff;color:#b44f4f;font-size:18px;line-height:1;padding:0;display:grid;place-items:center;cursor:pointer}
    .week-relative-remove:hover{background:#fdeeee}
    .week-relative-palette{margin-top:7px}
    .week-relative-row{display:grid;grid-template-columns:88px minmax(0,1fr);gap:5px;align-items:center}
    .week-relative-label{font-size:12px;font-weight:800;color:#58705e}
    .week-relative-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
    .week-relative-token{min-width:0;border:2px solid #d6e8d3;background:#eef8ec;color:#284a33;border-radius:10px;padding:5px 4px;min-height:48px;font-size:12px;font-weight:800;white-space:nowrap;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
    @media(max-width:560px){.week-relative-palette{min-width:760px}.week-relative-row{grid-template-columns:78px minmax(0,1fr)}.week-relative-token{font-size:11px}}
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
    drop.innerHTML=term
      ?`<div class="week-relative-filled"><button class="week-relative-placed" ${canEdit?'draggable="true"':''} data-relative-id="${term.id}">${termContent(term)}</button>${canEdit?'<button type="button" class="week-relative-remove" aria-label="Begrip verwijderen" title="Begrip verwijderen">×</button>':''}</div>`
      :'Begrip';
    const head=column.querySelector('.week-day-head');
    head?.insertAdjacentElement('afterend',drop);
    if(canEdit){
      drop.ondragover=event=>{if(draggedTerm){event.preventDefault();drop.classList.add('over')}};
      drop.ondragleave=()=>drop.classList.remove('over');
      drop.ondrop=event=>{event.preventDefault();drop.classList.remove('over');if(draggedTerm)saveRelative(slot,draggedTerm);draggedTerm=null};
      const placed=drop.querySelector('.week-relative-placed');
      if(placed&&term)bindDraggable(placed,term);
      const remove=drop.querySelector('.week-relative-remove');
      if(remove){
        remove.onpointerdown=event=>{event.preventDefault();event.stopPropagation();draggedTerm=null};
        remove.onclick=event=>{event.preventDefault();event.stopPropagation();draggedTerm=null;removeRelative(slot)};
      }
    }
  });

  wrap.querySelector('.week-relative-palette')?.remove();
  if(canEdit){
    const dayPalette=wrap.querySelector('.day-palette-bottom');
    if(dayPalette){
      const heading=dayPalette.querySelector('h3');
      if(heading)heading.textContent='Begrippen';
      const palette=document.createElement('div');
      palette.className='week-relative-palette';
      palette.innerHTML=`<div class="week-relative-row"><div class="week-relative-label">Tijdsbegrippen</div><div class="week-relative-list">${relativeTerms.map(term=>`<button class="week-relative-token" draggable="true" data-relative-id="${term.id}">${termContent(term)}</button>`).join('')}</div></div>`;
      dayPalette.appendChild(palette);
      palette.querySelectorAll('.week-relative-token').forEach(button=>bindDraggable(button,termById(button.dataset.relativeId)));
    }
  }
  mounting=false;
}

const observer=new MutationObserver(()=>queueMicrotask(()=>mount()));
const app=document.querySelector('#app');
if(app)observer.observe(app,{childList:true,subtree:true});
window.addEventListener('week-calendar-synced',()=>setTimeout(()=>mount(true),0));
mount();
