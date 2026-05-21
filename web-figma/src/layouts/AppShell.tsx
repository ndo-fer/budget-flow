import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Clock,
  Repeat2,
  Settings,
  LineChart,
  Plus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import type { TabId } from "../types/models";
import { useAuth } from "../contexts/AuthContext";
import { useOnboarding } from "../contexts/OnboardingContext";
import HomeScreen from "../features/home/HomeScreen";
import BudgetScreen from "../features/budget/BudgetScreen";
import IncomeScreen from "../features/income/IncomeScreen";
import HistoryScreen from "../features/history/HistoryScreen";
import RecurringScreen from "../features/recurring/RecurringScreen";
import AnalyticsScreen from "../features/analytics/AnalyticsScreen";
import SettingsScreen from "../features/settings/SettingsScreen";

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "home", label: "Beranda", icon: LayoutDashboard },
  { id: "budget", label: "Budget", icon: BarChart3 },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "history", label: "History", icon: Clock },
  { id: "recurring", label: "Recurring", icon: Repeat2 },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "settings", label: "Settings", icon: Settings },
];

const TAB_PATHS: Record<TabId, string> = {
  home: "/home",
  budget: "/budget",
  income: "/income",
  history: "/history",
  recurring: "/recurring",
  analytics: "/analytics",
  settings: "/settings",
};

const resolveTabFromPath = (pathname: string): TabId | null => {
  const normalized = pathname === "/" ? "/home" : pathname.toLowerCase();
  const match = Object.entries(TAB_PATHS).find(([, path]) => path === normalized);
  return (match?.[0] as TabId | undefined) || null;
};

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { openOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "home";
    return resolveTabFromPath(window.location.pathname) || "home";
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openExpenseComposerTick, setOpenExpenseComposerTick] = useState(0);

  const activeNavItem = useMemo(() => NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0], [activeTab]);

  const navigateToTab = (tab: TabId, options?: { replace?: boolean }) => {
    setActiveTab(tab);
    setShowProfileMenu(false);

    if (typeof window === "undefined") return;
    const nextPath = TAB_PATHS[tab];
    if (window.location.pathname !== nextPath) {
      window.history[options?.replace ? "replaceState" : "pushState"]({}, "", nextPath);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromLocation = () => {
      const nextTab = resolveTabFromPath(window.location.pathname) || "home";
      setActiveTab(nextTab);
    };

    if (!resolveTabFromPath(window.location.pathname)) {
      window.history.replaceState({}, "", TAB_PATHS.home);
    }

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const renderScreen = () => {
    if (activeTab === "home") return <HomeScreen onNavigateTab={navigateToTab} openExpenseComposerTick={openExpenseComposerTick} />;
    if (activeTab === "budget") return <BudgetScreen />;
    if (activeTab === "income") return <IncomeScreen />;
    if (activeTab === "history") return <HistoryScreen />;
    if (activeTab === "recurring") return <RecurringScreen />;
    if (activeTab === "analytics") return <AnalyticsScreen />;
    return <SettingsScreen onOpenTutorial={openOnboarding} />;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Berhasil logout.");
    } catch (err: any) {
      toast.error(err.message || "Gagal logout.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FEF9F4]">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/5 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Budget Flow</p>
          <h1 className="mt-3 text-2xl font-bold text-[#1A2B38]">Daily finance companion</h1>
        </div>
        <div className="px-4 pt-4">
          <button
            onClick={() => {
              navigateToTab("home");
              setOpenExpenseComposerTick((current) => current + 1);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B58] to-[#E8503F] px-4 py-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah Expense
          </button>
        </div>
        <nav className="flex-1 space-y-2 px-3 py-4">
          {NAV_ITEMS.filter((item) => item.id !== "settings").map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  active ? "bg-[#29B9AA] text-white" : "text-[#7B6E67] hover:bg-[#F3EDE8] hover:text-[#1A2B38]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="relative border-t border-black/5 p-3">
          {showProfileMenu ? (
            <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-lg">
              <button className="w-full px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] hover:bg-[#FEF9F4]">
                {user?.email}
              </button>
              <button
                onClick={() => navigateToTab("settings")}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] hover:bg-[#FEF9F4]"
              >
                Settings
              </button>
              <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm font-semibold text-[#FF6B58] hover:bg-red-50">
                Logout
              </button>
            </div>
          ) : null}
          <button
            onClick={() => setShowProfileMenu((current) => !current)}
            className="flex w-full items-center gap-3 rounded-[24px] border border-black/5 bg-[#FEF9F4] px-3 py-3 hover:bg-[#F3EDE8]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#29B9AA] text-sm font-bold text-white">
              {(user?.email || "B").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-[#1A2B38]">{user?.email}</p>
              <p className="text-xs text-[#7B6E67]">Account & app settings</p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#7B6E67] transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-30 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button onClick={() => navigateToTab("home")} className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Budget Flow</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#1A2B38]">{activeNavItem.label}</p>
          </button>
          <button
            onClick={() => {
              navigateToTab("home");
              setOpenExpenseComposerTick((current) => current + 1);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#FF6B58] px-4 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={() => navigateToTab("settings")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF7F6] text-sm font-bold text-[#29B9AA]"
            aria-label="Open settings"
          >
            {(user?.email || "B").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>

      <main className="min-w-0 flex-1 pb-20 pt-[78px] lg:pb-0 lg:pt-0">{renderScreen()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white px-2 py-1 lg:hidden">
        <div className="grid grid-cols-6 items-center gap-1">
          {NAV_ITEMS.filter((item) => item.id !== "settings").map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`flex min-w-0 flex-col items-center rounded-2xl px-2 py-2 text-[10px] font-semibold ${
                  active ? "text-[#29B9AA]" : "text-[#7B6E67]"
                }`}
              >
                <Icon className="mb-1 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
