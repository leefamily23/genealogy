import { subscribeHistory } from './db.js';

let _unsubscribe = null;
let _currentLanguage = 'zh'; // Track current language
let _cachedEntries = []; // Cache entries for re-rendering on language change

/**
 * Start listening to edit history and show in sidebar.
 * Called on sign-in.
 */
export function startHistoryPanel() {
  const section = document.getElementById('sidebar-history');
  if (section) section.classList.remove('hidden');

  _unsubscribe = subscribeHistory(renderEntries);
  
  // Listen for language changes
  document.addEventListener('language-changed', handleLanguageChange);
}

/**
 * Stop listening and hide the sidebar section.
 * Called on sign-out.
 */
export function stopHistoryPanel() {
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
  const section = document.getElementById('sidebar-history');
  if (section) section.classList.add('hidden');

  const list = document.getElementById('sidebar-history-list');
  if (list) list.innerHTML = '';
  
  // Remove language change listener
  document.removeEventListener('language-changed', handleLanguageChange);
}

/**
 * Handle language change event
 */
function handleLanguageChange(e) {
  _currentLanguage = e.detail.language;
  // Re-render cached entries with new language
  if (_cachedEntries.length > 0) {
    renderEntries(_cachedEntries);
  }
}

/**
 * Render history entries into the sidebar list.
 * @param {object[]} entries
 */
function renderEntries(entries) {
  _cachedEntries = entries; // Cache for language switching
  
  const list = document.getElementById('sidebar-history-list');
  if (!list) return;

  list.innerHTML = '';

  const isZh = _currentLanguage === 'zh';
  const noEditsText = isZh ? '暂无编辑记录' : 'No edits yet.';

  if (entries.length === 0) {
    list.innerHTML = `<li style="color: #999; text-align: center;">${noEditsText}</li>`;
    return;
  }

  entries.forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="history-actor">${escapeHtml(entry.actorName || (isZh ? '未知' : 'Unknown'))}</span>
      <span style="display: block; margin-top: 4px;">${escapeHtml(entry.description || '')}</span>
      <span class="history-time">${relativeTime(entry.timestamp, isZh)}</span>
    `;
    list.appendChild(li);
  });
}

/**
 * Compute a human-readable relative time string.
 * @param {string} isoTimestamp
 * @param {boolean} isZh - Whether to use Chinese
 * @returns {string}
 */
function relativeTime(isoTimestamp, isZh = false) {
  if (!isoTimestamp) return '';
  
  const locale = isZh ? 'zh-CN' : 'en';
  const rtf  = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
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
  return isZh ? '刚刚' : 'just now';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * No longer needed - sidebar doesn't have toggle button
 */
export function initHistoryToggle() {
  // Sidebar history is always expanded
}
