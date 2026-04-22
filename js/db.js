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
 * Delete a family member by id.
 * @param {string} id
 */
export async function deleteMember(id) {
  try {
    await deleteDoc(doc(db, 'family', id));
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
