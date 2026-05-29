export type TourStepAction = "observe-only" | "click-target" | "open-route" | "open-modal" | "submit-form";

export interface TourStep {
  id: string;
  route?: string;
  targetId: string;
  fallbackTargetId?: string;
  title: string;
  body: string;
  action: TourStepAction;
  expectedEvent?: string;
  expectedRoute?: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  primaryCta?: string;
  secondaryCta?: string;
  allowSkip?: boolean;
  allowBack?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome-home",
    route: "/home",
    targetId: "home-safe-to-spend-card",
    title: "Ini Beranda Kamu",
    body: "Pantau Safe-To-Spend (belanja aman hari ini), batas harian, dan ringkasan budget bulanan dari sini.",
    action: "observe-only",
    primaryCta: "Mulai Catat",
    allowSkip: true,
    allowBack: false,
    placement: "bottom"
  },
  {
    id: "open-record-sheet",
    route: "/home",
    targetId: "nav-record",
    fallbackTargetId: "sidebar-record-button",
    title: "Klik Tombol Catat",
    body: "Tekan tombol + di tengah navigasi ini untuk membuka hub pencatatan transaksi keuangan Anda.",
    action: "click-target",
    expectedEvent: "record-sheet-opened",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "choose-expense",
    targetId: "record-expense-action",
    title: "Pilih Pengeluaran",
    body: "Tekan tombol Pengeluaran untuk mencatat uang keluar secara manual.",
    action: "click-target",
    expectedEvent: "expense-modal-opened",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "input-amount",
    targetId: "expense-amount-input",
    title: "Masukkan Nominal",
    body: "Ketik nominal pengeluaran Anda pada kolom ini (contoh: 15.000).",
    action: "observe-only",
    primaryCta: "Lanjut",
    allowSkip: true,
    allowBack: true,
    placement: "bottom"
  },
  {
    id: "save-expense",
    targetId: "expense-save-button",
    title: "Simpan Transaksi",
    body: "Ketik nominal belanja di atas, pilih kategori (opsional), lalu klik tombol Simpan Pengeluaran ini untuk menyimpannya.",
    action: "click-target",
    expectedEvent: "wallet-transaction-added",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "open-history",
    targetId: "nav-history",
    fallbackTargetId: "sidebar-history-button",
    title: "Buka Riwayat Transaksi",
    body: "Keren! Sekarang mari klik tab Riwayat untuk memantau transaksi yang baru saja Anda catat.",
    action: "click-target",
    expectedRoute: "/ledger",
    allowSkip: true,
    allowBack: false,
    placement: "top"
  },
  {
    id: "tour-complete",
    route: "/ledger",
    targetId: "history-first-transaction",
    fallbackTargetId: "history-search-filter",
    title: "Transaksi Tercatat!",
    body: "Hebat! Transaksi yang baru saja Anda input sudah terdaftar rapi paling atas di sini.",
    action: "observe-only",
    primaryCta: "Lanjut",
    allowSkip: true,
    allowBack: false,
    placement: "bottom"
  },
  {
    id: "advanced-features",
    route: "/ledger",
    targetId: "nav-wallet",
    fallbackTargetId: "sidebar-wallets-button",
    title: "Fitur Otomatisasi & Widget",
    body: "Gunakan juga fitur canggih lainnya:\n• Widget Layar Utama: Klik nominal banknote untuk mencatat secara instan tanpa buka aplikasi.\n• Baca Notifikasi Bank: Rekam otomatis pengeluaran dari SMS & push notification.\n• Scan Struk & Import CSV di halaman Dompet.",
    action: "observe-only",
    primaryCta: "Selesai",
    allowSkip: false,
    allowBack: true,
    placement: "top"
  }
];
