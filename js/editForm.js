import * as db from './db.js';
import { getCurrentUser } from './auth.js';
import { 
  initImageUploadUI, 
  getSelectedImageFile, 
  uploadMemberImage, 
  showUploadProgress,
  deleteMemberImage 
} from './imageUpload.js';

/**
 * Get the next member ID for preview (used for image upload before member creation)
 * @returns {Promise<string>}
 */
async function getNextMemberIdPreview() {
  try {
    const members = await db.getAllMembers();
    const existingIds = members.map(m => m.id);
    
    // Filter numeric IDs and find the highest one
    const numericIds = existingIds
      .filter(id => /^\d+$/.test(id))
      .map(id => parseInt(id, 10));
    
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return String(maxId + 1);
  } catch (err) {
    // Fallback to timestamp-based ID if there's an error
    return String(Date.now());
  }
}

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
  
  // Spouses are typically NOT Lee family members (unless they also have Lee surname)
  document.getElementById('f-lee-family-member').checked = false;
  
  // Store the original member ID for linking after creation
  const form = document.getElementById('member-form');
  form.dataset.spouseOf = memberId;
  
  // Initialize image upload UI (with error handling)
  console.log('🔧 About to initialize image upload UI for openAddSpouseForm');
  try {
    initImageUploadUI('member-form');
  } catch (error) {
    console.error('❌ Image upload UI initialization failed:', error);
  }
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Open the edit form in "Add Child" mode with a pre-selected spouse.
 * @param {string} parentId - Primary parent ID (main lineage member)
 * @param {string} spouseId - Pre-selected spouse ID
 * @param {object[]} allMembers - All family members
 */
