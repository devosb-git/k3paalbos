import { createClient } from '@supabase/supabase-js';
import spritePart0 from './clothing-builder/sprite-part-0.js';
import spritePart1 from './clothing-builder/sprite-part-1.js';
import spritePart2 from './clothing-builder/sprite-part-2.js';
import spritePart3 from './clothing-builder/sprite-part-3.js';
import spritePart4 from './clothing-builder/sprite-part-4.js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const spriteUrl=`data:image/webp;base64,${spritePart0}${spritePart1}${spritePart2}${spritePart3}${spritePart4}`;
const storageKey='k3paalbos-clothing-builder-v1';

const modelIndex={
  meisje:{
    'neutraal':32,'korte-broek':6,'lange-broek':18,'zwembroek':33,
    'korte-broek-regenjas':7,'korte-broek-regenjas-laarzen':8,'korte-broek-regenjas-schoenen':9,
    'korte-broek-trui':10,'korte-broek-trui-laarzen':11,'korte-broek-trui-schoenen':12,
    'korte-broek-tshirt':13,'korte-broek-tshirt-laarzen':14,'korte-broek-tshirt-laarzen-zomer':15,'korte-broek-tshirt-schoenen':16,'korte-broek-tshirt-schoenen-zomer':17,
    'lange-broek-regenjas':19,'lange-broek-regenjas-laarzen':20,'lange-broek-regenjas-schoenen':21,
    'lange-broek-trui':22,'lange-broek-trui-laarzen':23,'lange-broek-trui-schoenen':24,
    'lange-broek-tshirt':25,'lange-broek-tshirt-laarzen':26,'lange-broek-tshirt-schoenen':27,
    'lange-broek-winterjas-laarzen':28,'lange-broek-winterjas-laarzen-winter':29,'lange-broek-winterjas-schoenen':30,'lange-broek-winterjas-schoenen-winter':31,
    'zwembroek-schoenen':34,'zwembroek-schoenen-zomer':35
  },
  jongen:{
    'lange-broek-winterjas-schoenen':0,'lange-broek-winterjas-schoenen-winter':1,'neutraal':2,'zwembroek':3,'zwembroek-schoenen':4,'zwembroek-schoenen-zomer':5,
    'korte-broek':36,'korte-broek-regenjas':37,'korte-broek-regenjas-laarzen':38,'korte-broek-regenjas-schoenen':39,
    'korte-broek-trui':40,'korte-broek-trui-laarzen':41,'korte-broek-trui-schoenen':42,
    'korte-broek-tshirt':43,'korte-broek-tshirt-laarzen':44,'korte-broek-tshirt-laarzen-zomer':45,'korte-broek-tshirt-schoenen':46,'korte-broek-tshirt-schoenen-zomer':47,
    'lange-broek':48,'lange-broek-regenjas':49,'lange-broek-regenjas-laarzen':50,'lange-broek-regenjas-schoenen':51,
    'lange-broek-trui':52,'lange-broek-trui-laarzen':53,'lange-broek-trui-schoenen':54,
    'lange-broek-tshirt':55,'lange-broek-tshirt-laarzen':56,'lange-broek-tshirt-schoenen':57,
    'lange-broek-winterjas-laarzen':58,'lange-broek-winterjas-laarzen-winter':59
  }
};

const buttonIndex={
  'korte-broek':0,'laarzen':1,'lange-broek':2,'regenjas':3,'trui':4,'tshirt':5,
  'winter':6,'winterjas':7,'zomer':8,'zwembroek':9,'schoenen':10
};

const rows=[
  {id:'pants',title:'1. Broeken',hint:'Kies eerst een broek.',options:[['korte-broek','Korte broek'],['lange-broek','Lange broek'],['zwembroek','Zwembroek']]},
  {id:'top',title:'2. Bovenkledij',hint:'Kies daarna wat je bovenaan aantrekt.',options:[['tshirt','T-shirt'],['trui','Trui'],['regenjas','Regenjas'],['winterjas','Winterjas']]},
  {id:'shoes',title:'3. Schoenen',hint:'Nu mag je schoenen kiezen.',options:[['schoenen','Gewone schoenen'],['laarzen','Laarzen']]},
  {id:'accessory',title:'4. Accessoires',hint:'Kijk tot slot of je accessoires nodig hebt.',options:[['zomer','Zomeraccessoires'],['winter','Winteraccessoires']]}
];

function emptyState(){return {pants:'',top:'',shoes:'',accessory:''};}
function loadState(){
  try{return {...emptyState(),...JSON.parse(localStorage.getItem(storageKey)||'{}')};}
  catch{return emptyState();}
}
let state=loadState();
function saveState(){localStorage.setItem(storageKey,JSON.stringify(state));}

