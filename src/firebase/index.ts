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
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './use-memo-firebase';
