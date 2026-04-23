import { getCurrentUser } from './auth.js';
import { db } from './firebase-config.js';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Edit session state
let _editModeActive = false;
let _lastEditActivity = Date.now();
let _heartbeatInterval = null;
let _sessionListener = null;
let _pageVisibilityTimer = null;

/**
 * Check if another editor is currently active
 */
async function checkActiveEditor() {
  try {
    const sessionDoc = await getDoc(doc(db, 'editSessions', 'current'));
    if (!sessionDoc.exists()) {
      return null; // No active session
    }

    const session = sessionDoc.data();
    const currentUser = getCurrentUser();
    
    // Check if session is stale (no heartbeat for 5+ minutes)
    const now = new Date();
    const lastSeen = session.lastSeen.toDate();
    const minutesSinceLastSeen = (now - lastSeen) / (1000 * 60);
    
    if (minutesSinceLastSeen > 5) {
      // Session is stale, clean it up
      await deleteDoc(doc(db, 'editSessions', 'current'));
      return null;
    }
    
    // Check if it's the same user (allow same user from different tabs)
    if (session.editorUid === currentUser?.uid) {
      return null; // Same user, allow
    }
    
    return session; // Different user is active
  } catch (err) {
    console.error('Failed to check active editor:', err);
    return null;
  }
}

/**
 * Enter edit mode - request exclusive editing access
 */
export async function enterEditMode() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('请先登录');
    return false;
  }

  // Check if another editor is active
  const activeEditor = await checkActiveEditor();
  if (activeEditor) {
    alert(`另一位编辑者 "${activeEditor.editorName}" 正在编辑\n\n请等待编辑完成后再试，或等待 5 分钟自动超时。`);
    return false;
  }

  try {
    // Create edit session
    await setDoc(doc(db, 'editSessions', 'current'), {
      editorUid: currentUser.uid,
      editorName: currentUser.displayName || currentUser.email,
      startTime: serverTimestamp(),
      lastSeen: serverTimestamp(),
      lastActivity: serverTimestamp()
    });

    _editModeActive = true;
    _lastEditActivity = Date.now();
    
    // Start heartbeat
    startHeartbeat();
    
    // Start session monitoring
    startSessionMonitoring();
    
    // Setup page visibility handling
    setupPageVisibilityHandling();
    
    // Update UI
    showEditModeUI();
    
    console.log('✏️ Entered edit mode');
    return true;
  } catch (err) {
    console.error('Failed to enter edit mode:', err);
    alert(`进入编辑模式失败: ${err.message}`);
    return false;
  }
}

/**
 * Exit edit mode - release exclusive editing access
 */
export async function exitEditMode() {
  if (!_editModeActive) return;

  try {
    // Remove edit session
    await deleteDoc(doc(db, 'editSessions', 'current'));
    
    _editModeActive = false;
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Stop session monitoring
    stopSessionMonitoring();
    
    // Clear page visibility timer
    if (_pageVisibilityTimer) {
      clearTimeout(_pageVisibilityTimer);
      _pageVisibilityTimer = null;
    }
    
    // Update UI
    hideEditModeUI();
    
    console.log('📖 Exited edit mode');
  } catch (err) {
    console.error('Failed to exit edit mode:', err);
  }
}

/**
 * Record edit activity (called when user performs edit actions)
 */
export function recordEditActivity() {
  _lastEditActivity = Date.now();
  
  // Update activity timestamp in Firestore
  if (_editModeActive) {
    updateActivityTimestamp();
  }
}

/**
 * Check if currently in edit mode
 */
export function isInEditMode() {
  return _editModeActive;
}

/**
 * Start heartbeat to maintain edit session
 */
