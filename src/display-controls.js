const STORAGE_KEY = 'k3paalbos-zoom';
const MIN_ZOOM = 70;
const MAX_ZOOM = 120;
const STEP = 10;

function getZoom() {
  const value = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(value) && value >= MIN_ZOOM && value <= MAX_ZOOM ? value : 100;
}

function applyZoom(value) {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  document.documentElement.style.zoom = `${zoom}%`;
  localStorage.setItem(STORAGE_KEY, String(zoom));
  document.querySelectorAll('[data-display-zoom]').forEach(el => {
    el.textContent = `${zoom}%`;
  });
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen kon niet worden ingesteld:', error);
  }
}

function addStyles() {
  if (document.getElementById('display-controls-styles')) return;
  const style = document.createElement('style');
  style.id = 'display-controls-styles';
  style.textContent = `
    .display-controls{display:flex;align-items:center;justify-content:flex-end;gap:3px;margin-bottom:3px}
    .display-controls button{border:1px solid #dce9db;background:#fbfdf9;color:#496153;border-radius:7px;min-width:27px;height:24px;padding:1px 5px;font-weight:800;cursor:pointer;font-size:12px;line-height:1}
    .display-controls button:hover{background:#e8f4e7}
    .display-controls .display-zoom{min-width:40px;cursor:default;background:#fff}
    .display-controls .display-fullscreen{font-size:14px}
    .login-display-controls{position:absolute;top:16px;right:16px;margin:0}
    .login-page{position:relative}
    .account{display:flex!important;flex-direction:column;align-items:flex-end;gap:4px}
    .account .display-controls{order:-1;width:100%}
    @media(max-width:900px){.display-controls button{min-width:25px;padding:1px 4px}.login-display-controls{top:10px;right:10px}}
  `;
  document.head.appendChild(style);
}

function controlsHtml(className = 'display-controls') {
  return `<div class="${className}" aria-label="Scherminstellingen">
    <button type="button" data-display-minus aria-label="Uitzoomen">−</button>
    <button type="button" class="display-zoom" data-display-zoom aria-label="Zoomniveau">${getZoom()}%</button>
    <button type="button" data-display-plus aria-label="Inzoomen">+</button>
    <button type="button" class="display-fullscreen" data-display-fullscreen aria-label="Volledig scherm">⛶</button>
  </div>`;
}

function bindControls(root = document) {
  root.querySelectorAll('[data-display-minus]').forEach(button => {
    button.onclick = () => applyZoom(getZoom() - STEP);
  });
  root.querySelectorAll('[data-display-plus]').forEach(button => {
    button.onclick = () => applyZoom(getZoom() + STEP);
  });
  root.querySelectorAll('[data-display-fullscreen]').forEach(button => {
    button.onclick = toggleFullscreen;
  });
}

function addLoginControls() {
  const page = document.querySelector('.login-page');
  if (!page || page.querySelector('.login-display-controls')) return;
  page.insertAdjacentHTML('afterbegin', controlsHtml('display-controls login-display-controls'));
  bindControls(page);
}

function addNavigationControls() {
  const account = document.querySelector('.topbar .account');
  if (!account || account.querySelector('.display-controls')) return;
  account.insertAdjacentHTML('afterbegin', controlsHtml());
  bindControls(account);
}

function addControlsOnly() {
  addLoginControls();
  addNavigationControls();
}

addStyles();
applyZoom(getZoom());
addControlsOnly();
new MutationObserver(addControlsOnly).observe(document.body, {childList:true, subtree:true});
