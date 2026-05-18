'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';

interface CacheContextType {
  schoolConfig: DocumentData | null;
  userProfile: DocumentData | null;
  isCacheLoading: boolean;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // --- School Config Fetching ---
  const schoolConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'schoolConfig', 'default') : null, [firestore]);
  // ***** FIX: Correctly call useDoc, passing null as the first argument *****
  const { data: schoolConfig, isLoading: isConfigLoading } = useDoc(null, schoolConfigRef);

  // --- User Profile Fetching ---
  const userProfileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  // ***** FIX: Correctly call useDoc, passing null as the first argument *****
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(null, userProfileRef);

  const isCacheLoading = isAuthLoading || isConfigLoading || isProfileLoading;

  const value = useMemo(() => ({
    schoolConfig,
    userProfile,
    isCacheLoading,
  }), [schoolConfig, userProfile, isCacheLoading]);

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
