// Mobile debugging helper
// Shows errors and debug info on screen for mobile testing

const debugPanel = document.createElement('div');
debugPanel.id = 'mobile-debug';
debugPanel.style.cssText = `
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0,0,0,0.9);
  color: #0f0;
  font-family: monospace;
  font-size: 11px;
  padding: 10px;
  z-index: 10000;
  display: none;
`;

document.body.appendChild(debugPanel);

function log(message, type = 'info') {
  const colors = {
    info: '#0f0',
    error: '#f00',
    warn: '#ff0',
    success: '#0ff'
  };
  
  const entry = document.createElement('div');
  entry.style.color = colors[type] || colors.info;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  debugPanel.appendChild(entry);
  debugPanel.style.display = 'block';
  debugPanel.scrollTop = debugPanel.scrollHeight;
  
  console.log(message);
}

// Capture console errors
window.addEventListener('error', (e) => {
  log(`ERROR: ${e.message} at ${e.filename}:${e.lineno}`, 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  log(`PROMISE ERROR: ${e.reason}`, 'error');
});

// Override console methods
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  log(args.join(' '), 'info');
  originalLog.apply(console, args);
};

console.error = (...args) => {
  log(args.join(' '), 'error');
  originalError.apply(console, args);
};

console.warn = (...args) => {
  log(args.join(' '), 'warn');
  originalWarn.apply(console, args);
};

// Device info
log(`Device: ${navigator.userAgent}`, 'info');
log(`Screen: ${window.innerWidth}x${window.innerHeight}`, 'info');
log(`D3 loaded: ${typeof d3 !== 'undefined'}`, 'info');

// Check if tree container exists
setTimeout(() => {
  const container = document.getElementById('tree-container');
  const svg = document.getElementById('tree-svg');
  const group = document.getElementById('tree-group');
  
  log(`Container: ${container ? 'found' : 'missing'}`, container ? 'success' : 'error');
  log(`SVG: ${svg ? 'found' : 'missing'}`, svg ? 'success' : 'error');
  log(`Group: ${group ? 'found' : 'missing'}`, group ? 'success' : 'error');
  
  if (group) {
    log(`Group children: ${group.children.length}`, 'info');
  }
}, 2000);

// Toggle debug panel on triple tap
let tapCount = 0;
let tapTimer;
document.addEventListener('touchstart', () => {
  tapCount++;
  clearTimeout(tapTimer);
  
  if (tapCount === 3) {
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    tapCount = 0;
  }
  
  tapTimer = setTimeout(() => {
    tapCount = 0;
  }, 500);
});

window.mobileDebug = {
  log,
  clear: () => {
    debugPanel.innerHTML = '';
  },
  hide: () => {
    debugPanel.style.display = 'none';
  },
  show: () => {
    debugPanel.style.display = 'block';
  }
};

log('Mobile debug ready. Triple-tap to toggle.', 'success');
