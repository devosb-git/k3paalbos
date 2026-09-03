import { createClient } from '@supabase/supabase-js';
import { activityIconMarkup } from './activity-icon.js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const groups = [
  { name: 'Bewegen & ontspannen', items: [['asset:buiten', 'Buiten'], ['asset:speeltijd', 'Speeltijd'], ['🏃', 'Bewegen'], ['🤸', 'Turnen'], ['🏊', 'Zwemmen'], ['🧘', 'Yoga'], ['🏅', 'Sportdag']] },
  { name: 'Samen & zorg', items: [['🤲', 'Hartje'], ['❤️', 'Zorg'], ['👥', 'Kleine groep'], ['asset:kring', 'Kring'], ['💬', 'Babbelronde'], ['🗣️', 'Gespreksmoment']] },
  { name: 'Dagritme & verzorging', items: [['asset:wc', 'WC'], ['asset:middag', 'Middag'], ['🥣', 'Soep'], ['asset:fruit', 'Fruit']] },
  { name: 'Leren', items: [['asset:wiskunde', 'Wiskunde'], ['🗣️', 'Taal'], ['🔠', 'Letters'], ['✏️', 'Schrijven'], ['🔬', 'STEM'], ['🚦', 'Verkeer'], ['🇫🇷', 'Frans']] },
  { name: 'Lezen, spelen & creatief', items: [['📚', 'Lezen'], ['🎨', 'Knutselen'], ['🎵', 'Muziek'], ['🎲', 'Opvoedende spelen'], ['🧩', 'Puzzelen'], ['🎭', 'Toneel'], ['🎬', 'Film'], ['📖', 'Voorlezen'], ['🗄️', 'Kiesbak'], ['asset:bib', 'Bib']] },
  { name: 'Op stap & bijzonder', items: [['🚌', 'Bus'], ['🚶', 'Op stap'], ['⭐', 'Speciale act.']] },
  { name: 'Feestdagen', items: [['🌷', 'Moederdag'], ['💙', 'Vaderdag'], ['🎉', 'Feest'], ['🎄', 'Kerst'], ['🐣', 'Pasen'], ['asset:sinterklaas-mijter', 'Sinterklaas'], ['asset:verjaardag', 'Verjaardag']] }
];

let dragged = null;
let calendar = null;
let activitySpotlightTimer = null;

