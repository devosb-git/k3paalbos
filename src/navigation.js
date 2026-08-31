const pages=[
  {id:'calendar',icon:'📅',label:'Maandkalender'},
  {id:'week',icon:'🗓️',label:'Weekkalender'},
  {id:'day',icon:'➡️',label:'Dagkalender'},
  {id:'weather',icon:'🌤️',label:'Weer'},
  {id:'clothing',icon:'👕',label:'Kleding'},
  {id:'tasks',icon:'🎲',label:'Klastaken'}
];
const labelToId={'Kalender':'calendar','Maandkalender':'calendar','Weekkalender':'week','Dagkalender':'day','Weer':'weather','Kleding':'clothing','Klastaken':'tasks'};
function pageFromButton(button){const small=button.querySelector('small')?.textContent?.trim()||'';return button.dataset.page||button.dataset.taskGo||labelToId[small]||null}
function navigate(page){const eventName=page==='tasks'?'k3paalbos:tasks':'k3paalbos:navigate';window.dispatchEvent(new CustomEvent(eventName,{detail:{page}}))}
function normalize(nav){if(!nav||nav.dataset.centralNavigation==='true')return;let active=null;[...nav.querySelectorAll('.nav-item')].forEach(button=>{const page=pageFromButton(button);if(page&&button.classList.contains('active'))active=page});nav.dataset.centralNavigation='true';nav.innerHTML=pages.map(page=>`<button class="nav-item ${active===page.id?'active':''} ${page.id==='tasks'?'tasks-nav':''}" data-central-page="${page.id}"><span>${page.icon}</span><small>${page.label}</small></button>`).join('');nav.querySelectorAll('[data-central-page]').forEach(button=>{button.onclick=()=>navigate(button.dataset.centralPage)})}
function normalizeAll(){document.querySelectorAll('.main-nav').forEach(normalize)}
const observer=new MutationObserver(()=>queueMicrotask(normalizeAll));const root=document.querySelector('#app');if(root){observer.observe(root,{childList:true,subtree:true});normalizeAll()}
