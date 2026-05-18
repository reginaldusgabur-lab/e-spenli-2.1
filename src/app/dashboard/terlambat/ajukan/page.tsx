'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs, Timestamp, doc } from 'firebase/firestore';
import { format, startOfDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const lateSubmissionSchema = z.object({
  reason: z.string().min(10, { message: 'Alasan keterlambatan harus diisi minimal 10 karakter.' }).max(500, { message: 'Alasan tidak boleh lebih dari 500 karakter.' }),
});

export default function AjukanTerlambatPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof lateSubmissionSchema>>({
    resolver: zodResolver(lateSubmissionSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof lateSubmissionSchema>) => {
    if (!user || !firestore) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Prevent duplicate submission for the same day
      const submissionQuery = query(
        collection(firestore, 'users', user.uid, 'lateSubmissions'),
        where('date', '==', todayStr)
      );
      const existingSubmission = await getDocs(submissionQuery);

      if (!existingSubmission.empty) {
        toast({ title: 'Gagal', description: 'Anda sudah mengajukan keterangan terlambat untuk hari ini.', variant: 'destructive' });
        router.push('/dashboard');
        return;
      }

      const lateSubmissionRef = collection(firestore, 'users', user.uid, 'lateSubmissions');

      await addDoc(lateSubmissionRef, {
        userId: user.uid,
        userName: user.name,
        userRole: user.role,
        reason: values.reason,
        date: todayStr,
        status: 'pending', 
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Berhasil', description: 'Pengajuan keterangan terlambat Anda telah terkirim dan menunggu persetujuan.' });
      router.push('/dashboard');

    } catch (err: any) {
      console.error("Error submitting late reason:", err);
      setError('Gagal mengirim pengajuan. Silakan coba lagi nanti.');
      toast({ title: 'Terjadi Kesalahan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <Card className="w-full max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Formulir Keterangan Terlambat</CardTitle>
              <CardDescription>Jelaskan alasan keterlambatan Anda hari ini. Pengajuan akan ditinjau oleh Kepala Sekolah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Gagal Mengirim</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Keterlambatan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Ada kendala di perjalanan, ban motor bocor."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Pengajuan
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </PageWrapper>
  );
}
