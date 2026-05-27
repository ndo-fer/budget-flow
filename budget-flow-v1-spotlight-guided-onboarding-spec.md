# Budget Flow v1.1 — Spotlight Guided Onboarding Specification

## 1. Purpose

Dokumen ini mendefinisikan onboarding baru untuk Budget Flow dengan pola **spotlight guided onboarding**.

Konsep utamanya:

> User diarahkan melakukan satu action spesifik pada satu waktu. Elemen target dibuat jelas, area lain dibuat blur/dim, lalu onboarding baru lanjut setelah user benar-benar melakukan action yang diminta.

Ini berbeda dari onboarding berbentuk slide, card tutorial, atau checklist besar. Fokus onboarding ini bukan menjelaskan banyak hal sekaligus, tetapi **memandu user melakukan flow inti secara langsung di UI app**.

---

## 2. Problem yang Ingin Diselesaikan

Versi sebelumnya sudah memiliki:

- onboarding awal;
- Starter Checklist;
- FirstRunGuide per menu;
- empty state dengan CTA;
- tombol pusat **Catat**.

Namun masalah UX masih muncul:

1. User tahu ada banyak fitur, tetapi belum tahu urutan idealnya.
2. User membaca terlalu banyak guide/card, tetapi tetap bingung harus klik apa.
3. Home bisa terasa terlalu onboarding-heavy.
4. Flow lebih mudah di-QA, tetapi visual desain terasa ramai.
5. App butuh arahan yang lebih langsung, bukan sekadar penjelasan.

Solusi yang disarankan:

> Ganti sebagian besar guide card besar dengan onboarding interaktif berbasis spotlight.

---

## 3. UX Pattern yang Digunakan

Nama pattern:

```text
Spotlight Guided Onboarding
Guided Product Tour
Coach Marks
Interactive Walkthrough
Focused Task Onboarding
```

Prinsipnya:

```text
1 step = 1 target = 1 action
```

Pada setiap step:

- hanya satu elemen yang disorot;
- elemen lain di-dim atau blur;
- user diberi instruksi singkat;
- user idealnya harus klik target untuk lanjut;
- tombol Skip tetap tersedia;
- tombol Back opsional;
- progress step ditampilkan kecil;
- onboarding tidak boleh terasa seperti modal tutorial panjang.

---

## 4. High-Level Experience

### 4.1 Untuk user baru

Flow onboarding baru:

```text
Register / Login
↓
Setup awal ringan
↓
Masuk Beranda
↓
Spotlight onboarding mulai
↓
Step 1: jelaskan Beranda
↓
Step 2: arahkan klik Catat
↓
Step 3: arahkan pilih Pengeluaran
↓
Step 4: arahkan buka Rencana
↓
Step 5: arahkan lihat/atur Kategori Budget
↓
Step 6: arahkan buka Dompet
↓
Step 7: arahkan update saldo
↓
Step 8: arahkan buka Riwayat
↓
Onboarding selesai
```

### 4.2 Setelah onboarding selesai

User masuk mode normal:

```text
Beranda → cek Safe-To-Spend
Catat → input transaksi
Rencana → atur budget, pemasukan, tagihan
Dompet → update saldo
Riwayat → koreksi transaksi
```

---

## 5. Core Rule

Onboarding harus mengikuti aturan ini:

```text
Jangan menjelaskan semua fitur sekaligus.
Arahkan user melakukan satu hal penting di satu waktu.
```

Jika suatu step meminta user klik menu **Rencana**, maka:

- menu Rencana disorot;
- area lain gelap/blur;
- user hanya diminta klik Rencana;
- setelah klik Rencana dan route berubah, step lanjut.

---

## 6. Visual Behavior

### 6.1 Overlay

Saat onboarding aktif:

- background page dibuat dim;
- bisa memakai semi-transparent dark overlay;
- bisa ditambah blur ringan;
- target element tetap jelas dan clickable;
- tooltip/card kecil muncul dekat target.

Rekomendasi visual:

