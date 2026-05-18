'use client';

import { doc, getDoc, collection, getDocs, query, where, collectionGroup, DocumentData, Timestamp, getCountFromServer } from 'firebase/firestore';
import { eachDayOfInterval, isWithinInterval, startOfMonth, endOfMonth, startOfDay, subDays, format, isBefore, endOfDay, parseISO, isValid, isAfter, isToday } from 'date-fns';
import type { Firestore } from 'firebase/firestore';
import { id } from 'date-fns/locale';

// --- INTERFACES ---
interface User {
    id: string;
    name?: string;
    nip?: string;
    role?: string;
}

interface AttendanceData {
    id: string;
    date: string; 
    status: string;
    description: string;
    checkInTime?: Timestamp;
    checkOutTime?: Timestamp;
}

// *** DEFINITIVE FIX FOR "MACET" & "DATA HILANG" ***
// The root cause was an incorrect query strategy that either hung the database or returned no data.
// This new implementation fetches all data in a few broad, efficient queries and processes it in-memory,
// correctly referencing user IDs from document paths. This is both performant and correct.

export async function calculateMultipleUserStats(firestore: Firestore, users: User[], currentMonth: Date) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const today = new Date();

    if (!users.length) {
        return [];
    }
    const userMap = new Map(users.map(u => [u.id, u]));

    const [schoolConfigSnap, monthlyConfigSnap] = await Promise.all([
        getDoc(doc(firestore, 'schoolConfig', 'default')),
        getDoc(doc(firestore, 'monthlyConfigs', format(monthStart, 'yyyy-MM'))),
    ]);

    const schoolConfig = schoolConfigSnap.data() || {};
    const monthlyConfig = monthlyConfigSnap.data() || {};

    const offDays: number[] = schoolConfig?.offDays ?? [0];
    const holidays: string[] = Array.isArray(monthlyConfig?.holidays) ? monthlyConfig.holidays : [];
    const effectiveWorkingDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(day =>
        !offDays.includes(day.getDay()) && 
        !holidays.includes(format(day, 'yyyy-MM-dd')) &&
        !isAfter(day, today)
    );
    const totalWorkingDays = effectiveWorkingDays.length;

    if (totalWorkingDays === 0) {
        return users.map(user => ({ userId: user.id, name: user.name || 'N/A', nip: user.nip || '-', role: user.role || 'N/A', totalHadir: 0, totalIzin: 0, totalSakit: 0, totalAlpa: 0, percentage: 100.0 }));
    }

    const attendanceQuery = query(
        collectionGroup(firestore, 'attendanceRecords'),
        where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
    );
    const leaveQuery = query(collectionGroup(firestore, 'leaveRequests'), where('status', '==', 'approved'));

    const [attendanceSnap, leaveSnap] = await Promise.all([ getDocs(attendanceQuery), getDocs(leaveQuery) ]);

    const attendanceMap = new Map<string, Set<string>>();
    attendanceSnap.forEach(doc => {
        const record = doc.data();
        const userId = doc.ref.parent.parent?.id;
        if (userId && userMap.has(userId)) {
            if (!attendanceMap.has(userId)) attendanceMap.set(userId, new Set());
            attendanceMap.get(userId)!.add(record.date);
        }
    });

    const leaveMap = new Map<string, Map<string, any>>();
    leaveSnap.forEach(doc => {
        const leave = doc.data();
        const userId = doc.ref.parent.parent?.id;
        if (userId && userMap.has(userId) && leave.startDate && leave.endDate) {
            if (!leaveMap.has(userId)) leaveMap.set(userId, new Map());
            eachDayOfInterval({ start: leave.startDate.toDate(), end: leave.endDate.toDate() }).forEach(day => {
                if (isWithinInterval(day, { start: monthStart, end: monthEnd })) {
                    leaveMap.get(userId)!.set(format(day, 'yyyy-MM-dd'), leave.type || 'Izin');
                }
            });
        }
    });

    const finalStats = users.map(user => {
        let totalHadir = 0, totalIzin = 0, totalSakit = 0, totalAlpa = 0;
        const userAttendance = attendanceMap.get(user.id);
        const userLeave = leaveMap.get(user.id);

        effectiveWorkingDays.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            if (userAttendance?.has(dayStr)) {
                totalHadir++;
            } else if (userLeave?.has(dayStr)) {
                userLeave.get(dayStr) === 'Sakit' ? totalSakit++ : totalIzin++;
            } else {
                totalAlpa++;
            }
        });

        const percentage = totalWorkingDays > 0 ? ((totalHadir + totalIzin + totalSakit) / totalWorkingDays) * 100 : 100;

        return {
            userId: user.id, name: user.name || 'N/A', nip: user.nip || '-', role: user.role || 'N/A',
            totalHadir, totalIzin, totalSakit, totalAlpa,
            percentage: Math.min(percentage, 100),
        };
    });

    return finalStats;
}

// --- UNMODIFIED ORIGINAL FUNCTIONS ---

