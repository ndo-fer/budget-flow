import { useEffect, useMemo, useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  PiggyBank, 
  ArrowDownCircle, 
  Target, 
  CheckCircle2, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  BarChart3,
  Pencil,
  Plus,
  PlusCircle,
  TrendingUp,
  Clock,
  Download,
  RefreshCw,
  ExternalLink,
  Trash2
} from "lucide-react";
import { toast } from "../../utils/toast";
import CategoryModal from "../../components/modals/CategoryModal";
import IncomeSourceModal from "../../components/modals/IncomeSourceModal";
import RecurringExpenseModal from "../../components/modals/RecurringExpenseModal";

import { getBudgetVsActual, getBudgetVsActualSummary, getSpendingRecommendations } from "../../services/comparisonService";
import { getIncomeSources } from "../../services/incomeService";
import { getRecurringExpenses, deleteRecurringExpense, syncRecurringExpensesForMonth } from "../../services/recurringService";
import { getCategories } from "../../services/categoryService";
import { exportAllRecurringToICS, getGoogleCalendarUrl, recurringToCalendarEvent } from "../../services/calendarService";

import { formatMonthLabel, getCurrentMonth, shiftMonth } from "../../utils/date";
import { formatCompactCurrency, formatCurrency } from "../../utils/format";

import FirstRunGuide from "../../components/FirstRunGuide";
import EmptyState from "../../components/EmptyState";

const formatFrequencySubtitle = (freq: string) => {
  if (!freq) return "";
  const f = freq.toLowerCase().replace("-", "_");
  if (f === "monthly") return "Pemasukan Bulanan";
  if (f === "weekly") return "Pemasukan Mingguan";
  if (f === "one_time" || f === "one-time") return "Pemasukan Sekali (Non-rutin)";
  return freq;
};