```text
Overlay:
- background: rgba(0, 0, 0, 0.45)
- backdrop-filter: blur(2px)
- transition: 160ms ease-out

Spotlight:
- border radius mengikuti target
- padding tambahan 8–12px di sekitar target
- shadow halus di sekitar target
- target tetap interactive

Tooltip:
- background white
- border radius 20px
- max width 280–320px mobile
- text pendek
- CTA kecil
```

### 6.2 Jangan terlalu ramai

Hindari:

- shimmer;
- pulse terus-menerus;
- animasi bouncing;
- gradient berlebihan;
- spotlight terlalu glowing;
- tooltip terlalu panjang.

Tombol **Catat** tidak perlu animasi. Posisi tengah + bentuk berbeda sudah cukup noticeable.

---

## 7. Interaction Rules

### 7.1 Required click

Untuk step tertentu, user harus klik target agar onboarding lanjut.

Contoh:

```text
Step: Klik tombol Catat
Target: bottom nav center button
Required action: user click target
Next step: RecordActionSheet terbuka
```

Jika user klik area lain:

- tidak lanjut;
- opsional beri micro feedback;
- jangan tampilkan error besar.

### 7.2 Allowed actions

Setiap step memiliki allowed action:

```ts
type TourAction =
  | "click-target"
  | "open-route"
  | "open-modal"
  | "submit-form"
  | "observe-only";
```

### 7.3 Skip

Tetap sediakan:

```text
Lewati onboarding
```

Tapi jangan terlalu dominan.

### 7.4 Back

Opsional:

```text
Kembali
```

Berguna kalau user ingin melihat instruksi sebelumnya.

### 7.5 Close behavior

Jika user menutup onboarding:

- simpan status sebagai skipped;
- jangan muncul lagi otomatis;
- user bisa buka ulang dari Settings.

---

## 8. Data Attributes untuk Target Element

Agar tour stabil, jangan query by text/class. Gunakan `data-tour-id`.

Contoh:

```tsx
<button data-tour-id="nav-home">Beranda</button>
<button data-tour-id="nav-plan">Rencana</button>
<button data-tour-id="nav-record">Catat</button>
<button data-tour-id="nav-history">Riwayat</button>
<button data-tour-id="nav-wallet">Dompet</button>
```

Untuk target lain:

```tsx
<div data-tour-id="home-safe-to-spend-card" />
<div data-tour-id="home-starter-checklist" />
<button data-tour-id="record-expense-action" />
<button data-tour-id="record-income-action" />
<button data-tour-id="record-receipt-action" />
<button data-tour-id="plan-category-tab" />
<button data-tour-id="plan-income-tab" />
<button data-tour-id="plan-recurring-tab" />
<button data-tour-id="wallet-update-balance-action" />
<div data-tour-id="history-search-filter" />
```

---

## 9. Suggested Tour Steps

## 9.1 Tour A — First-Time Core Tour

Tour ini muncul setelah user menyelesaikan onboarding awal/register dan masuk ke app untuk pertama kali.

### Step 1 — Beranda Overview

```yaml
id: welcome-home
route: /home
target: home-safe-to-spend-card
title: "Ini Beranda kamu"
body: "Di sini kamu melihat kondisi uang harian, termasuk Safe-To-Spend dan progress budget."
action: observe-only
primaryCta: "Lanjut"
```

Tujuan:

- memperkenalkan value utama app;
- jangan terlalu panjang;
- jangan paksa user klik kalau hanya penjelasan.

---

### Step 2 — Klik Catat

```yaml
id: open-record-hub
route: /home
target: nav-record
title: "Catat transaksi dari sini"
body: "Setiap kali ada uang keluar atau masuk, mulai dari tombol Catat."
action: click-target
expectedEvent: record-sheet-opened
```

Behavior:

- highlight tombol Catat;
- area lain blur/dim;
- user harus klik tombol Catat;
- setelah action sheet terbuka, lanjut ke step 3.

Catatan desain:

- tombol Catat tetap tanpa animasi;
- spotlight sudah cukup membuat tombol terlihat.

---

### Step 3 — Pilih Pengeluaran

```yaml
id: choose-expense
modal: record-action-sheet
target: record-expense-action
title: "Mulai dari pengeluaran"
body: "Ini aksi paling sering dipakai. Catat belanja, makan, transport, atau pembayaran harian."
action: click-target
expectedEvent: expense-modal-opened
```

