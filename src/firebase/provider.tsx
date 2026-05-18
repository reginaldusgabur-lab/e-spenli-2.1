'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { User, UserProfile } from '@/types';
<<<<<<< HEAD

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
=======
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseApp } from '@/firebase';

// Define the shape of the context state
export interface FirebaseContextState {
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

<<<<<<< HEAD
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userProfile = userDocSnap.data() as UserProfile;
              const combinedUser: User = {
                ...firebaseUser,
                ...userProfile,
                id: userDocSnap.id,
              };
              setUserAuthState({ user: combinedUser, isUserLoading: false, userError: null });
            } else {
              console.error(`User profile not found in Firestore for UID: ${firebaseUser.uid}`);
              setUserAuthState({ user: null, isUserLoading: false, userError: new Error('User profile not found in database.') });
            }
          } catch (error) {
            console.error("FirebaseProvider: Error fetching user document:", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error as Error });
          }
        } else {
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);
=======
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
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

<<<<<<< HEAD
export const useFirebase = (): FirebaseServicesAndUser => {
=======
// Custom hook to use the Firebase context
export const useFirebase = () => {
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
<<<<<<< HEAD
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase<T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
=======
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
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
