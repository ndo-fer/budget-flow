import { CalendarRange, TrendingUp, TrendingDown, Layers } from "lucide-react";

interface ProgressRencanaCardProps {
  month: string;
  monthlyPlan: {
    income: number;
    totalSpending: number;
    remaining: number;
    percentUsed: number;
  } | null;
}

export default function ProgressRencanaCard({ month, monthlyPlan }: ProgressRencanaCardProps) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm md:col-span-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Progress Rencana Bulan Ini</h3>
        </div>
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
          <p className={`mt-1 text-lg font-bold ${monthlyPlan?.remaining && monthlyPlan.remaining < 0 ? "text-[#FF6B58]" : "text-[#29B9AA]"}`}>
            Rp {monthlyPlan?.remaining?.toLocaleString("id-ID") || "0"}
          </p>
        </div>
      </div>

      {/* Overall Monthly budget progress bar */}
      <div className="mt-5 space-y-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-[#7B6E67]">Pemakaian Budget Rencana</span>
          <span className={monthlyPlan && monthlyPlan.percentUsed > 100 ? "text-[#FF6B58]" : "text-[#1A2B38]"}>
            {Math.round(monthlyPlan?.percentUsed || 0)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              monthlyPlan && monthlyPlan.percentUsed > 90 ? "bg-[#FF6B58]" : "bg-[#29B9AA]"
            }`} 
            style={{ width: `${Math.min(monthlyPlan?.percentUsed || 0, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