export default function BudgetScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [activeSubTab, setActiveSubTab] = useState<"categories" | "income" | "recurring">("categories");

  // Categories states
  const [comparison, setComparison] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Income sources states
  const [incomeSources, setIncomeSources] = useState<any[]>([]);
  const [showIncomeSourceModal, setShowIncomeSourceModal] = useState(false);
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<any>(null);

  // Recurring expenses states
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // General Categories for modals dropdown
  const [categories, setCategories] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [comparisonData, summaryData, recommendationData, sourceData, recsData, catsData] = await Promise.all([
        getBudgetVsActual(month),
        getBudgetVsActualSummary(month),
        getSpendingRecommendations(month),
        getIncomeSources(),
        getRecurringExpenses(),
        getCategories()
      ]);
      setComparison(comparisonData);
      setSummary(summaryData);
      setRecommendations(recommendationData);
      setIncomeSources(sourceData);
      setRecurringExpenses(recsData);
      setCategories(catsData.filter((c) => c.is_active));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data budget.");
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const handleSyncRecurring = async () => {
    setIsSyncing(true);
    try {
      const count = await syncRecurringExpensesForMonth(month);
      toast.success(`${count} tagihan rutin berhasil diproses.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi tagihan rutin.");
    } finally {
      setIsSyncing(false);
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
    if (recurringExpenses.length === 0) return toast.error("Tidak ada tagihan rutin untuk diexport.");
    const count = exportAllRecurringToICS(recurringExpenses);
    toast.success(`${count} event tagihan diexport ke file .ics`);
  };

  const handleGoogleCalendarUrl = (item: any) => {
    const ev = recurringToCalendarEvent(item);
    const url = getGoogleCalendarUrl(ev);
    window.open(url, "_blank");
  };

  const visibleRecommendations = useMemo(() => {
    if (showAllRecommendations || recommendations.length <= 4) return recommendations;
    return recommendations.slice(0, 4);
  }, [recommendations, showAllRecommendations]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      {/* Unified sub-tabs header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA] leading-none">Rencana Keuangan</p>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-[#1A2B38]">Rencana & Kategori</h1>
          <p className="mt-1.5 text-xs text-[#7B6E67]">Susun alokasi budget belanja, sumber pendapatan, dan tagihan wajib Anda.</p>
        </div>

        <div className="flex w-full rounded-2xl bg-[#F3EDE8] p-1 shadow-inner md:w-auto">
          <button
            data-tour-id="plan-category-tab"
            onClick={() => setActiveSubTab("categories")}
            className={`flex-1 md:flex-none py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 md:px-4 ${
              activeSubTab === "categories" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span className="hidden sm:inline">Anggaran Kategori</span>
            <span className="inline sm:hidden">Kategori</span>
          </button>
          <button
            data-tour-id="plan-income-tab"
            onClick={() => setActiveSubTab("income")}
            className={`flex-1 md:flex-none py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 md:px-4 ${
              activeSubTab === "income" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#29B9AA] shrink-0 hidden sm:inline" />
            <span className="hidden sm:inline">Sumber Pemasukan</span>
            <span className="inline sm:hidden">Pemasukan</span>
          </button>
          <button
            data-tour-id="plan-recurring-tab"
            onClick={() => setActiveSubTab("recurring")}
            className={`flex-1 md:flex-none py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 md:px-4 ${
              activeSubTab === "recurring" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#FFB347] shrink-0 hidden sm:inline" />
            <span className="hidden sm:inline">Tagihan Rutin</span>
            <span className="inline sm:hidden">Tagihan</span>
          </button>
        </div>
      </div>

      {/* Month Navigator (Only show on Kategori tab since it is month-specific) */}
      {activeSubTab === "categories" && (
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm">
          <button 
            onClick={() => setMonth((current) => shiftMonth(current, -1))} 
            className="rounded-full bg-[#F3EDE8] p-2 hover:bg-[#EADFD8] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-[#7B6E67]" />
          </button>
          <p className="text-sm font-bold text-[#1A2B38]">{formatMonthLabel(month)}</p>
          <button 
            onClick={() => setMonth((current) => shiftMonth(current, 1))} 
            className="rounded-full bg-[#F3EDE8] p-2 hover:bg-[#EADFD8] transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-[#7B6E67]" />
          </button>
        </div>
      )}

      {/* SUBTAB CONTENT 1: CATEGORY BUDGETS */}
      {activeSubTab === "categories" && (
        <div className="space-y-6">
          <FirstRunGuide
            guideKey="plan"
            title="Kelola Anggaran Kategori Belanja"
            description="Di sini Anda membandingkan alokasi anggaran belanja bulanan dengan total realisasi pengeluaran riil per kategori. Anda juga akan mendapatkan rekomendasi jika terjadi pengeluaran yang tidak sesuai dengan target."
          />

          {summary ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[#7B6E67]">
                    <PiggyBank className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                    <p className="text-xs">Total Budget</p>
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-[#1A2B38]">{formatCompactCurrency(summary.totalBudget)}</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[#7B6E67]">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-[#FF6B58] flex-shrink-0" />
                    <p className="text-xs">Total Realisasi</p>
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-[#FF6B58]">{formatCompactCurrency(summary.totalActual)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#7B6E67]">
                      <Target className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                      <p className="text-xs font-bold uppercase tracking-[0.28em]">Utilisasi Total</p>
                    </div>
                    <h2 className="mt-2 text-3xl font-bold text-[#1A2B38]">{Math.round(summary.utilizationPercent)}%</h2>
                  </div>
                  <p className={`text-sm font-bold ${summary.totalVariance >= 0 ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>
                    {formatCurrency(summary.totalVariance)}
                  </p>
                </div>
                <div className="mt-4 h-3 rounded-full bg-[#E7DED7]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(summary.utilizationPercent, 100)}%`,
                      backgroundColor: summary.utilizationPercent > 100 ? "#FF6B58" : summary.utilizationPercent > 80 ? "#FFB347" : "#29B9AA",
                    }}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#FEF9F4] p-4">
                    <div className="flex items-center gap-1 text-[#7B6E67]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                      <p className="text-xs">Sesuai Rencana</p>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#1A2B38]">{summary.onTrackCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[#FEF9F4] p-4">
                    <div className="flex items-center gap-1 text-[#7B6E67]">
                      <TrendingDown className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                      <p className="text-xs">Di Bawah Budget</p>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#29B9AA]">{summary.underBudgetCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[#FEF9F4] p-4">
                    <div className="flex items-center gap-1 text-[#7B6E67]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B58] flex-shrink-0" />
                      <p className="text-xs">Melebihi Budget</p>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#FF6B58]">{summary.overBudgetCount}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {recommendations.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Rekomendasi</p>
                </div>
                {recommendations.length > 4 ? (
                  <button
                    onClick={() => setShowAllRecommendations((current) => !current)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-700"
                  >
                    {showAllRecommendations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showAllRecommendations ? "Ringkas" : "Lihat semua"}
                  </button>
                ) : null}
              </div>
              <div className="mt-3 space-y-3">
                {visibleRecommendations.map((item, index) => (
                  <div key={`${item.category}-${index}`} className="rounded-2xl bg-white/85 px-4 py-3 text-sm text-[#1A2B38]">
                    {item.message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#7B6E67]">
                  <BarChart3 className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Detail Kategori</p>
                </div>
                <p className="mt-2 text-sm text-[#7B6E67]">Bandingkan budget alokasi per kategori belanja bulanan Anda.</p>
              </div>
              <p className="text-xs font-semibold text-[#7B6E67]">{comparison.length} kategori aktif</p>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {comparison.length === 0 ? (
                <EmptyState
                  title="Belum Ada Kategori Budget"
                  description="Tambahkan kategori pengeluaran belanja bulanan (makanan, bulanan, hiburan) beserta alokasi anggarannya."
                  icon={BarChart3}
                  actionText="Tambah Kategori Pertama"
                  onAction={() => {
                    setSelectedCategory(null);
                    setShowCategoryModal(true);
                  }}
                  actionIcon={PlusCircle}
                  variant="inline"
                />
              ) : (
                comparison.map((item) => {
                  const progressColor = item.utilization > 100 ? "#FF6B58" : item.utilization > 80 ? "#FFB347" : item.categoryColor;
                  return (
                    <div key={item.categoryId} className="rounded-2xl bg-[#FEF9F4] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1A2B38]">{item.categoryName}</p>
                            <button
                              onClick={() => {
                                setSelectedCategory({
                                  id: item.categoryId,
                                  name: item.categoryName,
                                  budget_amount: item.budget,
                                  color: item.categoryColor,
                                  priority: item.priority,
                                  is_active: true
                                });
                                setShowCategoryModal(true);
                              }}
                              className="rounded-full p-1 text-[#7B6E67] hover:bg-[#F3EDE8] hover:text-[#1A2B38] transition-colors"
                              title="Edit Budget"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-[#7B6E67] font-medium">{item.transactionCount} transaksi</p>
                        </div>
                        <p className={`text-sm font-bold ${item.status === "over" ? "text-[#FF6B58]" : item.status === "under" ? "text-[#29B9AA]" : "text-[#5BAEE8]"}`}>
                          {Math.round(item.utilization)}%
                        </p>
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-[#E7DED7]">
                        <div
                          className="h-full rounded-full shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]"
                          style={{
                            width: `${Math.min(item.utilization, 100)}%`,
                            backgroundColor: progressColor,
                          }}
                        />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E67]">Anggaran</p>
                          <p className="mt-1 text-xs font-bold text-[#1A2B38]">{formatCurrency(item.budget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E67]">Realisasi</p>
                          <p className="mt-1 text-xs font-bold text-[#1A2B38]">{formatCurrency(item.actual)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7B6E67]">{item.variance >= 0 ? "Sisa" : "Lebih"}</p>
                          <p className={`mt-1 text-xs font-bold ${item.variance >= 0 ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>{item.variance >= 0 ? formatCurrency(item.variance) : formatCurrency(Math.abs(item.variance))}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 2: INCOME SOURCES */}
      {activeSubTab === "income" && (
        <div className="space-y-6">
          <FirstRunGuide
            guideKey="income"
            title="Rencana Pemasukan Rutin"
            description="Di sini Anda dapat merencanakan estimasi pemasukan bulanan, mingguan, atau sekali waktu. Sumber pemasukan ini digunakan untuk menghitung sisa dana belanja aman (Safe-To-Spend) di Beranda secara dinamis."
          />

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5 text-[#7B6E67]">
                  <TrendingUp className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Sumber Pemasukan</p>
                </div>
                <p className="mt-2 text-sm text-[#7B6E67]">Kelola daftar sumber pendapatan bulanan atau mingguan Anda.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedIncomeSource(null);
                  setShowIncomeSourceModal(true);
                }}
                className="rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] transition-colors px-5 py-3 text-sm font-semibold text-white flex items-center gap-1.5 shadow-sm shadow-teal-500/10 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                Tambah Sumber Pemasukan
              </button>
            </div>

            {incomeSources.length === 0 ? (
              <EmptyState
                title="Belum Ada Rencana Pemasukan"
                description="Tambahkan sumber pemasukan bulanan (gaji, bisnis, dll.) untuk menghitung Safe-To-Spend secara akurat."
                icon={TrendingUp}
                actionText="Tambah Pemasukan Pertama"
                onAction={() => {
                  setSelectedIncomeSource(null);
                  setShowIncomeSourceModal(true);
                }}
                actionIcon={PlusCircle}
                variant="inline"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {incomeSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#FEF9F4] p-5 border border-black/5 hover:border-black/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A2B38]">{source.source_name}</p>
                      <p className="mt-1 text-xs text-[#7B6E67] font-medium">{formatFrequencySubtitle(source.frequency)}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-bold text-[#29B9AA]">{formatCurrency(source.amount)}</p>
                      <button
                        onClick={() => {
                          setSelectedIncomeSource(source);
                          setShowIncomeSourceModal(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white border border-[#29B9AA]/20 px-2.5 py-1 text-[10px] font-bold text-[#29B9AA] hover:bg-[#EBF7F6] transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 3: RECURRING BILLS */}
      {activeSubTab === "recurring" && (
        <div className="space-y-6">
          <FirstRunGuide
            guideKey="recurring"
            title="Daftar Tagihan Rutin"
            description="Di sini Anda dapat melacak tagihan bulanan atau mingguan tetap (seperti sewa kost, langganan internet, listrik). Anda dapat menyinkronkan tagihan ini ke pengeluaran bulanan secara langsung dengan tombol Sinkronisasi."
          />

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5 text-[#7B6E67]">
                  <Clock className="w-4 h-4 text-[#FFB347] flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Tagihan Rutin</p>
                </div>
                <p className="mt-2 text-sm text-[#7B6E67]">{recurringExpenses.length} tagihan rutin terdaftar.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSyncRecurring}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-2.5 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors active:scale-[0.98]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  Sinkronisasi
                </button>

                <button
                  onClick={handleExportICS}
                  className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-2.5 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors active:scale-[0.98]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export .ics
                </button>

                <button
                  onClick={() => {
                    setSelectedRecurring(null);
                    setShowRecurringModal(true);
                  }}
                  className="rounded-2xl bg-[#FF6B58] hover:bg-[#E8503F] transition-colors px-5 py-3 text-sm font-semibold text-white flex items-center gap-1.5 shadow-sm shadow-[#FF6B58]/10 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Tambah Tagihan
                </button>
              </div>
            </div>

            {recurringExpenses.length === 0 ? (
              <EmptyState
                title="Belum Ada Tagihan Rutin"
                description="Tambahkan tagihan rutin bulanan (sewa, listrik, wifi) untuk menyederhanakan pelacakan pengeluaran wajib Anda."
                icon={Clock}
                actionText="Tambah Tagihan Pertama"
                onAction={() => {
                  setSelectedRecurring(null);
                  setShowRecurringModal(true);
                }}
                actionIcon={Plus}
                variant="inline"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recurringExpenses.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl bg-[#FEF9F4] p-5 border border-black/5 hover:border-black/10 transition-colors">
                    <div className="min-w-0 flex-1 flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-black/5 text-[#FFB347]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1A2B38]">{item.budget_categories?.name || "Tagihan"}</p>
                        <p className="mt-1 text-xs text-[#7B6E67] font-semibold capitalize leading-relaxed">
                          Setiap {item.frequency === "monthly" ? `Tanggal ${item.day_of_month}` : item.frequency}
                        </p>
                        {item.note && <p className="mt-1.5 text-[11px] text-[#7B6E67] italic font-medium leading-relaxed">"{item.note}"</p>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-extrabold text-[#FF6B58]">{formatCurrency(item.amount)}</p>
                      <div className="mt-3.5 flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleGoogleCalendarUrl(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-black/5 hover:bg-[#F3EDE8] px-2 py-1 text-[10px] font-bold text-[#7B6E67] transition-all"
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          GCal
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecurring(item);
                            setShowRecurringModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#29B9AA]/20 px-2.5 py-1 text-[10px] font-bold text-[#29B9AA] hover:bg-[#EBF7F6] transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRecurring(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors px-2 py-1 text-[10px] font-bold text-[#FF6B58]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modals wrappers */}
      <CategoryModal
        open={showCategoryModal}
        category={selectedCategory}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        onSaved={loadData}
      />

      <IncomeSourceModal 
        open={showIncomeSourceModal} 
        source={selectedIncomeSource} 
        onClose={() => setShowIncomeSourceModal(false)} 
        onSaved={loadData} 
      />

      <RecurringExpenseModal
        open={showRecurringModal}
        recurring={selectedRecurring}
        categories={categories}
        onClose={() => setShowRecurringModal(false)}
        onSaved={loadData}
      />
    </div>
  );
}
