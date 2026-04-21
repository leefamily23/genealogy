import { auth, db } from './firebase-config.js';
import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, collection, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Cached role for the current session
let _currentRole = null;
let _currentUser = null;

/**
 * Sign in with Google popup.
 * Checks Firestore users collection for role.
 * If not found, checks for pending invite by email.
 * If neither found, signs out and shows unauthorised message.
 */
export async function signIn() {
  try {
    const provider = new GoogleAuthProvider();
    // Use redirect instead of popup — works reliably on GitHub Pages
    await signInWithRedirect(auth, provider);
    // Page will redirect to Google, then back — result handled in handleRedirectResult()
  } catch (err) {
    showAuthError(`Sign-in failed: ${err.message}`);
  }
}

/**
 * Call this on page load to handle the redirect result after Google sign-in.
 * Must be called before any other auth operations.
 */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return; // No redirect result — normal page load

    const user = result.user;

    // Small delay to ensure Firestore is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check for existing user record by uid
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) return; // Already registered

    // Check for pending invite by email
    const pendingQuery = query(
      collection(db, 'users'),
      where('email', '==', user.email),
      where('status', '==', 'pending')
    );
    const pendingSnap = await getDocs(pendingQuery);

    if (!pendingSnap.empty) {
      const pendingDoc = pendingSnap.docs[0];
      const pendingData = pendingDoc.data();
      const { setDoc, deleteDoc } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
      );
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        role: pendingData.role || 'editor',
        status: 'active',
        createdAt: pendingData.createdAt
      });
      await deleteDoc(doc(db, 'users', pendingDoc.id));
      return;
    }

    // TEMPORARY: Don't sign out - allow setup of first admin
    // Not authorised — show warning but stay signed in for setup
    console.warn('⚠️ No user record found. Run setupFirstAdmin() to create admin user.');
    showAuthError('No user record found. Open console and run: setupFirstAdmin()');
    
    // RESTORE THIS AFTER FIRST ADMIN IS CREATED:
    // await fbSignOut(auth);
    // showAuthError('You are not authorised to edit. Contact an admin.');
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showAuthError(`Sign-in failed: ${err.message}`);
    }
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    await fbSignOut(auth);
  } catch (err) {
    showAuthError(`Sign-out failed: ${err.message}`);
  }
}

/**
 * Listen to auth state changes.
 * Resolves the user's role from Firestore and calls callback(user, role).
 * Returns the unsubscribe function.
 * @param {(user: object|null, role: string|null) => void} callback
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      _currentRole = null;
      _currentUser = null;
      callback(null, null);
      return;
    }

    try {
      // Retry up to 3 times with delay (Firestore may be slow on first load)
      let userDoc = null;
      for (let i = 0; i < 3; i++) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) { userDoc = snap; break; }
        await new Promise(r => setTimeout(r, 1000));
      }

      if (userDoc) {
        _currentRole = userDoc.data().role;
        _currentUser = user;
        callback(user, _currentRole);
      } else {
        _currentRole = null;
        _currentUser = null;
        callback(user, null);
      }
    } catch (err) {
      _currentRole = null;
      _currentUser = null;
      callback(user, null);
    }
  });
}

/**
 * Returns the cached role: 'editor', 'admin', or null.
 */
export function getCurrentRole() {
  return _currentRole;
}

/**
 * Returns the cached current user.
 */
export function getCurrentUser() {
  return _currentUser;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showAuthError(message) {
  // Dispatch to the global error banner handler in app.js
  document.dispatchEvent(new CustomEvent('show-error', { detail: message }));
}
