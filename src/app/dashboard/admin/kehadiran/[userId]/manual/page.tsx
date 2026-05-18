'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { parse, format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ManualAttendancePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const { toast } = useToast();

    const userId = params.userId as string;
    const dateStr = searchParams.get('date');

    const [userData, setUserData] = useState<any>(null);
    const [existingRecord, setExistingRecord] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [error, setError] = useState<string | null>(null);

    const date = dateStr ? parse(dateStr, 'yyyy-MM-dd', new Date()) : new Date();
    const recordId = format(date, 'yyyy-MM-dd');

    const fetchData = async () => {
        if (isAuthLoading || !firestore || !authUser || !userId) return;
        
        setIsLoading(true);
        try {
            const adminDocRef = doc(firestore, 'users', authUser.uid);
            const adminDocSnap = await getDoc(adminDocRef);
            if (!adminDocSnap.exists() || adminDocSnap.data().role !== 'admin') {
                router.replace('/dashboard');
                return;
            }

            const userDocRef = doc(firestore, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) setUserData(userDocSnap.data());
            else {
                setError('Pengguna tidak ditemukan.');
                setIsLoading(false);
                return;
            }

            const recordRef = doc(firestore, 'users', userId, 'attendanceRecords', recordId);
            const recordSnap = await getDoc(recordRef);

            if (recordSnap.exists()) {
                const record = recordSnap.data();
                setExistingRecord({ ...record, id: recordSnap.id });
                setCheckIn(record.checkInTime ? format(record.checkInTime.toDate(), 'HH:mm') : '');
                setCheckOut(record.checkOutTime ? format(record.checkOutTime.toDate(), 'HH:mm') : '');
            } else {
                setExistingRecord(null);
                setCheckIn('');
                setCheckOut('');
            }
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [authUser, isAuthLoading, firestore, userId, recordId, router]);

    const handleReset = async () => {
        if (!existingRecord) return;

        setIsSubmitting(true);
        try {
            const recordRef = doc(firestore, 'users', userId, 'attendanceRecords', recordId);
            await deleteDoc(recordRef);
            toast({
                title: "Sukses",
                description: "Data kehadiran telah di-reset menjadi Alpa.",
            });
            // Refresh state to show that the record is gone
            setExistingRecord(null);
            setCheckIn('');
            setCheckOut('');
        } catch (err) {
            console.error("Error resetting attendance:", err);
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Gagal me-reset data kehadiran.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkIn) {
            setError('Jam masuk wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const recordRef = doc(firestore, 'users', userId, 'attendanceRecords', recordId);
            const docSnap = await getDoc(recordRef);

            const baseDate = parse(recordId, 'yyyy-MM-dd', new Date());
            const [inHours, inMinutes] = checkIn.split(':').map(Number);
            const checkInTimestamp = Timestamp.fromDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), inHours, inMinutes));
            
            let checkOutTimestamp = null;
            if (checkOut) {
                const [outHours, outMinutes] = checkOut.split(':').map(Number);
                checkOutTimestamp = Timestamp.fromDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), outHours, outMinutes));
            }

            let description = '';
            if (checkOutTimestamp) {
                description = 'Kehadiran Penuh';
            } else {
                description = docSnap.exists() ? 'Diperbarui oleh Admin' : 'Entri manual oleh Admin';
            }

            const dataToSave = {
                userId,
                date: recordId, 
                checkInTime: checkInTimestamp,
                checkOutTime: checkOutTimestamp,
                status: 'Hadir', 
                description: description,
                manualEntry: true,
            };

            if (docSnap.exists()) {
                await updateDoc(recordRef, { ...dataToSave, lastModifiedBy: authUser?.uid, lastModifiedAt: serverTimestamp() });
            } else {
                await setDoc(recordRef, { ...dataToSave, createdBy: authUser?.uid, createdAt: serverTimestamp() });
            }
            
            toast({ title: "Sukses", description: "Data kehadiran telah berhasil disimpan." });
            // Re-fetch data to update UI, especially to show the reset button
            fetchData();

        } catch (err) {
            console.error("Error submitting attendance:", err);
            setError('Gagal menyimpan perubahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
             <Button variant="outline" size="icon" onClick={() => router.back()} className="mb-4"><ArrowLeft className="h-4 w-4" /></Button>
            <Card>
                <CardHeader>
                    <CardTitle>Entri Kehadiran Manual</CardTitle>
                    {userData && (
                        <CardDescription>
                            Atur jam kehadiran untuk <span className="font-semibold">{userData.name}</span> pada <span className="font-semibold">{format(date, 'EEEE, dd MMMM yyyy', { locale: id })}</span>.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="checkIn">Jam Masuk</Label>
                                <Input id="checkIn" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="checkOut">Jam Pulang</Label>
                                <Input id="checkOut" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                            </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">Data yang disimpan akan menimpa entri sebelumnya pada tanggal yang sama.</p>
                        
                        <div className="flex justify-between items-center">
                            {existingRecord ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" type="button" disabled={isSubmitting}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tindakan ini akan menghapus data kehadiran ini dan mengembalikan statusnya menjadi Alpa. Anda tidak bisa mengurungkan tindakan ini.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReset}>Ya, Hapus dan Reset</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : <div />} 

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