Behavior:

- highlight action **Pengeluaran**;
- user harus klik;
- ExpenseModal terbuka.

---

### Step 4 — Expense Modal Explanation

```yaml
id: explain-expense-form
modal: expense-modal
target: expense-form-main
title: "Isi nominal dan kategori"
body: "Minimal isi jumlah dan kategori. Catatan bisa ditambah kalau perlu."
action: observe-only
primaryCta: "Saya paham"
```

Catatan:

- Jangan paksa submit transaksi dummy.
- Jangan membuat user harus input data palsu.
- Jika user submit transaksi asli, onboarding boleh lanjut otomatis.

---

### Step 5 — Klik Rencana

```yaml
id: open-plan
route: /home
target: nav-plan
title: "Atur rencana budget di sini"
body: "Rencana berisi kategori budget, sumber pemasukan, dan tagihan rutin."
action: click-target
expectedRoute: /budget
```

Behavior:

- tutup modal jika masih terbuka;
- arahkan user ke route Home dulu jika perlu;
- highlight nav Rencana;
- user klik Rencana;
- lanjut setelah route `/budget` aktif.

---

### Step 6 — Anggaran Kategori

```yaml
id: plan-category
route: /budget
target: plan-category-tab
title: "Mulai dari kategori budget"
body: "Atur batas belanja untuk kategori seperti makanan, transportasi, dan hiburan."
action: click-target
expectedSubTab: categories
```

Jika sudah berada di tab kategori, step bisa menjadi observe-only.

---

### Step 7 — Sumber Pemasukan

```yaml
id: plan-income
route: /budget
target: plan-income-tab
title: "Tambahkan sumber pemasukan"
body: "Pemasukan membantu app menghitung budget dan sisa dana dengan lebih akurat."
action: click-target
expectedSubTab: income
```

---

### Step 8 — Tagihan Rutin

```yaml
id: plan-recurring
route: /budget
target: plan-recurring-tab
title: "Pisahkan tagihan rutin"
body: "Tagihan seperti sewa, internet, dan listrik bisa dicatat sebagai pengeluaran rutin."
action: click-target
expectedSubTab: recurring
```

---

### Step 9 — Klik Dompet

```yaml
id: open-wallet
route: /budget
target: nav-wallet
title: "Kelola saldo di Dompet"
body: "Dompet dipakai untuk melihat saldo estimasi dan saldo terkonfirmasi."
action: click-target
expectedRoute: /wallets
```

---

### Step 10 — Update Saldo

```yaml
id: update-wallet-balance
route: /wallets
target: wallet-update-balance-action
title: "Update saldo sesekali"
body: "Kalau saldo asli berbeda, update di sini agar perhitungan Safe-To-Spend tetap akurat."
action: observe-only
primaryCta: "Lanjut"
```

Jika user belum punya wallet:

```yaml
fallbackTarget: wallet-add-action
fallbackTitle: "Tambahkan dompet dulu"
fallbackBody: "Budget Flow butuh minimal satu dompet untuk menghitung saldo."
```

---

### Step 11 — Klik Riwayat

```yaml
id: open-history
route: /wallets
target: nav-history
title: "Cek dan koreksi transaksi"
body: "Riwayat adalah tempat melihat, mencari, dan memperbaiki transaksi yang sudah masuk."
action: click-target
expectedRoute: /ledger
```

---

### Step 12 — Selesai

```yaml
id: tour-complete
route: /ledger
target: history-search-filter
title: "Kamu siap mulai"
body: "Mulai dari Beranda untuk cek kondisi uang, lalu pakai Catat untuk transaksi harian."
action: observe-only
primaryCta: "Selesai"
```

Saat selesai:

```text
mark onboarding_tour_completed = true
hide FirstRunGuide large cards
show normal app mode
```

---

## 10. Tour B — Minimal Tour Alternative

Jika Tour A terlalu panjang, gunakan versi minimal 5 langkah:

```text
1. Beranda → pahami Safe-To-Spend
2. Catat → input transaksi
3. Rencana → atur budget/pemasukan/tagihan
4. Dompet → update saldo
5. Riwayat → cek/koreksi transaksi
```

