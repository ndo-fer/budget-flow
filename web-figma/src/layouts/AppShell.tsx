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
  Wallet,
  Upload,
  User,
  LogOut,
  Receipt,
  Smartphone,
  FileSpreadsheet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "../utils/toast";
import type { TabId } from "../types/models";
import { useAuth } from "../contexts/AuthContext";
import { useOnboarding } from "../contexts/OnboardingContext";
import HomeScreen from "../features/home/HomeScreen";
import WalletsScreen from "../features/wallets/WalletsScreen";
import BudgetScreen from "../features/budget/BudgetScreen";
import IncomeScreen from "../features/income/IncomeScreen";
import HistoryScreen from "../features/history/HistoryScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { parseNotification, getAppFriendlyName } from "../services/notificationParserService";
import { addWalletTransaction } from "../services/walletTransactionService";
import { getWallets } from "../services/walletService";
import ExpenseModal from "../components/modals/ExpenseModal";

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "budget", label: "Budgets", icon: BarChart3 },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "history", label: "Ledger", icon: Clock },
];

const TAB_PATHS: Record<TabId | "design-preview", string> = {
  home: "/home",
  wallets: "/wallets",
  "csv-import": "/wallets",
  budget: "/budget",
  income: "/income",
  history: "/ledger",
  recurring: "/ledger",
  analytics: "/home",
  settings: "/settings",
  "design-preview": "/design-preview",
};

const resolveTabFromPath = (pathname: string): TabId | null => {
  const normalized = pathname === "/" ? "/home" : pathname.toLowerCase();
  const match = Object.entries(TAB_PATHS).find(([, path]) => path === normalized);
  return (match?.[0] as TabId | undefined) || null;
};

