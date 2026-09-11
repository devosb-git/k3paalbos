const pages=[
  {id:'attendance',icon:'🙋',label:'Aanwezigheden'},
  {id:'calendar',icon:'📅',label:'Maandkalender'},
  {id:'week',icon:'🗓️',label:'Weekkalender'},
  {id:'day',icon:'➡️',label:'Dagverloop'},
  {id:'weather',icon:'🌤️',label:'Weer'},
  {id:'clothing',icon:'👕',label:'Kleding'},
  {id:'tasks',icon:'🎲',label:'Klastaken'},
  {id:'dolls',icon:'🧸',label:'Klaspoppen'}
];

const labelToId={
  'Kalender':'calendar',
  'Maandkalender':'calendar',
  'Weekkalender':'week',
  'Dagkalender':'day',
  'Dagverloop':'day',
  'Weer':'weather',
  'Kleding':'clothing',
  'Klastaken':'tasks',
  'Klaspoppen':'dolls',
  'Aanwezigheden':'attendance'
};

function addNavigationStyles(){
  if(document.getElementById('central-navigation-styles'))return;
  const style=document.createElement('style');
  style.id='central-navigation-styles';
  style.textContent=`
    .topbar{
      gap:18px!important;
    }

    .main-nav[data-central-navigation="true"]{
      display:flex!important;
      align-items:center;
      gap:4px!important;
      padding:5px!important;
      border:1px solid #dce7da;
      border-radius:18px;
      background:#f7faf5;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 3px 10px rgba(44,79,51,.05);
      overflow-x:auto;
      scrollbar-width:none;
      -webkit-overflow-scrolling:touch;
    }

    .main-nav[data-central-navigation="true"]::-webkit-scrollbar{
      display:none;
    }

    .main-nav[data-central-navigation="true"] .nav-item{
      position:relative;
      flex:0 0 auto;
      min-width:82px!important;
      min-height:58px;
      padding:7px 9px!important;
      border:1px solid transparent!important;
      border-radius:13px!important;
      background:transparent!important;
      color:#617266!important;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:3px!important;
      box-shadow:none!important;
      transition:background .18s ease,border-color .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease;
    }

    .main-nav[data-central-navigation="true"] .nav-item:hover{
      background:#ffffff!important;
      border-color:#dce7da!important;
      color:#315c3d!important;
      transform:translateY(-1px);
      box-shadow:0 4px 10px rgba(44,79,51,.08)!important;
    }

    .main-nav[data-central-navigation="true"] .nav-item span{
      width:30px;
      height:30px;
      display:grid;
      place-items:center;
      border-radius:9px;
      background:#eef4eb;
      font-size:19px!important;
      line-height:1;
      transition:background .18s ease,transform .18s ease;
    }

    .main-nav[data-central-navigation="true"] .nav-item small{
      font-size:11px!important;
      line-height:1.1;
      font-weight:800;
      letter-spacing:.005em;
      white-space:nowrap;
    }

    .main-nav[data-central-navigation="true"] .nav-item.active{
      background:#ffffff!important;
      border-color:#bcd6b9!important;
      color:#235b36!important;
      box-shadow:0 5px 13px rgba(44,79,51,.10)!important;
    }

    .main-nav[data-central-navigation="true"] .nav-item.active::after{
      content:"";
      position:absolute;
      left:18px;
      right:18px;
      bottom:3px;
      height:3px;
      border-radius:999px;
      background:#6fa978;
    }

    .main-nav[data-central-navigation="true"] .nav-item.active span{
      background:#e4f2e1;
      transform:scale(1.04);
    }

    .main-nav[data-central-navigation="true"] .nav-item:focus-visible{
      outline:3px solid rgba(111,169,120,.28);
      outline-offset:2px;
    }

    @media(max-width:1180px){
      .topbar{
        flex-wrap:wrap;
      }
      .main-nav[data-central-navigation="true"]{
        order:3;
        width:100%;
        justify-content:flex-start!important;
      }
      .main-nav[data-central-navigation="true"] .nav-item{
        min-width:96px!important;
      }
    }

    @media(max-width:620px){
      .main-nav[data-central-navigation="true"]{
        margin-left:-2px;
        margin-right:-2px;
        border-radius:15px;
      }
      .main-nav[data-central-navigation="true"] .nav-item{
        min-width:86px!important;
        min-height:55px;
        padding:6px 8px!important;
      }
      .main-nav[data-central-navigation="true"] .nav-item span{
        width:28px;
        height:28px;
        font-size:18px!important;
      }
      .main-nav[data-central-navigation="true"] .nav-item small{
        font-size:10.5px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function pageFromButton(button){
  const small=button.querySelector('small')?.textContent?.trim()||'';
  return button.dataset.page||button.dataset.taskGo||button.dataset.dollsGo||labelToId[small]||null;
}

function navigate(page){
  let eventName='k3paalbos:navigate';
  if(page==='tasks')eventName='k3paalbos:tasks';
  if(page==='dolls')eventName='k3paalbos:dolls';
  window.dispatchEvent(new CustomEvent(eventName,{detail:{page}}));
}

function normalize(nav){
  if(!nav||nav.dataset.centralNavigation==='true')return;
  let active=null;
  [...nav.querySelectorAll('.nav-item')].forEach(button=>{
    const page=pageFromButton(button);
    if(page&&button.classList.contains('active'))active=page;
  });
  nav.dataset.centralNavigation='true';
  nav.setAttribute('aria-label','Hoofdnavigatie');
  nav.innerHTML=pages.map(page=>`<button type="button" class="nav-item ${active===page.id?'active':''} ${page.id==='tasks'?'tasks-nav':''} ${page.id==='dolls'?'dolls-nav':''}" data-central-page="${page.id}" ${active===page.id?'aria-current="page"':''}><span aria-hidden="true">${page.icon}</span><small>${page.label}</small></button>`).join('');
  nav.querySelectorAll('[data-central-page]').forEach(button=>{
    button.onclick=()=>navigate(button.dataset.centralPage);
  });
}

function normalizeAll(){
  addNavigationStyles();
  document.querySelectorAll('.main-nav').forEach(normalize);
}

const observer=new MutationObserver(()=>queueMicrotask(normalizeAll));
const root=document.querySelector('#app');
if(root){
  observer.observe(root,{childList:true,subtree:true});
  normalizeAll();
}
