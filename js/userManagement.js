import * as db from './db.js';
import { getCurrentUser } from './auth.js';
import { isEmailNotificationsEnabled, toggleEmailNotifications } from './emailNotifications.js';

/**
 * Open the user management modal and populate the user list.
 */
export async function openUserManagement() {
  const modal = document.getElementById('user-mgmt-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  await refreshUserList();
  await loadEmailNotificationsStatus();
  updateEditSessionManagementVisibility();
}

/**
 * Update edit session management visibility based on user role
 */
function updateEditSessionManagementVisibility() {
  // Visibility will be controlled by app.js based on user role
  // Don't hide it here, let the role-based function handle it
}

/**
 * Load and display email notifications status
 */
async function loadEmailNotificationsStatus() {
  const container = document.getElementById('email-notifications-section');
  if (!container) return;
  
  try {
    const enabled = await isEmailNotificationsEnabled();
    const toggle = container.querySelector('#email-notifications-toggle');
    
    if (toggle) {
      toggle.checked = enabled;
      toggle.addEventListener('change', async (e) => {
        const actor = getCurrentUser();
        await toggleEmailNotifications(e.target.checked, actor?.uid || '', actor?.displayName || actor?.email || 'Unknown');
        updateEmailNotificationsUI(e.target.checked);
      });
    }
    
    updateEmailNotificationsUI(enabled);
  } catch (error) {
    console.error('Error loading email notifications status:', error);
  }
}

/**
 * Update email notifications UI
 */
function updateEmailNotificationsUI(enabled) {
  const statusEl = document.getElementById('email-notifications-status');
  if (statusEl) {
    statusEl.textContent = enabled ? '✅ 已启用' : '❌ 已禁用';
    statusEl.style.color = enabled ? '#27ae60' : '#c0392b';
  }
}

/**
 * Close the user management modal.
 */
export function closeUserManagement() {
  const modal = document.getElementById('user-mgmt-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Refresh the user list inside the modal.
 */
async function refreshUserList() {
  const container = document.getElementById('user-list-container');
  if (!container) return;

  container.innerHTML = '<p>Loading...</p>';

  try {
    const users = await db.listAllUsers();
    if (users.length === 0) {
      container.innerHTML = '<p>No users found.</p>';
      return;
    }

    container.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('div');
      row.className = 'user-row';
      row.innerHTML = `
        <div class="user-info">
          <span class="user-name">${escapeHtml(user.displayName || '—')}</span>
          <span class="user-email">${escapeHtml(user.email || user.uid)}</span>
          <span class="user-role role-${user.role}">${user.role}${user.status === 'pending' ? ' (pending)' : ''}</span>
        </div>
        <div class="user-actions">
          ${user.role === 'editor'
            ? `<button class="btn-promote" data-uid="${user.uid}">Promote to Admin</button>`
            : `<button class="btn-demote"  data-uid="${user.uid}">Demote to Editor</button>`
          }
          <button class="btn-remove" data-uid="${user.uid}" data-email="${escapeHtml(user.email || user.uid)}">Remove</button>
        </div>
      `;
      container.appendChild(row);
    });

    // Wire action buttons
    container.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => promoteUser(btn.dataset.uid));
    });
    container.querySelectorAll('.btn-demote').forEach(btn => {
      btn.addEventListener('click', () => demoteUser(btn.dataset.uid));
    });
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => removeUser(btn.dataset.uid, btn.dataset.email));
    });

  } catch (err) {
    container.innerHTML = `<p style="color:red">Failed to load users: ${err.message}</p>`;
  }
}

async function promoteUser(uid) {
  const actor = getCurrentUser();
  const actorName = actor?.displayName || actor?.email || 'Unknown';
  try {
    const users = await db.listAllUsers();
    const target = users.find(u => u.uid === uid);
    await db.updateUserRole(uid, 'admin');
    await db.addHistoryEntry({
      actorUid:           actor?.uid || '',
      actorName,
      actionType:         'promote',
      description:        `promoted ${target?.email || uid} to admin`,
      affectedMemberName: target?.email || uid,
      parentMemberName:   '',
      timestamp:          new Date().toISOString(),
    });

    await refreshUserList();
  } catch (err) { /* error dispatched by db.js */ }
}

async function demoteUser(uid) {
  const adminCount = await db.countAdmins();
  if (adminCount <= 1) {
    document.dispatchEvent(new CustomEvent('show-error', {
      detail: 'Cannot demote: at least one Admin must remain.'
    }));
    return;
  }
  const actor = getCurrentUser();
  const actorName = actor?.displayName || actor?.email || 'Unknown';
  try {
    const users = await db.listAllUsers();
    const target = users.find(u => u.uid === uid);
    await db.updateUserRole(uid, 'editor');
    await db.addHistoryEntry({
      actorUid:           actor?.uid || '',
      actorName,
      actionType:         'demote',
      description:        `demoted ${target?.email || uid} to editor`,
      affectedMemberName: target?.email || uid,
      parentMemberName:   '',
      timestamp:          new Date().toISOString(),
    });

    await refreshUserList();
  } catch (err) { /* error dispatched by db.js */ }
}

async function removeUser(uid, email) {
  const confirmed = window.confirm(`Remove access for ${email}?`);
  if (!confirmed) return;
  const actor = getCurrentUser();
  const actorName = actor?.displayName || actor?.email || 'Unknown';
  try {
    await db.deleteUserRecord(uid);
    await db.addHistoryEntry({
      actorUid:           actor?.uid || '',
      actorName,
      actionType:         'remove',
      description:        `removed ${email}`,
      affectedMemberName: email,
      parentMemberName:   '',
      timestamp:          new Date().toISOString(),
    });
    await refreshUserList();
  } catch (err) { /* error dispatched by db.js */ }
}

/**
 * Wire the invite form and close button.
 * Called once on DOMContentLoaded.
 */
export function initUserManagement() {
  // Close button
  const closeBtn = document.getElementById('user-mgmt-close');
  if (closeBtn) closeBtn.addEventListener('click', closeUserManagement);

  // Close when clicking on overlay (outside modal content)
  const modal = document.getElementById('user-mgmt-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeUserManagement();
      }
    });
  }

  // Invite form
  const inviteForm = document.getElementById('invite-form');
  if (inviteForm) {
    inviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('invite-email');
      const email = emailInput?.value.trim();
      if (!email) return;

      const actor = getCurrentUser();
      const actorName = actor?.displayName || actor?.email || 'Unknown';

      try {
        await db.createUserRecord({
          email,
          displayName: email,
          role:        'editor',
          status:      'pending',
          createdAt:   new Date().toISOString(),
        });
        await db.addHistoryEntry({
          actorUid:           actor?.uid || '',
          actorName,
          actionType:         'invite',
          description:        `invited ${email} as editor`,
          affectedMemberName: email,
          parentMemberName:   '',
          timestamp:          new Date().toISOString(),
        });

        // Send invite email via EmailJS
        try {
          await emailjs.send('service_cbrph9q', 'template_rnqpksu', {
            to_email:   email,
            invited_by: actorName,
          });
          alert(`✅ 邀请已发送至 ${email}`);
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
          alert(`✅ 用户已添加，但邮件发送失败: ${emailErr.text || emailErr.message}\n请手动通知对方。`);
        }

        if (emailInput) emailInput.value = '';
        await refreshUserList();
      } catch (err) { /* error dispatched by db.js */ }
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
