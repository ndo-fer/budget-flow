import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  SlidersHorizontal,
  X,
  Check,
  Edit,
  Repeat2,
  CalendarPlus,
  Download,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Layers,
  ArrowDownLeft,
  Calendar
} from "lucide-react";
import { T, font } from "./tokens";
import { PreviewData, getCatColor, rp, fmtDate, groupByDay, fmtMonth, offsetMonth } from "./usePreviewData";

// Services
import { deleteExpense } from "../../services/expenseService";
import { deleteIncomeTransaction, deleteIncomeSource } from "../../services/incomeService";
import { updateWalletTransaction } from "../../services/walletTransactionService";
import { deleteRecurringExpense, syncRecurringExpensesForMonth } from "../../services/recurringService";
import { exportAllRecurringToICS, getGoogleCalendarUrl, recurringToCalendarEvent } from "../../services/calendarService";
import { getAppFriendlyName } from "../../services/notificationParserService";
import { toast } from "../../utils/toast";

// Modals
import RecurringExpenseModal from "../../components/modals/RecurringExpenseModal";
import IncomeSourceModal from "../../components/modals/IncomeSourceModal";
import IncomeTransactionModal from "../../components/modals/IncomeTransactionModal";

const card = (extra?: object) => ({
  background: T.surface,
  borderRadius: T.r.card,
  border: `1px solid ${T.border}`,
  boxShadow: T.inset,
  ...extra,
});

const Skeleton = ({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: T.border, animation: "pulse 1.5s ease-in-out infinite" }} />
);

type SubTab = "all" | "recurring" | "income_sources";
type FilterType = "all" | "expense" | "income";

interface LedgerScreenProps {
  month: string;
  onMonthChange: (m: string) => void;
  onRefresh: () => void;
  previewData: PreviewData;
}

