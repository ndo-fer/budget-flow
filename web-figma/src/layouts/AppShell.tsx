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
  X
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
import { registerPlugin, Capacitor } from "@capacitor/core";
import { parseNotification, getAppFriendlyName } from "../services/notificationParserService";
import { addWalletTransaction } from "../services/walletTransactionService";
import { getWallets } from "../services/walletService";
import ExpenseModal from "../components/modals/ExpenseModal";
import IncomeTransactionModal from "../components/modals/IncomeTransactionModal";
import RecordActionSheet from "../components/modals/RecordActionSheet";
import { getUserSetupStatus, type UserSetupStatus } from "../services/guidanceService";

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");

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

  useEffect(() => {
    if (!user) return;
    const fetchStatus = () => {
      getUserSetupStatus().then(setSetupStatus).catch(err => console.warn("Failed to load setup status:", err));
    };
    fetchStatus();
    window.addEventListener("wallet-transaction-added", fetchStatus);
    return () => window.removeEventListener("wallet-transaction-added", fetchStatus);
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

  const activeNavItem = useMemo(() => NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0], [activeTab]);

  const clearSearchParams = () => {
    setSearchParams("");
  };

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
        <div className="border-b border-black/5 px-4 py-5">
          <img src="/logo-horizontal.png" alt="Budget Flow Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Unified "Catat Baru" FAB for Desktop */}
        <div className="px-4 py-4">
          <button
            data-tour-id="sidebar-record-button"
            onClick={() => setIsRecordSheetOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#29B9AA] to-[#209F92] px-4 py-3 text-sm font-bold text-white shadow-md shadow-teal-500/10 hover:brightness-95 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            Catat Baru
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === "home" && activeTab === "analytics");
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
                {item.label}
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
                <span>Pengaturan</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  window.history.pushState({}, "", "/design-preview");
                  window.dispatchEvent(new PopStateEvent("popstate"));
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
            className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-[#FEF9F4] px-3 py-3 hover:bg-[#F3EDE8]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#29B9AA] to-[#5BAEE8] text-sm font-bold text-white shadow-sm">
              {(user?.email || "B").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-[#1A2B38]">{user?.email}</p>
              <p className="text-xs text-[#7B6E67]">Akun & Pengaturan</p>
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
      <main className="min-w-0 flex-1 pb-24 pt-[78px] lg:pb-0 lg:pt-0">{renderScreen()}</main>

      {/* Mobile bottom nav (5 logical slots) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white lg:hidden">
        <div className="max-w-md mx-auto px-4 py-1">
          <div className="grid grid-cols-5 items-center relative h-12">
            {/* Slot 1: Beranda */}
            <button
              onClick={() => navigateToTab("home")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "home" || activeTab === "analytics" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <LayoutDashboard className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Beranda</span>
            </button>

            {/* Slot 2: Rencana */}
            <button
              data-tour-id="nav-plan"
              onClick={() => navigateToTab("budget")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "budget" || activeTab === "income" || activeTab === "recurring" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <BarChart3 className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Rencana</span>
            </button>

            {/* Slot 3: Central Catat Hub Button */}
            <div className="relative flex flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold">
              <button
                data-tour-id="nav-record"
                onClick={() => setIsRecordSheetOpen(true)}
                className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#29B9AA] text-white border-2 border-white shadow-sm active:scale-[0.98] transition-all"
                aria-label="Catat Baru"
              >
                <Plus className="h-6 w-6 stroke-[3]" />
                {setupStatus && !setupStatus.has_expense_transaction && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 px-1.5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6B58] text-[9px] font-black text-white border border-white">
                    Mulai
                  </span>
                )}
              </button>
              <span className="leading-none text-[#29B9AA] uppercase tracking-wider">Catat</span>
            </div>

            {/* Slot 4: Riwayat */}
            <button
              data-tour-id="nav-history"
              onClick={() => navigateToTab("history")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "history" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Clock className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Riwayat</span>
            </button>

            {/* Slot 5: Dompet */}
            <button
              data-tour-id="nav-wallet"
              onClick={() => navigateToTab("wallets")}
              className={`flex min-w-0 flex-col items-center justify-end w-full h-full pb-1.5 text-[9.5px] font-bold ${
                activeTab === "wallets" || activeTab === "csv-import" ? "text-[#29B9AA]" : "text-[#7B6E67]"
              }`}
            >
              <Wallet className="mb-1 h-4.5 w-4.5" />
              <span className="leading-none">Dompet</span>
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
    </div>
  );
}
