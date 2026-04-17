// This file configures and initializes the Firebase application instance.
// It reads the configuration from environment variables and exports the initialized
// auth and firestore services. This setup ensures Firebase is initialized only once.

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object, populated from environment variables.
// These variables must be prefixed with NEXT_PUBLIC_ to be available on the client-side.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
// This pattern prevents re-initialization of the app on hot reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);


// Startup Verification Log
// This log helps confirm that the Firebase config is being loaded correctly.
// It runs on both the server and the client to help with debugging.
const logConfigVerification = () => {
    const context = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';
    console.log(`\n--- Firebase Config Verification (${context}) ---`);
    if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
      console.log(`✅ Project ID: ${firebaseConfig.projectId}`);
      console.log(`✅ Auth Domain: ${firebaseConfig.authDomain}`);
    } else {
      console.error("❌ CRITICAL: Firebase config is MISSING from your .env file!");
      console.error("   Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_API_KEY are set.");
    }
    console.log("----------------------------------------\n");
};

// We want to log this once on the server and once on the client to aid debugging.
if (typeof window === 'undefined') {
    logConfigVerification();
} else {
    // A bit of a trick to ensure the client-side log only runs once.
    if (!(window as any).__firebaseConfigLogged) {
        logConfigVerification();
        (window as any).__firebaseConfigLogged = true;
    }
}
