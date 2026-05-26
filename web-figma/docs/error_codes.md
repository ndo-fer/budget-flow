# Dokumentasi Kode Error - Budget Flow

Dokumen ini berisi daftar kode error terstandarisasi yang digunakan di dalam aplikasi **Budget Flow** untuk menyembunyikan pesan kesalahan teknis (database/SQL/jaringan) dari pengguna biasa, sekaligus mempermudah tim teknis melakukan diagnosa masalah.

Setiap error di aplikasi ditampilkan dengan format `[KODE-ERROR] Pesan yang mudah dipahami`. Pengguna dapat mengklik tombol **"Salin Error"** untuk menyalin detail diagnostik teknis lengkap ke clipboard mereka jika perlu melaporkannya ke tim dukungan.

---

## Ringkasan Kode Error

| Kode Error | Kategori | Deskripsi Singkat | Solusi bagi Pengguna |
| :--- | :--- | :--- | :--- |
| **`BF-DB-001`** | Database | Skema/Fungsi Database tidak ditemukan atau terjadi masalah cache skema. | Hubungi dukungan teknis atau pastikan inisialisasi skema database di server lengkap. |
| **`BF-DB-002`** | Database | Pelanggaran Unique Constraint (Duplikasi data). | Masukkan nama atau data yang unik (belum pernah digunakan). |
| **`BF-DB-003`** | Database | Pelanggaran Kebijakan Keamanan RLS (Row Level Security). | Pastikan Anda masuk dengan sesi yang valid dan berhak atas data tersebut. |
| **`BF-DB-004`** | Database | Pelanggaran Foreign Key (Kategori/Dompet tidak valid). | Pilih referensi Kategori atau Dompet yang aktif dan masih terdaftar di sistem. |
| **`BF-AUTH-001`** | Autentikasi | Email atau password tidak cocok (kredensial salah). | Periksa kembali ketikan email/password Anda. |
| **`BF-AUTH-002`** | Autentikasi | Kriteria password terlalu lemah. | Gunakan password baru dengan minimal 6 karakter. |
| **`BF-AUTH-003`** | Autentikasi | Email sudah terdaftar sebelumnya. | Gunakan fitur masuk (login) dengan email tersebut, atau gunakan email lain. |
| **`BF-NET-001`** | Jaringan | Kegagalan koneksi ke API/Supabase (gagal fetch). | Periksa koneksi internet perangkat Anda atau status server. |
| **`BF-SYS-999`** | Sistem | Kesalahan sistem internal yang tidak terduga. | Lakukan tindakan penyalinan error dan laporkan bug ke tim pengembang. |

---

## Penjelasan Detail & Petunjuk Diagnosa

### `BF-DB-001` - Skema Database Tidak Valid / Fungsi Tidak Ditemukan
* **Penyebab Teknis:** PostgREST gagal menemukan RPC function (seperti `public.delete_user()` atau `public.adjust_wallet_balance()`) di schema cache database Supabase. Hal ini biasanya terjadi jika fungsi database tersebut belum dibuat di SQL Editor Supabase, atau cache PostgREST belum dimuat ulang setelah modifikasi database.
* **Tampilan Pesan:** *"Fungsi pembersihan akun tidak ditemukan di server. Harap hubungi dukungan teknis."* atau *"Terjadi kegagalan konfigurasi sistem database. Harap hubungi admin."*
* **Tindakan Admin/Developer:**
  1. Jalankan script SQL migrasi yang diperlukan (seperti `supabase_migrations.sql` atau `full_schema_initialization.sql`) di editor SQL Supabase.
  2. Pastikan fungsi database didefinisikan dengan hak akses `SECURITY DEFINER`.

---

### `BF-DB-002` - Duplikasi Data (Unique Constraint Violation)
* **Penyebab Teknis:** Pengguna mencoba memasukkan data baru yang melanggar batasan keunikan di database (contoh: mendaftarkan nama kategori dompet yang sama persis untuk satu user).
* **Tampilan Pesan:** *"Data ini sudah terdaftar di sistem. Silakan gunakan nama atau data yang berbeda."*
* **Tindakan Pengguna:** Masukkan nama atau nilai pembeda agar tidak bertabrakan dengan data lama yang sudah ada.

