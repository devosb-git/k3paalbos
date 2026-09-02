const zoomKey='k3paalbos-view-zoom';
const minZoom=70,maxZoom=150,zoomStep=10;

function storedZoom(){
  const value=Number(localStorage.getItem(zoomKey));
  return Number.isFinite(value)&&value>=minZoom&&value<=maxZoom?value:100;
}

let zoom=storedZoom();

function applyZoom(){
  document.documentElement.style.zoom=`${zoom}%`;
  localStorage.setItem(zoomKey,String(zoom));
  document.querySelectorAll('[data-view-zoom-value]').forEach(label=>{label.textContent=`${zoom}%`});
  document.querySelectorAll('[data-view-zoom-out]').forEach(button=>{button.disabled=zoom<=minZoom});
  document.querySelectorAll('[data-view-zoom-in]').forEach(button=>{button.disabled=zoom>=maxZoom});
}

function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement}
function canFullscreen(){return !!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)}

async function toggleFullscreen(){
  try{
    if(fullscreenElement()){
      const exit=document.exitFullscreen||document.webkitExitFullscreen;
      if(exit)await exit.call(document);
    }else{
      const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
      if(request)await request.call(document.documentElement);
    }
  }catch(error){console.error('Volledig scherm openen mislukt:',error)}
}

function updateFullscreenButtons(){
  const active=!!fullscreenElement();
  document.querySelectorAll('[data-view-fullscreen]').forEach(button=>{
    button.textContent=active?'⤡':'⤢';
    button.setAttribute('aria-label',active?'Volledig scherm sluiten':'Volledig scherm openen');
    button.title=active?'Volledig scherm sluiten':'Volledig scherm openen';
  });
}

function controls(){
  const wrap=document.createElement('div');
  wrap.className='view-controls';
  wrap.innerHTML=`
    <button type="button" data-view-zoom-out aria-label="Uitzoomen" title="Uitzoomen">−</button>
    <span data-view-zoom-value aria-live="polite">${zoom}%</span>
    <button type="button" data-view-zoom-in aria-label="Inzoomen" title="Inzoomen">+</button>
    <button type="button" class="view-fullscreen" data-view-fullscreen aria-label="Volledig scherm openen" title="Volledig scherm openen">⤢</button>
  `;
  wrap.querySelector('[data-view-zoom-out]').onclick=()=>{zoom=Math.max(minZoom,zoom-zoomStep);applyZoom()};
  wrap.querySelector('[data-view-zoom-in]').onclick=()=>{zoom=Math.min(maxZoom,zoom+zoomStep);applyZoom()};
  const fullscreen=wrap.querySelector('[data-view-fullscreen]');
  fullscreen.onclick=toggleFullscreen;
  if(!canFullscreen())fullscreen.hidden=true;
  return wrap;
}

function mount(){
  const login=document.querySelector('.login-card');
  if(login&&!login.querySelector('.view-controls')){
    const row=document.createElement('div');row.className='login-view-controls';row.appendChild(controls());login.prepend(row);
  }
  const topbar=document.querySelector('.topbar');
  if(topbar&&!topbar.querySelector('.view-controls')){
    const account=topbar.querySelector('.account');
    topbar.insertBefore(controls(),account||null);
  }
  applyZoom();updateFullscreenButtons();
}

const style=document.createElement('style');
style.textContent=`
  .view-controls{display:flex;align-items:center;justify-content:center;gap:4px;flex:0 0 auto}
  .view-controls button{width:36px;height:36px;padding:0;border:2px solid #dce9db;border-radius:11px;background:#fff;color:#365f43;font-size:21px;font-weight:800;line-height:1}
  .view-controls button:hover{background:#eef7eb}
  .view-controls button:disabled{opacity:.4;cursor:default}
  .view-controls [data-view-zoom-value]{min-width:48px;text-align:center;color:#55705f;font-size:13px;font-weight:800}
  .view-controls .view-fullscreen{margin-left:3px;font-size:20px}
  .login-view-controls{display:flex;justify-content:flex-end;margin:-18px -18px 8px 0}
  @media(max-width:900px){.topbar>.view-controls{margin-left:auto}}
  @media(max-width:560px){.topbar>.view-controls{order:2}.login-view-controls{margin:-20px -20px 8px 0}}
`;
document.head.appendChild(style);

document.addEventListener('fullscreenchange',updateFullscreenButtons);
document.addEventListener('webkitfullscreenchange',updateFullscreenButtons);
const app=document.querySelector('#app');
if(app)new MutationObserver(()=>queueMicrotask(mount)).observe(app,{childList:true,subtree:true});
applyZoom();mount();
