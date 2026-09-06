const ACTIVITY = 'Hoekenwerk';
const TARGET_GROUP = 'Lezen, spelen & creatief';

function moveHoekenwerk() {
  const move = (rootSelector, extraSelector, tokenFinder) => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const tokens = [...root.querySelectorAll(`${extraSelector} button` )];
    const token = tokens.find(tokenFinder);
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
    button => button.dataset.extraCalendarActivity === ACTIVITY
  );

  move(
    '.week-content .activity-groups',
    '[data-extra-week-group]',
    button => button.querySelector('small')?.textContent.trim() === ACTIVITY
  );

  move(
    '.day-calendar-content .day-groups',
    '[data-extra-day-group]',
    button => button.dataset.label === ACTIVITY
  );
}

const app = document.querySelector('#app');
const observer = new MutationObserver(() => queueMicrotask(moveHoekenwerk));
if (app) observer.observe(app, { childList: true, subtree: true });
moveHoekenwerk();
