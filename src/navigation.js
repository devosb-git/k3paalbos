const pages=[
  {id:'calendar',icon:'📅',label:'Maandkalender'},
  {id:'week',icon:'🗓️',label:'Weekkalender'},
  {id:'weather',icon:'🌤️',label:'Weer'},
  {id:'clothing',icon:'👕',label:'Kleding'},
  {id:'tasks',icon:'🎲',label:'Klastaken'}
];
const labelToId={'Kalender':'calendar','Maandkalender':'calendar','Weekkalender':'week','Weer':'weather','Kleding':'clothing','Klastaken':'tasks'};
function pageFromButton(button){const small=button.querySelector('small')?.textContent?.trim()||'';return button.dataset.page||button.dataset.taskGo||labelToId[small]||null}
function normalize(nav){if(!nav||nav.dataset.centralNavigation==='true')return;const callbacks={};let active=null;[...nav.querySelectorAll('.nav-item')].forEach(button=>{const page=pageFromButton(button);if(!page)return;if(button.classList.contains('active'))active=page;if(typeof button.onclick==='function')callbacks[page]=button.onclick});nav.dataset.centralNavigation='true';nav.innerHTML=pages.map(page=>`<button class="nav-item ${active===page.id?'active':''} ${page.id==='tasks'?'tasks-nav':''}" data-central-page="${page.id}"><span>${page.icon}</span><small>${page.label}</small></button>`).join('');nav.querySelectorAll('[data-central-page]').forEach(button=>{const page=button.dataset.centralPage;if(callbacks[page])button.onclick=event=>callbacks[page](event)})}
function normalizeAll(){document.querySelectorAll('.main-nav').forEach(normalize)}
const observer=new MutationObserver(()=>queueMicrotask(normalizeAll));const root=document.querySelector('#app');if(root){observer.observe(root,{childList:true,subtree:true});normalizeAll()}
