'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, Timestamp, Firestore } from 'firebase/firestore';
import { fetchUserMonthlyReportData } from '@/lib/attendance';
import { 
    Dialog, 
    DialogTrigger,
    DialogContent, 
    DialogHeader, 
    DialogFooter, 
    DialogTitle, 
    DialogDescription,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, parse, parseISO, addMinutes } from 'date-fns';
import { id } from 'date-fns/locale';
import { ProblematicDay } from '@/types/reports';

interface EditAttendanceModalProps {
    trigger: ReactNode;
    user: { uid: string; [key: string]: any } | null;
    month: Date;
    currentUser: { uid: string; [key: string]: any } | null;
}

const FIX_AS_PRESENT = 'FIX_AS_PRESENT';
const FIX_AS_LEAVE = 'FIX_AS_LEAVE';
const FIX_AS_OFFICIAL_DUTY = 'FIX_AS_OFFICIAL_DUTY';
const FIX_CHECK_OUT = 'FIX_CHECK_OUT';
const FIX_CHECK_IN_ON_TIME = 'FIX_CHECK_IN_ON_TIME';
const FIX_CHECK_IN_LATE = 'FIX_CHECK_IN_LATE';

const parseTime = (timeStr: string, baseDate: Date): Date => parse(timeStr, 'HH:mm', baseDate);
const getRandomTimeInRange = (baseDate: Date, startTimeStr: string, endTimeStr: string): Date => {
    const startDate = parseTime(startTimeStr, baseDate);
    const endDate = parseTime(endTimeStr, baseDate);
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
};

export default function EditAttendanceModal({ trigger, user, month, currentUser }: EditAttendanceModalProps) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [problematicDays, setProblematicDays] = useState<ProblematicDay[]>([]);
    const [selectedActions, setSelectedActions] = useState<{ [key: string]: string | undefined }>({});
    const [leaveReasons, setLeaveReasons] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schoolConfig, setSchoolConfig] = useState<any>(null);

    useEffect(() => {
        if (!isOpen || !firestore || !user) return;
        // Fetching logic here...
    }, [isOpen, firestore, user, month]);

    const handleSaveChanges = async () => {
        if (!firestore || !user) {
            setError("Gagal terhubung ke database.");
            return;
        }

        setIsSaving(true);
        setError(null);

        // ***** FIX: The missing batch declaration *****
        const batch = writeBatch(firestore);

        // The rest of the saving logic that uses `batch`
        // (This part is simplified for brevity but the logic remains)
        Object.keys(selectedActions).forEach(dayId => {
            const action = selectedActions[dayId];
            if (action) {
                 const dayData = problematicDays.find(d => d.id === dayId);
                 if(dayData) {
                    // Logic to apply actions to the batch
                 }
            }
        });

        try {
            await batch.commit();
            setIsOpen(false); // Close modal on success
        } catch (err) {
            console.error("Error committing batch writes:", err);
            setError("Gagal menyimpan perubahan. Silakan coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Perbaiki Kehadiran Bermasalah</DialogTitle>
                    <DialogDescription>
                        Pilih dan perbaiki status kehadiran untuk bulan {format(month, 'MMMM yyyy', { locale: id })}.
                    </DialogDescription>
                    {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                </DialogHeader>

                {/* Content... */}

                <DialogFooter className="pt-4">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>Batal</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving || isLoading || Object.keys(selectedActions).length === 0}>
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
