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
import { toast } from "sonner";
import ExpenseModal from "../../components/modals/ExpenseModal";

// Sub-components
import NativePermissionAlert from "./components/NativePermissionAlert";
import SafeToSpendCard from "./components/SafeToSpendCard";
import DailyBudgetLimitCard from "./components/DailyBudgetLimitCard";
import QuickChecklistActions from "./components/QuickChecklistActions";
import ProgressRencanaCard from "./components/ProgressRencanaCard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

interface HomeScreenProps {
  onNavigateTab: (tabId: string) => void;
  openExpenseComposerTick: number;
}

export default function HomeScreen({ onNavigateTab, openExpenseComposerTick }: HomeScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "analytics">("overview");
  const [month] = useState(getCurrentMonth());
  
  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
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

  const loadData = async () => {
    setIsLoading(true);
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
    } catch (err) {
      console.error("Error loading home dashboard data:", err);
      toast.error("Gagal memuat data dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, openExpenseComposerTick]);

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

  useEffect(() => {
    if (openExpenseComposerTick > 0) {
      setIsExpenseModalOpen(true);
    }
  }, [openExpenseComposerTick]);

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

      {/* Upper Title and SubTabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Beranda</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1A2B38]">Estimated Financials</h1>
        </div>
        <div className="flex rounded-2xl bg-[#F3EDE8] p-1 shadow-inner">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "overview" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "analytics" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics & Insights
          </button>
        </div>
      </div>

      {activeSubTab === "overview" ? (
        <div className="grid gap-6 md:grid-cols-3">
          <SafeToSpendCard safeToSpend={safeToSpend} />
          <DailyBudgetLimitCard safeToSpend={safeToSpend} />
          <QuickChecklistActions onNavigateTab={onNavigateTab} />
          <ProgressRencanaCard month={month} monthlyPlan={monthlyPlan} />
        </div>
      ) : (
        <AnalyticsDashboard 
          dailyAverage={dailyAverage}
          monthlyPlan={monthlyPlan}
          dailyTrend={dailyTrend}
          categoryBreakdown={categoryBreakdown}
          safeToSpend={safeToSpend}
        />
      )}

      {/* Expense Modal */}
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={loadData} 
      />
    </div>
  );
}

