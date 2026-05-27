# Budget Flow v1 — Information Architecture Cleanup & User Flow Simplification

Dokumen ini adalah audit dan proposal perapian struktur pengalaman pengguna untuk **Budget Flow v1**, khususnya implementasi `web-figma/` pada repo `ndo-fer/budget-flow`.

Fokus dokumen ini bukan menilai visual UI semata. Fokusnya adalah memperbaiki **cara fitur ditempatkan, diberi nama, dan disusun dalam alur penggunaan** agar user baru maupun user harian tidak merasa tersesat.

---

## 0. Executive Summary

### Masalah utama

Budget Flow v1 sudah memiliki banyak fitur penting: onboarding, wallet, kategori budget, pemasukan, transaksi, CSV import, OCR struk, OCR saldo, recurring bills, analytics, notification parsing, dan settings. Namun fitur-fitur tersebut masih terasa tersebar berdasarkan struktur teknis/developer, bukan berdasarkan cara user berpikir.

Akibatnya:

- user bingung harus mulai dari mana setelah registrasi;
- beberapa action penting berada di menu yang tidak natural;
- menu yang terlihat minimalis tetap terasa kompleks karena fungsi di dalamnya saling tumpang tindih;
- onboarding awal belum cukup membantu karena guidance tidak berlanjut saat user masuk ke menu-menu utama;
- fitur input transaksi tersebar di Wallet, Income, dan Ledger, padahal seharusnya dipusatkan;
- fitur planning tersebar di Budget, Income, History/Recurring, dan Settings.

### Diagnosis singkat

> **UI-nya minimalis, tapi information architecture-nya belum minimalis.**

Masalahnya bukan fitur kurang. Masalahnya adalah **feature placement**, **navigation hierarchy**, dan **first-time user journey** belum solid.

### Arah perbaikan utama

Perbaikan yang disarankan:

1. Rapikan information architecture berdasarkan intent user.
2. Sederhanakan navigasi utama.
3. Pusatkan semua aksi input ke tombol/menu besar **Catat / Tambah Data**.
4. Pindahkan fitur planning ke **Rencana**.
5. Pindahkan fitur wallet-only ke **Dompet**.
6. Jadikan **Riwayat** hanya untuk melihat dan mengoreksi transaksi yang sudah terjadi.
7. Tambahkan **Starter Checklist** di Home.
8. Tambahkan empty state yang memiliki CTA jelas di Wallet, Income, Budget, dan History.
9. Tambahkan first-run guidance per menu dalam bentuk card/tooltip singkat.
10. Revisi label menu agar lebih natural dalam bahasa Indonesia.

---

## 1. Scope Dokumen

### Dibahas

Dokumen ini membahas:

- fitur dan flow yang sudah ada di v1;
- masalah placement fitur saat ini;
- struktur navigasi baru yang lebih masuk akal;
- user flow baru untuk first-time user, daily user, monthly planner, dan correction user;
- rekomendasi label menu;
- Starter Checklist di Home;
- empty state dengan CTA;
- first-run guidance per menu;
- feature placement audit;
- implementation backlog untuk v1.1.

### Tidak dibahas mendalam

Dokumen ini tidak membahas secara mendalam:

- desain visual final pixel-perfect;
- database migration detail;
- backend RPC detail;
- test automation detail;
- production security review menyeluruh;
- performance optimization mendalam.

---

## 2. Prinsip Perapian IA

Gunakan prinsip berikut sebagai aturan utama ketika memutuskan fitur harus berada di mana.

### 2.1 Aturan penempatan fitur

| Intent user | Tempat ideal |
|---|---|
| User ingin melihat kondisi uang hari ini | Beranda |
| User ingin mencatat sesuatu | Catat / Tambah Data |
| User ingin mengatur target, rencana, kategori, tagihan, income plan | Rencana |
| User ingin melihat atau memperbaiki transaksi yang sudah terjadi | Riwayat |
| User ingin mengatur saldo dan dompet | Dompet |
| User ingin mengatur akun, notifikasi, privacy, export global | Settings |

### 2.2 Formula sederhana

> **Kalau fitur membuat data baru → taruh di Catat.**  
> **Kalau fitur mengatur rencana masa depan → taruh di Rencana.**  
> **Kalau fitur melihat/mengoreksi kejadian masa lalu → taruh di Riwayat.**  
> **Kalau fitur mengatur saldo/dompet → taruh di Dompet.**  
> **Kalau fitur bersifat akun/sistem/privacy → taruh di Settings.**

### 2.3 Tujuan IA baru

IA baru harus membuat user langsung paham:

- apa yang harus dilakukan pertama kali;
- di mana mencatat transaksi;
- di mana mengatur budget;
- di mana melihat riwayat;
- di mana memperbaiki saldo;
- kenapa dashboard bisa dipercaya atau belum bisa dipercaya.

---

## 3. Kondisi v1 Saat Ini

Bagian ini merangkum apa yang sudah ada di app v1 berdasarkan struktur `web-figma/`.

### 3.1 App shell dan routing

App v1 memiliki route utama:

| Route / Tab | Fungsi sekarang |
|---|---|
| `/auth` | Login/register |
| `/home` | Dashboard overview |
| `/home?tab=analytics` | Analytics dashboard |
| `/wallets` | Daftar wallet dan beberapa aksi ingest/input |
| `/budget` | Budget health / budget vs actual |
| `/income` | Income source, income transaction, income summary |
| `/ledger` | Semua transaksi dan tab recurring |
| `/ledger?tab=recurring` | Tagihan rutin |
| `/settings` | Account, preferences, categories, export, notification, app version |
| `/design-preview` | Preview desain |

### 3.2 Auth

Fitur yang ada:

- login;
- register;
- session state;
- redirect user yang belum login ke `/auth`;
- redirect user login dari `/` atau `/auth` ke `/home`;
- logout dari menu profil/settings.

### 3.3 Onboarding

Fitur yang ada:

- onboarding overlay setelah user baru login/register;
- slide pengenalan konsep Budget Flow;
- setup kategori awal;
- setup wallet pertama;
- pilihan skip setup;
- status onboarding disimpan di metadata/localStorage;
- tutorial bisa dibuka lagi dari Settings.

Isi setup awal:

- kategori default seperti Makan, Transport, Entertainment, Shopping, Utilities, Health, Education, Other;
- budget default per kategori;
- wallet pertama dengan tipe bank/ewallet/cash/other;
- provider wallet seperti BCA, Mandiri, GoPay, OVO, Dana, dan lain-lain;
- saldo awal.

Kelemahan saat ini:

- onboarding hanya membantu di awal, tapi tidak cukup memandu ketika user mulai memakai menu;
- setelah onboarding selesai, user masih bisa bingung harus melakukan action apa dulu;
- belum ada checklist progres onboarding yang visible di Home;
- tutorial belum cukup contextual per menu.

### 3.4 Home / Dashboard

Fitur yang ada:

- ringkasan dashboard;
- safe-to-spend;
- batas harian;
- progress rencana bulan ini;
- estimasi pemasukan;
- total pengeluaran;
- sisa rencana;
- progress bar pemakaian budget;
- analytics tab;
- tren pengeluaran harian;
- porsi pengeluaran kategori;
- pengeluaran terbesar;
- insight pintar;
- quick action navigasi ke wallet/import/receipt/update saldo.

Kelemahan saat ini:

- Home sudah kuat sebagai dashboard angka, tetapi belum cukup kuat sebagai pemandu user baru;
- user dengan data belum lengkap tidak selalu diberi tahu kenapa angka belum akurat;
- belum ada “next best action” yang jelas;
- terlalu cepat menampilkan analytics kepada user yang belum punya data.

### 3.5 Wallet

Fitur yang ada:

- daftar wallet aktif;
- tambah wallet baru;
- tipe wallet: bank, ewallet, cash, other;
- provider wallet;
- saldo awal;
- saldo terkonfirmasi;
- saldo estimasi;
- confidence score;
- last confirmed date;
- koreksi saldo;
- update saldo dari screenshot;
- scan struk;
- import CSV;
- shortcut tambah expense;
- shortcut tambah income.

Kelemahan saat ini:

- Wallet menampung terlalu banyak action yang bukan murni wallet management;
- scan struk dan import CSV lebih cocok sebagai aksi input transaksi, bukan bagian dari Wallet;
- tombol `+ Expense` dan `+ Income` di kartu wallet berguna sebagai shortcut, tapi tidak ideal sebagai primary flow;
- user baru bisa salah paham bahwa semua pencatatan transaksi harus dimulai dari Wallet.

### 3.6 Expense Modal

Fitur yang ada:

- tambah expense manual;
- input nominal;
- pilih kategori;
- pilih wallet opsional;
- pilih tanggal;
- catatan;
- autosave draft ke localStorage;
- auto-suggest kategori dari note berbasis keyword;
- dispatch event agar wallet/dashboard refresh.

Kelemahan saat ini:

- action utama expense tidak punya satu pintu navigasi yang sangat jelas;
- user bisa menemukan expense dari wallet shortcut, bukan dari pusat input;
- flow expense sebaiknya menjadi bagian dari menu/tombol **Catat**.

### 3.7 Income

Fitur yang ada:

- daftar income source;
- tambah/edit income source;
- frekuensi source: monthly, weekly, one-time;
- nominal planned;
- record income transaction;
- edit/delete income transaction;
- summary: total income, total expenses, savings;
- income by source;
- recent income transactions;
- navigasi subtab ke Semua Transaksi dan Tagihan Rutin.

Kelemahan saat ini:

- Income mencampur dua hal: planning income source dan pencatatan income transaction;
- income source lebih cocok berada di **Rencana**;
- record income lebih cocok berada di **Catat**;
- recent income transaction lebih cocok berada di **Riwayat** atau tetap sebagai ringkasan ringan.

### 3.8 Budget

