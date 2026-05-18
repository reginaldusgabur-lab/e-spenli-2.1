import { z } from 'zod';

// Skema input dan output didefinisikan untuk menjaga konsistensi tipe data
// di seluruh aplikasi, bahkan jika fungsionalitas AI dinonaktifkan.
const QuoteInputSchema = z.object({
  category: z.string(),
  attendanceType: z.enum(['in', 'out']),
});

const QuoteOutputSchema = z.object({
  quote: z.string(),
  author: z.string(),
});

// Mengekspor tipe agar bagian lain dari aplikasi tidak mengalami error tipe.
export type QuoteInput = z.infer<typeof QuoteInputSchema>;
export type QuoteOutput = z.infer<typeof QuoteOutputSchema>;

/**
 * FUNGSI AI BYPASS SEMENTARA
 *
 * Fungsi getQuote ini adalah pengganti sementara yang aman untuk melewati build Vercel.
 * Semua logika AI Genkit yang kompleks dan menyebabkan error telah dihapus total.
 * Fungsi ini secara langsung mengembalikan sebuah objek kutipan standar yang valid,
 * memastikan bahwa setiap bagian dari aplikasi yang mungkin memanggilnya tidak akan gagal.
 * Ini adalah langkah strategis untuk menonaktifkan fitur yang bermasalah dan
 * fokus pada deployment yang berhasil.
 */
export async function getQuote(input: QuoteInput): Promise<QuoteOutput> {
  console.log(`AI Quote feature is currently bypassed. Called with input:`, input);
  
  // Selalu kembalikan kutipan yang aman dan generik.
  return {
    quote: "Tetap semangat, pekerjaan hebat menanti!",
    author: "Sistem E-Spenli",
  };
}

// Semua kode "defineFlow" dan pemanggilan model AI telah dihapus dari file ini
// untuk menjamin keberhasilan build Vercel.
