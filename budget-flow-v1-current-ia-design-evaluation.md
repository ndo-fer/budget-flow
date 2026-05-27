# Budget Flow v1 — Current IA & Design Evaluation Recap

## 1. Context

Dokumen ini adalah rekap evaluasi untuk versi Budget Flow v1 setelah perbaikan awal pada:

- information architecture cleanup;
- navigation restructuring;
- user flow simplification;
- feature placement audit;
- Starter Checklist di Home;
- empty state dengan CTA;
- first-run guide per menu;
- pusat aksi input melalui tombol **Catat / Tambah Data**;
- revisi label menu menjadi lebih natural seperti **Beranda**, **Rencana**, **Riwayat**, dan **Dompet**.

Evaluasi ini berangkat dari kondisi terbaru app: secara manual QA flow sudah terasa lebih baik, tetapi desain/visual feel mulai terasa kurang rapi, kurang premium, dan agak terlalu ramai.

---

## 2. High-Level Verdict

Versi sekarang **lebih benar secara flow**, tetapi **terlalu agresif secara visual**.

Perubahan IA sudah bergerak ke arah yang tepat: menu utama lebih ringkas, fitur planning mulai dikumpulkan ke **Rencana**, transaksi masa lalu dipusatkan di **Riwayat**, saldo dipusatkan di **Dompet**, dan input data dipusatkan melalui tombol **Catat**.

Namun, cara app menjelaskan flow ke user sekarang terlalu banyak memakai elemen besar: guide card, checklist besar, empty state besar, CTA solid, rounded besar, gradient, shadow, dan animasi. Hasilnya, app lebih mudah dipahami saat QA, tetapi desain terasa kurang calm, kurang minimalis, dan sedikit seperti prototype onboarding yang terlalu eksplisit.

Masalah utamanya bukan lagi “fitur salah tempat total”, melainkan:

> **Flow clarity sudah membaik, tetapi visual hierarchy dan design restraint perlu dirapikan.**

---

## 3. What Improved in the Current Version

### 3.1 Navigasi utama sudah lebih masuk akal

Struktur utama sekarang lebih natural:

```text
Beranda
Rencana
Catat
Riwayat
Dompet
```

Ini jauh lebih baik dibanding struktur lama yang terasa lebih dekat ke data model/internal implementation.

**Evaluasi:** bagus. Jangan rollback struktur ini.

### 3.2 Catat sebagai pusat input adalah keputusan yang benar

Pusat aksi input melalui **Catat / Tambah Data** membantu user memahami bahwa semua aktivitas pencatatan dimulai dari satu tempat.

Ini menyelesaikan masalah lama ketika user harus menebak:

- tambah pengeluaran lewat Wallet?
- tambah income lewat Income?
- scan struk lewat Wallet?
- import CSV lewat Wallet?
- koreksi saldo lewat mana?

Sekarang semua bisa dimulai dari satu entry point.

**Evaluasi:** konsepnya benar, tetapi desain tombol dan isi action sheet perlu dibuat lebih tenang.

### 3.3 Rencana mulai menjadi tempat planning yang benar

Fitur seperti:

- anggaran kategori;
- sumber pemasukan;
- tagihan rutin;

sudah lebih cocok berada di **Rencana** dibanding tersebar di Settings, Income, History, atau Ledger.

**Evaluasi:** arah IA sudah benar.

### 3.4 Riwayat lebih fokus

Riwayat sekarang lebih jelas sebagai tempat melihat dan mengoreksi transaksi yang sudah terjadi.

Ini cocok dengan prinsip:

```text
Masa lalu → Riwayat
Masa depan / aturan → Rencana
Saldo / dompet → Dompet
Input baru → Catat
```

**Evaluasi:** benar.

### 3.5 Empty state dan first-run guidance membantu QA

Dari sisi QA, empty state dengan CTA dan guide per menu membantu memastikan user tidak buntu ketika data masih kosong.

**Evaluasi:** secara fungsi bagus, tetapi secara visual perlu lebih ringan.

---

## 4. Main Problem in the Current Version

### 4.1 App terasa “lebih jelas”, tapi juga lebih ramai

