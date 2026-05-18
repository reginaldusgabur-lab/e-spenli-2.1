'use client';

<<<<<<< HEAD
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Create a singleton instance of Firebase services.
// This ensures that Firebase is initialized only once across the entire application.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Export the initialized services directly for use in other parts of the app.
export { app as firebaseApp, auth, firestore };

// Re-export other necessary hooks and utilities
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { useDoc } from './firestore/use-doc';
=======
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This function initializes Firebase and ensures it's a singleton.
export const getFirebaseApp = (): FirebaseApp => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

// Export functions to get the Firebase services. This ensures they are only
// instantiated on the client side when the functions are called.
export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
}

export const getFirebaseFirestore = (): Firestore => {
  return getFirestore(getFirebaseApp());
}

// Re-export other necessary hooks and utilities that are safe for client-side
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
<<<<<<< HEAD
=======
export * from './use-memo-firebase';
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
