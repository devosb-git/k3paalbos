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

function isAutomaticBlueDay(dateKey) {
  const weekday = weekdayForDateKey(dateKey);
  return weekday === 0 || weekday === 3 || weekday === 6;
}

function updateToggle(toggle, manual) {
  toggle.classList.toggle('active', manual);
  toggle.setAttribute('aria-label', manual ? 'Feestdagmarkering verwijderen' : 'Als feestdag markeren');
  toggle.title = manual ? 'Blauwe feestdagmarkering uitzetten' : 'Deze dag blauw markeren als feestdag';
}

function decorateCalendarBlueDays() {
  const calendar = document.querySelector('.calendar');
  if (!calendar) return;

  const manualBlueDays = loadManualBlueDays();
  const canEdit = Boolean(document.querySelector('.content .panel:not(.readonly)'));

  calendar.querySelectorAll('.day[data-day]').forEach(day => {
    const dateKey = day.dataset.day;
    if (!dateKey) return;

    const automatic = isAutomaticBlueDay(dateKey);
    const manual = manualBlueDays.has(dateKey);
    day.classList.toggle('calendar-blue-day', automatic || manual);
    day.classList.toggle('calendar-manual-blue-day', manual);

    let toggle = day.querySelector('.holiday-toggle');

    if (!canEdit || automatic) {
      if (toggle) toggle.remove();
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
        const currentDateKey = toggle.closest('.day[data-day]')?.dataset.day;
        if (!currentDateKey) return;
        const days = loadManualBlueDays();
        if (days.has(currentDateKey)) days.delete(currentDateKey);
        else days.add(currentDateKey);
        saveManualBlueDays(days);
        decorateCalendarBlueDays();
      });

      day.appendChild(toggle);
    }

    updateToggle(toggle, manual);
  });
}

const app = document.querySelector('#app');
if (app) {
  let scheduled = false;
  const observer = new MutationObserver(mutations => {
    const calendarChanged = mutations.some(mutation =>
      [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches?.('.calendar, .day[data-day]') || node.querySelector?.('.calendar, .day[data-day]'))
      )
    );

    if (!calendarChanged || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorateCalendarBlueDays();
    });
  });

  observer.observe(app, { childList: true, subtree: true });
  decorateCalendarBlueDays();
}