Perbaikan flow dilakukan dengan banyak elemen eksplisit:

- guide card;
- checklist;
- progress bar;
- CTA di banyak tempat;
- card besar;
- shadow;
- gradient;
- rounded besar;
- tombol animasi;
- label edukatif panjang.

Secara QA, ini membantu. Secara design, ini bisa membuat app terasa:

- kurang minimalis;
- kurang mature;
- terlalu onboarding-heavy;
- terlalu banyak elemen yang berebut perhatian;
- kurang fokus ke financial insight utama.

### 4.2 Clarity tidak harus selalu berarti menambah visual element

Solusi yang lebih baik:

```text
Bukan: user bingung → tambah card/CTA/animasi.
Tapi: user bingung → kurangi pilihan, rapikan prioritas, dan pakai copy singkat di posisi yang tepat.
```

---

## 5. Quick Action Tengah / Tombol Catat

### 5.1 Evaluasi saat ini

Tombol **Catat** di tengah bottom navigation sudah punya keunggulan natural karena:

- posisinya di tengah;
- bentuknya berbeda dari tab lain;
- dia adalah satu-satunya action button, bukan nav biasa;
- icon plus sudah cukup familiar sebagai action create/add.

Karena itu, tombol ini **tidak perlu animasi terus-menerus**.

### 5.2 Masalah animasi

Animasi seperti pulse, shimmer, atau efek bergerak terus-menerus membuat tombol terlihat terlalu “teriak”.

Dampaknya:

- mengurangi kesan premium;
- menarik perhatian berlebihan dari konten utama;
- membuat bottom nav terasa kurang tenang;
- bisa mengganggu user yang sering membuka app;
- membuat desain terasa seperti prototype/gamified CTA, bukan finance tool yang calm.

### 5.3 Keputusan desain

**Hapus animasi dari tombol Catat.**

Tombol tengah cukup dibuat noticeable lewat:

- posisi di tengah;
- bentuk circular/floating sedikit;
- ukuran sedikit lebih besar;
- warna primary;
- icon plus;
- label “Catat”.

### 5.4 Rekomendasi visual tombol Catat

Gunakan desain seperti ini:

```text
- solid teal / primary color
- circular atau rounded-full
- no shimmer
- no infinite pulse
- no excessive glow
- shadow tipis saja
- border putih boleh, tapi jangan terlalu tebal
- active state cukup scale 0.98
```

### 5.5 Behavior yang disarankan

Animasi hanya boleh dipakai secara kondisional:

```text
Jika user belum pernah mencatat transaksi:
  tampilkan small badge "Mulai" atau "1"
  bukan animasi terus-menerus

Jika user sudah pernah mencatat transaksi:
  tampilkan normal state tanpa badge/animasi
```

### 5.6 Acceptance criteria

- Tombol Catat tetap lebih noticeable daripada tab lain.
- Tidak ada animation loop.
- Tidak ada shimmer.
- Tidak ada pulse.
- Tombol tetap accessible dan jelas.
- User masih langsung mengenali tombol sebagai primary action.

---

## 6. Information Architecture Cleanup — Current Evaluation

### 6.1 Status

**Mostly good.**

IA sudah lebih rapi dibanding versi sebelumnya. Struktur utama sudah mengikuti intent user, bukan hanya struktur database.

### 6.2 Yang sudah benar

| Area | Evaluasi |
|---|---|
| Beranda | Sudah cocok sebagai ringkasan dan arahan |
| Rencana | Sudah cocok untuk budget, income source, tagihan rutin |
| Riwayat | Sudah cocok untuk transaksi yang sudah terjadi |
| Dompet | Sudah cocok untuk saldo dan wallet |
| Catat | Sudah cocok sebagai pusat input |

### 6.3 Yang masih perlu diperbaiki

Beberapa action lama masih muncul di tempat yang melemahkan IA baru.

Contoh:

- `+ Expense` dan `+ Income` masih muncul di wallet card.
- Import CSV dari Catat masih terasa diarahkan ke konteks Dompet.
- Koreksi saldo muncul di Catat dan Dompet, perlu dibedakan konteksnya.