const styles = () => {
  let s = document.getElementById('day-calendar-styles');
  if (!s) {
    s = document.createElement('style');
    s.id = 'day-calendar-styles';
    document.head.appendChild(s);
  }

  s.textContent = `
.day-calendar-content{display:flex;flex-direction:column;gap:18px;max-width:1500px;margin:0 auto;padding:0}
.day-calendar-board,.day-sidebar{width:100%;background:#fff;border:2px solid #dce9db;border-radius:20px;padding:18px;box-shadow:0 6px 18px #234c2712}
.day-calendar-board{overflow:hidden}
.day-calendar-title{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:16px}
.day-calendar-title h2{font-size:30px;color:#285d39}
.day-calendar-title p,.day-sidebar>p{color:#718176}
.day-calendar-title button{border:0;border-radius:12px;padding:10px 14px;background:#f1f6ef;color:#496153;font-weight:700;cursor:pointer}
.day-calendar-scroll{overflow-x:auto;padding-bottom:2px}
.day-row{display:grid;grid-template-columns:repeat(12,minmax(72px,1fr));min-width:900px;border:2px solid #dfe9dd;border-radius:18px;overflow:hidden;background:#fbfdf9}
.day-slot{position:relative;min-height:165px;border-right:1px solid #dfe9dd;padding:30px 6px 8px;display:flex;align-items:center;justify-content:center}
.day-slot:last-child{border-right:0}
.day-slot.afternoon-start{border-left:5px solid #8eb39a}
.slot-number{position:absolute;top:7px;left:0;right:0;text-align:center;font-size:17px;font-weight:800;color:#718176}
.day-activity{width:100%;min-height:108px;border:2px solid #e0eadf;background:#fff;border-radius:15px;padding:6px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:grab}
.day-activity span{font-size:46px;line-height:1}
.day-activity small{font-size:11px;font-weight:700;color:#496153;text-align:center}
.day-slot.over{background:#eef7ec;box-shadow:inset 0 0 0 3px #7aaa78}
.day-slot.empty-slot:after{content:'+';font-size:34px;color:#b9c9b7}
.day-slider-wrap{min-width:900px;padding:18px 0 8px}
.day-slider-label{text-align:center;color:#55705f;font-size:13px;font-weight:700;margin-bottom:10px}
.day-slider{position:relative;height:64px;margin:0 calc(100% / 24)}
.day-slider-track{position:absolute;left:0;right:0;top:31px;height:6px;border-radius:999px;background:#dfe8dd}
.day-slider-points{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between}
.day-slider-point{width:12px;height:12px;flex:0 0 12px;border:2px solid #8da08f;background:#fff;border-radius:50%}
.day-slider-point:first-child{margin-left:-6px}
.day-slider-point:last-child{margin-right:-6px}
.day-slider-knob{position:absolute;top:0;transform:translateX(-50%);width:58px;height:58px;border:2px solid #8ec0f4;border-radius:16px;background:#fff;color:#2380d8;font-size:38px;font-weight:900;line-height:1;display:grid;place-items:center;cursor:grab;touch-action:none;box-shadow:0 5px 12px #234c2720;z-index:2;user-select:none}
.day-slider-knob:active{cursor:grabbing;transform:translateX(-50%) scale(1.05)}
.day-slider-knob:disabled{cursor:default;opacity:.65}
.day-periods{display:grid;grid-template-columns:repeat(2,1fr);min-width:900px;margin-top:8px;gap:8px}
.day-period{padding:9px;text-align:center;border:0;border-radius:12px;font:inherit;font-weight:800;color:#496153;cursor:pointer}
.day-period.morning{background:#fff5d9}
.day-period.afternoon{background:#e9f3ff}
.day-period.morning.active,.day-period.afternoon.active{background:#9fd39a!important;color:#1f542f}
.day-period:disabled{cursor:default;opacity:1}
.day-sidebar h2{color:#285d39;margin-bottom:4px}
.day-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
.day-groups details{border:1px solid #e1eadf;border-radius:12px;overflow:hidden;background:#fff}
.day-groups summary{padding:10px 12px;background:#f5f9f2;font-weight:800;color:#496153;cursor:pointer}
.day-palette{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:8px}
.day-token{border:2px solid #e1eadf;background:#fbfdf9;border-radius:12px;padding:7px 3px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:grab;min-height:70px}
.day-token span{font-size:27px}
.day-token small{font-size:10px;text-align:center;color:#496153}
.day-tip{margin-top:12px;padding:11px;border-radius:12px;background:#f5f9f2;color:#55705f;font-size:13px;line-height:1.35}
.day-activity-spotlight{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(246,249,243,.32);backdrop-filter:blur(2px);pointer-events:none;animation:dayActivitySpotlight 5s ease-in-out forwards}
.day-activity-spotlight-card{width:min(440px,72vw);min-height:min(440px,72vw);padding:34px;border:3px solid #dce9db;border-radius:38px;background:rgba(255,255,255,.97);box-shadow:0 20px 55px rgba(35,76,39,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;transform:scale(.92);animation:dayActivityCard 5s ease-in-out forwards}
.day-activity-spotlight-icon{display:grid;place-items:center;width:260px;height:260px;max-width:52vw;max-height:52vw;font-size:180px;line-height:1}
.day-activity-spotlight-icon img{display:block;width:100%;height:100%;object-fit:contain}
.day-activity-spotlight-label{font-size:clamp(28px,4vw,46px);font-weight:900;color:#285d39;text-align:center;line-height:1.1}
@keyframes dayActivitySpotlight{0%{opacity:0}10%{opacity:1}84%{opacity:1}100%{opacity:0}}
@keyframes dayActivityCard{0%{transform:scale(.9)}12%{transform:scale(1)}84%{transform:scale(1)}100%{transform:scale(.96)}}
@media(max-width:1000px){.day-groups{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.day-calendar-board,.day-sidebar{padding:12px}.day-calendar-title{align-items:flex-start;flex-direction:column}.day-groups{grid-template-columns:1fr}.day-row,.day-slider-wrap,.day-periods{min-width:820px}.day-activity-spotlight-card{width:min(360px,82vw);min-height:min(360px,82vw);padding:24px}.day-activity-spotlight-icon{width:220px;height:220px;font-size:145px}}
@media(prefers-reduced-motion:reduce){.day-activity-spotlight,.day-activity-spotlight-card{animation:none}.day-activity-spotlight{opacity:1}}
`;
};