export const processPendingNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const access = await NotificationReceiver.checkNotificationAccess();
    if (!access.enabled) return;

    const res = await NotificationReceiver.getPendingNotifications();
    const notifications = res.notifications || [];
    if (notifications.length === 0) return;

    console.log(`[NotificationReceiver] Processing ${notifications.length} pending notifications.`);
    const wallets = await getWallets().catch(() => []);

    for (const notif of notifications) {
      // Check allowlist
      const allowlistJson = localStorage.getItem("bf_notification_allowlist");
      if (allowlistJson) {
        const allowlist = JSON.parse(allowlistJson);
        if (allowlist[notif.packageName] === false) {
          continue;
        }
      }

      const parsed = parseNotification(notif.text, notif.packageName);
      if (!parsed) {
        console.warn(`[NotificationReceiver] Gagal mem-parsing teks notifikasi: "${notif.text}" dari package: ${notif.packageName}`);
        continue;
      }

      let walletId = undefined;
      let walletName = getAppFriendlyName(notif.packageName);

      if (parsed.walletCandidate) {
        const matched = wallets.find(w => 
          w.name.toLowerCase().includes(parsed.walletCandidate!.toLowerCase()) ||
          parsed.walletCandidate!.toLowerCase().includes(w.name.toLowerCase())
        );
        if (matched) {
          walletId = matched.id;
          walletName = matched.name;
        }
      }

      const actionTxt = parsed.direction === "out" ? "berkurang" : "masuk";
      const formattedAmount = `Rp${parsed.amount.toLocaleString("id-ID")}`;
      const summaryNote = `Saldo ${walletName} ${actionTxt} ${formattedAmount}`;

      await addWalletTransaction({
        wallet_id: walletId,
        amount: parsed.amount,
        direction: parsed.direction,
        merchant: parsed.merchant || "Notifikasi Otomatis",
        note: summaryNote,
        source: "notification",
        confidence: parsed.confidence,
        raw_text: `${notif.packageName}|${notif.text}`,
        occurred_at: new Date(notif.timestamp).toISOString()
      });

      toast.success(
        `Catat otomatis: Rp ${parsed.amount.toLocaleString("id-ID")} (${parsed.walletCandidate || "Dompet"})`
      );
    }
  } catch (err) {
    console.error("[NotificationReceiver] Error parsing queued notifications:", err);
  }
};

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { openOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "home";
    return resolveTabFromPath(window.location.pathname) || "home";
  });
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.location.search;
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("bf_expense_draft");
    }
    return false;
  });
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const [touchStartCenter, setTouchStartCenter] = useState<{ x: number; y: number } | null>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [wasOpenOnTouchStart, setWasOpenOnTouchStart] = useState(false);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

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

  const radialActions = useMemo(() => [
    {
      id: "expense",
      label: "Catat Expense",
      color: "from-[#FF6B58] to-[#E8503F]",
      icon: Plus,
      action: () => {
        setIsSpeedDialOpen(false);
        setIsExpenseModalOpen(true);
      },
      angle: 155,
      desktopAngle: 180,
      mobileLabelClass: "right-14 top-1/2 -translate-y-1/2",
      desktopLabelClass: "right-14 top-1/2 -translate-y-1/2",
    },
    {
      id: "struk",
      label: "Upload Struk",
      color: "from-[#29B9AA] to-[#209F92]",
      icon: Receipt,
      action: () => {
        setIsSpeedDialOpen(false);
        navigateToTab("wallets", { search: "?action=upload-receipt" });
      },
      angle: 115,
      desktopAngle: 150,
      mobileLabelClass: "bottom-14 left-1/2 -translate-x-1/2",
      desktopLabelClass: "right-12 bottom-12",
    },
    {
      id: "koreksi",
      label: "Koreksi Saldo",
      color: "from-[#FFB347] to-[#E6992E]",
      icon: Smartphone,
      action: () => {
        setIsSpeedDialOpen(false);
        navigateToTab("wallets", { search: "?action=screenshot-balance" });
      },
      angle: 75,
      desktopAngle: 120,
      mobileLabelClass: "bottom-14 left-1/2 -translate-x-1/2",
      desktopLabelClass: "right-12 bottom-12",
    },
    {
      id: "csv",
      label: "Import CSV",
      color: "from-[#5BAEE8] to-[#4094CE]",
      icon: FileSpreadsheet,
      action: () => {
        setIsSpeedDialOpen(false);
        navigateToTab("wallets", { search: "?action=import-csv" });
      },
      angle: 35,
      desktopAngle: 90,
      mobileLabelClass: "left-14 top-1/2 -translate-y-1/2",
      desktopLabelClass: "bottom-14 left-1/2 -translate-x-1/2",
    },
  ], [navigateToTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setTouchStartCenter(center);
    setHasSwiped(false);
    setActiveSwipeId(null);
    setWasOpenOnTouchStart(isSpeedDialOpen);
    setIsSpeedDialOpen(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCenter) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartCenter.x;
    const dy = touch.clientY - touchStartCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 15) {
      setHasSwiped(true);
      if (e.cancelable) e.preventDefault();
    }

    let angle = Math.atan2(-dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let foundId: string | null = null;
    if (distance >= 45 && distance <= 160) {
      radialActions.forEach((action) => {
        const diff = Math.abs(angle - action.angle);
        const normalizedDiff = diff > 180 ? 360 - diff : diff;
        if (normalizedDiff < 25) {
          foundId = action.id;
        }
      });
    }
    setActiveSwipeId(foundId);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (hasSwiped) {
      if (activeSwipeId) {
        const action = radialActions.find((a) => a.id === activeSwipeId);
        if (action) {
          action.action();
        }
      }
      setIsSpeedDialOpen(false);
    } else {
      if (wasOpenOnTouchStart) {
        setIsSpeedDialOpen(false);
      }
    }
    setTouchStartCenter(null);
    setActiveSwipeId(null);
  };

  const activeNavItem = useMemo(() => NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0], [activeTab]);

  const clearSearchParams = () => {
    setSearchParams("");
  };



  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen to deep links from Android Widget quick actions
    const setupDeepLinks = async () => {
      try {
        const { App: CapApp } = await import("@capacitor/app");
        CapApp.addListener("appUrlOpen", (event) => {
          const urlStr = event.url;
          if (urlStr.includes("add-expense")) {
            setIsExpenseModalOpen(true);
          } else if (urlStr.includes("ledger")) {
            navigateToTab("history");
          } else if (urlStr.includes("wallets")) {
            navigateToTab("wallets");
          }
        });

        // Pull notifications on start
        processPendingNotifications();

        // Pull notifications when returning to foreground
        CapApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            processPendingNotifications();
          }
        });
      } catch (err) {
        console.warn("Failed to listen to native app events:", err);
      }
    };

    setupDeepLinks();

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
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const renderScreen = () => {
    if (activeTab === "home") return <HomeScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "wallets") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "csv-import") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "budget") return <BudgetScreen />;
    if (activeTab === "income") return <IncomeScreen onNavigateTab={navigateToTab} />;
    if (activeTab === "history") return <HistoryScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "recurring") return <HistoryScreen onNavigateTab={navigateToTab} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
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
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/5 px-4 py-5">
          <img src="/logo-horizontal.png" alt="Budget Flow Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="px-4 pt-4">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B58] to-[#E8503F] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
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
              <div className="flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] border-b border-black/5">
                <User className="w-4 h-4 text-[#7B6E67] flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => navigateToTab("settings")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1A2B38] hover:bg-[#FEF9F4] transition-colors"
              >
                <Settings className="h-4 w-4 text-[#7B6E67] flex-shrink-0" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveTab("design-preview" as any);
                  window.history.pushState({}, "", "/design-preview");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1c6cff] hover:bg-[#f0f7ff] transition-colors"
              >
                <LineChart className="h-4 w-4 flex-shrink-0" />
                <span>Design Preview</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#FF6B58] hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
          <button
            onClick={() => setShowProfileMenu((current) => !current)}
            className="flex w-full items-center gap-3 rounded-[24px] border border-black/5 bg-[#FEF9F4] px-3 py-3 hover:bg-[#F3EDE8]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#29B9AA] to-[#5BAEE8] text-sm font-bold text-white shadow-sm">
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
          <button onClick={() => navigateToTab("home")} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
            <img src="/logo-mark.png" alt="Budget Flow Logo" className="h-9 w-9 rounded-lg object-contain" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#29B9AA] leading-none">Budget Flow</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#1A2B38] leading-none">{activeNavItem.label}</p>
            </div>
          </button>
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
            box-shadow: 0 0 0 0 rgba(255, 107, 88, 0.6);
          }
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 15px rgba(255, 107, 88, 0);
          }
          100% {
            transform: scale(0.96);
            box-shadow: 0 0 0 0 rgba(255, 107, 88, 0);
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
      <main className="min-w-0 flex-1 pb-24 pt-[78px] lg:pb-0 lg:pt-0">{renderScreen()}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white lg:hidden">
        <div className="max-w-md mx-auto px-4 py-1">
          <div className="grid grid-cols-5 items-center relative h-12">
            {/* Slot 1: Dashboard */}
            <button
              onClick={() => navigateToTab("home")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "home" || activeTab === "analytics" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <LayoutDashboard className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Dashboard</span>
            </button>

            {/* Slot 2: Wallets */}
            <button
              onClick={() => navigateToTab("wallets")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "wallets" || activeTab === "csv-import" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Wallet className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Wallets</span>
            </button>

            {/* Slot 3: Quick Actions (Center button) */}
            <div className="relative flex flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold">
              <button
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
                className={`absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B58] to-[#E8503F] text-white border-4 border-white shadow-[0_4px_12px_rgba(255,107,88,0.3)] active:scale-95 transition-all overflow-hidden ${
                  !isSpeedDialOpen ? "animate-quick-pulse shimmer-element" : ""
                }`}
                aria-label="Menu Aksi Cepat"
              >
                {isSpeedDialOpen ? (
                  <X className="h-5 w-5 stroke-[3] transition-transform duration-300 rotate-90" />
                ) : (
                  <Zap className="h-5 w-5 fill-white stroke-none transition-transform duration-300" />
                )}
              </button>
              <span className="leading-none text-[#FF6B58] uppercase tracking-wider">Aksi</span>
            </div>

            {/* Slot 4: Budgets */}
            <button
              onClick={() => navigateToTab("budget")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "budget" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <BarChart3 className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Budgets</span>
            </button>

            {/* Slot 5: Ledger */}
            <button
              onClick={() => navigateToTab("history")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "history" || activeTab === "recurring" || activeTab === "income" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Clock className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Ledger</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Global Speed Dial Overlay Backdrop */}
      {isSpeedDialOpen && (
        <div 
          onClick={() => setIsSpeedDialOpen(false)}
          onTouchStart={() => setIsSpeedDialOpen(false)}
          className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs transition-all duration-300 animate-in fade-in animate-duration-200"
        />
      )}

      {/* Mobile Radial Speed Dial Menu */}
      <div 
        className="fixed bottom-[28px] left-1/2 z-40 pointer-events-none lg:hidden"
        style={{ width: 0, height: 0 }}
      >
        {radialActions.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSwipeId === item.id;
          
          const r = 95;
          const angleRad = (item.angle * Math.PI) / 180;
          const x = Math.round(r * Math.cos(angleRad));
          const y = Math.round(-r * Math.sin(angleRad));
          
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`absolute flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r ${item.color} text-white border-2 border-white shadow-lg pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]`}
              style={{
                transform: isSpeedDialOpen 
                  ? `translate(${x - 22}px, ${y - 22}px) scale(${isActive ? 1.22 : 1})`
                  : `translate(-22px, -22px) scale(0)`,
                opacity: isSpeedDialOpen ? 1 : 0,
                transitionDelay: isSpeedDialOpen ? `${index * 45}ms` : '0ms',
                boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.9), 0 4px 10px rgba(0,0,0,0.2)' : undefined,
              }}
            >
              <Icon className="h-5 w-5" />
              {/* Text Label Pill */}
              <div 
                className={`absolute bg-black/85 backdrop-blur-md text-white text-[9.5px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border border-white/15 whitespace-nowrap transition-all ${
                  isSpeedDialOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                } ${item.mobileLabelClass}`}
                style={{
                  transitionDelay: isSpeedDialOpen ? `${(index * 45) + 120}ms` : '0ms',
                  backgroundColor: isActive ? '#29B9AA' : undefined,
                  borderColor: isActive ? '#29B9AA' : undefined,
                }}
              >
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop Radial Speed Dial Menu */}
      <div 
        className="fixed bottom-[52px] right-[52px] z-40 pointer-events-none hidden lg:block"
        style={{ width: 0, height: 0 }}
      >
        {radialActions.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeHoverId === item.id;
          
          const r = 100;
          const angleRad = (item.desktopAngle * Math.PI) / 180;
          const x = Math.round(r * Math.cos(angleRad));
          const y = Math.round(-r * Math.sin(angleRad));
          
          return (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setActiveHoverId(item.id)}
              onMouseLeave={() => setActiveHoverId(null)}
              className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B58] to-[#E8503F] text-white border-2 border-white shadow-lg pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
              style={{
                background: `linear-gradient(to right, ${item.color.split(' ')[0].replace('from-[', '').replace(']', '')}, ${item.color.split(' ')[1].replace('to-[', '').replace(']', '')})`,
                transform: isSpeedDialOpen 
                  ? `translate(${x - 22}px, ${y - 22}px) scale(${isActive ? 1.22 : 1})`
                  : `translate(-22px, -22px) scale(0)`,
                opacity: isSpeedDialOpen ? 1 : 0,
                transitionDelay: isSpeedDialOpen ? `${index * 45}ms` : '0ms',
                boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.9), 0 4px 10px rgba(0,0,0,0.2)' : undefined,
              }}
            >
              <Icon className="h-5 w-5" />
              {/* Text Label Pill */}
              <div 
                className={`absolute bg-black/85 backdrop-blur-md text-white text-[9.5px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border border-white/15 whitespace-nowrap transition-all ${
                  isSpeedDialOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                } ${item.desktopLabelClass}`}
                style={{
                  transitionDelay: isSpeedDialOpen ? `${(index * 45) + 120}ms` : '0ms',
                  backgroundColor: isActive ? '#29B9AA' : undefined,
                  borderColor: isActive ? '#29B9AA' : undefined,
                }}
              >
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Speed Dial Trigger FAB (Desktop only) */}
      <div className="hidden lg:block lg:fixed lg:bottom-6 lg:right-6 z-40 h-14 w-14">
        <button
          onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B58] to-[#E8503F] text-white shadow-[0_8px_30px_rgba(255,107,88,0.35)] active:scale-95 transition-all overflow-hidden ${
            !isSpeedDialOpen ? "animate-quick-pulse shimmer-element" : ""
          }`}
          aria-label="Menu Aksi Cepat"
        >
          {isSpeedDialOpen ? (
            <X className="h-6 w-6 stroke-[3] transition-transform duration-300 rotate-90 animate-in fade-in" />
          ) : (
            <Zap className="h-6 w-6 fill-white stroke-none transition-transform duration-300 animate-in fade-in" />
          )}
        </button>
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
}
