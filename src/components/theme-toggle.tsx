'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModeToggle() {
  // Menggunakan hook useTheme untuk mendapatkan tema saat ini dan fungsi untuk mengubahnya
  const { theme, setTheme } = useTheme();

  // Fungsi untuk mengganti tema antara terang dan gelap
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Menentukan tooltip berdasarkan tema saat ini
  const tooltipText = theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Tombol utama yang menangani klik */}
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {/* Ikon Matahari, terlihat di mode terang */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            {/* Ikon Bulan, terlihat di mode gelap */}
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
