'use client';

<<<<<<< HEAD
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
=======
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a

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
  const { data: schoolConfig, isLoading: isConfigLoading } = useDoc(user, schoolConfigRef);

  // --- User Profile Fetching ---
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(user, userProfileRef);

<<<<<<< HEAD
=======
  // Directly derive the loading state. This is more efficient and avoids re-renders.
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
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