Detail:

```yaml
steps:
  - target: home-safe-to-spend-card
    title: "Cek kondisi uang di Beranda"
    action: observe-only

  - target: nav-record
    title: "Catat transaksi dari tombol ini"
    action: click-target

  - target: nav-plan
    title: "Atur rencana budget di sini"
    action: click-target

  - target: nav-wallet
    title: "Kelola saldo di Dompet"
    action: click-target

  - target: nav-history
    title: "Cek transaksi di Riwayat"
    action: click-target
```

Rekomendasi:

> Gunakan Tour B untuk v1.1 karena lebih ringan dan tidak membuat user merasa dipaksa terlalu lama.

---

## 11. Tour State Model

Tambahkan state untuk menyimpan progress onboarding.

### 11.1 Local state

```ts
type OnboardingTourStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";
```

### 11.2 Suggested persisted fields

Jika memakai Supabase:

```sql
create table if not exists user_guidance_state (
  user_id uuid primary key references auth.users(id) on delete cascade,

  has_completed_spotlight_tour boolean not null default false,
  has_skipped_spotlight_tour boolean not null default false,
  spotlight_tour_step text null,
  spotlight_tour_completed_at timestamptz null,
  spotlight_tour_skipped_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Jika belum ingin migration:

```ts
localStorage.setItem("bf_spotlight_tour_status", "completed")
localStorage.setItem("bf_spotlight_tour_step", "open-record-hub")
```

Namun untuk app multi-device, Supabase lebih baik.

---

## 12. Component Architecture

### 12.1 Komponen utama

```text
SpotlightTourProvider
SpotlightTourOverlay
SpotlightTooltip
useSpotlightTour()
```

### 12.2 Suggested structure

```text
src/
  components/
    onboarding/
      SpotlightTourProvider.tsx
      SpotlightTourOverlay.tsx
      SpotlightTooltip.tsx
      tourSteps.ts
      useSpotlightTarget.ts
  services/
    guidanceService.ts
```

---

## 13. SpotlightTourProvider Responsibilities

Provider bertugas:

- memuat state onboarding user;
- menentukan apakah tour perlu dimulai;
- menyimpan current step;
- mengatur next/back/skip/complete;
- mengobservasi route change;
- mengobservasi modal open;
- mencari target element berdasarkan `data-tour-id`;
- scroll target ke viewport;
- handle fallback jika target belum tersedia.

Pseudo API:

```ts
interface SpotlightTourContextValue {
  isActive: boolean;
  currentStep: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  notifyAction: (eventName: string) => void;
}
```

---

## 14. Tour Step Type

```ts
export type TourStep = {
  id: string;
  route?: string;
  targetId: string;
  fallbackTargetId?: string;

  title: string;
  body: string;

  action: "observe-only" | "click-target" | "open-route" | "open-modal" | "submit-form";

  expectedRoute?: string;
  expectedEvent?: string;
  expectedSubTab?: string;

  placement?: "top" | "bottom" | "left" | "right" | "auto";

  primaryCta?: string;
  secondaryCta?: string;

  allowSkip?: boolean;
  allowBack?: boolean;
};
```

---

## 15. Overlay Implementation Notes

### 15.1 Basic overlay strategy

Gunakan fixed overlay:

```tsx
<div className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-[2px]" />
```

Lalu target dibuat tetap clickable dengan salah satu pendekatan:

#### Option A — CSS spotlight hole

Gunakan bounding rect target dan `clip-path`/mask.

Pros:

- visual clean;
- target tetap terlihat.

Cons:

- implementasi lebih kompleks.

#### Option B — overlay + cloned highlight box

Gunakan overlay dim, lalu buat highlight rectangle di atas target.

Pros:

- implementasi lebih mudah;
- cukup untuk v1.1.

Cons:

- target asli bisa ketutup jika pointer-events salah.

Rekomendasi v1.1:

> Gunakan Option B agar implementasi lebih cepat dan stabil.

### 15.2 Target click handling

Agar user tetap bisa klik target:

```css
.overlay {
  pointer-events: auto;
}

.highlight-shell {
  pointer-events: none;
}

