// Firebase configuration for Lee Family Genealogy
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getStorage }     from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAdVk1FlwZFawFOw1V_IO1r1qBi5sHXIZs",
  authDomain:        "leefamilygenealogy.firebaseapp.com",
  projectId:         "leefamilygenealogy",
  storageBucket:     "leefamilygenealogy.firebasestorage.app",
  messagingSenderId: "142758582489",
  appId:             "1:142758582489:web:ddb1e5cc386c5b94d886c8",
  measurementId:     "G-QRZYTJYW7F"
};

export const app     = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
