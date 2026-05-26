import { Sparkles, Banknote, AlertCircle, CalendarClock, ArrowUpRight, Pencil } from "lucide-react";

interface SafeToSpendCardProps {
  safeToSpend: {
    safeToSpendToday: number;
    availableMoney: number;
    upcomingBills: number;
    daysUntilNextIncome: number;
  } | null;
  onNavigateTab?: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
  onEditPayday?: () => void;
}

export default function SafeToSpendCard({ safeToSpend, onNavigateTab, onEditPayday }: SafeToSpendCardProps) {
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
          className="text-left group focus:outline-none rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Lihat detail Dana Bersih"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <Banknote className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">Dana Bersih</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#29B9AA] group-hover:underline">Rp {(safeToSpend?.availableMoney ?? 0).toLocaleString("id-ID")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#29B9AA] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </button>
        
        <button
          onClick={() => onNavigateTab?.("recurring")}
          className="text-left group focus:outline-none rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Lihat detail Tagihan Mendatang"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFB347] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">Tagihan Mendatang</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#FFB347] group-hover:underline">Rp {(safeToSpend?.upcomingBills ?? 0).toLocaleString("id-ID")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#FFB347] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </button>
        
        <button
          onClick={onEditPayday}
          className="text-left group focus:outline-none rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Ubah Tanggal Gajian"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <CalendarClock className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">Hari ke Gajian</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#1A2B38] group-hover:underline">{(safeToSpend?.daysUntilNextIncome ?? 0)} hari</p>
            <Pencil className="w-3 h-3 text-[#7B6E67] opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>
    </div>
  );
}