Fitur yang ada:

- budget vs actual per bulan;
- navigasi bulan sebelumnya/berikutnya;
- total budget;
- total realisasi;
- overall utilization;
- jumlah kategori on-track, under, over;
- recommendations;
- category breakdown;
- edit budget kategori lewat modal kategori.

Kelemahan saat ini:

- konsep Budget cukup tepat, tetapi label “Budget” bisa dibuat lebih natural menjadi **Rencana**;
- pengelolaan kategori juga ada di Settings, sehingga user bisa bingung harus edit budget dari mana;
- Budget seharusnya menjadi pusat kategori, budget, income plan, dan tagihan rutin.

### 3.9 History / Ledger

Fitur yang ada:

- tab Semua Transaksi;
- tab Tagihan Rutin;
- shortcut ke Sumber Pemasukan;
- search transaksi;
- filter kategori;
- grouped transaction by date;
- raw notification preview;
- edit catatan;
- edit kategori transaksi;
- hapus transaksi;
- recurring list;
- create recurring expense;
- sync recurring;
- export `.ics`;
- Google Calendar deeplink.

Kelemahan saat ini:

- Ledger/History memiliki terlalu banyak tanggung jawab;
- Tagihan Rutin bukan histori, melainkan planning masa depan;
- Sumber Pemasukan bukan histori, melainkan planning income;
- History seharusnya fokus pada melihat dan mengoreksi transaksi yang sudah terjadi.

### 3.10 Recurring Bills / Tagihan Rutin

Fitur yang ada:

- daftar tagihan rutin aktif;
- create recurring expense;
- kategori;
- nominal;
- frekuensi daily/weekly/monthly;
- tanggal tagihan untuk monthly;
- tanggal mulai;
- catatan;
- sync recurring expense menjadi transaksi;
- export `.ics`;
- add ke Google Calendar via deeplink;
- nonaktifkan tagihan.

Kelemahan saat ini:

- lokasinya di Ledger/History kurang natural;
- recurring adalah komitmen masa depan yang memengaruhi Safe-To-Spend, sehingga lebih cocok di **Rencana**;
- export calendar recurring juga sebaiknya berada di area Tagihan Rutin, bukan Settings.

### 3.11 Settings

Fitur yang ada:

- info akun;
- change password;
- logout;
- delete account;
- browser notification permission;
- Android notification listener permission;
- tutorial ulang;
- export recurring ke kalender;
- notification allowlist;
- kategori;
- export expenses CSV;
- app version.

Kelemahan saat ini:

- Settings terlalu banyak memuat fitur domain utama;
- kategori bukan setting teknis, melainkan inti dari rencana budget;
- export recurring calendar lebih cocok dekat Tagihan Rutin;
- Settings seharusnya fokus ke akun, sistem, privacy, notification, export global, dan app version.

### 3.12 CSV Import

Fitur yang ada:

- upload CSV;
- assign ke wallet opsional;
- auto-detect separator comma/semicolon;
- auto-detect column mapping;
- mapping manual field date, description, amount, direction, balance, category;
- preview import;
- duplicate detection;
- import transaksi baru;
- skip duplicate;
- done state;
- import file lain.

Kelemahan saat ini:

- CSV import ditempatkan di Wallet, padahal fungsinya adalah input/import transaksi;
- sebaiknya menjadi salah satu opsi di menu **Catat / Tambah Data**;
- Wallet boleh tetap menyediakan shortcut import khusus wallet, tapi bukan primary placement.

### 3.13 OCR Saldo

Fitur yang ada:

- upload screenshot saldo;
- mode manual correction;
- wallet selector;
- OCR menggunakan Tesseract client-side;
- deteksi wallet candidate;
- deteksi saldo candidate;
- confidence result;
- edit/konfirmasi nominal;
- simpan sebagai saldo terkonfirmasi;
- update saldo via RPC adjust wallet balance.

Placement saat ini cukup tepat untuk Wallet/Dompet, karena aktivitas ini memang mengelola saldo.

### 3.14 OCR Struk

Fitur yang ada:

- scan/foto struk;
- pilih wallet pembayaran;
- OCR struk;
- deteksi merchant;
- deteksi total amount;
- deteksi tanggal;
- deteksi payment method;
- ekstraksi item;
- confidence;
- edit merchant dan total;
- simpan sebagai transaksi expense.

Kelemahan saat ini:

- scan struk berada di Wallet;
- seharusnya masuk ke **Catat** karena hasil akhirnya adalah transaksi expense.

### 3.15 Notification Parser / Android Transaction Monitoring

Fitur yang ada:

- parser notifikasi finansial berbasis rule;
- ekstraksi amount, direction, merchant, method, wallet candidate;
- filter notifikasi sensitif seperti OTP, PIN, password, kode verifikasi;
- allowlist aplikasi finansial Indonesia;
- friendly name mapping;
- setting permission Android notification listener.

Placement yang disarankan:

- konfigurasi permission dan allowlist tetap di Settings;
- hasil transaksi otomatis masuk ke Riwayat;
- status “pemantauan aktif/tidak aktif” bisa ditampilkan ringan di Home atau Catat sebagai info.

---

## 4. Feature Placement Audit

### 4.1 Ringkasan fitur yang perlu dipindahkan

| Fitur | Lokasi sekarang | Masalah | Lokasi ideal |
|---|---|---|---|
| Scan Struk | Wallet | Input expense, bukan wallet management | Catat |
| Import CSV | Wallet | Import transaksi, bukan wallet management | Catat |
| Tambah Expense | Shortcut di Wallet/AppShell | Tersebar; tidak punya pusat input | Catat |
| Tambah Income | Wallet/Income | Tersebar antara input dan planning | Catat |
| Income Source | Income | Planning, bukan transaksi harian | Rencana |
| Recent Income Transactions | Income | Riwayat transaksi | Riwayat atau ringkasan di Income/Rencana |
| Tagihan Rutin | Ledger/History | Planning masa depan, bukan history | Rencana |
| Export `.ics` recurring | Ledger + Settings | Context-nya recurring bills | Rencana → Tagihan Rutin |
| Categories | Settings + Budget | Kategori adalah inti Budget/Rencana | Rencana |
| Budget vs Actual | Budget | Sudah benar, tapi label bisa lebih natural | Rencana |
| Notification Allowlist | Settings | Sudah tepat | Settings |
| Screenshot Saldo | Wallet | Sudah tepat | Dompet |
| Koreksi Saldo | Wallet | Sudah tepat | Dompet |
| Semua Transaksi | History | Sudah tepat | Riwayat |

### 4.2 Risiko jika placement tidak diperbaiki

- User tidak tahu action utama harus dilakukan dari mana.
- User salah menganggap Wallet adalah pusat semua fitur.
- History/Ledger terasa seperti campuran arsip, tagihan, dan planning.
- Settings menjadi tempat “buangan” fitur penting.
- Onboarding harus bekerja terlalu keras menjelaskan hal yang seharusnya jelas dari struktur app.
- App terasa kompleks walaupun tampilan bersih.

---

## 5. Struktur Navigasi Baru yang Disarankan

### 5.1 Navigasi utama rekomendasi

Gunakan 5 area utama:

```text
1. Beranda
2. Rencana
3. + Catat
4. Riwayat
5. Dompet
```

Settings tidak perlu menjadi tab utama. Settings bisa menjadi icon gear/profile di kanan atas.

### 5.2 Bottom navigation mobile rekomendasi

```text
[Beranda] [Rencana] [+ Catat] [Riwayat] [Dompet]
```

Tombol `+ Catat` sebaiknya menjadi tombol paling menonjol karena itu action paling sering dipakai.

### 5.3 Sidebar desktop rekomendasi

```text
Budget Flow
- Beranda
- Rencana
- Riwayat
- Dompet

[+ Catat / Tambah Data]

Profile / Settings
```

### 5.4 Label menu natural

| Label sekarang | Label rekomendasi | Alasan |
|---|---|---|
| Dashboard | Beranda | Lebih natural untuk ringkasan harian |
| Wallets | Dompet | Bahasa Indonesia, lebih user-friendly |
| Budgets | Rencana | Budget bukan cuma angka, tapi rencana keuangan |
| Income | Pemasukan | Lebih natural, tetapi fungsi planning income sebaiknya masuk Rencana |
| Ledger | Riwayat | Lebih mudah dipahami daripada ledger |
| Recurring | Tagihan Rutin | Lebih jelas untuk user umum |
| Analytics | Analisis / Insight | Hindari kesan terlalu teknis |
| Settings | Pengaturan | Bisa tetap Settings kalau app campur English |

---

## 6. Struktur Menu Baru Detail

### 6.1 Beranda

Fungsi utama:

> Menjawab pertanyaan: “Hari ini kondisi uangku gimana dan apa yang harus aku lakukan?”

Isi ideal:

- Safe-To-Spend hari ini;
- batas aman harian;
- progress bulan ini;
- upcoming bills terdekat;
- insight singkat;
- Starter Checklist untuk user baru;
- Next Best Action;
- status data lengkap/belum lengkap.

Jangan jadikan Beranda sebagai tempat semua fitur. Beranda harus menjadi ringkasan dan pemandu.

#### Contoh Beranda saat data belum lengkap

```text
Budget Flow belum bisa menghitung kondisi uangmu secara akurat.
Lengkapi 3 hal berikut:

[ ] Tambah dompet
[ ] Tambah sumber pemasukan
[ ] Atur kategori budget

[Mulai Lengkapi]
```

#### Contoh Beranda setelah data cukup

```text
Hari ini aman belanja sampai Rp42.000.
Kamu sudah memakai Rp18.000 dari batas aman harian.

Aksi cepat:
[Catat Expense] [Scan Struk] [Update Saldo]
```

---

### 6.2 Catat / Tambah Data

Fungsi utama:

> Pusat semua cara memasukkan data baru.

