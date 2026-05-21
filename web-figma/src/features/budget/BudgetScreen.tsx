import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { getBudgetVsActual, getBudgetVsActualSummary, getSpendingRecommendations } from "../../services/comparisonService";
import { formatMonthLabel, getCurrentMonth, shiftMonth } from "../../utils/date";
import { formatCompactCurrency, formatCurrency } from "../../utils/format";

export default function BudgetScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [comparison, setComparison] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const loadData = async () => {
    try {
      const [comparisonData, summaryData, recommendationData] = await Promise.all([
        getBudgetVsActual(month),
        getBudgetVsActualSummary(month),
        getSpendingRecommendations(month),
      ]);
      setComparison(comparisonData);
      setSummary(summaryData);
      setRecommendations(recommendationData);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat budget vs actual.");
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const visibleRecommendations = useMemo(() => {
    if (showAllRecommendations || recommendations.length <= 4) return recommendations;
    return recommendations.slice(0, 4);
  }, [recommendations, showAllRecommendations]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
      <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5BAEE8]">Budget health</p>
        <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Lihat apakah rencana dan kenyataanmu masih sejalan.</h1>
        <p className="mt-3 text-sm text-[#7B6E67]">Bandingkan budget per kategori dengan pengeluaran aktualmu bulan ini.</p>
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
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs text-[#7B6E67]">Total Budget</p>
              <p className="mt-1 text-2xl font-bold text-[#1A2B38]">{formatCompactCurrency(summary.totalBudget)}</p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs text-[#7B6E67]">Total Realisasi</p>
              <p className="mt-1 text-2xl font-bold text-[#FF6B58]">{formatCompactCurrency(summary.totalActual)}</p>
            </div>
          </div>
          <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Overall utilization</p>
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
                <p className="text-xs text-[#7B6E67]">On track</p>
                <p className="mt-1 text-lg font-bold text-[#1A2B38]">{summary.onTrackCount}</p>
              </div>
              <div className="rounded-2xl bg-[#FEF9F4] p-4">
                <p className="text-xs text-[#7B6E67]">Under</p>
                <p className="mt-1 text-lg font-bold text-[#29B9AA]">{summary.underBudgetCount}</p>
              </div>
              <div className="rounded-2xl bg-[#FEF9F4] p-4">
                <p className="text-xs text-[#7B6E67]">Over</p>
                <p className="mt-1 text-lg font-bold text-[#FF6B58]">{summary.overBudgetCount}</p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Recommendations</p>
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

      <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Category breakdown</p>
            <p className="mt-2 text-sm text-[#7B6E67]">Kartu-kartu ini diringkas biar nggak terlalu memanjang ke bawah, tapi tetap enak dibaca per kategori.</p>
          </div>
          <p className="text-xs font-semibold text-[#7B6E67]">{comparison.length} kategori aktif</p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {comparison.length === 0 ? (
            <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada kategori untuk dibandingkan.</div>
          ) : (
            comparison.map((item) => {
              const progressColor = item.utilization > 100 ? "#FF6B58" : item.utilization > 80 ? "#FFB347" : item.categoryColor;
              return (
                <div key={item.categoryId} className="rounded-2xl bg-[#FEF9F4] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B38]">{item.categoryName}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{item.transactionCount} transaksi</p>
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
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7B6E67]">Budget</p>
                      <p className="mt-1 text-sm font-semibold text-[#1A2B38]">{formatCurrency(item.budget)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7B6E67]">Actual</p>
                      <p className="mt-1 text-sm font-semibold text-[#1A2B38]">{formatCurrency(item.actual)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7B6E67]">Variance</p>
                      <p className={`mt-1 text-sm font-semibold ${item.variance >= 0 ? "text-[#1A2B38]" : "text-[#FF6B58]"}`}>{formatCurrency(item.variance)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
