'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { invalidateCache } from '@/lib/cache';
import { collectionGroup, query, where, getDocs, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LateSubmission {
  id: string; 
  path: string; 
  userName: string;
  userId: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export default function LateSubmissionsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<LateSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const canPerformAction = user?.role === 'kepala_sekolah';

  useEffect(() => {
    if (!firestore || !user || !['admin', 'kepala_sekolah'].includes(user.role)) {
        setIsLoading(false);
        return;
    }

    const fetchSubmissions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        
        const submissionsQuery = query(
          collectionGroup(firestore, 'lateSubmissions'),
          where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(submissionsQuery);
        const fetchedSubmissions: LateSubmission[] = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const pathSegments = doc.ref.path.split('/');
            const userId = pathSegments[1]; 
            fetchedSubmissions.push({
                id: doc.id,
                path: doc.ref.path,
                userId: userId,
                ...data
            } as LateSubmission);
        });

        fetchedSubmissions.sort((a, b) => {
            const aTimestamp = a.createdAt?.toMillis?.() ?? 0;
            const bTimestamp = b.createdAt?.toMillis?.() ?? 0;
            return bTimestamp - aTimestamp;
        });
        
        setSubmissions(fetchedSubmissions);
      } catch (err: any) {
        console.error("Firebase Error in LateSubmissionsTable:", err);
        setError(`Terjadi error dari Firebase: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [firestore, user, auth]);

  const handleAction = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    if (!firestore || !canPerformAction || !user) return;

    setIsActionLoading(submissionId);
    try {
        const submissionDoc = submissions.find(s => s.id === submissionId);
        if (!submissionDoc) throw new Error("Data pengajuan tidak ditemukan.");

        const { path: submissionPath, userId, date: dateStr, reason } = submissionDoc;

        const batch = writeBatch(firestore);
        const submissionRef = doc(firestore, submissionPath);

        // 1. Update status pengajuan terlambat
        batch.update(submissionRef, {
            status: newStatus,
            processedBy: user.uid,
            processedAt: Timestamp.now(),
        });

        // 2. Jika disetujui, buat/perbarui catatan kehadiran (attendanceRecord) yang sesungguhnya
        if (newStatus === 'approved') {
            const attendanceRef = doc(firestore, 'users', userId, 'attendanceRecords', dateStr);
            const now = Timestamp.now();

            const attendanceData = {
                checkInTime: now, // Ini adalah field krusial yang hilang
                checkOutTime: null,
                date: dateStr,
                status: 'terlambat',
                updatedAt: now,
                lateReason: reason,
                description: 'Keterlambatan disetujui oleh Kepala Sekolah.'
            };

            // Gunakan set dengan merge:true untuk membuat dokumen jika belum ada, atau update jika sudah ada
            batch.set(attendanceRef, attendanceData, { merge: true });
        }

        await batch.commit();
        toast({ title: 'Sukses', description: `Pengajuan telah di-${newStatus === 'approved' ? 'setujui' : 'tolak'}.` });
        try { invalidateCache('staffDashboardStats_v3'); } catch (e) { /* ignore */ }
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));

    } catch (err: any) {
        console.error("Error processing submission:", err);
        toast({ title: 'Gagal', description: `Gagal memproses pengajuan: ${err.message}` , variant: 'destructive' });
    } finally {
        setIsActionLoading(null);
    }
  };

  const renderTableContent = () => {
      const colSpan = canPerformAction ? 4 : 3;
      if (isLoading) {
          return [...Array(3)].map((_, i) => (
              <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  {canPerformAction && <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>}
              </TableRow>
          ));
      }

      if (error) {
          return (
              <TableRow>
                  <TableCell colSpan={colSpan}>
                      <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Gagal Memuat Pengajuan</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  </TableCell>
              </TableRow>
          );
      }

      if (submissions.length === 0) {
          return (
              <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-12">
                      <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="mt-4 text-lg font-semibold">Tidak Ada Pengajuan</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Saat ini tidak ada pengajuan terlambat yang perlu ditinjau.</p>
                  </TableCell>
              </TableRow>
          );
      }

      return submissions.map((submission) => (
          <TableRow key={submission.id}>
              <TableCell className="font-medium">{submission.userName}</TableCell>
              <TableCell>{format(parseISO(submission.date), 'd MMMM yyyy', { locale: id })}</TableCell>
              <TableCell className="max-w-xs truncate" title={submission.reason}>{submission.reason}</TableCell>
              {canPerformAction && (
                  <TableCell className="text-right space-x-2">
                      {isActionLoading === submission.id ? (
                          <Button variant="outline" size="sm" disabled className="w-28">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses
                          </Button>
                      ) : (
                          <>
                              <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleAction(submission.id, 'rejected')} title="Tolak">
                                  <XCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleAction(submission.id, 'approved')} title="Setujui">
                                  <CheckCircle2 className="h-4 w-4" />
                              </Button>
                          </>
                      )}
                  </TableCell>
              )}
          </TableRow>
      ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Persetujuan Terlambat</CardTitle>
        <CardDescription>Tinjau dan proses pengajuan keterangan terlambat dari personil.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Alasan</TableHead>
                        {canPerformAction && <TableHead className="text-right">Tindakan</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderTableContent()}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