async function loadCalendar() {
  const { data, error } = await supabase
    .from('day_calendars')
    .select('id,arrow_slot,morning_active,afternoon_active')
    .order('created_at')
    .limit(1)
    .single();

  if (error) throw error;
  calendar = data;

  const { data: activities, error: aError } = await supabase
    .from('day_calendar_activities')
    .select('id,slot,icon,label')
    .eq('day_calendar_id', calendar.id)
    .order('slot');

  if (aError) throw aError;
  calendar.activities = activities || [];
}

async function saveArrow(slot) {
  const { error } = await supabase
    .from('day_calendars')
    .update({ arrow_slot: slot, updated_at: new Date().toISOString() })
    .eq('id', calendar.id);

  if (error) throw error;
  calendar.arrow_slot = slot;
}

async function saveDayPeriod(period, value) {
  const column = period === 'morning' ? 'morning_active' : 'afternoon_active';
  const { error } = await supabase
    .from('day_calendars')
    .update({ [column]: value, updated_at: new Date().toISOString() })
    .eq('id', calendar.id);

  if (error) throw error;
  calendar[column] = value;
}

async function addActivity(slot, activity) {
  if (calendar.activities.some(a => a.slot === slot)) return;

  const { data, error } = await supabase
    .from('day_calendar_activities')
    .insert({ day_calendar_id: calendar.id, slot, icon: activity.icon, label: activity.label })
    .select('id,slot,icon,label')
    .single();

  if (error) throw error;
  calendar.activities.push(data);
  calendar.activities.sort((a, b) => a.slot - b.slot);
}

async function moveActivity(from, to) {
  if (from === to) return;
  if (calendar.activities.some(a => a.slot === to)) return;

  const a = calendar.activities.find(x => x.slot === from);
  if (!a) return;

  const { error } = await supabase
    .from('day_calendar_activities')
    .update({ slot: to })
    .eq('id', a.id);

  if (error) throw error;
  a.slot = to;
  calendar.activities.sort((x, y) => x.slot - y.slot);
}

async function clearCalendar() {
  const { error: a } = await supabase
    .from('day_calendar_activities')
    .delete()
    .eq('day_calendar_id', calendar.id);

  if (a) throw a;
  await saveArrow(0);
  calendar.activities = [];
}

function showActivitySpotlight(slot) {
  const activity = calendar.activities.find(a => a.slot === slot);
  if (!activity) return;

  window.clearTimeout(activitySpotlightTimer);
  document.querySelector('.day-activity-spotlight')?.remove();

  const spotlight = document.createElement('div');
  spotlight.className = 'day-activity-spotlight';
  spotlight.setAttribute('role', 'status');
  spotlight.setAttribute('aria-live', 'polite');
  spotlight.innerHTML = `
    <div class="day-activity-spotlight-card">
      <div class="day-activity-spotlight-icon">${activityIconMarkup(activity.icon, activity.label)}</div>
      <div class="day-activity-spotlight-label">${activity.label}</div>
    </div>
  `;

  document.body.appendChild(spotlight);
  activitySpotlightTimer = window.setTimeout(() => spotlight.remove(), 5000);
}

