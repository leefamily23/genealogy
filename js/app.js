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

  // Global error event
  document.addEventListener('show-error', (e) => showErrorBanner(e.detail));

  // Member selected event — render detail panel in sidebar
  document.addEventListener('member-selected', (e) => {
    renderDetailPanel(e.detail, _role, _members);
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
  try {
    _members = await getAllMembers();
    renderTree(_members, _role);
  } catch (err) {
    // Error already shown by db.js
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
  
  // Remove any existing event listeners by cloning and replacing the buttons
  if (addChildBtn) {
    const newAddChildBtn = addChildBtn.cloneNode(true);
    addChildBtn.parentNode.replaceChild(newAddChildBtn, addChildBtn);
    newAddChildBtn.addEventListener('click', () => {
      openAddForm(member.id);
    });
  }

  if (addSpouseBtn) {
    const newAddSpouseBtn = addSpouseBtn.cloneNode(true);
    addSpouseBtn.parentNode.replaceChild(newAddSpouseBtn, addSpouseBtn);
    newAddSpouseBtn.addEventListener('click', () => {
      openAddSpouseForm(member.id);
    });
  }

  if (editBtn) {
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    newEditBtn.addEventListener('click', () => {
      openEditForm(member);
    });
  }

  if (deleteBtn) {
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    newDeleteBtn.addEventListener('click', () => {
      handleDelete(member.id, member.name, hasChildren, reloadTree);
    });
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
    // Fetch latest commit from GitHub API
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`;
    
    console.log(`🔍 Fetching latest commit from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
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
    console.error('❌ Failed to fetch from GitHub API:', error);
    throw error;
  }
}