.target-element {
  position: relative;
  z-index: 10000;
}
```

Alternatif:

- beri class `tour-active-target` ke target;
- set `z-index` tinggi;
- overlay z-index di bawah target;
- tooltip z-index di atas target.

---

## 16. Handling Scroll and Layout

Setiap step:

```ts
target.scrollIntoView({
  behavior: "smooth",
  block: "center",
  inline: "center",
});
```

Setelah scroll, tunggu 100–200ms lalu hitung ulang bounding rect.

Jika target tidak ditemukan:

```text
1. retry beberapa kali selama 1 detik;
2. jika masih tidak ada, gunakan fallbackTarget;
3. jika fallback juga tidak ada, tampilkan tooltip center dengan tombol Lanjut.
```

---

## 17. Mobile Behavior

Karena Budget Flow mobile-first, tour harus aman di viewport kecil.

### 17.1 Rules

- Tooltip max width 300px.
- Tooltip tidak boleh keluar viewport.
- Jika target di bottom nav, tooltip muncul di atas nav.
- Jika target di top header, tooltip muncul di bawah.
- Hindari menutup target dengan tooltip.
- Bottom nav tetap clickable saat step mengharuskan klik nav.

### 17.2 Catat button

Untuk tombol Catat:

```text
Target: nav-record
Tooltip placement: top
Overlay: dim background
Animation: none
```

---

## 18. Desktop Behavior

Desktop memakai sidebar.

### 18.1 Rules

- Target nav ada di sidebar.
- Tooltip muncul di kanan target.
- Overlay tetap full screen.
- Sidebar item target tetap clickable.
- Jangan blur target.

### 18.2 Catat button desktop

Jika desktop punya tombol **Catat Baru** di sidebar:

```text
Target: sidebar-record-button
Tooltip placement: right
```

Untuk mobile:

```text
Target: nav-record
Tooltip placement: top
```

Gunakan target berbeda berdasarkan viewport.

---

## 19. Event Contract

Agar tour bisa lanjut setelah action, komponen perlu dispatch event.

Contoh:

```ts
window.dispatchEvent(new CustomEvent("record-sheet-opened"));
window.dispatchEvent(new CustomEvent("expense-modal-opened"));
window.dispatchEvent(new CustomEvent("expense-created"));
window.dispatchEvent(new CustomEvent("route-changed", { detail: { route: "/budget" }}));
window.dispatchEvent(new CustomEvent("plan-subtab-changed", { detail: { tab: "income" }}));
```

Tour provider mendengarkan event:

```ts
window.addEventListener(expectedEvent, handleExpectedEvent);
```

---

## 20. Integration with Current Components

### 20.1 AppShell

Tambahkan `data-tour-id`:

```tsx
<button data-tour-id="nav-home">Beranda</button>
<button data-tour-id="nav-plan">Rencana</button>
<button data-tour-id="nav-record">Catat</button>
<button data-tour-id="nav-history">Riwayat</button>
<button data-tour-id="nav-wallet">Dompet</button>
```

Untuk desktop:

```tsx
<button data-tour-id="sidebar-record-button">Catat Baru</button>
```

### 20.2 RecordActionSheet

Tambahkan:

```tsx
<button data-tour-id="record-expense-action">Pengeluaran</button>
<button data-tour-id="record-income-action">Pemasukan</button>
<button data-tour-id="record-receipt-action">Scan Struk</button>
<button data-tour-id="record-csv-action">Import CSV</button>
<button data-tour-id="record-update-balance-action">Update Saldo</button>
```

### 20.3 Home

Tambahkan:

```tsx
<div data-tour-id="home-safe-to-spend-card">
  <SafeToSpendCard />
</div>
```

Jika card component sulit diwrap, tambahkan `data-tour-id` langsung di root card.

### 20.4 Budget / Rencana

Tambahkan:

```tsx
<button data-tour-id="plan-category-tab">Anggaran Kategori</button>
<button data-tour-id="plan-income-tab">Sumber Pemasukan</button>
<button data-tour-id="plan-recurring-tab">Tagihan Rutin</button>
```

### 20.5 Wallet

Tambahkan:

```tsx
<button data-tour-id="wallet-add-action">Tambah Dompet</button>
<button data-tour-id="wallet-update-balance-action">Update Saldo</button>
```

### 20.6 History

Tambahkan:

```tsx
<div data-tour-id="history-search-filter">
  Search and filter
