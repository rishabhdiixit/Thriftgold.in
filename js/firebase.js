// Firebase (Firestore) init for cross-device product sync.
// Uses compat builds so it works in plain <script> tags.

(function initFirebase() {
  if (typeof firebase === 'undefined') return;

  const firebaseConfig = {
    apiKey: "AIzaSyAYXXVuiNYpJRJ5m2YXxKVWRy-HE7WeizI",
    authDomain: "thriftgold-admin.firebaseapp.com",
    projectId: "thriftgold-admin",
    storageBucket: "thriftgold-admin.firebasestorage.app",
    messagingSenderId: "262983003893",
    appId: "1:262983003893:web:31cc18866e49e1d98c1fbc",
    measurementId: "G-TMQX880C7G"
  };

  try {
    if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    // ignore "already exists" or init errors; app.js will fall back to localStorage
  }

  try {
    window.tgFirestore = firebase.firestore();
  } catch (e) {
    // ignore
  }
})();

