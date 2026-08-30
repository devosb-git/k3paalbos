import './calendar-blue-days.css';

const BLUE_DAYS_STORAGE_KEY = 'k3paalbos-calendar-blue-days';

function loadManualBlueDays() {
  try {
    return new Set(JSON.parse(localStorage.getItem(BLUE_DAYS_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveManualBlueDays(days) {
  localStorage.setItem(BLUE_DAYS_STORAGE_KEY, JSON.stringify([...days].sort()));
}

function weekdayForDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`).getDay();
}

function decorateCalendarBlueDays() {
  const calendar = document.querySelector('.calendar');
  if (!calendar) return;

  const manualBlueDays = loadManualBlueDays();
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
        noSchool.innerHTML = '<span>🌙</span><small>Geen school</small>';
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
      toggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const days = loadManualBlueDays();
        if (days.has(dateKey)) days.delete(dateKey);
        else days.add(dateKey);
        saveManualBlueDays(days);
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
