'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { invalidateCache } from '@/lib/cache';
import { collectionGroup, query, where, doc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PageWrapper } from '@/components/layout/page-wrapper';

interface LateSubmission {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function PersetujuanTerlambatPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const lateSubmissionsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, 'lateSubmissions'),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const { data: submissions, isLoading, error } = useCollection<LateSubmission>(user, lateSubmissionsQuery);

  const sortedSubmissions = submissions ? [...submissions].sort((a, b) => b.date.localeCompare(a.date)) : null;

  const handleApproval = async (submission: LateSubmission, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !user) return;

    setIsSubmitting(submission.id);

    const batch = writeBatch(firestore);

    // 1. Update the lateSubmission document
    const submissionRef = doc(firestore, 'users', submission.userId, 'lateSubmissions', submission.id);
    batch.update(submissionRef, { status: newStatus });

    // 2. If approved, create/update an attendance record
    if (newStatus === 'approved') {
        const attendanceRecordRef = doc(firestore, 'users', submission.userId, 'attendanceRecords', `${submission.date}-${submission.userId}`);
        batch.set(attendanceRecordRef, {
            date: submission.date,
            status: 'Terlambat', // Custom status for approved lateness
            description: `Disetujui: ${submission.reason}`,
            checkInTime: null, // No check-in time, as it was missed
            checkOutTime: null,
            isLate: true, 
            lateReason: submission.reason,
            approvedBy: user.uid,
            approvedAt: new Date(),
        }, { merge: true });
    }

    try {
      await batch.commit();
      // Invalidate staff dashboard cache so counts update immediately
      try { invalidateCache('staffDashboardStats_v3'); } catch (e) { /* ignore */ }
      toast({ title: 'Berhasil', description: `Pengajuan dari ${submission.userName} telah di-${newStatus === 'approved' ? 'setujui' : 'tolak'}.` });
    } catch (err: any) {
      console.error("Error updating submission status:", err);
      toast({ title: 'Gagal', description: `Gagal memperbarui status pengajuan: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Persetujuan Keterlambatan</CardTitle>
          <CardDescription>Tinjau dan setujui/tolak pengajuan keterangan terlambat dari guru dan pegawai.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
             <div className="flex flex-col items-center justify-center h-64 text-center text-destructive">
                 <ShieldAlert className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Gagal Memuat Data</p>
                <p className="text-sm">Terjadi kesalahan saat mengambil data pengajuan. Coba muat ulang halaman.</p>
            </div>
          )}
          {!isLoading && !error && sortedSubmissions && sortedSubmissions.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Alasan Keterlambatan</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.userName}</div>
                        <div className="text-sm text-muted-foreground">{sub.userRole}</div>
                      </TableCell>
                      <TableCell>{format(new Date(sub.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                      <TableCell className="max-w-xs">{sub.reason}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleApproval(sub, 'approved')} 
                          disabled={isSubmitting === sub.id}
                        >
                          {isSubmitting === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          <span className="ml-2">Setujui</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleApproval(sub, 'rejected')} 
                          disabled={isSubmitting === sub.id}
                        >
                           {isSubmitting === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                           <span className="ml-2">Tolak</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !isLoading && <p className="text-center text-muted-foreground py-16">Tidak ada pengajuan keterangan terlambat yang perlu ditinjau saat ini.</p>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
