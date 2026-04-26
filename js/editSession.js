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
    
    // Show reminder prompt about finishing edit
    setTimeout(() => {
      alert('💡 提醒：编辑完成后请点击右上角的 "完成编辑" 按钮\n\n这样其他编辑者就可以继续编辑了。');
    }, 500);
    
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
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: editModePulse 2s ease-in-out infinite;
      border: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    indicator.innerHTML = `
      <span>✏️ 编辑模式</span>
      <button id="exit-edit-mode" style="
        background: rgba(255, 255, 255, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.25)'">完成编辑</button>
    `;
    
    // Add CSS animation for pulsing effect
    if (!document.getElementById('edit-mode-styles')) {
      const style = document.createElement('style');
      style.id = 'edit-mode-styles';
      style.textContent = `
        @keyframes editModePulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.6);
          }
        }
        
        #edit-mode-indicator:hover {
          animation-play-state: paused;
          transform: scale(1.02);
        }
        
        @media (max-width: 768px) {
          #edit-mode-indicator {
            top: 5px;
            right: 5px;
            padding: 10px 16px;
            font-size: 0.8rem;
            border-radius: 20px;
          }
          
          #exit-edit-mode {
            padding: 4px 8px;
            font-size: 0.75rem;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
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