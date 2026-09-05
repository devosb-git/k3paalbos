import { createClient } from '@supabase/supabase-js';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
const storageKey='k3paalbos-clothing-builder-v1';

const clothingAssets=import.meta.glob('./clothing-builder/*.png',{eager:true,query:'?url',import:'default'});
function assetUrl(filename){return clothingAssets[`./clothing-builder/${filename}`]||'';}

const buttonFiles={
  'korte-broek':'korte-broek.png',
  'lange-broek':'lange-broek.png',
  'zwembroek':'zwembroek.png',
  'tshirt':'t-shirt.png',
  'trui':'trui.png',
  'regenjas':'regenjas.png',
  'winterjas':'winterjas.png',
  'schoenen':'gewone-schoenen.png',
  'laarzen':'laarzen.png',
  'zomer':'zomeraccessoires.png',
  'winter':'winteraccessoires.png'
};

const rows=[
  {id:'pants',title:'1. Broeken',hint:'Kies eerst een broek.',options:[['korte-broek','Korte broek'],['lange-broek','Lange broek'],['zwembroek','Zwembroek']]},
  {id:'top',title:'2. Bovenkledij',hint:'Je mag meerdere laagjes boven elkaar kiezen.',options:[['tshirt','T-shirt'],['trui','Trui'],['regenjas','Regenjas'],['winterjas','Winterjas']]},
  {id:'shoes',title:'3. Schoenen',hint:'Nu mag je schoenen kiezen.',options:[['schoenen','Gewone schoenen'],['laarzen','Laarzen']]},
  {id:'accessory',title:'4. Accessoires',hint:'Kijk tot slot of je accessoires nodig hebt.',options:[['zomer','Zomeraccessoires'],['winter','Winteraccessoires']]}
];

function emptyState(){return {pants:'',tops:[],shoes:'',accessory:''};}
function loadState(){
  try{
    const stored=JSON.parse(localStorage.getItem(storageKey)||'{}');
    const tops=Array.isArray(stored.tops)?stored.tops:(stored.top?[stored.top]:[]);
    return {...emptyState(),...stored,tops,top:undefined};
  }catch{return emptyState();}
}
let state=loadState();
function saveState(){localStorage.setItem(storageKey,JSON.stringify(state));}
function hasTop(id){return state.tops.includes(id);}
function hasAnyTop(){return state.tops.length>0;}

function visibleTopKey(){
  if(hasTop('winterjas'))return 'winterjas';
  if(hasTop('regenjas')&&hasTop('trui')&&hasTop('tshirt'))return 'tshirt-trui-regenjas';
  if(hasTop('regenjas'))return 'regenjas';
  if(hasTop('trui'))return 'trui';
  if(hasTop('tshirt'))return 'tshirt';
  return '';
}

function fallbackVisibleTopKey(){
  if(hasTop('winterjas'))return 'winterjas';
  if(hasTop('regenjas'))return 'regenjas';
  if(hasTop('trui'))return 'trui';
  if(hasTop('tshirt'))return 'tshirt';
  return '';
}

function buildModelKey(topKey){
  if(!state.pants)return 'neutraal';
  if(state.pants==='zwembroek'){
    if(!state.shoes)return 'zwembroek';
    return state.accessory==='zomer'?'zwembroek-schoenen-zomer':'zwembroek-schoenen';
  }
  let key=state.pants;
  if(topKey)key+=`-${topKey}`;
  if(state.shoes)key+=`-${state.shoes}`;
  if(state.accessory)key+=`-${state.accessory}`;
  return key;
}

function modelImage(gender){
  const preferredKey=buildModelKey(visibleTopKey());
  const fallbackKey=buildModelKey(fallbackVisibleTopKey());
  const preferred=`kleding-${gender}-${preferredKey}.png`;
  const layeredFallback=`kleding-${gender}-${fallbackKey}.png`;
  const neutral=`kleding-${gender}-neutraal.png`;
  const src=assetUrl(preferred)||assetUrl(layeredFallback)||assetUrl(neutral);
  const label=gender==='meisje'?'Meisje':'Jongen';
  return `<div class="clothing-model-frame clothing-model-${gender}"><img class="clothing-model-image" src="${src}" alt="${label}" draggable="false"></div>`;
}

function buttonImage(id,label){const src=assetUrl(buttonFiles[id]);return `<img class="clothing-choice-image" src="${src}" alt="${label}" draggable="false">`;}

function rowEnabled(row){
  if(row==='pants')return true;
  if(row==='top')return !!state.pants&&state.pants!=='zwembroek';
  if(row==='shoes')return !!state.pants&&(state.pants==='zwembroek'||hasAnyTop());
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
    if(id==='zomer')return (state.pants==='korte-broek'&&hasTop('tshirt')&&!hasTop('trui')&&!hasTop('regenjas')&&!hasTop('winterjas'))||state.pants==='zwembroek';
    if(id==='winter')return state.pants==='lange-broek'&&hasTop('winterjas');
  }
  return true;
}