function modelKey(){
  if(!state.pants)return 'neutraal';
  if(state.pants==='zwembroek'){
    if(!state.shoes)return 'zwembroek';
    return state.accessory==='zomer'?'zwembroek-schoenen-zomer':'zwembroek-schoenen';
  }
  let key=state.pants;
  if(state.top)key+=`-${state.top}`;
  if(state.shoes)key+=`-${state.shoes}`;
  if(state.accessory)key+=`-${state.accessory}`;
  return key;
}

function modelSprite(gender){
  const key=modelKey();
  const fallback=gender==='meisje'?32:2;
  const index=modelIndex[gender][key]??fallback;
  const col=index%10,row=Math.floor(index/10);
  return `<div class="clothing-model-frame" aria-label="${gender==='meisje'?'Meisje':'Jongen'}"><div class="clothing-model-sprite" style="--mx:${-col*90}px;--my:${-row*135}px"></div></div>`;
}

function buttonSprite(id){
  const index=buttonIndex[id],col=index%5,row=Math.floor(index/5);
  return `<span class="clothing-choice-image" style="--bx:${-col*180}px;--by:${-(810+row*86)}px"></span>`;
}

function rowEnabled(row){
  if(row==='pants')return true;
  if(row==='top')return !!state.pants&&state.pants!=='zwembroek';
  if(row==='shoes')return !!state.pants&&(state.pants==='zwembroek'||!!state.top);
  if(row==='accessory')return !!state.shoes;
  return false;
}

function optionAllowed(row,id){
  if(!rowEnabled(row))return false;
  if(row==='top'){
    if(state.pants==='korte-broek'&&id==='winterjas')return false;
    return state.pants==='korte-broek'||state.pants==='lange-broek';
  }
  if(row==='shoes'&&state.pants==='zwembroek')return id==='schoenen';
  if(row==='accessory'){
    if(id==='zomer')return (state.pants==='korte-broek'&&state.top==='tshirt')||state.pants==='zwembroek';
    if(id==='winter')return state.pants==='lange-broek'&&state.top==='winterjas';
  }
  return true;
}

function rowMessage(row){
  if(row==='top'&&state.pants==='zwembroek')return 'Bij een zwembroek ga je meteen verder naar de schoenen.';
  if(row==='top'&&!state.pants)return 'Kies eerst een broek.';
  if(row==='shoes'&&!rowEnabled('shoes'))return state.pants?'Kies eerst de bovenkledij.':'Kies eerst een broek en bovenkledij.';
  if(row==='accessory'&&!state.shoes)return 'Kies eerst de schoenen.';
  if(row==='accessory'&&state.shoes&&!optionAllowed('accessory','zomer')&&!optionAllowed('accessory','winter'))return 'Bij deze combinatie zijn geen extra accessoires nodig.';
  return '';
}

function renderRows(){
  return rows.map(row=>{
    const enabled=rowEnabled(row.id);
    const message=rowMessage(row.id);
    const options=row.options.map(([id,label])=>{
      const allowed=optionAllowed(row.id,id);
      const selected=state[row.id]===id;
      return `<button type="button" class="clothing-choice ${selected?'selected':''}" data-row="${row.id}" data-value="${id}" ${allowed?'':'disabled'} aria-pressed="${selected}" aria-label="${label}">${buttonSprite(id)}<span class="clothing-choice-check">✓</span></button>`;
    }).join('');
    return `<section class="clothing-builder-row ${enabled?'enabled':'locked'}"><div class="clothing-row-copy"><h3>${row.title}</h3><p>${message||row.hint}</p></div><div class="clothing-row-options">${options}</div></section>`;
  }).join('');
}

