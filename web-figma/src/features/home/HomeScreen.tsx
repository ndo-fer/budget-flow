import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LayoutGrid, BarChart2 } from "lucide-react";
import { calculateSafeToSpend } from "../../services/safeToSpendService";
import { checkDailyBudget } from "../../services/alertService";
import { 
  getCategoryBreakdown, 
  getDailySpendingTrend, 
  getDailyAverage, 
  calculateMonthlySummary 
} from "../../services/analyticsService";
import { getCurrentPlan } from "../../services/planService";
import { getCurrentMonth, getToday } from "../../utils/date";
import { toast } from "../../utils/toast";
import { notifyDailyLimitExceeded, syncDailyLimitPersistentNotification } from "../../services/notificationService";

// Sub-components
import NativePermissionAlert from "./components/NativePermissionAlert";
import SafeToSpendCard from "./components/SafeToSpendCard";
import DailyBudgetLimitCard from "./components/DailyBudgetLimitCard";
import ProgressRencanaCard from "./components/ProgressRencanaCard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ModalShell from "../../components/modals/ModalShell";
import StarterChecklist from "./components/StarterChecklist";
import { useSpotlightTour } from "../../components/onboarding/SpotlightTourProvider";

interface HomeScreenProps {
  onNavigateTab: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
  activeTab?: string;
  searchParams?: string;
  clearSearchParams?: () => void;
}