function render(navigate, profile) {
  styles();

  const canEdit = profile.role === 'teacher';
  const slots = Array.from({ length: 12 }, (_, i) => calendar.activities.find(a => a.slot === i));
  const slotHtml = slots.map((a, i) => `
    <div class="day-slot ${i === 6 ? 'afternoon-start' : ''} ${a ? '' : 'empty-slot'}" data-slot="${i}">
      <div class="slot-number">${i + 1}</div>
      ${a ? `<div class="day-activity" draggable="true" data-index="${i}"><span>${activityIconMarkup(a.icon, a.label)}</span><small>${a.label}</small></div>` : ''}
    </div>
  `).join('');

  const groupsHtml = groups.map(g => `
    <details>
      <summary>${g.name}</summary>
      <div class="day-palette">
        ${g.items.map(([icon, label]) => `<button class="day-token" draggable="true" data-icon="${icon}" data-label="${label}"><span>${activityIconMarkup(icon, label)}</span><small>${label}</small></button>`).join('')}
      </div>
    </details>
  `).join('');

  const arrowSlot = Math.max(0, Math.min(11, Number(calendar.arrow_slot) || 0));
  const arrowLeft = `${arrowSlot * 100 / 11}%`;

  document.querySelector('#app').innerHTML = `
    <main class="page">
      <header class="topbar">
        <div class="brand"><div class="fox">🦊</div><div><h1>De Vosjes</h1><p>${profile.role === 'teacher' ? 'Beheer de activiteiten' : 'Bekijk de activiteiten'}</p></div></div>
        <nav class="main-nav">
          <button class="nav-item" data-page="calendar"><span>📅</span><small>Kalender</small></button>
          <button class="nav-item" data-page="week"><span>🗓️</span><small>Weekkalender</small></button>
          <button class="nav-item active"><span>➡️</span><small>Dagverloop</small></button>
          <button class="nav-item" data-page="weather"><span>🌤️</span><small>Weer</small></button>
          <button class="nav-item" data-page="clothing"><span>👕</span><small>Kleding</small></button>
        </nav>
        <div class="account">${profile.display_name || 'Welkom'} <button id="day-logout">Uitloggen</button></div>
      </header>

      <section class="day-calendar-content">
        <section class="day-calendar-board">
          <div class="day-calendar-title">
            <div><h2>Dagverloop</h2><p>Wat komt er vandaag? De pijl toont welke activiteit nu aan de beurt is.</p></div>
            ${canEdit ? '<button id="day-clear">🗑️ Dag leegmaken</button>' : ''}
          </div>
          <div class="day-calendar-scroll">
            <div class="day-row">${slotHtml}</div>
            <div class="day-slider-wrap">
              <div class="day-slider-label">Sleep de pijl naar links of rechts. Tik op de pijl om de huidige activiteit opnieuw te tonen.</div>
              <div class="day-slider">
                <div class="day-slider-track"></div>
                <div class="day-slider-points">${Array.from({ length: 12 }, () => '<span class="day-slider-point"></span>').join('')}</div>
                <button class="day-slider-knob" style="left:${arrowLeft}" aria-label="Toon huidige activiteit of verplaats de pijl" ${canEdit ? '' : 'disabled'}>↑</button>
              </div>
            </div>
            <div class="day-periods">
              <button type="button" class="day-period morning ${calendar.morning_active ? 'active' : ''}" data-period="morning" aria-pressed="${Boolean(calendar.morning_active)}" ${canEdit ? '' : 'disabled'}>☀️ Voormiddag</button>
              <button type="button" class="day-period afternoon ${calendar.afternoon_active ? 'active' : ''}" data-period="afternoon" aria-pressed="${Boolean(calendar.afternoon_active)}" ${canEdit ? '' : 'disabled'}>🌤️ Namiddag</button>
            </div>
          </div>
        </section>

        <section class="day-sidebar">
          <h2>Activiteiten</h2>
          <p>Sleep een pictogram naar een vakje. Er kan maar één activiteit per vakje.</p>
          <div class="day-groups">${groupsHtml}</div>
          <div class="day-tip">👉 Sleep de pijl op de slider naar de volgende activiteit. Tik op de pijl om de huidige activiteit nog eens groot te tonen.</div>
        </section>
      </section>
    </main>
  `;

  document.querySelector('#day-logout').onclick = () => supabase.auth.signOut();
  document.querySelectorAll('.nav-item[data-page]').forEach(b => b.onclick = () => navigate(b.dataset.page));

  if (!canEdit) return;

  document.querySelectorAll('.day-period[data-period]').forEach(button => {
    button.onclick = async () => {
      const period = button.dataset.period;
      const column = period === 'morning' ? 'morning_active' : 'afternoon_active';
      const previousValue = Boolean(calendar[column]);
      const nextValue = !previousValue;
      const neutralColor = period === 'morning' ? '#fff5d9' : '#e9f3ff';

      calendar[column] = nextValue;
      button.classList.toggle('active', nextValue);
      button.setAttribute('aria-pressed', String(nextValue));
      button.style.background = nextValue ? '#9fd39a' : neutralColor;
      button.style.color = nextValue ? '#1f542f' : '#496153';
      button.disabled = true;

      try {
        await saveDayPeriod(period, nextValue);
        button.disabled = false;
      } catch (e) {
        console.error(e);
        calendar[column] = previousValue;
        button.classList.toggle('active', previousValue);
        button.setAttribute('aria-pressed', String(previousValue));
        button.style.background = previousValue ? '#9fd39a' : neutralColor;
        button.style.color = previousValue ? '#1f542f' : '#496153';
        button.disabled = false;
        alert('De daghelft kon niet worden opgeslagen.');
      }
    };
  });

  document.querySelector('#day-clear').onclick = async () => {
    try {
      await clearCalendar();
      render(navigate, profile);
    } catch (e) {
      console.error(e);
      alert('Opslaan is niet gelukt. Probeer opnieuw.');
    }
  };

  document.querySelectorAll('.day-token').forEach(b => {
    const set = () => dragged = { type: 'activity', value: { icon: b.dataset.icon, label: b.dataset.label } };
    b.ondragstart = set;
    b.addEventListener('pointerdown', set);
    b.addEventListener('pointerup', e => dropActivity(e, navigate, profile));
  });

  document.querySelectorAll('.day-activity').forEach(b => {
    const set = () => {
      const a = calendar.activities.find(x => x.slot === +b.dataset.index);
      if (a) dragged = { type: 'move', from: +b.dataset.index, value: a };
    };
    b.ondragstart = set;
    b.addEventListener('pointerdown', set);
    b.addEventListener('pointerup', e => dropActivity(e, navigate, profile));
  });

  document.querySelectorAll('.day-slot').forEach(slot => {
    slot.ondragover = e => {
      e.preventDefault();
      slot.classList.add('over');
    };
    slot.ondragleave = () => slot.classList.remove('over');
    slot.ondrop = e => {
      e.preventDefault();
      slot.classList.remove('over');
      dropActivity(e, navigate, profile);
    };
  });

  bindArrowSlider(navigate, profile);
}