</div>
```

---

## 21. Replace or Reduce Existing Guidance

Jika spotlight onboarding aktif, jangan tampilkan guidance besar lain.

### 21.1 Home

Saat spotlight tour aktif:

```text
Hide:
- FirstRunGuide Home
- Starter Checklist besar, jika step belum membutuhkannya

Show:
- Spotlight overlay
```

Setelah tour selesai:

```text
Show:
- normal Home dashboard
- Starter Checklist hanya jika user belum setup data penting
```

### 21.2 Per Menu

Ganti `FirstRunGuide` besar dengan subtitle/header copy kecil.

Contoh Rencana:

```text
Atur budget, pemasukan, dan tagihan rutin sebelum transaksi terjadi.
```

Contoh Dompet:

```text
Kelola saldo estimasi dan saldo terkonfirmasi dari bank, e-wallet, atau cash.
```

---

## 22. Copywriting Guidelines

### 22.1 Prinsip

- 1 kalimat utama;
- maksimal 2 kalimat penjelasan;
- tidak pakai istilah teknis jika tidak perlu;
- jangan menjelaskan semua fitur;
- arahkan user ke action berikutnya.

### 22.2 Contoh good copy

```text
Catat transaksi dari sini.
Setiap uang keluar atau masuk, mulai dari tombol Catat.
```

```text
Atur rencana budget di sini.
Rencana berisi kategori budget, pemasukan, dan tagihan rutin.
```

```text
Cek transaksi di Riwayat.
Kalau ada transaksi salah kategori, kamu bisa koreksi dari sini.
```

### 22.3 Contoh bad copy

```text
Menu ini memiliki berbagai fitur untuk mengelola seluruh alokasi dan data finansial Anda secara komprehensif, termasuk pengelolaan kategori budget, pemasukan, dan recurring expenses.
```

Masalah:

- terlalu panjang;
- terlalu teknis;
- tidak memberi action jelas.

---

## 23. Recommended Final Tour Copy

### Step 1

```text
Title: Ini Beranda kamu
Body: Pantau Safe-To-Spend, batas harian, dan progress budget dari sini.
CTA: Lanjut
```

### Step 2

```text
Title: Catat transaksi dari sini
Body: Setiap uang keluar atau masuk, mulai dari tombol Catat.
Instruction: Klik tombol Catat.
```

### Step 3

```text
Title: Mulai dari Pengeluaran
Body: Ini aksi yang paling sering dipakai untuk mencatat belanja harian.
Instruction: Klik Pengeluaran.
```

### Step 4

```text
Title: Atur rencana budget
Body: Rencana berisi kategori budget, pemasukan, dan tagihan rutin.
Instruction: Klik Rencana.
```

### Step 5

```text
Title: Kelola saldo di Dompet
Body: Dompet membantu mencocokkan saldo estimasi dengan saldo asli.
Instruction: Klik Dompet.
```

### Step 6

```text
Title: Cek transaksi di Riwayat
Body: Semua transaksi yang sudah tercatat bisa dicari dan dikoreksi di sini.
Instruction: Klik Riwayat.
```

### Step 7

```text
Title: Siap mulai
Body: Gunakan Beranda untuk cek kondisi uang, dan Catat untuk transaksi harian.
CTA: Selesai
```

---

## 24. MVP Scope untuk v1.1

Untuk implementasi cepat, jangan langsung buat tour terlalu kompleks.

### Include

- overlay dim + blur ringan;
- target highlight;
- tooltip;
- next/back/skip;
- required click untuk nav dan Catat;
- persist completed/skipped state;
- data-tour-id;
- mobile and desktop positioning basic.

### Exclude dulu

- multi-language;
- complex mask hole;
- analytics event tracking;
- branch step terlalu banyak;
- forced form submission;
- animated spotlight;
- advanced personalization.

---

## 25. Implementation Plan

### Phase 1 — Foundation

- [ ] Buat `SpotlightTourProvider`.
- [ ] Buat `SpotlightTourOverlay`.
- [ ] Buat `SpotlightTooltip`.
- [ ] Definisikan `tourSteps.ts`.
- [ ] Tambahkan localStorage persistence.
- [ ] Tambahkan `data-tour-id` di nav utama.

### Phase 2 — Core Tour

- [ ] Implement route-aware step.
- [ ] Implement target click requirement.
- [ ] Implement skip/complete.
- [ ] Integrasi dengan tombol Catat.
- [ ] Integrasi dengan RecordActionSheet.
- [ ] Tambahkan event `record-sheet-opened`.

### Phase 3 — App Integration

- [ ] Tambahkan target di Home Safe-To-Spend.
- [ ] Tambahkan target di Rencana tabs.
- [ ] Tambahkan target di Dompet.
- [ ] Tambahkan target di Riwayat.
- [ ] Hide FirstRunGuide saat spotlight aktif.

### Phase 4 — Polish

- [ ] Mobile tooltip positioning.
- [ ] Desktop sidebar positioning.
- [ ] Fallback target handling.
- [ ] Reduce visual noise.
- [ ] QA first-run full flow.

### Phase 5 — Backend Persistence

- [ ] Tambahkan migration `user_guidance_state`.
- [ ] Simpan completed/skipped ke Supabase.
- [ ] Sync state antar-device.
- [ ] Tambahkan reset tutorial dari Settings.

---

## 26. Database Migration Detail

Jika ingin persistent per user dan multi-device, gunakan Supabase table.

```sql
create table if not exists public.user_guidance_state (
  user_id uuid primary key references auth.users(id) on delete cascade,

  has_completed_spotlight_tour boolean not null default false,
  has_skipped_spotlight_tour boolean not null default false,
  spotlight_tour_step text null,
  spotlight_tour_completed_at timestamptz null,
  spotlight_tour_skipped_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_guidance_state enable row level security;

create policy "Users can read their own guidance state"
on public.user_guidance_state
for select
using (auth.uid() = user_id);

create policy "Users can insert their own guidance state"
on public.user_guidance_state
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own guidance state"
on public.user_guidance_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Optional updated_at trigger:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_guidance_state_updated_at on public.user_guidance_state;

create trigger set_user_guidance_state_updated_at
before update on public.user_guidance_state
for each row
execute function public.set_updated_at();
```

---

## 27. Backend RPC Detail

### 27.1 Mark tour completed

```sql
create or replace function public.mark_spotlight_tour_completed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_completed_at
  )
  values (
    auth.uid(),
    true,
    false,
    null,
    now()
  )
  on conflict (user_id)
  do update set
    has_completed_spotlight_tour = true,
    has_skipped_spotlight_tour = false,
    spotlight_tour_step = null,
    spotlight_tour_completed_at = now(),
    updated_at = now();