Isi ideal:

- Tambah Expense;
- Tambah Income;
- Scan Struk;
- Import CSV;
- Update Saldo dari Screenshot sebagai shortcut sekunder;
- mungkin status notifikasi otomatis.

#### Rekomendasi tampilan Catat

Bisa berupa bottom sheet, modal, atau screen khusus.

```text
Catat / Tambah Data

Transaksi harian
- Tambah Pengeluaran
- Tambah Pemasukan
- Scan Struk

Import otomatis
- Import CSV
- Cek transaksi dari notifikasi

Saldo
- Update saldo dompet
```

#### Catatan placement

- `Tambah Expense` dan `Scan Struk` harus berada di area paling atas.
- `Import CSV` cocok sebagai import histori atau bulk input.
- `Update Saldo` boleh ada sebagai shortcut, tetapi canonical placement tetap di Dompet.

---

### 6.3 Rencana

Fungsi utama:

> Tempat semua hal yang bersifat planning dan aturan keuangan.

Isi ideal:

- Budget per kategori;
- kategori aktif;
- edit budget kategori;
- income source;
- tanggal gajian;
- tagihan rutin;
- budget vs actual;
- recommendations;
- export recurring ke calendar.

#### Substruktur Rencana

```text
Rencana
- Ringkasan Rencana
- Kategori Budget
- Pemasukan Rutin
- Tagihan Rutin
- Budget vs Actual
```

#### Kenapa Income Source masuk Rencana?

Income source adalah ekspektasi pemasukan. Itu bukan transaksi aktual. Karena itu secara mental lebih dekat ke rencana bulanan daripada histori.

#### Kenapa Tagihan Rutin masuk Rencana?

Tagihan rutin adalah komitmen masa depan. Ia memengaruhi Safe-To-Spend dan cashflow. Karena itu lebih cocok sebagai bagian dari rencana.

---

### 6.4 Riwayat

Fungsi utama:

> Tempat melihat, mencari, dan memperbaiki transaksi yang sudah terjadi.

Isi ideal:

- semua transaksi;
- filter kategori;
- search merchant/note/source;
- edit kategori transaksi;
- edit catatan;
- hapus transaksi;
- source badge: manual, csv, receipt, notification, recurring;
- export transaksi sebagai CSV, opsional.

Tidak ideal di Riwayat:

- membuat recurring bills;
- mengelola income source;
- mengatur kategori budget;
- export recurring calendar.

---

### 6.5 Dompet

Fungsi utama:

> Tempat mengelola sumber saldo dan akurasi saldo.

Isi ideal:

- daftar dompet;
- tambah dompet;
- saldo estimasi;
- saldo terkonfirmasi;
- confidence score;
- last confirmed date;
- update saldo manual;
- update saldo dari screenshot;
- koreksi saldo.

Tidak ideal di Dompet:

- Scan Struk sebagai primary action;
- Import CSV sebagai primary action;
- Tambah Expense/Income sebagai primary flow.

Shortcut boleh tetap ada, tetapi jangan jadi fokus utama.

---

### 6.6 Settings / Pengaturan

Fungsi utama:

> Tempat pengaturan akun, permission, privacy, sistem, dan export global.

Isi ideal:

- info akun;
- change password;
- logout;
- delete account;
- notification permission;
- Android notification listener permission;
- notification allowlist;
- export data global;
- app version;
- reset tutorial / show onboarding again.

Pindahkan keluar dari Settings:

- kategori budget → Rencana;
- export recurring calendar → Rencana → Tagihan Rutin.

---

## 7. User Flow Simplification

### 7.1 First-Time User Flow Baru

```text
Register / Login
↓
Onboarding singkat
↓
Setup awal:
1. Tambah dompet pertama
2. Isi saldo awal
3. Tambah pemasukan / tanggal gajian
4. Pilih kategori budget utama
↓
Masuk Beranda
↓
Starter Checklist:
[ ] Catat expense pertama
[ ] Update saldo
[ ] Cek Safe-To-Spend
[ ] Atur tagihan rutin jika ada
↓
User mulai memakai app harian
```

### 7.2 Daily Usage Flow

```text
Buka app
↓
Beranda menampilkan Safe-To-Spend
↓
User tekan + Catat
↓
Pilih:
- Tambah Expense
- Scan Struk
- Tambah Income
↓
Simpan transaksi
↓
Beranda dan Riwayat otomatis update
```

### 7.3 Monthly Planning Flow

```text
Buka Rencana
↓
Cek Budget vs Actual
↓
Edit kategori budget jika perlu
↓
Cek Pemasukan Rutin
↓
Cek Tagihan Rutin
↓
Lihat apakah rencana bulan ini realistis
```

### 7.4 Transaction Correction Flow

```text
Buka Riwayat
↓
Cari transaksi
↓
Edit kategori / catatan / hapus
↓
Dashboard dan analisis terupdate
```

### 7.5 Balance Maintenance Flow

```text
Buka Dompet
↓
Cek saldo estimasi vs terkonfirmasi
↓
Update saldo manual atau screenshot
↓
Confidence saldo naik
↓
Safe-To-Spend lebih akurat
```

### 7.6 Bulk Import Flow

```text
Tekan + Catat
↓
Pilih Import CSV
↓
Upload CSV
↓
Mapping kolom
↓
Preview transaksi
↓
Skip duplicate
↓
Import transaksi baru
↓
Riwayat dan dashboard update
```

### 7.7 Receipt Scan Flow

```text
Tekan + Catat
↓
Pilih Scan Struk
↓
Ambil foto / upload struk
↓
OCR membaca merchant, total, tanggal, item
↓
User review dan edit
↓
Simpan sebagai expense
↓
Riwayat dan dashboard update
```

---

## 8. Starter Checklist di Home

### 8.1 Tujuan

Starter Checklist membantu user baru memahami urutan setup dan pemakaian awal tanpa harus membaca tutorial panjang.

Checklist harus muncul di Home sampai user menyelesaikan aksi minimum.

### 8.2 Checklist rekomendasi

```text
Mulai pakai Budget Flow

[ ] Tambah dompet pertama
[ ] Tambah sumber pemasukan
[ ] Atur kategori budget
[ ] Catat pengeluaran pertama
[ ] Update saldo dompet
[ ] Cek Safe-To-Spend hari ini
```

### 8.3 Versi checklist lebih ringkas

```text
Setup dasar
[ ] Dompet
[ ] Pemasukan
[ ] Budget
[ ] Transaksi pertama
```

### 8.4 State checklist

| Checklist item | Kondisi dianggap selesai |
|---|---|
| Tambah dompet pertama | minimal 1 wallet aktif |
| Tambah sumber pemasukan | minimal 1 income source aktif atau monthly plan tersedia |
| Atur kategori budget | minimal 1 kategori aktif dengan budget > 0 |
| Catat pengeluaran pertama | minimal 1 transaksi expense |
| Update saldo dompet | wallet punya `last_confirmed_at` atau sudah pernah adjust balance |
| Cek Safe-To-Spend | user pernah melihat/menutup card edukasi Safe-To-Spend |

### 8.5 CTA tiap checklist

| Item | CTA |
|---|---|
| Tambah dompet pertama | `Tambah Dompet` |
| Tambah sumber pemasukan | `Tambah Pemasukan` / `Atur Income` |
| Atur kategori budget | `Atur Rencana` |
| Catat pengeluaran pertama | `Catat Expense` |
| Update saldo dompet | `Update Saldo` |
| Cek Safe-To-Spend | `Lihat Cara Kerja` |

### 8.6 Behavior

- Checklist tampil di Home untuk user baru.
- Bisa di-collapse tapi jangan langsung hilang.
- Bisa disembunyikan manual dengan “Jangan tampilkan lagi”.
- Bisa dimunculkan ulang dari Settings.
- Checklist harus berbasis data aktual, bukan hanya localStorage.

---

## 9. Empty State dengan CTA Jelas

### 9.1 Prinsip empty state

Empty state jangan hanya memberi tahu bahwa data kosong. Empty state harus menjawab:

1. Apa yang kosong?
2. Kenapa ini penting?
3. Apa langkah berikutnya?

Format ideal:

```text
Judul jelas
Penjelasan 1 kalimat
CTA utama
CTA sekunder jika perlu
```

---

### 9.2 Empty State — Dompet / Wallet

#### Kondisi

Belum ada wallet aktif.

#### Copy rekomendasi

```text
Belum ada dompet

Budget Flow butuh minimal satu dompet agar bisa menghitung saldo estimasi dan Safe-To-Spend.

[Tambah Dompet Pertama]
[Import CSV Transaksi]
```

#### CTA utama

- Tambah Dompet Pertama

#### CTA sekunder

- Import CSV Transaksi

---

### 9.3 Empty State — Pemasukan / Income

#### Kondisi

Belum ada income source atau transaksi income.

#### Copy rekomendasi

```text
Belum ada pemasukan

Tambahkan gaji, freelance, atau sumber pemasukan lain supaya Budget Flow bisa membaca kemampuan belanja bulananmu.

[Tambah Sumber Pemasukan]
```

#### CTA utama

- Tambah Sumber Pemasukan

#### Jika income source ada tapi transaksi belum ada

```text
Belum ada pemasukan bulan ini

Kamu sudah punya sumber pemasukan. Catat pemasukan bulan ini agar perhitungan savings dan budget lebih akurat.

[Catat Pemasukan]
```

---

### 9.4 Empty State — Budget / Rencana

#### Kondisi

Belum ada kategori budget.

#### Copy rekomendasi

```text
Belum ada rencana budget

Buat kategori seperti Makan, Transport, dan Tagihan agar pengeluaranmu bisa dibandingkan dengan rencana bulanan.

[Buat Kategori Budget]
[Gunakan Template Awal]
```

#### Kondisi lain: ada kategori tapi belum ada transaksi