function bindArrowSlider(navigate, profile) {
  const slider = document.querySelector('.day-slider');
  const knob = document.querySelector('.day-slider-knob');
  if (!slider || !knob) return;

  let active = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let pendingSlot = Math.max(0, Math.min(11, Number(calendar.arrow_slot) || 0));
  const dragThreshold = 7;

  const position = e => {
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    pendingSlot = Math.max(0, Math.min(11, Math.round((x / rect.width) * 11)));
    knob.style.left = `${pendingSlot * 100 / 11}%`;
  };

  knob.addEventListener('pointerdown', e => {
    active = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    pendingSlot = Math.max(0, Math.min(11, Number(calendar.arrow_slot) || 0));
    knob.setPointerCapture(e.pointerId);
  });

  knob.addEventListener('pointermove', e => {
    if (!active) return;
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) >= dragThreshold) moved = true;
    if (moved) position(e);
  });

  knob.addEventListener('pointerup', async e => {
    if (!active) return;
    active = false;

    const previousSlot = Math.max(0, Math.min(11, Number(calendar.arrow_slot) || 0));

    if (!moved) {
      showActivitySpotlight(previousSlot);
      return;
    }

    position(e);

    try {
      await saveArrow(pendingSlot);
      render(navigate, profile);
      if (pendingSlot !== previousSlot) showActivitySpotlight(pendingSlot);
    } catch (err) {
      console.error(err);
      alert('De pijl kon niet worden opgeslagen.');
      render(navigate, profile);
    }
  });

  knob.addEventListener('pointercancel', () => {
    active = false;
    moved = false;
  });

  knob.addEventListener('keydown', async e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();

    const previousSlot = Math.max(0, Math.min(11, Number(calendar.arrow_slot) || 0));
    let slot = previousSlot;

    if (e.key === 'ArrowLeft') slot = Math.max(0, slot - 1);
    if (e.key === 'ArrowRight') slot = Math.min(11, slot + 1);
    if (e.key === 'Home') slot = 0;
    if (e.key === 'End') slot = 11;

    try {
      await saveArrow(slot);
      render(navigate, profile);
      if (slot !== previousSlot) showActivitySpotlight(slot);
    } catch (err) {
      console.error(err);
      alert('De pijl kon niet worden opgeslagen.');
    }
  });
}

async function dropActivity(e, navigate, profile) {
  const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest('.day-slot');
  if (!slot || !dragged) return;

  const index = +slot.dataset.slot;

  try {
    if (dragged.type === 'activity') await addActivity(index, dragged.value);
    else if (dragged.type === 'move') await moveActivity(dragged.from, index);
    dragged = null;
    render(navigate, profile);
  } catch (err) {
    console.error(err);
    dragged = null;
    alert('De activiteit kon niet worden opgeslagen.');
  }
}

export async function showDayCalendar(navigate, profile) {
  try {
    await loadCalendar();
    render(navigate, profile);
  } catch (error) {
    console.error('Dagverloop laden mislukt:', error);
    document.querySelector('#app').innerHTML = `<main class="page"><div style="padding:40px;text-align:center"><h2>Dagverloop kan niet geladen worden</h2><p>De gegevens konden niet uit de database worden geladen.</p><button id="day-retry">Opnieuw proberen</button></div></main>`;
    document.querySelector('#day-retry').onclick = () => showDayCalendar(navigate, profile);
  }
}