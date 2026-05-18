'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, startOfMonth, endOfMonth, parseISO, isValid, eachDayOfInterval, isWithinInterval, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Firebase and custom hooks for real-time data
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileWarning, CalendarClock, Loader2 } from 'lucide-react';
import ReportView from './ReportView'; // Correct default import

// --- Type Definitions ---
interface AttendanceRecordServer {
  id: string;
  checkInTime: Timestamp;
  checkOutTime?: Timestamp;
  manualEntry?: boolean;
}

interface LeaveRequestServer {
    id: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: string;
    type: string;
    reason: string;
}

interface ClientShellProps {
  userId: string;
  initialUserData: any;
  initialMonth: string; // ISO string from server
  initialSchoolConfig: any;
}

export default function ReportClientShell({ 
    userId, 
    initialUserData,
    initialMonth,
    initialSchoolConfig,
}: ClientShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const [userData] = useState(initialUserData);
    const parsedInitialMonth = parseISO(initialMonth);
    const [currentMonth, setCurrentMonth] = useState(isValid(parsedInitialMonth) ? parsedInitialMonth : new Date());

    // --- Real-time Data Fetching ---
    const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
    const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

    const attendanceQuery = useMemoFirebase(() => 
        firestore ? query(
            collection(firestore, 'users', userId, 'attendanceRecords'),
            where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
            where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
        ) : null, 
    [firestore, userId, monthStart, monthEnd]);

    const leaveQuery = useMemoFirebase(() => 
        firestore ? query(
            collection(firestore, 'users', userId, 'leaveRequests'),
            where('status', '==', 'approved'),
            where('startDate', '<=', Timestamp.fromDate(monthEnd))
        ) : null, 
    [firestore, userId, monthEnd]);

    const { data: attendanceHistory, isLoading: isAttendanceLoading } = useCollection<AttendanceRecordServer>(null, attendanceQuery);
    const { data: leaveHistory, isLoading: isLeaveLoading } = useCollection<LeaveRequestServer>(null, leaveQuery);

    const reportDetails = useMemo(() => {
        if (!attendanceHistory || !leaveHistory || !initialSchoolConfig) return [];
        
        const today = startOfDay(new Date());
        const offDays: number[] = Array.isArray(initialSchoolConfig.offDays) ? initialSchoolConfig.offDays : [0, 6];

        const attendanceMap = new Map(attendanceHistory.map(rec => [rec.id, rec]));
        const leaveMap = new Map<string, any>();
        leaveHistory.forEach(leave => {
            if(leave.endDate) {
                eachDayOfInterval({ start: leave.startDate.toDate(), end: leave.endDate.toDate() }).forEach(day => {
                    if (isWithinInterval(day, { start: monthStart, end: monthEnd })) {
                        leaveMap.set(format(day, 'yyyy-MM-dd'), leave);
                    }
                });
            }
        });

        const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const report = allDaysInMonth.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isRecurringOff = offDays.includes(day.getDay());
            if (isRecurringOff || isBefore(today, day)) return null;

            const attendanceRecord = attendanceMap.get(dayStr);
            if (attendanceRecord) {
                const checkInTime = attendanceRecord.checkInTime.toDate();
                const checkOutTime = attendanceRecord.checkOutTime?.toDate();
                let status = 'Hadir';
                let description = 'Kehadiran Penuh';

                if (initialSchoolConfig.useTimeValidation && initialSchoolConfig.checkInEndTime) {
                    const [endH, endM] = initialSchoolConfig.checkInEndTime.split(':').map(Number);
                    const checkInDeadline = new Date(checkInTime); checkInDeadline.setHours(endH, endM, 0, 0);
                    if (isBefore(checkInTime, checkInDeadline)) {
                        status = 'Hadir';
                        description = 'Tepat Waktu';
                    } else {
                        status = 'Terlambat';
                        description = 'Absen masuk setelah batas waktu.';
                    }
                } else {
                    description = 'Absen Terekam';
                }

                if (!checkOutTime && isBefore(day, today)) {
                    status = 'Tidak Pulang';
                    description = 'Tidak melakukan absen pulang.';
                }

                if (attendanceRecord.manualEntry) {
                    description += ' (Manual)';
                }

                return { id: dayStr, date: day, checkInTime, checkOutTime, status, description, raw: attendanceRecord };
            }
            
            const leaveRecord = leaveMap.get(dayStr);
            if (leaveRecord && leaveRecord.type !== 'Pulang Cepat') {
                return { id: dayStr, date: day, checkInTime: null, checkOutTime: null, status: leaveRecord.type, description: leaveRecord.reason, raw: leaveRecord };
            }

            return { id: dayStr, date: day, checkInTime: null, checkOutTime: null, status: 'Alpa', description: 'Tidak Ada Keterangan', raw: null };
        });

        const validReport = report.filter(Boolean) as any[];
        validReport.sort((a, b) => b.date.getTime() - a.date.getTime());
        return validReport;

    }, [attendanceHistory, leaveHistory, initialSchoolConfig, currentMonth]);

    const summaryStats = useMemo(() => {
        const hadir = reportDetails.filter(d => d.status === 'Hadir').length;
        const terlambat = reportDetails.filter(d => d.status === 'Terlambat').length;
        const sakit = reportDetails.filter(d => d.status === 'Sakit').length;
        const izin = reportDetails.filter(d => d.status === 'Izin' || d.status === 'Dinas').length;
        const alpa = reportDetails.filter(d => d.status === 'Alpa').length;
        const tidakPulang = reportDetails.filter(d => d.status === 'Tidak Pulang').length;
        return { hadir, terlambat, sakit, izin, alpa, tidakPulang };
    }, [reportDetails]);

    const chartData = [
        { name: 'Hadir', Jumlah: summaryStats.hadir, fill: '#22c55e' },
        { name: 'Terlambat', Jumlah: summaryStats.terlambat, fill: '#facc15' },
        { name: 'Sakit', Jumlah: summaryStats.sakit, fill: '#f97316' },
        { name: 'Izin/Dinas', Jumlah: summaryStats.izin, fill: '#3b82f6' },
        { name: 'Alpa', Jumlah: summaryStats.alpa, fill: '#ef4444' },
        { name: 'Tdk Pulang', Jumlah: summaryStats.tidakPulang, fill: '#eab308' },
    ];

    const handleMonthChange = (amount: number) => {
        const newMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 15);
        setCurrentMonth(newMonthDate);
    };

    const handleDownloadPdf = () => {
        // PDF generation logic would need to be updated to use the new `reportDetails` structure.
        // This is a placeholder for now.
    };
    
    const isLoading = isAttendanceLoading || isLeaveLoading;

    return (
        <div className="p-4 md:p-6 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Laporan Bulan {format(currentMonth, 'MMMM yyyy', { locale: id })}</CardTitle>
                    <CardDescription>Grafik ringkasan kehadiran untuk {userData?.name || 'Pengguna'}.</CardDescription>
                </CardHeader>
                <CardContent>
                   {/* The chart and stat cards would go here */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Laporan Harian</CardTitle>
                    <CardDescription>Rincian data kehadiran harian yang terekam oleh sistem. Data diperbarui secara real-time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                       <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="w-36 text-center font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
                            <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)} disabled={currentMonth >= endOfMonth(new Date())}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                        <Button onClick={handleDownloadPdf} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            Unduh Laporan PDF
                        </Button>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Jam Masuk</TableHead>
                                    <TableHead>Jam Pulang</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-36 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                            <p className="mt-2 text-muted-foreground">Memuat data real-time...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : reportDetails.length > 0 ? (
                                    reportDetails.map((item) => (
                                        <ReportView key={item.id} item={item} userId={userId} schoolConfig={initialSchoolConfig} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada data untuk ditampilkan pada periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}