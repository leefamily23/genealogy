// Check if any users exist in Firestore
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

window.checkUsers = async function() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${snapshot.size} users in Firestore`);
    
    if (snapshot.empty) {
      console.warn('⚠️ No users found! You need to create the first admin.');
      console.log('\nTo create the first admin:');
      console.log('1. Temporarily update Firestore rules to allow sign-in');
      console.log('2. Sign in with Google');
      console.log('3. Run: setupFirstAdmin()');
      console.log('4. Restore secure rules');
    } else {
      console.log('Users:');
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.email} (${data.role})`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
};

console.log('Run: window.checkUsers()');
