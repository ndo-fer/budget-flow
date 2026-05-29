import { Target, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";

interface DailyBudgetLimitCardProps {
  safeToSpend: {
    isOverDailyLimit: boolean;
    todaySpent: number;
    safeToSpendPerDay: number;
    safeToSpendToday: number;
    overAmount: number;
  } | null;
  onNavigateTab?: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
}

export default function DailyBudgetLimitCard({ safeToSpend, onNavigateTab }: DailyBudgetLimitCardProps) {
  const isOver = safeToSpend?.isOverDailyLimit ?? false;
  const pct = safeToSpend?.safeToSpendPerDay
    ? Math.min((safeToSpend.todaySpent / safeToSpend.safeToSpendPerDay) * 100, 100)
    : 0;

  return (
    <>
      {/* Inject pulse animation once */}
      <style>{`
        @keyframes bf-limit-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        .bf-over-pulse {
          animation: bf-limit-pulse 1.8s ease-in-out infinite;
        }
        @keyframes bf-amount-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-3px); }
          40%      { transform: translateX(3px); }
          60%      { transform: translateX(-2px); }
          80%      { transform: translateX(2px); }
        }
        .bf-amount-shake {
          animation: bf-amount-shake 0.5s ease-in-out;
          animation-delay: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>

      <div
        onClick={() => onNavigateTab?.("history")}
        className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between cursor-pointer transition-all group text-left ${
          isOver
            ? "bg-red-50 border-red-400 bf-over-pulse hover:border-red-500"
            : "bg-white border-black/10 hover:border-[#29B9AA]/30 hover:shadow-md"
        }`}
      >
        {/* Header row */}
        <div>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 ${isOver ? "text-red-700" : "text-[#7B6E67]"}`}>
              <Target className={`w-3.5 h-3.5 flex-shrink-0 group-hover:scale-105 transition-transform ${isOver ? "text-red-500" : "text-[#29B9AA]"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isOver ? "text-red-700" : "group-hover:text-[#1A2B38] transition-colors"}`}>
                Pemakaian Harian
              </span>
            </div>

            {/* Status badge */}
            {isOver ? (
              <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm shadow-red-500/30">
                <AlertTriangle className="w-3 h-3" />
                Lewat Batas!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#EBF7F6] text-[#29B9AA]">
                <CheckCircle2 className="w-3 h-3" />
                Aman
              </span>
            )}
          </div>

          {/* Amount */}
          <div className={`mt-4 ${isOver ? "bf-amount-shake" : ""}`}>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isOver ? "text-red-700" : "text-[#1A2B38] group-hover:underline"}`}>
                Rp {(safeToSpend?.todaySpent ?? 0).toLocaleString("id-ID")}
              </span>
              <span className={`text-xs ${isOver ? "text-red-500" : "text-[#7B6E67]"}`}>terpakai</span>
            </div>
            <p className={`text-xs mt-0.5 ${isOver ? "text-red-500" : "text-[#7B6E67]"}`}>
              Batas aman harian: Rp {safeToSpend?.safeToSpendPerDay ? Math.round(safeToSpend.safeToSpendPerDay).toLocaleString("id-ID") : "0"}
            </p>
          </div>

          {/* Progress bar */}
          <div className={`mt-4 h-2.5 w-full overflow-hidden rounded-full ${isOver ? "bg-red-200" : "bg-[#F3EDE8]"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-[#29B9AA]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Bottom info / danger banner */}
        {isOver ? (
          <div className="mt-4 rounded-xl bg-red-600 px-4 py-3 flex items-start gap-2.5 shadow-sm shadow-red-500/20">
            <TrendingDown className="h-4 w-4 text-white shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-extrabold text-white leading-snug">
                Kelebihan Rp {(safeToSpend?.overAmount ?? 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-red-100 mt-0.5 leading-snug">
                Kurangi pengeluaran besok — lihat riwayat transaksi hari ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FEF9F4] p-3 text-[11px] font-semibold text-[#7B6E67]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#29B9AA] mt-0.5" />
            <p>
              Kamu masih punya sisa Rp {(safeToSpend?.safeToSpendToday ?? 0).toLocaleString("id-ID")} budget jajan hari ini.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
