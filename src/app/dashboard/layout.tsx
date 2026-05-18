'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CacheProvider } from '@/context/CacheContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  // REPAIRED: isMobile is now `boolean | null`.
  // It starts as `null` on the client until the media query is evaluated.
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    // Redirect if user is not logged in after the check is complete.
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  // REPAIRED: Show loader while authenticating OR while determining screen size.
  // Checking `isMobile === null` prevents the flicker (hydration mismatch) by waiting
  // for the client-side media query to resolve before rendering the layout.
  if (isUserLoading || !user || isMobile === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Once the loader is gone, we know `isMobile` is either true or false.
  return (
    <CacheProvider>
      <SidebarProvider>
        {isMobile ? (
          <MobileLayout>{children}</MobileLayout>
        ) : (
          <DesktopLayout>{children}</DesktopLayout>
        )}
      </SidebarProvider>
    </CacheProvider>
  );
}
