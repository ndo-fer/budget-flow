# Budget Flow - Implementation Plan

Dokumen ini adalah implementation plan untuk Budget Flow dengan prinsip utama:

> Minim input manual, maksimal preview kondisi keuangan user.

Bahasa kerja untuk setiap tahap:

> Coba cek kalau sudah exist, bisa lanjut ke tahapan implement berikutnya. Kalau belum, maka bantu implement bagian tersebut terlebih dahulu.

---

## 1. Goal Produk

Budget Flow tidak perlu langsung membaca saldo asli dari bank atau e-wallet secara real-time. Untuk fase awal, Budget Flow cukup membuat **estimated financial view** berdasarkan sinyal transaksi yang bisa ditangkap otomatis atau semi-otomatis.

Formula utama:

```text
saldo terakhir yang diketahui
+ uang masuk yang terdeteksi
- uang keluar yang terdeteksi
= estimasi uang saat ini
```

Target utama:

- User tidak perlu input setiap transaksi secara manual.
- User tetap bisa melihat estimasi uang yang tersedia di satu waktu.
- User bisa sadar spending harian sebelum kebablasan scan QRIS.
- App jujur membedakan antara saldo estimasi dan saldo yang sudah dikonfirmasi.

---

## 2. Prinsip Implementasi

### 2.1 Jangan mulai dari integrasi API bank/e-wallet

Coba cek apakah app sudah memiliki rencana integrasi resmi dengan bank, e-wallet, atau open finance provider.

Kalau sudah exist:
- Pastikan jalurnya official API, consent-based, dan tidak mengambil kredensial user.
- Lanjutkan dengan arsitektur adapter agar tidak mengunci app ke satu provider.

Kalau belum:
- Jangan implement login ke Livin, wondr, GoPay, ShopeePay, Jago, SeaBank, atau aplikasi finansial lain secara tidak resmi.
- Jangan gunakan scraping, reverse engineering, session hijacking, PIN, OTP, atau akses kredensial user.
- Implement dulu pendekatan local-first: notification tracking, screenshot parser, CSV import, receipt scan, dan balance correction.

### 2.2 Gunakan estimated balance, bukan klaim real-time balance

Coba cek apakah UI/app sudah membedakan:

- Confirmed balance
- Estimated balance
- Last confirmed at
- Confidence score
- Untracked gap

Kalau sudah exist:
- Lanjutkan ke implementasi data source otomatis.

Kalau belum:
- Implement status data ini di model, logic, dan UI.

---

## 3. Arsitektur Umum

```text
Budget Flow App
  -> Transaction Source Layer
      -> Notification Adapter
      -> Screenshot Balance Adapter
      -> CSV Import Adapter
      -> Receipt Scan Adapter
      -> Manual Correction Adapter
      -> Future Open Finance Adapter
  -> Normalization Layer
  -> Transaction Database
  -> Balance Estimator
  -> Pattern Analyzer
  -> Safe-to-Spend Engine
  -> Financial Awareness Dashboard
```

Coba cek apakah app sudah punya pemisahan layer seperti di atas.

Kalau sudah exist:
- Lanjutkan implement adapter satu per satu.

Kalau belum:
- Refactor ringan agar input transaksi tidak langsung masuk ke UI, tetapi melewati transaction source layer dan normalization layer terlebih dahulu.

---

## 4. Data Model Minimum

### 4.1 Wallet

Coba cek apakah sudah ada model wallet/account.

Kalau sudah exist:
- Pastikan field di bawah sudah tersedia atau bisa ditambahkan.

Kalau belum:
- Implement model Wallet.