export async function getDailyStaffAttendanceStats(firestore: Firestore) {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const usersQuery = query(collection(firestore, 'users'), where('role', 'in', ['guru', 'pegawai', 'kepala_sekolah']));
    const attendanceQuery = query(collectionGroup(firestore, 'attendanceRecords'), where('checkInTime', '>=', startOfToday), where('checkInTime', '<=', endOfToday));
    const leaveQuery = query(collectionGroup(firestore, 'leaveRequests'));
    const lateSubmissionQuery = query(collectionGroup(firestore, 'lateSubmissions'), where('status', '==', 'pending'));

    const [usersSnap, attendanceSnap, leaveSnap, lateSubmissionSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(attendanceQuery),
        getDocs(leaveQuery),
        getDocs(lateSubmissionQuery)
    ]);

    const allStaff = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const pendingLateCount = lateSubmissionSnap.size;
    const presentUserIds = new Set<string>();
    attendanceSnap.forEach(doc => {
        const userId = doc.ref.parent.parent?.id;
        if (userId) presentUserIds.add(userId);
    });

    const leaveStatusByUserId = new Map<string, { status: string, type: string }>();
    leaveSnap.forEach(doc => {
        const leave = doc.data();
        const startDate = leave.startDate?.toDate();
        const endDate = leave.endDate?.toDate();
        if (startDate && endDate && isWithinInterval(today, { start: startDate, end: endDate })) {
            const userId = doc.ref.parent.parent?.id;
            if (userId) {
                if (!leaveStatusByUserId.has(userId) || leave.status === 'approved') {
                    leaveStatusByUserId.set(userId, { status: leave.status, type: leave.type || 'Izin' });
                }
            }
        }
    });

    let izinCount = 0, sakitCount = 0, alpaCount = 0, pendingLeaveCount = 0;
    const notPresentStaff = allStaff.filter(user => !presentUserIds.has(user.id));

    notPresentStaff.forEach(user => {
        const leaveInfo = leaveStatusByUserId.get(user.id);
        if (leaveInfo) {
            if (leaveInfo.status === 'approved') {
                if (leaveInfo.type === 'Pulang Cepat') return;
                const type = (leaveInfo.type || '').toLowerCase();
                if (type === 'sakit') sakitCount++; else izinCount++;
            } else if (leaveInfo.status === 'pending') {
                 if ((leaveInfo.type || '').toLowerCase() !== 'pulang cepat') pendingLeaveCount++;
            }
        } else {
            alpaCount++;
        }
    });

    const approvedLateQuery = query(collectionGroup(firestore, 'lateSubmissions'), where('status', '==', 'approved'), where('date', '==', format(today, 'yyyy-MM-dd')));
    const approvedLateSnap = await getDocs(approvedLateQuery);
    const approvedLateUserIds = new Set(approvedLateSnap.docs.map(d => d.data().userId));

    const finalAlpaCount = notPresentStaff.filter(user => {
        const leaveInfo = leaveStatusByUserId.get(user.id);
        const hasApprovedLate = approvedLateUserIds.has(user.id);
        return !presentUserIds.has(user.id) && !leaveInfo && !hasApprovedLate;
    }).length;

    return {
        totalStaff: allStaff.length,
        hadir: presentUserIds.size + approvedLateUserIds.size,
        izin: izinCount, sakit: sakitCount, alpa: finalAlpaCount,
        pendingLeave: pendingLeaveCount, pendingLate: pendingLateCount,
    };
}

export async function calculateAttendanceStats(firestore: Firestore, userId: string, currentMonth: Date) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const [schoolConfigSnap, monthlyConfigSnap] = await Promise.all([
        getDoc(doc(firestore, 'schoolConfig', 'default')),
        getDoc(doc(firestore, 'monthlyConfigs', format(monthStart, 'yyyy-MM'))),
    ]);

    const schoolConfig = schoolConfigSnap.data() || {};
    const monthlyConfig = monthlyConfigSnap.data() || {};

    const offDays: number[] = schoolConfig?.offDays ?? [0];
    const holidays: string[] = Array.isArray(monthlyConfig?.holidays) ? monthlyConfig.holidays : [];
    
    const effectiveWorkingDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(day =>
        !offDays.includes(day.getDay()) && !holidays.includes(format(day, 'yyyy-MM-dd'))
    );
    
    const totalWorkingDays = effectiveWorkingDays.length;
    const dailyStatuses = await fetchUserMonthlyReportData(firestore, userId, currentMonth, schoolConfig, monthlyConfig);
    
    if (totalWorkingDays === 0) {
        return { totalHadir: 0, totalIzin: 0, totalSakit: 0, totalAlpa: 0, percentage: 100.0, dailyStatuses: [] };
    }

    let totalHadir = 0, totalIzin = 0, totalSakit = 0, totalAlpa = 0;
    dailyStatuses.forEach(report => {
        switch ((report.status || '').toLowerCase()) {
            case 'hadir': case 'terlambat': totalHadir++; break;
            case 'dinas': case 'izin': totalIzin++; break;
            case 'sakit': totalSakit++; break;
            case 'alpa': totalAlpa++; break;
        }
    });

    const percentage = totalWorkingDays > 0 ? ((totalHadir + totalIzin + totalSakit) / totalWorkingDays) * 100 : 100;

    return {
        totalHadir, totalIzin, totalSakit, totalAlpa,
        percentage: Math.min(percentage, 100),
        dailyStatuses
    };
}

