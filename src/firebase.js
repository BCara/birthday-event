// src/firebase.js
// Tiny Party Portal - Firebase configuration
// Replace these values with your own Firebase project config.
// Get them from: https://console.firebase.google.com → Your Project → Project Settings → General → Your Apps

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// ── Google Analytics (GA4) ──
// Only initialised when a measurementId is configured AND the browser supports it.
// Until VITE_FIREBASE_MEASUREMENT_ID (your "G-XXXXXXX" id) is set, this is a no-op.
let _analytics = null;
if (firebaseConfig.measurementId) {
  isSupported()
    .then((ok) => { if (ok) _analytics = getAnalytics(app); })
    .catch(() => { /* analytics unavailable (e.g. SSR, blocked) — ignore */ });
}

/** Safely log a GA4 event; silently does nothing if analytics isn't active. */
export function trackEvent(name, params = {}) {
  if (_analytics) {
    try { logEvent(_analytics, name, params); } catch { /* ignore */ }
  }
}

export const getAnalyticsInstance = () => _analytics;

export default app;