```text
Rencana sudah siap, tapi belum ada realisasi

Mulai catat pengeluaran agar Budget Flow bisa membandingkan rencana vs kenyataan.

[Catat Expense Pertama]
```

---

### 9.5 Empty State — History / Riwayat

#### Kondisi

Belum ada transaksi.

#### Copy rekomendasi

```text
Belum ada riwayat transaksi

Setiap expense, income, import CSV, scan struk, dan transaksi otomatis akan muncul di sini.

[Catat Transaksi]
[Import CSV]
```

#### Kondisi search/filter kosong

```text
Tidak ada transaksi yang cocok

Coba ubah kata pencarian atau hapus filter kategori.

[Reset Filter]
```

---

### 9.6 Empty State — Recurring / Tagihan Rutin

#### Kondisi

Belum ada tagihan rutin.

#### Copy rekomendasi

```text
Belum ada tagihan rutin

Tambahkan biaya seperti kos, internet, listrik, langganan, atau cicilan agar Safe-To-Spend memperhitungkan komitmen bulananmu.

[Buat Tagihan Rutin]
```

---

### 9.7 Empty State — Analytics

#### Kondisi

Data transaksi belum cukup.

#### Copy rekomendasi

```text
Analisis belum tersedia

Catat beberapa transaksi dulu agar Budget Flow bisa menampilkan tren harian dan kategori pengeluaran terbesar.

[Catat Expense]
[Import CSV]
```

---

## 10. First-Run Guidance per Menu

### 10.1 Prinsip

First-run guidance harus pendek, contextual, dan action-oriented.

Jangan membuat tutorial panjang. Gunakan card kecil yang muncul pertama kali user membuka menu.

Format:

```text
Judul
Penjelasan 1-2 kalimat
CTA utama
Dismiss
```

State dismiss bisa disimpan di localStorage per user, misalnya:

```text
budget-flow:{userId}:seen-guide:home
budget-flow:{userId}:seen-guide:wallet
budget-flow:{userId}:seen-guide:plan
budget-flow:{userId}:seen-guide:history
budget-flow:{userId}:seen-guide:record
```

---

### 10.2 First-run card — Beranda

```text
Selamat datang di Beranda

Di sini kamu melihat kondisi uang hari ini: batas aman belanja, progress bulan ini, dan insight dari transaksi kamu.

[Mulai Checklist]
[Jangan tampilkan lagi]
```

---

### 10.3 First-run card — Catat

```text
Catat semua transaksi dari sini

Pilih cara paling cepat: input manual, scan struk, import CSV, atau catat pemasukan.

[Catat Expense]
[Jangan tampilkan lagi]
```

---

### 10.4 First-run card — Rencana

```text
Atur rencana uangmu di sini

Kategori budget, pemasukan rutin, dan tagihan rutin akan dipakai untuk menghitung apakah bulan ini masih aman.

[Atur Kategori]
[Jangan tampilkan lagi]
```

---

### 10.5 First-run card — Riwayat

```text
Semua transaksi terkumpul di sini

Kamu bisa mencari transaksi, mengubah kategori, menambah catatan, atau menghapus data yang salah.

[Lihat Riwayat]
[Jangan tampilkan lagi]
```

---

### 10.6 First-run card — Dompet

```text
Dompet menjaga akurasi saldo

Update saldo secara berkala agar Safe-To-Spend tetap akurat. Gunakan input manual atau screenshot saldo.

[Update Saldo]
[Jangan tampilkan lagi]
```

---

### 10.7 First-run card — Settings

```text
Pengaturan akun dan sistem

Atur notifikasi, permission Android, export data, keamanan akun, dan tutorial ulang dari sini.

[Mengerti]
```

---

## 11. Revisi Label dan Terminologi

### 11.1 Rekomendasi bahasa utama

Karena copy di app saat ini banyak memakai bahasa Indonesia campur English, sebaiknya tentukan arah:

- opsi A: full Indonesia untuk user umum;
- opsi B: bilingual ringan, tapi menu utama tetap Indonesia.

Rekomendasi: gunakan bahasa Indonesia untuk menu utama.

### 11.2 Label final rekomendasi

| Konsep | Label final |
|---|---|
| Home / Dashboard | Beranda |
| Wallets | Dompet |
| Budget | Rencana |
| Income | Pemasukan |
| History / Ledger | Riwayat |
| Recurring | Tagihan Rutin |
| Analytics | Analisis |
| Add Expense | Catat Pengeluaran |
| Add Income | Catat Pemasukan |
| CSV Import | Import CSV |
| Receipt Scan | Scan Struk |
| Screenshot Balance | Update Saldo |
| Settings | Pengaturan |

### 11.3 Hindari istilah teknis untuk user umum

Hindari atau minimalkan:

- ledger;
- recurring;
- utilization;
- confidence tanpa penjelasan;
- source jika bisa diganti sumber;
- actual jika bisa diganti realisasi.

Contoh perubahan:

| Sebelum | Sesudah |
|---|---|
| Ledger & Tagihan | Riwayat Transaksi |
| Budget Health | Kesehatan Rencana |
| Overall utilization | Pemakaian Rencana |
| Income Source | Sumber Pemasukan |
| Confidence | Akurasi Estimasi |
| Actual | Realisasi |
| Under | Di Bawah Rencana |
| Over | Melebihi Rencana |

---

## 12. Navigation Restructuring Proposal

### 12.1 Current navigation problem

Saat ini ada beberapa masalah navigasi:

1. Wallet menjadi terlalu dominan sebagai tempat input/import.
2. Ledger mencampur riwayat dengan recurring planning.
3. Income mencampur planning source dan transaksi aktual.
4. Settings memuat kategori budget dan export recurring calendar.
5. User tidak punya satu tombol input utama yang jelas.

### 12.2 Target navigation

```text
Root
├── Auth
├── Beranda
├── Rencana
│   ├── Kategori Budget
│   ├── Pemasukan Rutin
│   ├── Tagihan Rutin
│   └── Budget vs Actual
├── Catat / Tambah Data
│   ├── Expense Manual
│   ├── Income Manual
│   ├── Scan Struk
│   ├── Import CSV
│   └── Update Saldo Shortcut
├── Riwayat
│   └── Semua Transaksi
├── Dompet
│   ├── Daftar Dompet
│   ├── Tambah Dompet
│   └── Update Saldo
└── Pengaturan
    ├── Akun
    ├── Notifikasi
    ├── Allowlist
    ├── Export Data
    └── App Info
```

### 12.3 Suggested route structure

Tidak harus langsung mengubah semua route, tapi struktur idealnya:

| Route baru | Screen |
|---|---|
| `/home` | Beranda |
| `/plan` | Rencana |
| `/record` | Catat / Tambah Data |
| `/history` | Riwayat |
| `/wallets` | Dompet |
| `/settings` | Pengaturan |

Subroute opsional:

| Route | Fungsi |
|---|---|
| `/plan/categories` | Kategori Budget |
| `/plan/income` | Sumber Pemasukan |
| `/plan/recurring` | Tagihan Rutin |
| `/record/expense` | Tambah Expense |
| `/record/income` | Tambah Income |
| `/record/receipt` | Scan Struk |
| `/record/import-csv` | Import CSV |
| `/wallets/update-balance` | Update Saldo |

Jika belum mau ubah route besar-besaran, cukup ubah label dan navigasi internal dulu.

---

## 13. Proposed Screen-by-Screen Changes

### 13.1 Home / Beranda

#### Keep

- Safe-To-Spend;
- Batas Harian;
- Progress Rencana;
- Insight;
- Analytics.

#### Add

- Starter Checklist;
- Next Best Action;
- data completeness warning;
- first-run card.

#### Change

- Jangan tampilkan analytics terlalu dominan jika data belum cukup.
- Quick action utama harus mengarah ke `Catat`.

---

### 13.2 Wallet / Dompet

#### Keep

- daftar wallet;
- tambah wallet;
- saldo estimasi/terkonfirmasi;
- confidence/akurasi;
- update saldo manual/screenshot;
- koreksi saldo.

#### Move out

- Scan Struk → Catat;
- Import CSV → Catat;
- Tambah Expense primary → Catat;
- Tambah Income primary → Catat.

#### Keep as shortcut only

- `+ Expense` dari wallet tertentu;
- `+ Income` dari wallet tertentu.

#### Add

- empty state CTA;
- first-run card;
- explanation of estimated vs confirmed balance.

---

### 13.3 Budget / Rencana

#### Keep

- budget vs actual;
- total budget;
- total realisasi;
- utilization;
- recommendation;
- edit category budget.

#### Move in

- Category management from Settings;
- Income source from Income screen;
- Recurring bills from Ledger;
- Calendar export recurring from Settings/Ledger.

#### Add

- first-run card;
- empty state CTA;
- simple tabs: `Kategori`, `Pemasukan`, `Tagihan`, `Realisasi`.

---

### 13.4 Income / Pemasukan

Ada dua opsi.

#### Opsi A — Tetap jadi menu sendiri

Jika tetap ada menu Pemasukan:

- fokuskan ke income source dan income summary;
- record income diarahkan ke Catat;
- jangan gabungkan dengan Riwayat/Recurring.

#### Opsi B — Gabung ke Rencana dan Catat

Rekomendasi lebih bersih:

- Income Source → Rencana;
- Record Income → Catat;
- Income Transactions → Riwayat;
- Income Summary → Beranda/Rencana.

Opsi B lebih sesuai untuk simplifikasi navigasi.

---

### 13.5 History / Riwayat

#### Keep

- semua transaksi;
- search;
- filter;
- grouped by date;
- edit kategori;
- edit note;
- hapus;
- source detail.

#### Move out

- Tagihan Rutin → Rencana;
- Sumber Pemasukan → Rencana;
- export recurring calendar → Rencana.

#### Add

- empty state CTA;
- no-result state untuk search/filter;
- first-run card.