### 6.4 Rekomendasi

#### Wallet card

Hapus tombol:

```text
+ Expense
+ Income
```

Atau ubah menjadi satu secondary text link kecil:

```text
Catat transaksi dari dompet ini
```

Namun idealnya, biarkan semua input transaksi harian dimulai dari **Catat**.

#### CSV Import

Jika user memilih Import CSV dari Catat, jangan terasa seperti “dipindahkan ke Dompet”.

Lebih baik:

```text
Catat → Import CSV modal langsung terbuka
```

Bukan:

```text
Catat → navigate ke Dompet → buka CSV modal
```

#### Koreksi Saldo

Koreksi saldo boleh ada di dua konteks:

```text
Dompet:
  action utama karena berhubungan dengan saldo

Catat:
  secondary action / lainnya
```

Jangan dibuat setara dengan “Tambah Pengeluaran” karena koreksi saldo bukan aktivitas harian utama.

---

## 7. Navigation Restructuring — Current Evaluation

### 7.1 Status

**Good, but visual treatment needs refinement.**

Struktur bottom nav sudah tepat:

```text
Beranda | Rencana | Catat | Riwayat | Dompet
```

### 7.2 Masalah visual

Masalah bukan pada struktur, tetapi pada treatment tombol tengah.

Tombol tengah sudah cukup menonjol karena lokasinya. Kalau ditambah animasi, gradient, shimmer, shadow, dan floating berlebihan, efeknya menjadi visual noise.

### 7.3 Rekomendasi nav

Bottom nav sebaiknya terasa calm:

```text
Tab biasa:
  icon + label kecil

Catat:
  icon plus + label
  sedikit lebih tinggi
  warna primary
  tanpa animasi
```

### 7.4 Jangan semua dibuat primary

Catat boleh menjadi primary global action, tetapi elemen lain jangan ikut dibuat terlalu mencolok. Kalau terlalu banyak elemen “penting”, tidak ada yang benar-benar penting.

---

## 8. User Flow Simplification — Current Evaluation

### 8.1 Status

**Improved, but action sheet still too broad.**

Action hub sekarang menyatukan banyak cara input:

- tambah pengeluaran;
- tambah pemasukan;
- scan struk;
- import CSV;
- cek notifikasi;
- koreksi saldo.

Secara fungsi benar, tetapi secara decision-making masih terlalu banyak pilihan yang tampil setara.

### 8.2 Masalah

User baru bisa kembali bingung karena semua pilihan terlihat penting.

Padahal daily flow utama seharusnya:

```text
1. Catat pengeluaran
2. Catat pemasukan
3. Scan struk
```

Sementara fitur lain adalah secondary:

```text
- Import CSV
- Koreksi saldo
- Cek notifikasi
```

### 8.3 Rekomendasi struktur action sheet

#### Level pertama

Tampilkan tiga primary actions:

```text
Pengeluaran
Pemasukan
Scan Struk
```

#### Level kedua

Tampilkan sebagai small text/link section:

```text
Lainnya:
Import CSV · Update Saldo · Cek Notifikasi
```

Atau:

```text
Advanced / Otomatis:
- Import CSV
- Update Saldo
- Cek Notifikasi
```

### 8.4 Copy yang disarankan

Gunakan label pendek:

| Saat ini | Saran |
|---|---|
| Tambah Pengeluaran | Pengeluaran |
| Tambah Pemasukan | Pemasukan |
| Scan Struk Belanja | Scan Struk |
| Import CSV Mutasi | Import CSV |
| Cek Notifikasi Keuangan | Cek Notifikasi |
| Koreksi Saldo Dompet | Update Saldo |

---

## 9. Feature Placement Audit — Current Evaluation

### 9.1 Placement yang sudah benar

| Fitur | Lokasi ideal | Status |
|---|---|---|
| Safe-To-Spend | Beranda | Benar |
| Batas harian | Beranda | Benar |
| Analisis ringkas | Beranda | Benar |
| Budget kategori | Rencana | Benar |
| Income source | Rencana | Benar |
| Tagihan rutin | Rencana | Benar |
| Semua transaksi | Riwayat | Benar |
| Search/filter transaksi | Riwayat | Benar |
| Wallet/saldo | Dompet | Benar |
| Update saldo | Dompet | Benar |
| Input transaksi | Catat | Benar |

