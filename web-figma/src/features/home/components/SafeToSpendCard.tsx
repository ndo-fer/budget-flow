import { Sparkles, Banknote, AlertCircle, CalendarClock } from "lucide-react";

interface SafeToSpendCardProps {
  safeToSpend: {
    safeToSpendToday: number;
    availableMoney: number;
    upcomingBills: number;
    daysUntilNextIncome: number;
  } | null;
  onNavigateTab?: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
}

export default function SafeToSpendCard({ safeToSpend, onNavigateTab }: SafeToSpendCardProps) {
  return (
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
        <button
          onClick={() => onNavigateTab?.("wallets")}
          className="text-left group hover:opacity-85 transition-opacity focus:outline-none"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <Banknote className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">Dana Bersih</p>
          </div>
          <p className="mt-0.5 text-sm font-bold text-[#1A2B38] group-hover:underline">Rp {(safeToSpend?.availableMoney ?? 0).toLocaleString("id-ID")}</p>
        </button>
        
        <button
          onClick={() => onNavigateTab?.("recurring")}
          className="text-left group hover:opacity-85 transition-opacity focus:outline-none"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFB347] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">Tagihan Mendatang</p>
          </div>
          <p className="mt-0.5 text-sm font-bold text-[#FFB347] group-hover:underline">Rp {(safeToSpend?.upcomingBills ?? 0).toLocaleString("id-ID")}</p>
        </button>
        
        <div>
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <CalendarClock className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Hari ke Gajian</p>
          </div>
          <p className="mt-0.5 text-sm font-bold text-[#1A2B38]">{(safeToSpend?.daysUntilNextIncome ?? 0)} hari</p>
        </div>
      </div>
    </div>
  );
}