---

### 13.6 Settings / Pengaturan

#### Keep

- account;
- password;
- logout;
- delete account;
- notification permission;
- Android notification listener;
- notification allowlist;
- export expenses CSV;
- app version;
- tutorial ulang.

#### Move out

- categories → Rencana;
- export recurring calendar → Rencana → Tagihan Rutin.

---

## 14. Prioritas Implementasi

### P0 — Harus dikerjakan dulu

1. Buat tombol/menu utama **Catat / Tambah Data**.
2. Pindahkan primary action input ke Catat:
   - Tambah Expense;
   - Tambah Income;
   - Scan Struk;
   - Import CSV.
3. Tambahkan Starter Checklist di Home.
4. Tambahkan empty state dengan CTA untuk Wallet, Income, Budget, History.

### P1 — Setelah P0 stabil

1. Pindahkan kategori dari Settings ke Rencana.
2. Pindahkan Tagihan Rutin dari Ledger ke Rencana.
3. Pindahkan Income Source ke Rencana.
4. Revisi label menu utama:
   - Dashboard → Beranda;
   - Wallets → Dompet;
   - Budgets → Rencana;
   - Ledger → Riwayat;
   - Recurring → Tagihan Rutin.
5. Tambahkan first-run guidance per menu.

### P2 — Polish dan konsistensi

1. Kurangi bahasa campuran English/Indonesia.
2. Tambahkan data completeness status di Home.
3. Tambahkan explanation card untuk Safe-To-Spend.
4. Tambahkan source badge yang konsisten di Riwayat.
5. Tambahkan microcopy untuk confidence/akurasi saldo.

---

## 15. Implementation Backlog Detail

### 15.1 Create `RecordActionSheet` atau `RecordScreen`

#### Tujuan

Satu pintu untuk semua input data.

#### Isi

- Expense manual;
- Income manual;
- Scan Struk;
- Import CSV;
- Update Saldo shortcut.

#### Acceptance criteria

- User bisa membuka Catat dari bottom nav atau floating button.
- Semua action input tersedia dari satu tempat.
- Wallet tidak lagi menjadi tempat utama Scan Struk dan Import CSV.

---

### 15.2 Add `StarterChecklistCard` di Home

#### Data yang dicek

- wallet count;
- income source count;
- category count;
- expense transaction count;
- wallet last confirmed;
- checklist hidden state.

#### Acceptance criteria

- Checklist muncul untuk user baru.
- Checklist item otomatis selesai berdasarkan data.
- CTA mengarah ke menu/action yang benar.
- Bisa disembunyikan.
- Bisa dimunculkan ulang dari Settings.

---

### 15.3 Add Empty State Components

Buat reusable component:

```tsx
<EmptyState
  title="Belum ada dompet"
  description="Budget Flow butuh minimal satu dompet..."
  primaryAction={{ label: "Tambah Dompet", onClick: ... }}
  secondaryAction={{ label: "Import CSV", onClick: ... }}
/>
```

#### Screen target

- Dompet;
- Rencana/Budget;
- Pemasukan;
- Riwayat;
- Tagihan Rutin;
- Analytics.

---

### 15.4 Add First-Run Guidance Component

Buat reusable component:

```tsx
<FirstRunGuide
  guideKey="wallet"
  title="Dompet menjaga akurasi saldo"
  description="Update saldo secara berkala agar Safe-To-Spend tetap akurat."
  actionLabel="Update Saldo"
  onAction={...}
/>
```

#### Acceptance criteria

- Muncul hanya sekali per user per menu.
- Bisa dismiss.
- Bisa reset dari Settings.
- Tidak mengganggu user lama.

---

### 15.5 Move Categories to Rencana

#### Current issue

Kategori ada di Settings dan Budget.

#### Target

Kategori hanya canonical di Rencana. Settings tidak lagi menjadi tempat utama kategori.

#### Acceptance criteria

- User bisa add/edit/archive kategori dari Rencana.
- Budget vs Actual tetap bisa edit kategori.
- Settings tidak menampilkan kategori sebagai section utama, atau hanya link “Kelola di Rencana”.

---

### 15.6 Move Recurring Bills to Rencana

#### Current issue

Tagihan rutin berada di Ledger/History.

#### Target

Tagihan rutin berada di Rencana.

#### Acceptance criteria

- User bisa create recurring dari Rencana.
- Sync recurring tersedia di Rencana.
- Export calendar tersedia di Rencana → Tagihan Rutin.
- History hanya menampilkan transaksi recurring yang sudah generated.

---

### 15.7 Rename Navigation Labels

#### Acceptance criteria

- Bottom nav memakai label baru.
- Sidebar memakai label baru.
- Page title mengikuti label baru.
- Copy tidak lagi mencampur istilah teknis yang tidak perlu.

---

## 16. Before / After User Experience

### 16.1 Sebelum

```text
User login
↓
Melihat Dashboard
↓
Bingung apakah harus ke Wallet, Budget, Income, atau Ledger
↓
Scan Struk ada di Wallet
↓
Tagihan Rutin ada di Ledger
↓
Kategori ada di Settings/Budget
↓
Income source ada di Income
↓
User merasa flow acak walaupun UI rapi
```

### 16.2 Sesudah

```text
User login
↓
Beranda menampilkan checklist dan next action
↓
User tekan + Catat untuk input data
↓
User buka Rencana untuk atur budget, income, tagihan
↓
User buka Riwayat untuk koreksi transaksi
↓
User buka Dompet untuk update saldo
↓
User memahami fungsi tiap menu dari namanya
```

---

## 17. Draft Copywriting Menu Baru

### 17.1 Beranda

```text
Beranda
Lihat batas aman belanja hari ini, progress bulan ini, dan insight dari transaksi kamu.
```

### 17.2 Catat

```text
Catat
Tambah pengeluaran, pemasukan, scan struk, atau import transaksi dari satu tempat.
```

### 17.3 Rencana

```text
Rencana
Atur kategori budget, pemasukan rutin, dan tagihan agar perhitungan keuanganmu lebih akurat.
```

### 17.4 Riwayat

```text
Riwayat
Cari, cek, dan rapikan semua transaksi yang sudah tercatat.
```

### 17.5 Dompet

```text
Dompet
Kelola saldo, update dompet, dan jaga akurasi Safe-To-Spend.
```

### 17.6 Pengaturan

```text
Pengaturan
Kelola akun, notifikasi, izin Android, export data, dan preferensi aplikasi.
```

---

## 18. Recommended Final IA Map

```text
Budget Flow

Beranda
├── Safe-To-Spend
├── Batas Harian
├── Progress Bulanan
├── Insight
├── Starter Checklist
└── Next Best Action

Catat / Tambah Data
├── Catat Pengeluaran
├── Catat Pemasukan
├── Scan Struk
├── Import CSV
└── Update Saldo Shortcut

Rencana
├── Kategori Budget
├── Budget vs Actual
├── Sumber Pemasukan
├── Tanggal Gajian
├── Tagihan Rutin
└── Export Kalender Tagihan

Riwayat
├── Semua Transaksi
├── Search
├── Filter Kategori
├── Edit Catatan
├── Edit Kategori
└── Hapus Transaksi

Dompet
├── Daftar Dompet
├── Tambah Dompet
├── Saldo Estimasi
├── Saldo Terkonfirmasi
├── Akurasi Estimasi
├── Update Saldo Manual
└── Update Saldo dari Screenshot

Pengaturan
├── Akun
├── Password
├── Logout
├── Hapus Akun
├── Notifikasi
├── Android Notification Access
├── Notification Allowlist
├── Export Data
├── Tutorial Ulang
└── App Version
```

---

## 19. Rekomendasi Roadmap v1.1

### Sprint 1 — Foundation IA

- Rename menu labels.
- Create `Catat` action center.
- Move Scan Struk and Import CSV entry point to Catat.
- Add Starter Checklist to Home.

### Sprint 2 — Empty State & Guidance

- Add reusable EmptyState component.
- Add empty states for Dompet, Rencana, Pemasukan, Riwayat.
- Add first-run guidance card per menu.
- Add Safe-To-Spend explanation card.

### Sprint 3 — Feature Relocation

- Move Categories into Rencana.
- Move Recurring Bills into Rencana.
- Move Income Source into Rencana.
- Make History focused only on transaction review/correction.

### Sprint 4 — Polish

- Consistent Bahasa Indonesia labels.
- Refine dashboard hierarchy.
- Add data completeness logic.
- Reduce redundant shortcuts.
- Add copy review for every empty/loading/error state.

---

## 20. Definition of Done

IA cleanup dianggap berhasil jika:

- user baru tahu 3 langkah pertama tanpa bertanya;
- semua input transaksi bisa ditemukan dari satu tombol/menu Catat;
- user tahu bahwa Rencana adalah tempat mengatur budget, income, dan tagihan;
- Riwayat tidak lagi memuat setup/planning;
- Dompet fokus pada saldo dan wallet;
- Settings tidak lagi menjadi tempat fitur domain utama;
- setiap screen kosong punya CTA yang jelas;
- setiap menu utama punya first-run explanation;
- label menu lebih natural dan tidak terlalu teknis.

---

## 21. Final Recommendation

Budget Flow v1 tidak perlu langsung ditambah fitur besar. Perbaikan paling berdampak adalah menyusun ulang pengalaman penggunaan.

Prioritas utama:

1. **Pusatkan input di Catat.**
2. **Jadikan Rencana sebagai pusat budget, income plan, dan tagihan rutin.**
3. **Jadikan Riwayat hanya untuk transaksi yang sudah terjadi.**
4. **Jadikan Dompet hanya untuk saldo dan wallet.**
5. **Jadikan Beranda sebagai pemandu harian, bukan hanya dashboard angka.**

Kalimat task yang paling tepat untuk revisi ini:

> Rapikan information architecture dan user flow Budget Flow v1 dengan memindahkan fitur berdasarkan intent user, menyederhanakan navigasi, menambahkan Starter Checklist, empty state CTA, dan first-run guidance agar user baru memahami langkah penggunaan tanpa harus menebak.
---

## 22. Tambahan: Database Migration Detail untuk IA Cleanup

Bagian ini ditambahkan sebagai pembahasan lanjutan. Tujuannya bukan mengubah struktur dokumen lama, tetapi menurunkan rekomendasi IA/flow menjadi konsekuensi teknis di database.

### 22.1. Kenapa IA cleanup tetap butuh migration

Perubahan information architecture terlihat seperti urusan UI, tetapi beberapa rekomendasi membutuhkan state yang sebaiknya tidak hanya disimpan di `localStorage`. Contohnya:

- apakah user sudah melihat first-run guide di menu tertentu;
- apakah Starter Checklist disembunyikan atau masih aktif;
- apakah user sudah menyelesaikan setup minimum;
- preferensi tanggal gajian;
- status fitur yang sudah pernah digunakan, seperti import CSV, scan struk, update saldo, atau catat transaksi pertama.

Saat ini beberapa state masih client-side. Contoh penting: perhitungan Safe-To-Spend membaca `bf_payday_day_of_month` dari `localStorage`, lalu fallback ke tanggal 25 jika belum ada data. Secara produk, tanggal gajian adalah preferensi finansial inti, jadi sebaiknya masuk database agar konsisten lintas device.

### 22.2. Tabel existing yang perlu tetap dipertahankan

Berdasarkan struktur service dan type di `web-figma`, data model inti v1 sudah mencakup:

| Area | Tabel / Entity | Fungsi |
|---|---|---|
| Auth | `auth.users` | Identitas user Supabase |
| Budget | `budget_categories` | Kategori, budget amount, color, priority, active status |
| Monthly plan | `monthly_plans` | Income rencana per bulan |
| Income | `income_sources` | Sumber pemasukan aktif |
| Wallet | `wallets` | Dompet, saldo confirmed/estimated, confidence |
| Transaction | `wallet_transactions` | Expense, income, adjustment, CSV, receipt, notification, manual |
| Recurring | `recurring_expenses` | Tagihan rutin harian/mingguan/bulanan |
| Balance correction | `balance_adjustments` | Audit koreksi saldo |
| Notification | allowlist package app | Preferensi app keuangan yang dipantau |

Catatan: `wallet_transactions` adalah pusat transaksi v1. Ini bagus untuk IA cleanup karena fitur `Catat`, `Riwayat`, `Budget`, `Analytics`, dan `Dompet` bisa membaca sumber data yang sama tanpa membuat tabel transaksi baru.

### 22.3. Migration baru yang disarankan

#### A. `user_finance_settings`

Tujuan: memindahkan preferensi finansial penting dari `localStorage` ke database.

Field yang disarankan:

```sql
create table if not exists public.user_finance_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payday_day_of_month int not null default 25 check (payday_day_of_month between 1 and 31),
  currency_code text not null default 'IDR',
  locale text not null default 'id-ID',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS minimal:

```sql
alter table public.user_finance_settings enable row level security;

create policy "Users can read own finance settings"
on public.user_finance_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own finance settings"
on public.user_finance_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own finance settings"
on public.user_finance_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Client migration:

- saat app pertama kali jalan setelah update, cek `localStorage.bf_payday_day_of_month`;
- kalau ada dan database belum punya value, push ke `user_finance_settings`;
- setelah berhasil, tetap boleh cache lokal, tapi source of truth harus database.

#### B. `user_guidance_state`

Tujuan: menyimpan apakah user sudah melihat guidance per menu, sehingga first-run card tidak terus muncul di semua device.

```sql
create table if not exists public.user_guidance_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_seen_home_guide boolean not null default false,
  has_seen_record_guide boolean not null default false,
  has_seen_wallet_guide boolean not null default false,
  has_seen_plan_guide boolean not null default false,
  has_seen_income_guide boolean not null default false,
  has_seen_history_guide boolean not null default false,
  has_seen_recurring_guide boolean not null default false,
  starter_checklist_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS sama seperti `user_finance_settings`: user hanya boleh read/update row miliknya sendiri.

#### C. `user_feature_events` atau `user_setup_progress`

Untuk checklist, jangan semuanya disimpan manual sebagai checkbox statis. Lebih baik sebagian besar status dihitung dari data aktual.

Contoh item checklist dan sumber validasinya:

| Checklist item | Cara menentukan selesai |
|---|---|
| Buat wallet pertama | `exists(select 1 from wallets where user_id = auth.uid() and is_active = true)` |
| Tambah income source | `exists(select 1 from income_sources where user_id = auth.uid() and is_active = true)` |
| Buat kategori budget | `exists(select 1 from budget_categories where user_id = auth.uid() and is_active = true)` |
| Catat transaksi pertama | `exists(select 1 from wallet_transactions where user_id = auth.uid() and type in ('expense','income'))` |
| Update saldo | `exists(select 1 from balance_adjustments where user_id = auth.uid())` |
| Import CSV | `exists(select 1 from wallet_transactions where user_id = auth.uid() and source = 'csv')` |
| Scan struk | `exists(select 1 from wallet_transactions where user_id = auth.uid() and source = 'receipt')` |
| Buat tagihan rutin | `exists(select 1 from recurring_expenses where user_id = auth.uid() and is_active = true)` |

Jika tetap butuh event tracking ringan, buat tabel:

```sql
create table if not exists public.user_feature_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  event_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
```

Contoh `event_key`:

- `opened_record_hub_first_time`
- `dismissed_starter_checklist`
- `completed_first_expense`
- `completed_first_csv_import`
- `completed_first_receipt_scan`
- `completed_first_balance_update`

Namun jangan over-engineer. Untuk v1.1, `user_guidance_state` + status yang dihitung dari tabel existing sudah cukup.

### 22.4. Index yang disarankan

Karena IA baru akan membuat Home, Rencana, Riwayat, dan Catat membaca data yang sama, query transaksi harus murah.

```sql
create index if not exists idx_wallet_transactions_user_occurred
on public.wallet_transactions (user_id, occurred_at desc);

create index if not exists idx_wallet_transactions_user_type_occurred
on public.wallet_transactions (user_id, type, occurred_at desc);

create index if not exists idx_wallet_transactions_user_wallet_occurred
on public.wallet_transactions (user_id, wallet_id, occurred_at desc);

create index if not exists idx_wallet_transactions_user_category_occurred
on public.wallet_transactions (user_id, category_id, occurred_at desc);

create index if not exists idx_wallet_transactions_user_source_occurred
on public.wallet_transactions (user_id, source, occurred_at desc);

create index if not exists idx_recurring_expenses_user_active
on public.recurring_expenses (user_id, is_active);

create index if not exists idx_income_sources_user_active
on public.income_sources (user_id, is_active);