---

### `BF-DB-003` - Akses Ditolak (RLS Policy Violation)
* **Penyebab Teknis:** Permintaan database gagal memverifikasi kepemilikan baris data karena aturan *Row Level Security (RLS)* di database menolak akses (di mana `auth.uid() = user_id` tidak terpenuhi).
* **Tampilan Pesan:** *"Akses ditolak. Anda tidak memiliki izin untuk melihat atau memodifikasi data ini."*
* **Tindakan Pengguna:** Segarkan (refresh) aplikasi untuk memperbarui token autentikasi. Jika masalah berlanjut, silakan masuk log (login) ulang.

---

### `BF-DB-004` - Referensi Data Hilang (Foreign Key Violation)
* **Penyebab Teknis:** Pengguna mengirimkan transaksi dengan ID dompet atau ID kategori yang telah dihapus atau tidak valid di database.
* **Tampilan Pesan:** *"Gagal menyimpan data karena referensi kategori atau dompet tidak valid/tidak ditemukan."*
* **Tindakan Pengguna:** Pilih ulang dompet atau kategori aktif yang tersedia di opsi dropdown form input.

---

### `BF-AUTH-001` - Kredensial Tidak Valid (Invalid Credentials)
* **Penyebab Teknis:** Supabase Auth API menolak permintaan autentikasi login karena email tidak ditemukan atau password salah.
* **Tampilan Pesan:** *"Email atau password yang Anda masukkan salah. Silakan periksa kembali."*
* **Tindakan Pengguna:** Ketik ulang email dan password dengan benar. Pastikan tombol Caps Lock di keyboard tidak aktif.

---

### `BF-AUTH-002` - Password Baru Terlalu Lemah
* **Penyebab Teknis:** Nilai input password baru tidak memenuhi syarat keamanan minimum dari Supabase Auth (default: 6 karakter).
* **Tampilan Pesan:** *"Password baru terlalu lemah. Harap gunakan minimal 6 karakter."*
* **Tindakan Pengguna:** Tentukan password baru yang lebih panjang (minimal 6 karakter) demi keamanan akun.

---

### `BF-AUTH-003` - Email Sudah Terdaftar (Email Taken)
* **Penyebab Teknis:** Pengguna mencoba mendaftar akun baru dengan email yang sudah memiliki catatan aktif di tabel autentikasi Supabase.
* **Tampilan Pesan:** *"Alamat email ini sudah terdaftar. Silakan masuk menggunakan email tersebut."*
* **Tindakan Pengguna:** Masuk ke halaman login dengan email tersebut atau gunakan alamat email lain untuk pendaftaran baru.

---

### `BF-NET-001` - Kegagalan Jaringan (Network/Fetch Error)
* **Penyebab Teknis:** Kegagalan pengiriman permintaan HTTP ke URL API Supabase (`TypeError: Failed to fetch`). Hal ini biasanya karena jaringan internet pengguna mati, atau diblokir oleh VPN/firewall.
* **Tampilan Pesan:** *"Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet dan coba lagi."*
* **Tindakan Pengguna:** Sambungkan ulang koneksi Wi-Fi atau data seluler Anda, pastikan internet aktif, lalu ulangi tindakan.

---

### `BF-SYS-999` - Kesalahan Sistem Tidak Diketahui
* **Penyebab Teknis:** Terjadi error pada runtime JavaScript atau exception tak terduga yang tidak masuk ke dalam pemetaan kode di atas.
* **Tampilan Pesan:** *"Terjadi kesalahan internal pada aplikasi."*
* **Tindakan Pengguna:** Klik **"Salin Error"** dan kirimkan kode diagnostik tersebut ke pengembang untuk perbaikan bug.