function styles(){
  if(document.getElementById('clothing-builder-styles'))return;
  const style=document.createElement('style');
  style.id='clothing-builder-styles';
  style.textContent=`
    .clothing-page{min-height:100vh}.clothing-builder-card{max-width:1500px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:24px;box-shadow:0 8px 24px #234c2712;padding:18px 22px 22px}
    .clothing-builder-intro{text-align:center;margin:0 auto 8px}.clothing-builder-intro h2{font-size:28px;color:#285d39;margin:0}.clothing-builder-intro p{color:#718176;font-size:14px;margin:4px 0 0}
    .clothing-children{display:flex;justify-content:center;align-items:flex-end;gap:34px;min-height:250px;padding:4px 0 10px}
    .clothing-model-frame{width:160px;height:232px;display:grid;place-items:center;overflow:hidden;border-radius:20px;background:#fff}
    .clothing-model-sprite{width:90px;height:135px;background-image:url('${spriteUrl}');background-repeat:no-repeat;background-size:900px 1068px;background-position:var(--mx) var(--my);transform:scale(1.7);image-rendering:auto}
    .clothing-builder-row{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:center;padding:12px 8px;border-top:2px solid #edf2eb}.clothing-builder-row:first-of-type{border-top:0}
    .clothing-row-copy h3{margin:0;color:#31593b;font-size:20px}.clothing-row-copy p{margin:3px 0 0;color:#718176;font-size:13px;line-height:1.25}.clothing-builder-row.locked .clothing-row-copy{opacity:.65}
    .clothing-row-options{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
    .clothing-choice{position:relative;width:180px;height:86px;border:2px solid #e2e9df;border-radius:15px;background:#fff;padding:0;overflow:hidden;box-shadow:0 2px 5px #254d2610;transition:.12s}
    .clothing-choice:not(:disabled):hover{transform:translateY(-2px);border-color:#b8d7b6}.clothing-choice.selected{border-color:#4f9a61;box-shadow:0 0 0 3px #d7ecd5}.clothing-choice:disabled{opacity:.28;filter:grayscale(.35);cursor:not-allowed}
    .clothing-choice-image{display:block;width:180px;height:86px;background-image:url('${spriteUrl}');background-repeat:no-repeat;background-size:900px 1068px;background-position:var(--bx) var(--by)}
    .clothing-choice-check{display:none;position:absolute;right:6px;top:6px;width:25px;height:25px;border-radius:50%;background:#4f9a61;color:#fff;font-size:17px;font-weight:900;align-items:center;justify-content:center}.clothing-choice.selected .clothing-choice-check{display:flex}
    .clothing-builder-actions{display:flex;justify-content:center;margin-top:14px}.clothing-reset{border:0;border-radius:13px;background:#f3eee6;color:#6c6257;padding:10px 17px;font-weight:800}
    .clothing-page .main-nav .nav-item.active{background:#e8f4e7;border-color:#cce2ca;color:#23623a}
    @media(max-width:900px){.clothing-builder-row{grid-template-columns:1fr}.clothing-row-copy{text-align:center}.clothing-children{gap:12px}.clothing-choice{width:162px;height:78px}.clothing-choice-image{transform:scale(.9);transform-origin:top left}.clothing-row-options{gap:7px}}
    @media(max-width:560px){.clothing-builder-card{padding:12px}.clothing-children{min-height:205px}.clothing-model-frame{width:132px;height:195px}.clothing-model-sprite{transform:scale(1.42)}.clothing-choice{width:144px;height:69px}.clothing-choice-image{transform:scale(.8)}.clothing-builder-intro h2{font-size:23px}}
  `;
  document.head.appendChild(style);
}

function applyChoice(row,value){
  if(!optionAllowed(row,value))return;
  if(row==='pants')state={pants:value,top:'',shoes:'',accessory:''};
  if(row==='top')state={...state,top:value,shoes:'',accessory:''};
  if(row==='shoes')state={...state,shoes:value,accessory:''};
  if(row==='accessory')state={...state,accessory:state.accessory===value?'':value};
  saveState();
  refreshBuilder();
}

function refreshBuilder(){
  const models=document.querySelector('.clothing-children');
  const rowsBox=document.querySelector('.clothing-builder-rows');
  if(models)models.innerHTML=modelSprite('meisje')+modelSprite('jongen');
  if(rowsBox)rowsBox.innerHTML=renderRows();
  document.querySelectorAll('.clothing-choice[data-row]').forEach(button=>button.onclick=()=>applyChoice(button.dataset.row,button.dataset.value));
}

export async function showClothing(navigate,profile){
  styles();
  state=loadState();
  document.title='Kleding | De Vosjes';
  const name=profile?.display_name||'Welkom';
  document.querySelector('#app').innerHTML=`<main class="page clothing-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wat trek ik aan?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagkalender</small></button></nav><div class="account">${name} <button id="clothing-logout">Uitloggen</button></div></header><section class="clothing-builder-card"><div class="clothing-builder-intro"><h2>Kleed de kinderen aan</h2><p>Werk van boven naar beneden. De volgende rij wordt pas actief wanneer je de vorige keuze hebt gemaakt.</p></div><div class="clothing-children"></div><div class="clothing-builder-rows"></div><div class="clothing-builder-actions"><button type="button" class="clothing-reset">Opnieuw beginnen</button></div></section></main>`;
  document.querySelector('#clothing-logout').onclick=()=>supabase.auth.signOut();
  document.querySelectorAll('.nav-item[data-page]').forEach(button=>button.onclick=()=>navigate(button.dataset.page));
  document.querySelector('.clothing-reset').onclick=()=>{state=emptyState();saveState();refreshBuilder();};
  refreshBuilder();
}
