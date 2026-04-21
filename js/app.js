import { signIn, signOut, onAuthStateChange } from './auth.js';
import { getAllMembers }                        from './db.js';
import { renderTree, renderDetailPanel }        from './tree.js';
import { initEditForm, openAddForm, openEditForm, handleDelete } from './editForm.js';
import { startHistoryPanel, stopHistoryPanel, initHistoryToggle } from './historyPanel.js';
import { openUserManagement, initUserManagement } from './userManagement.js';
import './migrate.js'; // exposes window.migrateToFirestore

// ── State ─────────────────────────────────────────────────────────────────────
let _members = [];
let _role    = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Init one-time UI wiring
  initHistoryToggle();
  initUserManagement();
  initEditForm(reloadTree);

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

  // Member selected event — render detail panel
  document.addEventListener('member-selected', (e) => {
    renderDetailPanel(e.detail, _role);
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
  document.querySelector('.btn-add-child')
    ?.addEventListener('click', () => {
      document.getElementById('detail-panel')?.classList.add('hidden');
      openAddForm(member.id);
    });

  document.querySelector('.btn-edit')
    ?.addEventListener('click', () => {
      document.getElementById('detail-panel')?.classList.add('hidden');
      openEditForm(member);
    });

  document.querySelector('.btn-delete')
    ?.addEventListener('click', () => {
      document.getElementById('detail-panel')?.classList.add('hidden');
      handleDelete(member.id, member.name, reloadTree);
    });
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function showErrorBanner(message) {
  const banner = document.getElementById('error-banner');
  const text   = document.getElementById('error-banner-text');
  if (!banner || !text) return;
  text.textContent = message;
  banner.classList.remove('hidden');
}