```ts
type Wallet = {
  id: string;
  name: string;
  type: "bank" | "ewallet" | "cash" | "other";
  provider?: string;
  confirmedBalance: number;
  estimatedBalance: number;
  lastConfirmedAt?: Date;
  confidence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

### 4.2 Transaction

Coba cek apakah sudah ada model transaction.

Kalau sudah exist:
- Pastikan source, confidence, rawText, dan walletId tersedia.

Kalau belum:
- Implement model Transaction.

```ts
type Transaction = {
  id: string;
  walletId: string;
  amount: number;
  direction: "in" | "out";
  category?: string;
  merchant?: string;
  note?: string;
  source: "notification" | "screenshot" | "csv" | "receipt" | "manual" | "adjustment";
  rawText?: string;
  confidence: number;
  occurredAt: Date;
  createdAt: Date;
};
```

### 4.3 Balance Adjustment

Coba cek apakah app sudah punya cara mencatat koreksi saldo.

Kalau sudah exist:
- Pastikan koreksi tidak merusak histori transaksi.

Kalau belum:
- Implement BalanceAdjustment.

```ts
type BalanceAdjustment = {
  id: string;
  walletId: string;
  previousEstimatedBalance: number;
  newConfirmedBalance: number;
  difference: number;
  reason?: string;
  createdAt: Date;
};
```

---

## 5. Core Feature 1 - Notification-Based Tracking

Tujuan: menangkap transaksi otomatis dari notifikasi pembayaran, transfer, top up, refund, dan cashback.

Coba cek apakah platform target utama app adalah Android.

Kalau Android sudah menjadi target:
- Implement Android Notification Listener.
- Filter hanya aplikasi finansial yang user izinkan.
- Simpan raw notification text untuk parsing lokal.

Kalau belum:
- Tentukan dulu apakah MVP akan fokus Android, karena iOS tidak memberi akses bebas ke notifikasi aplikasi lain.

### 5.1 Permission Flow

Coba cek apakah app sudah punya screen consent/permission.

Kalau sudah exist:
- Tambahkan penjelasan spesifik untuk akses notifikasi.

Kalau belum:
- Implement permission screen dengan copy yang jelas:

```text
Budget Flow membaca notifikasi transaksi dari aplikasi yang kamu izinkan untuk membantu menghitung estimasi pengeluaran dan saldo. Data diproses untuk membuat financial preview, bukan untuk login ke rekening kamu.
```

### 5.2 Parser Notifikasi

Coba cek apakah sudah ada parser transaksi dari teks.

Kalau sudah exist:
- Tambahkan pattern untuk nominal, arah transaksi, wallet, merchant, dan metode pembayaran.

Kalau belum:
- Implement parser berbasis rule sederhana dulu.

Contoh input:

```text
Pembayaran QRIS Rp25.000 berhasil di Kopi Kenangan
```

Output:

```json
{
  "direction": "out",
  "amount": 25000,
  "merchant": "Kopi Kenangan",
  "method": "QRIS",
  "confidence": 0.9
}
```

### 5.3 Duplicate Detection

Coba cek apakah app sudah mencegah transaksi dobel.

Kalau sudah exist:
- Pastikan dedupe mengecek amount, wallet, timestamp, merchant, dan raw text.

Kalau belum:
- Implement duplicate detection sebelum transaksi masuk database.

---

## 6. Core Feature 2 - Screenshot Dana Available / Balance Screenshot

Concern user:

> Kalau user lagi tidak malas, user bisa input screenshot dana available dari aplikasi keuangan.

Tujuan: user tidak perlu mengetik saldo, cukup upload/share screenshot dari aplikasi finansial. App membaca saldo yang terlihat dan menjadikannya confirmed balance atau balance candidate.

Coba cek apakah app sudah punya image upload/share intent.

Kalau sudah exist:
- Tambahkan flow khusus "Update saldo dari screenshot".

Kalau belum:
- Implement image picker atau Android share target agar user bisa kirim screenshot ke Budget Flow.

### 6.1 OCR / Vision Parser

Coba cek apakah sudah ada OCR pipeline.

Kalau sudah exist:
- Tambahkan parser untuk mendeteksi angka saldo, nama wallet, tanggal, dan konteks layar.

Kalau belum:
- Implement OCR sederhana untuk extract text dari screenshot.

Output yang diharapkan:

```json
{
  "walletCandidate": "GoPay",
  "balanceCandidate": 182500,
  "confidence": 0.82,
  "capturedAt": "2026-05-24T14:32:00"
}
```

### 6.2 Confirmation UI

Coba cek apakah app langsung menyimpan hasil OCR tanpa review user.

Kalau iya:
- Ubah agar user tetap mengonfirmasi hasil ekstraksi, karena screenshot bisa salah baca.

Kalau belum ada:
- Implement confirmation UI:

```text
Budget Flow menemukan saldo GoPay sekitar Rp182.500. Pakai angka ini sebagai saldo terbaru?
[Ya, update] [Edit dulu] [Batal]
```

---

## 7. Core Feature 3 - CSV Import dari Export App Keuangan

Concern user:

> Kalau user bisa import CSV keuangan dari export app, Budget Flow bisa membaca histori transaksi tanpa input manual satu-satu.

Tujuan: user bisa import data dari bank/e-wallet/personal finance app lain untuk bootstrap histori dan meningkatkan akurasi analisis.

Coba cek apakah app sudah punya file import.

Kalau sudah exist:
- Tambahkan CSV parser dan mapping column.

Kalau belum:
- Implement CSV import screen.

### 7.1 Flexible Column Mapping

Coba cek apakah format CSV sudah fix.

Kalau sudah:
- Implement parser per template.

Kalau belum:
- Implement mapping UI karena tiap bank/app bisa punya format berbeda.

Field minimum:

```text
Date
Description
Amount
Direction atau Debit/Credit
Balance, kalau tersedia
Category, kalau tersedia
```

### 7.2 Import Preview

Coba cek apakah import langsung menyimpan data.

Kalau iya:
- Tambahkan preview agar user bisa cek hasil parsing.

Kalau belum:
- Implement preview:

```text
Ditemukan 128 transaksi
113 transaksi baru
15 kemungkinan duplikat
3 transaksi butuh review
```

### 7.3 CSV sebagai Basis Analisis Pola

Coba cek apakah histori transaksi sudah bisa dipakai untuk analytics.

Kalau sudah:
- Hubungkan imported transactions ke Pattern Analyzer.

Kalau belum:
- Implement analytics dasar dari CSV/imported transactions.

---

## 8. Core Feature 4 - Analisis Pola Keuangan User

Concern user:

> Kalau ada CSV, app bisa analisis pola keuangan user untuk kasih masukan.

Tujuan: Budget Flow tidak hanya mencatat, tetapi memberi insight yang actionable.

Coba cek apakah app sudah punya analytics engine.

Kalau sudah exist:
- Tambahkan insight yang berbasis pola waktu, kategori, merchant, dan frekuensi.

Kalau belum:
- Implement Pattern Analyzer sederhana dulu.

### 8.1 Insight Minimum

Implement insight berikut:

1. Daily burn rate
2. Weekly spending trend
3. Category spending breakdown
4. Merchant paling sering
5. QRIS frequency
6. Subscription/recurring transaction detection
7. Overspending day pattern
8. Safe-to-spend until next income
9. Unusual spending alert
10. Cashflow projection until payday

Contoh output:

```text
Dalam 7 hari terakhir, pengeluaran kecil via QRIS terjadi 23 kali dengan total Rp418.000.
Rata-rata transaksi kecil kamu Rp18.173.
Kalau pola ini lanjut, budget jajan bulanan akan habis 6 hari lebih cepat.
```

### 8.2 Recommendation Engine

Coba cek apakah app sudah punya rule untuk rekomendasi.

Kalau sudah exist:
- Tambahkan rule berdasarkan hasil analisis transaksi.

Kalau belum:
- Implement rule-based recommendation dulu, sebelum AI kompleks.

Contoh rule:

```text
IF daily_spend > safe_to_spend_today
THEN show warning: "Hari ini kamu sudah lewat batas aman sebesar RpX."
```

```text
IF small_qris_count_today >= 5
THEN show insight: "Kamu sudah QRIS beberapa kali hari ini. Total kecil-kecilnya RpX."
```

---

## 9. Core Feature 5 - Scan Struk / Receipt Scan

Concern user:

> Adakan scan struk buat kalau lagi malas ketik.

Tujuan: user cukup foto struk, app mengubahnya menjadi transaksi dan item list.

Coba cek apakah app sudah punya kamera/image picker.

Kalau sudah exist:
- Tambahkan mode "Scan struk".

Kalau belum:
- Implement camera capture dan image upload.

### 9.1 Receipt OCR

Coba cek apakah OCR sudah bisa membaca struk.

Kalau sudah exist:
- Tambahkan parser merchant, tanggal, total, pajak, diskon, dan item.

Kalau belum:
- Implement OCR receipt extraction minimum.

Field yang perlu diekstrak:

```text
merchant
transaction date
total amount
items
payment method, kalau terlihat
```

### 9.2 Receipt Confirmation

Coba cek apakah hasil scan langsung masuk transaksi.

Kalau iya:
- Ubah agar user bisa review total dan merchant.

Kalau belum:
- Implement review screen:

```text
Merchant: Kopi Kenangan
Total: Rp37.000
Kategori: Food & Drink
Wallet: GoPay
[Save] [Edit]
```

### 9.3 Match dengan Notification

Coba cek apakah receipt scan bisa menyebabkan transaksi dobel.

Kalau iya:
- Tambahkan match logic dengan transaksi dari notifikasi.

Kalau belum:
- Implement matching:

```text
Jika amount, waktu, dan merchant mirip dengan notifikasi yang sudah tercatat, jangan buat transaksi baru. Tawarkan untuk melengkapi detail transaksi yang sudah ada.
```

---

## 10. Additional Concerns yang Perlu Masuk Plan

Selain tiga concern utama di atas, concern berikut sebaiknya juga masuk implementation plan.

### 10.1 Manual Balance Correction

Kenapa penting:
- Notification bisa kelewat.
- User bisa bayar dari sumber yang tidak terbaca.
- Screenshot/OCR bisa salah.

Coba cek apakah ada fitur koreksi saldo.

Kalau belum:
- Implement tombol "Update saldo" di setiap wallet.
- Simpan selisih sebagai untracked gap, bukan menghapus histori.

### 10.2 Confidence Score

Kenapa penting:
- App harus jujur soal seberapa yakin estimasi saldo.

Coba cek apakah transaksi dan wallet punya confidence score.

Kalau belum:
- Implement confidence score berdasarkan sumber data.

Contoh:

```text
Manual confirmed balance: 1.0
CSV imported with balance column: 0.95
Notification parsed clearly: 0.9
Screenshot OCR: 0.7 - 0.9
Ambiguous notification: 0.4 - 0.7
```

### 10.3 Local-First Privacy

Kenapa penting:
- Data transaksi sangat sensitif.
- Untuk personal use, server tidak wajib.

Coba cek apakah data transaksi dikirim ke backend.

Kalau iya:
- Pastikan ada alasan jelas, encryption, dan consent.

Kalau belum:
- Simpan data lokal dulu menggunakan database lokal.
- Tambahkan opsi export dan delete data.

### 10.4 App Source Allowlist

Kenapa penting:
- Notification listener tidak perlu membaca semua notifikasi.

Coba cek apakah user bisa memilih aplikasi mana yang dipantau.

Kalau belum:
- Implement allowlist aplikasi finansial.

Contoh:

```text
GoPay: aktif
ShopeePay: aktif
Livin: aktif
WhatsApp: nonaktif
Instagram: nonaktif
```

### 10.5 Exclude Sensitive Notifications

Kenapa penting:
- Jangan memproses OTP, PIN, kode login, atau data autentikasi.

Coba cek apakah parser mengabaikan OTP dan kode verifikasi.

Kalau belum:
- Implement filter keyword:

```text
OTP
kode verifikasi
PIN
password
login code
verification code
```

### 10.6 Transfer Antar-Wallet

Kenapa penting:
- Transfer dari Jago ke GoPay bukan expense real, hanya perpindahan dana.

Coba cek apakah app membedakan expense dan transfer.

Kalau belum:
- Implement transaction type:

```text
expense
income
transfer_out
transfer_in
adjustment
```

Tambahkan matching antar-wallet agar transfer tidak dihitung sebagai pengeluaran konsumtif.

### 10.7 Recurring Bills dan Upcoming Commitments

Kenapa penting:
- Safe-to-spend harus mengurangi tagihan yang akan datang.

Coba cek apakah app punya upcoming bills.

Kalau belum:
- Implement deteksi transaksi berulang dari histori.
- Izinkan user menandai tagihan sebagai recurring.

### 10.8 Safe-to-Spend Engine

Kenapa penting:
- User tidak hanya butuh tahu saldo, tetapi butuh tahu berapa yang aman dipakai.

Coba cek apakah app sudah menghitung safe-to-spend.

Kalau belum:
- Implement formula awal:

```text
available_money = total_estimated_balance - locked_money - upcoming_bills
safe_to_spend_per_day = available_money / days_until_next_income
safe_to_spend_today = safe_to_spend_per_day - today_spent
```

### 10.9 Widget / Persistent Awareness

Kenapa penting:
- Masalah utama user adalah lupa aware saat sering QRIS.

Coba cek apakah app sudah punya widget atau persistent notification.

Kalau belum:
- Implement widget sederhana:

```text
Today spent: Rp117.500
Safe left: Rp42.500
Estimated total: Rp1.240.000
```

### 10.10 Audit Log dan Explainability

Kenapa penting:
- User perlu tahu kenapa saldo berubah.

Coba cek apakah setiap perubahan saldo bisa dijelaskan.

Kalau belum:
- Implement audit trail:

```text
Saldo GoPay berubah karena:
- QRIS Rp25.000 dari notifikasi GoPay
- Cashback Rp3.000 dari notifikasi GoPay
- Koreksi saldo manual -Rp7.500
```

---

## 11. Implementation Roadmap

### Phase 0 - Audit Existing App

Coba cek apakah Budget Flow sudah memiliki:

- Wallet model
- Transaction model
- Local database
- Dashboard spending
- Manual input transaksi
- Category system
- Export/import system
- Permission screen
- Analytics module

Kalau sudah exist:
- Mapping fitur yang ada ke arsitektur baru.
- Lanjut ke Phase 1.

Kalau belum:
- Implement minimum data model dan local database terlebih dahulu.

### Phase 1 - Estimated Balance Foundation

Implement:

- Wallet balance model
- Confirmed balance
- Estimated balance
- Balance adjustment
- Last confirmed timestamp
- Confidence score
- Basic dashboard

Acceptance criteria:

- User bisa membuat wallet.
- User bisa input saldo awal.
- App bisa menghitung estimated balance setelah transaksi masuk.
- App bisa menampilkan last confirmed date dan confidence.

### Phase 2 - Notification Tracking MVP

Implement:

- Android notification listener
- App allowlist
- Raw notification capture
- Basic parser nominal
- Direction detection: in/out
- Duplicate detection
- Transaction creation

Acceptance criteria:

- Pembayaran QRIS yang muncul di notifikasi bisa tercatat otomatis.
- Transaksi dobel bisa dicegah.
- User bisa menonaktifkan tracking per app.

### Phase 3 - Safe-to-Spend Dashboard

Implement:

- Daily spending total
- Budget period
- Days until next income
- Locked money
- Upcoming bills placeholder
- Safe-to-spend formula
- Awareness dashboard

Acceptance criteria:

- App bisa menjawab: "Hari ini aman pakai berapa lagi?"
- App bisa menampilkan warning ketika user melewati batas aman.

### Phase 4 - Screenshot Balance Update

Implement:

- Image upload/share target
- OCR text extraction
- Balance candidate detection
- Confirmation screen
- Balance adjustment creation

Acceptance criteria:

- User bisa update saldo dari screenshot aplikasi finansial.
- Hasil OCR tidak langsung disimpan tanpa review.
- Selisih saldo tercatat sebagai untracked gap.

### Phase 5 - CSV Import

Implement:

- CSV file picker
- Column mapping
- Import preview
- Duplicate detection
- Transaction normalization
- Error handling

Acceptance criteria:

- User bisa import CSV transaksi.
- User bisa preview sebelum save.
- Data CSV bisa dipakai untuk analytics.

### Phase 6 - Pattern Analyzer

Implement:

- Burn rate analysis
- Category trend
- Merchant frequency
- QRIS frequency
- Recurring transaction detection
- Overspending alerts
- Cashflow projection

Acceptance criteria:

- App bisa memberi insight dari histori transaksi.
- Insight bersifat actionable, bukan sekadar chart.

### Phase 7 - Receipt Scan

Implement:

- Camera/image picker
- Receipt OCR
- Merchant and total extraction
- Category suggestion
- Receipt-to-transaction matching
- Review screen

Acceptance criteria:

- User bisa scan struk tanpa mengetik detail transaksi.
- App bisa mencegah duplikasi dengan transaksi notifikasi.

### Phase 8 - Privacy, Backup, and Future Integration Readiness

Implement:

- Local-first storage
- Export data
- Delete all data
- Optional encrypted backup
- TransactionSource interface
- FutureOpenFinanceAdapter placeholder

Acceptance criteria:

- App siap digunakan personal tanpa server.
- Jika nanti memakai Brankas/Brick/Ayoconnect, integrasi bisa ditambahkan sebagai adapter baru.

---

## 12. Suggested Priority

Urutan implementasi yang paling masuk akal:

1. Wallet + estimated balance
2. Manual balance correction
3. Notification listener
4. Dashboard safe-to-spend
5. Screenshot balance update
6. CSV import
7. Pattern analyzer
8. Receipt scan
9. Widget/persistent notification
10. Future open finance adapter placeholder

Alasan:

- Wallet dan estimated balance adalah fondasi.
- Notification listener menyelesaikan masalah utama: transaksi QRIS tidak tercatat manual.
- Safe-to-spend membuat app terasa berguna langsung.
- Screenshot dan CSV meningkatkan akurasi tanpa integrasi bank resmi.
- Receipt scan membantu ketika user malas mengetik tetapi tetap ingin detail transaksi.

---

## 13. Definition of Done untuk MVP

MVP dianggap selesai jika:

- User bisa membuat beberapa wallet.
- User bisa input saldo awal sekali.
- App bisa menangkap transaksi dari notifikasi Android.
- App bisa menghitung estimated balance.
- App bisa menampilkan spending hari ini.
- App bisa menampilkan safe-to-spend hari ini.
- User bisa koreksi saldo tanpa menghapus histori.
- App bisa menampilkan confidence/last confirmed status.
- Data disimpan lokal.
- App tidak meminta PIN, OTP, password, atau kredensial finansial user.

---

## 14. Future Scope

Fitur yang bisa ditambahkan setelah MVP stabil:

- Official open finance integration melalui provider seperti Brankas, Brick, atau Ayoconnect.
- Encrypted cloud sync.
- Multi-device sync.
- AI financial coach.
- Auto category improvement.
- Subscription cancellation reminder.
- Bill prediction.
- Budget challenge.
- Partner payment integration.

Catatan:

Untuk fase personal use, open finance API belum wajib. Yang wajib adalah struktur app yang siap menerima adapter baru di masa depan.
