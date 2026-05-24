import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { calculateMonthlySummary, getCategoryBreakdown, getDailyAverage, getDailySpendingTrend, getTopCategories } from "../../services/analyticsService";
import { getQrisInsight, getDailyBurnRate, getTopMerchants, detectRecurringPatterns } from "../../services/walletAnalyticsService";
import { formatMonthLabel, getCurrentMonth, shiftMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

const COPY = {
  id: {
    title: "Lihat pola pengeluaran bulananmu dalam satu kanvas yang lebih mudah dibaca.",
    subtitle: "Ringkasan ini fokus ke pola spending, kategori terbesar, dan ritme harian tanpa bikin angka terasa menumpuk.",
    heading: "Analytics",
    income: "Income",
    spending: "Spending",
    remaining: "Remaining",
    dailyAvg: "Daily Avg",
    byCategory: "Spending by category",
    trend: "Daily spending trend",
    topCategories: "Top categories",
  },
  en: {
    title: "See your monthly spending pattern in one canvas that feels easier to read.",
    subtitle: "This summary focuses on spending rhythm, biggest categories, and daily trend without overwhelming you with numbers.",
    heading: "Analytics",
    income: "Income",
    spending: "Spending",
    remaining: "Remaining",
    dailyAvg: "Daily Avg",
    byCategory: "Spending by category",
    trend: "Daily spending trend",
    topCategories: "Top categories",
  },
} as const;

export default function AnalyticsScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<any>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [copyLanguage, setCopyLanguage] = useState<"id" | "en">("id");

  // Wallet-based insights
  const [qrisInsight, setQrisInsight] = useState<any>(null);
  const [burnRate, setBurnRate] = useState(0);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<any[]>([]);

  const text = useMemo(() => COPY[copyLanguage], [copyLanguage]);

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
      toast.error(err.message || "Gagal memuat analytics.");
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
      <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#A78BFA]">{text.heading}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold text-[#1A2B38]">{text.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-[#7B6E67]">{text.subtitle}</p>
          </div>
          <div className="inline-flex rounded-full bg-[#F3EDE8] p-1 text-xs font-semibold">
            <button
              onClick={() => setCopyLanguage("id")}
              className={`rounded-full px-4 py-2 ${copyLanguage === "id" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67]"}`}
            >
              Indonesia
            </button>
            <button
              onClick={() => setCopyLanguage("en")}
              className={`rounded-full px-4 py-2 ${copyLanguage === "en" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67]"}`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm">
        <button onClick={() => setMonth((current) => shiftMonth(current, -1))} className="rounded-full bg-[#F3EDE8] px-4 py-2 text-xs font-semibold text-[#7B6E67]">
          Prev
        </button>
        <p className="text-sm font-bold text-[#1A2B38]">{formatMonthLabel(month)}</p>
        <button onClick={() => setMonth((current) => shiftMonth(current, 1))} className="rounded-full bg-[#F3EDE8] px-4 py-2 text-xs font-semibold text-[#7B6E67]">
          Next
        </button>
      </div>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">{text.income}</p>
            <p className="mt-1 text-xl font-bold text-[#1A2B38]">{formatCurrency(summary.income)}</p>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">{text.spending}</p>
            <p className="mt-1 text-xl font-bold text-[#FF6B58]">{formatCurrency(summary.totalSpending)}</p>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">{text.remaining}</p>
            <p className={`mt-1 text-xl font-bold ${summary.remaining >= 0 ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>{formatCurrency(summary.remaining)}</p>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">{text.dailyAvg}</p>
            <p className="mt-1 text-xl font-bold text-[#1A2B38]">{formatCurrency(dailyAverage)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{text.byCategory}</p>
          <div className="mt-4 h-[320px]">
            {categoryBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-[#FEF9F4] text-sm text-[#7B6E67]">Belum ada data category breakdown.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={105}>
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

        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{text.trend}</p>
          <div className="mt-4 h-[320px]">
            {dailyTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-[#FEF9F4] text-sm text-[#7B6E67]">Belum ada data trend harian.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3EDE8" />
                  <XAxis dataKey="day" tick={{ fill: "#7B6E67", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#7B6E67", fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="amount" stroke="#29B9AA" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{text.topCategories}</p>
        <div className="mt-4 space-y-3">
          {topCategories.length === 0 ? (
            <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada top categories untuk bulan ini.</div>
          ) : (
            topCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">{category.name}</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">{category.count} transaction(s)</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#FF6B58]">{formatCurrency(category.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Wallet Insights (from WalletTransaction data) */}
      {(qrisInsight || burnRate > 0 || topMerchants.length > 0 || recurringPatterns.length > 0) && (
        <>
          <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Wallet Insights — 30 hari terakhir</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* QRIS */}
              {qrisInsight && (
                <div className="rounded-2xl bg-[#EBF7F6] p-4">
                  <p className="text-xs font-semibold text-[#7B6E67]">QRIS 7 hari</p>
                  <p className="mt-1 text-2xl font-bold text-[#29B9AA]">{qrisInsight.count}x</p>
                  <p className="text-sm text-[#1A2B38] font-semibold">{formatCurrency(qrisInsight.total)}</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Rata-rata {formatCurrency(qrisInsight.avg)} per transaksi</p>
                  {qrisInsight.count >= 5 && (
                    <p className="mt-2 rounded-xl bg-[#FFB347]/20 px-3 py-1.5 text-xs font-semibold text-[#7B6E67]">
                      ⚠ QRIS sering — kecil-kecil jadi bukit.
                    </p>
                  )}
                </div>
              )}
              {/* Burn rate */}
              {burnRate > 0 && (
                <div className="rounded-2xl bg-[#FEF9F4] p-4">
                  <p className="text-xs font-semibold text-[#7B6E67]">Burn rate harian</p>
                  <p className="mt-1 text-2xl font-bold text-[#FF6B58]">{formatCurrency(burnRate)}</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Rata-rata pengeluaran wallet per hari (30 hari)</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Per bulan ≈ {formatCurrency(burnRate * 30)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top merchants */}
          {topMerchants.length > 0 && (
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Merchant terbanyak (30 hari)</p>
              <div className="mt-3 space-y-2">
                {topMerchants.map((m, i) => (
                  <div key={m.merchant} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EBF7F6] text-xs font-bold text-[#29B9AA]">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B38]">{m.merchant}</p>
                        <p className="text-xs text-[#7B6E67]">{m.count}x transaksi</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#FF6B58]">{formatCurrency(m.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring patterns */}
          {recurringPatterns.length > 0 && (
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Pola transaksi berulang (terdeteksi otomatis)</p>
              <div className="mt-3 space-y-2">
                {recurringPatterns.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B38]">{r.merchant}</p>
                      <p className="text-xs text-[#7B6E67]">{r.dates.length}x dalam 90 hari</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A2B38]">{formatCurrency(r.amount)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-[#7B6E67]">
                Pola ini terdeteksi dari histori transaksi wallet. Cek tab Recurring untuk tandai sebagai tagihan tetap.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
