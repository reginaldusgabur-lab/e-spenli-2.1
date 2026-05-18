'use client';

import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    // Jangan lakukan apa-apa sampai Firebase selesai memuat data user awal
=======
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
    if (isUserLoading) {
      return;
    }

    if (!user) {
<<<<<<< HEAD
      // Jika tidak ada user, langsung redirect ke halaman login
=======
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
      router.replace('/');
      return;
    }

<<<<<<< HEAD
    // User ada, sekarang periksa perannya di database
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        // Ini adalah admin. Izinkan akses dan hentikan loading.
        setIsVerifying(false);
      } else {
        // Bukan admin. Redirect ke dashboard biasa.
        router.replace('/dashboard');
      }
    }).catch(() => {
      // Jika ada error saat mengambil data, redirect juga untuk keamanan.
=======
    if (!firestore) {
        // Jika firestore belum siap, jangan lakukan apa-apa
        // Kita bisa asumsikan akan ada re-render saat sudah siap
        return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsVerifying(false);
      } else {
        router.replace('/dashboard');
      }
    }).catch(() => {
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
      router.replace('/dashboard');
    });

  }, [isUserLoading, user, firestore, router]);

  if (isVerifying) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