### 9.2 Placement yang masih perlu disempurnakan

| Fitur | Masalah | Rekomendasi |
|---|---|---|
| `+ Expense` / `+ Income` di wallet card | Mengganggu mental model Catat | Hapus atau jadikan secondary text link |
| CSV Import via Catat tapi modal di Dompet | Terasa seperti routing tersembunyi | Buka modal langsung dari Catat |
| Screenshot saldo di Catat dan Dompet | Boleh, tapi hierarchy harus beda | Dompet = primary, Catat = secondary |
| FirstRunGuide di setiap menu | Terlalu berat secara visual | Ubah jadi contextual hint kecil |
| Starter Checklist + FirstRunGuide di Home | Double guidance | Pilih salah satu |

---

## 10. Starter Checklist di Home — Current Evaluation

### 10.1 Status

**Useful but visually dominant.**

Starter Checklist membantu user memahami urutan awal:

```text
1. Tambah dompet
2. Tambah pemasukan
3. Atur budget kategori
4. Catat pengeluaran pertama
5. Koreksi saldo
```

Ini bagus untuk onboarding functional.

### 10.2 Masalah

Checklist terlalu besar jika muncul bersama:

- FirstRunGuide;
- header Home;
- cards Safe-To-Spend;
- analytics/dashboard cards.

Home jadi terasa seperti setup page, bukan financial dashboard.

### 10.3 Rekomendasi

Untuk user baru:

```text
Tampilkan Starter Checklist.
Jangan tampilkan FirstRunGuide besar di Home.
```

Untuk user yang setup selesai:

```text
Sembunyikan checklist.
Tampilkan dashboard utama.
```

Jika tetap ingin ada guidance:

```text
Gunakan compact banner, bukan card besar.
```

Contoh:

```text
Selesaikan 5 langkah setup agar Safe-To-Spend lebih akurat.
[Lihat checklist]
```

---

## 11. Empty State dengan CTA — Current Evaluation

### 11.1 Status

**Correct but needs variants.**

Empty state sudah membantu user tidak buntu.

Namun, satu komponen empty state besar dipakai untuk banyak konteks. Ini membuat section kecil terasa terlalu besar.

### 11.2 Rekomendasi

Buat dua varian:

#### EmptyStateHero

Untuk screen benar-benar kosong.

Ciri:

```text
- icon besar
- title
- description
- primary CTA
- spacing besar
```

#### EmptyStateInline

Untuk subsection di dalam card.

Ciri:

```text
- icon kecil
- title pendek
- 1 kalimat
- text button / small CTA
- tanpa card besar tambahan
```

### 11.3 Contoh

Untuk Rencana > Sumber Pemasukan kosong:

```text
Belum ada pemasukan
Tambah sumber pemasukan agar Safe-To-Spend lebih akurat.
[Tambah]
```

Tidak perlu card besar dengan p-8 jika sudah berada di dalam card Rencana.

---

## 12. First-Run Guide per Menu — Current Evaluation

### 12.1 Status

**Functionally helpful, visually heavy.**

FirstRunGuide membantu user memahami menu, tetapi bentuk card gradient besar membuat app terasa terlalu onboarding-heavy.

### 12.2 Masalah

User biasanya tidak mau membaca banyak teks saat mencoba app. Mereka ingin langsung melakukan aksi.

Jadi guide panjang bisa membantu QA, tetapi belum tentu membantu real user.

### 12.3 Rekomendasi

Ubah dari tutorial card menjadi contextual hint kecil.

#### Before

```text
Card besar:
title
description panjang
button "Saya Mengerti"
```

#### After

```text
Small hint:
"Rencana mengatur budget, pemasukan, dan tagihan sebelum transaksi terjadi."
[OK]
```

Atau cukup jadikan subtitle di header.

---

## 13. UX Writing & Label Consistency

### 13.1 Status

**Perlu dirapikan.**

Nav utama sudah Bahasa Indonesia, tetapi masih ada banyak campuran Inggris-Indonesia di dalam screen.

