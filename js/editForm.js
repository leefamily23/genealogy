import * as db from './db.js';
import { getCurrentUser } from './auth.js';
import { recordEditActivity } from './editSession.js';
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
 * Open the edit form in "Add Parent" mode.
 * @param {string} childId - The child whose parent we're adding
 */
export function openAddParentForm(childId) {
  resetForm();
  document.getElementById('f-parent-id').value = ''; // Parent has no parent (will become new root)
  document.getElementById('f-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Parent (添加父母)';
  
  // Parents are typically Lee family members
  document.getElementById('f-lee-family-member').checked = true;
  
  // Hide spouse selection
  const spouseContainer = document.getElementById('spouse-selection-container');
  if (spouseContainer) {
    spouseContainer.classList.add('hidden');
  }
  
  // Store the child ID so we can update the child's parentId after creating the parent
  const form = document.getElementById('member-form');
  form.dataset.childId = childId;
  
  // Initialize image upload UI
  try {
    initImageUploadUI('member-form');
  } catch (error) {
    console.error('Image upload UI initialization failed:', error);
  }
  
  document.getElementById('edit-modal').classList.remove('hidden');
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
  document.getElementById('f-hometown').value  = member.hometown || '';
  document.getElementById('f-nationality').value = member.nationality || '';
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
  try {
    initImageUploadUI('member-form', member.id);
    
    // Load existing image if available
    if (member.imageURL) {
      const form = document.getElementById('member-form');
      const preview = form.querySelector('.image-preview');
      const removeBtn = form.querySelector('.image-remove-btn');
      
      if (preview) {
        preview.innerHTML = `<img src="${member.imageURL}" alt="当前照片" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        preview.style.display = 'block';
      }
      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }
    }
  } catch (error) {
    console.error('Image upload UI initialization failed:', error);
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
  if (form) {
    form.reset();
    // Always clear all dataset values to prevent stale data carrying over
    delete form.dataset.spouseOf;
    delete form.dataset.childId;
    delete form.dataset.childSpouseContext;
  }
  const errEl = document.getElementById('f-name-error');
  if (errEl) errEl.textContent = '';
  
  // Clear image preview
  const preview = form?.querySelector('.image-preview');
  const removeBtn = form?.querySelector('.image-remove-btn');
  if (preview) {
    preview.innerHTML = '';
    preview.style.display = 'none';
  }
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
}

// ── Form submit handler ───────────────────────────────────────────────────────
export function initEditForm(onSaved) {
  const form = document.getElementById('member-form');
  if (!form) return;

  // Close when clicking on overlay (outside modal content)
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeForm();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Record edit activity
    recordEditActivity();

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
      hometown: document.getElementById('f-hometown')?.value.trim() || '',
      nationality: document.getElementById('f-nationality')?.value.trim() || '',
      parentId: parentId || null,
      isLeeFamilyMember: isLeeFamilyMember,
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
          } else {
            // Check if image was removed (preview is hidden and no file selected)
            const form = document.getElementById('member-form');
            const preview = form?.querySelector('.image-preview');
            const isPreviewHidden = preview && preview.style.display === 'none';
            
            if (isPreviewHidden) {
              // User removed the image - set to empty string
              finalMemberData.imageURL = '';
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
        
        // If this is a parent being added (childId is set), update the child's parentId
        const childId = form.dataset.childId;
        if (childId) {
          console.log(`🔗 Linking child ${childId} to new parent ${newMemberId}`);
          try {
            await db.updateMember(childId, { parentId: newMemberId });
            console.log(`✅ Successfully linked child ${childId} to parent ${newMemberId}`);
          } catch (linkError) {
            console.error(`❌ Failed to link child to parent:`, linkError);
            alert(`父母已创建，但链接失败。请手动编辑子女的父母信息。`);
          }
          delete form.dataset.childId;
        }
        
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
        
        const description = childId
          ? `added parent ${member.name}`
          : spouseOf 
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
  const allMembers = await db.getAllMembers();
  const memberToDelete = allMembers.find(m => m.id === memberId);
  if (!memberToDelete) return;

  // Determine if main-branch node (has parentId OR secondaryParentId)
  const isMainBranch = !!(
    (memberToDelete.parentId && allMembers.some(m => m.id === memberToDelete.parentId)) ||
    (memberToDelete.secondaryParentId && allMembers.some(m => m.id === memberToDelete.secondaryParentId))
  );

  if (!isMainBranch) {
    // Spouse-only node: block if it has children (shouldn't normally happen)
    if (hasChildren) {
      alert(`Cannot delete "${memberName}" because they have children.\nDelete the children first.`);
      return;
    }
  } else {
    // Main-branch node: block if it has children
    if (hasChildren) {
      alert(`Cannot delete "${memberName}" because they have children.\nDelete the children first.`);
      return;
    }
  }

  // Build warning message
  let warningMessage = `Are you sure you want to delete "${memberName}"?\nThis cannot be undone.`;

  if (isMainBranch) {
    // Collect spouse-only nodes that will also be deleted
    const spouseIds = new Set();
    if (memberToDelete.spouses && Array.isArray(memberToDelete.spouses)) {
      memberToDelete.spouses.forEach(sid => spouseIds.add(sid));
    }
    allMembers.forEach(m => {
      if (m.spouses && Array.isArray(m.spouses) && m.spouses.includes(memberId)) {
        spouseIds.add(m.id);
      }
    });

    const spouseNamesToDelete = [];
    spouseIds.forEach(spouseId => {
      const spouse = allMembers.find(m => m.id === spouseId);
      if (!spouse) return;
      const spouseHasChildren        = allMembers.some(m => m.parentId === spouseId);
      const spouseHasParent          = spouse.parentId && allMembers.some(m => m.id === spouse.parentId);
      const spouseHasSecondaryParent = spouse.secondaryParentId && allMembers.some(m => m.id === spouse.secondaryParentId);
      if (!spouseHasChildren && !spouseHasParent && !spouseHasSecondaryParent) {
        spouseNamesToDelete.push(spouse.name);
      }
    });

    if (spouseNamesToDelete.length > 0) {
      warningMessage += `\n\n⚠️ This will also delete ${spouseNamesToDelete.length === 1 ? 'spouse' : 'spouses'}: ${spouseNamesToDelete.join(', ')}`;
    }
  }
  // Spouse-only node: just deletes itself, no extra warning needed

  const confirmed = window.confirm(warningMessage);
  if (!confirmed) return;

  const user = getCurrentUser();
  const actorName = user?.displayName || user?.email || 'Unknown';

  try {
    try {
      await deleteMemberImage(memberId);
    } catch (imageError) {
      console.warn('Could not delete member image:', imageError);
    }

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
