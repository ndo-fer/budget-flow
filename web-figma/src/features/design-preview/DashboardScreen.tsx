import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coffee,
  LayoutGrid,
  BarChart2,
  CalendarRange,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  ChevronRight,
  Activity,
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  X,
  Settings
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { T, font } from "./tokens";
import { PreviewData, getCatColor, getWalletStyle, rp, fmtDate } from "./usePreviewData";
import { toast } from "../../utils/toast";

// V1 Services
import { getCurrentPlan } from "../../services/planService";
import {
  calculateMonthlySummary,
  getCategoryBreakdown,
  getDailySpendingTrend,
  getDailyAverage
} from "../../services/analyticsService";

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

const CHART_COLORS = ["#FF6B58", "#29B9AA", "#FFB347", "#8A9A86", "#B388FF", "#FF8A80", "#82B1FF", "#A1887F"];

interface DashboardScreenProps {
  month: string;
  onRefresh: () => void;
  previewData: PreviewData;
}

export default function DashboardScreen({ month, onRefresh, previewData }: DashboardScreenProps) {
  const { wallets, expenses, incomeTransactions, categories, summary, safeToSpend, totalBalance, loading } = previewData;

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "analytics">("overview");

  // Payday modal states
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayInput, setPaydayInput] = useState(() => {
    try {
      return localStorage.getItem("bf_payday_day_of_month") || "25";
    } catch {
      return "25";
    }
  });

  // Analytics states
  const [monthlyPlan, setMonthlyPlan] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Load analytical data in sync with month selector
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [planData, monthlySum, breakdownData, trendData, avgData] = await Promise.all([
        getCurrentPlan(month).catch(() => null),
        calculateMonthlySummary(month).catch(() => ({ totalSpending: 0, remaining: 0, budgetUsagePercent: 0 })),
        getCategoryBreakdown(month).catch(() => []),
        getDailySpendingTrend(month).catch(() => []),
        getDailyAverage(month).catch(() => 0),
      ]);

      setMonthlyPlan({
        ...planData,
        totalSpending: monthlySum.totalSpending,
        remaining: monthlySum.remaining,
        percentUsed: monthlySum.budgetUsagePercent
      });
      setCategoryBreakdown(breakdownData);
      setDailyTrend(trendData);
      setDailyAverage(avgData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [month]);

  const handleSavePayday = () => {
    const day = parseInt(paydayInput, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error("Tanggal gajian harus bernilai 1 - 31.");
      return;
    }
    localStorage.setItem("bf_payday_day_of_month", String(day));
    toast.success(`Tanggal gajian diubah ke tanggal ${day} setiap bulan.`);
    setShowPaydayModal(false);
    onRefresh(); // Trigger update safe to spend
    loadAnalytics(); // Reload analytics
  };

  // Build category spending map for category list progress bars
  const catMap = new Map<string | number, number>();
  for (const ex of expenses) {
    const cid = ex.category_id;
    catMap.set(cid, (catMap.get(cid) || 0) + ex.amount);
  }

  const recentAll = [
    ...expenses.map(e => ({ ...e, kind: "expense" })),
    ...incomeTransactions.map(i => ({ ...i, kind: "income" })),
  ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()).slice(0, 6);

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Title & SubTabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p style={font(10, 800, T.teal, { letterSpacing: "0.2em", textTransform: "uppercase" })}>Beranda</p>
          <h1 style={font(26, 700, T.textPrimary, { marginTop: 4, letterSpacing: "-0.5px" })}>Estimated Financials</h1>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: T.surface, padding: 4, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <button
            onClick={() => setActiveSubTab("overview")}
            style={{
              padding: "6px 12px", border: "none", borderRadius: 8, cursor: "pointer",
              background: activeSubTab === "overview" ? T.surface2 : "transparent",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}
          >
            <LayoutGrid size={13} color={activeSubTab === "overview" ? T.teal : T.textSecondary} />
            <span style={font(11, 700, activeSubTab === "overview" ? T.textPrimary : T.textSecondary)}>Overview</span>
          </button>
          <button
            onClick={() => setActiveSubTab("analytics")}
            style={{
              padding: "6px 12px", border: "none", borderRadius: 8, cursor: "pointer",
              background: activeSubTab === "analytics" ? T.surface2 : "transparent",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
            }}
          >
            <BarChart2 size={13} color={activeSubTab === "analytics" ? T.teal : T.textSecondary} />
            <span style={font(11, 700, activeSubTab === "analytics" ? T.textPrimary : T.textSecondary)}>Analytics</span>
          </button>
        </div>
      </div>

      {activeSubTab === "overview" ? (
        <>
          {/* Hero */}
          <div style={{ ...card(), background: "linear-gradient(140deg,#000814 0%,#010d1e 50%,#001a3a 100%)", padding: "28px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(28,108,255,0.08)", filter: "blur(60px)" }} />
            <p style={font(11, 700, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 8 })}>Total Saldo</p>
            {loading ? <Skeleton w="60%" h={44} r={8} /> : (
              <p style={font(36, 600, T.textPrimary, { letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 })}>{rp(totalBalance)}</p>
            )}
            <p style={font(13, 500, T.textSecondary, { marginBottom: 20 })}>{wallets.length} dompet aktif</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "PEMASUKAN", val: loading ? null : rp(summary.totalIncome), color: T.teal, icon: TrendingUp },
                { label: "PENGELUARAN", val: loading ? null : rp(summary.totalExpenses), color: T.crimson, icon: TrendingDown },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} style={{ flex: 1, padding: "14px", borderRadius: T.r.sm, background: `${color}12`, border: `1px solid ${color}25` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <Icon size={11} color={color} />
                    <span style={font(9, 800, color, { letterSpacing: "0.12em", textTransform: "uppercase" as any })}>{label}</span>
                  </div>
                  {val ? <p style={font(15, 700, T.textPrimary)}>{val}</p> : <Skeleton w="80%" h={20} />}
                </div>
              ))}
            </div>
          </div>

          {/* Safe to Spend & Daily Budget limit cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }} className="md:grid-cols-2">
            {/* Safe-to-spend */}
            {safeToSpend && (
              <div style={{ ...card(), padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Target size={12} color={T.teal} />
                    <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Aman Dibelanjakan Hari Ini</p>
                  </div>
                  <p style={font(24, 700, T.teal)}>{rp(safeToSpend.safeToSpendToday)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" as any }}>
                    <p style={font(9, 700, T.textMuted, { textTransform: "uppercase" })}>Ke Gajian</p>
                    <p style={font(26, 800, T.sunbeam, { lineHeight: 1, margin: "2px 0" })}>{safeToSpend.daysUntilNextIncome}</p>
                    <p style={font(9, 700, T.textMuted)}>Hari Lagi</p>
                  </div>
                  {/* Settings / Edit button */}
                  <button
                    onClick={() => {
                      try {
                        setPaydayInput(localStorage.getItem("bf_payday_day_of_month") || "25");
                      } catch {}
                      setShowPaydayModal(true);
                    }}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`,
                      background: T.surface2, cursor: "pointer", color: T.textSecondary,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Settings size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Daily limit check */}
            {safeToSpend && (
              <div style={{ ...card(), padding: "20px", display: "flex", flexDirection: "column", justifyBetween: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Target size={12} color={T.crimson} />
                    <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Batas Harian</p>
                  </div>
                  <span style={{
                    padding: "3px 8px", borderRadius: 8,
                    background: safeToSpend.isOverDailyLimit ? `${T.crimson}20` : `${T.teal}20`,
                    border: `1px solid ${safeToSpend.isOverDailyLimit ? T.crimson : T.teal}40`,
                    ...font(8, 800, safeToSpend.isOverDailyLimit ? T.crimson : T.teal, { textTransform: "uppercase" })
                  }}>
                    {safeToSpend.isOverDailyLimit ? "Over Limit" : "Aman"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <p style={font(18, 700, T.textPrimary)}>{rp(safeToSpend.todaySpent)} <span style={font(10, 500, T.textSecondary)}>terpakai</span></p>
                  <p style={font(11, 500, T.textSecondary)}>Limit: {rp(Math.round(safeToSpend.safeToSpendPerDay))}</p>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${Math.min((safeToSpend.todaySpent / (safeToSpend.safeToSpendPerDay || 1)) * 100, 100)}%`,
                    background: safeToSpend.isOverDailyLimit ? T.crimson : T.teal,
                    transition: "width 0.5s ease"
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Progress Rencana Bulan Ini */}
          {monthlyPlan && (
            <div style={{ ...card(), padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarRange size={13} color={T.teal} />
                  <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Progress Rencana Bulan Ini</p>
                </div>
                <span style={font(10, 700, T.textSecondary)}>{fmtDate(month + "-01").split(" ").slice(1).join(" ")}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: T.surface2, padding: 10, borderRadius: 10, border: `1px solid ${T.border}30` }}>
                  <p style={font(8, 700, T.textLabel, { textTransform: "uppercase" })}>Estimasi Masuk</p>
                  <p style={font(13, 700, T.textPrimary, { marginTop: 4 })}>{rp(monthlyPlan.income)}</p>
                </div>
                <div style={{ background: T.surface2, padding: 10, borderRadius: 10, border: `1px solid ${T.border}30` }}>
                  <p style={font(8, 700, T.textLabel, { textTransform: "uppercase" })}>Total Keluar</p>
                  <p style={font(13, 700, T.textPrimary, { marginTop: 4 })}>{rp(monthlyPlan.totalSpending)}</p>
                </div>
                <div style={{ background: T.surface2, padding: 10, borderRadius: 10, border: `1px solid ${T.border}30` }}>
                  <p style={font(8, 700, T.textLabel, { textTransform: "uppercase" })}>Sisa Rencana</p>
                  <p style={font(13, 700, monthlyPlan.remaining < 0 ? T.crimson : T.teal, { marginTop: 4 })}>{rp(monthlyPlan.remaining)}</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, ...font(10, 700, T.textSecondary) }}>
                <span>Pemakaian Rencana</span>
                <span style={{ color: monthlyPlan.percentUsed > 100 ? T.crimson : T.teal }}>{Math.round(monthlyPlan.percentUsed)}%</span>
              </div>

              <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${Math.min(monthlyPlan.percentUsed, 100)}%`,
                  background: monthlyPlan.percentUsed > 90 ? T.crimson : T.teal,
                  transition: "width 0.5s ease"
                }} />
              </div>
            </div>
          )}

          {/* Wallet cards */}
          <div>
            <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 12 })}>Dompet Saya</p>
            {loading
              ? <div style={{ display: "flex", gap: 12 }}>{[1, 2].map(i => <Skeleton key={i} w={190} h={100} r={32} />)}</div>
              : wallets.length === 0
                ? <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(13, 500, T.textMuted)}>Belum ada dompet</p></div>
                : (
                  <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                    {wallets.map((w, i) => {
                      const { g, glow } = getWalletStyle(i);
                      return (
                        <div key={w.id} style={{ minWidth: 190, borderRadius: T.r.card, padding: "22px 20px", background: g, flexShrink: 0, position: "relative", overflow: "hidden", boxShadow: `0 12px 40px ${glow}` }}>
                          <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                            <Wallet size={12} color="rgba(255,255,255,0.6)" />
                            <p style={font(11, 700, "rgba(255,255,255,0.65)", { letterSpacing: "0.1em" })}>{w.name}</p>
                          </div>
                          <p style={font(20, 700, "#fff", { letterSpacing: "-0.3px" })}>{rp(w.estimated_balance)}</p>
                          <p style={font(11, 500, "rgba(255,255,255,0.5)", { marginTop: 4 })}>{w.provider || w.type}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
          </div>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div>
              <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 12 })}>Kategori Bulan Ini</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {categories.slice(0, 6).map((cat, i) => {
                  const c = getCatColor(i, cat.color);
                  const spent = catMap.get(cat.id) || 0;
                  const count = expenses.filter(e => e.category_id === cat.id).length;
                  return (
                    <div key={cat.id} style={{ borderRadius: T.r.card, padding: "20px", background: c.bg, border: `1px solid ${c.border}` }}>
                      <div style={{ width: 42, height: 42, borderRadius: T.r.icon, background: c.fill, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: `0 4px 16px ${c.fill}40` }}>
                        <Coffee size={18} color="#fff" />
                      </div>
                      <p style={font(13, 600, T.textPrimary, { marginBottom: 2 })}>{cat.name}</p>
                      <p style={font(16, 700, c.fill, { marginBottom: 4 })}>{rp(spent)}</p>
                      <p style={font(11, 500, T.textSecondary)}>{count} transaksi</p>
                      {cat.budget_amount > 0 && (
                        <div style={{ marginTop: 8, height: 4, borderRadius: T.r.chip, background: T.border, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((spent / cat.budget_amount) * 100, 100)}%`, borderRadius: T.r.chip, background: spent > cat.budget_amount ? T.crimson : c.fill }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div>
            <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 12 })}>Transaksi Terkini</p>
            {loading
              ? [1, 2, 3].map(i => <div key={i} style={{ ...card(), padding: "14px 20px", marginBottom: 8 }}><Skeleton w="70%" h={14} /></div>)
              : recentAll.length === 0
                ? <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(13, 500, T.textMuted)}>Belum ada transaksi</p></div>
                : (
                  <div style={{ ...card(), overflow: "hidden" }}>
                    {recentAll.map((tx, i) => {
                      const isIncome = tx.kind === "income";
                      const catIdx = categories.findIndex(c => c.id === tx.category_id);
                      const c = isIncome
                        ? { fill: T.teal, bg: `${T.teal}18`, border: `${T.teal}30` }
                        : getCatColor(catIdx >= 0 ? catIdx : i, tx.budget_categories?.color);
                      const label = isIncome
                        ? (tx.income_sources?.source_name || "Pemasukan")
                        : (tx.budget_categories?.name || tx.note || "Pengeluaran");
                      return (
                        <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < recentAll.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <div style={{ width: 40, height: 40, borderRadius: T.r.icon, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isIncome ? <TrendingUp size={16} color={c.fill} /> : <TrendingDown size={16} color={c.fill} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={font(13, 600, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any, marginBottom: 2 })}>
                              {tx.note || label}
                            </p>
                            <p style={font(11, 500, T.textSecondary)}>{fmtDate(tx.occurred_at)}</p>
                          </div>
                          <p style={font(14, 700, isIncome ? T.teal : T.textPrimary)}>
                            {isIncome ? "+" : "-"}{rp(tx.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
          </div>
        </>
      ) : (
        /* Analytics Tab Panel */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {analyticsLoading ? (
            [1, 2].map(i => <Skeleton key={i} w="100%" h={140} r={28} />)
          ) : (
            <>
              {/* Summary stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="md:grid-cols-4">
                <div style={{ ...card(), padding: 16 }}>
                  <span style={font(9, 800, T.textLabel, { textTransform: "uppercase" })}>Rerata Harian</span>
                  <p style={font(18, 700, T.textPrimary, { marginTop: 6 })}>{rp(dailyAverage)}</p>
                </div>
                <div style={{ ...card(), padding: 16 }}>
                  <span style={font(9, 800, T.textLabel, { textTransform: "uppercase" })}>Total Transaksi</span>
                  <p style={font(18, 700, T.textPrimary, { marginTop: 6 })}>{expenses.length + incomeTransactions.length} kali</p>
                </div>
                <div style={{ ...card(), padding: 16 }}>
                  <span style={font(9, 800, T.textLabel, { textTransform: "uppercase" })}>Porsi Rencana</span>
                  <p style={font(18, 700, T.textPrimary, { marginTop: 6 })}>{monthlyPlan ? Math.round(monthlyPlan.percentUsed) : 0}%</p>
                </div>
                <div style={{ ...card(), padding: 16 }}>
                  <span style={font(9, 800, T.teal, { textTransform: "uppercase" })}>QRIS Ingestion</span>
                  <p style={font(18, 700, T.teal, { marginTop: 6 })}>{expenses.filter(e => e.provider === "QRIS" || e.note?.toLowerCase().includes("qris")).length} kali</p>
                </div>
              </div>

              {/* Charts grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-2">
                {/* Trend Area Chart */}
                <div style={{ ...card(), padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <Activity size={14} color={T.teal} />
                    <p style={font(11, 800, T.textLabel, { textTransform: "uppercase" })}>Tren Pengeluaran Harian</p>
                  </div>
                  <div style={{ height: 220 }}>
                    {dailyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="v2ColorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.teal} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke={T.textMuted} fontSize={10} tickLine={false} />
                          <YAxis stroke={T.textMuted} fontSize={10} tickLine={false} />
                          <Tooltip
                            formatter={(val) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Pengeluaran"]}
                            labelFormatter={(label) => `Hari ${label}`}
                            contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 11, color: T.textPrimary }}
                          />
                          <Area type="monotone" dataKey="amount" stroke={T.teal} strokeWidth={2} fillOpacity={1} fill="url(#v2ColorAmount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", ...font(11, 500, T.textMuted) }}>
                        Belum ada transaksi di bulan ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories Pie Chart */}
                <div style={{ ...card(), padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <PieIcon size={14} color={T.crimson} />
                    <p style={font(11, 800, T.textLabel, { textTransform: "uppercase" })}>Porsi Kategori</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", height: 220, alignItems: "center", justifyContent: "center" }}>
                    {categoryBreakdown.length > 0 ? (
                      <>
                        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryBreakdown}
                                dataKey="amount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                innerRadius={42}
                                paddingAngle={3}
                              >
                                {categoryBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val) => `Rp ${Number(val).toLocaleString("id-ID")}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ flex: 1, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                          {categoryBreakdown.map((cat, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...font(10, 600, T.textPrimary) }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span>{cat.name}</span>
                              </div>
                              <span style={font(10, 700, T.textSecondary)}>{rp(cat.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", ...font(11, 500, T.textMuted) }}>
                        Belum ada data pengeluaran kategori.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Largest spend breakdown & Smart insights */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-3">
                <div style={{ ...card(), padding: 20, gridColumn: "span 2" }}>
                  <p style={{ marginBottom: 14, ...font(11, 800, T.textLabel, { textTransform: "uppercase" }) }}>Pengeluaran Terbesar</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {categoryBreakdown.slice(0, 5).map((cat, i) => {
                      const total = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
                      const percent = total > 0 ? (cat.amount / total) * 100 : 0;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...font(11, 700, T.textPrimary) }}>
                            <span>{cat.name}</span>
                            <span style={font(11, 700, T.textSecondary)}>{rp(cat.amount)} ({Math.round(percent)}%)</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 3,
                              width: `${percent}%`,
                              background: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...card(), padding: 20, background: "linear-gradient(135deg, #10192b 0%, #060e1d 100%)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Sparkles size={14} color={T.teal} />
                    <p style={font(11, 800, T.teal, { textTransform: "uppercase" })}>Insight Pintar</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, ...font(11, 500, T.textSecondary, { lineHeight: 1.5 }) }}>
                    <p>
                      <strong>💡 QRIS Burn Rate:</strong>{" "}
                      {categoryBreakdown.length > 0
                        ? `Pengeluaran paling deras berasal dari kategori ${categoryBreakdown[0]?.name || "Utama"}. Batasi transaksi QRIS e-wallet agar cashflow aman.`
                        : "Pola transaksi belum dapat dianalisis. Lakukan import data transaksi terlebih dahulu."}
                    </p>
                    <p>
                      <strong>📈 Rata-rata:</strong> Rp {dailyAverage.toLocaleString("id-ID")} per hari. Konsisten di bawah {safeToSpend ? rp(Math.round(safeToSpend.safeToSpendPerDay)) : "Rp 0"} akan menyisakan ruang tabung yang signifikan bulan ini.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payday Editor Custom Dark Modal Overlay */}
      {showPaydayModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100, display: "flex",
          alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16
        }}>
          <div style={{
            width: "100%", maxWidth: 440, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.r.card, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={font(9, 800, T.teal, { letterSpacing: "0.2em", textTransform: "uppercase" })}>Siklus Belanja</p>
                <p style={font(16, 700, T.textPrimary, { marginTop: 2 })}>Ubah Tanggal Gajian</p>
              </div>
              <button
                onClick={() => setShowPaydayModal(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textSecondary }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={font(11, 500, T.textSecondary, { lineHeight: 1.4, marginBottom: 16 })}>
              Siklus belanja aman harian (Safe-to-Spend) Anda akan dihitung ulang secara dinamis berdasarkan sisa hari menuju tanggal gajian ini.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 6, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Tanggal Gajian (1 - 31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={paydayInput}
                onChange={(e) => setPaydayInput(e.target.value)}
                style={{
                  width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 14px", color: T.textPrimary, outline: "none", ...font(12, 600, T.textPrimary)
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowPaydayModal(false)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent",
                  cursor: "pointer", ...font(12, 700, T.textSecondary)
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSavePayday}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "none", background: T.iris,
                  cursor: "pointer", ...font(12, 700, "#fff")
                }}
              >
                Simpan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
