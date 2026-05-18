'use client'

import { FirebaseProvider } from '@/firebase';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from '@/components/ui/toaster';
import PwaInstaller from '@/components/pwa-installer';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
    >
        <FirebaseProvider>
            {children}
        </FirebaseProvider>
        <Toaster />
        <PwaInstaller />
    </ThemeProvider>
  );
}