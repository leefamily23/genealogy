import * as db from './db.js';
import { getCurrentUser } from './auth.js';

/**
 * Validate a member name — must be non-empty after trimming.
 * @param {string} name
 * @returns {{ valid: boolean, error: string }}
 */
export function validateMemberName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required.' };
  }
  return { valid: true, error: '' };
}

/**
 * Open the edit form in "Add Spouse" mode.
 * @param {string} memberId - The member to add spouse to
 */
export function openAddSpouseForm(memberId) {
  resetForm();
  document.getElementById('f-parent-id').value = ''; // Spouse has no parent in tree
  document.getElementById('f-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Spouse';
  
  // Store the original member ID for linking after creation
  const form = document.getElementById('member-form');
  form.dataset.spouseOf = memberId;
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Open the edit form in "Add Child" mode.
 * @param {string} parentId
 */
export function openAddForm(parentId) {
  resetForm();
  document.getElementById('f-parent-id').value = parentId || '';
  document.getElementById('f-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Child';
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Open the edit form pre-populated with an existing member's data.
 * @param {object} member
 */
export function openEditForm(member) {
  resetForm();
  document.getElementById('f-id').value       = member.id       || '';
  document.getElementById('f-parent-id').value = member.parentId || '';
  document.getElementById('f-name').value      = member.name     || '';
  document.getElementById('f-chinese').value   = member.chinese  || '';
  document.getElementById('f-gender').value    = member.gender   || 'male';
  document.getElementById('f-birth').value     = member.birth    || '';
  document.getElementById('f-death').value     = member.death    || '';
  document.getElementById('f-notes').value     = member.notes    || '';
  document.getElementById('modal-title').textContent = 'Edit Member';
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Close and reset the edit form modal.
 */
export function closeForm() {
  document.getElementById('edit-modal').classList.add('hidden');
  resetForm();
  
  // Clear any spouse relationship data
  const form = document.getElementById('member-form');
  if (form && form.dataset.spouseOf) {
    delete form.dataset.spouseOf;
  }
}

function resetForm() {
  const form = document.getElementById('member-form');
  if (form) form.reset();
  const errEl = document.getElementById('f-name-error');
  if (errEl) errEl.textContent = '';
}

// ── Form submit handler ───────────────────────────────────────────────────────
export function initEditForm(onSaved) {
  const form = document.getElementById('member-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('f-name').value;
    const validation = validateMemberName(name);
    if (!validation.valid) {
      const errEl = document.getElementById('f-name-error');
      if (errEl) errEl.textContent = validation.error;
      return;
    }

    const id       = document.getElementById('f-id').value.trim();
    const parentId = document.getElementById('f-parent-id').value.trim();
    const spouseOf = form.dataset.spouseOf; // Check if this is a spouse creation
    
    const member   = {
      name:     name.trim(),
      chinese:  document.getElementById('f-chinese').value.trim(),
      gender:   document.getElementById('f-gender').value,
      birth:    document.getElementById('f-birth').value.trim(),
      death:    document.getElementById('f-death').value.trim(),
      notes:    document.getElementById('f-notes').value.trim(),
      parentId: parentId || null,
    };

    const user = getCurrentUser();
    const actorName = user?.displayName || user?.email || 'Unknown';

    try {
      if (id) {
        // Edit existing
        await db.updateMember(id, member);
        await db.addHistoryEntry({
          actorUid:           user?.uid || '',
          actorName,
          actionType:         'update',
          description:        `updated ${member.name}`,
          affectedMemberName: member.name,
          parentMemberName:   '',
          timestamp:          new Date().toISOString(),
        });
      } else {
        // Add new member
        const memberData = { ...member };
        
        // If this is a spouse, add the spouse relationship to the member data before saving
        if (spouseOf) {
          memberData.spouses = [spouseOf]; // Initialize spouses array
        }
        
        const newMemberId = await db.addMember(memberData);
        
        // If this is a spouse, update the original member to reference the new spouse
        if (spouseOf) {
          // Get the original member's current spouses
          const originalMember = await db.getMember(spouseOf);
          const currentSpouses = originalMember.spouses || [];
          
          // Add the new spouse to the array if not already present
          if (!currentSpouses.includes(newMemberId)) {
            currentSpouses.push(newMemberId);
            await db.updateMember(spouseOf, { spouses: currentSpouses });
          }
        }
        
        await db.addHistoryEntry({
          actorUid:           user?.uid || '',
          actorName,
          actionType:         'add',
          description:        spouseOf ? `added spouse ${member.name}` : `added ${member.name}`,
          affectedMemberName: member.name,
          parentMemberName:   '',
          timestamp:          new Date().toISOString(),
        });
      }
      
      // Clear the spouseOf data attribute
      delete form.dataset.spouseOf;
      
      closeForm();
      if (onSaved) onSaved();
    } catch (err) {
      // Error already dispatched by db.js — just keep form open
    }
  });

  // Cancel button
  const cancelBtn = document.getElementById('modal-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closeForm);
}

// ── Delete handler ────────────────────────────────────────────────────────────
export async function handleDelete(memberId, memberName, hasChildren, onDeleted) {
  // Rule: Only allow delete if member is a leaf node (no children)
  if (hasChildren) {
    alert(`Cannot delete "${memberName}" because they have children.\nDelete the children first.`);
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete "${memberName}"?\nThis cannot be undone.`
  );
  if (!confirmed) return;

  const user = getCurrentUser();
  const actorName = user?.displayName || user?.email || 'Unknown';

  try {
    await db.deleteMember(memberId);
    await db.addHistoryEntry({
      actorUid:           user?.uid || '',
      actorName,
      actionType:         'delete',
      description:        `deleted ${memberName}`,
      affectedMemberName: memberName,
      parentMemberName:   '',
      timestamp:          new Date().toISOString(),
    });
    if (onDeleted) onDeleted();
  } catch (err) {
    // Error already dispatched by db.js
  }
}
