import React from "react";
import { 
  Plus, 
  TrendingUp, 
  Camera, 
  Upload, 
  RefreshCw, 
  Zap, 
  BellRing
} from "lucide-react";
import ModalShell from "./ModalShell";

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
  return (
    <ModalShell
      open={open}
      title="Catat / Tambah Data"
      subtitle="Pilih metode pencatatan atau pembaruan data keuangan Anda."
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
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">Pengeluaran</span>
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
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">Pemasukan</span>
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
            <span className="mt-2 text-xs font-bold text-[#1A2B38]">Scan Struk</span>
          </button>
        </div>

        {/* Secondary Actions (Advanced/Otomatis) */}
        <div className="border-t border-black/5 pt-4 space-y-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Fitur Lainnya</h4>
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
              <span>Update Saldo</span>
            </button>
            <button
              onClick={() => {
                onSelectAction("notifications");
                onClose();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 bg-[#FEF9F4] text-[#1A2B38] text-xs font-semibold hover:bg-[#F3EDE8] transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#A55EEA]" />
              <span>Cek Notifikasi</span>
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
