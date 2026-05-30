import { useEffect, useState } from "react";
import { Flame, Coins, Snowflake, Sparkles, Check } from "lucide-react";
import { 
  getUserGamification, 
  buyStreakFreeze, 
  recordZeroSpendDay, 
  UserGamification 
} from "../../../services/gamificationService";
import { getToday } from "../../../utils/date";
import { toast } from "../../../utils/toast";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function GamificationStreakCard() {
  const { t } = useLanguage();
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getUserGamification();
      setGamification(data);
    } catch (err: any) {
      console.error("Gagal memuat stats gamifikasi:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleUpdate = () => {
      loadStats(true);
    };
    window.addEventListener("wallet-transaction-added", handleUpdate);
    window.addEventListener("gamification-updated", handleUpdate);
    return () => {
      window.removeEventListener("wallet-transaction-added", handleUpdate);
      window.removeEventListener("gamification-updated", handleUpdate);
    };
  }, []);

  const handleZeroSpend = async () => {
    setActionLoading(true);
    try {
      await recordZeroSpendDay();
      toast.success(t("gamification.zeroSpendSuccess", "Zero-Spend Day berhasil dicatat! Streak harian aman! 🎉"));
      loadStats(true);
      window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
      window.dispatchEvent(new CustomEvent("gamification-updated"));
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat Zero-Spend.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyFreeze = async () => {
    if (!gamification) return;
    if (gamification.coins < 25) {
      toast.warning(
        t("gamification.insufficientCoins", "🪙 Koin Tidak Cukup! Kamu butuh 25 koin untuk membeli Streak Freeze.")
      );
      return;
    }
    setActionLoading(true);
    try {
      const updated = await buyStreakFreeze();
      setGamification(updated);
      toast.success(t("gamification.buyFreezeSuccess", "Berhasil membeli 1 Streak Freeze! ❄️"));
      window.dispatchEvent(new CustomEvent("gamification-updated"));
    } catch (err: any) {
      toast.error(err.message || "Gagal membeli Streak Freeze.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm flex flex-col justify-between h-[230px] animate-pulse">
        <div className="h-4 bg-black/5 rounded w-1/3"></div>
        <div className="h-10 bg-black/5 rounded w-2/3 my-4"></div>
        <div className="h-8 bg-black/5 rounded w-full"></div>
      </div>
    );
  }

  if (!gamification) return null;

  const todayStr = getToday();
  const isStreakActiveToday = gamification.last_streak_date === todayStr;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm hover:border-[#FF6B58]/30 transition-all flex flex-col justify-between min-h-[230px] relative overflow-hidden text-[#1A2B38]">
      {/* Decorative flame gradient */}
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-gradient-to-br from-orange-500/5 to-transparent blur-2xl"></div>

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className={`h-4.5 w-4.5 ${isStreakActiveToday ? "text-orange-500 fill-orange-500 animate-bounce" : "text-[#7B6E67]"}`} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">
              {t("gamification.streakTitle", "Streak Harian")}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-black/5 shadow-sm">
            <Coins className="h-3.5 w-3.5 text-yellow-500 fill-yellow-100/50" />
            <span className="text-xs font-extrabold text-[#1A2B38]">{gamification.coins}</span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4.5xl font-black tracking-tight text-[#1A2B38]">
            {gamification.current_streak}
          </span>
          <span className="text-xs font-bold text-[#7B6E67] uppercase">
            {t("gamification.days", "Hari")}
          </span>
        </div>

        <p className="mt-2 text-[11px] text-[#7B6E67] leading-relaxed">
          {isStreakActiveToday 
            ? t("gamification.streakActiveToday", "Keren! Streak kamu menyala hari ini. Tetap catat besok! 🔥")
            : t("gamification.streakInactiveToday", "Catat transaksi atau konfirmasi Zero-Spend untuk menjaga streak.")}
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {/* Zero-spend button */}
        {!isStreakActiveToday ? (
          <button
            onClick={handleZeroSpend}
            disabled={actionLoading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-[#FF6B58] hover:opacity-95 active:scale-[0.98] transition-all px-3 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50"
          >
            {t("gamification.confirmZeroSpend", "Hari Ini Tanpa Belanja 🤫")}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/50 py-2 text-xs font-bold text-emerald-600">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t("gamification.streakSaved", "Streak Hari Ini Aman")}</span>
          </div>
        )}

        {/* Mini shop drawer */}
        <div className="flex items-center justify-between border-t border-black/5 pt-2.5 text-xs">
          <div className="flex items-center gap-1 text-[#7B6E67]">
            <Snowflake className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Freeze: {gamification.streak_freezes}
            </span>
          </div>

          <button
            onClick={handleBuyFreeze}
            disabled={actionLoading}
            className="flex items-center gap-1 rounded-lg bg-white border border-black/5 hover:bg-[#FEF9F4] px-2 py-1 text-[10px] font-bold text-[#1A2B38] transition-colors"
          >
            <span>Beli</span>
            <Coins className="h-3 w-3 text-yellow-500" />
            <span>25</span>
          </button>
        </div>
      </div>
    </div>
  );
}
