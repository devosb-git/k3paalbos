import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const icons = [
  { icon: '🦊', label: 'Vosje' },
  { icon: '☀️', label: 'Zon' },
  { icon: '🌧️', label: 'Regen' },
  { icon: '☁️', label: 'Wolk' },
  { icon: '🌈', label: 'Regenboog' },
  { icon: '🌳', label: 'Buiten' },
  { icon: '🍎', label: 'Fruit' },
  { icon: '📚', label: 'Lezen' },
  { icon: '🎨', label: 'Knutselen' },
  { icon: '🎵', label: 'Muziek' },
  { icon: '🏃', label: 'Bewegen' },
  { icon: '🍽️', label: 'Eten' },
  { icon: '🚌', label: 'Bus' },
  { icon: '🎉', label: 'Feest' }
];

const app = document.querySelector('#app');
const now = new Date();
let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
let items = [];
let draggedIcon = null;
let statusTimer = null;

const monthNames = [
  'januari','februari','maart','april','mei','juni',
  'juli','augustus','september','oktober','november','december'
];
const dayNames = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}
function firstDayMonday(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}
function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
function isToday(date) {
  return dateKey(date) === dateKey(now);
}
function showStatus(text, good = true) {
  const el = document.querySelector('.save-status');
  if (!el) return;
  el.textContent = text;
  el.dataset.good = good;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ''; }, 2500);
}

function render() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = firstDayMonday(viewDate);
  const count = daysInMonth(viewDate);

  let cells = '';
  for (let i = 0; i < first; i++) cells += '<div class="day empty"></div>';

  for (let d = 1; d <= count; d++) {
    const date = new Date(year, month, d);
    const key = dateKey(date);
    const dayItems = items
      .filter(x => x.day === key)
      .sort((a,b) => a.position - b.position);

    cells += `
      <div class="day ${isToday(date) ? 'today' : ''}" data-day="${key}">
        <div class="day-number">${d}</div>
        <div class="day-items">
          ${dayItems.map(item => `
            <div class="placed-item" data-id="${item.id}" title="${item.label}">
              <span>${item.icon}</span>
              <small>${item.label}</small>
              <button class="remove-item" aria-label="Verwijder">×</button>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  app.innerHTML = `
    <main class="page">
      <header class="topbar">
        <div class="brand">
          <div class="fox">🦊</div>
          <div>
            <h1>De Vosjeskalender</h1>
            <p>Samen kijken wat er vandaag gebeurt</p>
          </div>
        </div>
        <div class="save-status"></div>
      </header>

      <section class="content">
        <aside class="icon-panel">
          <h2>Sleep een plaatje</h2>
          <p class="hint">Sleep een icoontje naar een dag.</p>
          <div class="icon-grid">
            ${icons.map((x, i) => `
              <button class="icon-choice" draggable="true" data-index="${i}">
                <span>${x.icon}</span><small>${x.label}</small>
              </button>
            `).join('')}
          </div>
          <button class="today-button" id="go-today">📅 Naar vandaag</button>
        </aside>

        <section class="calendar-wrap">
          <div class="calendar-head">
            <button class="nav" id="prev" aria-label="Vorige maand">‹</button>
            <h2>${monthNames[month]} ${year}</h2>
            <button class="nav" id="next" aria-label="Volgende maand">›</button>
          </div>
          <div class="weekdays">${dayNames.map(d => `<div>${d}</div>`).join('')}</div>
          <div class="calendar">${cells}</div>
        </section>
      </section>

      <footer>🦊 Een fijne dag begint met weten wat er komt.</footer>
    </main>`;

  bindEvents();
}

function bindEvents() {
  document.querySelector('#prev').onclick = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    render();
  };
  document.querySelector('#next').onclick = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    render();
  };
  document.querySelector('#go-today').onclick = () => {
    viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    render();
    document.querySelector(`[data-day="${dateKey(now)}"]`)?.scrollIntoView({behavior:'smooth', block:'center'});
  };

  document.querySelectorAll('.icon-choice').forEach(btn => {
    btn.addEventListener('dragstart', e => {
      draggedIcon = icons[Number(btn.dataset.index)];
      e.dataTransfer.effectAllowed = 'copy';
    });
    btn.addEventListener('click', () => {
      draggedIcon = icons[Number(btn.dataset.index)];
      showStatus('Kies nu een dag voor dit plaatje.');
      document.querySelectorAll('.day:not(.empty)').forEach(day => day.classList.add('drop-hint'));
      setTimeout(() => document.querySelectorAll('.drop-hint').forEach(x => x.classList.remove('drop-hint')), 5000);
    });
  });

  document.querySelectorAll('.day:not(.empty)').forEach(day => {
    day.addEventListener('dragover', e => { e.preventDefault(); day.classList.add('over'); });
    day.addEventListener('dragleave', () => day.classList.remove('over'));
    day.addEventListener('drop', async e => {
      e.preventDefault();
      day.classList.remove('over');
      if (draggedIcon) await addItem(day.dataset.day, draggedIcon);
    });
    day.addEventListener('click', async () => {
      if (draggedIcon) {
        const icon = draggedIcon;
        draggedIcon = null;
        document.querySelectorAll('.drop-hint').forEach(x => x.classList.remove('drop-hint'));
        await addItem(day.dataset.day, icon);
      }
    });
  });

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await removeItem(btn.closest('.placed-item').dataset.id);
    };
  });
}

async function loadItems() {
  if (!supabase) {
    items = JSON.parse(localStorage.getItem('vosjeskalender') || '[]');
    showStatus('Lokale opslag actief', true);
    return;
  }
  const { data, error } = await supabase.from('calendar_items').select('*');
  if (error) {
    console.error(error);
    items = JSON.parse(localStorage.getItem('vosjeskalender') || '[]');
    showStatus('Supabase nog niet ingesteld', false);
    return;
  }
  items = data || [];
}

async function addItem(day, icon) {
  const position = items.filter(x => x.day === day).length;
  if (!supabase) {
    items.push({ id: crypto.randomUUID(), day, icon: icon.icon, label: icon.label, position });
    localStorage.setItem('vosjeskalender', JSON.stringify(items));
  } else {
    const { data, error } = await supabase
      .from('calendar_items')
      .insert({ day, icon: icon.icon, label: icon.label, position })
      .select()
      .single();
    if (error) { console.error(error); showStatus('Opslaan lukt niet', false); return; }
    items.push(data);
  }
  draggedIcon = null;
  render();
  showStatus('Opgeslagen ✓');
}

async function removeItem(id) {
  if (!supabase) {
    items = items.filter(x => x.id !== id);
    localStorage.setItem('vosjeskalender', JSON.stringify(items));
  } else {
    const { error } = await supabase.from('calendar_items').delete().eq('id', id);
    if (error) { showStatus('Verwijderen lukt niet', false); return; }
    items = items.filter(x => x.id !== id);
  }
  render();
  showStatus('Verwijderd');
}

await loadItems();
render();