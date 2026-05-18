'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format, startOfMonth, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchUserMonthlyReportData, MonthlyReportData } from '@/lib/attendance';
import { Download, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';

// Helper to safely format dates that might be Timestamps or ISO strings
const safeFormat = (dateInput: any, formatString: string): string => {
    if (!dateInput) return '-';
    let date: Date;
    if (typeof dateInput === 'string') {
        date = parseISO(dateInput);
    } else if (dateInput.toDate) { // Handle Firebase Timestamp
        date = dateInput.toDate();
    } else {
        date = new Date(dateInput);
    }
    return isValid(date) ? format(date, formatString, { locale: id }) : '-';
};


export default function UserReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const userId = params.userId as string;

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReportData[]>([]);
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const schoolConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'schoolConfig', 'default') : null, [firestore]);
<<<<<<< HEAD
    const { data: schoolConfigData, isLoading: isConfigLoading } = useDoc(currentUser, schoolConfigRef);

    useEffect(() => {
        if (!firestore || !userId || !schoolConfigData || !currentUser) return;
        
        // Security check is handled in the render section. This effect will only run for authorized users.
=======
    const { data: schoolConfigData, loading: isConfigLoading } = useDoc(currentUser, schoolConfigRef);

    useEffect(() => {
        if (!firestore || !userId || !schoolConfigData || !currentUser) return;
        if (!['admin', 'kepala_sekolah'].includes(currentUser.role)) return;
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
<<<<<<< HEAD
                // Authorization check: ensure user can only access their own report or if they are an admin/headmaster
                if (currentUser.role !== 'admin' && currentUser.role !== 'kepala_sekolah' && currentUser.uid !== userId) {
                     throw new Error('Anda tidak memiliki izin untuk melihat laporan ini.');
                }

=======
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
                const userRef = doc(firestore, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    throw new Error('Pengguna tidak ditemukan.');
                }
                setUserData(userSnap.data());

                const reportData = await fetchUserMonthlyReportData(firestore, userId, currentMonth, schoolConfigData);
                setMonthlyReportData(reportData);

            } catch (err: any) {
                console.error("Error fetching user report detail:", err);
                setError(err.message || 'Gagal memuat data laporan pengguna.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore, userId, currentMonth, schoolConfigData, currentUser]);

    const changeMonth = (amount: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const handleDownloadPdf = async () => {
        if (!userData || monthlyReportData.length === 0) return;

        // Dynamically import libraries only on the client-side
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();
        const monthName = format(currentMonth, 'MMMM yyyy', { locale: id });

        // Title
        doc.setFontSize(18);
        doc.text(`Laporan Kehadiran`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Nama: ${userData.name}`, 14, 30);
        doc.text(`Periode: ${monthName}`, 14, 36);

        // Table
        autoTable(doc, {
            startY: 40,
            head: [['No', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan']],
            body: monthlyReportData.map((item, index) => [
                index + 1,
                safeFormat(item.date, 'eeee, dd/MM/yy'),
                safeFormat(item.checkInTime, 'HH:mm:ss'),
                safeFormat(item.checkOutTime, 'HH:mm:ss'),
                item.status,
                item.description
            ]),
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
        });

        doc.save(`laporan_${userData.name.replace(/\s/g, '_')}_${monthName.replace(/\s/g, '_')}.pdf`);
    };

    const pageIsLoading = isLoading || isUserLoading || isConfigLoading;

<<<<<<< HEAD
    // Authorization check
    if (!isUserLoading && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'kepala_sekolah' && currentUser.uid !== userId) {
=======
    if (!isUserLoading && currentUser && !['admin', 'kepala_sekolah'].includes(currentUser.role)) {
>>>>>>> 2842d5e23fa8e4a7e1dcf4b60fdde59c65b3426a
        return (
             <PageWrapper>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Akses Ditolak</AlertTitle>
                    <AlertDescription>Anda tidak memiliki izin untuk melihat halaman ini.</AlertDescription>
                </Alert>
            </PageWrapper>
        );
    }

    if (pageIsLoading) {
        return (
            <PageWrapper>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </PageWrapper>
        );
    }
    
    if (error) {
        return (
             <PageWrapper>
                <Alert variant="destructive">
                    <AlertTitle>Terjadi Kesalahan</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/laporan-sekolah')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Laporan Sekolah
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Detail Laporan Kehadiran</CardTitle>
                    <CardDescription>Laporan kehadiran harian untuk <span className='font-semibold'>{userData?.name || 'Pengguna'}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} disabled={currentMonth.getFullYear() === 2026 && currentMonth.getMonth() === 0}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="w-36 text-center font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: id })}</span>
                            <Button variant="outline" size="icon" onClick={() => changeMonth(1)} disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={handleDownloadPdf} disabled={monthlyReportData.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Unduh Laporan PDF
                        </Button>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[5%]">No</TableHead>
                                    <TableHead className="w-[25%]">Tanggal</TableHead>
                                    <TableHead className="w-[15%]">Jam Masuk</TableHead>
                                    <TableHead className="w-[15%]">Jam Pulang</TableHead>
                                    <TableHead className="w-[15%]">Status</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyReportData.length > 0 ? (
                                    monthlyReportData.map((item, index) => (
                                        <TableRow key={item.id} className={item.status === 'Alpa' ? 'bg-red-50/50' : item.status === 'Libur' ? 'bg-gray-50/50' : ''}>
                                            <TableCell className='text-center'>{index + 1}</TableCell>
                                            <TableCell>{safeFormat(item.date, 'eeee, dd MMMM yyyy')}</TableCell>
                                            <TableCell className='text-center'>{safeFormat(item.checkInTime, 'HH:mm:ss')}</TableCell>
                                            <TableCell className='text-center'>{safeFormat(item.checkOutTime, 'HH:mm:ss')}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ item.status === 'Hadir' ? 'bg-green-100 text-green-800' : item.status === 'Alpa' ? 'bg-red-100 text-red-800' : item.status === 'Sakit' || item.status === 'Izin' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800' }`}>
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.description}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Tidak ada data kehadiran untuk ditampilkan pada periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </PageWrapper>
    );
}
