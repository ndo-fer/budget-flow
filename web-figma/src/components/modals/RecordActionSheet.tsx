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
        {/* Section 1: Transaksi Harian */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Pencatatan Transaksi Harian</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => {
                onSelectAction("expense");
                onClose();
              }}
              className="group flex flex-col items-center justify-center p-5 rounded-[24px] border border-black/5 bg-[#FFF5F3] hover:bg-[#FFEAE6] transition-all text-center active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B58] to-[#E8503F] text-white shadow-md shadow-[#FF6B58]/15 group-hover:scale-105 transition-transform">
                <Plus className="h-5.5 w-5.5 stroke-[2.5]" />
              </div>
              <span className="mt-3 text-xs font-bold text-[#1A2B38]">Tambah Pengeluaran</span>
              <span className="mt-1 text-[9px] text-[#7B6E67] font-semibold leading-tight">Catat pengeluaran secara manual</span>
            </button>

            <button
              onClick={() => {
                onSelectAction("income");
                onClose();
              }}
              className="group flex flex-col items-center justify-center p-5 rounded-[24px] border border-black/5 bg-[#EBF7F6] hover:bg-[#D5EFEF] transition-all text-center active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#29B9AA] to-[#209F92] text-white shadow-md shadow-[#29B9AA]/15 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <span className="mt-3 text-xs font-bold text-[#1A2B38]">Tambah Pemasukan</span>
              <span className="mt-1 text-[9px] text-[#7B6E67] font-semibold leading-tight">Catat uang masuk secara manual</span>
            </button>

            <button
              onClick={() => {
                onSelectAction("receipt");
                onClose();
              }}
              className="group flex flex-col items-center justify-center p-5 rounded-[24px] border border-black/5 bg-[#FFF9F3] hover:bg-[#FFF1E2] transition-all text-center active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F43] to-[#E08528] text-white shadow-md shadow-[#FF9F43]/15 group-hover:scale-105 transition-transform">
                <Camera className="h-5.5 w-5.5" />
              </div>
              <span className="mt-3 text-xs font-bold text-[#1A2B38]">Scan Struk Belanja</span>
              <span className="mt-1 text-[9px] text-[#7B6E67] font-semibold leading-tight">Ekstrak otomatis dari foto struk</span>
            </button>
          </div>
        </div>

        {/* Section 2: Ingest Otomatis */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Import Otomatis & Sinkronisasi</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                onSelectAction("csv");
                onClose();
              }}
              className="group flex items-center gap-4 p-4 rounded-[24px] border border-black/5 bg-[#F0F7FF] hover:bg-[#DCEBFF] transition-all text-left active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5BAEE8] to-[#4094CE] text-white shadow-md shadow-[#5BAEE8]/15 group-hover:scale-105 transition-transform">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#1A2B38]">Import CSV Mutasi</span>
                <span className="block mt-0.5 text-[9px] text-[#7B6E67] font-semibold leading-relaxed">Unggah file CSV mutasi bank atau e-wallet Anda</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectAction("notifications");
                onClose();
              }}
              className="group flex items-center gap-4 p-4 rounded-[24px] border border-black/5 bg-[#FAF4FF] hover:bg-[#F2E3FF] transition-all text-left active:scale-[0.98]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A55EEA] to-[#8843CD] text-white shadow-md shadow-[#A55EEA]/15 group-hover:scale-105 transition-transform">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#1A2B38]">Cek Notifikasi Keuangan</span>
                <span className="block mt-0.5 text-[9px] text-[#7B6E67] font-semibold leading-relaxed">Proses ulang notifikasi SMS/Aplikasi bank yang masuk</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Koreksi Saldo */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Saldo & Rekonsiliasi</h4>
          <button
            onClick={() => {
              onSelectAction("screenshot");
              onClose();
            }}
            className="group flex w-full items-center gap-4 p-4 rounded-[24px] border border-black/5 bg-[#FFFBF0] hover:bg-[#FFF5D5] transition-all text-left active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD32A] to-[#E5BD20] text-white shadow-md shadow-[#FFD32A]/15 group-hover:scale-105 transition-transform">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <span className="block text-xs font-bold text-[#1A2B38]">Koreksi Saldo Dompet</span>
              <span className="block mt-0.5 text-[9px] text-[#7B6E67] font-semibold leading-relaxed">Unggah screenshot saldo dompet atau sesuaikan jumlah saldo secara manual</span>
            </div>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
