const calendarCategoryOrder = [
  ['Bewegen & ontspannen', ['Buiten', 'Sportdag', 'Zwemmen']],
  ['Samen & zorg', ['Gespreksmoment']],
  ['Leren', ['Verkeer']],
  ['Lezen, spelen & creatief', ['Toneel', 'Film', 'Bib']],
  ['Op stap & bijzonder', ['Bus', 'Op stap', 'Speciale act.']],
  ['Feestdagen', ['Moederdag', 'Vaderdag', 'Feest', 'Kerstdag', 'Pasen', 'Sinterklaas', 'Verjaardag']],
];

function categoriseCalendarActivities() {
  const icons = document.querySelector('.panel .icons');
  if (!icons || icons.dataset.categorised === 'true') return;

  const buttons = [...icons.querySelectorAll('.icon')];
  if (!buttons.length) return;

  const byLabel = new Map(
    buttons.map(button => [button.querySelector('small')?.textContent.trim(), button])
  );

  icons.dataset.categorised = 'true';
  icons.className = 'activity-groups calendar-activity-groups';
  icons.innerHTML = '';

  calendarCategoryOrder.forEach(([name, labels], groupIndex) => {
    const details = document.createElement('details');
    details.className = 'activity-group';
    if (groupIndex === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.textContent = name;

    const palette = document.createElement('div');
    palette.className = 'activity-palette';

    labels.forEach(label => {
      const button = byLabel.get(label);
      if (!button) return;
      button.classList.remove('icon');
      button.classList.add('activity-token', 'calendar-activity-token');
      palette.appendChild(button);
    });

    details.append(summary, palette);
    icons.appendChild(details);
  });
}

const observer = new MutationObserver(categoriseCalendarActivities);
observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
categoriseCalendarActivities();
