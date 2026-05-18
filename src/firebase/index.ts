'use client';

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

// Export functions to get the Firebase services.
export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
}

export const getFirebaseFirestore = (): Firestore => {
  return getFirestore(getFirebaseApp());
}

// --- Re-export all other necessary hooks and providers ---
// This was the part that was accidentally removed.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './use-memo-firebase';
