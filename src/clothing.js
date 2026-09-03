import './clothing-temperature-size.css';
import { createClient } from '@supabase/supabase-js';
import tshirt from './clothing/tshirt.png';
import sweater from './clothing/sweater.png';
import longPants from './clothing/long-pants.png';
import jacket from './clothing/jacket.png';
import sunglasses from './clothing/sunglasses.png';
import scarf from './clothing/scarf.png';
import gloves from './clothing/gloves.png';
import hat from './clothing/hat.png';
import shorts from './clothing/shorts.png';
import thermometer from './clothing/thermometer.svg';
import childDressed from './clothing/child-dressed.svg';
import koud from './clothing/koud.png';
import koel from './clothing/koel.png';
import warm from './clothing/warm.png';
import heelWarm from './clothing/heel-warm.png';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const temps = [
 ['very-cold','Zeer koud',koud,'❄️'],
 ['cold','Koud',koel,'🧣'],
 ['warm','Warm',warm,'☀️'],
 ['very-warm','Zeer warm',heelWarm,'🔥']
];
const clothes = [['tshirt','T-shirt',tshirt],['sweater','Trui',sweater],['long-pants','Lange broek',longPants],['jacket','Jas',jacket],['sunglasses','Zonnebril',sunglasses],['scarf','Sjaal',scarf],['gloves','Handschoenen',gloves],['hat','Muts',hat],['shorts','Korte broek',shorts]].map(([id,label,image]) => ({id,label,image}));
const key = 'k3paalbos-clothing';
let state = loadLocal();
function normaliseTemperature(value){return ({cool:'cold',nice:'warm',hot:'very-warm'})[value] || value || '';}
function loadLocal(){try{const saved=JSON.parse(localStorage.getItem(key));return saved?{temperature:normaliseTemperature(saved.temperature),clothes:Array.isArray(saved.clothes)?saved.clothes:[]}:{temperature:'',clothes:[]};}catch{return {temperature:'',clothes:[]};}}
function saveLocal(){localStorage.setItem(key,JSON.stringify(state));}
const todayKey = () => new Date().toISOString().slice(0,10);
async function loadState(){try{const {data}=await supabase.from('clothing_daily').select('temperature,clothes').eq('weather_date',todayKey()).maybeSingle();if(data){state={temperature:normaliseTemperature(data.temperature),clothes:Array.isArray(data.clothes)?data.clothes:[]};saveLocal();}}catch{}}
async function saveState(){saveLocal();const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from('clothing_daily').upsert({weather_date:todayKey(),temperature:state.temperature,clothes:state.clothes,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'weather_date'});if(error)console.warn('Kleding kon niet in Supabase worden opgeslagen:',error.message);}
function getFeedback(){
 if(!state.temperature)return {kind:'think',icon:'🌡️',text:'Kies eerst hoe het buiten voelt.'};
 if(!state.clothes.length)return {kind:'think',icon:'👆',text:'Kies nu zelf de kleren die erbij passen.'};
 const has=id=>state.clothes.includes(id);
 const winterExtras=['sweater','scarf','gloves','hat'].filter(has).length;
 let fits=false;
 if(state.temperature==='very-cold')fits=has('jacket')&&has('long-pants')&&winterExtras>=2;
 if(state.temperature==='cold')fits=has('long-pants')&&(has('sweater')||has('jacket'))&&!has('shorts');
 if(state.temperature==='warm')fits=has('tshirt')&&(has('shorts')||has('long-pants'))&&!has('scarf')&&!has('gloves')&&!has('hat');
 if(state.temperature==='very-warm')fits=has('tshirt')&&has('shorts')&&!has('sweater')&&!has('jacket')&&!has('scarf')&&!has('gloves')&&!has('hat');
 if(fits)return {kind:'good',icon:'🦊',text:'Goed nagedacht! Deze kleren passen bij het weer.'};
 return state.temperature==='cold'||state.temperature==='very-cold'
  ?{kind:'try',icon:'🥶',text:'Brrr… zou je het zo warm genoeg hebben? Kijk nog eens goed.'}
  :{kind:'try',icon:'🥵',text:'Oei… zou je het zo niet te warm krijgen? Kijk nog eens goed.'};
}
function styles(){
 if(document.getElementById('clothing-styles'))return;
 const s=document.createElement('style');s.id='clothing-styles';
 s.textContent=`
.clothing-page{min-height:100vh}.clothing-card{max-width:1500px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:18px;box-shadow:0 6px 18px #234c2712;padding:18px}.clothing-section+.clothing-section{border-top:2px solid #e7eee5;margin-top:18px;padding-top:18px}.clothing-heading,.outfit-intro{display:flex;align-items:center;gap:12px;margin-bottom:12px}.clothing-heading img{width:52px;height:52px;object-fit:contain}.clothing-heading h2,.outfit-intro h2{font-size:26px;color:#285d39}.clothing-heading p,.outfit-intro p{color:#718176;margin-top:2px;font-size:14px}.temperature-layout{display:grid;grid-template-columns:130px 1fr;gap:18px;align-items:center}.thermo-card{display:flex;align-items:center;justify-content:center;background:#fff8e9;border:2px solid #f0dfbd;border-radius:18px;padding:10px;min-height:150px}.thermo-card img{width:90px;height:125px;object-fit:contain}.temp-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.temp-option{position:relative;border:2px solid #e1eadf;background:#fbfdf9;border-radius:18px;padding:8px;display:flex;flex-direction:column;align-items:center;cursor:pointer}.temp-option.selected{background:#e8f4e7;border-color:#4f9a61;box-shadow:0 0 0 3px #d7ecd5}.temp-label{font-size:18px;font-weight:800;color:#315d3d;margin-top:-6px}.choice-check{display:none;position:absolute;right:7px;top:7px;width:29px;height:29px;border-radius:50%;background:#3f8d55;color:white;font-size:20px;font-weight:900;align-items:center;justify-content:center}.selected .choice-check{display:flex}.outfit-intro img{width:68px;height:82px;object-fit:contain}.clothes-grid{display:grid;grid-template-columns:repeat(auto-fit,140px);gap:10px;justify-content:center}.clothing-item{position:relative;width:140px;box-sizing:border-box;border:2px solid #e1eadf;background:#fbfdf9;border-radius:15px;padding:6px;display:flex;flex-direction:column;align-items:center;cursor:pointer}.clothing-item.selected{border-color:#4f9a61;background:#e8f4e7;box-shadow:0 0 0 3px #d7ecd5}.clothing-item img{width:100%;height:122px;object-fit:contain}.clothing-item strong{font-size:15px;color:#345e40}.clothing-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:18px}.check-outfit,.clear-outfit{border:0;border-radius:14px;padding:13px 22px;font-size:18px;font-weight:800;cursor:pointer}.check-outfit{background:#4f9a61;color:#fff;box-shadow:0 4px 0 #347345}.check-outfit:disabled{background:#aab8ac;box-shadow:0 4px 0 #89958b;cursor:not-allowed}.clear-outfit{background:#f3eee6;color:#6c6257}.clothing-feedback{max-width:720px;margin:16px auto 0;padding:15px 18px;border-radius:16px;text-align:center;font-size:19px;font-weight:750}.clothing-feedback span{font-size:29px;margin-right:8px}.clothing-feedback.good{background:#e4f4e4;color:#28613a}.clothing-feedback.try{background:#fff1d9;color:#795522}.clothing-feedback.think{background:#f5f1e8;color:#6c6257}.clothing-page .main-nav .nav-item.active{background:#e8f4e7;border-color:#cce2ca;color:#23623a}@media(max-width:900px){.temperature-layout{grid-template-columns:1fr}.thermo-card{display:none}.temp-options{grid-template-columns:repeat(2,minmax(0,1fr))}.clothes-grid{grid-template-columns:repeat(auto-fit,120px)}.clothing-item{width:120px}.clothing-item img{height:105px}}@media(max-width:560px){.clothing-card{padding:12px}.temp-options{gap:9px}.temp-label{font-size:16px}.clothes-grid{grid-template-columns:repeat(auto-fit,102px);gap:7px}.clothing-item{width:102px}.clothing-item img{height:90px}.clothing-item strong{font-size:13px}.clothing-heading h2,.outfit-intro h2{font-size:22px}}`;
 document.head.appendChild(s);
}

