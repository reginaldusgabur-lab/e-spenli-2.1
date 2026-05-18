
import { NextResponse } from 'next/server';
import quotes from '@/lib/manual-quotes.json';

// Memberitahu Next.js dan Vercel untuk selalu menjalankan rute ini secara dinamis
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Pilih satu kutipan acak dari daftar
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    const response = {
      content: randomQuote.quote,
      author: randomQuote.author,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API_QUOTE_ERROR]", error);
    return new NextResponse('Gagal mengambil kutipan manual.', { status: 500 });
  }
}
