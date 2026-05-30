import { useEffect, useMemo, useState } from "react";
import { toast } from "../../utils/toast";
import { 
  Bell, 
  BellOff, 
  Calendar, 
  Download, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight,
  Trash2,
  RefreshCw,
  Lock,
  Pencil,
  PlusCircle,
  User,
  Sparkles,
  BookOpen,
  Layers,
  Settings,
  LogOut,
  Globe,
  Flame,
  Coins,
  Snowflake
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import supabase from "../../lib/supabase";
import { useSpotlightTour } from "../../components/onboarding/SpotlightTourProvider";
import { getCurrentUserId } from "../../services/queryUtils";
import { formatCurrency } from "../../utils/format";
import ModalShell from "../../components/modals/ModalShell";
import { getPermissionStatus, requestNotificationPermission } from "../../services/notificationService";
import { DEFAULT_ALLOWLIST_APPS } from "../../services/notificationParserService";

const ALLOWLIST_KEY = "bf_notification_allowlist";

const APP_VERSION = "1.0.0";

const escapeCsvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

import { registerPlugin, Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");

export default function SettingsScreen({
  onOpenTutorial,
}: {
  onOpenTutorial: () => void;
}) {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { showChecklist } = useOnboarding();
  const { resetTour } = useSpotlightTour();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isEnablingNotif, setIsEnablingNotif] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [gamification, setGamification] = useState<any>(null);

  const loadStats = () => {
    import("../../services/gamificationService").then(({ getUserGamification }) => {
      getUserGamification().then((data) => setGamification(data)).catch(() => {});
    });
  };

  useEffect(() => {
    loadStats();
    window.addEventListener("gamification-updated", loadStats);
    window.addEventListener("wallet-transaction-added", loadStats);
    return () => {
      window.removeEventListener("gamification-updated", loadStats);
      window.removeEventListener("wallet-transaction-added", loadStats);
    };
  }, []);

  const handleBuyFreeze = async () => {
    if (!gamification) return;
    if (gamification.coins < 25) {
      toast.warning(
        lang === "id" 
          ? "🪙 Koin Tidak Cukup! Kamu butuh 25 koin untuk membeli Streak Freeze. Kumpulkan koin dengan mencatat transaksi harian di bawah budget!"
          : "🪙 Not Enough Coins! You need 25 coins to buy a Streak Freeze. Earn coins by logging daily transactions under your budget limit!",
        {
          duration: 6000,
        }
      );
      return;
    }
    try {
      const { buyStreakFreeze } = await import("../../services/gamificationService");
      const updated = await buyStreakFreeze();
      setGamification(updated);
      toast.success(lang === "id" ? "Berhasil membeli 1 Streak Freeze! ❄️" : "Successfully purchased 1 Streak Freeze! ❄️");
      window.dispatchEvent(new CustomEvent("gamification-updated"));
    } catch (err: any) {
      toast.error(err.message || "Gagal membeli Streak Freeze.");
    }
  };

  // Android Notification access state
  const [androidNotifEnabled, setAndroidNotifEnabled] = useState<boolean | null>(null);

  // Notification allowlist (persisted to localStorage)
  const [allowlist, setAllowlist] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(ALLOWLIST_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    // Default: all enabled
    return Object.fromEntries(DEFAULT_ALLOWLIST_APPS.map((a) => [a.package_name, true]));
  });

  const toggleAllowlist = (packageName: string) => {
    setAllowlist((prev) => {
      const next = { ...prev, [packageName]: !prev[packageName] };
      localStorage.setItem(ALLOWLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setNotifPermission(getPermissionStatus());

    if (!Capacitor.isNativePlatform()) return;

    const checkAccess = async () => {
      try {
        const res = await NotificationReceiver.checkNotificationAccess();
        setAndroidNotifEnabled(res.enabled);
      } catch {}
    };

    checkAccess();

    const listener = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        checkAccess();
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  const handleOpenAndroidNotifSettings = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await NotificationReceiver.openNotificationSettings();
        // Fallback check
        setTimeout(async () => {
          const res = await NotificationReceiver.checkNotificationAccess();
          setAndroidNotifEnabled(res.enabled);
        }, 1000);
      } catch (err: any) {
        toast.error("Gagal membuka pengaturan sistem.");
      }
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnablingNotif(true);
    try {
      const granted = await requestNotificationPermission();
      setNotifPermission(granted ? "granted" : "denied");
      if (granted) {
        toast.success("Notifikasi diaktifkan! Kamu akan dapat reminder budget dan jatuh tempo.");
      } else {
        toast.error("Notifikasi diblokir. Aktifkan manual di pengaturan browser.");
      }
    } finally {
      setIsEnablingNotif(false);
    }
  };


  const handleExport = async () => {
    try {
      setIsExporting(true);
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("daily_expenses")
        .select(`
          *,
          budget_categories (name, color)
        `)
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      let csv = "\uFEFFTransaction ID,Date,Month,Category,Amount IDR,Note\n";
      (data || []).forEach((expense) => {
        csv += [
          escapeCsvCell(expense.id),
          escapeCsvCell(expense.date),
          escapeCsvCell(expense.date.slice(0, 7)),
          escapeCsvCell(expense.budget_categories?.name || "Unknown"),
          escapeCsvCell(expense.amount),
          escapeCsvCell(expense.note || ""),
        ].join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget_flow_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV export berhasil diunduh.");
    } catch (err: any) {
      toast.error(err.message || "Gagal export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleOpenPasswordModal = () => {
    setNewPassword("");
    setConfirmNewPassword("");
    setShowPasswordModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    if (!newPassword) {
      toast.error("Password baru wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Konfirmasi password baru tidak cocok.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password berhasil diganti.");
      setShowPasswordModal(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengganti password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await signOut();
      toast.success("Berhasil logout.");
      setShowLogoutModal(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal logout.");
    }
  };

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      toast.success("Akun dan data Anda berhasil dihapus.");
      await signOut();
      setShowDeleteAccountModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menghapus akun.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleOpenTutorial = async () => {
    try {
      onOpenTutorial();
      await showChecklist();
      await resetTour();
      toast.success("Tutorial & Spotlight Onboarding telah di-reset!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuka tutorial.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA] leading-none">{t("settings.title", "Pengaturan")}</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">{t("settings.subtitle", "Biar app ini terasa makin pas dengan ritmemu.")}</h1>
          <p className="mt-3 text-sm text-[#7B6E67] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB347]" />
            <span>{t("settings.description", "Atur preferensi akun, izin notifikasi, dan kelola ekspor data Anda di sini.")}</span>
          </p>
        </div>

        {/* Gamification & Rewards Panel */}
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Sleek top indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-sky-400" />
          
          <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-6">
            {/* Left: Stats */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-500 shadow-sm">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1A2B38]">{lang === "id" ? "Sistem Gamifikasi & Hadiah" : "Gamification & Rewards"}</h2>
                    <p className="text-[11px] text-[#7B6E67]">{lang === "id" ? "Rutin mencatat & hemat budget untuk mengumpulkan koin" : "Log daily & spend smart to earn coins"}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Streak Card */}
                <div className="group rounded-2xl bg-gradient-to-br from-orange-50/40 via-white to-white p-4 border border-black/5 hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-2xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">🔥</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#7B6E67]">{lang === "id" ? "Streak Harian" : "Daily Streak"}</p>
                  <p className="mt-2.5 text-3xl font-black text-[#1A2B38] flex items-baseline gap-1">
                    <span>{gamification?.current_streak || 0}</span>
                    <span className="text-xs font-semibold text-[#7B6E67] lowercase">{lang === "id" ? "hari" : "days"}</span>
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-orange-100/50 px-2 py-0.5 text-[9px] font-bold text-orange-600">
                    <span>🔥 {lang === "id" ? "Rekor" : "Best"}: {gamification?.longest_streak || 0} {lang === "id" ? "hari" : "days"}</span>
                  </div>
                </div>

                {/* Coin Card */}
                <div className="group rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-white p-4 border border-black/5 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-2xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">🪙</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#7B6E67]">{lang === "id" ? "Tabungan Koin" : "Coin Balance"}</p>
                  <p className="mt-2.5 text-3xl font-black text-[#1A2B38] flex items-baseline gap-1.5">
                    <span>{gamification?.coins || 0}</span>
                    <span className="text-sm">🪙</span>
                  </p>
                  <p className="text-[10px] text-[#7B6E67] font-semibold mt-3.5">{lang === "id" ? "Siap ditukar Freeze" : "Ready to redeem"}</p>
                </div>

                {/* Freeze Card */}
                <div className="group rounded-2xl bg-gradient-to-br from-sky-50/40 via-white to-white p-4 border border-black/5 hover:border-sky-300 hover:shadow-md hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-2xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">❄️</div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#7B6E67]">{lang === "id" ? "Streak Freeze" : "Streak Freeze"}</p>
                  <p className="mt-2.5 text-3xl font-black text-[#1A2B38] flex items-baseline gap-1.5">
                    <span>{gamification?.streak_freezes || 0}</span>
                    <span className="text-sm">❄️</span>
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-sky-100/50 px-2 py-0.5 text-[9px] font-bold text-sky-600">
                    <span>❄️ {lang === "id" ? "Aktif otomatis" : "Auto active"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Shop */}
            <div className="w-full lg:w-80 bg-gradient-to-br from-[#FEF9F4]/70 to-[#FEF9F4] border border-black/5 rounded-2xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 h-20 w-20 rounded-full bg-sky-200/20 blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-500 shadow-sm">
                    <Snowflake className="w-4 h-4 text-sky-500" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1A2B38]">
                    {lang === "id" ? "Toko Penyelamat" : "Protection Shop"}
                  </h3>
                </div>
                <p className="text-[11px] text-[#7B6E67] mt-3 leading-relaxed">
                  {lang === "id" 
                    ? "Beli Streak Freeze untuk mengamankan streak Anda jika suatu hari lupa mencatat transaksi."
                    : "Buy Streak Freeze to secure your streak if you forget to record transactions."}
                </p>
              </div>
              <div className="mt-5">
                <button
                  onClick={handleBuyFreeze}
                  className="w-full rounded-xl bg-gradient-to-r from-[#29B9AA] to-[#229A8E] hover:from-[#229A8E] hover:to-[#1C8277] active:scale-[0.98] text-white font-extrabold py-3 px-4 text-xs text-center transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{lang === "id" ? "Beli 1 Freeze" : "Buy 1 Freeze"}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black">25 🪙</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{t("settings.accountSection", "Akun")}</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4 flex items-center gap-3">
                  <User className="w-5 h-5 text-[#29B9AA] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">{user?.email || "Unknown user"}</p>
                    <p className="text-xs text-[#7B6E67]">{t("settings.accountDesc", "Akun Budget Flow")}</p>
                  </div>
                </div>
                <button onClick={handleOpenPasswordModal} className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left hover:bg-[#F3EDE8] transition-colors">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#7B6E67] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.changePassword", "Ganti Password")}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.changePasswordDesc", "Ubah password Anda untuk keamanan tambahan.")}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#29B9AA] shrink-0">{t("settings.changePasswordButton", "Buka")}</span>
                </button>
                <button onClick={() => setShowLogoutModal(true)} className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-4 py-4 text-left hover:bg-red-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <LogOut className="w-5 h-5 text-[#FF6B58] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#FF6B58]">{t("common.logout", "Logout")}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.logoutDesc", "Keluar dari akun ini kapan saja.")}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B58] shrink-0">{t("settings.logoutButton", "Keluar")}</span>
                </button>
                <button onClick={() => setShowDeleteAccountModal(true)} className="flex w-full items-center justify-between rounded-2xl bg-red-50/50 border border-red-200/60 px-4 py-4 text-left hover:bg-red-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-[#FF6B58] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#FF6B58]">{t("settings.deleteAccount", "Hapus Akun")}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.deleteAccountDesc", "Hapus permanen seluruh data dan akun Anda dari database.")}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B58] shrink-0">{t("settings.deleteAccountButton", "Hapus")}</span>
                </button>
              </div>
            </div>



            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{t("settings.preferencesSection", "Preferensi")}</p>
              <div className="mt-4 space-y-3">
                {/* Language preference */}
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#29B9AA]/20 text-[#29B9AA]">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.language", "Bahasa Aplikasi")}</p>
                        <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.languageDesc", "Ganti bahasa antarmuka aplikasi.")}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-black/5 p-1">
                      <button
                        onClick={() => setLang("id")}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                          lang === "id"
                            ? "bg-white text-[#1A2B38] shadow-sm"
                            : "text-[#7B6E67] hover:text-[#1A2B38]"
                        }`}
                      >
                        ID
                      </button>
                      <button
                        onClick={() => setLang("en")}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                          lang === "en"
                            ? "bg-white text-[#1A2B38] shadow-sm"
                            : "text-[#7B6E67] hover:text-[#1A2B38]"
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification permission */}
                <div className={`rounded-2xl px-4 py-4 ${
                  notifPermission === "granted" ? "bg-[#EBF7F6]" :
                  notifPermission === "denied" ? "bg-red-50" : "bg-[#FEF9F4]"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                        notifPermission === "granted" ? "bg-[#29B9AA]/20 text-[#29B9AA]" :
                        notifPermission === "denied" ? "bg-red-100 text-[#FF6B58]" : "bg-[#FFB347]/20 text-[#FFB347]"
                      }`}>
                        {notifPermission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.browserNotifications", "Notifikasi Browser")}</p>
                        <p className="mt-1 text-xs text-[#7B6E67]">
                          {notifPermission === "granted" && t("settings.browserNotificationsActive", "Aktif – kamu akan dapat reminder budget & jatuh tempo.")}
                          {notifPermission === "denied" && t("settings.browserNotificationsBlocked", "Diblokir – aktifkan di pengaturan browser (klik 🔒 di address bar).")}
                          {notifPermission === "default" && t("settings.browserNotificationsDefault", "Izinkan agar dapat pengingat budget & recurring expense.")}
                          {notifPermission === "unsupported" && t("settings.browserNotificationsUnsupported", "Browser ini tidak mendukung notifikasi.")}
                        </p>
                      </div>
                    </div>
                    {notifPermission !== "granted" && notifPermission !== "unsupported" && (
                      <button
                        id="btn-enable-notifications"
                        onClick={handleEnableNotifications}
                        disabled={isEnablingNotif || notifPermission === "denied"}
                        className="shrink-0 rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {isEnablingNotif ? "..." : t("settings.browserNotificationsBtn", "Aktifkan")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Android Notification Listener Permission */}
                {Capacitor.isNativePlatform() && (
                  <div className={`rounded-2xl px-4 py-4 ${
                    androidNotifEnabled ? "bg-[#EBF7F6]" : "bg-red-50"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                          androidNotifEnabled ? "bg-[#29B9AA]/20 text-[#29B9AA]" : "bg-red-100 text-[#FF6B58]"
                        }`}>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.androidTracking", "Pemantauan Transaksi Android")}</p>
                          <p className="mt-1 text-xs text-[#7B6E67]">
                            {androidNotifEnabled 
                              ? t("settings.androidTrackingActive", "Akses aktif – transaksi otomatis dipantau di background dari notifikasi/email.")
                              : t("settings.androidTrackingInactive", "Akses dinonaktifkan – aktifkan agar app bisa mencatat otomatis dari GoPay, SeaBank, dan email Gmail.")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenAndroidNotifSettings}
                        className="shrink-0 rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white"
                      >
                        {androidNotifEnabled ? t("settings.androidTrackingBtnActive", "Atur") : t("settings.androidTrackingBtnInactive", "Aktifkan")}
                      </button>
                    </div>
                  </div>
                )}

                {Capacitor.isNativePlatform() && (
                  <button
                    onClick={async () => {
                      try {
                        const { LocalNotifications: capLocalNotifs } = await import("@capacitor/local-notifications");
                        await capLocalNotifs.schedule({
                          notifications: [
                            {
                              id: 99999,
                              title: `🚨 ${t("settings.testNotification", "Test Kirim Notifikasi")}`,
                              body: "Jika Anda melihat notifikasi ini, maka perizinan dan saluran notifikasi Anda sudah berjalan dengan baik!",
                              channelId: "budget-flow-alerts",
                              schedule: { at: new Date(Date.now() + 2000) }
                            }
                          ]
                        });
                        toast.success("Test notifikasi terkirim ke sistem!");
                      } catch (e: any) {
                        toast.error(`Gagal mengirim test notifikasi: ${e.message || e}`);
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-[#EBF7F6] px-4 py-4 text-left hover:bg-[#D5EFEB] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-[#29B9AA] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.testNotification", "Test Kirim Notifikasi")}</p>
                        <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.testNotificationDesc", "Ketuk untuk menguji apakah notifikasi push sistem berfungsi.")}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#29B9AA] shrink-0">{t("settings.testNotificationBtn", "Tes")}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    window.history.pushState({}, "", "/design-preview");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#000814] px-4 py-4 text-left text-white shadow-sm hover:bg-[#000814]/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{t("settings.designPreview", "Design Preview (V2)")}</p>
                      <p className="mt-1 text-xs text-white/70">{t("settings.designPreviewDesc", "Coba antarmuka baru dengan tema Dark Hybrid modern.")}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 shrink-0">{t("settings.designPreviewBtn", "Buka V2")}</span>
                </button>

                <button onClick={handleOpenTutorial} className="flex w-full items-center justify-between rounded-2xl bg-[#29B9AA] px-4 py-4 text-left text-white shadow-sm">
                  <div>
                    <p className="text-sm font-semibold">{t("settings.viewTutorial", "Lihat Tutorial Lagi")}</p>
                    <p className="mt-1 text-xs text-white/80">{t("settings.viewTutorialDesc", "Buka onboarding lagi dan munculkan starter checklist.")}</p>
                  </div>
                  <span className="text-xs font-bold text-white">{t("settings.viewTutorialBtn", "Buka")}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Notification Allowlist */}
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF7F6] text-[#29B9AA]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{t("settings.appPermissions", "Daftar Izin Aplikasi")}</p>
              </div>
              <p className="mt-3 text-xs text-[#7B6E67]">
                {t("settings.appPermissionsDesc", "Aplikasi keuangan yang dipantau notifikasinya. OTP dan kode verifikasi selalu difilter otomatis.")}
              </p>
              <div className="mt-4 max-h-[280px] overflow-y-auto pr-1.5 space-y-2 scrollbar-thin scrollbar-thumb-teal-500">
                {DEFAULT_ALLOWLIST_APPS.map((app) => {
                  const enabled = allowlist[app.package_name] !== false;
                  return (
                    <button
                      key={app.package_name}
                      onClick={() => toggleAllowlist(app.package_name)}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3 text-left hover:bg-[#F3EDE8] transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B38]">{app.app_name}</p>
                        <p className="text-[10px] text-[#7B6E67]">{app.package_name}</p>
                      </div>
                      {enabled
                        ? <ToggleRight className="h-5 w-5 text-[#29B9AA]" />
                        : <ToggleLeft className="h-5 w-5 text-[#7B6E67]" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-[#7B6E67]">
                {t("settings.appPermissionsFooter", "Aktif saat Budget Flow berjalan sebagai APK Android.")}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{t("settings.financialData", "Data Keuangan")}</p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.exportCSV", "Ekspor Pengeluaran (CSV)")}</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">{t("settings.exportCSVDesc", "Unduh salinan transaksi untuk dibagikan atau dicek lagi.")}</p>
                </div>
                <span className="text-xs font-bold text-[#29B9AA]">{isExporting ? t("common.loading", "Memproses...") : t("settings.exportCSVBtn", "Ekspor")}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">{t("settings.aboutApp", "Tentang Aplikasi")}</p>
              <div className="mt-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                <p className="text-sm font-semibold text-[#1A2B38]">{t("settings.appVersion", "Versi Aplikasi")}</p>
                <p className="mt-1 text-xs text-[#7B6E67]">{APP_VERSION}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ModalShell
        open={showPasswordModal}
        title={t("settings.modalChangePasswordTitle", "Ganti Password")}
        subtitle={t("settings.modalChangePasswordSub", "Buat password baru yang aman untuk akun Anda")}
        onClose={() => setShowPasswordModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#7B6E67]"
            >
              {t("common.cancel", "Batal")}
            </button>
            <button
              onClick={handleConfirmPasswordChange}
              disabled={isChangingPassword}
              className="rounded-2xl bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isChangingPassword ? t("common.loading", "Memproses...") : t("settings.changePassword", "Ganti Password")}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7B6E67]">{t("settings.modalNewPasswordLabel", "Password Baru")}</label>
            <input
              type="password"
              placeholder={t("settings.modalNewPasswordPlaceholder", "Minimal 6 karakter")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7B6E67]">{t("settings.modalConfirmPasswordLabel", "Konfirmasi Password Baru")}</label>
            <input
              type="password"
              placeholder={t("settings.modalConfirmPasswordPlaceholder", "Ulangi password baru")}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
            />
          </div>
        </div>
      </ModalShell>

      {/* Logout Confirmation Modal */}
      <ModalShell
        open={showLogoutModal}
        title={t("settings.modalLogoutTitle", "Keluar dari Akun?")}
        onClose={() => setShowLogoutModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#7B6E67]"
            >
              {t("common.cancel", "Batal")}
            </button>
            <button
              onClick={handleConfirmLogout}
              className="rounded-2xl bg-[#FF6B58] px-5 py-3 text-sm font-semibold text-white"
            >
              {t("settings.modalLogoutConfirm", "Keluar Sekarang")}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#7B6E67] leading-relaxed">
          {t("settings.modalLogoutDesc", "Apakah Anda yakin ingin keluar dari akun Anda? Anda harus masuk kembali untuk mengakses data pencatatan transaksi Anda.")}
        </p>
      </ModalShell>

      {/* Delete Account Confirmation Modal */}
      <ModalShell
        open={showDeleteAccountModal}
        title={t("settings.modalDeleteTitle", "Hapus Akun Permanen?")}
        onClose={() => setShowDeleteAccountModal(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              disabled={isDeletingAccount}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#7B6E67]"
            >
              {t("common.cancel", "Batal")}
            </button>
            <button
              onClick={handleConfirmDeleteAccount}
              disabled={isDeletingAccount}
              className="rounded-2xl bg-[#FF6B58] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isDeletingAccount ? t("common.loading", "Menghapus...") : t("settings.modalDeleteConfirm", "Hapus Permanen")}
            </button>
          </div>
        }
      >
        <p className="text-sm text-[#7B6E67] leading-relaxed">
          {t("settings.modalDeleteDesc", "Apakah Anda yakin ingin menghapus akun Anda? Seluruh kategori, wallet, transaksi, dan data lainnya akan dihapus secara permanen dari database dan tidak dapat dipulihkan.")}
        </p>
      </ModalShell>
    </>
  );
}
