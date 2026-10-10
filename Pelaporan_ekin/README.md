# Pelaporan Triwulan

Aplikasi web mandiri (tanpa Claude): Rencana Aksi, Laporan, Buat Laporan (PDF/Word), Format tersimpan, dan kirim ke Google Drive.
Data tersimpan di browser (localStorage) pada perangkat yang dipakai.

## Isi folder
- `index.html` aplikasi
- `config.js` tempat mengisi Google Client ID
- `standalone.js` penghubung unduhan dan Google Drive
- `vendor/` pustaka PDF dan Word (disimpan lokal)
- `manifest.webmanifest`, `sw.js`, `icons/` agar bisa dipasang seperti aplikasi

## 1. Unggah ke GitHub
1. Buka github.com, klik **New repository**, beri nama `pelaporan-triwulan`, pilih **Public** (GitHub Pages gratis), klik **Create repository**.
2. Klik **uploading an existing file**, seret SEMUA isi folder ini (termasuk folder `vendor` dan `icons`), lalu **Commit changes**.
   Atau lewat terminal:
   ```
   git init
   git add .
   git commit -m "Pelaporan Triwulan"
   git branch -M main
   git remote add origin https://github.com/USERNAME/pelaporan-triwulan.git
   git push -u origin main
   ```

## 2. Aktifkan GitHub Pages
1. Di repository: **Settings → Pages**.
2. **Source**: Deploy from a branch. **Branch**: `main`, folder `/ (root)`. Klik **Save**.
3. Tunggu 1-2 menit. Alamat aplikasi: `https://USERNAME.github.io/pelaporan-triwulan/`.

## 3. Menyambungkan Google Drive (sekali saja)
1. Buka console.cloud.google.com, buat project baru (mis. "Pelaporan Triwulan").
2. **APIs & Services → Library**, cari **Google Drive API**, klik **Enable**.
3. **APIs & Services → OAuth consent screen** (atau Google Auth Platform): pilih **External**, isi nama aplikasi dan email Anda. Di **Audience / Test users**, tambahkan email Google yang akan dipakai untuk Drive. Biarkan status **Testing**.
4. **Credentials → Create credentials → OAuth client ID**, jenis **Web application**.
   - **Authorized JavaScript origins**: `https://USERNAME.github.io` (tanpa garis miring di akhir dan tanpa nama repo).
   - Untuk uji di komputer sendiri tambahkan juga `http://localhost:8000`.
5. Salin **Client ID** (berakhiran `.apps.googleusercontent.com`).
6. Di GitHub, buka `config.js`, klik ikon pensil, isi:
   ```
   GOOGLE_CLIENT_ID: "tempel-client-id-di-sini"
   ```
   lalu **Commit changes**. Tunggu 1-2 menit.
7. Buka aplikasi, halaman **Rencana Aksi**, klik **Hubungkan Google Drive**, pilih akun, dan izinkan.
   Karena status Testing, Google menampilkan "Google hasn't verified this app": klik **Advanced → Go to ... (unsafe)**. Ini normal untuk aplikasi pribadi.
   Izin akses perlu diberikan lagi kira-kira tiap 1 jam saat mengirim ke Drive, dan di mode Testing sesi izin dapat kedaluwarsa tiap 7 hari.

## 4. Shortcut di desktop laptop
1. Buka alamat GitHub Pages di **Chrome** atau **Edge**.
2. Chrome: titik tiga → **Cast, save, and share → Install page as app**. Edge: titik tiga → **Apps → Install this site as an app**.
3. Klik kanan ikon di Start Menu → **Pin to taskbar** / **Pin to Start**. Untuk ikon di desktop, seret ikon dari Start Menu ke desktop.

## Perlu diketahui
- Data rencana dan riwayat tersimpan per browser per perangkat. Bila memakai laptop dan HP, datanya terpisah. Jangan menghapus data situs di browser.
- Untuk uji lokal: jalankan `python -m http.server 8000` di folder ini, buka `http://localhost:8000`.
- Mengubah kode: edit `index.html` di GitHub, commit, lalu muat ulang aplikasi (jika tampilan lama masih muncul, tekan Ctrl+Shift+R).
