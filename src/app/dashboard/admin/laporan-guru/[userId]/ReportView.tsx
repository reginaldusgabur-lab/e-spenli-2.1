'use client';

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// --- Type Definitions ---
interface ReportItem {
  id: string;
  date: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: string;
  description: string;
  raw: any; // Raw data from Firestore
}

interface ReportViewProps {
  item: ReportItem;
  userId: string;
  schoolConfig: any;
}

// This component is a Table Row renderer.
const ReportView = ({ item, userId, schoolConfig }: ReportViewProps) => {

    const dateString = format(item.date, 'EEEE, dd MMMM yyyy', { locale: id });
    const checkInString = item.checkInTime ? format(item.checkInTime, 'HH:mm') : '-';
    const checkOutString = item.checkOutTime ? format(item.checkOutTime, 'HH:mm') : '-';

    let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    switch (item.status) {
        case 'Hadir':
            statusColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            break;
        case 'Terlambat':
            statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            break;
        case 'Sakit':
            statusColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            break;
        case 'Izin':
        case 'Dinas':
            statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            break;
        case 'Alpa':
            statusColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            break;
        case 'Tidak Pulang':
            statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
            break;
    }

    return (
        <TableRow>
            <TableCell className="font-medium">{dateString}</TableCell>
            <TableCell className="text-center">{checkInString}</TableCell>
            <TableCell className="text-center">{checkOutString}</TableCell>
            <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                    {item.status}
                </span>
            </TableCell>
            <TableCell>{item.description}</TableCell>
            <TableCell className="text-right">
                {/* The edit button can be used to open a modal to correct attendance */}
                <Button variant="ghost" size="icon" disabled={!item.raw}> {/* Disable if no raw data to edit */}
                    <Pencil className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default ReportView;
