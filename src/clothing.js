import './clothing-temperature-size.css';
import { createClient } from '@supabase/supabase-js';
import tshirt from './clothing/tshirt.svg';
import sweater from './clothing/sweater.svg';
import longPants from './clothing/long-pants.svg';
import jacket from './clothing/jacket.svg';
import sunglasses from './clothing/sunglasses.svg';
import scarf from './clothing/scarf.svg';
import gloves from './clothing/gloves.svg';
import hat from './clothing/hat.svg';
import shorts from './clothing/shorts.svg';
import thermometer from './clothing/thermometer.svg';
import childDressed from './clothing/child-dressed.svg';
import koud from './clothing/koud.svg';
import koel from './clothing/koel.svg';
import lekker from './clothing/lekker.svg';
import warm from './clothing/warm.svg';
import heelWarm from './clothing/heel-warm.svg';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const temps = [['cold','Koud',koud],['cool','Koel',koel],['nice','Lekker',lekker],['warm','Warm',warm],['hot','Heel warm',heelWarm]];
const clothes = [['tshirt','T-shirt',tshirt],['sweater','Trui',sweater],['long-pants','Lange broek',longPants],['jacket','Jas',jacket],['sunglasses','Zonnebril',sunglasses],['scarf','Sjaal',scarf],['gloves','Handschoenen',gloves],['hat','Muts',hat],['shorts','Korte broek',shorts]].map(([id,label,image]) => ({id,label,image}));
const key = 'k3paalbos-clothing';
let state = loadLocal();
function loadLocal(){try{return JSON.parse(localStorage.getItem(key)) || {temperature:'',clothes:[]};}catch{return {temperature:'',clothes:[]};}}
function saveLocal(){localStorage.setItem(key,JSON.stringify(state));}
const todayKey = () => new Date().toISOString().slice(0,10);
async function loadState(){try{const {data}=await supabase.from('clothing_daily').select('temperature,clothes').eq('weather_date',todayKey()).maybeSingle();if(data){state={temperature:data.temperature||'',clothes:Array.isArray(data.clothes)?data.clothes:[]};saveLocal();}}catch{}}
async function saveState(){saveLocal();const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from('clothing_daily').upsert({weather_date:todayKey(),temperature:state.temperature,clothes:state.clothes,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'weather_date'});if(error)console.warn('Kleding kon niet in Supabase worden opgeslagen:',error.message);}
function styles(){
 if(document.getElementById('clothing-styles'))return;
 const s=document.createElement('style');s.id='clothing-styles';
 s.textContent=`
.clothing-page{min-height:100vh}.clothing-card{max-width:1500px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:18px;box-shadow:0 6px 18px #234c2712;padding:18px}.clothing-section+.clothing-section{border-top:2px solid #e7eee5;margin-top:18px;padding-top:18px}.clothing-heading{display:flex;align-items:center;gap:12px;margin-bottom:12px}.clothing-heading img{width:52px;height:52px;object-fit:contain;border-radius:14px}.clothing-heading h2,.outfit-intro h2{font-size:26px;color:#285d39}.clothing-heading p,.outfit-intro p{color:#718176;margin-top:2px;font-size:14px}.temperature-layout{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center}.thermo-card{display:flex;align-items:center;justify-content:center;background:#fff8e9;border:2px solid #f0dfbd;border-radius:18px;padding:10px;min-height:150px}.thermo-card img{width:90px;height:125px;object-fit:contain}.temp-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.temp-option{border:0;background:transparent;border-radius:14px;min-height:125px;padding:4px;display:flex;align-items:center;justify-content:center;cursor:pointer}.temp-option.selected{background:#e8f4e7;box-shadow:0 0 0 3px #4f9a61}.temp-image{width:100%;height:100%;max-width:105px;max-height:105px;object-fit:contain}.outfit-intro{display:flex;align-items:center;gap:12px;margin-bottom:12px}.outfit-intro img{width:68px;height:82px;object-fit:contain}.clothes-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.clothing-item{border:2px solid #e1eadf;background:#fbfdf9;border-radius:15px;min-height:145px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer}.clothing-item.selected{border-color:#4f9a61;background:#e8f4e7;box-shadow:0 0 0 3px #d7ecd5}.clothing-item img{width:85px;height:82px;object-fit:contain}.clothing-item strong{font-size:14px;color:#496153}.clothing-note{margin-top:12px;padding:9px 12px;border-radius:12px;background:#f5f9f2;color:#55705f;text-align:center;font-size:14px}.clothing-page .main-nav .nav-item.active{background:#e8f4e7;border-color:#cce2ca;color:#23623a}@media(max-width:900px){.temperature-layout{grid-template-columns:1fr}.thermo-card{min-height:130px}.clothes-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:560px){.clothing-card{padding:12px}.temp-options{grid-template-columns:repeat(2,minmax(0,1fr))}.temp-option{min-height:105px}.clothes-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.clothing-item{min-height:135px}.clothing-item img{width:75px;height:72px}.clothing-heading img{width:48px;height:48px}.outfit-intro img{width:60px;height:72px}}`;
 document.head.appendChild(s);
}

