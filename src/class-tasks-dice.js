let replayClick=false;
let animationBusy=false;

function ensureStyles(){
  if(document.querySelector('#class-tasks-dice-styles'))return;
  const style=document.createElement('style');
  style.id='class-tasks-dice-styles';
  style.textContent=`
    .tasks-dice-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(22,34,27,.68);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:tasks-dice-fade-in .18s ease-out}
    .tasks-dice-stage{display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;color:#fff;pointer-events:none}
    .tasks-dice-title{font-size:clamp(34px,7vw,64px);font-weight:900;letter-spacing:.02em;text-shadow:0 3px 14px rgba(0,0,0,.35)}
    .tasks-dice-subtitle{font-size:clamp(17px,3vw,25px);font-weight:700;opacity:.96;text-shadow:0 2px 8px rgba(0,0,0,.35)}
    .tasks-dice-scene{width:180px;height:180px;perspective:760px;filter:drop-shadow(0 25px 22px rgba(0,0,0,.35))}
    .tasks-dice-cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:tasks-cube-roll 2.45s cubic-bezier(.23,.72,.25,1) both}
    .tasks-dice-face{position:absolute;inset:0;border:4px solid rgba(255,255,255,.92);border-radius:30px;background:linear-gradient(145deg,#fff,#f0f0ec);box-shadow:inset -12px -15px 24px rgba(0,0,0,.09),inset 8px 8px 15px rgba(255,255,255,.85);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:22px}
    .tasks-dice-dot{width:25px;height:25px;border-radius:50%;background:#1f2722;box-shadow:inset 2px 2px 3px rgba(255,255,255,.2),0 2px 3px rgba(0,0,0,.18);align-self:center;justify-self:center}
    .tasks-dice-front{transform:translateZ(90px)}.tasks-dice-back{transform:rotateY(180deg) translateZ(90px)}.tasks-dice-right{transform:rotateY(90deg) translateZ(90px)}.tasks-dice-left{transform:rotateY(-90deg) translateZ(90px)}.tasks-dice-top{transform:rotateX(90deg) translateZ(90px)}.tasks-dice-bottom{transform:rotateX(-90deg) translateZ(90px)}
    .p1{grid-area:2/2}.p2a{grid-area:1/1}.p2b{grid-area:3/3}.p3a{grid-area:1/1}.p3b{grid-area:2/2}.p3c{grid-area:3/3}.p4a{grid-area:1/1}.p4b{grid-area:1/3}.p4c{grid-area:3/1}.p4d{grid-area:3/3}.p5a{grid-area:1/1}.p5b{grid-area:1/3}.p5c{grid-area:2/2}.p5d{grid-area:3/1}.p5e{grid-area:3/3}.p6a{grid-area:1/1}.p6b{grid-area:2/1}.p6c{grid-area:3/1}.p6d{grid-area:1/3}.p6e{grid-area:2/3}.p6f{grid-area:3/3}
    .tasks-dice-sparkles{position:absolute;inset:-45px;animation:tasks-sparkle-spin 1.7s linear infinite}.tasks-dice-sparkles span{position:absolute;font-size:30px;animation:tasks-sparkle-pulse .7s ease-in-out infinite alternate}.tasks-dice-sparkles span:nth-child(1){left:5%;top:15%}.tasks-dice-sparkles span:nth-child(2){right:5%;top:24%;animation-delay:.2s}.tasks-dice-sparkles span:nth-child(3){left:15%;bottom:5%;animation-delay:.35s}.tasks-dice-sparkles span:nth-child(4){right:12%;bottom:2%;animation-delay:.5s}
    @keyframes tasks-cube-roll{0%{transform:rotateX(-15deg) rotateY(10deg) rotateZ(0) scale(.72)}15%{transform:rotateX(190deg) rotateY(270deg) rotateZ(80deg) scale(1.03)}35%{transform:rotateX(430deg) rotateY(570deg) rotateZ(210deg) scale(.92)}60%{transform:rotateX(790deg) rotateY(930deg) rotateZ(390deg) scale(1.08)}82%{transform:rotateX(1040deg) rotateY(1210deg) rotateZ(510deg) scale(.98)}100%{transform:rotateX(1090deg) rotateY(1260deg) rotateZ(540deg) scale(1)}}
    @keyframes tasks-dice-fade-in{from{opacity:0}to{opacity:1}}@keyframes tasks-sparkle-spin{to{transform:rotate(360deg)}}@keyframes tasks-sparkle-pulse{from{opacity:.35;transform:scale(.65)}to{opacity:1;transform:scale(1.15)}}
    @media(max-width:560px){.tasks-dice-scene{width:135px;height:135px}.tasks-dice-front{transform:translateZ(67.5px)}.tasks-dice-back{transform:rotateY(180deg) translateZ(67.5px)}.tasks-dice-right{transform:rotateY(90deg) translateZ(67.5px)}.tasks-dice-left{transform:rotateY(-90deg) translateZ(67.5px)}.tasks-dice-top{transform:rotateX(90deg) translateZ(67.5px)}.tasks-dice-bottom{transform:rotateX(-90deg) translateZ(67.5px)}.tasks-dice-face{border-radius:23px;padding:17px}.tasks-dice-dot{width:19px;height:19px}}
    @media(prefers-reduced-motion:reduce){.tasks-dice-cube{animation-duration:.7s}.tasks-dice-sparkles{animation:none}}
  `;
  document.head.appendChild(style);
}

function face(className,dots){return `<div class="tasks-dice-face ${className}">${dots.map(x=>`<i class="tasks-dice-dot ${x}"></i>`).join('')}</div>`}

function showDice(){
  ensureStyles();
  document.querySelector('.tasks-dice-overlay')?.remove();
  const overlay=document.createElement('div');
  overlay.className='tasks-dice-overlay';
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-live','polite');
  overlay.innerHTML=`<div class="tasks-dice-stage"><div class="tasks-dice-title">Dobbelen…</div><div class="tasks-dice-scene"><div class="tasks-dice-sparkles"><span>✨</span><span>⭐</span><span>✨</span><span>⭐</span></div><div class="tasks-dice-cube">${face('tasks-dice-front',['p5a','p5b','p5c','p5d','p5e'])}${face('tasks-dice-back',['p2a','p2b'])}${face('tasks-dice-right',['p3a','p3b','p3c'])}${face('tasks-dice-left',['p4a','p4b','p4c','p4d'])}${face('tasks-dice-top',['p1'])}${face('tasks-dice-bottom',['p6a','p6b','p6c','p6d','p6e','p6f'])}</div></div><div class="tasks-dice-subtitle">De klastaken worden eerlijk verdeeld…</div></div>`;
  document.body.appendChild(overlay);
  return overlay;
}

document.addEventListener('click',async event=>{
  const button=event.target.closest?.('#roll-tasks');
  if(!button||replayClick||animationBusy)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  animationBusy=true;
  button.disabled=true;
  const overlay=showDice();
  await new Promise(resolve=>setTimeout(resolve,2450));
  overlay.remove();
  button.disabled=false;
  replayClick=true;
  button.click();
  replayClick=false;
  animationBusy=false;
},true);
