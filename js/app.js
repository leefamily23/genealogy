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
  setTimeout(() => {
    try {
      initBuildInfo();
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
function initBuildInfo() {
  try {
    // Simple build info without external import
    const buildInfo = {
      version: '1.0.0',
      shortCommit: '3712136',
      commitId: '3712136e8c0d1ea3b6728c08efbc6c513e0824ff',
      branch: 'main',
      buildDate: new Date().toISOString(),
      formattedDate: new Date().toLocaleString()
    };
    
    // Log build info to console
    console.log(`🚀 Family Tree v${buildInfo.version}`);
    console.log(`📦 Commit: ${buildInfo.shortCommit} (${buildInfo.branch})`);
    console.log(`🕒 Built: ${buildInfo.formattedDate}`);
    
    // Update UI elements
    const versionEl = document.getElementById('build-version');
    const commitEl = document.getElementById('build-commit');
    
    if (versionEl) {
      versionEl.textContent = `v${buildInfo.version}`;
    }
    
    if (commitEl) {
      commitEl.textContent = buildInfo.shortCommit;
      commitEl.title = `Commit: ${buildInfo.commitId}\nBranch: ${buildInfo.branch}\nBuilt: ${buildInfo.formattedDate}`;
      
      // Make commit clickable to show full info
      commitEl.addEventListener('click', () => {
        alert(`Family Tree Build Information\n\nVersion: ${buildInfo.version}\nCommit: ${buildInfo.commitId}\nBranch: ${buildInfo.branch}\nBuild Date: ${buildInfo.formattedDate}`);
      });
    }
    
  } catch (error) {
    console.warn('Could not load build info:', error);
    
    // Fallback display
    const commitEl = document.getElementById('build-commit');
    if (commitEl) {
      commitEl.textContent = 'dev';
      commitEl.title = 'Development build';
    }
  }
}