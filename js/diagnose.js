// Diagnostic script to check Firebase connection and data
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAllMembers } from './db.js';

window.diagnoseFirebase = async function() {
  console.log('=== Firebase Diagnostic ===');
  
  try {
    console.log('1. Checking Firebase connection...');
    const familyRef = collection(db, 'family');
    const snapshot = await getDocs(familyRef);
    
    console.log(`2. Family collection size: ${snapshot.size} documents`);
    
    if (snapshot.empty) {
      console.warn('⚠️ Family collection is EMPTY!');
      console.log('You need to run the migration: window.migrateToFirestoreForce()');
      return { success: false, count: 0, error: 'Collection is empty' };
    }
    
    console.log('✓ Family data exists in Firestore');
    console.log('Sample members:');
    snapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name} (id: ${doc.id}, parentId: ${data.parentId || 'null'})`);
    });
    
    console.log('\n3. Testing getAllMembers() function...');
    const members = await getAllMembers();
    console.log(`getAllMembers() returned ${members.length} members`);
    
    if (members.length === 0) {
      console.error('❌ getAllMembers() returned empty array despite data existing!');
      console.log('This suggests a code issue in db.js');
    } else {
      console.log('✓ getAllMembers() working correctly');
    }
    
    return { success: true, count: snapshot.size, membersCount: members.length };
  } catch (err) {
    console.error('❌ Firebase error:', err.message);
    console.error('Full error:', err);
    return { success: false, error: err.message };
  }
};

console.log('Diagnostic loaded. Run: window.diagnoseFirebase()');