export default function LedgerScreen({ month, onMonthChange, onRefresh, previewData }: LedgerScreenProps) {
  const {
    expenses,
    incomeTransactions,
    incomeSources,
    incomeBySource,
    recurringExpenses,
    categories,
    summary,
    loading
  } = previewData;

  const [subTab, setSubTab] = useState<SubTab>("all");

  // "Semua Transaksi" tab states
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [showCatFilterDropdown, setShowCatFilterDropdown] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline edit note states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  // Inline edit category states
  const [openCategoryTxId, setOpenCategoryTxId] = useState<string | null>(null);

  // "Tagihan Rutin" tab states
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any | null>(null);

  // "Sumber Pemasukan" tab states
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [showIncomeTxModal, setShowIncomeTxModal] = useState(false);
  const [selectedIncomeTx, setSelectedIncomeTx] = useState<any | null>(null);
  const [prefillSourceId, setPrefillSourceId] = useState<string | null>(null);

  // Pre-process all transactions
  const allTxs = [
    ...expenses.map(e => ({ ...e, kind: "expense" })),
    ...incomeTransactions.map(i => ({ ...i, kind: "income" })),
  ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  // Filter transactions
  const filteredTxs = allTxs.filter((tx) => {
    // 1. Kind filter
    if (filterType !== "all" && tx.kind !== filterType) return false;

    // 2. Category filter
    if (selectedCategoryFilter) {
      const txCatName = tx.kind === "income" ? "Pemasukan" : (tx.budget_categories?.name || tx.category);
      if (txCatName !== selectedCategoryFilter) return false;
    }

    // 3. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const noteMatch = tx.note?.toLowerCase().includes(q);
      const merchantMatch = tx.merchant?.toLowerCase().includes(q);
      const catMatch = (tx.budget_categories?.name || tx.category || "").toLowerCase().includes(q);
      const sourceMatch = tx.source?.toLowerCase().includes(q);
      return noteMatch || merchantMatch || catMatch || sourceMatch;
    }

    return true;
  });

  const groupedTxs = groupByDay(filteredTxs);

  // Handlers
  const handleDeleteTx = async (tx: any) => {
    if (!confirm(`Hapus transaksi "${tx.note || (tx.kind === "income" ? "Pemasukan" : "Pengeluaran")}"?`)) return;
    setDeletingId(tx.id);
    try {
      if (tx.kind === "income") {
        await deleteIncomeTransaction(tx.id);
      } else {
        await deleteExpense(tx.id);
      }
      toast.success("Transaksi berhasil dihapus.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus transaksi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveNote = async (txId: string, text: string) => {
    try {
      await updateWalletTransaction(txId, { note: text.trim() || null });
      toast.success("Catatan berhasil disimpan.");
      onRefresh();
      setEditingNoteId(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan catatan.");
    }
  };

  const handleUpdateCategory = async (txId: string, catId: string | null, catName: string | null) => {
    try {
      await updateWalletTransaction(txId, { category_id: catId, category: catName });
      toast.success("Kategori transaksi berhasil diperbarui.");
      onRefresh();
      setOpenCategoryTxId(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui kategori.");
    }
  };

  const handleSyncRecurring = async () => {
    setIsSyncing(true);
    try {
      const count = await syncRecurringExpensesForMonth(month);
      toast.success(`${count} tagihan rutin berhasil diproses.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi tagihan rutin.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRecurring = async (id: string | number) => {
    if (!confirm("Nonaktifkan tagihan rutin ini?")) return;
    try {
      await deleteRecurringExpense(id);
      toast.success("Tagihan rutin berhasil dinonaktifkan.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menonaktifkan tagihan rutin.");
    }
  };

  const handleDeleteSource = async (id: string | number) => {
    if (!confirm("Nonaktifkan sumber pemasukan ini?")) return;
    try {
      await deleteIncomeSource(id);
      toast.success("Sumber pemasukan berhasil dinonaktifkan.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menonaktifkan.");
    }
  };

  const handleExportICS = () => {
    if (recurringExpenses.length === 0) {
      toast.error("Tidak ada tagihan rutin untuk diexport.");
      return;
    }
    const count = exportAllRecurringToICS(recurringExpenses);
    toast.success(`${count} event tagihan diexport ke file .ics`);
  };

  const handleGoogleCalendarUrl = (item: any) => {
    const ev = recurringToCalendarEvent(item);
    const url = getGoogleCalendarUrl(ev);
    window.open(url, "_blank");
  };

  // Calculate stats for recurring bills
  const totalRecurringMonthly = recurringExpenses
    .filter((r: any) => r.frequency === "monthly")
    .reduce((sum: number, r: any) => sum + r.amount, 0);

  const isCurrentMonth = month === new Date().toISOString().slice(0, 7);

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .tab-btn {
          flex: 1; text-align: center; justify-content: center; display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 12px; cursor: pointer; border: none; transition: all 0.2s;
        }
      `}</style>

      {/* Month Navigator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", ...card(), padding: "12px 16px" }}>
        <button
          onClick={() => onMonthChange(offsetMonth(month, -1))}
          style={{ width: 36, height: 36, borderRadius: T.r.btn, border: `1px solid ${T.border}`, background: T.surface2, cursor: "pointer", color: T.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={T.iris} />
          <p style={font(14, 700, T.textPrimary)}>{fmtMonth(month)}</p>
        </div>
        <button
          onClick={() => onMonthChange(offsetMonth(month, +1))}
          disabled={isCurrentMonth}
          style={{ width: 36, height: 36, borderRadius: T.r.btn, border: `1px solid ${isCurrentMonth ? T.border + "40" : T.border}`, background: T.surface2, cursor: isCurrentMonth ? "not-allowed" : "pointer", color: isCurrentMonth ? T.textMuted : T.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", opacity: isCurrentMonth ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", background: T.surface2, padding: 4, borderRadius: 16, border: `1px solid ${T.border}` }}>
        <button
          onClick={() => setSubTab("all")}
          className="tab-btn"
          style={{
            background: subTab === "all" ? T.surface : "transparent",
            color: subTab === "all" ? T.textPrimary : T.textSecondary,
            boxShadow: subTab === "all" ? T.inset : "none",
          }}
        >
          <Clock size={14} />
          <span style={font(12, 600, subTab === "all" ? T.textPrimary : T.textSecondary)}>Semua Transaksi</span>
        </button>
        <button
          onClick={() => setSubTab("recurring")}
          className="tab-btn"
          style={{
            background: subTab === "recurring" ? T.surface : "transparent",
            color: subTab === "recurring" ? T.textPrimary : T.textSecondary,
            boxShadow: subTab === "recurring" ? T.inset : "none",
          }}
        >
          <Repeat2 size={14} />
          <span style={font(12, 600, subTab === "recurring" ? T.textPrimary : T.textSecondary)}>Tagihan Rutin</span>
        </button>
        <button
          onClick={() => setSubTab("income_sources")}
          className="tab-btn"
          style={{
            background: subTab === "income_sources" ? T.surface : "transparent",
            color: subTab === "income_sources" ? T.textPrimary : T.textSecondary,
            boxShadow: subTab === "income_sources" ? T.inset : "none",
          }}
        >
          <ArrowUpRight size={14} color={T.teal} />
          <span style={font(12, 600, subTab === "income_sources" ? T.textPrimary : T.textSecondary)}>Sumber Pemasukan</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. SEMUA TRANSAKSI SUB-TAB */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {subTab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary chips */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Total Masuk", val: summary.totalIncome, color: T.teal, icon: TrendingUp },
              { label: "Total Keluar", val: summary.totalExpenses, color: T.crimson, icon: TrendingDown },
              { label: "Selisih", val: summary.savings, color: summary.savings >= 0 ? T.teal : T.crimson, icon: summary.savings >= 0 ? TrendingUp : TrendingDown },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} style={{ ...card(), padding: "14px 12px", textAlign: "center" as any }}>
                <Icon size={14} color={color} style={{ margin: "0 auto 6px" }} />
                <p style={font(9, 700, T.textLabel, { letterSpacing: "0.1em", textTransform: "uppercase" as any, marginBottom: 4 })}>{label}</p>
                {loading
                  ? <Skeleton w="70%" h={12} />
                  : <p style={font(11, 700, color, { lineHeight: 1.2 })}>{val >= 0 ? "+" : ""}{rp(val)}</p>
                }
              </div>
            ))}
          </div>

          {/* Search, Filter pill and Dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", ...card(), padding: "6px 12px", background: T.surface2 }}>
              <Search size={14} color={T.textSecondary} />
              <input
                type="text"
                placeholder="Cari catatan, merchant, kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: T.textPrimary, ...font(12, 500, T.textPrimary) }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textSecondary }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {/* Type pills */}
              {([
                { id: "all", label: "Semua" },
                { id: "expense", label: "Pengeluaran" },
                { id: "income", label: "Pemasukan" }
              ] as const).map(({ id, label }) => (
                <button key={id} onClick={() => setFilterType(id)} style={{
                  padding: "6px 14px", borderRadius: T.r.chip, cursor: "pointer", border: "none",
                  background: filterType === id ? T.iris : T.surface2,
                  boxShadow: filterType === id ? `0 0 0 1px ${T.iris}` : `0 0 0 1px ${T.border}`,
                  whiteSpace: "nowrap", flexShrink: 0
                }}>
                  <span style={font(10, 600, filterType === id ? "#fff" : T.textSecondary)}>{label}</span>
                </button>
              ))}

              {/* Category Filter Dropdown button */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowCatFilterDropdown(!showCatFilterDropdown)}
                  style={{
                    padding: "6px 14px", borderRadius: T.r.chip, cursor: "pointer", border: "none",
                    background: selectedCategoryFilter ? `${T.iris}20` : T.surface2,
                    boxShadow: `0 0 0 1px ${selectedCategoryFilter ? T.iris : T.border}`,
                    display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
                  }}
                >
                  <SlidersHorizontal size={11} color={selectedCategoryFilter ? T.iris : T.textSecondary} />
                  <span style={font(10, 600, selectedCategoryFilter ? T.iris : T.textSecondary)}>
                    {selectedCategoryFilter || "Filter Kategori"}
                  </span>
                </button>

                {showCatFilterDropdown && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowCatFilterDropdown(false)} />
                    <div style={{
                      position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 101,
                      width: 180, maxHeight: 200, overflowY: "auto", background: T.surface,
                      borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                      padding: 6, display: "flex", flexDirection: "column", gap: 2
                    }}>
                      <button
                        onClick={() => { setSelectedCategoryFilter(""); setShowCatFilterDropdown(false); }}
                        style={{ padding: "8px 12px", border: "none", cursor: "pointer", background: !selectedCategoryFilter ? T.surface2 : "transparent", color: T.textPrimary, borderRadius: 8, textAlign: "left", ...font(11, 600, T.textPrimary) }}
                      >
                        Semua Kategori
                      </button>
                      <button
                        onClick={() => { setSelectedCategoryFilter("Pemasukan"); setShowCatFilterDropdown(false); }}
                        style={{ padding: "8px 12px", border: "none", cursor: "pointer", background: selectedCategoryFilter === "Pemasukan" ? T.surface2 : "transparent", color: T.teal, borderRadius: 8, textAlign: "left", ...font(11, 600, T.teal) }}
                      >
                        Pemasukan
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCategoryFilter(c.name); setShowCatFilterDropdown(false); }}
                          style={{ padding: "8px 12px", border: "none", cursor: "pointer", background: selectedCategoryFilter === c.name ? T.surface2 : "transparent", color: T.textPrimary, borderRadius: 8, textAlign: "left", ...font(11, 600, T.textPrimary) }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Grouped List */}
          {loading ? (
            [1, 2].map(i => (
              <div key={i}>
                <Skeleton w={80} h={10} r={4} />
                <div style={{ ...card(), padding: "14px 20px", marginTop: 10 }}><Skeleton w="70%" h={14} /></div>
              </div>
            ))
          ) : filteredTxs.length === 0 ? (
            <div style={{ ...card(), padding: 40, textAlign: "center" as any }}>
              <p style={font(14, 600, T.textMuted)}>Tidak ada transaksi ditemukan</p>
              <p style={font(12, 400, T.textMuted, { marginTop: 6 })}>
                Coba ubah filter atau lakukan pencarian lain
              </p>
            </div>
          ) : (
            groupedTxs.map(({ title, txs }) => (
              <div key={title} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Clock size={12} color={T.textMuted} />
                  <p style={font(10, 800, T.textMuted, { letterSpacing: "0.12em", textTransform: "uppercase" as any })}>{title}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {txs.map((tx, idx) => {
                    const isIncome = tx.kind === "income";
                    const catIdx = categories.findIndex(c => c.id === tx.category_id);
                    const c = isIncome
                      ? { fill: T.teal, bg: `${T.teal}18`, border: `${T.teal}30` }
                      : getCatColor(catIdx >= 0 ? catIdx : idx, tx.budget_categories?.color);
                    const label = isIncome
                      ? (tx.income_sources?.source_name || "Pemasukan")
                      : (tx.budget_categories?.name || tx.category || "Pengeluaran");
                    const isDeleting = deletingId === tx.id;

                    // Parse notification source
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
                        style={{
                          ...card(), padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12,
                          opacity: isDeleting ? 0.4 : 1, transition: "all 0.2s"
                        }}
                      >
                        {/* Upper row: icon, name, source, and amount */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: T.r.icon, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isIncome ? <ArrowUpRight size={18} color={c.fill} /> : <ArrowDownLeft size={18} color={c.fill} />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={font(14, 700, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any, marginBottom: 2 })}>
                              {tx.source === "notification" ? (tx.merchant || "Notifikasi Otomatis") : (tx.note || "Transaksi Manual")}
                            </p>
                            <p style={font(10, 600, T.textSecondary, { textTransform: "uppercase" as any, letterSpacing: "0.05em" })}>
                              {tx.source} {appFriendlyName ? `• ${appFriendlyName}` : ""} • {fmtDate(tx.occurred_at)}
                            </p>
                          </div>

                          <p style={font(15, 800, isIncome ? T.teal : T.textPrimary)}>
                            {isIncome ? "+" : "-"}{rp(tx.amount)}
                          </p>
                        </div>

                        {/* Notification raw quote if applicable */}
                        {tx.source === "notification" && displayRawText && (
                          <div style={{ background: T.surface2, borderLeft: `2px solid ${T.iris}`, padding: "8px 12px", borderRadius: 8, margin: "2px 0" }}>
                            <p style={font(9, 700, T.textLabel, { letterSpacing: "0.08em", textTransform: "uppercase" as any, marginBottom: 4 })}>Detail Notifikasi:</p>
                            <p style={font(11, 400, T.textSecondary, { fontStyle: "italic", lineHeight: 1.4 })}>"{displayRawText}"</p>
                          </div>
                        )}

                        {/* Editable note section */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${T.border}60`, paddingTop: 10 }}>
                          {editingNoteId === tx.id ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                type="text"
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                style={{
                                  flex: 1, background: T.surface2, border: `1px solid ${T.border}`,
                                  borderRadius: 8, padding: "6px 12px", color: T.textPrimary,
                                  outline: "none", ...font(12, 500, T.textPrimary)
                                }}
                                placeholder="Tulis catatan..."
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNote(tx.id, tempNote)}
                                style={{ border: "none", background: T.iris, color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <Check size={12} />
                                <span style={font(11, 700, "#fff")}>Simpan</span>
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                style={{ border: `1px solid ${T.border}`, background: T.surface2, color: T.textSecondary, padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <X size={12} />
                                <span style={font(11, 700, T.textSecondary)}>Batal</span>
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={font(10, 700, T.textLabel, { textTransform: "uppercase" as any, letterSpacing: "0.08em" })}>Catatan:</span>
                              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...font(12, 500, tx.note ? T.textPrimary : T.textMuted, { fontStyle: tx.note ? "normal" : "italic" }) }}>
                                {tx.note || "Tidak ada catatan"}
                              </span>
                              <button
                                onClick={() => { setEditingNoteId(tx.id); setTempNote(tx.note || ""); }}
                                style={{ border: "none", background: "transparent", cursor: "pointer", ...font(10, 700, T.iris, { textTransform: "uppercase" as any, letterSpacing: "0.05em" }) }}
                              >
                                [ Edit ]
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Category selection & delete action */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.border}30`, paddingTop: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={font(10, 700, T.textLabel, { textTransform: "uppercase" as any, letterSpacing: "0.08em" })}>Kategori:</span>
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={() => setOpenCategoryTxId(openCategoryTxId === tx.id ? null : tx.id)}
                                style={{
                                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: 30,
                                  padding: "3px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}
                              >
                                <span style={font(10, 800, c.fill)}>{label}</span>
                                <span style={font(8, 700, c.fill)}>▼</span>
                              </button>

                              {openCategoryTxId === tx.id && (
                                <>
                                  <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setOpenCategoryTxId(null)} />
                                  <div style={{
                                    position: "absolute", left: 0, top: "calc(100% + 4px)", zIndex: 101,
                                    width: 160, maxHeight: 180, overflowY: "auto", background: T.surface,
                                    borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                    padding: 6, display: "flex", flexDirection: "column", gap: 2
                                  }}>
                                    <button
                                      onClick={() => handleUpdateCategory(tx.id, null, null)}
                                      style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: "transparent", color: T.textMuted, borderRadius: 8, textAlign: "left", ...font(10, 700, T.textMuted) }}
                                    >
                                      — Tanpa Kategori —
                                    </button>
                                    {categories.map((cat, i) => {
                                      const isSel = tx.category_id === cat.id;
                                      return (
                                        <button
                                          key={cat.id}
                                          onClick={() => handleUpdateCategory(tx.id, cat.id, cat.name)}
                                          style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: isSel ? T.surface2 : "transparent", color: T.textPrimary, borderRadius: 8, textAlign: "left", ...font(10, 700, T.textPrimary) }}
                                        >
                                          {cat.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTx(tx)}
                            style={{
                              border: "none", background: "transparent", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4, opacity: 0.7
                            }}
                          >
                            <Trash2 size={13} color={T.crimson} />
                            <span style={font(11, 700, T.crimson)}>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. TAGIHAN RUTIN SUB-TAB */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {subTab === "recurring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary Card */}
          <div style={{ ...card(), background: "linear-gradient(135deg, #2b0e14 0%, #15060b 60%, #3a001a 100%)", padding: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: `${T.crimson}15`, filter: "blur(40px)" }} />
            <p style={font(10, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 8 })}>Estimasi Bulanan Rutin</p>
            {loading ? <Skeleton w="50%" h={32} /> : (
              <p style={font(28, 700, T.crimson, { letterSpacing: "-0.5px" })}>{rp(totalRecurringMonthly)}</p>
            )}
            <p style={font(12, 500, T.textSecondary, { marginTop: 6 })}>{recurringExpenses.length} tagihan aktif bulan ini</p>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => { setSelectedRecurring(null); setShowRecurringModal(true); }}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 12, border: "none", background: T.iris,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
            >
              <Plus size={14} color="#fff" />
              <span style={font(12, 700, "#fff")}>Tambah Tagihan</span>
            </button>

            <button
              onClick={handleSyncRecurring}
              disabled={isSyncing}
              style={{
                padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
                cursor: isSyncing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: isSyncing ? 0.6 : 1
              }}
            >
              <RefreshCw size={14} color={T.textPrimary} className={isSyncing ? "animate-spin" : ""} />
              <span style={font(12, 700, T.textPrimary)}>Sync Bulan Ini</span>
            </button>

            <button
              onClick={handleExportICS}
              style={{
                padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6
              }}
            >
              <Download size={14} color={T.textSecondary} />
              <span style={font(12, 700, T.textSecondary)}>Export .ics</span>
            </button>
          </div>

          {/* List of Recurring Expenses */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map(i => <Skeleton key={i} w="100%" h={80} r={16} />)}
            </div>
          ) : recurringExpenses.length === 0 ? (
            <div style={{ ...card(), padding: 40, textAlign: "center" as any }}>
              <p style={font(14, 600, T.textMuted)}>Belum ada tagihan rutin</p>
              <p style={font(12, 400, T.textMuted, { marginTop: 6 })}>
                Klik "Tambah Tagihan" untuk mendaftarkan pengeluaran rutin Anda
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recurringExpenses.map((item: any, i: number) => {
                const catIdx = categories.findIndex(c => c.id === item.category_id);
                const c = getCatColor(catIdx >= 0 ? catIdx : i, item.budget_categories?.color);
                const cycleText = item.frequency === "monthly"
                  ? `Setiap tanggal ${item.day_of_month || 1}`
                  : item.frequency === "weekly"
                    ? "Setiap minggu"
                    : "Setiap hari";

                return (
                  <div key={item.id} style={{ ...card(), padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: T.r.icon, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Repeat2 size={16} color={c.fill} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={font(13, 700, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any })}>
                          {item.note || item.budget_categories?.name || "Tagihan"}
                        </p>
                        <p style={font(11, 500, T.textSecondary, { marginTop: 2 })}>{cycleText} • Kategori: {item.budget_categories?.name || "Lainnya"}</p>
                      </div>
                      <p style={font(14, 800, T.crimson)}>{rp(item.amount)}</p>
                    </div>

                    <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${T.border}40`, paddingTop: 10, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleGoogleCalendarUrl(item)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: "none", background: `${T.sunbeam}15`,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        <CalendarPlus size={11} color={T.sunbeam} />
                        <span style={font(10, 700, T.sunbeam)}>Add GCal</span>
                      </button>

                      <button
                        onClick={() => { setSelectedRecurring(item); setShowRecurringModal(true); }}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: "none", background: `${T.iris}15`,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        <Edit size={11} color={T.iris} />
                        <span style={font(10, 700, T.iris)}>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRecurring(item.id)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: "none", background: `${T.crimson}15`,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        <Trash2 size={11} color={T.crimson} />
                        <span style={font(10, 700, T.crimson)}>Archive</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. SUMBER PEMASUKAN SUB-TAB */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {subTab === "income_sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Action Row */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setSelectedSource(null); setShowSourceModal(true); }}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 12, border: "none", background: T.iris,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
            >
              <Plus size={14} color="#fff" />
              <span style={font(12, 700, "#fff")}>Tambah Sumber</span>
            </button>

            <button
              onClick={() => { setSelectedIncomeTx(null); setPrefillSourceId(null); setShowIncomeTxModal(true); }}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 12, border: "none", background: `${T.teal}20`,
                boxShadow: `0 0 0 1px ${T.teal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
            >
              <TrendingUp size={14} color={T.teal} />
              <span style={font(12, 700, T.teal)}>Catat Pemasukan</span>
            </button>
          </div>

          {/* Section 1: Progress breakdown per source */}
          <div>
            <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" as any, marginBottom: 10 })}>Perkembangan Target Bulanan</p>
            {loading ? (
              <Skeleton w="100%" h={100} r={16} />
            ) : incomeBySource.length === 0 ? (
              <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(12, 500, T.textMuted)}>Belum ada data perkembangan target</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {incomeBySource.map((s: any) => {
                  const percent = s.plannedAmount > 0 ? Math.min((s.actualAmount / s.plannedAmount) * 100, 100) : 0;
                  return (
                    <div key={s.sourceId} style={{ ...card(), padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={font(13, 700, T.textPrimary)}>{s.sourceName}</p>
                          <p style={font(10, 600, T.textSecondary, { marginTop: 2 })}>Target: {rp(s.plannedAmount)} • Masuk: {rp(s.actualAmount)}</p>
                        </div>
                        <div style={{ textAlign: "right" as any }}>
                          <p style={font(13, 700, T.teal)}>{percent.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 10, background: T.border, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${percent}%`, background: T.teal, borderRadius: 10 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Active sources list */}
          <div>
            <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" as any, marginBottom: 10 })}>Daftar Sumber Aktif</p>
            {loading ? (
              <Skeleton w="100%" h={80} r={16} />
            ) : incomeSources.length === 0 ? (
              <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(12, 500, T.textMuted)}>Belum ada sumber pemasukan terdaftar</p></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {incomeSources.map((s: any) => (
                  <div key={s.id} style={{ ...card(), padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <p style={font(12, 700, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{s.source_name}</p>
                      <p style={font(11, 700, T.teal, { marginTop: 2 })}>{rp(s.amount)}</p>
                      <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>{s.frequency}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, borderTop: `1px solid ${T.border}30`, paddingTop: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { setSelectedSource(s); setShowSourceModal(true); }}
                        style={{ border: "none", background: "transparent", cursor: "pointer", ...font(10, 700, T.iris) }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        style={{ border: "none", background: "transparent", cursor: "pointer", ...font(10, 700, T.crimson) }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Recent Income Transactions */}
          <div>
            <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" as any, marginBottom: 10 })}>Transaksi Pemasukan Bulan Ini</p>
            {loading ? (
              <Skeleton w="100%" h={100} r={16} />
            ) : incomeTransactions.length === 0 ? (
              <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(12, 500, T.textMuted)}>Belum ada transaksi pemasukan bulan ini</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {incomeTransactions.map((tx: any) => (
                  <div key={tx.id} style={{ ...card(), padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={font(12, 700, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                        {tx.note || tx.income_sources?.source_name || "Pemasukan"}
                      </p>
                      <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>
                        {tx.income_sources?.source_name} • {fmtDate(tx.occurred_at)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <p style={font(13, 800, T.teal)}>+{rp(tx.amount)}</p>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => { setSelectedIncomeTx(tx); setShowIncomeTxModal(true); }}
                          style={{
                            width: 26, height: 26, borderRadius: "50%", border: `1px solid ${T.iris}30`, background: `${T.iris}12`,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                        >
                          <Edit size={11} color={T.iris} />
                        </button>
                        <button
                          onClick={() => handleDeleteTx(tx)}
                          style={{
                            width: 26, height: 26, borderRadius: "50%", border: `1px solid ${T.crimson}30`, background: `${T.crimson}12`,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                        >
                          <Trash2 size={11} color={T.crimson} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS RENDER ────────────────────────────────────── */}
      <RecurringExpenseModal
        open={showRecurringModal}
        recurring={selectedRecurring}
        categories={categories}
        onClose={() => setShowRecurringModal(false)}
        onSaved={onRefresh}
      />

      <IncomeSourceModal
        open={showSourceModal}
        source={selectedSource}
        onClose={() => setShowSourceModal(false)}
        onSaved={onRefresh}
      />

      <IncomeTransactionModal
        isOpen={showIncomeTxModal}
        transaction={selectedIncomeTx}
        selectedSourceId={prefillSourceId}
        onClose={() => setShowIncomeTxModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
