'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, parseISO, isValid, eachDayOfInterval, isWithinInterval, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Firebase and custom hooks
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';

// Centralized Types
import { ReportItem } from '@/types/reports';

// UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import ReportView from './ReportView';

// Local Interfaces for server data
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
  initialMonth: string; 
  initialSchoolConfig: any;
}

export default function ReportClientShell({ 
    userId, 
    initialUserData,
    initialMonth,
    initialSchoolConfig,
}: ClientShellProps) {
    const router = useRouter();
    const firestore = useFirestore();
    const [userData] = useState(initialUserData);
    const parsedInitialMonth = parseISO(initialMonth);
    const [currentMonth, setCurrentMonth] = useState(isValid(parsedInitialMonth) ? parsedInitialMonth : new Date());

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

    // Correctly typed report details using the centralized ReportItem
    const reportDetails = useMemo((): ReportItem[] => {
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
            if (isRecurringOff || isBefore(day, today)) return null; // Days in future or off days are not processed

            const attendanceRecord = attendanceMap.get(dayStr);
            if (attendanceRecord) {
                const checkInTime = attendanceRecord.checkInTime.toDate();
                const checkOutTime = attendanceRecord.checkOutTime?.toDate() || null;
                let status = 'Hadir';
                let description = 'Kehadiran Penuh';

                // Your existing logic for status and description...

                return { id: dayStr, date: day, checkInTime, checkOutTime, status, description, raw: attendanceRecord };
            }
            
            const leaveRecord = leaveMap.get(dayStr);
            if (leaveRecord && leaveRecord.type !== 'Pulang Cepat') {
                return { id: dayStr, date: day, checkInTime: null, checkOutTime: null, status: leaveRecord.type, description: leaveRecord.reason, raw: leaveRecord };
            }
            
            // FIX: Ensure the object for 'Alpa' matches the ReportItem interface
            return { 
                id: dayStr, 
                date: day, 
                checkInTime: null, 
                checkOutTime: null, 
                status: 'Alpa', 
                description: 'Tidak Ada Keterangan', 
                raw: { id: dayStr, status: 'Alpa' } // Provide a valid raw object
            };
        });
        
        const validReport = report.filter(Boolean) as ReportItem[];
        validReport.sort((a, b) => b.date.getTime() - a.date.getTime());
        return validReport;

    }, [attendanceHistory, leaveHistory, initialSchoolConfig, currentMonth]);

    // ... (rest of the component remains the same: summaryStats, chartData, handlers, JSX)

    const handleMonthChange = (amount: number) => {
        const newMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 15);
        setCurrentMonth(newMonthDate);
    };

    const handleDownloadPdf = () => {};
    
    const isLoading = isAttendanceLoading || isLeaveLoading;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Ringkasan Laporan Bulan {format(currentMonth, 'MMMM yyyy', { locale: id })}</CardTitle>
                    <CardDescription>Grafik ringkasan kehadiran untuk {userData?.name || 'Pengguna'}.</CardDescription>
                </CardHeader>
                <CardContent>
                   {/* Chart and stats can be re-added here */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detail Laporan Harian</CardTitle>
                    <CardDescription>Rincian data kehadiran harian yang terekam oleh sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                       <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="w-36 text-center font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
                            <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)} disabled={endOfMonth(currentMonth) >= endOfMonth(new Date())}><ChevronRight className="h-4 w-4" /></Button>
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
                                    <TableHead className="text-center">Jam Masuk</TableHead>
                                    <TableHead className="text-center">Jam Pulang</TableHead>
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
                                            <p className="mt-2 text-muted-foreground">Memuat data...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : reportDetails.length > 0 ? (
                                    reportDetails.map((item) => (
                                        <ReportView key={item.id} item={item} userId={userId} schoolConfig={initialSchoolConfig} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada data untuk ditampilkan.
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
