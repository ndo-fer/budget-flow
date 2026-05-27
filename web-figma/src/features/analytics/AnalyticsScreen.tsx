import { useEffect, useMemo, useState } from "react";
import { toast } from "../../utils/toast";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { calculateMonthlySummary, getCategoryBreakdown, getDailyAverage, getDailySpendingTrend, getTopCategories } from "../../services/analyticsService";
import { getQrisInsight, getDailyBurnRate, getTopMerchants, detectRecurringPatterns } from "../../services/walletAnalyticsService";
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ArrowDownCircle, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Trophy, 
  Wallet, 
  QrCode, 
  Flame, 
  AlertTriangle, 
  Store, 
  Repeat2, 
  PieChart as PieIcon 
} from "lucide-react";
import { formatMonthLabel, getCurrentMonth, shiftMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

const COPY = {
  heading: "Analisis Keuangan",
  title: "Lihat pola pengeluaran bulananmu dalam satu kanvas yang lebih mudah dibaca.",
  subtitle: "Ringkasan ini fokus ke pola pengeluaran, kategori terbesar, dan ritme harian tanpa membuat data terlihat rumit.",
  income: "Total Pemasukan",
  spending: "Total Pengeluaran",
  remaining: "Sisa Saldo Rencana",
  dailyAvg: "Rata-rata Harian",
  byCategory: "Distribusi Pengeluaran Per Kategori",
  trend: "Tren Pengeluaran Harian",
  topCategories: "Kategori Terbesar",
};

export default function AnalyticsScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);

  // Wallet-based insights
  const [qrisInsight, setQrisInsight] = useState<any>(null);
  const [burnRate, setBurnRate] = useState(0);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [summaryData, categoryData, trendData, topCategoryData, averageData,
             qris, burn, merchants, recurring] = await Promise.all([
        calculateMonthlySummary(month),
        getCategoryBreakdown(month),
        getDailySpendingTrend(month),
        getTopCategories(month, 5),
        getDailyAverage(month),
        getQrisInsight(7).catch(() => null),
        getDailyBurnRate(30).catch(() => 0),
        getTopMerchants(30, 5).catch(() => []),
        detectRecurringPatterns(90).catch(() => []),
      ]);
      setSummary(summaryData);
      setCategoryBreakdown(categoryData);
      setDailyTrend(trendData);
      setTopCategories(topCategoryData);
      setDailyAverage(averageData);
      setQrisInsight(qris);
      setBurnRate(burn);
      setTopMerchants(merchants);
      setRecurringPatterns(recurring);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat analisis.");
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
      {/* Header */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#29B9AA] mb-1">
              <Activity className="w-4 h-4 text-[#29B9AA]" />
              <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">{COPY.heading}</p>
            </div>
            <h1 className="mt-3 max-w-3xl text-2xl md:text-3xl font-bold text-[#1A2B38]">{COPY.title}</h1>
            <p className="mt-2.5 max-w-3xl text-xs md:text-sm text-[#7B6E67] font-medium">{COPY.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Month Switcher */}
      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
        <button 
          onClick={() => setMonth((current) => shiftMonth(current, -1))} 
          className="rounded-full bg-[#F3EDE8] p-2 text-[#7B6E67] hover:bg-[#EADFD8] transition-colors"
          title="Bulan Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-bold text-[#1A2B38]">{formatMonthLabel(month)}</p>
        <button 
          onClick={() => setMonth((current) => shiftMonth(current, 1))} 
          className="rounded-full bg-[#F3EDE8] p-2 text-[#7B6E67] hover:bg-[#EADFD8] transition-colors"
          title="Bulan Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">{COPY.income}</p>
              <p className="mt-1 text-lg font-bold text-[#1A2B38]">{formatCurrency(summary.income)}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#EBF7F6] flex items-center justify-center text-[#29B9AA] flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">{COPY.spending}</p>
              <p className="mt-1 text-lg font-bold text-[#FF6B58]">{formatCurrency(summary.totalSpending)}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-[#FF6B58] flex-shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">{COPY.remaining}</p>
              <p className={`mt-1 text-lg font-bold ${summary.remaining >= 0 ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>{formatCurrency(summary.remaining)}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${summary.remaining >= 0 ? "bg-[#EBF7F6] text-[#29B9AA]" : "bg-red-50 text-[#FF6B58]"}`}>
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">{COPY.dailyAvg}</p>
              <p className="mt-1 text-lg font-bold text-[#1A2B38]">{formatCurrency(dailyAverage)}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#FEF9F4] flex items-center justify-center text-[#7B6E67] flex-shrink-0">
              <ArrowDownCircle className="h-4 w-4" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Pie Chart & Line Chart */}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
            <PieIcon className="w-4 h-4 text-[#7B6E67]" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">{COPY.byCategory}</p>
          </div>
          <div className="mt-4 h-[300px]">
            {categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-[#FEF9F4] text-xs text-[#7B6E67] font-semibold">Belum ada data alokasi pengeluaran.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={100}>
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
            <Activity className="w-4 h-4 text-[#7B6E67]" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">{COPY.trend}</p>
          </div>
          <div className="mt-4 h-[300px]">
            {dailyTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-[#FEF9F4] text-xs text-[#7B6E67] font-semibold">Belum ada data tren harian.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3EDE8" />
                  <XAxis dataKey="day" tick={{ fill: "#7B6E67", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#7B6E67", fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="amount" stroke="#29B9AA" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
          <Trophy className="w-4 h-4 text-[#7B6E67]" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">{COPY.topCategories}</p>
        </div>
        <div className="mt-4 space-y-3">
          {topCategories.length === 0 ? (
            <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-xs text-[#7B6E67] font-semibold">Belum ada kategori pengeluaran bulan ini.</div>
          ) : (
            topCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <p className="text-xs font-bold text-[#1A2B38]">{category.name}</p>
                    <p className="mt-0.5 text-[10px] text-[#7B6E67] font-semibold">{category.count} transaksi</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-[#FF6B58]">{formatCurrency(category.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Wallet Insights */}
      {(qrisInsight || burnRate > 0 || topMerchants.length > 0 || recurringPatterns.length > 0) && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
              <Wallet className="w-4 h-4 text-[#7B6E67]" />
              <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">Rincian Analisis Saldo & Transaksi (30 hari terakhir)</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* QRIS */}
              {qrisInsight && (
                <div className="rounded-2xl bg-[#EBF7F6] p-4">
                  <div className="flex items-center gap-1 text-[#7B6E67] mb-1">
                    <QrCode className="w-3.5 h-3.5 text-[#29B9AA]" />
                    <p className="text-xs font-bold">QRIS 7 hari</p>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[#29B9AA]">{qrisInsight.count}x</p>
                  <p className="text-sm text-[#1A2B38] font-bold mt-0.5">{formatCurrency(qrisInsight.total)}</p>
                  <p className="mt-1 text-[11px] text-[#7B6E67] font-medium">Rata-rata {formatCurrency(qrisInsight.avg)} per transaksi</p>
                  {qrisInsight.count >= 5 && (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200/50 px-3 py-2 text-[10.5px] font-semibold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>QRIS cukup sering digunakan. Perhatikan pengeluaran kecil.</span>
                    </div>
                  )}
                </div>
              )}
              {/* Burn rate */}
              {burnRate > 0 && (
                <div className="rounded-2xl bg-[#FEF9F4] p-4">
                  <div className="flex items-center gap-1 text-[#7B6E67] mb-1">
                    <Flame className="w-3.5 h-3.5 text-[#FF6B58]" />
                    <p className="text-xs font-bold">Laju Pengeluaran Harian</p>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[#FF6B58]">{formatCurrency(burnRate)}</p>
                  <p className="mt-1 text-[11px] text-[#7B6E67] font-medium">Rata-rata pengeluaran per hari (30 hari terakhir)</p>
                  <p className="mt-0.5 text-[11px] text-[#7B6E67] font-semibold">Estimasi per bulan: ≈ {formatCurrency(burnRate * 30)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top merchants */}
          {topMerchants.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
                <Store className="w-4 h-4 text-[#7B6E67]" />
                <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">Tempat Belanja Terpopuler (30 hari)</p>
              </div>
              <div className="mt-3 space-y-2.5">
                {topMerchants.map((m, i) => (
                  <div key={m.merchant} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF7F6] text-xs font-extrabold text-[#29B9AA]">{i + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-[#1A2B38]">{m.merchant}</p>
                        <p className="text-[10px] text-[#7B6E67] font-semibold">{m.count}x transaksi</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[#FF6B58]">{formatCurrency(m.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring patterns */}
          {recurringPatterns.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
                <Repeat2 className="w-4 h-4 text-[#7B6E67]" />
                <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">Transaksi Rutin Terdeteksi Otomatis</p>
              </div>
              <div className="mt-3 space-y-2.5">
                {recurringPatterns.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3">
                    <div>
                      <p className="text-xs font-bold text-[#1A2B38]">{r.merchant}</p>
                      <p className="text-[10px] text-[#7B6E67] font-semibold">{r.dates.length}x dalam 90 hari terakhir</p>
                    </div>
                    <p className="text-xs font-bold text-[#1A2B38]">{formatCurrency(r.amount)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-[#7B6E67] font-medium leading-relaxed">
                * Pola di atas terdeteksi otomatis dari histori transaksi Anda. Anda dapat mendaftarkan tagihan tetap ini secara permanen di tab Rencana.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