function startHeartbeat() {
  if (_heartbeatInterval) return;
  
  _heartbeatInterval = setInterval(async () => {
    if (!_editModeActive) {
      stopHeartbeat();
      return;
    }

    const now = Date.now();
    const minutesSinceActivity = (now - _lastEditActivity) / (1000 * 60);
    const pageVisible = !document.hidden;
    
    // Auto-exit if inactive for 5+ minutes or page hidden for 2+ minutes
    if (minutesSinceActivity > 5 || (!pageVisible && minutesSinceActivity > 2)) {
      console.log('🕐 Auto-exiting edit mode due to inactivity');
      await exitEditMode();
      return;
    }
    
    // Send heartbeat
    try {
      await setDoc(doc(db, 'editSessions', 'current'), {
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Heartbeat failed:', err);
    }
  }, 30000); // Every 30 seconds
}

/**
 * Stop heartbeat
 */
function stopHeartbeat() {
  if (_heartbeatInterval) {
    clearInterval(_heartbeatInterval);
    _heartbeatInterval = null;
  }
}

/**
 * Update activity timestamp in Firestore
 */
async function updateActivityTimestamp() {
  try {
    await setDoc(doc(db, 'editSessions', 'current'), {
      lastActivity: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to update activity timestamp:', err);
  }
}

/**
 * Monitor edit session for changes (detect if session was removed by admin)
 */
function startSessionMonitoring() {
  if (_sessionListener) return;
  
  _sessionListener = onSnapshot(doc(db, 'editSessions', 'current'), (docSnapshot) => {
    if (_editModeActive && !docSnapshot.exists()) {
      // Session was removed (possibly by admin), exit edit mode
      console.log('🚨 Edit session was terminated externally');
      _editModeActive = false;
      stopHeartbeat();
      hideEditModeUI();
      alert('编辑会话已被管理员终止');
    }
  });
}

/**
 * Stop session monitoring
 */
function stopSessionMonitoring() {
  if (_sessionListener) {
    _sessionListener();
    _sessionListener = null;
  }
}

/**
 * Setup page visibility change handling
 */
function setupPageVisibilityHandling() {
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
  if (!_editModeActive) return;
  
  if (document.hidden) {
    // Page became hidden, start timer for auto-exit
    _pageVisibilityTimer = setTimeout(async () => {
      if (_editModeActive && document.hidden) {
        console.log('🙈 Auto-exiting edit mode - page hidden too long');
        await exitEditMode();
      }
    }, 120000); // 2 minutes
  } else {
    // Page became visible, cancel auto-exit timer
    if (_pageVisibilityTimer) {
      clearTimeout(_pageVisibilityTimer);
      _pageVisibilityTimer = null;
    }
    // Record activity
    recordEditActivity();
  }
}

/**
 * Show edit mode UI indicator
 */
function showEditModeUI() {
  // Create edit mode indicator if it doesn't exist
  let indicator = document.getElementById('edit-mode-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'edit-mode-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #e74c3c;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    indicator.innerHTML = `
      <span>✏️ 编辑模式</span>
      <button id="exit-edit-mode" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        cursor: pointer;
      ">完成编辑</button>
    `;
    
    document.body.appendChild(indicator);
    
    // Wire exit button
    document.getElementById('exit-edit-mode').onclick = exitEditMode;
  }
  
  indicator.style.display = 'flex';
}

/**
 * Hide edit mode UI indicator
 */
function hideEditModeUI() {
  const indicator = document.getElementById('edit-mode-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Initialize edit session system
 */
export function initEditSession() {
  // Clean up any stale sessions on page load
  setTimeout(async () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      await checkActiveEditor(); // This will clean up stale sessions
    }
  }, 1000);
  
  // Auto-exit edit mode when user signs out
  document.addEventListener('auth-state-changed', (e) => {
    if (!e.detail.user && _editModeActive) {
      exitEditMode();
    }
  });
}

/**
 * Admin function to force-terminate active edit session
 */
export async function forceTerminateEditSession() {
  try {
    await deleteDoc(doc(db, 'editSessions', 'current'));
    alert('✅ 活跃编辑会话已强制终止');
  } catch (err) {
    console.error('Failed to terminate edit session:', err);
    alert(`❌ 终止会话失败: ${err.message}`);
  }
}