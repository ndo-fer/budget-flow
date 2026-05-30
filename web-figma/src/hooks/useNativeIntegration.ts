import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAuth } from "../contexts/AuthContext";
import { parseNotification, getAppFriendlyName } from "../services/notificationParserService";
import { addWalletTransaction } from "../services/walletTransactionService";
import { getWallets, updateConfirmedBalance } from "../services/walletService";
import { toast } from "../utils/toast";
import { parseError } from "../utils/errorHandler";
import type { TabId } from "../types/models";

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");
const WidgetData = registerPlugin<any>("WidgetData");

export const processPendingNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const access = await NotificationReceiver.checkNotificationAccess();
    if (!access.enabled) return;

    const res = await NotificationReceiver.getPendingNotifications();
    const notifications = res.notifications || [];
    if (notifications.length === 0) return;

    console.log(`[NotificationReceiver] Processing ${notifications.length} pending notifications.`);
    
    // Wait for Supabase/wallets to load (retry loop to handle initialization timing)
    let wallets: any[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        wallets = await getWallets();
        if (wallets && wallets.length > 0) {
          break;
        }
      } catch (e) {
        console.warn(`[NotificationReceiver] Wallet fetch attempt ${attempt + 1} failed, retrying...`, e);
      }
      await new Promise(resolve => setTimeout(resolve, 800));
    }

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
        console.warn(`[NotificationReceiver] Gagal mem-parsing teks notifikasi dari package: ${notif.packageName} (panjang teks: ${notif.text ? notif.text.length : 0})`);
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

      // 🔄 Auto-sync gap reconciliation (Recommendation Only)
      if (walletId && parsed.remainingBalance !== undefined) {
        await updateConfirmedBalance(walletId, parsed.remainingBalance);
      }

      toast.success(
        `Catat otomatis: Rp ${parsed.amount.toLocaleString("id-ID")} (${parsed.walletCandidate || "Dompet"})`
      );
    }

    if (notifications.length > 0) {
      window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
    }
  } catch (err) {
    console.error("[NotificationReceiver] Error parsing queued notifications:", err);
  }
};

export const processPendingWidgetTransactions = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const res = await WidgetData.getPendingWidgetTransactions();
    const transactions = res.transactions || [];
    if (transactions.length === 0) return;

    console.log(`[WidgetData] Processing ${transactions.length} pending widget transactions.`);
    
    // Wait for Supabase/wallets to load (retry loop to handle initialization timing)
    let wallets: any[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        wallets = await getWallets();
        if (wallets && wallets.length > 0) {
          break;
        }
      } catch (e) {
        console.warn(`[WidgetData] Wallet fetch attempt ${attempt + 1} failed, retrying...`, e);
      }
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const defaultWallet = wallets && wallets.length > 0 ? wallets[0] : null;
    const successfulTimestamps: number[] = [];

    for (const tx of transactions) {
      const formattedAmount = `Rp${tx.amount.toLocaleString("id-ID")}`;
      const note = `Catat cepat dari widget: ${formattedAmount}`;

      try {
        await addWalletTransaction({
          wallet_id: defaultWallet ? defaultWallet.id : undefined,
          amount: tx.amount,
          direction: "out",
          merchant: "Widget Cepat",
          note: note,
          source: "manual",
          confidence: 1.0,
          raw_text: `widget|${tx.amount}`,
          occurred_at: new Date(tx.timestamp).toISOString()
        });

        toast.success(
          `Catat otomatis dari widget: Rp ${tx.amount.toLocaleString("id-ID")}`
        );
        successfulTimestamps.push(tx.timestamp);
      } catch (txErr: any) {
        console.error(`[WidgetData] Failed to record widget transaction for amount ${tx.amount}:`, txErr);
        toast.error(parseError(txErr).message);
      }
    }

    // Clear only successfully synced transactions from native memory
    if (successfulTimestamps.length > 0) {
      await WidgetData.clearPendingWidgetTransactions({ resolvedTimestamps: successfulTimestamps });
      window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
    }
  } catch (err: any) {
    console.error("[WidgetData] Error parsing queued widget transactions:", err);
    toast.error(parseError(err).message);
  }
};

interface UseNativeIntegrationProps {
  navigateToTab: (tab: TabId, options?: { replace?: boolean; search?: string }) => void;
  setIsExpenseModalOpen: (open: boolean) => void;
  wallets: any[];
}

export function useNativeIntegration({
  navigateToTab,
  setIsExpenseModalOpen,
  wallets,
}: UseNativeIntegrationProps) {
  const { user } = useAuth();

  // Listen to native system local notification clicks
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: any;
    try {
      listener = LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action: any) => {
          console.log("[Notification] Native action performed:", action);
          if (action.notification.id === 42001 || action.notification.extra?.action === "open_history") {
            navigateToTab("history");
            return;
          }

          if (action.notification.id === 10101 || action.notification.extra?.action === "open_wallets") {
            navigateToTab("wallets");
          }
        }
      );
    } catch (e) {
      console.warn("[Notification] Action listener registry failed:", e);
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigateToTab]);

  // Synchronize persistent/ongoing native system notification
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const syncSystemNotification = async () => {
      try {
        // Find wallets that have red/warning status (confidence-based health score)
        // Red warnings logic is empty or disabled in presentation, but keeping the block active:
        const redWarnings = wallets.filter(w => w.confidence < 0.8); // example confidence check
        if (redWarnings.length > 0) {
          const perm = await LocalNotifications.checkPermissions();
          if (perm.display !== "granted") {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== "granted") return;
          }

          const walletNames = redWarnings.map(w => w.name).join(", ");
          const bodyText = `Penyesuaian saldo diperlukan untuk: ${walletNames}. Ketuk untuk menyelaraskan.`;

          await LocalNotifications.schedule({
            notifications: [
              {
                id: 10101,
                title: "Budget Flow: Penyesuaian Saldo",
                body: bodyText,
                ongoing: true,
                schedule: { at: new Date() },
                extra: { action: "open_wallets" }
              }
            ]
          });
          console.log("[Notification] Sticky warning notification scheduled for:", walletNames);
        } else {
          await LocalNotifications.cancel({
            notifications: [{ id: 10101 }]
          });
        }
      } catch (err) {
        console.warn("[Notification] Failed to sync persistent notification:", err);
      }
    };

    syncSystemNotification();
  }, [wallets, user]);

  // Deep linking and foreground state listeners
  useEffect(() => {
    if (!user) return;

    let appUrlListener: any;
    let appStateListener: any;

    const setupDeepLinks = async () => {
      try {
        const { App: CapApp } = await import("@capacitor/app");
        
        appUrlListener = CapApp.addListener("appUrlOpen", (event) => {
          const urlStr = event.url;
          if (urlStr.includes("add-expense")) {
            setIsExpenseModalOpen(true);
          } else if (urlStr.includes("ledger")) {
            navigateToTab("history");
          } else if (urlStr.includes("wallets")) {
            navigateToTab("wallets");
          }
        });

        // Pull notifications and widget transactions on start
        processPendingNotifications();
        processPendingWidgetTransactions();

        // Pull notifications and widget transactions when returning to foreground
        appStateListener = CapApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            processPendingNotifications();
            processPendingWidgetTransactions();
          }
        });
      } catch (err) {
        console.warn("Failed to register native deep links or state listener:", err);
      }
    };

    setupDeepLinks();

    return () => {
      if (appUrlListener) appUrlListener.remove();
      if (appStateListener) appStateListener.remove();
    };
  }, [user, setIsExpenseModalOpen, navigateToTab]);
}
