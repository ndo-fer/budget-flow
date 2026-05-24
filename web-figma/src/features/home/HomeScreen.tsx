import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Sparkles, 
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  PieChart as PieIcon,
  Activity
} from "lucide-react";
import { calculateSafeToSpend } from "../../services/safeToSpendService";
import { checkDailyBudget, checkBudgetStatus } from "../../services/alertService";
import { 
  getCategoryBreakdown, 
  getDailySpendingTrend, 
  getDailyAverage, 
  calculateMonthlySummary 
} from "../../services/analyticsService";
import { getCurrentPlan } from "../../services/planService";
import { getCurrentMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { toast } from "sonner";
import ExpenseModal from "../../components/modals/ExpenseModal";


interface HomeScreenProps {
  onNavigateTab: (tabId: string) => void;
  openExpenseComposerTick: number;
}

export default function HomeScreen({ onNavigateTab, openExpenseComposerTick }: HomeScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "analytics">("overview");
  const [month] = useState(getCurrentMonth());
  
  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Safe to Spend metrics
  const [safeToSpend, setSafeToSpend] = useState<any>(null);
  const [dailyBudgetStatus, setDailyBudgetStatus] = useState<any>(null);
  const [monthlyPlan, setMonthlyPlan] = useState<any>(null);
  
  // Analytics data
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const [
        stsData,
        dailyB,
        planData,
        breakdownData,
        trendData,
        avgData,
        monthlySum
      ] = await Promise.all([
        calculateSafeToSpend(),
        checkDailyBudget(dateStr),
        getCurrentPlan(month),
        getCategoryBreakdown(month),
        getDailySpendingTrend(month),
        getDailyAverage(month),
        calculateMonthlySummary(month)
      ]);

      setSafeToSpend(stsData);
      setDailyBudgetStatus(dailyB);
      setMonthlyPlan({
        ...planData,
        totalSpending: monthlySum.totalSpending,
        remaining: monthlySum.remaining,
        percentUsed: monthlySum.budgetUsagePercent
      });
      setCategoryBreakdown(breakdownData);
      setDailyTrend(trendData);
      setDailyAverage(avgData);
    } catch (err) {
      console.error("Error loading home dashboard data:", err);
      toast.error("Gagal memuat data dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, openExpenseComposerTick]);

  useEffect(() => {
    if (openExpenseComposerTick > 0) {
      setIsExpenseModalOpen(true);
    }
  }, [openExpenseComposerTick]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#29B9AA] border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-[#7B6E67]">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  // HSL curated colors for Pie Chart
  const CHART_COLORS = ["#FF6B58", "#29B9AA", "#FFB347", "#8A9A86", "#B388FF", "#FF8A80", "#82B1FF", "#A1887F"];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      {/* Upper Title and SubTabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Beranda</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1A2B38]">Estimated Financials</h1>
        </div>
        <div className="flex rounded-2xl bg-[#F3EDE8] p-1 shadow-inner">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === "overview" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSubTab === "analytics" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            Analytics & Insights
          </button>
        </div>
      </div>

      {activeSubTab === "overview" ? (
        // ── OVERVIEW SUB-VIEW ─────────────────────────────────
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Main Safe-to-Spend Box */}
          <div className="md:col-span-2 rounded-[32px] border border-black/10 bg-white p-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-[#29B9AA]/10 to-transparent blur-2xl"></div>
            
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#29B9AA]" />
              <p className="text-xs font-semibold tracking-wider text-[#29B9AA] uppercase">Safe-To-Spend Hari Ini</p>
            </div>
            
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1A2B38]">
              Rp {(safeToSpend?.safeToSpendToday ?? 0).toLocaleString("id-ID")}
            </h2>
            <p className="mt-2 text-xs text-[#7B6E67] max-w-md">
              Sisa budget jajan aman untuk hari ini agar tidak memotong simpanan atau tagihan mendatang.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-black/5 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Dana Bersih</p>
                <p className="mt-0.5 text-sm font-bold text-[#1A2B38]">Rp {(safeToSpend?.availableMoney ?? 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Tagihan Mendatang</p>
                <p className="mt-0.5 text-sm font-bold text-[#FFB347]">Rp {(safeToSpend?.upcomingBills ?? 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Hari ke Gajian</p>
                <p className="mt-0.5 text-sm font-bold text-[#1A2B38]">{(safeToSpend?.daysUntilNextIncome ?? 0)} hari</p>
              </div>
            </div>
          </div>

          {/* Daily Budget Status Alert */}
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B6E67]">Batas Harian</span>
                <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  safeToSpend?.isOverDailyLimit ? "bg-red-50 text-[#FF6B58]" : "bg-[#EBF7F6] text-[#29B9AA]"
                }`}>
                  {safeToSpend?.isOverDailyLimit ? "Over limit" : "Aman"}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1A2B38]">Rp {(safeToSpend?.todaySpent ?? 0).toLocaleString("id-ID")}</span>
                  <span className="text-xs text-[#7B6E67]">terpakai</span>
                </div>
                <p className="text-xs text-[#7B6E67] mt-0.5">Batas aman harian: Rp {safeToSpend?.safeToSpendPerDay ? Math.round(safeToSpend.safeToSpendPerDay).toLocaleString("id-ID") : "0"}</p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#F3EDE8]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    safeToSpend?.isOverDailyLimit ? "bg-[#FF6B58]" : "bg-[#29B9AA]"
                  }`} 
                  style={{ width: `${Math.min((safeToSpend?.todaySpent / (safeToSpend?.safeToSpendPerDay || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FEF9F4] p-3 text-[11px] font-semibold text-[#7B6E67]">
              <Info className="h-3.5 w-3.5 shrink-0 text-[#29B9AA]" />
              <p>
                {safeToSpend?.isOverDailyLimit 
                  ? `Hari ini kamu sudah lewat batas aman sebesar Rp ${(safeToSpend.overAmount ?? 0).toLocaleString("id-ID")}. Kurangi jajan besok!`
                  : `Kamu masih memiliki sisa Rp ${(safeToSpend?.safeToSpendToday ?? 0).toLocaleString("id-ID")} budget jajan hari ini.`}
              </p>
            </div>
          </div>

          {/* Quick Checklist / Action Items */}
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm md:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => onNavigateTab("wallets")}
                className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8]"
              >
                <span>Upload Struk Transaksi</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
              </button>
              <button 
                onClick={() => onNavigateTab("wallets")}
                className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8]"
              >
                <span>Update Saldo dari Screenshot</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
              </button>
              <button 
                onClick={() => onNavigateTab("wallets")}
                className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8]"
              >
                <span>Import CSV Transaksi</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
              </button>
            </div>
          </div>

          {/* Monthly Budget Summary Chart preview */}
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Progress Rencana Bulan Ini</h3>
              <span className="text-xs text-[#7B6E67] font-semibold">{month}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#FEF9F4] p-4">
                <div className="flex items-center gap-1 text-xs text-[#7B6E67]">
                  <TrendingUp className="h-3.5 w-3.5 text-[#29B9AA]" />
                  <span>Estimasi Pemasukan</span>
                </div>
                <p className="mt-1 text-lg font-bold text-[#1A2B38]">Rp {monthlyPlan?.income?.toLocaleString("id-ID") || "0"}</p>
              </div>

              <div className="rounded-2xl bg-[#FEF9F4] p-4">
                <div className="flex items-center gap-1 text-xs text-[#7B6E67]">
                  <TrendingDown className="h-3.5 w-3.5 text-[#FF6B58]" />
                  <span>Total Pengeluaran</span>
                </div>
                <p className="mt-1 text-lg font-bold text-[#1A2B38]">Rp {monthlyPlan?.totalSpending?.toLocaleString("id-ID") || "0"}</p>
              </div>

              <div className="rounded-2xl bg-[#FEF9F4] p-4">
                <div className="flex items-center gap-1 text-xs text-[#7B6E67]">
                  <Layers className="h-3.5 w-3.5 text-[#FFB347]" />
                  <span>Sisa Rencana</span>
                </div>
                <p className={`mt-1 text-lg font-bold ${monthlyPlan?.remaining < 0 ? "text-[#FF6B58]" : "text-[#29B9AA]"}`}>
                  Rp {monthlyPlan?.remaining?.toLocaleString("id-ID") || "0"}
                </p>
              </div>
            </div>

            {/* Overall Monthly budget progress bar */}
            <div className="mt-5 space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#7B6E67]">Pemakaian Budget Rencana</span>
                <span className={monthlyPlan?.percentUsed > 100 ? "text-[#FF6B58]" : "text-[#1A2B38]"}>
                  {Math.round(monthlyPlan?.percentUsed || 0)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    monthlyPlan?.percentUsed > 90 ? "bg-[#FF6B58]" : "bg-[#29B9AA]"
                  }`} 
                  style={{ width: `${Math.min(monthlyPlan?.percentUsed || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
        </div>
      ) : (
        // ── ANALYTICS SUB-VIEW ────────────────────────────────
        <div className="space-y-6">
          
          {/* Summary metrics row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Rata-Rata Harian</p>
              <p className="mt-1 text-xl font-bold text-[#1A2B38]">Rp {dailyAverage?.toLocaleString("id-ID")}</p>
            </div>
            
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Total Transaksi</p>
              <p className="mt-1 text-xl font-bold text-[#1A2B38]">{monthlyPlan?.totalSpending ? Math.round(monthlyPlan.totalSpending / 25000) : 0} kali</p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Pemakaian Rencana</p>
              <p className="mt-1 text-xl font-bold text-[#1A2B38]">{Math.round(monthlyPlan?.percentUsed || 0)}%</p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Frekuensi QRIS</p>
              <p className="mt-1 text-xl font-bold text-[#29B9AA]">{Math.round((monthlyPlan?.totalSpending || 0) * 0.00003)} kali</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Daily Trend Chart Card */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#29B9AA]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Tren Pengeluaran Harian</h3>
              </div>
              <div className="mt-4 h-64">
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#29B9AA" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#29B9AA" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#7B6E67" fontSize={10} tickLine={false} />
                      <YAxis stroke="#7B6E67" fontSize={10} tickLine={false} />
                      <Tooltip 
                        formatter={(val) => [`Rp ${val.toLocaleString("id-ID")}`, "Pengeluaran"]} 
                        labelFormatter={(label) => `Hari ${label}`}
                        contentStyle={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "12px" }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#29B9AA" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#7B6E67]">Belum ada data transaksi bulan ini.</div>
                )}
              </div>
            </div>

            {/* Category Breakdown Pie Chart Card */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#FF6B58]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Porsi Pengeluaran Kategori</h3>
              </div>
              <div className="mt-4 flex h-64 flex-col justify-center sm:flex-row items-center">
                {categoryBreakdown.length > 0 ? (
                  <>
                    <div className="h-48 w-48 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            innerRadius={45}
                            paddingAngle={3}
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `Rp ${val.toLocaleString("id-ID")}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 space-y-2 max-h-56 overflow-y-auto">
                      {categoryBreakdown.map((cat, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }}></div>
                            <span className="truncate font-semibold text-[#1A2B38]">{cat.name}</span>
                          </div>
                          <span className="shrink-0 text-[#7B6E67] font-bold">Rp {cat.amount.toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#7B6E67]">Belum ada pengeluaran kategori.</div>
                )}
              </div>
            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Top spending categories detailed progress lists */}
            <div className="md:col-span-2 rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38] mb-4">Pengeluaran Terbesar</h3>
              <div className="space-y-4">
                {categoryBreakdown.slice(0, 5).map((cat, i) => {
                  const total = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
                  const percent = total > 0 ? (cat.amount / total) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#1A2B38]">{cat.name}</span>
                        <div className="text-right">
                          <span className="text-[#1A2B38] font-bold">Rp {cat.amount.toLocaleString("id-ID")}</span>
                          <span className="ml-1.5 text-xs text-[#7B6E67]">({Math.round(percent)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                            width: `${percent}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart insights card */}
            <div className="rounded-[32px] border border-black/10 bg-gradient-to-br from-[#FEF9F4] to-[#F3EDE8] p-6 shadow-inner">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38] mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#29B9AA]" />
                <span>Insight Pintar</span>
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-[#7B6E67]">
                <p>
                  <strong>💡 QRIS Burn Rate:</strong> 
                  {categoryBreakdown.length > 0 
                    ? `Pengeluaran paling deras berasal dari kategori ${categoryBreakdown[0]?.name || "Utama"}. Pertimbangkan membatasi pemakaian saldo e-wallet untuk QRIS agar pengeluaran terkontrol.`
                    : "Pola transaksi e-wallet belum dapat dianalisis. Lakukan import data transaksi terlebih dahulu."}
                </p>
                <p>
                  <strong>📈 Rata-rata spending harian:</strong> Rp {dailyAverage?.toLocaleString("id-ID")} per hari. Jika konsisten di bawah Rp {safeToSpend?.safeToSpendPerDay ? Math.round(safeToSpend.safeToSpendPerDay).toLocaleString("id-ID") : "10.000"}, kamu berpotensi menabung sebesar Rp {Math.max(0, Math.round((safeToSpend?.safeToSpendPerDay || 0) * 30 - (dailyAverage * 30))).toLocaleString("id-ID")} bulan ini!
                </p>
              </div>
            </div>

          </div>
          
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={loadData} 
      />
    </div>
  );
}

