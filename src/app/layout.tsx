import type { Metadata, Viewport } from 'next';
<<<<<<< HEAD
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'E-SPENLI',
  description: 'Sistem Presensi Online',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
=======
import dynamic from 'next/dynamic';
// @ts-expect-error CSS module declarations are handled by Next.js globals
import './globals.css';

const ClientProviders = dynamic(() => import('@/components/ClientProviders').then((mod) => mod.ClientProviders), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'E-SPENLI',
  description: 'Aplikasi Absensi Digital untuk SMPN 5 Langke Rembong',
  manifest: '/manifest.json',
  applicationName: 'E-SPENLI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'E-SPENLI',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logofix.png',
    apple: '/logofix.png',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
      </body>
    </html>
  );
}
