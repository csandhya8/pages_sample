
// assets/app.js

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function setStatus(msg, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.style.color = type === 'error' ? 'var(--err)' : 'var(--muted)';
}

function setOptions(select, items, placeholderText) {
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderText;
  select.appendChild(placeholder);

  for (const item of items) {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  }
}

function saveSelection(app) {
  localStorage.setItem('selectedApp', app || '');
}
function loadSelection() {
  try { return localStorage.getItem('selectedApp') || ''; } catch { return ''; }
}

function updateOutputs({ app, pkg, desc }) {
  document.getElementById('appOut').textContent = app || '—';
  document.getElementById('pkgOut').textContent = pkg || '—';
  document.getElementById('descOut').textContent = desc || '—';
}

async function init() {
  const appSel = document.getElementById('appSel');
  const clearBtn = document.getElementById('clearBtn');
  const reloadBtn = document.getElementById('reloadBtn');

  setStatus('Loading data…');

  let data;
  try {
    // IMPORTANT: keep your uploaded file at /data/sample.json
    data = await fetchJSON('data/sample.json');
  } catch (err) {
    console.error(err);
    setStatus(err.message, 'error');
    return;
  }

  setStatus('');

  // Collect all apps from RULE_TARGET_APP_LISTS
  // It has keys like CM_CodeDepot_AppName, CM_OPT_AppName, CM_UHC_AppName
  const rtl = data.RULE_TARGET_APP_LISTS || {};
  const allApps = Object.values(rtl)
    .flat()
    .filter((x, i, arr) => arr.indexOf(x) === i) // unique
    .sort((a, b) => a.localeCompare(b));

  setOptions(appSel, allApps, 'Select an App');

  // Preselect from localStorage (if exists)
  const savedApp = loadSelection();
  if (savedApp && allApps.includes(savedApp)) {
    appSel.value = savedApp;
    const pkgKey = `${savedApp}_Rules_PackageName`;
    const pkgVal = (data.RULES_PACKAGE_LIST && data.RULES_PACKAGE_LIST[pkgKey]) || '';
    const pkg = Array.isArray(pkgVal) ? pkgVal[0] : (pkgVal || '');
    const descKey = `${savedApp}_Rules_PackageDescription`;
    const descVal = (data.RULES_PACKAGE_DESCRIPTION && data.RULES_PACKAGE_DESCRIPTION[descKey]) || '';
    const desc = Array.isArray(descVal) ? descVal[0] : (descVal || '');
    updateOutputs({ app: savedApp, pkg, desc });
  } else {
    updateOutputs({ app: '', pkg: '', desc: '' });
  }

  // On app change → show package name
  appSel.addEventListener('change', () => {
    const app = appSel.value;
    const pkgKey = `${app}_Rules_PackageName`;
    const pkgVal = (data.RULES_PACKAGE_LIST && data.RULES_PACKAGE_LIST[pkgKey]) || '';
    const pkg = Array.isArray(pkgVal) ? pkgVal[0] : (pkgVal || '');

    const descKey = `${app}_Rules_PackageDescription`;
    const descVal = (data.RULES_PACKAGE_DESCRIPTION && data.RULES_PACKAGE_DESCRIPTION[descKey]) || '';
    const desc = Array.isArray(descVal) ? descVal[0] : (descVal || '');

    saveSelection(app);
    updateOutputs({ app, pkg, desc });
  });

  clearBtn.addEventListener('click', () => {
    localStorage.removeItem('selectedApp');
    appSel.value = '';
    updateOutputs({ app: '', pkg: '', desc: '' });
    setStatus('Cleared.', 'info');
  });

  reloadBtn.addEventListener('click', () => {
    init(); // re-fetch
  });
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
