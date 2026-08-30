let animationBusy=false;

function ensureStyles(){
  if(document.querySelector('#class-tasks-dice-styles'))return;
  const style=document.createElement('style');
  style.id='class-tasks-dice-styles';
  style.textContent=`
    .tasks-dice-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(22,34,27,.76);-webkit-user-select:none;user-select:none;touch-action:none}
    .tasks-dice-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;color:#fff;width:100%;padding:30px;pointer-events:none}
    .tasks-dice-title{font-size:clamp(36px,7vw,68px);font-weight:900;text-shadow:0 3px 14px rgba(0,0,0,.4)}
    .tasks-dice-big{font-size:clamp(130px,28vw,260px);line-height:1;display:block;transform-origin:center;animation:ipad-dice-roll 2.6s ease-in-out infinite;filter:drop-shadow(0 18px 16px rgba(0,0,0,.35));will-change:transform}
    .tasks-dice-subtitle{font-size:clamp(18px,3vw,28px);font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,.4)}
    .tasks-dice-stars{font-size:clamp(26px,5vw,44px);letter-spacing:14px;animation:ipad-stars 650ms ease-in-out infinite alternate}
    @-webkit-keyframes ipad-dice-roll{0%{-webkit-transform:rotate(-18deg) scale(.82)}20%{-webkit-transform:rotate(120deg) scale(1.08)}40%{-webkit-transform:rotate(255deg) scale(.9)}60%{-webkit-transform:rotate(400deg) scale(1.1)}80%{-webkit-transform:rotate(560deg) scale(.94)}100%{-webkit-transform:rotate(720deg) scale(1)}}
    @keyframes ipad-dice-roll{0%{transform:rotate(-18deg) scale(.82)}20%{transform:rotate(120deg) scale(1.08)}40%{transform:rotate(255deg) scale(.9)}60%{transform:rotate(400deg) scale(1.1)}80%{transform:rotate(560deg) scale(.94)}100%{transform:rotate(720deg) scale(1)}}
    @-webkit-keyframes ipad-stars{from{opacity:.45;-webkit-transform:scale(.85)}to{opacity:1;-webkit-transform:scale(1.15)}}
    @keyframes ipad-stars{from{opacity:.45;transform:scale(.85)}to{opacity:1;transform:scale(1.15)}}
  `;
  document.head.appendChild(style);
}

function showDice(){
  ensureStyles();
  document.querySelector('.tasks-dice-overlay')?.remove();
  const overlay=document.createElement('div');
  overlay.className='tasks-dice-overlay';
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-live','polite');
  overlay.innerHTML='<div class="tasks-dice-stage"><div class="tasks-dice-title">Dobbelen…</div><div class="tasks-dice-stars">✨ ⭐ ✨</div><div class="tasks-dice-big">🎲</div><div class="tasks-dice-subtitle">De klastaken worden eerlijk verdeeld…</div></div>';
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  return overlay;
}

async function runDice(button,event){
  if(animationBusy||!button)return;
  event?.preventDefault();event?.stopImmediatePropagation();
  animationBusy=true;
  button.disabled=true;
  const originalHandler=button.onclick;
  const overlay=showDice();
  await new Promise(resolve=>setTimeout(resolve,2600));
  overlay.remove();
  button.disabled=false;
  animationBusy=false;
  if(typeof originalHandler==='function')originalHandler.call(button,new Event('click'));
}

function intercept(event){
  const button=event.target.closest?.('#roll-tasks');
  if(!button)return;
  runDice(button,event);
}

// pointerup is the primary path on iPad/iPhone. click remains the desktop fallback.
document.addEventListener('pointerup',intercept,true);
document.addEventListener('click',event=>{
  if(event.pointerType)return;
  intercept(event);
},true);
