import { Sparkles, Banknote, AlertCircle, CalendarClock, ArrowUpRight, Pencil } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

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
  const { t } = useLanguage();

  if (!safeToSpend) {
    return (
      <div data-tour-id="home-safe-to-spend-card" className="md:col-span-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm relative overflow-hidden animate-pulse">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-[#29B9AA]/5 to-transparent blur-2xl"></div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-250/20 rounded-full"></div>
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-3 h-10 w-48 bg-gray-250/30 rounded"></div>
        <div className="mt-2 h-3 w-72 bg-gray-200 rounded"></div>
        
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-black/5 pt-4">
          <div className="p-2 -m-2">
            <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="p-2 -m-2">
            <div className="h-3 w-20 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="p-2 -m-2">
            <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-tour-id="home-safe-to-spend-card" className="md:col-span-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm relative overflow-hidden">
      <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-[#29B9AA]/10 to-transparent blur-2xl"></div>
      
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#29B9AA]" />
        <p className="text-xs font-semibold tracking-wider text-[#29B9AA] uppercase">{t("home.safeToSpendToday", "Safe-To-Spend Hari Ini")}</p>
      </div>
      
      <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1A2B38]">
        Rp {safeToSpend.safeToSpendToday.toLocaleString("id-ID")}
      </h2>
      <p className="mt-2 text-xs text-[#7B6E67] max-w-md">
        {t("home.safeToSpendDesc", "Sisa budget jajan aman untuk hari ini agar tidak memotong simpanan atau tagihan mendatang.")}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-black/5 pt-4">
        <button
          onClick={() => onNavigateTab?.("wallets")}
          className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29B9AA] focus-visible:ring-offset-2 rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Lihat detail Dana Bersih"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <Banknote className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">{t("home.cleanCash", "Dana Bersih")}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#29B9AA] group-hover:underline">Rp {safeToSpend.availableMoney.toLocaleString("id-ID")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#29B9AA] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </button>
        
        <button
          onClick={() => onNavigateTab?.("recurring")}
          className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB347] focus-visible:ring-offset-2 rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Lihat detail Tagihan Mendatang"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFB347] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">{t("home.upcomingBills", "Tagihan Mendatang")}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#FFB347] group-hover:underline">Rp {safeToSpend.upcomingBills.toLocaleString("id-ID")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#FFB347] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </button>
        
        <button
          onClick={onEditPayday}
          className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29B9AA] focus-visible:ring-offset-2 rounded-2xl hover:bg-[#FEF9F4] active:bg-[#FEF9F4] active:scale-[0.97] p-2 -m-2 transition-all"
          aria-label="Ubah Tanggal Gajian"
        >
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <CalendarClock className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0 group-hover:scale-105 transition-transform" />
            <p className="text-[10px] font-bold uppercase tracking-wider group-hover:text-[#1A2B38] transition-colors">{t("home.daysToPayday", "Hari ke Gajian")}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm font-bold text-[#1A2B38] group-hover:underline">
              {safeToSpend.daysUntilNextIncome} {t("home.daysToPaydaySuffix", "hari")}
            </p>
            <Pencil className="w-3 h-3 text-[#7B6E67] opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>
    </div>
  );
}
