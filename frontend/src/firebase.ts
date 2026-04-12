import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'wots-platform-11435.firebaseapp.com',
  projectId: 'wots-platform-11435',
  storageBucket: 'wots-platform-11435.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firebase Analytics — only initializes if measurementId is present and the
// browser supports it. Tracking calls no-op when analytics isn't ready.
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => { /* noop */ });
}

export function trackAnalyticsEvent(name: string, params?: Record<string, unknown>): void {
  if (!analytics) return;
  try {
    logEvent(analytics, name, params as Record<string, string | number | boolean>);
  } catch {
    /* noop */
  }
}
