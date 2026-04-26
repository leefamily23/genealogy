import { signIn, signOut, onAuthStateChange, handleRedirectResult, promptUsername } from './auth.js';
import { getAllMembers }                        from './db.js';
import { renderTree, renderDetailPanel, exportTreeAsImage, initRelationshipModal }        from './tree.js';
import { initEditForm, openAddForm, openEditForm, openAddSpouseForm, openAddFormWithSpouse, openAddParentForm, handleDelete } from './editForm.js';
import { startHistoryPanel, stopHistoryPanel, initHistoryToggle } from './historyPanel.js';
import { openUserManagement, initUserManagement } from './userManagement.js';
import { openBackupModal, initBackup } from './backup.js';
import { initEditSession, enterEditMode, exitEditMode, recordEditActivity, isInEditMode } from './editSession.js';
import { openEditorGuide, initEditorGuide } from './editorGuide.js';
import { applyTranslations } from './translations.js';
import './migrate.js'; // exposes window.migrateToFirestore

// ── Page View Counter ─────────────────────────────────────────────────────────
async function incrementPageViews() {
  try {
    const { doc, getDoc, setDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const { db } = await import('./firebase-config.js');
    
    const statsRef = doc(db, 'stats', 'pageViews');
    
    // Increment the counter
    await setDoc(statsRef, {
      count: increment(1),
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    // Get updated count and display it
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      const count = statsDoc.data().count;
      console.log('Page views:', count); // Debug log
      displayPageViews(count);
    } else {
      console.log('No page views document found'); // Debug log
    }
  } catch (error) {
    console.warn('Failed to update page views:', error);
  }
}

function displayPageViews(count) {
  console.log('Displaying page views:', count); // Debug log
  
  const buildInfo = document.getElementById('build-info');
  console.log('Build info element:', buildInfo); // Debug log
  
  if (buildInfo && count) {
    // Add view count to build info
    let viewsEl = document.getElementById('page-views');
    if (!viewsEl) {
      viewsEl = document.createElement('span');
      viewsEl.id = 'page-views';
      viewsEl.style.marginLeft = '10px';
      viewsEl.style.color = '#7f8c8d';
      viewsEl.style.fontSize = '0.8rem';
      viewsEl.style.display = 'inline-block';
      buildInfo.appendChild(viewsEl);
      console.log('Created page views element'); // Debug log
    }
    viewsEl.textContent = `👁️ ${count.toLocaleString()}`;
    console.log('Updated page views text:', viewsEl.textContent); // Debug log
  } else {
    console.log('Cannot display page views - buildInfo:', !!buildInfo, 'count:', count); // Debug log
  }
}

// Reset page views (admin only)
async function resetPageViews() {
  const confirmed = confirm('⚠️ 确定要重置浏览次数吗？\n\n这个操作无法撤销！');
  if (!confirmed) return;
  
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const { db } = await import('./firebase-config.js');
    
    const statsRef = doc(db, 'stats', 'pageViews');
    
    await setDoc(statsRef, {
      count: 0,
      lastUpdated: new Date().toISOString(),
      resetBy: 'admin',
      resetAt: new Date().toISOString()
    });
    
    displayPageViews(0);
    alert('✅ 浏览次数已重置为 0');
  } catch (error) {
    console.error('Failed to reset page views:', error);
    alert(`❌ 重置失败: ${error.message}`);
  }
}

// Make reset function available globally for backup modal
window.resetPageViews = resetPageViews;

// Make force terminate function available globally for backup modal (admin only)
window.forceTerminateEditSession = async () => {
  if (_role !== 'admin') {
    alert('❌ 仅管理员可以执行此操作');
    return;
  }
  
  const { forceTerminateEditSession } = await import('./editSession.js');
  await forceTerminateEditSession();
};

// ── State ─────────────────────────────────────────────────────────────────────
let _members = [];
let _role    = null;
let _currentTab = 'family-tree'; // default to 家族树 (全部)
let _currentLanguage = 'zh'; // 'zh' or 'en'

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Handle redirect result (for iOS sign-in)
  await handleRedirectResult();

  // Init one-time UI wiring
  initHistoryToggle();
  initUserManagement();
  initBackup();
  initEditForm(reloadTree);
  initEditSession();
  initEditorGuide();
  initRelationshipModal();
  
  // Apply initial translations (Chinese by default)
  applyTranslations(_currentLanguage);

  // Initialize build info display (after other initialization)
  setTimeout(async () => {
    try {
      await initBuildInfo();
      // Increment page views after build info is loaded
      await incrementPageViews();
    } catch (error) {
      console.warn('Build info initialization failed:', error);
    }
  }, 100);

  // Auth buttons
  document.getElementById('btn-sign-in')
    ?.addEventListener('click', signIn);
  document.getElementById('btn-sign-out')
    ?.addEventListener('click', signOut);
  document.getElementById('btn-manage-users')
    ?.addEventListener('click', () => {
      openUserManagement();
      // Update edit session management visibility after opening
      setTimeout(() => {
        updateEditSessionVisibilityForRole(_role);
      }, 100);
    });
  document.getElementById('btn-backup')
    ?.addEventListener('click', openBackupModal);
  document.getElementById('btn-editor-guide')
    ?.addEventListener('click', () => openEditorGuide(_role));
  document.getElementById('btn-export-image')
    ?.addEventListener('click', () => exportTreeAsImage(_currentTab));

  // Error banner close
  document.getElementById('error-banner-close')
    ?.addEventListener('click', () => {
      document.getElementById('error-banner')?.classList.add('hidden');
    });

  // Detail panel close
  document.getElementById('detail-close')
    ?.addEventListener('click', () => {
      document.getElementById('detail-panel')?.classList.add('hidden');
    });

  // Tab switching
  document.getElementById('tab-genealogy')
    ?.addEventListener('click', () => switchTab('genealogy'));
  document.getElementById('tab-family-tree')
    ?.addEventListener('click', () => switchTab('family-tree'));

  // Set default active tab UI
  document.getElementById('tab-family-tree')?.classList.add('active');
  document.getElementById('tab-genealogy')?.classList.remove('active');

  // Global error event
  document.addEventListener('show-error', (e) => showErrorBanner(e.detail));

  // Member selected event — render detail panel in sidebar
  document.addEventListener('member-selected', (e) => {
    renderDetailPanel(e.detail, _role, _members); // Pass all members, not filtered
    wireDetailActions(e.detail);
    // On mobile, open the sidebar drawer when a member is selected
    if (window.innerWidth <= 768) {
      window.openMobileSidebar();
    }
  });
  
  // Language changed event — refresh detail panel if a member is selected
  let _selectedMember = null;
  document.addEventListener('member-selected', (e) => {
    _selectedMember = e.detail;
  });
  
  document.addEventListener('language-changed', (e) => {
    _currentLanguage = e.detail.language;
    
    // Refresh detail panel if a member is currently selected
    if (_selectedMember) {
      renderDetailPanel(_selectedMember, _role, _members);
      wireDetailActions(_selectedMember);
    }
  });

  // Auth state changes
  onAuthStateChange(async (user, role) => {
    _role = role;
    updateAuthUI(user, role);
    
    // Dispatch auth state change event for edit session system
    document.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { user, role }
    }));
    
    // Reload tree data when auth state changes to ensure we have fresh data
    await reloadTree();

    if (user && role) {
      startHistoryPanel();
    } else {
      stopHistoryPanel();
    }
  });
});

