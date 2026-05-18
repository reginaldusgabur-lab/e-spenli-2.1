'use client';

import React from 'react';
import { useUser } from '@/firebase';

// Mock types for react-joyride
interface Step {
  target: string;
  content: string;
}

interface JoyrideProps {
  steps: Step[];
  run: boolean;
  continuous?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  callback?: (data: { status: string }) => void;
  styles?: Record<string, any>;
}

const Joyride: React.FC<JoyrideProps> = ({ steps, run, callback, ...props }) => {
  React.useEffect(() => {
    if (run && callback) {
      callback({ status: 'finished' });
    }
  }, [run, callback]);

  return <div />;
};

// Definisikan langkah-langkah tur untuk setiap peran
const stepsByRole: Record<string, Step[]> = {
  kepala_sekolah: [
    {
      target: '#nav-laporan',
      content: 'Di menu ini, Anda dapat melihat dan mengunduh semua riwayat absensi guru dan pegawai.',
    },
    {
      target: '#nav-izin-kepsek',
      content: 'Di sini Anda dapat meninjau dan memberikan persetujuan untuk pengajuan izin atau sakit dari staf.',
    },
    {
      target: '#nav-pengaturan',
      content: 'Gunakan menu ini untuk mengubah kata sandi atau informasi pribadi Anda.',
    },
  ],
  guru: [
    {
      target: '#nav-laporan',
      content: 'Lihat semua riwayat absensi Anda di sini, termasuk rekap bulanan.',
    },
    {
      target: '#nav-izin',
      content: 'Ajukan izin atau sakit dengan mudah melalui formulir di menu ini.',
    },
    {
      target: '#nav-pengaturan',
      content: 'Ubah kata sandi atau informasi pribadi Anda kapan saja di sini.',
    },
  ],
  pegawai: [
    {
      target: '#nav-laporan',
      content: 'Lihat semua riwayat absensi Anda di sini, termasuk rekap bulanan.',
    },
    {
      target: '#nav-izin',
      content: 'Ajukan izin atau sakit dengan mudah melalui formulir di menu ini.',
    },
    {
      target: '#nav-pengaturan',
      content: 'Ubah kata sandi atau informasi pribadi Anda kapan saja di sini.',
    },
  ],
};

interface OnboardingTourProps {
  run: boolean;
  onTourComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onTourComplete }) => {
  const { user } = useUser();
  const steps = user?.role ? stepsByRole[user.role] : [];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={({ status }) => {
        if (['finished', 'skipped'].includes(status)) {
          onTourComplete();
        }
      }}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          primaryColor: '#14b8a6', // teal-500
          textColor: '#334155', // slate-700
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '0.5rem',
          padding: '1rem',
        },
      }}
    />
  );
};