function rowMessage(row){
  if(row==='top'&&state.pants==='zwembroek')return 'Bij een zwembroek ga je meteen verder naar de schoenen.';
  if(row==='top'&&!state.pants)return 'Kies eerst een broek.';
  if(row==='shoes'&&!rowEnabled('shoes'))return state.pants?'Kies eerst minstens één kledingstuk voor bovenaan.':'Kies eerst een broek en bovenkledij.';
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
      const selected=row.id==='top'?hasTop(id):state[row.id]===id;
      return `<button type="button" class="clothing-choice ${selected?'selected':''}" data-row="${row.id}" data-value="${id}" ${allowed?'':'disabled'} aria-pressed="${selected}" aria-label="${label}">${buttonImage(id,label)}<span class="clothing-choice-check">✓</span></button>`;
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
.clothing-builder-intro{text-align:left;margin:0 auto 8px}.clothing-builder-intro h2{font-size:28px;color:#285d39;margin:0}.clothing-builder-intro p{color:#718176;font-size:14px;margin:4px 0 0}
.clothing-children{display:flex;justify-content:center;align-items:flex-end;gap:34px;min-height:262px;padding:4px 0 10px}
.clothing-model-frame{width:180px;height:255px;display:grid;place-items:end center;overflow:visible;border-radius:20px;background:#fff}
.clothing-model-image{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;user-select:none;pointer-events:none}
.clothing-model-jongen{transform:translateY(7px)}
.clothing-builder-row{display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:center;padding:12px 8px;border-top:2px solid #edf2eb}.clothing-builder-row:first-of-type{border-top:0}
.clothing-row-copy h3{margin:0;color:#31593b;font-size:20px}.clothing-row-copy p{margin:3px 0 0;color:#718176;font-size:13px;line-height:1.25}.clothing-builder-row.locked .clothing-row-copy{opacity:.65}
.clothing-row-options{display:flex;justify-content:flex-start;gap:10px;flex-wrap:wrap}.clothing-choice{position:relative;width:180px;height:86px;border:2px solid #e2e9df;border-radius:15px;background:#fdf3de;padding:0;overflow:hidden;box-shadow:0 2px 5px #254d2610;transition:.12s}.clothing-choice:not(:disabled):hover{transform:translateY(-2px);border-color:#b8d7b6}.clothing-choice.selected{border-color:#4f9a61;box-shadow:0 0 0 3px #d7ecd5}.clothing-choice:disabled{opacity:.28;filter:grayscale(.35);cursor:not-allowed}.clothing-choice-image{display:block;width:100%;height:100%;object-fit:contain;user-select:none;pointer-events:none}.clothing-choice-check{display:none;position:absolute;right:6px;top:6px;width:25px;height:25px;border-radius:50%;background:#4f9a61;color:#fff;font-size:17px;font-weight:900;align-items:center;justify-content:center}.clothing-choice.selected .clothing-choice-check{display:flex}.clothing-builder-actions{display:flex;justify-content:center;margin-top:14px}.clothing-reset{border:0;border-radius:13px;background:#f3eee6;color:#6c6257;padding:10px 17px;font-weight:800}.clothing-page .main-nav .nav-item.active{background:#e8f4e7;border-color:#cce2ca;color:#23623a}
@media(max-width:900px){.clothing-builder-row{grid-template-columns:1fr}.clothing-row-copy{text-align:center}.clothing-children{gap:12px}.clothing-choice{width:162px;height:78px}.clothing-row-options{gap:7px}}
@media(max-width:560px){.clothing-builder-card{padding:12px}.clothing-children{min-height:215px}.clothing-model-frame{width:142px;height:205px}.clothing-model-jongen{transform:translateY(5px)}.clothing-choice{width:144px;height:69px}.clothing-builder-intro h2{font-size:23px}}
`;
  document.head.appendChild(style);
}

function toggleTop(value){
  let tops=[...state.tops];
  if(tops.includes(value))tops=tops.filter(item=>item!==value);
  else{
    if(value==='regenjas')tops=tops.filter(item=>item!=='winterjas');
    if(value==='winterjas')tops=tops.filter(item=>item!=='regenjas');
    tops.push(value);
  }
  state={...state,tops,shoes:'',accessory:''};
}

function applyChoice(row,value){
  if(!optionAllowed(row,value))return;
  if(row==='pants')state={pants:value,tops:[],shoes:'',accessory:''};
  if(row==='top')toggleTop(value);
  if(row==='shoes')state={...state,shoes:value,accessory:''};
  if(row==='accessory')state={...state,accessory:state.accessory===value?'':value};
  saveState();
  refreshBuilder();
}

function refreshBuilder(){
  const models=document.querySelector('.clothing-children');
  const rowsBox=document.querySelector('.clothing-builder-rows');
  if(models)models.innerHTML=modelImage('meisje')+modelImage('jongen');
  if(rowsBox)rowsBox.innerHTML=renderRows();
  document.querySelectorAll('.clothing-choice[data-row]').forEach(button=>button.onclick=()=>applyChoice(button.dataset.row,button.dataset.value));
}

export async function showClothing(navigate,profile){
  styles();
  state=loadState();
  document.title='Kleding | De Vosjes';
  const name=profile?.display_name||'Welkom';
  document.querySelector('#app').innerHTML=`<main class="page clothing-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wat trek ik aan?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagkalender</small></button></nav><div class="account">${name} <button id="clothing-logout">Uitloggen</button></div></header><section class="clothing-builder-card"><div class="clothing-builder-intro"><h2>Kleed de kinderen aan</h2><p>Werk van boven naar beneden. De volgende rij wordt pas actief wanneer je de vorige keuze hebt gemaakt.</p></div><div class="clothing-children">${modelImage('meisje')}${modelImage('jongen')}</div><div class="clothing-builder-rows">${renderRows()}</div><div class="clothing-builder-actions"><button class="clothing-reset" id="clothing-reset">Opnieuw beginnen</button></div></section></main>`;
  document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.page)));
  document.querySelectorAll('.clothing-choice[data-row]').forEach(button=>button.onclick=()=>applyChoice(button.dataset.row,button.dataset.value));
  document.getElementById('clothing-reset').onclick=()=>{state=emptyState();saveState();refreshBuilder();};
  document.getElementById('clothing-logout').onclick=async()=>{await supabase.auth.signOut();location.reload();};
}
