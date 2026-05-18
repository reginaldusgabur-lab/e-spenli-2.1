'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, where, getDocs, doc, getDoc, DocumentData, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { Loader2, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  nip: string;
  checkInTime: string;
  checkOutTime: string;
  rawCheckInTime: Date | null;
  status: 'Hadir' | 'Pulang';
  keterangan: string;
}

const RecentAttendanceTable = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const activitiesRef = useRef(activities);
  useEffect(() => {
    activitiesRef.current = activities;
  });

  const fetchActivities = useCallback(async (isManualRefresh = false) => {
    if (!firestore) {
      setStatus('error');
      setError('Layanan database tidak tersedia.');
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setStatus('loading');
    }

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const attendanceQuery = query(
        collectionGroup(firestore, 'attendanceRecords'),
        where('date', '==', todayStr),
        orderBy('checkInTime', 'asc') // Urutkan berdasarkan jam masuk (paling pagi dulu)
      );

      const snapshot = await getDocs(attendanceQuery);
      const rawActivities: any[] = [];
      const userIdsToFetch = new Set<string>();

      snapshot.docs.forEach(docSnapshot => {
        const attendanceData = docSnapshot.data();
        // Hanya tampilkan yang sudah absen masuk
        if (attendanceData.checkInTime) {
          const userId = docSnapshot.ref.parent.parent?.id;
          rawActivities.push({ ...attendanceData, id: docSnapshot.id, userId });
          if (!attendanceData.userName && userId) {
            userIdsToFetch.add(userId);
          }
        }
      });

      const usersMap = new Map<string, DocumentData>();
      if (userIdsToFetch.size > 0) {
        const userPromises = Array.from(userIdsToFetch).map(uid => getDoc(doc(firestore, 'users', uid)));
        const userSnapshots = await Promise.all(userPromises);
        userSnapshots.forEach(userSnap => {
          if (userSnap.exists()) {
            usersMap.set(userSnap.id, userSnap.data());
          }
        });
      }

      const fetchedActivities: Activity[] = rawActivities.map(attendanceData => {
        const userData = usersMap.get(attendanceData.userId);
        const name = attendanceData.userName || userData?.name;
        const nip = attendanceData.userNip || userData?.nip;
        const checkInDate = attendanceData.checkInTime?.toDate() ?? null;

        return {
          id: attendanceData.id,
          name: name || '-',
          nip: nip || '-',
          rawCheckInTime: checkInDate,
          checkInTime: checkInDate ? format(checkInDate, 'HH:mm:ss') : '-',
          checkOutTime: attendanceData.checkOutTime ? format(attendanceData.checkOutTime.toDate(), 'HH:mm:ss') : '-',
          status: attendanceData.checkOutTime ? 'Pulang' : 'Hadir',
          keterangan: attendanceData.description || (attendanceData.checkOutTime ? 'Kehadiran Penuh' : 'Masih di tempat'),
        };
      });
      
      // Pengurutan manual tidak lagi diperlukan karena sudah dihandle oleh query firestore

      if (isManualRefresh) {
        const oldIds = activitiesRef.current.map(a => a.id).join(',');
        const newIds = fetchedActivities.map(a => a.id).join(',');

        if (oldIds === newIds) {
          toast({
            title: "Tidak Ada Data Baru",
            description: "Daftar kehadiran masih sama dengan yang terakhir dimuat.",
          });
        } else {
          setActivities(fetchedActivities);
          toast({
            title: "Data Diperbarui",
            description: "Daftar aktivitas kehadiran telah berhasil dimuat ulang.",
          });
        }
      } else {
        setActivities(fetchedActivities);
      }

      setStatus('success');
      setError(null);

    } catch (err: any) {
      console.error("Error fetching activities:", err);
      if (err.code === 'failed-precondition') {
        setError("Database memerlukan indeks. Silakan buat indeks komposit. Cek log konsol untuk link pembuatan indeks.");
        console.error("Firestore Index Creation Link:", err.message);
      } else {
        setError("Gagal memuat aktivitas. Periksa koneksi internet Anda.");
      }
      setStatus('error');
    } finally {
      setIsRefreshing(false);
      // Hapus setStatus dari sini agar loading indicator tidak hilang prematur
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (firestore) {
      fetchActivities(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  const todayFormatted = format(new Date(), "d MMMM yyyy", { locale: indonesiaLocale });

  const sortedNumberedActivities = useMemo(() => {
    return activities.map((activity, index) => ({ ...activity, no: index + 1 }));
  }, [activities]);

  const TableContent = () => {
    if (status === 'loading' && !isRefreshing) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-56 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">Memuat aktivitas...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (status === 'error') {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-56 text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
              <span className='font-medium text-destructive'>{error}</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (sortedNumberedActivities.length === 0 && status !== 'loading') {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-56 text-center">
            <div className="flex flex-col items-center justify-center">
              <WifiOff className="w-10 h-10 mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Belum Ada Aktivitas</h3>
              <p className="text-muted-foreground">Belum ada staf yang melakukan absensi masuk hari ini.</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return sortedNumberedActivities.map((activity) => (
      <TableRow key={activity.id}>
        <TableCell className="font-medium text-center">{activity.no}</TableCell>
        <TableCell>
          <div className="font-medium">{activity.name}</div>
          <div className="text-sm text-muted-foreground">NIP: {activity.nip}</div>
        </TableCell>
        <TableCell className='text-center'>{activity.checkInTime}</TableCell>
        <TableCell className='text-center'>{activity.checkOutTime}</TableCell>
        <TableCell className='text-center'>
          <Badge variant={activity.status === 'Hadir' ? 'default' : 'secondary'}>
            {activity.status}
          </Badge>
        </TableCell>
        <TableCell>{activity.keterangan}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Aktivitas Kehadiran Hari Ini</CardTitle>
          <CardDescription>Daftar absensi pada tanggal {todayFormatted}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchActivities(true)}
          disabled={isRefreshing}
          aria-label="Perbarui Data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">No</TableHead>
              <TableHead className='w-[200px]'>Nama</TableHead>
              <TableHead className='text-center'>Jam Masuk</TableHead>
              <TableHead className='text-center'>Jam Pulang</TableHead>
              <TableHead className='text-center'>Status</TableHead>
              <TableHead>Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableContent />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentAttendanceTable;
