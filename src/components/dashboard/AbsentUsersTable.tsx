'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { isWithinInterval, format } from 'date-fns';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';

interface AbsentUser {
  no: number;
  name: string;
  nip: string;
  position: string;
  status: 'Alpa' | 'Menunggu Persetujuan' | 'Izin' | 'Sakit';
}

interface UserData {
  id: string;
  name: string;
  nip: string;
  role: string;
  position: string;
}

const AbsentUsersTable = () => {
  const [absentUsers, setAbsentUsers] = useState<AbsentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    const findAbsentUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        const usersQuery = query(collection(firestore, 'users'), where('role', 'in', ['guru', 'pegawai', 'kepala_sekolah']));
        const usersSnap = await getDocs(usersQuery);
        const allStaff: UserData[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));

        const presentUserIds = new Set<string>();
        const onLeaveOrPendingUserIds = new Map<string, {
            status: 'approved' | 'pending';
            type: 'sakit' | 'izin' | string;
        }>();

        await Promise.all(allStaff.map(async (user) => {
          try {
            const attendanceQ = query(collection(firestore, 'users', user.id, 'attendanceRecords'), where('date', '==', todayStr));
            const attendanceSnap = await getDocs(attendanceQ);
            if (!attendanceSnap.empty) {
              presentUserIds.add(user.id);
            }

            const leaveQ = query(collection(firestore, 'users', user.id, 'leaveRequests'));
            const leaveSnap = await getDocs(leaveQ);
            leaveSnap.forEach(doc => {
              const leave = doc.data();
              const startDate = leave.startDate?.toDate?.();
              const endDate = leave.endDate?.toDate?.();
              if (startDate && endDate && isWithinInterval(today, { start: startDate, end: endDate })) {
                if (!onLeaveOrPendingUserIds.has(user.id) || leave.status === 'approved') {
                  onLeaveOrPendingUserIds.set(user.id, { status: leave.status, type: leave.type || 'izin' });
                }
              }
            });

            const lateQ = query(collection(firestore, 'users', user.id, 'lateSubmissions'), where('date', '==', todayStr));
            const lateSnap = await getDocs(lateQ);
            lateSnap.forEach(doc => {
              const sub = doc.data();
              const status = sub.status;
              if (status === 'approved') {
                presentUserIds.add(user.id);
              } else if (status === 'pending') {
                if (!onLeaveOrPendingUserIds.has(user.id) || onLeaveOrPendingUserIds.get(user.id)!.status !== 'approved') {
                  onLeaveOrPendingUserIds.set(user.id, { status: 'pending', type: 'terlambat' });
                }
              }
            });
          } catch (err) {
            console.error('Error fetching per-user data for', user.id, err);
          }
        }));

        const usersToDisplay = allStaff
          .filter(user => !presentUserIds.has(user.id))
          .map((user, index) => {
            const leaveInfo = onLeaveOrPendingUserIds.get(user.id);
            let status: AbsentUser['status'] = 'Alpa';

            if (leaveInfo) {
              if (leaveInfo.status === 'approved') {
                status = leaveInfo.type === 'sakit' ? 'Sakit' : 'Izin';
              } else if (leaveInfo.status === 'pending') {
                status = 'Menunggu Persetujuan';
              }
            }

            return {
              no: index + 1,
              name: user.name,
              nip: user.nip || '-',
              position: user.position || user.role.charAt(0).toUpperCase() + user.role.slice(1),
              status,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setAbsentUsers(usersToDisplay);

      } catch (e: any) {
        console.error("Error finding absent users:", e);
        const msg = e?.message || String(e);
        // try to extract an index creation URL from the error message
        const m = msg.match(/https?:\/\/[^\s)]+/);
        if (m) {
          setIndexUrl(m[0]);
        }
        const extra = e.code ? ` [code: ${e.code}]` : '';
        const baseError = `Gagal memuat daftar staf tidak hadir. Error: ${msg}${extra}`;
        if (e.code === 'failed-precondition') {
          setError(`${baseError}. Database memerlukan indeks. ${m ? 'Klik link di bawah untuk membuatnya.' : 'Lihat log konsol untuk detail.'}`);
        } else {
          setError(baseError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    findAbsentUsers();

  }, [firestore]);

  const EmptyState = () => {
      if(isLoading) return <div className="flex flex-col items-center justify-center h-40 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mb-3" /><span>Mencari data pengguna...</span></div>;
      if(error) return (
        <div className="flex flex-col items-center justify-center h-40 text-destructive text-center px-4">
          <AlertCircle className="h-8 w-8 mb-3" />
          <span className="mb-2">{error}</span>
          {indexUrl ? (
            <button onClick={() => window.open(indexUrl, '_blank')} className="text-sm underline text-red-600">
              Buka Panduan Pembuatan Indeks di Firebase Console
            </button>
          ) : null}
        </div>
      )
      return <div className="flex flex-col items-center justify-center h-40 text-muted-foreground"><UserCheck className="h-8 w-8 mb-3" /><span>Semua staf hadir atau memiliki izin yang disetujui.</span></div>;
  }

  const getBadgeVariant = (status: AbsentUser['status']) => {
      switch(status) {
          case 'Alpa': return 'destructive';
          case 'Sakit': return 'secondary';
          case 'Izin': return 'default';
          case 'Menunggu Persetujuan': return 'outline';
          default: return 'secondary';
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Staf Tidak Hadir Hari Ini</CardTitle>
        <CardDescription>Staf yang tidak memiliki catatan kehadiran dan izinnya belum disetujui.</CardDescription>
      </CardHeader>
      <CardContent>
        {absentUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentUsers.map((user) => (
                <TableRow key={user.no}>
                  <TableCell className="font-medium">{user.no}</TableCell>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">NIP: {user.nip}</div>
                  </TableCell>
                  <TableCell>{user.position}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(user.status)}>
                        {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
};

export default AbsentUsersTable;