export async function showClothing(navigate,profile){
 styles();
 await loadState();
 document.title='Kleding | De Vosjes';
 const name=profile?.display_name || 'Welkom';
 const selectedText=state.clothes.length ? 'Gekozen: ' + state.clothes.map(id => clothes.find(c => c.id===id)?.label).filter(Boolean).join(', ') : 'Tik op de kleren die jullie vandaag willen aantrekken.';
 const tempHtml=temps.map(t => `<button class="temp-option ${state.temperature===t[0]?'selected':''}" data-temp="${t[0]}" aria-label="${t[1]}"><img class="temp-image" src="${t[2]}" alt="${t[1]}"></button>`).join('');
 const clothesHtml=clothes.map(c => `<button class="clothing-item ${state.clothes.includes(c.id)?'selected':''}" data-clothing="${c.id}"><img src="${c.image}" alt="${c.label}"><strong>${c.label}</strong></button>`).join('');
 document.querySelector('#app').innerHTML=`<main class="page clothing-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Wat trek ik aan?</p></div></div><nav class="main-nav"><button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>👕</span><small>Kleding</small></button><button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button><button class="nav-item" data-page="day"><span>➡️</span><small>Dagkalender</small></button></nav><div class="account">${name} <button id="clothing-logout">Uitloggen</button></div></header><section class="clothing-card"><section class="clothing-section"><div class="clothing-heading"><img src="${thermometer}" alt="Thermometer"><div><h2>Hoe warm is het?</h2><p>Kies samen hoe warm het buiten is.</p></div></div><div class="temperature-layout"><div class="thermo-card"><img src="${thermometer}" alt="Kleurrijke thermometer"></div><div class="temp-options">${tempHtml}</div></div></section><section class="clothing-section"><div class="outfit-intro"><img src="${childDressed}" alt="Kind met kleren"><div><h2>Wat trek ik aan?</h2><p>Kies de kleren die passen bij het weer.</p></div></div><div class="clothes-grid">${clothesHtml}</div><div class="clothing-note">${selectedText}</div></section></section></main>`;
 document.querySelector('#clothing-logout').onclick=()=>supabase.auth.signOut();
 document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
 document.querySelectorAll('.temp-option').forEach(b=>b.onclick=async()=>{state.temperature=b.dataset.temp;await saveState();showClothing(navigate,profile);});
 document.querySelectorAll('.clothing-item').forEach(b=>b.onclick=async()=>{const id=b.dataset.clothing;state.clothes=state.clothes.includes(id)?state.clothes.filter(x=>x!==id):[...state.clothes,id];await saveState();showClothing(navigate,profile);});
}
