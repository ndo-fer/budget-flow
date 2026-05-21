# Budget Flow Web QA Flow

Gunakan flow ini untuk mengaktifkan dan mengecek hampir semua fitur utama dalam satu putaran.

## 1. Auth

1. Buka `http://127.0.0.1:4173/`
2. Kalau belum punya akun, tekan `Daftar`
3. Isi email baru dan password
4. Tekan `Buat Akun`
5. Cek email yang diinput untuk verifikasi Supabase
6. Setelah verified, balik ke app lalu `Login`

## 2. Onboarding

1. Setelah login pertama, onboarding overlay akan muncul
2. Klik `Lanjut` sampai slide terakhir
3. Klik `Mulai Pakai App`
4. Di `Settings`, klik `Lihat Tutorial Lagi` untuk memastikan flow reopen bekerja

## 3. Home dan Starter Checklist

1. Di `Beranda`, klik `Set plan`
2. Isi `monthly income` lalu simpan
3. Pahami bedanya:
   `Monthly plan` adalah patokan income bulanan.
   `Income` adalah uang masuk aktual dari source/transaction.
   `Expense` adalah pengeluaran aktual harian/bulanan.
4. Balik ke home dan cek kartu income, budget mood, serta monthly plan
5. Klik `Hide` pada starter checklist
6. Pastikan kartu `Tampilkan starter checklist lagi` muncul dengan lebar section tetap
7. Klik tombol itu dan pastikan checklist tampil lagi

## 4. Category Management

1. Buka `Settings`
2. Klik `+ Add` pada section category
3. Tambahkan minimal 3 kategori dengan warna dan budget berbeda
4. Edit satu kategori dan ubah budget/priority
5. Archive satu kategori untuk cek behavior archive

## 5. Expense Flow

1. Dari sidebar klik `Tambah Expense`
2. Tambahkan minimal 3 transaksi hari ini di kategori berbeda
3. Tambahkan 1 transaksi dengan note yang jelas, misalnya `kopi sore`
4. Cek `Beranda` apakah today's expenses, daily budget, dan alert ikut berubah
5. Buka `History`
6. Filter berdasarkan tanggal hari ini
7. Cari note `kopi`
8. Klik tombol `Edit` pada expense terkait
9. Delete satu expense

## 6. Income Flow

1. Buka `Income`
2. Tambahkan minimal 2 income source
3. Tambahkan beberapa income transaction untuk bulan aktif
4. Klik tombol `Edit` pada satu income transaction
5. Delete satu income transaction
6. Di card source, cek juga tombol `Record` dan `Edit`
7. Cek summary income, savings, dan breakdown per source

## 7. Recurring Flow

1. Buka `Recurring`
2. Tambahkan minimal 1 recurring bulanan
3. Tambahkan 1 recurring mingguan atau harian
4. Klik `Sync month`
5. Balik ke `History` atau `Beranda` dan cek apakah transaksi recurring bulanan masuk
6. Klik tombol `Edit` pada satu recurring item
7. Archive satu recurring item

## 8. Budget dan Analytics

1. Buka `Budget`
2. Pastikan per kategori muncul budget, actual, utilization, dan variance
3. Tambah beberapa expense lagi kalau masih terlalu kosong
4. Buka `Analytics`
5. Pastikan summary, pie chart, line chart, dan top categories muncul

## 9. Export

1. Buka `Settings`
2. Klik `Export Expenses (CSV)`
3. Pastikan file CSV terunduh
4. Buka file hasil export dan cek header serta isi transaksi

## 10. Session dan Logout

1. Refresh browser saat masih login
2. Pastikan session tetap aktif
3. Klik `Logout`
4. Pastikan app kembali ke screen login
