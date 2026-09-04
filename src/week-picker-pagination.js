const PAGE_SIZE = 9;

function paginateOptions(options) {
  if (!options || options.dataset.paginationReady === '1') return;

  const items = [...options.querySelectorAll(':scope > .week-picker-option')];
  if (items.length <= PAGE_SIZE) return;

  options.dataset.paginationReady = '1';
  let page = 0;
  const pageCount = Math.ceil(items.length / PAGE_SIZE);

  const nav = document.createElement('div');
  nav.className = 'week-picker-page-nav';
  nav.innerHTML = `
    <button type="button" class="week-picker-page-arrow prev" aria-label="Vorige activiteiten">‹</button>
    <span class="week-picker-page-indicator"></span>
    <button type="button" class="week-picker-page-arrow next" aria-label="Meer activiteiten">›</button>
  `;
  options.insertAdjacentElement('afterend', nav);

  const prev = nav.querySelector('.prev');
  const next = nav.querySelector('.next');
  const indicator = nav.querySelector('.week-picker-page-indicator');

  function render() {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    items.forEach((item, index) => {
      item.hidden = index < start || index >= end;
    });
    prev.hidden = page === 0;
    next.hidden = page === pageCount - 1;
    indicator.textContent = `${page + 1} / ${pageCount}`;
  }

  prev.onclick = () => { page -= 1; render(); };
  next.onclick = () => { page += 1; render(); };
  render();
}

function makeNumberPickerVertical(popover) {
  const title = popover.querySelector('.week-picker-popover-head strong')?.textContent?.trim();
  if (title !== 'Kies een cijfer') return;
  popover.querySelector('.week-picker-body')?.classList.add('days');
}

function enhancePicker() {
  document.querySelectorAll('.week-picker-popover').forEach(makeNumberPickerVertical);
  document.querySelectorAll('.week-picker-popover .week-picker-options').forEach(paginateOptions);
}

const style = document.createElement('style');
style.textContent = `
  .week-picker-options > .week-picker-option[hidden] { display: none !important; }
  .week-picker-page-nav {
    display: grid;
    grid-template-columns: 36px 1fr 36px;
    align-items: center;
    margin-top: 7px;
    min-height: 34px;
  }
  .week-picker-page-arrow {
    width: 34px;
    height: 34px;
    border: 1px solid #c9ddc5;
    border-radius: 50%;
    background: #f3f8f1;
    color: #31593b;
    font-size: 25px;
    line-height: 1;
    padding: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .week-picker-page-arrow.next { justify-self: end; }
  .week-picker-page-arrow.prev { justify-self: start; }
  .week-picker-page-arrow[hidden] { visibility: hidden; display: grid !important; }
  .week-picker-page-indicator {
    text-align: center;
    color: #718576;
    font-size: 10px;
    font-weight: 800;
  }
`;
document.head.appendChild(style);

const observer = new MutationObserver(() => queueMicrotask(enhancePicker));
observer.observe(document.body, { childList: true, subtree: true });
enhancePicker();
