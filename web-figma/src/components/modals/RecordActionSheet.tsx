import React from "react";
import { 
  Plus, 
  TrendingUp, 
  Camera, 
  Upload, 
  RefreshCw, 
  BellRing
} from "lucide-react";
import ModalShell from "./ModalShell";
import { useLanguage } from "../../contexts/LanguageContext";

interface RecordActionSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectAction: (actionType: "expense" | "income" | "csv" | "screenshot" | "receipt" | "notifications") => void;
}

export default function RecordActionSheet({
  open,
  onClose,
  onSelectAction
}: RecordActionSheetProps) {
  const { t, lang } = useLanguage();

  return (
    <ModalShell
      open={open}
      title={lang === "id" ? "Catat / Tambah Data" : "Record / Add Data"}
      subtitle={lang === "id" ? "Pilih metode pencatatan atau pembaruan data keuangan Anda." : "Choose a method to record or update your financial data."}
      onClose={onClose}
    >
      <div className="space-y-6 py-2">
        {/* Primary Actions Grid */}
        <div className="grid grid-cols-3 gap-3">
          <button
            data-tour-id="record-expense-action"
            onClick={() => {
              onSelectAction("expense");
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-black/5 bg-[#FFF5F3] hover:bg-[#FFEAE6] transition-all text-center active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B58] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">
              {lang === "id" ? "Pengeluaran" : "Expense"}
            </span>
          </button>

          <button
            data-tour-id="record-income-action"
            onClick={() => {
              onSelectAction("income");
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-black/5 bg-[#EBF7F6] hover:bg-[#D5EFEF] transition-all text-center active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#29B9AA] text-white shadow-sm group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">
              {lang === "id" ? "Pemasukan" : "Income"}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectAction("receipt");
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-black/5 bg-[#FFF9F3] hover:bg-[#FFF1E2] transition-all text-center active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9F43] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Camera className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">
              {lang === "id" ? "Scan Struk" : "Scan Receipt"}
            </span>
          </button>
        </div>

        {/* Secondary Actions (Advanced/Otomatis) */}
        <div className="border-t border-black/5 pt-4 space-y-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">
            {lang === "id" ? "Fitur Lainnya" : "Other Features"}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onSelectAction("csv");
                onClose();
            }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 bg-[#FEF9F4] text-[#1A2B38] text-xs font-semibold hover:bg-[#F3EDE8] transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#5BAEE8]" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => {
                onSelectAction("screenshot");
                onClose();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 bg-[#FEF9F4] text-[#1A2B38] text-xs font-semibold hover:bg-[#F3EDE8] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FFD32A]" />
              <span>
                {lang === "id" ? "Update Saldo" : "Update Balance"}
              </span>
            </button>
            <button
              onClick={() => {
                onSelectAction("notifications");
                onClose();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 bg-[#FEF9F4] text-[#1A2B38] text-xs font-semibold hover:bg-[#F3EDE8] transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#A55EEA]" />
              <span>
                {lang === "id" ? "Cek Notifikasi" : "Check Notifications"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
