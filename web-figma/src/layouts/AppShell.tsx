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

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "budget", label: "Budgets", icon: BarChart3 },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "history", label: "Ledger", icon: Clock },
];

const TAB_PATHS: Record<TabId, string> = {
  home: "/home",
  wallets: "/wallets",
  "csv-import": "/wallets",
  budget: "/budget",
  income: "/income",
  history: "/ledger",
  recurring: "/ledger",
  analytics: "/home",
  settings: "/settings",
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
  const [openExpenseComposerTick, setOpenExpenseComposerTick] = useState(0);

  const activeNavItem = useMemo(() => NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0], [activeTab]);

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
            navigateToTab("home");
            setOpenExpenseComposerTick((current) => current + 1);
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
    if (activeTab === "home") return <HomeScreen onNavigateTab={navigateToTab} openExpenseComposerTick={openExpenseComposerTick} onClearExpenseComposerTick={() => setOpenExpenseComposerTick(0)} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "wallets") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "csv-import") return <WalletsScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "budget") return <BudgetScreen />;
    if (activeTab === "income") return <IncomeScreen />;
    if (activeTab === "history") return <HistoryScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "recurring") return <HistoryScreen activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
    if (activeTab === "analytics") return <HomeScreen onNavigateTab={navigateToTab} openExpenseComposerTick={openExpenseComposerTick} onClearExpenseComposerTick={() => setOpenExpenseComposerTick(0)} activeTab={activeTab} searchParams={searchParams} clearSearchParams={clearSearchParams} />;
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

      <main className="min-w-0 flex-1 pb-20 pt-[78px] lg:pb-0 lg:pt-0">{renderScreen()}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white px-2 py-1 lg:hidden">
        <div className="grid grid-cols-5 items-center gap-1">
          {NAV_ITEMS.map((item) => {
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

      {/* Floating Add Button for Mobile */}
      <button
        onClick={() => {
          navigateToTab("home");
          setOpenExpenseComposerTick((current) => current + 1);
        }}
        className="fixed bottom-[72px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B58] to-[#E8503F] text-white shadow-[0_8px_30px_rgba(255,107,88,0.35)] hover:scale-105 active:scale-95 transition-all lg:hidden"
        aria-label="Tambah Transaksi"
      >
        <Plus className="h-6 w-6 stroke-[3]" />
      </button>
    </div>
  );
}
