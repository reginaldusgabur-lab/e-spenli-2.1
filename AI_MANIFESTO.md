# ==========================================================
# ================ AI MANIFESTO (E-SPENLI) ================
# ==========================================================

# Dokumen ini adalah satu-satunya sumber kebenaran untuk AI.
# AI HARUS membaca dan memahami file ini SEBELUM melakukan perubahan kode apa pun.

## 1. IDENTITAS INTI APLIKASI

- **Nama Proyek**: Aplikasi Absensi SMPN 5 Langke Rembong (E-SPENLI).
- **Tujuan Utama**: Mengelola, memantau, dan merekapitulasi absensi digital (masuk dan pulang) untuk staf sekolah.
- **Ini BUKAN**: Aplikasi perpustakaan, aplikasi keuangan, atau aplikasi manajemen siswa.

## 2. PERAN PENGGUNA & HAK AKSES (ATURAN MUTLAK)

Ini adalah aturan paling penting. Jangan pernah mencampuradukkan hak akses antar peran.

- **Admin**:
  - **Bisa**: Mengelola semua data master (pengguna, konfigurasi), melihat semua laporan, memiliki kontrol penuh.
  - **Tidak Bisa**: Melakukan absensi (peran ini hanya untuk manajemen).

- **Kepala Sekolah**:
  - **Bisa**: Memantau aktivitas SEMUA staf, melihat laporan SEMUA staf, menyetujui/menolak pengajuan izin & keterlambatan, melakukan absensi untuk dirinya sendiri.

- **Guru & Pegawai**:
  - **Bisa**: Melakukan absensi untuk dirinya SENDIRI, mengajukan izin/sakit, melihat laporan kehadiran PRIBADI.
  - **Tidak Bisa**: Melihat data atau laporan milik pengguna lain.

## 3. FILOSOFI DESAIN & ATURAN TEKNIS

- **Prioritas Fungsi**: Fungsi inti (Absensi, Laporan, Persetujuan) harus selalu diutamakan. Fitur sekunder (seperti AI Quote Generator) tidak boleh menghalangi atau menunda fungsi inti.
- **Efisiensi Biaya (Firebase Spark Plan)**: Aplikasi harus memaksimalkan penggunaan cache (memori browser) untuk meminimalkan operasi `reads` dari Firestore. Data yang sering diakses harus diambil dari cache jika memungkinkan.
- **Konsistensi Antarmuka (UI)**: Jangan merombak tata letak atau memindahkan komponen secara drastis kecuali diminta secara eksplisit. Pertahankan struktur navigasi dan dasbor yang sudah ada.
- **Logika ID Otomatis**: Jika diminta membuat ID otomatis (contoh: ID Anggota), sistem harus bisa mencari "lubang" atau ID terkecil yang kosong dari data yang sudah dihapus, bukan hanya menambah angka terakhir.

## 4. CONTOH CARA MEMBERI PERINTAH

"Berdasarkan `AI_MANIFESTO.md`, tambahkan fitur X di halaman Y. Ingat bahwa hanya peran **Admin** dan **Kepala Sekolah** yang boleh melihatnya."

"Sesuai aturan di `AI_MANIFESTO.md`, optimalkan query Firestore di halaman laporan untuk mengurangi jumlah `reads`."