Contoh yang perlu diganti:

| Saat ini | Saran |
|---|---|
| Estimated Financials | Ringkasan Keuangan |
| Overview | Ringkasan |
| Analytics & Insights | Analisis |
| Category breakdown | Rincian Kategori |
| Income Sources | Sumber Pemasukan |
| Add Wallet | Tambah Dompet |
| Bank Account | Rekening Bank |
| + Expense | Pengeluaran |
| + Income | Pemasukan |
| Screenshot Saldo | Update Saldo |
| Koreksi Saldo Dompet | Update Saldo |

### 13.2 Kenapa ini penting

Copy campur bahasa membuat produk terasa belum matang walaupun layout sudah rapi.

Untuk app personal finance berbahasa Indonesia, gunakan tone yang konsisten:

```text
Jelas
Ramah
Tidak terlalu teknis
Tidak terlalu panjang
```

---

## 14. Visual Design Evaluation

### 14.1 Masalah utama

Desain sekarang kehilangan rasa minimalis karena terlalu banyak surface dan treatment kuat.

Pola yang terlalu sering muncul:

```text
rounded-[32px]
shadow-sm
gradient
large card
solid CTA
uppercase tiny label
icon card
border
```

Satu-dua elemen seperti ini bagus. Tetapi kalau dipakai di hampir semua komponen, semuanya terasa sama penting.

### 14.2 Rekomendasi visual system

#### Border radius

```text
Page-level card: 24px
Section card: 20px
Inner item: 16px
Button: 14–16px
Pill: 999px
```

Kurangi penggunaan `rounded-[32px]`.

#### Shadow

```text
Default card: no shadow, border only
Important card: subtle shadow
Modal/nav: stronger shadow
```

Jangan semua card punya shadow.

#### Gradient

```text
Gunakan gradient hanya untuk:
- logo/avatar
- hero/special state
- primary brand moment

Jangan dipakai untuk banyak CTA/card.
```

#### CTA

```text
Satu primary CTA per section.
Secondary action gunakan outline/text button.
```

#### Animation

```text
Tidak ada infinite animation untuk navigasi utama.
Animasi hanya untuk:
- transition masuk modal
- loading state
- feedback setelah action
```

---

## 15. Revised Design Direction

Arah desain berikutnya sebaiknya:

```text
Calm finance companion
bukan
Loud onboarding dashboard
```

Karakter visual yang dicari:

- clean;
- calm;
- guided but not noisy;
- friendly but still mature;
- minimal but not empty;
- clear hierarchy;
- one obvious next action per screen.

---

## 16. Priority Fixes

### P0 — Fix First

#### 1. Remove animation from center Catat button

- Hapus pulse.
- Hapus shimmer.
- Hapus infinite animation.
- Pertahankan posisi tengah dan bentuk berbeda.

#### 2. Jangan tampilkan FirstRunGuide + StarterChecklist bersamaan di Home

- Home user baru: tampilkan checklist.
- Home user lama: tampilkan dashboard.
- FirstRunGuide Home cukup jadi compact hint atau dihapus.

#### 3. Kurangi action utama di RecordActionSheet

Primary:

```text
Pengeluaran
Pemasukan
Scan Struk
```

Secondary:

```text
Import CSV
Update Saldo
Cek Notifikasi
```

#### 4. Hapus `+ Expense` dan `+ Income` dari wallet card

Dompet harus fokus ke saldo, bukan input transaksi harian.

### P1 — Fix Next

#### 5. Buat EmptyStateHero dan EmptyStateInline

Gunakan empty state sesuai konteks.

#### 6. Rapikan UX copy ke Bahasa Indonesia konsisten

Ganti semua istilah campuran Inggris-Indonesia.

#### 7. Kurangi card visual weight

- Kurangi rounded 32px.
- Kurangi shadow.
- Kurangi gradient.
- Kurangi CTA solid.

### P2 — Later

#### 8. Buat lightweight first-run hint system

Ganti tutorial card besar dengan contextual hint kecil.

#### 9. Tambah state-based guidance

Contoh:

