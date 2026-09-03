import { createClient } from '@supabase/supabase-js';
import './calendar-blue-days.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
let manualBlueDays = new Set();
let loaded = false;
let loading = null;

async function loadManualBlueDays() {
  if (loaded) return manualBlueDays;
  if (loading) return loading;
  loading = (async () => {
    const { data, error } = await supabase.from('calendar_blue_days').select('day').order('day');
    if (!error) {
      manualBlueDays = new Set((data || []).map(row => row.day));
      loaded = true;
    }
    loading = null;
    return manualBlueDays;
  })();
  return loading;
}

function weekdayForDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`).getDay();
}

async function toggleManualBlueDay(dateKey) {
  const currentlyBlue = manualBlueDays.has(dateKey);
  if (currentlyBlue) {
    const { error } = await supabase.from('calendar_blue_days').delete().eq('day', dateKey);
    if (error) return false;
    manualBlueDays.delete(dateKey);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('calendar_blue_days').insert({ day: dateKey, created_by: user.id });
    if (error) return false;
    manualBlueDays.add(dateKey);
  }
  return true;
}

async function decorateCalendarBlueDays() {
  const calendar = document.querySelector('.calendar');
  if (!calendar) return;

  await loadManualBlueDays();
  const canEdit = Boolean(document.querySelector('.content .panel:not(.readonly)'));

  calendar.querySelectorAll('.day[data-day]').forEach(day => {
    const dateKey = day.dataset.day;
    if (!dateKey) return;

    const weekday = weekdayForDateKey(dateKey);
    const isWednesday = weekday === 3;
    const isWeekend = weekday === 0 || weekday === 6;
    const manual = manualBlueDays.has(dateKey);

    day.classList.toggle('calendar-weekend', isWeekend && !manual);
    day.classList.toggle('calendar-wednesday', isWednesday && !manual);
    day.classList.toggle('calendar-blue-day', isWeekend || manual);
    day.classList.toggle('calendar-manual-blue-day', manual);

    let noSchool = day.querySelector('.wednesday-no-school');
    if (isWednesday && !manual) {
      if (!noSchool) {
        noSchool = document.createElement('div');
        noSchool.className = 'wednesday-no-school';
        noSchool.innerHTML = '<small>Geen school</small>';
        day.appendChild(noSchool);
      }
    } else {
      noSchool?.remove();
    }

    let toggle = day.querySelector('.holiday-toggle');
    if (!canEdit || isWeekend) {
      toggle?.remove();
      return;
    }

    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'holiday-toggle';
      toggle.textContent = '●';
      const stop = event => event.stopPropagation();
      toggle.addEventListener('pointerdown', stop);
      toggle.addEventListener('pointerup', stop);
      toggle.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();
        toggle.disabled = true;
        await toggleManualBlueDay(dateKey);
        toggle.disabled = false;
        decorateCalendarBlueDays();
      });
      day.appendChild(toggle);
    }

    toggle.classList.toggle('active', manual);
    toggle.setAttribute('aria-label', manual ? 'Feestdagmarkering verwijderen' : 'Als feestdag markeren');
    toggle.title = manual ? 'Blauwe feestdagmarkering uitzetten' : 'Deze dag blauw markeren als feestdag';
  });
}

const app = document.querySelector('#app');
if (app) {
  const observer = new MutationObserver(mutations => {
    const calendarChanged = mutations.some(mutation =>
      [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
        node.nodeType === 1 && (node.matches?.('.calendar, .day') || node.querySelector?.('.calendar, .day'))
      )
    );
    if (calendarChanged) decorateCalendarBlueDays();
  });
  observer.observe(app, { childList: true, subtree: true });
  decorateCalendarBlueDays();
}
