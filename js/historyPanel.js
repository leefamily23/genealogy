import { subscribeHistory } from './db.js';

let _unsubscribe = null;

/**
 * Start listening to edit history and show the panel.
 * Called on sign-in.
 */
export function startHistoryPanel() {
  const panel = document.getElementById('history-panel');
  if (panel) panel.classList.remove('hidden');

  _unsubscribe = subscribeHistory(renderEntries);
}

/**
 * Stop listening and hide the panel.
 * Called on sign-out.
 */
export function stopHistoryPanel() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  const panel = document.getElementById('history-panel');
  if (panel) panel.classList.add('hidden');

  const list = document.getElementById('history-list');
  if (list) list.innerHTML = '';
}

/**
 * Render history entries into the panel list.
 * @param {object[]} entries
 */
function renderEntries(entries) {
  const list = document.getElementById('history-list');
  if (!list) return;

  list.innerHTML = '';

  if (entries.length === 0) {
    list.innerHTML = '<li class="history-empty">No edits yet.</li>';
    return;
  }

  entries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-entry';
    li.innerHTML = `
      <span class="history-actor">${escapeHtml(entry.actorName || 'Unknown')}</span>
      <span class="history-desc">${escapeHtml(entry.description || '')}</span>
      <span class="history-time">${relativeTime(entry.timestamp)}</span>
    `;
    list.appendChild(li);
  });
}

/**
 * Compute a human-readable relative time string.
 * @param {string} isoTimestamp
 * @returns {string}
 */
function relativeTime(isoTimestamp) {
  if (!isoTimestamp) return '';
  const rtf  = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff  = (new Date(isoTimestamp) - Date.now()) / 1000; // seconds, negative = past

  const units = [
    { unit: 'year',   secs: 31536000 },
    { unit: 'month',  secs: 2592000  },
    { unit: 'week',   secs: 604800   },
    { unit: 'day',    secs: 86400    },
    { unit: 'hour',   secs: 3600     },
    { unit: 'minute', secs: 60       },
    { unit: 'second', secs: 1        },
  ];

  for (const { unit, secs } of units) {
    if (Math.abs(diff) >= secs) {
      return rtf.format(Math.round(diff / secs), unit);
    }
  }
  return 'just now';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wire the collapse/expand toggle button.
 * Called once on DOMContentLoaded.
 */
export function initHistoryToggle() {
  const toggle = document.getElementById('history-toggle');
  const list   = document.getElementById('history-list');
  if (!toggle || !list) return;

  toggle.addEventListener('click', () => {
    const isCollapsed = list.classList.toggle('collapsed');
    toggle.textContent = isCollapsed ? '▼' : '▲';
  });
}
