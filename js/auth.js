import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  getRedirectResult
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
    provider.setCustomParameters({ prompt: 'select_account' }); // Force account selection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const { signInWithRedirect } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
      );
      await signInWithRedirect(auth, provider);
    } else {
      const { signInWithPopup } = await import(
        'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
      );
      await signInWithPopup(auth, provider);
    }
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      showAuthError(`Sign-in failed: ${err.message}`);
    }
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

    // Not authorised — sign out
    await fbSignOut(auth);
    showAuthError('You are not authorised to edit. Contact an admin.');
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
      // Check for user record
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        _currentRole = userDoc.data().role;
        _currentUser = { ...user, displayName: userDoc.data().displayName || user.displayName };
        callback(_currentUser, _currentRole);
      } else {
        // Check for pending invite
        const pendingQuery = query(
          collection(db, 'users'),
          where('email', '==', user.email),
          where('status', '==', 'pending')
        );
        const pendingSnap = await getDocs(pendingQuery);

        if (!pendingSnap.empty) {
          // Activate pending invite
          const pendingDoc = pendingSnap.docs[0];
          const pendingData = pendingDoc.data();
          const { setDoc, deleteDoc } = await import(
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
          );

          // Ask user for their preferred display name
          const chosenName = await promptUsername(user.displayName || user.email);

          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: chosenName,
            role: pendingData.role || 'editor',
            status: 'active',
            createdAt: pendingData.createdAt
          });
          await deleteDoc(doc(db, 'users', pendingDoc.id));
          
          _currentRole = pendingData.role || 'editor';
          _currentUser = user;
          callback(user, _currentRole);
        } else {
          // Not authorized
          await fbSignOut(auth);
          _currentRole = null;
          _currentUser = null;
          callback(null, null);
          showAuthError('You are not authorised to edit. Contact an admin.');
        }
      }
    } catch (err) {
      console.error('Auth state error:', err);
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
  document.dispatchEvent(new CustomEvent('show-error', { detail: message }));
}

/**
 * Show username prompt modal for first-time sign-in.
 * Resolves with the chosen display name.
 */
export function promptUsername(defaultName) {
  return new Promise((resolve) => {
    const modal = document.getElementById('username-modal');
    const input = document.getElementById('username-input');
    const btn   = document.getElementById('username-confirm');
    if (!modal || !input || !btn) { resolve(defaultName); return; }

    input.value = defaultName || '';
    modal.classList.remove('hidden');
    input.focus();

    const confirm = () => {
      const name = input.value.trim();
      if (!name) { input.style.borderColor = '#e74c3c'; return; }
      modal.classList.add('hidden');
      btn.onclick = null;
      input.onkeydown = null;
      resolve(name);
    };

    btn.onclick = confirm;
    input.onkeydown = (e) => { if (e.key === 'Enter') confirm(); };
  });
}