export async function fetchUserMonthlyReportData(firestore: Firestore, userId: string, currentMonth: Date, schoolConfig: any, monthlyConfig: any) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const today = new Date();

    const attendanceHistoryQuery = query(collection(firestore, 'users', userId, 'attendanceRecords'), where('date', '>=', format(monthStart, 'yyyy-MM-dd')), where('date', '<=', format(monthEnd, 'yyyy-MM-dd')));
    const leaveHistoryQuery = query(collection(firestore, 'users', userId, 'leaveRequests'), where('status', '==', 'approved'));
    const lateHistoryQuery = query(collection(firestore, 'users', userId, 'lateSubmissions'), where('date', '>=', format(monthStart, 'yyyy-MM-dd')), where('date', '<=', format(monthEnd, 'yyyy-MM-dd')));

    const [attendanceHistorySnap, leaveHistorySnap] = await Promise.all([ getDocs(attendanceHistoryQuery), getDocs(leaveHistoryQuery) ]);
    const lateHistorySnap = await getDocs(lateHistoryQuery);

    const attendanceHistory = attendanceHistorySnap.docs.map(d => ({ ...d.data(), id: d.id })) as AttendanceData[];
    const leaveHistory = leaveHistorySnap.docs.map(d => d.data());

    const offDays = Array.isArray(schoolConfig?.offDays) ? schoolConfig.offDays : [0];
    const holidays = Array.isArray(monthlyConfig?.holidays) ? monthlyConfig.holidays : [];

    const attendanceMap = new Map<string, AttendanceData>(attendanceHistory.map(rec => [rec.date, rec]));
    const leaveMap = new Map<string, any>();
    leaveHistory.forEach(leave => {
        if (!leave.startDate || !leave.endDate) return;
        eachDayOfInterval({ start: leave.startDate.toDate(), end: leave.endDate.toDate() }).forEach(day => {
            if (isWithinInterval(day, { start: monthStart, end: monthEnd })) leaveMap.set(format(day, 'yyyy-MM-dd'), leave);
        });
    });

    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const report = [];
    const lateMap = new Map<string, any>();
    lateHistorySnap.docs.forEach(d => {
        const data = d.data();
        if (data && data.date) lateMap.set(data.date, data);
    });

    for (const day of allDaysInMonth) {
        const dayStr = format(day, 'yyyy-MM-dd');
        if (offDays.includes(day.getDay()) || holidays.some((h: string) => h === dayStr) || isAfter(day, today)) continue; // FIX: Explicitly type 'h' as string

        let recordForDay;
        const attendanceRecord = attendanceMap.get(dayStr);
        if (attendanceRecord) {
            const late = lateMap.get(dayStr);
            let status = attendanceRecord.status || 'Hadir';
            let description = attendanceRecord.description || 'Hadir';
            if (late) {
                if (late.status === 'approved') {
                    status = 'Terlambat';
                    description = `Disetujui: ${late.reason || late.note || late.description || ''}`.trim();
                } else if (late.status === 'pending') {
                    status = 'Terlambat';
                    description = `Menunggu Persetujuan: ${late.reason || ''}`.trim();
                }
            }
            recordForDay = { id: attendanceRecord.id, date: parseISO(attendanceRecord.date), checkInTime: attendanceRecord.checkInTime?.toDate() || null, checkOutTime: attendanceRecord.checkOutTime?.toDate() || null, status, description };
        } else {
            const leaveRecord = leaveMap.get(dayStr);
            if (leaveRecord && (leaveRecord.type || '').toLowerCase() !== 'pulang cepat') {
                recordForDay = { id: `${dayStr}-${leaveRecord.id}`, date: day, status: leaveRecord.type || 'Izin', description: leaveRecord.reason || 'Disetujui' };
            } else {
                const lateRecord = lateMap.get(dayStr);
                if (lateRecord && lateRecord.status === 'approved') {
                    recordForDay = { id: `${dayStr}-late`, date: day, status: 'Terlambat', description: `Disetujui: ${lateRecord.reason || ''}` };
                } else if (lateRecord && lateRecord.status === 'pending') {
                    recordForDay = { id: `${dayStr}-late`, date: day, status: 'Terlambat', description: `Menunggu Persetujuan: ${lateRecord.reason || ''}` };
                } else {
                    recordForDay = { id: dayStr, date: day, status: 'Alpa', description: 'Tidak Ada Keterangan' };
                }
            }
        }
        if (recordForDay) report.push(recordForDay);
    }

    report.sort((a, b) => b.date.getTime() - a.date.getTime());

    return report.map(item => ({ ...item, date: item.date.toISOString(), checkInTime: (item as any).checkInTime?.toISOString() || null, checkOutTime: (item as any).checkOutTime?.toISOString() || null }));
}