export async function showClothing(navigate,profile){
 styles();
 await loadState();
 document.title='Kleding | De Vosjes';
 const name=profile?.display_name || 'Welkom';
 const tempHtml=temps.map(t => `<button class="temp-option ${state.temperature===t[0]?'selected':''}" data-temp="${t[0]}" aria-label="${t[1]}" aria-pressed="${state.temperature===t[0]}"><span class="choice-check">✓</span><img class="temp-image" src="${t[2]}" alt=""><span class="temp-label">${t[3]} ${t[1]}</span></button>`).join('');
 const clothesHtml=clothes.map(c => `<button class="clothing-item ${state.clothes.includes(c.id)?'selected':''}" data-clothing="${c.id}" aria-pressed="${state.clothes.includes(c.id)}"><span class="choice-check">✓</span><img src="${c.image}" alt=""><strong>${c.label}</strong></button>`).join('');
 document.querySelector('#app').innerHTML=`<main class="page clothing-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wat trek ik aan?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagkalender</small></button></nav><div class="account">${name} <button id="clothing-logout">Uitloggen</button></div></header><section class="clothing-card"><section class="clothing-section"><div class="clothing-heading"><img src="${thermometer}" alt=""><div><h2>1. Hoe voelt het buiten?</h2><p>Kijk naar het weer en kies samen.</p></div></div><div class="temperature-layout"><div class="thermo-card"><img src="${thermometer}" alt="Thermometer"></div><div class="temp-options">${tempHtml}</div></div></section><section class="clothing-section"><div class="outfit-intro"><img src="${childDressed}" alt=""><div><h2>2. Wat trek je aan?</h2><p>Denk zelf na en kies één of meer kledingstukken.</p></div></div><div class="clothes-grid">${clothesHtml}</div><div class="clothing-actions"><button class="check-outfit" ${!state.temperature||!state.clothes.length?'disabled':''}>🦊 Controleer mijn keuze</button><button class="clear-outfit">Opnieuw kiezen</button></div><div class="clothing-feedback think" hidden></div></section></section></main>`;
 document.querySelector('#clothing-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
 const hideFeedback=()=>{document.querySelector('.clothing-feedback').hidden=true;};
 const update=()=>{
  document.querySelectorAll('.temp-option').forEach(b=>{const selected=state.temperature===b.dataset.temp;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  document.querySelectorAll('.clothing-item').forEach(b=>{const selected=state.clothes.includes(b.dataset.clothing);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  document.querySelector('.check-outfit').disabled=!state.temperature||!state.clothes.length;
 };
 const showFeedback=()=>{const result=getFeedback();const box=document.querySelector('.clothing-feedback');box.className=`clothing-feedback ${result.kind}`;box.innerHTML=`<span>${result.icon}</span>${result.text}`;box.hidden=false;};
 document.querySelectorAll('.temp-option').forEach(b=>b.onclick=()=>{state.temperature=b.dataset.temp;hideFeedback();update();void saveState();});
 document.querySelectorAll('.clothing-item').forEach(b=>b.onclick=()=>{const id=b.dataset.clothing;state.clothes=state.clothes.includes(id)?state.clothes.filter(x=>x!==id):[...state.clothes,id];hideFeedback();update();void saveState();});
 document.querySelector('.check-outfit').onclick=showFeedback;
 document.querySelector('.clear-outfit').onclick=()=>{state.clothes=[];hideFeedback();update();void saveState();};
}