```text
Jika belum ada income → Home beri CTA income.
Jika belum ada wallet → Home beri CTA wallet.
Jika belum ada transaksi → Home beri CTA catat.
```

#### 10. Buat design tokens

Definisikan token untuk:

- radius;
- spacing;
- color usage;
- shadow;
- button hierarchy;
- typography;
- empty state variants.

---

## 17. Recommended Manual QA Checklist

### 17.1 Navigation

- [ ] User baru bisa memahami menu utama dalam 5 detik.
- [ ] Bottom nav tidak terasa ramai.
- [ ] Tombol Catat terlihat jelas tanpa animasi.
- [ ] Settings tidak terasa hilang walaupun tidak jadi tab utama.

### 17.2 Catat Flow

- [ ] User bisa mencatat pengeluaran dari tombol Catat.
- [ ] User bisa mencatat pemasukan dari tombol Catat.
- [ ] User bisa scan struk dari tombol Catat.
- [ ] Import CSV dan update saldo tidak terasa sebagai aksi utama harian.
- [ ] Action sheet tidak terasa terlalu penuh.

### 17.3 Home

- [ ] User baru melihat next step yang jelas.
- [ ] User tidak melihat terlalu banyak guide sekaligus.
- [ ] User lama langsung melihat ringkasan keuangan, bukan onboarding content.
- [ ] Safe-To-Spend tetap menjadi hero utama.

### 17.4 Rencana

- [ ] User paham bahwa Rencana berisi budget, pemasukan, dan tagihan rutin.
- [ ] Sub-tab tidak terasa terlalu banyak.
- [ ] Empty state tidak terlalu besar jika hanya section kosong.

### 17.5 Dompet

- [ ] Dompet terasa fokus ke saldo/wallet.
- [ ] Tidak ada action transaksi harian yang mengganggu.
- [ ] Update saldo jelas.
- [ ] Saldo estimasi vs terkonfirmasi mudah dibaca.

### 17.6 Riwayat

- [ ] Riwayat fokus ke transaksi masa lalu.
- [ ] Search dan filter mudah ditemukan.
- [ ] Empty state mengarah ke Catat.
- [ ] Edit/koreksi transaksi tidak mengganggu list readability.

### 17.7 Visual Polish

- [ ] Tidak ada animasi loop yang tidak perlu.
- [ ] Tidak semua card terlihat seperti primary content.
- [ ] Hanya satu CTA utama per section.
- [ ] Copy konsisten Bahasa Indonesia.
- [ ] App terasa calm, bukan ramai.

---

## 18. Definition of Done

Perbaikan dianggap selesai jika:

- tombol Catat tidak lagi memakai infinite animation;
- user tetap mengenali Catat sebagai action utama;
- Home tidak menampilkan dua guidance besar sekaligus;
- RecordActionSheet hanya menonjolkan 2–3 aksi utama;
- action sekunder tidak bersaing dengan action utama;
- Wallet tidak lagi menjadi tempat utama input expense/income;
- EmptyState punya varian hero dan inline;
- copy Inggris-Indonesia sudah dirapikan;
- desain terasa lebih tenang tanpa mengurangi clarity;
- manual QA tetap lulus untuk first-time user flow.

---

## 19. Suggested Implementation Task Name

```text
Refine Budget Flow v1.1 UI after IA cleanup: remove excessive motion, simplify Catat action hierarchy, reduce visual noise, and restore calm minimal design.
```

---

## 20. Short Summary

Versi sekarang sudah lebih baik secara flow, tetapi desain terasa menurun karena terlalu banyak visual reinforcement.

Yang perlu dipertahankan:

```text
Beranda / Rencana / Catat / Riwayat / Dompet
```

Yang perlu dikurangi:

```text
animasi, shimmer, pulse, card besar, CTA berlebihan, gradient berlebihan, guide card berlebihan
```

Keputusan khusus untuk quick action:

> **Tombol Catat tidak perlu animasi. Posisi tengah + bentuk berbeda sudah cukup noticeable.**

Next iteration sebaiknya bukan menambah guidance lagi, tetapi **mengurangi visual noise sambil menjaga flow yang sudah lebih benar**.
