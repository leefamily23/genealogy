import { signIn, signOut, onAuthStateChange, handleRedirectResult } from './auth.js';
import { getAllMembers }                        from './db.js';
import { renderTree, renderDetailPanel }        from './tree.js';
import { initEditForm, openAddForm, openEditForm, openAddSpouseForm, handleDelete } from './editForm.js';
import { startHistoryPanel, stopHistoryPanel, initHistoryToggle } from './historyPanel.js';
import { openUserManagement, initUserManagement } from './userManagement.js';
import './migrate.js'; // exposes window.migrateToFirestore

// ── State ─────────────────────────────────────────────────────────────────────
let _members = [];
let _role    = null;
let _currentTab = 'genealogy'; // 'genealogy' or 'family-tree'

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Handle redirect result (for iOS sign-in)
  await handleRedirectResult();

  // Init one-time UI wiring
  initHistoryToggle();
  initUserManagement();
  initEditForm(reloadTree);

  // Initialize build info display (after other initialization)
  setTimeout(async () => {
    try {
      await initBuildInfo();
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
    ?.addEventListener('click', openUserManagement);

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

  // Global error event
  document.addEventListener('show-error', (e) => showErrorBanner(e.detail));

  // Member selected event — render detail panel in sidebar
  document.addEventListener('member-selected', (e) => {
    renderDetailPanel(e.detail, _role, _members); // Pass all members, not filtered
    wireDetailActions(e.detail);
  });

  // Auth state changes
  onAuthStateChange(async (user, role) => {
    _role = role;
    updateAuthUI(user, role);
    
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
    // Genealogy: Only show Lee surname members (李 family)
    // Check if name starts with 李 or Lee
    return members.filter(member => {
      const name = member.name || '';
      const chinese = member.chinese || '';
      
      // Check if Chinese name starts with 李
      const isLeeSurname = name.startsWith('李') || name.startsWith('Lee') || 
                          chinese.startsWith('李') || chinese.startsWith('Lee');
      
      return isLeeSurname;
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
  const userDisplay   = document.getElementById('user-display-name');

  if (user && role) {
    btnSignIn?.classList.add('hidden');
    btnSignOut?.classList.remove('hidden');
    if (userDisplay) {
      userDisplay.textContent = user.displayName || user.email;
      userDisplay.classList.remove('hidden');
    }
    if (role === 'admin') {
      btnManage?.classList.remove('hidden');
    } else {
      btnManage?.classList.add('hidden');
    }
  } else {
    btnSignIn?.classList.remove('hidden');
    btnSignOut?.classList.add('hidden');
    btnManage?.classList.add('hidden');
    if (userDisplay) {
      userDisplay.textContent = '';
      userDisplay.classList.add('hidden');
    }
  }
}

// ── Wire detail panel action buttons ─────────────────────────────────────────
function wireDetailActions(member) {
  // Check if member has children
  const hasChildren = _members.some(m => m.parentId === member.id);
  
  // Get buttons from the current detail panel content, not globally
  const detailContent = document.getElementById('sidebar-detail-content');
  if (!detailContent) return;
  
  const addChildBtn = detailContent.querySelector('.btn-add-child');
  const addSpouseBtn = detailContent.querySelector('.btn-add-spouse');
  const editBtn = detailContent.querySelector('.btn-edit');
  const deleteBtn = detailContent.querySelector('.btn-delete');
  
  // Add event listeners directly without cloning (more efficient)
  if (addChildBtn) {
    addChildBtn.onclick = () => openAddForm(member.id, _members);
  }

  if (addSpouseBtn) {
    addSpouseBtn.onclick = () => openAddSpouseForm(member.id);
  }

  if (editBtn) {
    editBtn.onclick = () => openEditForm(member);
  }

  if (deleteBtn) {
    deleteBtn.onclick = () => handleDelete(member.id, member.name, hasChildren, reloadTree);
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
/**
 * Open add child form with specific spouse context
 * @param {string} parentId - Primary parent ID
 * @param {string} spouseId - Spouse ID for the child
 */
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