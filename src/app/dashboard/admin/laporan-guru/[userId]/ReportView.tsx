'use client';

import { format, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

// Firebase and custom hooks
import { useUser } from '@/firebase';

// Centralized Types
import { ReportItem } from '@/types/reports';

// UI Components
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from 'lucide-react';

// The self-contained modal component
import EditAttendanceModal from '@/components/modals/EditAttendanceModal';

// Props remain the same
interface ReportViewProps {
  item: ReportItem;
  userId: string;
  schoolConfig: any;
}

// This component is now much simpler.
// It no longer manages the modal's state.
const ReportView = ({ item, userId, schoolConfig }: ReportViewProps) => {
    const { user: currentUser } = useUser();

    const dateString = format(item.date, 'EEEE, dd MMMM yyyy', { locale: id });
    const checkInString = item.checkInTime ? format(item.checkInTime, 'HH:mm') : '-';
    const checkOutString = item.checkOutTime ? format(item.checkOutTime, 'HH:mm') : '-';

    // ... (statusColor logic is unchanged)
    let statusColor = "bg-gray-100 text-gray-800";
    if (item.status === 'Hadir') statusColor = "bg-green-100 text-green-800";
    if (item.status === 'Alpa') statusColor = "bg-red-100 text-red-800";
    // Add other status colors as needed

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
                {/* The Modal component is now rendered directly here. */}
                {/* It wraps the trigger button and handles its own state. */}
                <EditAttendanceModal
                    user={{ uid: userId }}
                    month={startOfMonth(item.date)}
                    currentUser={currentUser}
                    trigger={
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    }
                />
            </TableCell>
        </TableRow>
    );
}

export default ReportView;