create index if not exists idx_budget_categories_user_active_priority
on public.budget_categories (user_id, is_active, priority desc);
```

Jika `category_id` belum ada atau tipe datanya berbeda di database aktual, sesuaikan index dengan schema sebenarnya. Jangan menebak tipe ID; ikuti migration existing.

### 22.5. Data migration untuk perubahan IA

Perubahan menu tidak perlu migration data besar. Yang perlu dilakukan:

1. **Tidak memindahkan data transaksi.** Semua transaksi tetap di `wallet_transactions`.
2. **Tidak membuat tabel baru untuk menu `Catat`.** Menu `Catat` hanya entry point UI, bukan entity database baru.
3. **Pindahkan setting tanggal gajian ke `user_finance_settings`.**
4. **Persist first-run guide ke `user_guidance_state`.**
5. **Hitung Starter Checklist dari data aktual.** Jangan simpan semua checkbox secara manual kecuali item yang murni dismiss/skip.
6. **Pastikan delete account menghapus tabel guidance/settings baru.**

### 22.6. Migration checklist sebelum deploy

- [ ] Backup Supabase database.
- [ ] Jalankan migration di staging project.
- [ ] Test user lama yang sudah punya wallet, transaksi, kategori, income source.
- [ ] Test user baru tanpa data.
- [ ] Test user yang punya `localStorage.bf_payday_day_of_month`.
- [ ] Test RLS untuk user A tidak bisa baca/update guidance/settings user B.
- [ ] Test dashboard tetap jalan jika guidance/settings row belum ada.
- [ ] Test delete account membersihkan table baru.

---

## 23. Tambahan: Backend RPC Detail

Bagian ini menjelaskan RPC yang sudah dipakai v1 dan RPC tambahan yang disarankan agar IA cleanup lebih stabil.

### 23.1. RPC existing: `adjust_wallet_balance`

Frontend saat ini memanggil RPC:

```ts
supabase.rpc("adjust_wallet_balance", {
  p_wallet_id: walletId,
  p_new_balance: newConfirmedBalance,
  p_reason: reason || null,
  p_source: source,
});
```

RPC ini penting karena koreksi saldo tidak boleh hanya update satu field wallet. Operasi yang benar harus atomic.

#### Tanggung jawab ideal RPC

`adjust_wallet_balance` sebaiknya melakukan:

1. Ambil `auth.uid()` sebagai user aktif.
2. Validasi wallet milik user tersebut.
3. Lock row wallet yang sedang dikoreksi.
4. Hitung selisih:
   - `difference = p_new_balance - old_estimated_balance`
5. Insert audit trail ke `balance_adjustments`:
   - `user_id`
   - `wallet_id`
   - `previous_estimated_balance`
   - `new_confirmed_balance`
   - `difference`
   - `reason`
   - `source`
6. Update wallet:
   - `confirmed_balance = p_new_balance`
   - `estimated_balance = p_new_balance`
   - `confidence = 1.0`
   - `last_confirmed_at = now()`
   - `updated_at = now()`
7. Return minimal success payload atau void.

#### SQL skeleton

```sql
create or replace function public.adjust_wallet_balance(
  p_wallet_id uuid,
  p_new_balance numeric,
  p_reason text default null,
  p_source text default 'manual'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.wallets%rowtype;
  v_difference numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_new_balance < 0 then
    raise exception 'Balance cannot be negative';
  end if;

  select *
  into v_wallet
  from public.wallets
  where id = p_wallet_id
    and user_id = v_user_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Wallet not found';
  end if;

  v_difference := p_new_balance - v_wallet.estimated_balance;

  insert into public.balance_adjustments (
    user_id,
    wallet_id,
    previous_estimated_balance,
    new_confirmed_balance,
    difference,
    reason,
    source
  ) values (
    v_user_id,
    p_wallet_id,
    v_wallet.estimated_balance,
    p_new_balance,
    v_difference,
    p_reason,
    p_source
  );

  update public.wallets
  set confirmed_balance = p_new_balance,
      estimated_balance = p_new_balance,
      confidence = 1.0,
      last_confirmed_at = now(),
      updated_at = now()
  where id = p_wallet_id
    and user_id = v_user_id;
end;
$$;

revoke all on function public.adjust_wallet_balance(uuid, numeric, text, text) from public;
grant execute on function public.adjust_wallet_balance(uuid, numeric, text, text) to authenticated;
```

Catatan: jika `wallets.id` bukan `uuid` di schema aktual, ubah tipe parameter mengikuti schema sebenarnya.

#### UX implication

RPC ini mendukung fitur Dompet:

- Update saldo manual;
- Update saldo dari screenshot;
- Confidence kembali ke 100%;
- Audit koreksi saldo tetap tercatat;
- User tidak melihat angka saldo yang berubah setengah jalan.

### 23.2. RPC existing: `delete_user`

Frontend Settings memanggil:

```ts
supabase.rpc("delete_user");
```

RPC ini berisiko tinggi karena menyangkut penghapusan akun dan seluruh data. Jangan implementasikan sebagai operasi frontend biasa.

#### Tanggung jawab ideal

`delete_user` harus:

1. Mengambil user dari `auth.uid()`, bukan parameter dari client.
2. Menghapus data user dari semua tabel public:
   - `wallet_transactions`
   - `balance_adjustments`
   - `recurring_expenses`
   - `income_sources`
   - `monthly_plans`
   - `budget_categories`
   - `wallets`
   - `user_guidance_state`
   - `user_finance_settings`
   - `user_feature_events`
3. Menghapus auth user jika aman dan permission cukup.
4. Mengembalikan status sukses.

#### Rekomendasi implementasi aman

Ada dua opsi:

**Opsi A — Supabase Edge Function dengan service role**

Ini lebih aman dan lebih eksplisit untuk hapus user dari `auth.users`. Client memanggil Edge Function authenticated, function memvalidasi JWT, lalu menggunakan service role untuk delete user.

**Opsi B — SQL RPC `security definer`**

Bisa dipakai untuk menghapus data public milik user, tetapi penghapusan `auth.users` perlu sangat hati-hati. Function harus punya owner yang tepat, `search_path` dikunci, tidak menerima `user_id` dari client, dan hanya `authenticated` yang boleh execute.

#### SQL skeleton untuk cleanup data public

```sql
create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_feature_events where user_id = v_user_id;
  delete from public.user_guidance_state where user_id = v_user_id;
  delete from public.user_finance_settings where user_id = v_user_id;

  delete from public.wallet_transactions where user_id = v_user_id;
  delete from public.balance_adjustments where user_id = v_user_id;
  delete from public.recurring_expenses where user_id = v_user_id;
  delete from public.income_sources where user_id = v_user_id;
  delete from public.monthly_plans where user_id = v_user_id;
  delete from public.budget_categories where user_id = v_user_id;
  delete from public.wallets where user_id = v_user_id;
end;
$$;

revoke all on function public.delete_user_data() from public;
grant execute on function public.delete_user_data() to authenticated;
```

Jika tetap mempertahankan nama `delete_user`, pastikan behaviour-nya terdokumentasi: apakah hanya menghapus data public, atau juga menghapus auth user.

### 23.3. RPC baru yang disarankan: `get_user_setup_status`

Untuk Starter Checklist dan Home guidance, frontend sebaiknya tidak melakukan banyak query kecil dari banyak service. Buat satu RPC agregasi.

#### Output yang disarankan

```ts
type UserSetupStatus = {
  has_wallet: boolean;
  has_income_source: boolean;
  has_budget_category: boolean;
  has_any_transaction: boolean;
  has_expense_transaction: boolean;
  has_income_transaction: boolean;
  has_recurring_expense: boolean;
  has_balance_adjustment: boolean;
  has_csv_import: boolean;
  has_receipt_scan: boolean;
  starter_checklist_hidden: boolean;
  setup_completion_percent: number;
};
```

#### SQL skeleton

```sql
create or replace function public.get_user_setup_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select jsonb_build_object(
    'has_wallet', exists(select 1 from public.wallets where user_id = v_user_id and is_active = true),
    'has_income_source', exists(select 1 from public.income_sources where user_id = v_user_id and is_active = true),
    'has_budget_category', exists(select 1 from public.budget_categories where user_id = v_user_id and is_active = true),
    'has_any_transaction', exists(select 1 from public.wallet_transactions where user_id = v_user_id and is_duplicate = false),
    'has_expense_transaction', exists(select 1 from public.wallet_transactions where user_id = v_user_id and type = 'expense' and is_duplicate = false),
    'has_income_transaction', exists(select 1 from public.wallet_transactions where user_id = v_user_id and type = 'income' and is_duplicate = false),
    'has_recurring_expense', exists(select 1 from public.recurring_expenses where user_id = v_user_id and is_active = true),
    'has_balance_adjustment', exists(select 1 from public.balance_adjustments where user_id = v_user_id),
    'has_csv_import', exists(select 1 from public.wallet_transactions where user_id = v_user_id and source = 'csv'),
    'has_receipt_scan', exists(select 1 from public.wallet_transactions where user_id = v_user_id and source = 'receipt'),
    'starter_checklist_hidden', coalesce((select starter_checklist_hidden from public.user_guidance_state where user_id = v_user_id), false)
  ) into v_result;

  return v_result;
end;
$$;
```

Completion percent bisa dihitung di frontend dari boolean di atas, atau dihitung di SQL jika ingin konsisten.

### 23.4. RPC baru yang disarankan: `mark_guide_seen`

Untuk mode first-run per menu, frontend butuh cara sederhana untuk menandai guide selesai.

```sql
create or replace function public.mark_guide_seen(p_guide_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_guidance_state (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  if p_guide_key = 'home' then
    update public.user_guidance_state set has_seen_home_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'record' then
    update public.user_guidance_state set has_seen_record_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'wallet' then
    update public.user_guidance_state set has_seen_wallet_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'plan' then
    update public.user_guidance_state set has_seen_plan_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'income' then
    update public.user_guidance_state set has_seen_income_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'history' then
    update public.user_guidance_state set has_seen_history_guide = true, updated_at = now() where user_id = v_user_id;
  elsif p_guide_key = 'recurring' then
    update public.user_guidance_state set has_seen_recurring_guide = true, updated_at = now() where user_id = v_user_id;
  else
    raise exception 'Unknown guide key';
  end if;
end;
$$;
```

Lebih scalable: pakai tabel normalized `user_feature_events` daripada banyak boolean column. Untuk v1.1, boolean column masih acceptable karena jumlah menu kecil dan mudah dipahami.

### 23.5. RPC security checklist

- [ ] Semua RPC mengambil user dari `auth.uid()`, bukan dari parameter client.
- [ ] Semua function `security definer` memakai `set search_path = public`.
- [ ] Tidak ada dynamic SQL dari input user.
- [ ] `revoke all from public`, lalu `grant execute to authenticated`.
- [ ] Validate ownership untuk semua entity yang diubah.
- [ ] RPC destructive seperti delete account punya confirmation UX yang jelas.
- [ ] RPC balance correction bersifat atomic dan audit-able.
- [ ] Error message cukup jelas tapi tidak membocorkan data user lain.

---

## 24. Tambahan: UX Concern Berdasarkan Laws of UX

Referensi: Laws of UX adalah kumpulan best practice yang bisa dipertimbangkan designer saat membangun user interface. Bagian ini menggunakan beberapa prinsip yang paling relevan untuk Budget Flow, terutama karena problem v1 bukan visual polish, melainkan beban kognitif, placement fitur, dan flow yang tidak langsung terbaca.

### 24.1. Choice Overload

**Prinsip:** user bisa overwhelmed ketika diberikan terlalu banyak pilihan sekaligus.

**Masalah di v1:** Wallet menampilkan banyak aksi sekaligus: screenshot saldo, scan struk, import CSV, tambah wallet, expense, income. Secara teknis semua berguna, tetapi untuk user baru semua terlihat sama penting.

**Perbaikan:**

- pindahkan input transaksi ke menu `Catat`;
- biarkan Wallet fokus pada saldo dan dompet;
- tampilkan maksimal 1 primary CTA per empty state;
- secondary action boleh ada, tetapi jangan sejajar secara visual dengan aksi utama.

### 24.2. Hick's Law

**Prinsip:** waktu mengambil keputusan meningkat seiring jumlah dan kompleksitas pilihan.

**Masalah di v1:** user baru harus memilih sendiri apakah mulai dari Wallet, Income, Budget, History, atau Settings. Ini membuat onboarding terasa selesai secara visual, tetapi belum selesai secara mental.

**Perbaikan:**

- Home harus memberikan `Next Best Action`;
- Starter Checklist harus menyusun urutan tindakan;
- menu `Catat / Tambah Data` menjadi pintu utama untuk semua input.

Contoh Home copy:

```text
Langkah berikutnya: catat transaksi pertamamu agar dashboard mulai akurat.
[Catat Pengeluaran]
```

### 24.3. Jakob's Law

**Prinsip:** user lebih nyaman jika produk bekerja seperti produk lain yang sudah mereka kenal.

**Masalah di v1:** istilah seperti `Ledger`, `Recurring`, dan `Wallet` bisa dimengerti sebagian user, tetapi tidak semua. Untuk finance app personal Indonesia, label yang lebih natural adalah `Riwayat`, `Tagihan Rutin`, dan `Dompet`.

**Perbaikan label:**

| Label lama | Label baru |
|---|---|
| Wallet | Dompet |
| Budget | Rencana |
| Income | Pemasukan |
| History / Ledger | Riwayat |
| Recurring | Tagihan Rutin |
| CSV Import / Receipt Scan / Expense / Income buttons | Catat / Tambah Data |

### 24.4. Law of Proximity dan Law of Common Region

**Prinsip:** elemen yang berdekatan atau berada dalam area visual yang sama dipersepsikan sebagai satu kelompok.

**Masalah di v1:** ketika Scan Struk dan Import CSV berada di Wallet, user akan menganggap keduanya adalah fitur wallet, padahal keduanya adalah fitur input transaksi.

**Perbaikan:**

- kelompokkan semua input transaksi dalam `Catat`;
- kelompokkan semua planning dalam `Rencana`;
- kelompokkan semua koreksi data transaksi dalam `Riwayat`;
- kelompokkan semua saldo/dompet dalam `Dompet`.

### 24.5. Miller's Law dan Chunking

**Prinsip:** working memory terbatas; informasi perlu dipecah menjadi kelompok bermakna.

**Masalah di v1:** app memiliki banyak konsep aktif: wallet, income, budget, category, recurring, CSV, OCR, notification, analytics, settings. Jika semua muncul sebagai area utama, user harus mengingat terlalu banyak struktur.

**Perbaikan:** jadikan 5 chunk utama:

```text
Beranda
Catat
Rencana
Riwayat
Dompet
```

Settings tetap ada, tetapi tidak perlu menjadi tab utama. Letakkan di profile/gear.

### 24.6. Paradox of the Active User

**Prinsip:** user cenderung tidak membaca manual; mereka langsung mencoba memakai software.

**Masalah di v1:** onboarding slide saja tidak cukup. User tetap butuh arahan ketika sudah berada di menu sebenarnya.

**Perbaikan:** buat first-run card per menu:

- Home: “di sini kamu lihat kondisi uang hari ini”;
- Catat: “semua cara input transaksi ada di sini”;
- Rencana: “atur budget, income, dan tagihan rutin di sini”;
- Riwayat: “cek dan koreksi transaksi yang sudah terjadi”;
- Dompet: “kelola saldo dan dompet di sini”.

Card harus bisa ditutup dan tidak muncul lagi setelah user klik `Mengerti`.

### 24.7. Zeigarnik Effect dan Goal-Gradient Effect

**Prinsip:** user mengingat task yang belum selesai, dan motivasi meningkat ketika mereka merasa semakin dekat dengan goal.

**Masalah di v1:** onboarding selesai, tetapi user tidak tahu setup apa yang belum lengkap. Dashboard bisa terlihat “kosong” tanpa menjelaskan progress setup.

**Perbaikan:** Starter Checklist di Home.

Contoh:

```text
Mulai pakai Budget Flow
Progress: 2/5 selesai

[✓] Buat wallet pertama
[✓] Pilih kategori budget
[ ] Tambah sumber pemasukan
[ ] Catat transaksi pertama
[ ] Cek Safe-To-Spend
```

Checklist ini bukan dekorasi. Ini adalah alat navigasi pertama user.

### 24.8. Von Restorff Effect dan Fitts's Law

**Prinsip:** elemen yang berbeda dari sekitarnya lebih mudah diingat, dan target yang besar/dekat lebih mudah dipilih.

**Masalah di v1:** aksi input tersebar di banyak tempat dan tidak ada satu aksi utama yang paling menonjol.

**Perbaikan:** buat tombol besar `+ Catat` atau `Catat / Tambah Data`, idealnya di posisi tengah bottom navigation pada mobile.

Struktur yang disarankan:

```text
[Beranda] [Rencana] [+ Catat] [Riwayat] [Dompet]
```

`+ Catat` harus membuka action sheet:

```text
Tambah Data
- Pengeluaran Manual
- Pemasukan Manual
- Scan Struk
- Import CSV
- Update Saldo
```

### 24.9. Serial Position Effect

**Prinsip:** user paling mudah mengingat item pertama dan terakhir dalam sebuah seri.

**Perbaikan navigasi:**

- taruh `Beranda` sebagai item pertama;
- taruh `Dompet` atau `Profile/Settings` sebagai item terakhir;
- taruh `Catat` sebagai center action yang berbeda secara visual.

### 24.10. Tesler's Law

**Prinsip:** kompleksitas tidak bisa dihilangkan sepenuhnya; sebagian harus ditangani oleh sistem.

**Masalah di v1:** budgeting memang kompleks. Ada income, wallet, kategori, recurring, saldo aktual, saldo estimasi, dan transaksi otomatis. Kompleksitas ini tidak bisa dihapus, tapi bisa dipindahkan dari user ke sistem.

**Perbaikan:**

- user tidak perlu memilih path input yang benar; sistem menyediakan `Catat`;
- user tidak perlu tahu kenapa Safe-To-Spend belum akurat; Home menjelaskan data yang kurang;
- user tidak perlu mengingat setup; checklist mengingatkan;
- user tidak perlu mencari tempat edit kategori; semuanya ada di `Rencana`.

### 24.11. Postel's Law

**Prinsip:** sistem sebaiknya fleksibel dalam menerima input, tetapi konservatif dalam output.

**Aplikasi di Budget Flow:**

- CSV import boleh menerima format koma/semicolon dan berbagai nama kolom;
- OCR boleh memberi kandidat hasil scan;
- tetapi sebelum menyimpan, UI harus meminta konfirmasi user;
- output transaksi harus konsisten: amount, type, source, date, category, wallet.

Ini sudah sejalan dengan desain CSV Preview dan OCR confirmation di v1, tetapi perlu diperjelas di flow `Catat`.

### 24.12. Cognitive Load

**Prinsip:** cognitive load adalah sumber daya mental yang dibutuhkan user untuk memahami dan memakai interface.

**Masalah utama v1:** cognitive load tinggi bukan karena tampilan ramai, tetapi karena user harus menebak struktur produk.

**Checklist UX untuk menurunkan cognitive load:**

- [ ] Setiap menu punya satu kalimat fungsi utama.
- [ ] Setiap empty state punya satu CTA utama.
- [ ] Semua input transaksi masuk dari `Catat`.
- [ ] Semua planning masuk dari `Rencana`.
- [ ] Semua transaksi masa lalu masuk dari `Riwayat`.
- [ ] Semua saldo/dompet masuk dari `Dompet`.
- [ ] Settings tidak berisi fitur budgeting inti.
- [ ] Home menunjukkan langkah berikutnya, bukan hanya angka.

---

## 25. Tambahan: Revised Implementation Backlog Setelah Database + RPC + UX Review

### P0 — Wajib untuk v1.1 IA Cleanup

- [ ] Buat menu/tombol utama `Catat / Tambah Data`.
- [ ] Pindahkan Scan Struk dan Import CSV dari Wallet ke Catat.
- [ ] Pindahkan kategori budget dari Settings ke Rencana.
- [ ] Pindahkan Tagihan Rutin dari Ledger/History ke Rencana.
- [ ] Tambahkan Starter Checklist di Home.
- [ ] Tambahkan empty state CTA untuk Wallet, Income, Budget, History.
- [ ] Tambahkan first-run guide per menu.
- [ ] Buat migration `user_guidance_state`.
- [ ] Buat migration `user_finance_settings`.
- [ ] Buat atau rapikan RPC `get_user_setup_status`.

### P1 — Penting setelah P0 stabil

- [ ] Refactor Home agar menampilkan `Next Best Action` berdasarkan setup status.
- [ ] Refactor Settings agar hanya berisi account, privacy, notification, export, app version.
- [ ] Tambahkan client sync dari `localStorage.bf_payday_day_of_month` ke database.
- [ ] Pastikan `delete_user` membersihkan tabel guidance/settings baru.
- [ ] Tambahkan analytics event ringan untuk penggunaan fitur utama.
- [ ] Tambahkan tests untuk `get_user_setup_status` dan checklist rendering.

### P2 — Polish

- [ ] Buat action sheet `Catat` dengan animasi ringan.
- [ ] Buat copywriting first-run yang lebih personal dan konsisten.
- [ ] Tambahkan “jangan tampilkan lagi” untuk guidance card.
- [ ] Tambahkan visual progress pada checklist.
- [ ] Tambahkan deeplink internal dari checklist ke menu terkait.

---

## 26. Tambahan: Definition of Done untuk Revisi IA + Backend

Revisi dianggap selesai jika:

- user baru bisa memahami langkah pertama tanpa bertanya ke developer;
- Home menunjukkan setup status dan next action;
- Catat menjadi satu-satunya entry point utama untuk input transaksi;
- Rencana memuat budget, kategori, income source, payday, dan tagihan rutin;
- Riwayat hanya fokus pada transaksi yang sudah terjadi;
- Dompet hanya fokus pada saldo dan wallet;
- Settings tidak lagi menampung fitur budgeting inti;
- semua first-run guide tersimpan di database, bukan hanya localStorage;
- Safe-To-Spend memakai payday setting dari database;
- RPC balance correction dan delete user aman, atomic, dan memiliki ownership validation;
- empty state tidak hanya kosong, tetapi mengarahkan user ke aksi berikutnya.


