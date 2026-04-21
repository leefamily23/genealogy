import { db } from './firebase-config.js';
import { getCurrentRole } from './auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Flatten a nested family JSON structure into a flat array with parentId.
 * @param {object} node
 * @param {string|null} parentId
 * @returns {object[]}
 */
function flattenFamily(node, parentId = null) {
  const { children, ...member } = node;
  member.parentId = parentId;
  const result = [member];
  if (Array.isArray(children)) {
    children.forEach(child => {
      result.push(...flattenFamily(child, node.id));
    });
  }
  return result;
}

/**
 * One-time migration: reads data/family.json and writes each member to Firestore.
 * Only callable by Admin users.
 * Usage from browser console: window.migrateToFirestore()
 */
export async function migrateToFirestore() {
  const role = getCurrentRole();
  if (role !== 'admin') {
    console.error('Migration aborted: only admins can run this migration.');
    return;
  }

  console.log('Starting migration from family.json to Firestore...');

  let json;
  try {
    const response = await fetch('./data/family.json');
    json = await response.json();
  } catch (err) {
    console.error('Failed to load family.json:', err.message);
    return;
  }

  const members = flattenFamily(json);
  console.log(`Found ${members.length} members to migrate.`);

  let success = 0;
  let failed  = 0;

  for (const member of members) {
    try {
      await setDoc(doc(db, 'family', member.id), member);
      console.log(`  ✓ Migrated: ${member.name} (id: ${member.id})`);
      success++;
    } catch (err) {
      console.error(`  ✗ Failed: ${member.name} (id: ${member.id}) — ${err.message}`);
      failed++;
    }
  }

  console.log(`Migration complete. ${success} succeeded, ${failed} failed.`);
}

// Expose to browser console for Admin use
window.migrateToFirestore = migrateToFirestore;
