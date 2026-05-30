import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Clock,
  Settings,
  LineChart,
  Plus,
  ChevronDown,
  Wallet,
  User,
  LogOut,
  X,
  AlertCircle,
  Flame,
  Coins,
  Snowflake
} from "lucide-react";
import { toast } from "../utils/toast";
import type { TabId } from "../types/models";
import { useAuth } from "../contexts/AuthContext";
import { useOnboarding } from "../contexts/OnboardingContext";
import HomeScreen from "../features/home/HomeScreen";
import WalletsScreen from "../features/wallets/WalletsScreen";
import BudgetScreen from "../features/budget/BudgetScreen";
import HistoryScreen from "../features/history/HistoryScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import { Capacitor } from "@capacitor/core";
import { getWallets, adjustWalletBalance, getWalletStatus } from "../services/walletService";
import { useNativeIntegration, processPendingNotifications } from "../hooks/useNativeIntegration";
import ExpenseModal from "../components/modals/ExpenseModal";
import IncomeTransactionModal from "../components/modals/IncomeTransactionModal";
import RecordActionSheet from "../components/modals/RecordActionSheet";
import BalanceGapModal from "../components/modals/BalanceGapModal";
import { getUserSetupStatus, type UserSetupStatus } from "../services/guidanceService";

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "home", label: "Beranda", icon: LayoutDashboard },
  { id: "budget", label: "Rencana", icon: BarChart3 },
  { id: "history", label: "Riwayat", icon: Clock },
  { id: "wallets", label: "Dompet", icon: Wallet },
];

const TAB_PATHS: Record<TabId | "design-preview", string> = {
  home: "/home",
  wallets: "/wallets",
  "csv-import": "/wallets",
  budget: "/budget",
  income: "/budget",
  history: "/ledger",
  recurring: "/budget",
  analytics: "/home",
  settings: "/settings",
  "design-preview": "/design-preview",
};

const resolveTabFromPath = (pathname: string): TabId | null => {
  const normalized = pathname === "/" ? "/home" : pathname.toLowerCase();
  const match = Object.entries(TAB_PATHS).find(([, path]) => path === normalized);
  return (match?.[0] as TabId | undefined) || null;
};



