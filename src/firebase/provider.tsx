'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { User, UserProfile } from '@/types';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseApp } from '@/firebase';

// Define the shape of the context state
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Create the context with an undefined initial value
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Provider component
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold the Firebase services
  const [services, setServices] = useState<{
    firebaseApp: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
  }>({ firebaseApp: null, auth: null, firestore: null });

  // State for user authentication
  const [userAuthState, setUserAuthState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({ user: null, isUserLoading: true, userError: null });

  // Initialize Firebase services on the client side
  useEffect(() => {
    const firebaseApp = getFirebaseApp();
    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    setServices({ firebaseApp, auth, firestore });
  }, []);

  // Effect for handling authentication state changes
  useEffect(() => {
    if (services.auth && services.firestore) {
      const unsubscribe = onAuthStateChanged(
        services.auth,
        async (firebaseUser) => {
          if (firebaseUser && services.firestore) {
            const userDocRef = doc(services.firestore, 'users', firebaseUser.uid);
            try {
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userProfile = userDocSnap.data() as UserProfile;
                const combinedUser: User = { ...firebaseUser, ...userProfile, id: userDocSnap.id };
                setUserAuthState({ user: combinedUser, isUserLoading: false, userError: null });
              } else {
                setUserAuthState({ user: null, isUserLoading: false, userError: new Error('User profile not found.') });
              }
            } catch (error) {
              setUserAuthState({ user: null, isUserLoading: false, userError: error as Error });
            }
          } else {
            setUserAuthState({ user: null, isUserLoading: false, userError: null });
          }
        },
        (error) => {
          setUserAuthState({ user: null, isUserLoading: false, userError: error });
        }
      );
      return () => unsubscribe();
    }
  }, [services.auth, services.firestore]);

  // The context value
  const contextValue = useMemo(() => ({
    ...services,
    ...userAuthState,
  }), [services, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

// Hooks for specific Firebase services and user state
export const useAuth = (): Auth | null => useFirebase().auth;
export const useFirestore = (): Firestore | null => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp | null => useFirebase().firebaseApp;
export const useUser = (): { user: User | null; isUserLoading: boolean; userError: Error | null } => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
}; 
