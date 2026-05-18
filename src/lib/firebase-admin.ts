
import admin from 'firebase-admin';

// Definisikan variabel untuk instance Firestore dan Auth
let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

// Ambil kredensial dari variabel lingkungan
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

// INILAH PERBAIKANNYA:
// Kita hanya akan mencoba menginisialisasi jika SEMUA kredensial yang diperlukan tersedia.
// Selama 'npm run build', privateKey akan hilang, sehingga blok ini akan dilewati
// dan proses build tidak akan crash.
if (projectId && clientEmail && privateKey && databaseURL) {
  // Periksa apakah aplikasi sudah diinisialisasi untuk menghindari error inisialisasi ulang
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          // Pastikan private key diformat dengan benar, mengganti escape character `\n` dengan newline sungguhan
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: databaseURL,
      });
      console.log('Firebase Admin SDK berhasil diinisialisasi.');
    } catch (error) {
      console.error('Gagal menginisialisasi Firebase Admin SDK:', error);
    }
  } else {
    console.log('Firebase Admin SDK sudah diinisialisasi sebelumnya.');
  }
}

// Setelah inisialisasi (atau jika dilewati), coba untuk mendapatkan instance
// Ini mungkin masih null jika inisialisasi dilewati, yang mana tidak apa-apa untuk proses build
if (admin.apps.length > 0) {
  adminDb = admin.firestore();
  adminAuth = admin.auth();
}

// Ekspor instance (yang mungkin null jika inisialisasi dilewati)
export { adminDb, adminAuth };