import { useLanguage } from "../contexts/LanguageContext";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t, lang } = useLanguage();
  const { openOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "home";
    return resolveTabFromPath(window.location.pathname) || "home";
  });

  const [gamification, setGamification] = useState<any>(null);

  const streakStatus = useMemo(() => {
    if (!gamification) return { isActive: false, isFrozen: false };
    const todayStr = new Date().toISOString().split("T")[0];
    const isActive = gamification.last_streak_date === todayStr;
    const isFrozen = !isActive && gamification.streak_freezes > 0;
    return { isActive, isFrozen };
  }, [gamification]);

  const loadGamification = () => {
    import("../services/gamificationService").then(({ getUserGamification }) => {
      getUserGamification().then((data) => setGamification(data)).catch(() => {});
    });
  };

  useEffect(() => {
    if (user) {
      loadGamification();
    } else {
      setGamification(null);
    }
  }, [user]);

  useEffect(() => {
    window.addEventListener("gamification-updated", loadGamification);
    window.addEventListener("wallet-transaction-added", loadGamification);
    return () => {
      window.removeEventListener("gamification-updated", loadGamification);
      window.removeEventListener("wallet-transaction-added", loadGamification);
    };
  }, []);
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.location.search;
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [setupStatus, setSetupStatus] = useState<UserSetupStatus | null>(null);
  
  // Modals state
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("bf_expense_draft");
    }
    return false;
  });
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("bf_income_draft");
    }
    return false;
  });

  const [wallets, setWallets] = useState<any[]>([]);
  const [gapAnalysisWallet, setGapAnalysisWallet] = useState<any | null>(null);

  const fetchWallets = () => {
    if (!user) return;
    getWallets().then(setWallets).catch(err => console.warn("Failed to load wallets for warning banner:", err));
  };

  useNativeIntegration({
    navigateToTab,
    setIsExpenseModalOpen,
    wallets,
  });

  useEffect(() => {
    if (!user) return;
    const fetchStatus = () => {
      getUserSetupStatus().then(setSetupStatus).catch(err => console.warn("Failed to load setup status:", err));
    };
    fetchStatus();
    fetchWallets();
    window.addEventListener("wallet-transaction-added", fetchStatus);
    window.addEventListener("wallet-transaction-added", fetchWallets);
    return () => {
      window.removeEventListener("wallet-transaction-added", fetchStatus);
      window.removeEventListener("wallet-transaction-added", fetchWallets);
    };
  }, [user]);



  const navigateToTab = (tab: TabId, options?: { replace?: boolean; search?: string }) => {
    setActiveTab(tab);
    setSearchParams(options?.search || "");
    setShowProfileMenu(false);

    if (typeof window === "undefined") return;
    let nextPath = TAB_PATHS[tab];
    if (options?.search) {
      nextPath += options.search;
    }
    if (window.location.pathname !== nextPath || (options?.search && window.location.search !== options.search)) {
      window.history[options?.replace ? "replaceState" : "pushState"]({}, "", nextPath);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const activeTabLabel = useMemo(() => {
    if (activeTab === "settings") return t("settings.title", "Pengaturan");
    const found = NAV_ITEMS.find((item) => item.id === activeTab);
    if (!found) return t("common.home", "Beranda");
    if (found.id === "budget") return t("common.plan", found.label);
    if (found.id === "wallets") return t("common.wallet", found.label);
    return t("common." + found.id, found.label);
  }, [activeTab, t]);

  const clearSearchParams = () => {
    setSearchParams("");
  };

  useEffect(() => {
    const syncFromLocation = () => {
      const nextTab = resolveTabFromPath(window.location.pathname) || "home";
      setActiveTab(nextTab);
      setSearchParams(window.location.search);
    };

    if (!resolveTabFromPath(window.location.pathname)) {
      window.history.replaceState({}, "", TAB_PATHS.home);
    }

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener("bf-pathname-changed", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener("bf-pathname-changed", syncFromLocation);
    };
  }, []);

  useEffect(() => {
    const handleOpenRecordSheet = () => {
      setIsRecordSheetOpen(true);
    };
    window.addEventListener("bf-open-record-sheet", handleOpenRecordSheet);
    return () => window.removeEventListener("bf-open-record-sheet", handleOpenRecordSheet);
  }, []);

  useEffect(() => {
    if (isExpenseModalOpen) {
      window.dispatchEvent(new CustomEvent("expense-modal-opened"));
    }
  }, [isExpenseModalOpen]);

  useEffect(() => {
    if (isRecordSheetOpen) {
      window.dispatchEvent(new CustomEvent("record-sheet-opened"));
    }
  }, [isRecordSheetOpen]);

  useEffect(() => {
    const handleCloseAll = () => {
      setIsRecordSheetOpen(false);
      setIsExpenseModalOpen(false);
      setIsIncomeModalOpen(false);
    };
    window.addEventListener("bf-close-modals", handleCloseAll);
    return () => window.removeEventListener("bf-close-modals", handleCloseAll);
  }, []);


  const renderScreen = () => {
    if (activeTab === "home") return <HomeScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "wallets") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "csv-import") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "budget") return <BudgetScreen />;
    if (activeTab === "income") return <BudgetScreen />;
    if (activeTab === "history") return <HistoryScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "recurring") return <BudgetScreen />;
    if (activeTab === "analytics") return <HomeScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
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
      {/* Sidebar for Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/5 px-4 py-5 flex items-center justify-between">
          <img src="/logo-horizontal.png" alt="Budget Flow Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Gamification widgets for Desktop */}
        {gamification && (
          <div className="px-4 py-3 border-b border-black/5 flex items-center justify-around gap-2 bg-[#FEF9F4]/40">
            <button
              onClick={() => navigateToTab("settings")}
              className={`flex-grow flex items-center gap-2 border rounded-xl py-1.5 px-2.5 transition-all hover:shadow-sm ${
                streakStatus.isActive
                  ? "bg-orange-50 hover:bg-orange-100 border-orange-200/60"
                  : streakStatus.isFrozen
                    ? "bg-sky-50 hover:bg-sky-100 border-sky-200/60"
                    : "bg-white hover:bg-[#FEF9F4] border-black/5"
              }`}
              title={streakStatus.isFrozen ? "Streak Frozen (Protected) ❄️" : "Daily Streak 🔥"}
            >
              {streakStatus.isFrozen ? (
                <Snowflake className="w-4 h-4 shrink-0 text-sky-500 fill-sky-100 animate-pulse" />
              ) : (
                <Flame 
                  className={`w-4 h-4 shrink-0 ${
                    streakStatus.isActive 
                      ? "text-orange-500 fill-orange-400 animate-bounce" 
                      : "text-[#7B6E67]"
                  }`} 
                />
              )}
              <div className="text-left leading-none min-w-0">
                <p className={`text-[8px] font-bold uppercase tracking-wider ${
                  streakStatus.isActive ? "text-orange-600" : streakStatus.isFrozen ? "text-sky-600" : "text-[#7B6E67]"
                }`}>Streak</p>
                <p className={`text-xs font-extrabold mt-0.5 truncate ${
                  streakStatus.isActive ? "text-orange-700" : streakStatus.isFrozen ? "text-sky-700" : "text-[#1A2B38]"
                }`}>{gamification.current_streak} {lang === "id" ? "Hari" : "Days"}</p>
              </div>
            </button>

            <button
              onClick={() => navigateToTab("settings")}
              className="flex-grow flex items-center gap-2 bg-amber-50/50 hover:bg-amber-100 border border-amber-200/60 rounded-xl py-1.5 px-2.5 transition-all hover:shadow-sm"
              title="Coins"
            >
              <Coins className="w-4 h-4 text-yellow-500 fill-yellow-100 shrink-0" />
              <div className="text-left leading-none min-w-0">
                <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Koin</p>
                <p className="text-xs font-extrabold text-amber-700 mt-0.5 truncate">{gamification.coins}</p>
              </div>
            </button>
          </div>
        )}

        {/* Unified "Catat Baru" FAB for Desktop */}
        <div className="px-4 py-4">
          <button
            data-tour-id="sidebar-record-button"
            onClick={() => setIsRecordSheetOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#29B9AA] to-[#209F92] px-4 py-3 text-sm font-bold text-white shadow-md shadow-teal-500/10 hover:brightness-95 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            {t("common.add", "Catat Baru")}
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === "home" && activeTab === "analytics");
            const label = item.id === "budget" ? t("common.plan", item.label) : item.id === "wallets" ? t("common.wallet", item.label) : t("common." + item.id, item.label);
            return (
              <button
                key={item.id}
                data-tour-id={`sidebar-${item.id}-button`}
                onClick={() => navigateToTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#29B9AA] text-white shadow-md shadow-teal-500/10"
                    : "text-[#7B6E67] hover:bg-[#FEF9F4] hover:text-[#1A2B38]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
        
        <div className="relative border-t border-black/5 p-3">
          {showProfileMenu ? (
            <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
              <div className="flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] border-b border-black/5">
                <User className="w-4 h-4 text-[#7B6E67] flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => navigateToTab("settings")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] hover:bg-[#FEF9F4] transition-colors"
              >
                <Settings className="h-4 w-4 text-[#7B6E67] flex-shrink-0" />
                <span>{t("settings.title", "Pengaturan")}</span>
              </button>

              <button 
                onClick={handleLogout} 
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#FF6B58] hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>{t("common.logout", "Logout")}</span>
              </button>
            </div>
          ) : null}
          <button
            onClick={() => setShowProfileMenu((current) => !current)}
            className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-[#FEF9F4] px-3 py-3 hover:bg-[#F3EDE8]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#29B9AA] to-[#5BAEE8] text-sm font-bold text-white shadow-sm">
              {(user?.email || "B").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-[#1A2B38]">{user?.email}</p>
              <p className="text-xs text-[#7B6E67]">{t("common.account", "Akun & Pengaturan")}</p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-[#7B6E67] transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Header bar for Mobile */}
      <div className="fixed left-0 right-0 top-0 z-30 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button onClick={() => navigateToTab("home")} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <img src="/logo-mark.png" alt="Budget Flow Logo" className="h-9 w-9 rounded-lg object-contain" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#29B9AA] leading-none">Budget Flow</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#1A2B38] leading-none">{activeTabLabel}</p>
            </div>
          </button>

          {gamification && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Streak Indicator */}
              <button
                onClick={() => navigateToTab("settings")}
                className={`flex items-center gap-1 border rounded-full px-2.5 py-1 transition-colors ${
                  streakStatus.isActive
                    ? "bg-orange-50 hover:bg-orange-100 border-orange-200/50 text-orange-700"
                    : streakStatus.isFrozen
                      ? "bg-sky-50 hover:bg-sky-100 border-sky-200/50 text-sky-700"
                      : "bg-[#FEF9F4] hover:bg-[#F3EDE8] border-black/5 text-[#1A2B38]"
                }`}
                title={streakStatus.isFrozen ? "Streak Frozen (Protected) ❄️" : "Daily Streak 🔥"}
              >
                {streakStatus.isFrozen ? (
                  <Snowflake className="w-3.5 h-3.5 text-sky-500 fill-sky-100 animate-pulse" />
                ) : (
                  <Flame 
                    className={`w-3.5 h-3.5 ${
                      streakStatus.isActive 
                        ? "text-orange-500 fill-orange-500 animate-bounce" 
                        : "text-[#7B6E67]"
                    }`} 
                  />
                )}
                <span className="text-xs font-bold">{gamification.current_streak}</span>
              </button>

              {/* Coin Indicator */}
              <button
                onClick={() => navigateToTab("settings")}
                className="flex items-center gap-1 bg-amber-50/50 hover:bg-amber-100 border border-amber-200/50 rounded-full px-2.5 py-1 transition-colors text-amber-700"
                title="Coins"
              >
                <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-100" />
                <span className="text-xs font-bold">{gamification.coins}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => navigateToTab("settings")}
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#29B9AA] to-[#5BAEE8] text-sm font-extrabold text-white shadow-md active:scale-95 transition-transform"
            aria-label="Open settings"
          >
            {(user?.email || "B").slice(0, 1).toUpperCase()}
            <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-[#1A2B38] border border-white shadow-sm flex items-center justify-center">
              <Settings className="w-3 h-3 text-white" />
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.96);
            box-shadow: 0 0 0 0 rgba(41, 185, 170, 0.6);
          }
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 15px rgba(41, 185, 170, 0);
          }
          100% {
            transform: scale(0.96);
            box-shadow: 0 0 0 0 rgba(41, 185, 170, 0);
          }
        }
        @keyframes shimmer-sweep {
          0% {
            left: -150%;
          }
          50% {
            left: -150%;
          }
          100% {
            left: 150%;
          }
        }
        .animate-quick-pulse {
          animation: pulse-ring 2.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        .shimmer-element {
          position: relative;
        }
        .shimmer-element::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.45) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shimmer-sweep 3.5s infinite ease-in-out;
        }
      `}</style>
      <main className="min-w-0 flex-1 pb-24 pt-[78px] lg:pb-0 lg:pt-0">
        {walletWarnings.length > 0 && (
          <div className="border-b border-orange-200 bg-orange-50/70 backdrop-blur-md px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-2">
                {walletWarnings.map(({ wallet, status }) => {
                  const isRed = status.isRed;
                  const alertBg = isRed ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800";
                  const alertIconColor = isRed ? "text-red-500" : "text-amber-500";
                  
                  return (
                    <div 
                      key={wallet.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 ${alertBg} transition-all duration-200`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 shrink-0 ${alertIconColor}`}>
                          <AlertCircle className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0 text-left">
                          <h4 className="text-xs font-bold uppercase tracking-wider leading-none">
                            {isRed ? "Penyesuaian Diperlukan" : "Perlu Konfirmasi"}
                          </h4>
                          <p className="mt-1 text-xs font-medium opacity-90 leading-normal">
                            {wallet.name}: {
                              Math.abs(status.estimatedGap) > 0 
                                ? `Terdapat selisih estimasi Rp ${Math.abs(status.estimatedGap).toLocaleString("id-ID")}.`
                                : `Saldo belum dikonfirmasi selama ${status.daysSinceConfirmation} hari.`
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGapAnalysisWallet(wallet)}
                        className={`shrink-0 self-start sm:self-center rounded-lg px-3 py-1.5 text-xs font-bold border transition-all active:scale-[0.98] ${
                          isRed 
                            ? "bg-red-600 border-red-700 text-white hover:bg-red-700" 
                            : "bg-amber-600 border-amber-700 text-white hover:bg-amber-700"
                        }`}
                      >
                        Selesaikan Gap
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {renderScreen()}
      </main>

      {/* Mobile bottom nav (5 logical slots) */}
      <nav 
        style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white lg:hidden pt-2"
      >
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-5 items-center relative h-11">
            {/* Slot 1: Beranda */}
            <button
              data-tour-id="nav-home"
              onClick={() => navigateToTab("home")}
              className={`flex min-w-0 flex-col items-center justify-center w-full h-full text-[9.5px] font-bold ${
                activeTab === "home" || activeTab === "analytics" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <LayoutDashboard className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">{t("common.home", "Beranda")}</span>
            </button>

            {/* Slot 2: Rencana */}
            <button
              data-tour-id="nav-plan"
              onClick={() => navigateToTab("budget")}
              className={`flex min-w-0 flex-col items-center justify-center w-full h-full text-[9.5px] font-bold ${
                activeTab === "budget" || activeTab === "income" || activeTab === "recurring" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <BarChart3 className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">{t("common.plan", "Rencana")}</span>
            </button>

            {/* Slot 3: Central Catat Hub Button */}
            <div className="relative flex flex-col items-center justify-center w-full h-full text-[9.5px] font-bold">
              <button
                data-tour-id="nav-record"
                onClick={() => setIsRecordSheetOpen(true)}
                className="absolute -top-7.5 flex h-12 w-12 items-center justify-center rounded-full bg-[#29B9AA] text-white border-2 border-white shadow-sm active:scale-[0.98] transition-all"
                aria-label={t("common.add", "Catat Baru")}
              >
                <Plus className="h-6 w-6 stroke-[3]" />
                {setupStatus && !setupStatus.has_expense_transaction && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 px-1.5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6B58] text-[9px] font-black text-white border border-white">
                    {t("common.back", "Mulai")}
                  </span>
                )}
              </button>
              <span className="leading-none text-[#29B9AA] uppercase tracking-wider mt-4">{t("common.record", "Catat")}</span>
            </div>

            {/* Slot 4: Riwayat */}
            <button
              data-tour-id="nav-history"
              onClick={() => navigateToTab("history")}
              className={`flex min-w-0 flex-col items-center justify-center w-full h-full text-[9.5px] font-bold ${
                activeTab === "history" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Clock className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">{t("common.history", "Riwayat")}</span>
            </button>

            {/* Slot 5: Dompet */}
            <button
              data-tour-id="nav-wallet"
              onClick={() => navigateToTab("wallets")}
              className={`flex min-w-0 flex-col items-center justify-center w-full h-full text-[9.5px] font-bold ${
                activeTab === "wallets" || activeTab === "csv-import" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Wallet className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">{t("common.wallet", "Dompet")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Record Action Sheet Modal */}
      <RecordActionSheet
        open={isRecordSheetOpen}
        onClose={() => setIsRecordSheetOpen(false)}
        onSelectAction={(actionType) => {
          if (actionType === "expense") {
            setIsExpenseModalOpen(true);
          } else if (actionType === "income") {
            setIsIncomeModalOpen(true);
          } else if (actionType === "csv") {
            navigateToTab("wallets", { search: "?action=import-csv" });
          } else if (actionType === "screenshot") {
            navigateToTab("wallets", { search: "?action=screenshot-balance" });
          } else if (actionType === "receipt") {
            navigateToTab("wallets", { search: "?action=upload-receipt" });
          } else if (actionType === "notifications") {
            processPendingNotifications();
          }
        }}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <IncomeTransactionModal
        isOpen={isIncomeModalOpen}
        transaction={null}
        selectedSourceId={null}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
        }}
      />

      {gapAnalysisWallet && (
        <BalanceGapModal
          wallet={gapAnalysisWallet}
          onClose={() => setGapAnalysisWallet(null)}
          onSaved={fetchWallets}
        />
      )}
    </div>
  );
}
