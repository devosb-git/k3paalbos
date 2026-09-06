const ACTIVITY = 'Hoekenwerk';
const TARGET_GROUP = 'Lezen, spelen & creatief';

function moveHoekenwerk() {
  const move = (rootSelector, extraSelector, tokenSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const token = root.querySelector(`${extraSelector} ${tokenSelector}`);
    if (!token) return;

    const target = [...root.querySelectorAll('details')]
      .find(details => details.querySelector('summary')?.textContent.trim() === TARGET_GROUP);
    const palette = target?.querySelector('.activity-palette, .day-palette');
    if (!palette) return;

    palette.appendChild(token);
  };

  move(
    '.content .calendar-activity-groups',
    '[data-extra-month-group]',
    '[data-extra-calendar-activity="Hoekenwerk"]'
  );

  move(
    '.week-content .activity-groups',
    '[data-extra-week-group]',
    'button[data-extra-index]'
  );

  move(
    '.day-calendar-content .day-groups',
    '[data-extra-day-group]',
    'button[data-label="Hoekenwerk"]'
  );

  // The week extra palette contains several buttons, so identify Hoekenwerk by label
  // before moving it.
  const weekRoot = document.querySelector('.week-content .activity-groups');
  const weekTarget = [...(weekRoot?.querySelectorAll('details') || [])]
    .find(details => details.querySelector('summary')?.textContent.trim() === TARGET_GROUP);
  const weekToken = [...(weekRoot?.querySelectorAll('[data-extra-week-group] button') || [])]
    .find(button => button.querySelector('small')?.textContent.trim() === ACTIVITY);
  const weekPalette = weekTarget?.querySelector('.activity-palette');
  if (weekToken && weekPalette) weekPalette.appendChild(weekToken);
}

const app = document.querySelector('#app');
const observer = new MutationObserver(() => queueMicrotask(moveHoekenwerk));
if (app) observer.observe(app, { childList: true, subtree: true });
moveHoekenwerk();
