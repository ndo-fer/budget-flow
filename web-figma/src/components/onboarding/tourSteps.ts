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
    title: "Ini Beranda kamu",
    body: "Pantau Safe-To-Spend, batas harian, dan progress budget dari sini.",
    action: "observe-only",
    primaryCta: "Lanjut",
    allowSkip: true,
    allowBack: false,
    placement: "bottom"
  },
  {
    id: "open-record-hub",
    route: "/home",
    targetId: "nav-record",
    fallbackTargetId: "sidebar-record-button",
    title: "Catat transaksi dari sini",
    body: "Setiap uang keluar atau masuk, mulai dari tombol Catat.",
    action: "click-target",
    expectedEvent: "record-sheet-opened",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "choose-expense",
    targetId: "record-expense-action",
    title: "Mulai dari Pengeluaran",
    body: "Ini aksi yang paling sering dipakai untuk mencatat belanja harian.",
    action: "click-target",
    expectedEvent: "expense-modal-opened",
    allowSkip: true,
    allowBack: true,
    placement: "right"
  },
  {
    id: "open-plan",
    targetId: "nav-plan",
    title: "Atur rencana budget",
    body: "Rencana berisi kategori budget, pemasukan, dan tagihan rutin.",
    action: "click-target",
    expectedRoute: "/budget",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "open-wallet",
    route: "/budget",
    targetId: "nav-wallet",
    title: "Kelola saldo di Dompet",
    body: "Dompet membantu mencocokkan saldo estimasi dengan saldo asli.",
    action: "click-target",
    expectedRoute: "/wallets",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "open-history",
    route: "/wallets",
    targetId: "nav-history",
    title: "Cek transaksi di Riwayat",
    body: "Semua transaksi yang sudah tercatat bisa dicari dan dikoreksi di sini.",
    action: "click-target",
    expectedRoute: "/ledger",
    allowSkip: true,
    allowBack: true,
    placement: "top"
  },
  {
    id: "tour-complete",
    route: "/ledger",
    targetId: "history-search-filter",
    title: "Siap mulai",
    body: "Gunakan Beranda untuk cek kondisi uang, dan Catat untuk transaksi harian.",
    action: "observe-only",
    primaryCta: "Selesai",
    allowSkip: false,
    allowBack: true,
    placement: "bottom"
  }
];
