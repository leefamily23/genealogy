import { db } from './firebase-config.js';
import {
  collection, doc,
  getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, onSnapshot, where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Error helper ──────────────────────────────────────────────────────────────
function dispatchError(message) {
  document.dispatchEvent(new CustomEvent('show-error', { detail: message }));
}

// ── Family helpers ────────────────────────────────────────────────────────────

/**
 * Fetch all family members as a flat array.
 * @returns {Promise<FamilyMember[]>}
 */
export async function getAllMembers() {
  try {
    const snap = await getDocs(collection(db, 'family'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err) {
    dispatchError(`Failed to load family data: ${err.message}`);
    throw err;
  }
}

/**
 * Get the next available numeric ID for a new family member.
 * @returns {Promise<string>}
 */
async function getNextMemberId() {
  try {
    const snap = await getDocs(collection(db, 'family'));
    const existingIds = snap.docs.map(d => d.id);
    
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
 * Get a single family member by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getMember(id) {
  try {
    const snap = await getDoc(doc(db, 'family', id));
    return snap.exists() ? { ...snap.data(), id: snap.id } : null;
  } catch (err) {
    dispatchError(`Failed to get member: ${err.message}`);
    throw err;
  }
}

/**
 * Add a new family member. Returns the new document id.
 * @param {object} member
 * @returns {Promise<string>}
 */
export async function addMember(member) {
  try {
    const newId = await getNextMemberId();
    await setDoc(doc(db, 'family', newId), member);
    return newId;
  } catch (err) {
    dispatchError(`Save failed: ${err.message}. Your changes were not applied.`);
    throw err;
  }
}

/**
 * Update an existing family member by id.
 * @param {string} id
 * @param {object} fields
 */
export async function updateMember(id, fields) {
  try {
    await updateDoc(doc(db, 'family', id), fields);
  } catch (err) {
    dispatchError(`Save failed: ${err.message}. Your changes were not applied.`);
    throw err;
  }
}

/**
 * Delete a family member by id, including their spouses to prevent orphaned spouse nodes.
 * @param {string} id
 */
export async function deleteMember(id) {
  try {
    const allMembers = await getAllMembers();
    const memberToDelete = allMembers.find(m => m.id === id);

    if (!memberToDelete) throw new Error('Member not found');

    // Determine if this is a main-branch node (has parentId OR secondaryParentId)
    // or a spouse-only node (neither)
    const isMainBranch = !!(
      (memberToDelete.parentId && allMembers.some(m => m.id === memberToDelete.parentId)) ||
      (memberToDelete.secondaryParentId && allMembers.some(m => m.id === memberToDelete.secondaryParentId))
    );

    // Collect spouse-only nodes to delete alongside a main-branch node
    const spousesToDelete = [];

    if (isMainBranch) {
      const spouseIds = new Set();

      // Spouses listed on the member itself
      if (memberToDelete.spouses && Array.isArray(memberToDelete.spouses)) {
        memberToDelete.spouses.forEach(sid => spouseIds.add(sid));
      }
      // Members that list this member as their spouse
      allMembers.forEach(m => {
        if (m.spouses && Array.isArray(m.spouses) && m.spouses.includes(id)) {
          spouseIds.add(m.id);
        }
      });

      // Only delete a spouse if it is truly a spouse-only node
      spouseIds.forEach(spouseId => {
        const spouse = allMembers.find(m => m.id === spouseId);
        if (!spouse) return;
        const hasChildren        = allMembers.some(m => m.parentId === spouseId);
        const hasParent          = spouse.parentId && allMembers.some(m => m.id === spouse.parentId);
        const hasSecondaryParent = spouse.secondaryParentId && allMembers.some(m => m.id === spouse.secondaryParentId);
        if (!hasChildren && !hasParent && !hasSecondaryParent) {
          spousesToDelete.push(spouse);
        }
      });
    }
    // Spouse-only node: just delete itself, no cascade

    // Delete the main member
    await deleteDoc(doc(db, 'family', id));

    // Delete spouse-only nodes (main-branch case only)
    for (const spouse of spousesToDelete) {
      try {
        await deleteDoc(doc(db, 'family', spouse.id));
        console.log(`Deleted spouse-only node: ${spouse.name} (${spouse.id})`);
      } catch (err) {
        console.warn(`Failed to delete spouse ${spouse.name}:`, err);
      }
    }

    // Clean up references in remaining members
    const deletedIds = [id, ...spousesToDelete.map(s => s.id)];
    const remainingMembers = allMembers.filter(m => !deletedIds.includes(m.id));

    for (const member of remainingMembers) {
      const updates = {};

      if (member.spouses && Array.isArray(member.spouses)) {
        const cleaned = member.spouses.filter(sid => !deletedIds.includes(sid));
        if (cleaned.length !== member.spouses.length) updates.spouses = cleaned;
      }
      if (member.secondaryParentId && deletedIds.includes(member.secondaryParentId)) {
        updates.secondaryParentId = null;
      }
      if (member.parentId && deletedIds.includes(member.parentId)) {
        updates.parentId = null;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'family', member.id), updates);
        console.log(`Cleaned references for: ${member.name}`, updates);
      }
    }

  } catch (err) {
    dispatchError(`Delete failed: ${err.message}. Your changes were not applied.`);
    throw err;
  }
}

// ── Users helpers ─────────────────────────────────────────────────────────────

/**
 * Get a user record by uid.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserRecord(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { ...snap.data(), uid: snap.id } : null;
  } catch (err) {
    dispatchError(`Failed to get user record: ${err.message}`);
    throw err;
  }
}

/**
 * Get a user record by email (for pending invites).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function getUserByEmail(email) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...d.data(), uid: d.id };
  } catch (err) {
    dispatchError(`Failed to find user: ${err.message}`);
    throw err;
  }
}

/**
 * Create a new user record (keyed by uid or email for pending).
 * @param {object} record
 */
export async function createUserRecord(record) {
  try {
    const key = record.uid || record.email;
    await setDoc(doc(db, 'users', key), record);
  } catch (err) {
    dispatchError(`Failed to create user: ${err.message}`);
    throw err;
  }
}

/**
 * Update a user's role.
 * @param {string} uid
 * @param {string} role  'editor' | 'admin'
 */
export async function updateUserRole(uid, role) {
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (err) {
    dispatchError(`Failed to update role: ${err.message}`);
    throw err;
  }
}

/**
 * Delete a user record (revoke access).
 * @param {string} uid
 */
export async function deleteUserRecord(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    dispatchError(`Failed to remove user: ${err.message}`);
    throw err;
  }
}

/**
 * List all user records (Admin only).
 * @returns {Promise<object[]>}
 */
export async function listAllUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ ...d.data(), uid: d.id }));
  } catch (err) {
    dispatchError(`Failed to list users: ${err.message}`);
    throw err;
  }
}

/**
 * Count the number of admin-role users.
 * @returns {Promise<number>}
 */
export async function countAdmins() {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    dispatchError(`Failed to count admins: ${err.message}`);
    throw err;
  }
}

// ── Edit history helpers ──────────────────────────────────────────────────────

/**
 * Write a new edit history entry.
 * @param {object} entry
 */
export async function addHistoryEntry(entry) {
  try {
    await addDoc(collection(db, 'editHistory'), entry);
  } catch (err) {
    // History write failure is non-critical — log but don't block the user
    console.warn('Failed to write history entry:', err.message);
  }
}

/**
 * Subscribe to the 20 most recent edit history entries (real-time).
 * @param {(entries: object[]) => void} callback
 * @returns {function} unsubscribe
 */
export function subscribeHistory(callback) {
  const q = query(
    collection(db, 'editHistory'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    callback(entries);
  }, (err) => {
    console.warn('History subscription error:', err.message);
  });
}