export function openAddFormWithSpouse(parentId, spouseId, allMembers = []) {
  resetForm();
  document.getElementById('f-parent-id').value = parentId || '';
  document.getElementById('f-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Child';
  
  // Auto-check Lee family member for children (they inherit family membership)
  if (parentId && allMembers.length > 0) {
    const parent = allMembers.find(m => m.id === parentId);
    if (parent && parent.isLeeFamilyMember) {
      document.getElementById('f-lee-family-member').checked = true;
    } else {
      document.getElementById('f-lee-family-member').checked = false;
    }
  } else {
    document.getElementById('f-lee-family-member').checked = true; // Default to checked
  }
  
  // Set up spouse selection with the pre-selected spouse
  const spouseContainer = document.getElementById('spouse-selection-container');
  const spouseSelect = document.getElementById('f-spouse-selection');
  
  if (parentId && allMembers.length > 0) {
    const parent = allMembers.find(m => m.id === parentId);
    
    if (parent && parent.spouses && Array.isArray(parent.spouses) && parent.spouses.length > 0) {
      // Parent has spouses - show the selection dropdown
      spouseSelect.innerHTML = '<option value="">-- Select Spouse --</option>';
      
      parent.spouses.forEach(currentSpouseId => {
        const spouse = allMembers.find(m => m.id === currentSpouseId);
        if (spouse) {
          const option = document.createElement('option');
          option.value = currentSpouseId;
          option.textContent = `${spouse.name} ${spouse.chinese ? '(' + spouse.chinese + ')' : ''}`;
          
          // Pre-select the clicked spouse
          if (currentSpouseId === spouseId) {
            option.selected = true;
          }
          
          spouseSelect.appendChild(option);
        }
      });
      
      spouseContainer.classList.remove('hidden');
    } else {
      // No spouses - hide the selection
      spouseContainer.classList.add('hidden');
    }
  } else {
    spouseContainer.classList.add('hidden');
  }
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Open the edit form in "Add Child" mode.
 * @param {string} parentId
 * @param {object[]} allMembers - All family members to check for spouses
 */
export function openAddForm(parentId, allMembers = []) {
  resetForm();
  document.getElementById('f-parent-id').value = parentId || '';
  document.getElementById('f-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Child';
  
  // Auto-check Lee family member for children (they inherit family membership)
  if (parentId && allMembers.length > 0) {
    const parent = allMembers.find(m => m.id === parentId);
    if (parent && parent.isLeeFamilyMember) {
      document.getElementById('f-lee-family-member').checked = true;
    } else {
      document.getElementById('f-lee-family-member').checked = false;
    }
  } else {
    document.getElementById('f-lee-family-member').checked = true; // Default to checked
  }
  
  // Check if parent has multiple spouses
  const spouseContainer = document.getElementById('spouse-selection-container');
  const spouseSelect = document.getElementById('f-spouse-selection');
  
  if (parentId && allMembers.length > 0) {
    const parent = allMembers.find(m => m.id === parentId);
    
    if (parent && parent.spouses && Array.isArray(parent.spouses) && parent.spouses.length > 0) {
      // Parent has spouses - show the selection dropdown
      spouseSelect.innerHTML = '<option value="">-- Select Spouse --</option>';
      
      parent.spouses.forEach(spouseId => {
        const spouse = allMembers.find(m => m.id === spouseId);
        if (spouse) {
          const option = document.createElement('option');
          option.value = spouseId;
          option.textContent = `${spouse.name} ${spouse.chinese ? '(' + spouse.chinese + ')' : ''}`;
          spouseSelect.appendChild(option);
        }
      });
      
      spouseContainer.classList.remove('hidden');
      
      // If only one spouse, auto-select it
      if (parent.spouses.length === 1) {
        spouseSelect.value = parent.spouses[0];
      }
    } else {
      // No spouses or single spouse - hide the selection
      spouseContainer.classList.add('hidden');
    }
  } else {
    spouseContainer.classList.add('hidden');
  }
  
  // Initialize image upload UI (with error handling)
  console.log('🔧 About to initialize image upload UI for openAddForm');
  try {
    initImageUploadUI('member-form');
  } catch (error) {
    console.error('❌ Image upload UI initialization failed:', error);
  }
  
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
  
  // Set Lee family member checkbox
  document.getElementById('f-lee-family-member').checked = member.isLeeFamilyMember !== false; // Default to true if not set
  
  document.getElementById('modal-title').textContent = 'Edit Member';
  
  // Hide spouse selection when editing existing member
  const spouseContainer = document.getElementById('spouse-selection-container');
  if (spouseContainer) {
    spouseContainer.classList.add('hidden');
  }
  
  // Initialize image upload UI (with error handling)
  console.log('🔧 About to initialize image upload UI for openEditForm');
  try {
    initImageUploadUI('member-form', member.id);
  } catch (error) {
    console.error('❌ Image upload UI initialization failed:', error);
  }
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Close and reset the edit form modal.
 */
export function closeForm() {
  document.getElementById('edit-modal').classList.add('hidden');
  resetForm();
  
  // Hide spouse selection container
  const spouseContainer = document.getElementById('spouse-selection-container');
  if (spouseContainer) {
    spouseContainer.classList.add('hidden');
  }
  
  // Clear any spouse relationship data
  const form = document.getElementById('member-form');
  if (form) {
    if (form.dataset.spouseOf) {
      delete form.dataset.spouseOf;
    }
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
    const selectedSpouse = document.getElementById('f-spouse-selection')?.value; // Get selected spouse for child
    const isLeeFamilyMember = document.getElementById('f-lee-family-member')?.checked || false; // Get checkbox value
    
    const member   = {
      name:     name.trim(),
      chinese:  document.getElementById('f-chinese').value.trim(),
      gender:   document.getElementById('f-gender').value,
      birth:    document.getElementById('f-birth').value.trim(),
      death:    document.getElementById('f-death').value.trim(),
      notes:    document.getElementById('f-notes').value.trim(),
      parentId: parentId || null,
      isLeeFamilyMember: isLeeFamilyMember, // Store Lee family member status
    };
    
    // If a spouse was selected for this child, store the secondary parent
    if (selectedSpouse) {
      member.secondaryParentId = selectedSpouse;
    }

    const user = getCurrentUser();
    const actorName = user?.displayName || user?.email || 'Unknown';

    try {
      let memberId = id;
      
      if (id) {
        // Edit existing member
        let finalMemberData = { ...member };
        
        // Handle image upload for existing member
        try {
          const imageFile = getSelectedImageFile('member-form');
          if (imageFile) {
            showUploadProgress('member-form', 0);
            
            try {
              const imageURL = await uploadMemberImage(id, imageFile, (progress) => {
                showUploadProgress('member-form', progress);
              });
              
              // Add image URL to member data
              finalMemberData.imageURL = imageURL;
            } catch (imageError) {
              console.error('Image upload failed:', imageError);
              alert(`成员信息已保存，但照片上传失败: ${imageError.message}`);
            }
          }
        } catch (error) {
          console.warn('Image upload functionality not available:', error);
        }
        
        // Update member with all data including image URL
        await db.updateMember(id, finalMemberData);
        
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
        
        // If this is a spouse (NOT a child with selected spouse), add the spouse relationship
        if (spouseOf && !parentId) {
          // Only add spouse relationship if this is truly a spouse (no parentId)
          memberData.spouses = [spouseOf]; // Initialize spouses array
        }
        
        // Handle image upload for new member BEFORE creating the member
        try {
          const imageFile = getSelectedImageFile('member-form');
          if (imageFile) {
            showUploadProgress('member-form', 0);
            
            // Get the next member ID first
            const tempMemberId = await getNextMemberIdPreview();
            
            try {
              const imageURL = await uploadMemberImage(tempMemberId, imageFile, (progress) => {
                showUploadProgress('member-form', progress);
              });
              
              // Add image URL to member data
              memberData.imageURL = imageURL;
            } catch (imageError) {
              console.error('Image upload failed:', imageError);
              alert(`成员已添加，但照片上传失败: ${imageError.message}`);
            }
          }
        } catch (error) {
          console.warn('Image upload functionality not available:', error);
        }
        
        const newMemberId = await db.addMember(memberData);
        memberId = newMemberId;
        
        // If this is a spouse (NOT a child), update the original member to reference the new spouse
        if (spouseOf && !parentId) {
          // Get the original member's current spouses
          const originalMember = await db.getMember(spouseOf);
          const currentSpouses = originalMember.spouses || [];
          
          // Add the new spouse to the array if not already present
          if (!currentSpouses.includes(newMemberId)) {
            currentSpouses.push(newMemberId);
            await db.updateMember(spouseOf, { spouses: currentSpouses });
          }
        }
        
        const description = spouseOf 
          ? `added spouse ${member.name}` 
          : selectedSpouse 
            ? `added child ${member.name} (with selected spouse)`
            : `added ${member.name}`;
        
        await db.addHistoryEntry({
          actorUid:           user?.uid || '',
          actorName,
          actionType:         'add',
          description:        description,
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
    // Delete member image first (with error handling)
    try {
      await deleteMemberImage(memberId);
    } catch (imageError) {
      console.warn('Could not delete member image:', imageError);
      // Continue with member deletion even if image deletion fails
    }
    
    // Delete member data
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
