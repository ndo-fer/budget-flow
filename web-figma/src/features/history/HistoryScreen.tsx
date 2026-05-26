import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Download, 
  Plus, 
  X,
  CreditCard,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Repeat2,
  SlidersHorizontal,
  Check,
  ChevronDown
} from "lucide-react";
import { 
  getWalletTransactions, 
  deleteWalletTransaction,
  updateWalletTransaction
} from "../../services/walletTransactionService";
import { 
  getRecurringExpenses, 
  createRecurringExpense, 
  deleteRecurringExpense,
  syncRecurringExpensesForMonth
} from "../../services/recurringService";
import { getCategories } from "../../services/categoryService";
import { 
  exportAllRecurringToICS, 
  getGoogleCalendarUrl, 
  recurringToCalendarEvent 
} from "../../services/calendarService";
import { formatCurrency } from "../../utils/format";
import { getAppFriendlyName } from "../../services/notificationParserService";
import { getCurrentMonth } from "../../utils/date";
import { toast } from "../../utils/toast";
import type { WalletTransaction, BudgetCategory } from "../../types/models";
import Dropdown from "../../components/Dropdown";

interface HistoryScreenProps {
  onNavigateTab?: (tab: any) => void;
  activeTab?: string;
  searchParams?: string;
  clearSearchParams?: () => void;
}

