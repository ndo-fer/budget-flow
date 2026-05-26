import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Lightbulb,
  PiggyBank,
  ArrowDownCircle,
  Target,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  Plus
} from "lucide-react";
import { T, font } from "./tokens";
import { getCatColor, rp, fmtMonth, offsetMonth } from "./usePreviewData";
import { getBudgetVsActual, getBudgetVsActualSummary, getSpendingRecommendations } from "../../services/comparisonService";
import CategoryModal from "../../components/modals/CategoryModal";
import { toast } from "../../utils/toast";

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

interface BudgetScreenPreviewProps {
  month: string;
  onMonthChange: (m: string) => void;
  onRefresh: () => void;
}

export default function BudgetScreenPreview({ month, onMonthChange, onRefresh }: BudgetScreenPreviewProps) {
  const [comparison, setComparison] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const [comparisonData, summaryData, recommendationData] = await Promise.all([
        getBudgetVsActual(month),
        getBudgetVsActualSummary(month),
        getSpendingRecommendations(month).catch(() => []),
      ]);
      setComparison(comparisonData);
      setSummary(summaryData);
      setRecommendations(recommendationData);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat budget vs actual.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, [month]);

  const handleSaved = () => {
    loadComparisonData();
    onRefresh(); // Refresh parent V2 states
  };

  const isCurrentMonth = month === new Date().toISOString().slice(0, 7);

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Month Navigator */}
      <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", ...card(), padding: "12px 16px", justifyContent: "space-between" }}>
        <button
          onClick={() => onMonthChange(offsetMonth(month, -1))}
          style={{ width: 36, height: 36, borderRadius: T.r.btn, border: `1px solid ${T.border}`, background: T.surface2, cursor: "pointer", color: T.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={16} />
        </button>
        <p style={font(14, 700, T.textPrimary)}>{fmtMonth(month)}</p>
        <button
          onClick={() => onMonthChange(offsetMonth(month, +1))}
          disabled={isCurrentMonth}
          style={{ width: 36, height: 36, borderRadius: T.r.btn, border: `1px solid ${isCurrentMonth ? T.border + "40" : T.border}`, background: T.surface2, cursor: isCurrentMonth ? "not-allowed" : "pointer", color: isCurrentMonth ? T.textMuted : T.textSecondary, display: "flex", alignItems: "center", justifyContent: "center", opacity: isCurrentMonth ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overview Cards */}
      {loading ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <Skeleton w="100%" h={80} r={16} />
          <Skeleton w="100%" h={80} r={16} />
        </div>
      ) : summary ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ ...card(), padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <PiggyBank size={14} color={T.teal} />
              <p style={font(9, 700, T.textLabel, { letterSpacing: "0.1em", textTransform: "uppercase" })}>Total Rencana</p>
            </div>
            <p style={font(20, 700, T.textPrimary)}>{rp(summary.totalBudget)}</p>
          </div>

          <div style={{ ...card(), padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ArrowDownCircle size={14} color={T.crimson} />
              <p style={font(9, 700, T.textLabel, { letterSpacing: "0.1em", textTransform: "uppercase" })}>Total Aktual</p>
            </div>
            <p style={font(20, 700, T.crimson)}>{rp(summary.totalActual)}</p>
          </div>
        </div>
      ) : null}

      {/* Overall Utilization Card */}
      {loading ? (
        <Skeleton w="100%" h={140} r={32} />
      ) : summary ? (
        <div style={{ ...card(), padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Target size={14} color={T.iris} />
                <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Pemanfaatan Budget</p>
              </div>
              <p style={font(28, 700, T.textPrimary, { letterSpacing: "-0.4px" })}>{Math.round(summary.utilizationPercent)}%</p>
            </div>
            <div style={{ textAlign: "right" as any }}>
              <p style={font(11, 700, summary.totalVariance >= 0 ? T.teal : T.crimson)}>
                {summary.totalVariance >= 0 ? `Sisa ${rp(summary.totalVariance)}` : `Over ${rp(Math.abs(summary.totalVariance))}`}
              </p>
            </div>
          </div>

          <div style={{ height: 10, borderRadius: T.r.chip, background: T.border, overflow: "hidden", marginBottom: 16 }}>
            <div style={{
              height: "100%", width: `${Math.min(summary.utilizationPercent, 100)}%`, borderRadius: T.r.chip,
              background: summary.utilizationPercent > 100 ? T.crimson : summary.utilizationPercent > 80 ? T.sunbeam : T.teal,
              transition: "width 0.8s ease",
            }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "On Track", val: summary.onTrackCount, color: T.teal, icon: CheckCircle2 },
              { label: "Under", val: summary.underBudgetCount, color: T.iris, icon: TrendingDown },
              { label: "Over", val: summary.overBudgetCount, color: T.crimson, icon: AlertTriangle },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} style={{ background: T.surface2, borderRadius: 12, padding: "10px", textAlign: "center" as any, border: `1px solid ${T.border}40` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                  <Icon size={11} color={color} />
                  <span style={font(9, 700, T.textSecondary, { textTransform: "uppercase" })}>{label}</span>
                </div>
                <p style={font(14, 700, T.textPrimary)}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recommendations Banner */}
      {!loading && recommendations.length > 0 && (
        <div style={{ ...card(), background: "linear-gradient(135deg, #2b1d03 0%, #171001 70%, #3a2200 100%)", borderColor: `${T.sunbeam}40`, padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Lightbulb size={16} color={T.sunbeam} />
            <p style={font(10, 800, T.sunbeam, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Rekomendasi Analisis</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommendations.map((item, idx) => (
              <div key={idx} style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: 12, padding: "10px 14px", ...font(12, 500, T.textPrimary) }}>
                {item.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-category budgets Breakdown */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Budget Per Kategori</p>
          <button
            onClick={() => { setSelectedCategory(null); setShowCategoryModal(true); }}
            style={{
              padding: "5px 12px", borderRadius: T.r.chip, border: "none", background: T.iris,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4
            }}
          >
            <Plus size={11} color="#fff" />
            <span style={font(10, 700, "#fff")}>Tambah Kategori</span>
          </button>
        </div>

        {loading ? (
          [1, 2].map(i => <Skeleton key={i} w="100%" h={100} r={16} style={{ marginBottom: 10 }} />)
        ) : comparison.length === 0 ? (
          <div style={{ ...card(), padding: 32, textAlign: "center" as any }}>
            <p style={font(13, 500, T.textMuted)}>Belum ada budget kategori</p>
            <p style={font(11, 400, T.textMuted, { marginTop: 6 })}>Tambahkan kategori budget Anda dengan klik tombol di atas.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comparison.map((item, i) => {
              const pct = Math.min(item.utilization, 100);
              const over = item.status === "over";
              const c = getCatColor(i, item.categoryColor);
              return (
                <div key={item.categoryId} style={{ ...card(), padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: T.r.icon, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.fill }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={font(13, 700, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{item.categoryName}</p>
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
                          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                        >
                          <Edit size={12} color={T.textSecondary} />
                        </button>
                      </div>
                      <p style={font(11, 500, T.textSecondary, { marginTop: 2 })}>{item.transactionCount} transaksi</p>
                    </div>

                    <div style={{ textAlign: "right" as any }}>
                      <p style={font(13, 800, over ? T.crimson : c.fill)}>{Math.round(item.utilization)}%</p>
                    </div>
                  </div>

                  <div style={{ height: 6, borderRadius: T.r.chip, background: T.border, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: T.r.chip,
                      background: over ? T.crimson : c.fill,
                      transition: "width 0.6s ease"
                    }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, borderTop: `1px solid ${T.border}40`, paddingTop: 8 }}>
                    <div>
                      <span style={font(8, 700, T.textSecondary, { textTransform: "uppercase" })}>Budget</span>
                      <p style={font(11, 700, T.textPrimary, { marginTop: 2 })}>{rp(item.budget)}</p>
                    </div>
                    <div>
                      <span style={font(8, 700, T.textSecondary, { textTransform: "uppercase" })}>Realisasi</span>
                      <p style={font(11, 700, T.textPrimary, { marginTop: 2 })}>{rp(item.actual)}</p>
                    </div>
                    <div style={{ textAlign: "right" as any }}>
                      <span style={font(8, 700, T.textSecondary, { textTransform: "uppercase" })}>{item.variance >= 0 ? "Sisa" : "Over"}</span>
                      <p style={font(11, 700, item.variance >= 0 ? T.teal : T.crimson, { marginTop: 2 })}>{rp(Math.abs(item.variance))}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        open={showCategoryModal}
        category={selectedCategory}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
