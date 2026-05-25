import { Target, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface DailyBudgetLimitCardProps {
  safeToSpend: {
    isOverDailyLimit: boolean;
    todaySpent: number;
    safeToSpendPerDay: number;
    safeToSpendToday: number;
    overAmount: number;
  } | null;
}

export default function DailyBudgetLimitCard({ safeToSpend }: DailyBudgetLimitCardProps) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#7B6E67]">
            <Target className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Batas Harian</span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            safeToSpend?.isOverDailyLimit ? "bg-red-50 text-[#FF6B58]" : "bg-[#EBF7F6] text-[#29B9AA]"
          }`}>
            {safeToSpend?.isOverDailyLimit ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                Over limit
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Aman
              </>
            )}
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
  );
}