export default function HistoryScreen({ onNavigateTab, activeTab: activeTabProp, searchParams, clearSearchParams }: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<"all" | "recurring">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [showCategoryFilterDropdown, setShowCategoryFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // New recurring expense form
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recCategoryId, setRecCategoryId] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFrequency, setRecFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [recDayOfMonth, setRecDayOfMonth] = useState("1");
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [recNote, setRecNote] = useState("");
  const [isSavingRecurring, setIsSavingRecurring] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  
  const [openCategoryTxId, setOpenCategoryTxId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = searchParams || "";
    const params = new URLSearchParams(query);
    const tabParam = params.get("tab");
    const categoryParam = params.get("category");

    if (categoryParam) {
      setSelectedCategoryFilter(categoryParam);
      setActiveTab("all");
      clearSearchParams?.();
      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    if (activeTabProp === "recurring" || tabParam === "recurring") {
      setActiveTab("recurring");
      clearSearchParams?.();
      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else if (activeTabProp === "history" && tabParam === "all") {
      setActiveTab("all");
      clearSearchParams?.();
      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeTabProp, searchParams, clearSearchParams]);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [txs, recs, cats] = await Promise.all([
        getWalletTransactions(undefined, 100),
        getRecurringExpenses(),
        getCategories()
      ]);
      setTransactions(txs);
      setRecurring(recs);
      setCategories(cats.filter((c) => c.is_active));
      if (cats.length > 0) setRecCategoryId(cats[0].id.toString());
    } catch (err) {
      console.error("Error loading history screen data:", err);
      toast.error("Gagal memuat data transaksi.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTransactionAdded = () => {
      loadData(true);
    };
    window.addEventListener("wallet-transaction-added", handleTransactionAdded);
    return () => {
      window.removeEventListener("wallet-transaction-added", handleTransactionAdded);
    };
  }, []);

  const handleDeleteTx = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    try {
      await deleteWalletTransaction(id);
      toast.success("Transaksi berhasil dihapus.");
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus transaksi.");
    }
  };

  const handleSyncRecurring = async () => {
    setIsSyncing(true);
    try {
      const count = await syncRecurringExpensesForMonth(getCurrentMonth());
      toast.success(`${count} tagihan rutin berhasil diproses.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi tagihan rutin.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(recAmount.replace(/[^0-9]/g, ""));
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tagihan tidak valid.");
    if (!recCategoryId) return toast.error("Kategori wajib dipilih.");

    setIsSavingRecurring(true);
    try {
      await createRecurringExpense({
        category_id: recCategoryId,
        amount,
        frequency: recFrequency,
        day_of_month: recFrequency === "monthly" ? parseInt(recDayOfMonth) : null,
        start_date: recStartDate,
        note: recNote,
        is_active: true
      });
      toast.success("Tagihan rutin berhasil dibuat.");
      setShowAddRecurring(false);
      setRecAmount("");
      setRecNote("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan tagihan rutin.");
    } finally {
      setIsSavingRecurring(false);
    }
  };

  const handleDeleteRecurring = async (id: string | number) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan tagihan rutin ini?")) return;
    try {
      await deleteRecurringExpense(id);
      toast.success("Tagihan rutin dinonaktifkan.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menonaktifkan.");
    }
  };

  const handleExportICS = () => {
    if (recurring.length === 0) return toast.error("Tidak ada tagihan rutin untuk diexport.");
    const count = exportAllRecurringToICS(recurring);
    toast.success(`${count} event tagihan diexport ke file .ics`);
  };

  const handleGoogleCalendarUrl = (item: any) => {
    const ev = recurringToCalendarEvent(item);
    const url = getGoogleCalendarUrl(ev);
    window.open(url, "_blank");
  };

  // Group transactions by date
  const filteredTxs = transactions.filter((t) => {
    // Filter out future calendar dates
    if (t.occurred_at) {
      const txDate = new Date(t.occurred_at);
      const now = new Date();
      const getLocalDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };
      const todayStr = getLocalDateStr(now);
      const txDateStr = getLocalDateStr(txDate);
      if (txDateStr > todayStr) {
        return false; // exclude future days
      }
    }

    if (selectedCategoryFilter && t.category !== selectedCategoryFilter) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.note?.toLowerCase().includes(q) ||
      t.merchant?.toLowerCase().includes(q) ||
      t.source?.toLowerCase().includes(q)
    );
  });

  const getLocalDateStrFromISO = (isoStr: string) => {
    const d = new Date(isoStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const groupedTxs: Record<string, WalletTransaction[]> = {};
  filteredTxs.forEach((tx) => {
    const d = tx.occurred_at ? getLocalDateStrFromISO(tx.occurred_at) : getLocalDateStrFromISO(new Date().toISOString());
    if (!groupedTxs[d]) groupedTxs[d] = [];
    groupedTxs[d].push(tx);
  });

  const sortedDates = Object.keys(groupedTxs).sort((a, b) => b.localeCompare(a));

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const date = parseInt(parts[2]);
    const d = new Date(year, month, date);
    
    const getLocalDateStr = (dateObj: Date) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const todayStr = getLocalDateStr(new Date());
    const yesterdayStr = getLocalDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    if (dateStr === todayStr) return "Hari Ini";
    if (dateStr === yesterdayStr) return "Kemarin";
    
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#29B9AA] border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-[#7B6E67]">Memuat Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      
      {/* Title & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA] leading-none">Buku Kas</p>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-[#1A2B38]">Ledger & Tagihan</h1>
        </div>

        <div className="flex rounded-2xl bg-[#F3EDE8] p-1 shadow-inner self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "all" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Semua Transaksi
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "recurring" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <Repeat2 className="w-3.5 h-3.5" />
            Tagihan Rutin
          </button>
          <button
            onClick={() => onNavigateTab?.("income")}
            className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 text-[#7B6E67] hover:text-[#1A2B38] shrink-0"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#29B9AA]" />
            Sumber Pemasukan
          </button>
        </div>
      </div>

      {activeTab === "all" ? (
        // ── ALL TRANSACTIONS TAB ──────────────────────────────
        <div className="space-y-4">
          
          {/* Filters & Search */}
          <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 text-[#7B6E67] shrink-0" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan catatan atau merchant..."
              className="flex-1 bg-transparent text-sm font-medium text-[#1A2B38] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Category Filter Dropdown */}
            <div className="relative shrink-0" ref={filterDropdownRef}>
              <button 
                type="button"
                onClick={() => setShowCategoryFilterDropdown(!showCategoryFilterDropdown)}
                className={`flex items-center gap-1.5 rounded-xl border border-black/5 px-2.5 py-1.5 text-xs font-bold transition-all ${
                  selectedCategoryFilter 
                    ? "bg-[#29B9AA]/10 text-[#29B9AA] border-[#29B9AA]/20" 
                    : "bg-[#FEF9F4] text-[#7B6E67] hover:bg-[#F3EDE8]"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{selectedCategoryFilter || "Filter Kategori"}</span>
              </button>

              {showCategoryFilterDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-48 max-h-60 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter("");
                      setShowCategoryFilterDropdown(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                      selectedCategoryFilter === "" ? "bg-[#29B9AA] text-white" : "text-[#1A2B38] hover:bg-[#FEF9F4]"
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryFilter(c.name);
                        setShowCategoryFilterDropdown(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                        selectedCategoryFilter === c.name ? "bg-[#29B9AA] text-white" : "text-[#1A2B38] hover:bg-[#FEF9F4]"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(searchQuery || selectedCategoryFilter) && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryFilter("");
                }} 
                className="text-[#7B6E67] hover:text-[#1A2B38] border-l border-black/5 pl-2 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Grouped lists */}
          {sortedDates.length === 0 ? (
            <div className="rounded-[32px] border border-black/10 bg-white p-12 text-center">
              <p className="text-sm font-semibold text-[#7B6E67]">Tidak ditemukan histori transaksi.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B6E67] px-2">
                    {formatDateLabel(dateStr)}
                  </h3>
                  
                  <div className="space-y-3">
                    {groupedTxs[dateStr].map((tx) => {
                      const isExpense = tx.direction === "out";
                      
                      // Extract package name and actual notification text from raw_text
                      let appFriendlyName = "";
                      let displayRawText = tx.raw_text || "";
                      if (tx.source === "notification" && tx.raw_text) {
                        const pipeIdx = tx.raw_text.indexOf("|");
                        if (pipeIdx !== -1) {
                          const pkg = tx.raw_text.slice(0, pipeIdx);
                          displayRawText = tx.raw_text.slice(pipeIdx + 1);
                          appFriendlyName = getAppFriendlyName(pkg);
                        }
                      }

                      return (
                        <div 
                          key={tx.id}
                          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:bg-[#FEF9F4]/30 transition-all"
                        >
                          {/* Top Row: Icon, Merchant/Title, and Amount */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Direction Icon */}
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                isExpense ? "bg-rose-50 text-[#FF6B58]" : "bg-emerald-50 text-[#29B9AA]"
                              }`}>
                                {isExpense ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#1A2B38] truncate">
                                  {tx.source === "notification" 
                                    ? (tx.merchant || "Notifikasi Otomatis")
                                    : (tx.note || "Transaksi Manual")
                                  }
                                </h4>
                                <p className="text-[10px] text-[#7B6E67] font-semibold uppercase tracking-wider mt-0.5">
                                  {tx.source} {appFriendlyName ? `· ${appFriendlyName}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <p className={`text-sm font-extrabold ${isExpense ? "text-[#FF6B58]" : "text-[#29B9AA]"}`}>
                                {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
                              </p>
                            </div>
                          </div>

                          {/* Middle Row: Raw notification text preview (if source is notification) */}
                          {tx.source === "notification" && displayRawText && (
                            <div className="rounded-xl bg-[#FEF9F4] p-3 text-xs border border-black/5">
                              <p className="font-semibold text-[#7B6E67] mb-1 text-[10px] uppercase tracking-wider">Detail Notifikasi:</p>
                              <p className="text-[#1A2B38] leading-relaxed italic">
                                "{displayRawText}"
                              </p>
                            </div>
                          )}

                          {/* Editable Note/Description Section */}
                          <div className="text-xs text-[#7B6E67] border-t border-black/5 pt-2 mt-1">
                            {editingNoteId === tx.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  className="flex-1 rounded-xl border border-black/10 px-3 py-1.5 text-xs text-[#1A2B38] outline-none focus:border-[#29B9AA] bg-white font-medium"
                                  value={tempNote}
                                  onChange={(e) => setTempNote(e.target.value)}
                                  placeholder="Tambahkan catatan..."
                                  autoFocus
                                />
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateWalletTransaction(tx.id, { note: tempNote || null });
                                      toast.success("Catatan berhasil diperbarui.");
                                      setTransactions((prev) => 
                                        prev.map((t) => t.id === tx.id ? { ...t, note: tempNote || null } : t)
                                      );
                                      setEditingNoteId(null);
                                    } catch (err) {
                                      toast.error("Gagal menyimpan catatan.");
                                    }
                                  }}
                                  className="rounded-xl bg-[#29B9AA] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#229A8E] flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="rounded-xl border border-black/5 bg-[#FEF9F4] px-3 py-1.5 text-xs font-bold text-[#7B6E67] hover:bg-[#F3EDE8] flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-[10px] uppercase tracking-wider">Catatan:</span>
                                <span className="text-[#1A2B38] font-medium">
                                  {tx.note || <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(tx.id);
                                    setTempNote(tx.note || "");
                                  }}
                                  className="text-[#29B9AA] hover:underline font-bold text-[10px] uppercase tracking-wider ml-1"
                                >
                                  [ Edit ]
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Bottom Row: Category Selector & Actions */}
                          <div className="flex items-center justify-between border-t border-black/5 pt-2.5 mt-1">
                            {/* Category Pill Selector (Custom overlay dropdown) */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Kategori:</span>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenCategoryTxId(openCategoryTxId === tx.id ? null : tx.id)}
                                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all flex items-center gap-1 focus:outline-none ${
                                    tx.category 
                                      ? "bg-[#29B9AA]/10 text-[#29B9AA] hover:bg-[#29B9AA]/20" 
                                      : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-dashed border-amber-300"
                                  }`}
                                >
                                  <span>{tx.category || "+ Pilih Kategori"}</span>
                                  <svg className={`h-3 w-3 fill-current transition-transform duration-200 ${openCategoryTxId === tx.id ? "rotate-180" : ""}`} viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                  </svg>
                                </button>

                                {openCategoryTxId === tx.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setOpenCategoryTxId(null)}
                                    />
                                    <div className="absolute left-0 z-50 mt-1 w-44 max-h-48 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await updateWalletTransaction(tx.id, { category: null });
                                            toast.success("Kategori transaksi dikosongkan.");
                                            setTransactions((prev) => 
                                              prev.map((t) => t.id === tx.id ? { ...t, category: null } : t)
                                            );
                                          } catch (err: any) {
                                            toast.error("Gagal mengubah kategori.");
                                          } finally {
                                            setOpenCategoryTxId(null);
                                          }
                                        }}
                                        className={`w-full rounded-xl px-3 py-1.5 text-left text-xs font-bold whitespace-nowrap transition-colors ${
                                          !tx.category ? "bg-[#29B9AA] text-white" : "text-[#7B6E67] hover:bg-[#FEF9F4]"
                                        }`}
                                      >
                                        — Tanpa Kategori —
                                      </button>
                                      {categories.map((c) => (
                                        <button
                                          key={c.id}
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await updateWalletTransaction(tx.id, { category: c.name });
                                              toast.success("Kategori transaksi berhasil diubah.");
                                              setTransactions((prev) => 
                                                prev.map((t) => t.id === tx.id ? { ...t, category: c.name } : t)
                                              );
                                            } catch (err: any) {
                                              toast.error("Gagal mengubah kategori.");
                                            } finally {
                                              setOpenCategoryTxId(null);
                                            }
                                          }}
                                          className={`w-full rounded-xl px-3 py-1.5 text-left text-xs font-bold whitespace-nowrap transition-colors ${
                                            tx.category === c.name ? "bg-[#29B9AA] text-white" : "text-[#1A2B38] hover:bg-[#FEF9F4]"
                                          }`}
                                        >
                                          {c.name}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button 
                              onClick={() => handleDeleteTx(tx.id)}
                              className="flex items-center gap-1 rounded-xl p-1.5 text-[#7B6E67]/50 hover:bg-rose-50 hover:text-[#FF6B58] transition-colors text-xs font-bold"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── RECURRING BILLS TAB ───────────────────────────────
        <div className="grid gap-6 md:grid-cols-3">
          
          <div className="md:col-span-2 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white px-5 py-3.5 shadow-sm">
              <span className="text-xs font-bold text-[#7B6E67]">
                {recurring.length} Tagihan Terdaftar
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSyncRecurring}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-[#FEF9F4] px-3.5 py-2 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  Sinkronisasi
                </button>

                <button
                  onClick={handleExportICS}
                  className="flex items-center gap-1.5 rounded-xl bg-[#29B9AA] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#229A8E]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export .ics
                </button>
              </div>
            </div>

            {/* List */}
            {recurring.length === 0 ? (
              <div className="rounded-[32px] border border-black/10 bg-white p-12 text-center">
                <p className="text-sm font-semibold text-[#7B6E67]">Tidak ditemukan tagihan rutin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recurring.map((item) => (
                  <div 
                    key={item.id}
                    className="flex flex-col justify-between rounded-[24px] border border-black/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEF9F4] border border-black/5 text-[#FFB347]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A2B38]">
                          {item.budget_categories?.name || "Tagihan"}
                        </h4>
                        <p className="text-xs text-[#7B6E67] font-medium mt-0.5 capitalize">
                          Setiap {item.frequency === "monthly" ? `Tanggal ${item.day_of_month}` : item.frequency} · {item.note || "Tanpa catatan"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 sm:mt-0 sm:border-0 sm:pt-0 gap-4">
                      <p className="text-sm font-extrabold text-[#1A2B38]">
                        {formatCurrency(item.amount)}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGoogleCalendarUrl(item)}
                          className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-[#FEF9F4] px-2.5 py-1.5 text-[10px] font-bold text-[#7B6E67] hover:text-[#1A2B38]"
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="h-3 w-3" />
                          GCal
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRecurring(item.id)}
                          className="rounded-xl p-1.5 text-[#7B6E67]/50 hover:bg-rose-50 hover:text-[#FF6B58] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Create Sidebar */}
          <div className="md:col-span-1">
            {showAddRecurring ? (
              <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Buat Tagihan</h3>
                  <button onClick={() => setShowAddRecurring(false)} className="rounded-full p-1.5 hover:bg-[#FEF9F4] text-[#7B6E67]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateRecurring} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Kategori</label>
                    <Dropdown
                      options={categories.map((c) => ({ value: c.id.toString(), label: c.name }))}
                      value={recCategoryId}
                      onChange={setRecCategoryId}
                      placeholder="Pilih Kategori"
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Nominal (Rp)</label>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                      value={recAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setRecAmount(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                      }}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Frekuensi</label>
                    <Dropdown
                      options={[
                        { value: "daily", label: "Daily (Harian)" },
                        { value: "weekly", label: "Weekly (Mingguan)" },
                        { value: "monthly", label: "Monthly (Bulanan)" },
                      ]}
                      value={recFrequency}
                      onChange={(val) => setRecFrequency(val as any)}
                      placeholder="Pilih Frekuensi"
                      icon={<Repeat2 className="h-4 w-4" />}
                    />
                  </div>

                  {recFrequency === "monthly" && (
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Tanggal Tagihan (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                        value={recDayOfMonth}
                        onChange={(e) => setRecDayOfMonth(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Tanggal Mulai</label>
                    <div className="relative w-full">
                      <div className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#FEF9F4] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1A2B38] transition-colors text-left relative cursor-pointer hover:bg-[#F3EDE8]">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B6E67]">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <span>
                          {recStartDate ? new Date(recStartDate).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "Pilih Tanggal"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-[#7B6E67]" />
                      </div>
                      <input
                        type="date"
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={recStartDate}
                        onChange={(e) => setRecStartDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) {}
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Catatan</label>
                    <input
                      type="text"
                      placeholder="Bayar Wifi Indihome..."
                      className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                      value={recNote}
                      onChange={(e) => setRecNote(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingRecurring}
                    className="w-full rounded-2xl bg-[#29B9AA] py-3 text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingRecurring ? (
                      "Menyimpan..."
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Simpan Tagihan
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddRecurring(true)}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-black/10 bg-[#FEF9F4]/40 hover:bg-[#FEF9F4] px-6 py-12 text-center"
              >
                <Plus className="h-6 w-6 text-[#29B9AA]" />
                <span className="text-xs font-bold text-[#1A2B38]">Buat Tagihan Rutin</span>
                <span className="text-[10px] text-[#7B6E67]">Daftarkan biaya langganan, sewa, tagihan listrik, dll.</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
