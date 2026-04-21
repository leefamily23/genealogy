// One-time setup script to create the first admin user
// Run this in the browser console AFTER signing in with Google

import { db } from './firebase-config.js';
import { auth } from './firebase-config.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

async function setupFirstAdmin() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ You must sign in first! Click "Sign In with Google" then run this again.');
    return;
  }

  console.log(`Creating admin record for: ${user.email} (uid: ${user.uid})`);

  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Admin user created! Refresh the page to see admin controls.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

// Expose to console
window.setupFirstAdmin = setupFirstAdmin;

console.log('Setup script loaded. Run: setupFirstAdmin()');
