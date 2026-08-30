const weatherOptions=[
  ['☀️','Zonnig'],['🌤️','Licht bewolkt'],['☁️','Bewolkt'],['🌧️','Regen'],
  ['🌧️💧','Harde regen'],['⛈️','Onweer'],['💨','Wind'],['❄️','Sneeuw'],
  ['🌫️','Mist'],['🧊','Hagel'],['🌈','Regenboog'],['🌪️','Storm']
];
const weatherKey='k3paalbos-weather-today';
let weatherObserver=null;

const styles=`
.weather-page{min-height:100vh;padding:18px}
.weather-card{max-width:1100px;margin:0 auto;background:#fff;border:2px solid #dce9db;border-radius:28px;box-shadow:0 8px 24px #234c2712;padding:28px}
.weather-header{display:flex;align-items:center;gap:18px;margin-bottom:25px}
.weather-header .weather-fox{width:62px;height:62px;display:grid;place-items:center;background:#fff0df;border-radius:50%;font-size:38px}
.weather-header h2{color:#285d39;font-size:clamp(28px,4vw,40px);margin:0}
.weather-header p{color:#718176;margin:5px 0 0}
.weather-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.weather-option{border:3px solid #e1eadf;background:#fbfdf9;border-radius:20px;min-height:145px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;transition:.15s;touch-action:manipulation}
.weather-option:hover{background:#f1f8ef;transform:translateY(-2px)}
.weather-option.selected{border-color:#4f9a61;background:#e8f4e7;box-shadow:0 0 0 4px #d7ecd5}
.weather-option .weather-icon{font-size:52px;line-height:1.05}
.weather-option small{font-size:15px;font-weight:bold;color:#496153;text-align:center}
.weather-selected{margin-top:22px;text-align:center;padding:13px;border-radius:15px;background:#f5f9f2;color:#55705f;font-size:15px}
@media(max-width:700px){.weather-page{padding:9px}.weather-card{padding:16px;border-radius:22px}.weather-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.weather-option{min-height:125px}.weather-option .weather-icon{font-size:42px}.weather-option small{font-size:12px}}
@media(max-width:430px){.weather-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.weather-option{min-height:130px}}
`;
function addStyles(){if(document.getElementById('weather-styles'))return;const s=document.createElement('style');s.id='weather-styles';s.textContent=styles;document.head.appendChild(s)}
function savedWeather(){return localStorage.getItem(weatherKey)||''}
function setWeather(value){localStorage.setItem(weatherKey,value);renderWeather()}
function enableWeatherNav(){
  const buttons=[...document.querySelectorAll('.nav-item')];
  const weather=buttons.find(b=>b.textContent.includes('Weer'));
  if(!weather)return;
  weather.disabled=false;
  weather.dataset.weatherNav='true';
  weather.classList.toggle('active',location.hash==='#weather');
  if(weather.dataset.bound)return;
  weather.dataset.bound='true';
  weather.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'','#weather');renderWeather()});
}
function navigate(page){history.replaceState(null,'',page==='week'?'#week':'');location.reload()}
function renderWeather(){
  addStyles();
  const selected=savedWeather();
  document.title='Weer | De Vosjes';
  document.querySelector('#app').innerHTML=`<main class="weather-page"><header class="topbar"><div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>Hoe is het weer vandaag?</p></div></div><nav class="main-nav"><button class="nav-item" id="weather-calendar"><span>📅</span><small>Kalender</small></button><button class="nav-item" id="weather-week"><span>🗓️</span><small>Weekkalender</small></button><button class="nav-item active"><span>🌤️</span><small>Weer</small></button><button class="nav-item" disabled><span>👕</span><small>Kleding</small></button></nav></header><section class="weather-card"><div class="weather-header"><div class="weather-fox">🦊</div><div><h2>Hoe is het weer vandaag?</h2><p>Kies samen het pictogram dat het beste bij buiten past.</p></div></div><div class="weather-grid">${weatherOptions.map(([icon,label])=>`<button class="weather-option ${selected===label?'selected':''}" data-weather="${label}"><span class="weather-icon">${icon}</span><small>${label}</small></button>`).join('')}</div>${selected?`<div class="weather-selected">Vandaag is het <strong>${selected}</strong>. 🦊</div>`:'<div class="weather-selected">Kies een pictogram hierboven.</div>'}</section></main>`;
  document.querySelectorAll('.weather-option').forEach(b=>b.onclick=()=>setWeather(b.dataset.weather));
  document.querySelector('#weather-calendar').onclick=()=>navigate('calendar');
  document.querySelector('#weather-week').onclick=()=>navigate('week');
}

addStyles();
weatherObserver=new MutationObserver(()=>enableWeatherNav());
weatherObserver.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>{enableWeatherNav();if(location.hash==='#weather')renderWeather();else if(location.hash==='#week')setTimeout(()=>document.querySelector('.nav-item[data-page="week"]')?.click(),150)},0);
