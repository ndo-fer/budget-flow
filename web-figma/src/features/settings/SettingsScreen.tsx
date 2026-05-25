import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
  Settings
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { getCategories } from "../../services/categoryService";
import supabase from "../../lib/supabase";
import { getCurrentUserId } from "../../services/queryUtils";
import { formatCurrency } from "../../utils/format";
import CategoryModal from "../../components/modals/CategoryModal";
import { getPermissionStatus, requestNotificationPermission } from "../../services/notificationService";
import { exportAllRecurringToICS } from "../../services/calendarService";
import { getRecurringExpenses } from "../../services/recurringService";
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
  const { showChecklist } = useOnboarding();
  const [categories, setCategories] = useState<any[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isEnablingNotif, setIsEnablingNotif] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);

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

  const categorySummary = useMemo(() => {
    const totalBudget = categories.reduce((sum, category) => sum + (category.budget_amount || 0), 0);
    const topCategory = categories.reduce((highest, current) => {
      if (!highest || (current.priority || 0) > (highest.priority || 0)) return current;
      return highest;
    }, null);
    return { count: categories.length, totalBudget, topCategory };
  }, [categories]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kategori.");
    }
  };

  useEffect(() => {
    loadCategories();
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

  const handleExportCalendar = async () => {
    setIsExportingCalendar(true);
    try {
      const recurring = await getRecurringExpenses();
      if (recurring.length === 0) {
        toast.error("Belum ada recurring expense untuk diekspor.");
        return;
      }
      const count = exportAllRecurringToICS(recurring);
      toast.success(`${count} recurring expense berhasil diekspor ke kalender (.ics)`);
    } catch (err: any) {
      toast.error(err.message || "Gagal ekspor kalender.");
    } finally {
      setIsExportingCalendar(false);
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

  const handleChangePassword = async () => {
    const password = window.prompt("Masukkan password baru (minimal 6 karakter)");
    if (!password) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diganti.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengganti password.");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Logout dari akun ini?")) return;
    try {
      await signOut();
      toast.success("Berhasil logout.");
    } catch (err: any) {
      toast.error(err.message || "Gagal logout.");
    }
  };

  const handleOpenTutorial = async () => {
    try {
      onOpenTutorial();
      await showChecklist();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuka tutorial.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA] leading-none">Settings</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Biar app ini terasa makin pas dengan ritmemu.</h1>
          <p className="mt-3 text-sm text-[#7B6E67] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB347]" />
            <span>{categorySummary.count} kategori aktif dengan total budget {formatCurrency(categorySummary.totalBudget)}.</span>
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Account</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4 flex items-center gap-3">
                  <User className="w-5 h-5 text-[#29B9AA] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">{user?.email || "Unknown user"}</p>
                    <p className="text-xs text-[#7B6E67]">Budget Flow account</p>
                  </div>
                </div>
                <button onClick={handleChangePassword} className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left hover:bg-[#F3EDE8] transition-colors">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#7B6E67] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A2B38]">Change Password</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">Web implementation memakai prompt sederhana untuk sekarang.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#29B9AA] shrink-0">Open</span>
                </button>
                <button onClick={handleLogout} className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-4 py-4 text-left hover:bg-red-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-[#FF6B58] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#FF6B58]">Logout</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">Keluar dari akun ini kapan saja.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B58] shrink-0">Now</span>
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Preferences</p>
              <div className="mt-4 space-y-3">
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
                        <p className="text-sm font-semibold text-[#1A2B38]">Notifikasi Browser</p>
                        <p className="mt-1 text-xs text-[#7B6E67]">
                          {notifPermission === "granted" && "Aktif – kamu akan dapat reminder budget & jatuh tempo."}
                          {notifPermission === "denied" && "Diblokir – aktifkan di pengaturan browser (klik 🔒 di address bar)."}
                          {notifPermission === "default" && "Izinkan agar dapat pengingat budget & recurring expense."}
                          {notifPermission === "unsupported" && "Browser ini tidak mendukung notifikasi."}
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
                        {isEnablingNotif ? "..." : "Aktifkan"}
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
                          <p className="text-sm font-semibold text-[#1A2B38]">Pemantauan Transaksi Android</p>
                          <p className="mt-1 text-xs text-[#7B6E67]">
                            {androidNotifEnabled 
                              ? "Akses aktif – transaksi otomatis dipantau di background dari notifikasi/email."
                              : "Akses dinonaktifkan – aktifkan agar app bisa mencatat otomatis dari GoPay, SeaBank, dan email Gmail."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenAndroidNotifSettings}
                        className="shrink-0 rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white"
                      >
                        {androidNotifEnabled ? "Atur" : "Aktifkan"}
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleOpenTutorial} className="flex w-full items-center justify-between rounded-2xl bg-[#29B9AA] px-4 py-4 text-left text-white shadow-sm">
                  <div>
                    <p className="text-sm font-semibold">Lihat Tutorial Lagi</p>
                    <p className="mt-1 text-xs text-white/80">Buka onboarding lagi dan munculkan starter checklist.</p>
                  </div>
                  <span className="text-xs font-bold text-white">Open</span>
                </button>
              </div>
            </div>

            {/* Calendar integration */}
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF7F6] text-[#29B9AA]">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Kalender</p>
              </div>
              <div className="mt-4 space-y-3">
                <button
                  id="btn-export-calendar"
                  onClick={handleExportCalendar}
                  disabled={isExportingCalendar}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left disabled:opacity-60"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">Export Recurring ke Kalender</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">
                      Download file .ics — bisa dibuka di Google Calendar, Apple Calendar, atau Outlook.
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-[#29B9AA]" />
                </button>
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <p className="text-xs font-semibold text-[#1A2B38]">Cara pakai file .ics</p>
                  <ol className="mt-2 space-y-1 text-xs text-[#7B6E67] list-decimal list-inside">
                    <li>Klik "Export Recurring ke Kalender"</li>
                    <li>Buka file .ics yang terdownload</li>
                    <li>Pilih "Tambah ke Google Calendar / Apple Calendar"</li>
                    <li>Semua recurring expense otomatis masuk sebagai event berulang ✅</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Notification Allowlist */}
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF7F6] text-[#29B9AA]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Notification Allowlist</p>
              </div>
              <p className="mt-3 text-xs text-[#7B6E67]">
                Aplikasi keuangan yang dipantau notifikasinya. OTP dan kode verifikasi selalu difilter otomatis.
              </p>
              <div className="mt-4 space-y-2">
                {DEFAULT_ALLOWLIST_APPS.map((app) => {
                  const enabled = allowlist[app.package_name] !== false;
                  return (
                    <button
                      key={app.package_name}
                      onClick={() => toggleAllowlist(app.package_name)}
                      className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-3 text-left"
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
                Aktif saat Budget Flow berjalan sebagai APK Android.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[#7B6E67]">
                    <Layers className="w-3.5 h-3.5 text-[#7B6E67] flex-shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-[0.28em]">Categories</p>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-[#1A2B38]">Kelola kategori</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada kategori aktif.</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left hover:bg-[#F3EDE8] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <div>
                          <p className="text-sm font-semibold text-[#1A2B38]">{category.name}</p>
                          <p className="mt-1 text-xs text-[#7B6E67]">
                            {formatCurrency(category.budget_amount)} • Priority {category.priority || 3}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#29B9AA] shadow-sm flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        Edit
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Data</p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1A2B38]">Export Expenses (CSV)</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Unduh salinan transaksi untuk dibagikan atau dicek lagi.</p>
                </div>
                <span className="text-xs font-bold text-[#29B9AA]">{isExporting ? "Working..." : "Export"}</span>
              </button>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">About</p>
              <div className="mt-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                <p className="text-sm font-semibold text-[#1A2B38]">App Version</p>
                <p className="mt-1 text-xs text-[#7B6E67]">{APP_VERSION}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryModal open={showCategoryModal} category={selectedCategory} onClose={() => setShowCategoryModal(false)} onSaved={loadCategories} />
    </>
  );
}
