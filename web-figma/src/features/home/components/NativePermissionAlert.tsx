import { BellRing, AlertTriangle } from "lucide-react";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { toast } from "../../../utils/toast";
import { useLanguage } from "../../../contexts/LanguageContext";

const NotificationReceiver = registerPlugin<any>("NotificationReceiver");

interface NativePermissionAlertProps {
  androidNotifEnabled: boolean | null;
}

export default function NativePermissionAlert({ androidNotifEnabled }: NativePermissionAlertProps) {
  const { t } = useLanguage();

  if (!Capacitor.isNativePlatform() || androidNotifEnabled !== false) return null;

  return (
    <div className="rounded-2xl border border-[#FF6B58]/20 bg-red-50 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-[#FF6B58]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A2B38]">{t("home.permissionTitle", "Aktivasi Pemantauan Transaksi Otomatis")}</p>
          <p className="mt-0.5 text-xs text-[#7B6E67]">
            {t("home.permissionDesc", "Budget Flow perlu izin akses notifikasi agar bisa membaca SMS/notifikasi e-wallet & mencatat pengeluaran Anda secara otomatis.")}
          </p>
        </div>
      </div>
      <button
        onClick={async () => {
          try {
            await NotificationReceiver.openNotificationSettings();
          } catch {
            toast.error(t("home.permissionError", "Gagal membuka pengaturan."));
          }
        }}
        className="rounded-full bg-[#FF6B58] hover:bg-[#FF6B58]/90 text-white px-4 py-2 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
      >
        <BellRing className="w-3.5 h-3.5" />
        {t("home.permissionBtn", "Aktifkan Sekarang")}
      </button>
    </div>
  );
}
