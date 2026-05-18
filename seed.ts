/* eslint-disable no-console */
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, Timestamp } from 'firebase/firestore';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "studio-6483313657-7894b", // Your actual Project ID
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedSchoolConfiguration() {
  const batch = writeBatch(db);

  // 1. Default School-wide Configuration
  const schoolConfigRef = doc(db, 'schoolConfig', 'default');
  batch.set(schoolConfigRef, {
    isAttendanceActive: true,       // Master switch for attendance
    useTimeValidation: true,        // Enforce check-in/out times
    checkInStartTime: "06:00",       // 6 AM
    checkInEndTime: "08:30",         // 8:30 AM
    
    // Define checkout times per day (Sunday=0, Monday=1, etc.)
    checkOutTimes: {
      1: { start: "15:00", end: "18:00" }, // Monday
      2: { start: "15:00", end: "18:00" }, // Tuesday
      3: { start: "15:00", end: "18:00" }, // Wednesday
      4: { start: "15:00", end: "18:00" }, // Thursday
      5: { start: "11:00", end: "13:00" }, // Friday (earlier checkout)
      6: { start: "13:00", end: "15:00" }, // Saturday
    },

    // SET WEEKLY OFF DAY: [0] means Sunday is always an off day.
    offDays: [0], 

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  // 2. Monthly Holiday Configuration (Example for May 2024)
  const mayConfigRef = doc(db, 'monthlyConfigs', '2024-05');
  batch.set(mayConfigRef, {
    // SET SPECIFIC HOLIDAY DATES
    holidays: [
      "2024-05-01", // Labour Day
      "2024-05-09", // Ascension Day
      "2024-05-23", // Waisak Day
    ],
    notes: "Konfigurasi libur untuk Mei 2024."
  }, { merge: true });
  
  // 3. Monthly Holiday Configuration (Example for June 2024)
  const juneConfigRef = doc(db, 'monthlyConfigs', '2024-06');
  batch.set(juneConfigRef, {
    holidays: [
      "2024-06-01", // Pancasila Day
      "2024-06-17", // Eid al-Adha
    ],
    notes: "Konfigurasi libur untuk Juni 2024."
  }, { merge: true });

  try {
    await batch.commit();
    console.log('✅ Successfully seeded database with default configurations.');
    console.log('- Set weekly off-day to Sunday.');
    console.log('- Added national holidays for May & June 2024.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedSchoolConfiguration();