// ── Reload tree from Firestore ────────────────────────────────────────────────
async function reloadTree() {
  console.log('🔄 Reloading tree data...');
  const startTime = performance.now();
  
  try {
    _members = await getAllMembers();
    console.log(`📊 Loaded ${_members.length} family members`);
    
    // Safety check for data integrity
    if (_members.length > 0) {
      const spouseCount = _members.reduce((count, member) => {
        if (member.spouses && Array.isArray(member.spouses)) {
          return count + member.spouses.length;
        }
        return member.spouse ? count + 1 : count;
      }, 0);
      console.log(`💑 Found ${spouseCount} spouse relationships`);
    }
    
    // Filter members based on current tab
    const filteredMembers = filterMembersByTab(_members, _currentTab);
    console.log(`🔍 Filtered to ${filteredMembers.length} members for ${_currentTab} view`);
    
    renderTree(filteredMembers, _role);
    
    const endTime = performance.now();
    console.log(`✅ Tree reload completed in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (err) {
    console.error('❌ Tree reload failed:', err);
    // Error already shown by db.js
  }
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
function switchTab(tabName) {
  _currentTab = tabName;
  
  // Update tab button styles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (tabName === 'genealogy') {
    document.getElementById('tab-genealogy')?.classList.add('active');
  } else {
    document.getElementById('tab-family-tree')?.classList.add('active');
  }
  
  // Reload tree with filtered data
  const filteredMembers = filterMembersByTab(_members, tabName);
  renderTree(filteredMembers, _role);
  
  console.log(`📑 Switched to ${tabName} tab`);
}

// ── Filter Members by Tab ─────────────────────────────────────────────────────
function filterMembersByTab(members, tabName) {
  if (tabName === 'genealogy') {
    // Genealogy: Only show members marked as Lee family members
    return members.filter(member => {
      // Check the isLeeFamilyMember flag
      // Default to true for backward compatibility with existing data
      return member.isLeeFamilyMember !== false;
    });
  } else {
    // Family Tree: Show all members
    return members;
  }
}

// ── Auth UI ───────────────────────────────────────────────────────────────────
function updateAuthUI(user, role) {
  const btnSignIn     = document.getElementById('btn-sign-in');
  const btnSignOut    = document.getElementById('btn-sign-out');
  const btnManage     = document.getElementById('btn-manage-users');
  const btnBackup     = document.getElementById('btn-backup');
  const btnGuide      = document.getElementById('btn-editor-guide');
  const userDisplay   = document.getElementById('user-display-name');

  if (user && role) {
    btnSignIn?.classList.add('hidden');
    btnSignOut?.classList.remove('hidden');
    if (userDisplay) {
      userDisplay.textContent = user.displayName || user.email;
      userDisplay.classList.remove('hidden');
      userDisplay.title = '点击修改显示名字';
      userDisplay.style.cursor = 'pointer';
      userDisplay.onclick = () => changeDisplayName(user);
    }
    // Show backup and guide for both admin and editor
    btnBackup?.classList.remove('hidden');
    btnGuide?.classList.remove('hidden');
    
    if (role === 'admin') {
      btnManage?.classList.remove('hidden');
    } else {
      btnManage?.classList.add('hidden');
    }
    
    // Update edit session management visibility
    updateEditSessionVisibilityForRole(role);
  } else {
    btnSignIn?.classList.remove('hidden');
    btnSignOut?.classList.add('hidden');
    btnManage?.classList.add('hidden');
    btnBackup?.classList.add('hidden');
    btnGuide?.classList.add('hidden');
    if (userDisplay) {
      userDisplay.textContent = '';
      userDisplay.classList.add('hidden');
    }
    
    // Hide edit session management when not logged in
    updateEditSessionVisibilityForRole(null);
  }
}

// ── Wire detail panel action buttons ─────────────────────────────────────────
function wireDetailActions(member) {
  // Check if member has children
  const hasChildren = _members.some(m => m.parentId === member.id);
  
  // Get buttons from the current detail panel content, not globally
  const detailContent = document.getElementById('sidebar-detail-content');
  if (!detailContent) return;
  
  const addParentBtn = detailContent.querySelector('.btn-add-parent');
  const addChildBtn = detailContent.querySelector('.btn-add-child');
  const addSpouseBtn = detailContent.querySelector('.btn-add-spouse');
  const editBtn = detailContent.querySelector('.btn-edit');
  const deleteBtn = detailContent.querySelector('.btn-delete');
  
  // Add parent button (only for root members)
  if (addParentBtn) {
    addParentBtn.onclick = async () => {
      if (await enterEditMode()) {
        recordEditActivity();
        openAddParentForm(member.id);
      }
    };
  }
  
  // Add event listeners with edit mode check
  if (addChildBtn) {
    addChildBtn.onclick = async () => {
      if (await enterEditMode()) {
        recordEditActivity();
        // Check if this member is a spouse (not in main lineage)
        const isSpouseOnly = _members.some(m => {
          if (m.spouses && Array.isArray(m.spouses)) {
            return m.spouses.includes(member.id);
          }
          return m.spouse === member.id;
        }) && !_members.some(m => m.parentId === member.id) && !member.parentId;
        
        if (isSpouseOnly) {
          // This is a spouse node - find the main lineage member they're married to
          const mainLineageMember = _members.find(m => {
            if (m.spouses && Array.isArray(m.spouses)) {
              return m.spouses.includes(member.id);
            }
            return m.spouse === member.id;
          });
          
          if (mainLineageMember) {
            // Use main lineage member as primary parent, spouse as secondary
            openAddFormWithSpouse(mainLineageMember.id, member.id, _members);
          } else {
            // Fallback to normal behavior
            openAddForm(member.id, _members);
          }
        } else {
          // Normal member - use as primary parent
          openAddForm(member.id, _members);
        }
      }
    };
  }

  if (addSpouseBtn) {
    addSpouseBtn.onclick = async () => {
      if (await enterEditMode()) {
        recordEditActivity();
        openAddSpouseForm(member.id);
      }
    };
  }

  if (editBtn) {
    editBtn.onclick = async () => {
      if (await enterEditMode()) {
        recordEditActivity();
        openEditForm(member);
      }
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (await enterEditMode()) {
        recordEditActivity();
        handleDelete(member.id, member.name, hasChildren, reloadTree);
      }
    };
  }
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function showErrorBanner(message) {
  const banner = document.getElementById('error-banner');
  const text   = document.getElementById('error-banner-text');
  if (!banner || !text) return;
  text.textContent = message;
  banner.classList.remove('hidden');
}
// ── Build Info Display ────────────────────────────────────────────────────────
async function initBuildInfo() {
  try {
    // Get real-time commit info directly from GitHub API
    const buildInfo = await fetchLatestCommitFromGitHub();
    
    // Log build info to console
    console.log(`🚀 Family Tree v${buildInfo.version}`);
    console.log(`📦 Commit: ${buildInfo.shortCommit} (${buildInfo.branch})`);
    console.log(`🕒 Last Updated: ${buildInfo.formattedDate}`);
    console.log(`🔗 Source: GitHub API (Live)`);
    
    // Update UI elements
    const versionEl = document.getElementById('build-version');
    const commitEl = document.getElementById('build-commit');
    
    if (versionEl) {
      versionEl.textContent = `v${buildInfo.version}`;
    }
    
    if (commitEl) {
      commitEl.textContent = buildInfo.shortCommit;
      commitEl.title = `Latest Commit from GitHub\nCommit: ${buildInfo.commitId}\nBranch: ${buildInfo.branch}\nDate: ${buildInfo.formattedDate}\nAuthor: ${buildInfo.author}`;
      
      // Make commit clickable to show full info
      commitEl.addEventListener('click', () => {
        alert(`Family Tree - Live from GitHub\n\nVersion: ${buildInfo.version}\nCommit: ${buildInfo.commitId}\nBranch: ${buildInfo.branch}\nAuthor: ${buildInfo.author}\nDate: ${buildInfo.formattedDate}\n\n✅ This is the REAL latest commit from GitHub!`);
      });
      
      // Add visual indicator that it's live from GitHub
      commitEl.style.cursor = 'pointer';
      commitEl.title += '\n\n🔴 LIVE from GitHub API';
    }
    
  } catch (error) {
    console.warn('Could not fetch live commit info from GitHub:', error);
    
    // Fallback display
    const commitEl = document.getElementById('build-commit');
    if (commitEl) {
      commitEl.textContent = 'offline';
      commitEl.title = 'Could not connect to GitHub API';
      commitEl.style.color = '#999';
    }
  }
}

/**
 * Fetch the latest commit information directly from GitHub API
 * This ensures we always show the REAL latest commit, not hardcoded values
 */
async function fetchLatestCommitFromGitHub() {
  // GitHub repository information - YOUR ACTUAL REPO
  const GITHUB_USER = 'leefamily23'; // Your GitHub username
  const GITHUB_REPO = 'genealogy';   // Your repository name  
  const GITHUB_BRANCH = 'main';      // Your main branch name
  
  try {
    // Fetch latest commit from GitHub API with timeout
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`;
    
    console.log(`🔍 Fetching latest commit from: ${apiUrl}`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const commitData = await response.json();
    
    // Extract commit information
    const commitId = commitData.sha;
    const shortCommit = commitId.substring(0, 7);
    const commitDate = new Date(commitData.commit.author.date);
    const author = commitData.commit.author.name;
    const message = commitData.commit.message;
    
    return {
      version: '1.0.0',
      commitId: commitId,
      shortCommit: shortCommit,
      branch: GITHUB_BRANCH,
      author: author,
      message: message,
      buildDate: commitDate.toISOString(),
      formattedDate: commitDate.toLocaleString(),
      source: 'GitHub API'
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ GitHub API request timed out');
      throw new Error('GitHub API request timed out');
    }
    console.error('❌ Failed to fetch from GitHub API:', error);
    throw error;
  }
}
// ── Change Display Name ───────────────────────────────────────────────────────
async function changeDisplayName(user) {
  const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const { db } = await import('./firebase-config.js');
  const newName = await promptUsername(user.displayName || '');
  if (!newName) return;
  try {
    await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) userDisplay.textContent = newName;
    // Update cached user display name
    user.displayName = newName;
  } catch (err) {
    console.error('Failed to update display name:', err);
  }
}

// ── Mobile Sidebar ────────────────────────────────────────────────────────────
window.openMobileSidebar = function() {
  document.getElementById('left-sidebar')?.classList.add('mobile-open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.classList.add('visible');
};

window.closeMobileSidebar = function() {
  document.getElementById('left-sidebar')?.classList.remove('mobile-open');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.classList.remove('visible');
};

// Close sidebar when tapping backdrop
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebar-backdrop')?.addEventListener('click', window.closeMobileSidebar);
});
function openAddChildWithSpouseForm(parentId, spouseId) {
  // Find the spouse member for display
  const spouse = _members.find(m => m.id === spouseId);
  const parent = _members.find(m => m.id === parentId);
  
  if (!spouse || !parent) {
    console.error('Could not find parent or spouse for child addition');
    return;
  }
  
  // Use the existing openAddForm but store spouse context
  openAddForm(parentId);
  
  // Update the modal title to show both parents
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    modalTitle.textContent = `Add Child for ${parent.name} & ${spouse.name}`;
  }
  
  // Store spouse context for form submission
  const form = document.getElementById('member-form');
  if (form) {
    form.dataset.childSpouseContext = spouseId;
  }
}

// ── Edit Session Management Visibility ────────────────────────────────────────
/**
 * Update edit session management visibility based on user role
 */
function updateEditSessionVisibilityForRole(role) {
  const editSessionSection = document.getElementById('edit-session-management');
  if (editSessionSection) {
    if (role === 'admin') {
      editSessionSection.style.display = 'block';
    } else {
      editSessionSection.style.display = 'none';
    }
  }
}

// Make force terminate function available globally (admin only)
window.forceTerminateEditSession = async () => {
  if (_role !== 'admin') {
    alert('❌ 仅管理员可以执行此操作');
    return;
  }
  
  const { forceTerminateEditSession } = await import('./editSession.js');
  await forceTerminateEditSession();
};