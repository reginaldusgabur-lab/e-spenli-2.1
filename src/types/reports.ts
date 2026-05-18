import { Timestamp } from 'firebase/firestore';

// Single, authoritative definition for a report item.
export interface ReportItem {
  id: string;
  date: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: string;
  description: string;
  // The raw data from Firestore, including the document ID.
  raw: { 
    id: string;
    [key: string]: any; 
  };
}

// Definition for problematic attendance days used in the modal.
export interface ProblematicDay {
    id: string;
    date: string;
    status: string;
    description: string;
    checkInTime?: Timestamp | Date | null;
    checkOutTime?: Timestamp | Date | null;
}
