# Sistem Manajemen Keuangan Tabungan Siswa

Aplikasi manajemen tabungan siswa yang sederhana, responsif, dan mudah digunakan. Menggunakan **React + Vite** untuk frontend dan **Google Sheets + Google Apps Script** sebagai database dan backend.

## Fitur Utama

- **Dashboard**: Ringkasan jumlah siswa, total saldo, setoran, dan penarikan.
- **Data Siswa**: Manajemen data siswa (CRUD) dengan status Aktif/Tidak Aktif.
- **Transaksi**: Catat setoran dan penarikan tabungan secara real-time.
- **Saldo Siswa**: Lihat saldo kumulatif dan riwayat detail per siswa.
- **Notifikasi WhatsApp**: Kirim bukti transaksi dan rekap saldo ke orang tua via WhatsApp.
- **Laporan**: Filter laporan berdasarkan tanggal, kelas, atau siswa dengan fitur cetak dan export CSV.
- **Backup Data**: Cadangkan data database ke Google Drive.

## Panduan Setup

### 1. Persiapan Google Sheets
1. Buka [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet Anda (contoh: `Database Tabungan Siswa`).
3. Catat **Spreadsheet ID** dari URL (teks di antara `/d/` dan `/edit`).

### 2. Persiapan Google Apps Script
1. Di Google Sheets, klik menu **Extensions** > **Apps Script**.
2. Hapus kode yang ada di `Code.gs`.
3. Salin dan tempel kode dari file `backend/code.gs` di project ini ke editor Apps Script.
4. Klik ikon Simpan (diskette).
5. Jalankan fungsi `setup` sekali:
   - Pilih fungsi `setup` di dropdown bagian atas.
   - Klik tombol **Run**.
   - Berikan izin (Review Permissions) yang diminta oleh Google.
   - Ini akan membuat sheet SISWA, TRANSAKSI, USERS, dan LOG secara otomatis.

### 3. Deploy sebagai Web App
1. Klik tombol **Deploy** > **New Deployment**.
2. Pilih type: **Web App**.
3. Description: `v1`.
4. Execute as: **Me** (Email Anda).
5. Who has access: **Anyone** (PENTING agar frontend bisa mengakses).
6. Klik **Deploy**.
7. Salin **Web App URL** yang muncul (berakhir dengan `/exec`).

### 4. Konfigurasi Frontend
1. Buat file `.env` di root project ini (salin dari `.env.example`).
2. Masukkan URL dari langkah sebelumnya ke `VITE_API_URL`:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec
   ```

## Pengembangan Lokal

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan server dev:
   ```bash
   npm run dev
   ```

## Deployment ke Vercel

1. Push kode ke GitHub.
2. Hubungkan repository ke Vercel.
3. Tambahkan Environment Variable di Vercel:
   - Key: `VITE_API_URL`
   - Value: URL Web App Google Apps Script Anda.
4. Deploy.

## Akun Default (Login)

- **Admin**: `admin` / `admin123`
- **Bendahara**: `bendahara` / `bendahara123`

---

Dikembangkan dengan ❤️ untuk kemudahan administrasi sekolah.