export default function HomeScreen({ 
  onNavigateTab, 
  activeTab, 
  searchParams, 
  clearSearchParams 
}: HomeScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "analytics">("overview");
  const [month] = useState(getCurrentMonth());
  const { isActive: isTourActive } = useSpotlightTour();

  useEffect(() => {
    const query = searchParams || "";
    const params = new URLSearchParams(query);
    const tabParam = params.get("tab");

    if (activeTab === "analytics" || tabParam === "analytics") {
      setActiveSubTab("analytics");
      clearSearchParams?.();
      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else if (activeTab === "home" && tabParam === "overview") {
      setActiveSubTab("overview");
      clearSearchParams?.();
      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeTab, searchParams, clearSearchParams]);
  
  // Modals state
  const [showPaydayModal, setShowPaydayModal] = useState(false);
  const [paydayInput, setPaydayInput] = useState(() => {
    try {
      return localStorage.getItem("bf_payday_day_of_month") || "25";
    } catch {
      return "25";
    }
  });

  const handleSavePayday = () => {
    let day = parseInt(paydayInput, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error("Tanggal gajian harus bernilai 1 - 31.");
      return;
    }
    localStorage.setItem("bf_payday_day_of_month", String(day));
    toast.success(`Tanggal gajian berhasil diubah ke tanggal ${day} setiap bulan.`);
    setShowPaydayModal(false);
    loadData(true); // silent reload
  };
  
  // Safe to Spend metrics
  const [safeToSpend, setSafeToSpend] = useState<any>(null);
  const [dailyBudgetStatus, setDailyBudgetStatus] = useState<any>(null);
  const [monthlyPlan, setMonthlyPlan] = useState<any>(null);
  
  // Analytics data
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [androidNotifEnabled, setAndroidNotifEnabled] = useState<boolean | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const dateStr = getToday();
      const [
        stsData,
        dailyB,
        planData,
        breakdownData,
        trendData,
        avgData,
        monthlySum
      ] = await Promise.all([
        calculateSafeToSpend(),
        checkDailyBudget(dateStr),
        getCurrentPlan(month),
        getCategoryBreakdown(month),
        getDailySpendingTrend(month),
        getDailyAverage(month),
        calculateMonthlySummary(month)
      ]);

      setSafeToSpend(stsData);
      setDailyBudgetStatus(dailyB);
      setMonthlyPlan({
        ...planData,
        totalSpending: monthlySum.totalSpending,
        remaining: monthlySum.remaining,
        percentUsed: monthlySum.budgetUsagePercent
      });
      setCategoryBreakdown(breakdownData);
      setDailyTrend(trendData);
      setDailyAverage(avgData);

      // 🔔 Trigger native/web notification when daily limit is exceeded
      if (stsData.isOverDailyLimit && stsData.overAmount > 0) {
        notifyDailyLimitExceeded(stsData.overAmount);
      }
      syncDailyLimitPersistentNotification(stsData.isOverDailyLimit, stsData.overAmount);
    } catch (err) {
      console.error("Error loading home dashboard data:", err);
      toast.error("Gagal memuat data dashboard.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTransactionAdded = () => {
      loadData(true);
    };
    window.addEventListener("wallet-transaction-added", handleTransactionAdded);
    return () => {
      window.removeEventListener("wallet-transaction-added", handleTransactionAdded);
    };
  }, [month]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkAccess = async () => {
      try {
        const { registerPlugin } = await import("@capacitor/core");
        const NotificationReceiver = registerPlugin<any>("NotificationReceiver");
        const res = await NotificationReceiver.checkNotificationAccess();
        setAndroidNotifEnabled(res.enabled);
      } catch {}
    };

    checkAccess();

    const checkState = async () => {
      const { App: CapApp } = await import("@capacitor/app");
      const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          checkAccess();
        }
      });
      return listener;
    };

    const stateListenerPromise = checkState();

    return () => {
      stateListenerPromise.then((l) => l.remove());
    };
  }, []);

  // Removed openExpenseComposerTick handler

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#29B9AA] border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-[#7B6E67]">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      <NativePermissionAlert 
        androidNotifEnabled={androidNotifEnabled} 
        setAndroidNotifEnabled={setAndroidNotifEnabled} 
      />

      {!isTourActive && (
        <StarterChecklist 
          onNavigateTab={onNavigateTab} 
          onOpenRecordHub={() => window.dispatchEvent(new CustomEvent("bf-open-record-sheet"))}
        />
      )}

      {/* Upper Title and SubTabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Beranda</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1A2B38]">Ringkasan Keuangan</h1>
          <p className="text-xs text-[#7B6E67] mt-1">Pantau estimasi kondisi keuangan harian (Safe-To-Spend) dan anggaran belanja bulanan Anda.</p>
        </div>
        <div className="flex w-full sm:w-auto sm:inline-flex rounded-2xl bg-[#F3EDE8] p-1 shadow-inner self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`flex-1 sm:flex-initial justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] flex items-center gap-1.5 ${
              activeSubTab === "overview" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Ringkasan
          </button>
          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`flex-1 sm:flex-initial justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] flex items-center gap-1.5 ${
              activeSubTab === "analytics" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analisis
          </button>
        </div>
      </div>

      {activeSubTab === "overview" ? (
        <div className="grid gap-6 md:grid-cols-3">
          <SafeToSpendCard 
            safeToSpend={safeToSpend} 
            onNavigateTab={onNavigateTab} 
            onEditPayday={() => {
              try {
                setPaydayInput(localStorage.getItem("bf_payday_day_of_month") || "25");
              } catch {}
              setShowPaydayModal(true);
            }} 
          />
          <DailyBudgetLimitCard safeToSpend={safeToSpend} onNavigateTab={onNavigateTab} />
          <ProgressRencanaCard month={month} monthlyPlan={monthlyPlan} />
        </div>
      ) : (
        <AnalyticsDashboard 
          dailyAverage={dailyAverage}
          monthlyPlan={monthlyPlan}
          dailyTrend={dailyTrend}
          categoryBreakdown={categoryBreakdown}
          safeToSpend={safeToSpend}
          onNavigateTab={onNavigateTab}
        />
      )}

      <ModalShell
        open={showPaydayModal}
        title="Ubah Tanggal Gajian"
        subtitle="Sesuaikan siklus perhitungan Safe-To-Spend harian Anda."
        onClose={() => setShowPaydayModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowPaydayModal(false)}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#7B6E67]"
            >
              Batal
            </button>
            <button
              onClick={handleSavePayday}
              className="rounded-2xl bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white"
            >
              Simpan
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7B6E67]">Tanggal Gajian (1 - 31)</label>
            <p className="text-xs text-[#7B6E67] mt-1 mb-2">Siklus belanja aman harian (Safe-to-Spend) Anda akan dihitung ulang berdasarkan sisa hari menuju tanggal gajian ini.</p>
            <input
              type="number"
              min="1"
              max="31"
              required
              className="w-full rounded-2xl border border-[#FEF9F4] bg-[#FEF9F4] px-4 py-3.5 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={paydayInput}
              onChange={(e) => setPaydayInput(e.target.value)}
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