end;
$$;
```

### 27.2 Mark tour skipped

```sql
create or replace function public.mark_spotlight_tour_skipped(p_step text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_skipped_at
  )
  values (
    auth.uid(),
    false,
    true,
    p_step,
    now()
  )
  on conflict (user_id)
  do update set
    has_skipped_spotlight_tour = true,
    spotlight_tour_step = p_step,
    spotlight_tour_skipped_at = now(),
    updated_at = now();
end;
$$;
```

### 27.3 Save current step

```sql
create or replace function public.save_spotlight_tour_step(p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_guidance_state (
    user_id,
    spotlight_tour_step
  )
  values (
    auth.uid(),
    p_step
  )
  on conflict (user_id)
  do update set
    spotlight_tour_step = p_step,
    updated_at = now();
end;
$$;
```

### 27.4 Reset tour

```sql
create or replace function public.reset_spotlight_tour()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_guidance_state (
    user_id,
    has_completed_spotlight_tour,
    has_skipped_spotlight_tour,
    spotlight_tour_step,
    spotlight_tour_completed_at,
    spotlight_tour_skipped_at
  )
  values (
    auth.uid(),
    false,
    false,
    null,
    null,
    null
  )
  on conflict (user_id)
  do update set
    has_completed_spotlight_tour = false,
    has_skipped_spotlight_tour = false,
    spotlight_tour_step = null,
    spotlight_tour_completed_at = null,
    spotlight_tour_skipped_at = null,
    updated_at = now();
end;
$$;
```

---

## 28. QA Checklist

### 28.1 Basic tour

- [ ] Tour muncul untuk user baru.
- [ ] Tour tidak muncul untuk user yang sudah complete.
- [ ] Tour tidak muncul untuk user yang sudah skip.
- [ ] User bisa skip.
- [ ] User bisa reset dari Settings.
- [ ] Current step tersimpan saat reload.

### 28.2 Spotlight behavior

- [ ] Target element terlihat jelas.
- [ ] Area sekitar target dim/blur.
- [ ] Target tetap clickable.
- [ ] Tooltip tidak menutup target.
- [ ] Tooltip tidak keluar viewport.
- [ ] Scroll otomatis ke target jika perlu.

### 28.3 Required click

- [ ] Step Catat hanya lanjut setelah user klik Catat.
- [ ] Step Rencana hanya lanjut setelah user klik Rencana.
- [ ] Step Dompet hanya lanjut setelah user klik Dompet.
- [ ] Step Riwayat hanya lanjut setelah user klik Riwayat.
- [ ] Klik area lain tidak merusak state tour.

### 28.4 Mobile

- [ ] Bottom nav tetap terlihat.
- [ ] Tooltip Catat muncul di atas nav.
- [ ] Overlay tidak menutup iOS/Android safe area secara aneh.
- [ ] Tour tetap usable di layar kecil.

### 28.5 Desktop

- [ ] Sidebar target bisa di-highlight.
- [ ] Tooltip muncul di sisi kanan target.
- [ ] Layout tidak rusak saat sidebar aktif.

### 28.6 Edge cases

- [ ] Target belum render → retry.
- [ ] Target tidak ada → fallback.
- [ ] User reload di tengah tour → lanjut dari step terakhir.
- [ ] User resize viewport → bounding rect update.
- [ ] User navigasi browser back → step tidak corrupt.
- [ ] Modal ditutup manual → tour bisa recover.

---

## 29. Design QA Checklist

- [ ] Tidak ada pulse animation pada tombol Catat.
- [ ] Tidak ada shimmer pada tombol Catat.
- [ ] Overlay terasa calm, bukan flashy.
- [ ] Tooltip copy pendek.
- [ ] Hanya satu target disorot per step.
- [ ] Tidak ada dua guidance besar muncul bersamaan.
- [ ] Tour tidak membuat app terasa seperti tutorial game.
- [ ] App tetap terasa minimalis dan finance-oriented.

---

## 30. Definition of Done

Spotlight onboarding dianggap selesai jika:

- user baru memahami 5 area utama app tanpa membaca dokumentasi panjang;
- user diarahkan klik elemen tertentu satu per satu;
- area sekitar target blur/dim;
- target tetap clickable;
- tombol Catat tidak memakai animasi;
- onboarding bisa diselesaikan, diskip, dan diulang;
- state onboarding tersimpan;
- Starter Checklist dan FirstRunGuide tidak menumpuk secara visual;
- manual QA first-time user flow lulus di mobile dan desktop.

---

## 31. Recommended Task Name

```text
Implement Spotlight Guided Onboarding for Budget Flow v1.1: focused one-step-at-a-time coach marks with dimmed background, required target clicks, and calmer visual guidance.
```

---

## 32. Final Recommendation

Untuk v1.1, gunakan **Tour B minimal 5–7 step** terlebih dahulu.

Jangan langsung membuat onboarding terlalu panjang. Tujuan awalnya bukan menjelaskan semua fitur, tetapi memastikan user paham mental model utama:

```text
Beranda = cek kondisi uang
Catat = input transaksi
Rencana = atur budget/pemasukan/tagihan
Dompet = kelola saldo
Riwayat = cek dan koreksi transaksi
```

Setelah mental model ini masuk, fitur lain bisa dipelajari lewat empty state kecil dan contextual hint, bukan tutorial besar.

Keputusan desain paling penting:

> **Spotlight sudah cukup membuat target terlihat. Tombol Catat tidak perlu animasi tambahan.**
