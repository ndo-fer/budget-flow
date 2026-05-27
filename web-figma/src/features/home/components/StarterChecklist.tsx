import React, { useEffect, useState } from "react";
import { EyeOff, ChevronRight, Check } from "lucide-react";
import { getUserSetupStatus, setChecklistHidden, UserSetupStatus } from "../../../services/guidanceService";
import { toast } from "../../../utils/toast";

interface StarterChecklistProps {
  onNavigateTab: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
  onOpenRecordHub: () => void;
}

export default function StarterChecklist({ onNavigateTab, onOpenRecordHub }: StarterChecklistProps) {
  const [status, setStatus] = useState<UserSetupStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const data = await getUserSetupStatus();
      setStatus(data);
      setIsVisible(!data.starter_checklist_hidden);
    } catch (err) {
      console.warn("Failed to load setup status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Listen to transaction additions or other changes to refresh checklist
    const refreshEvents = ["wallet-transaction-added", "bf-guidance-updated", "wallet-added", "income-source-added", "budget-category-added"];
    const handler = () => loadStatus();
    
    refreshEvents.forEach(evt => window.addEventListener(evt, handler));
    return () => {
      refreshEvents.forEach(evt => window.removeEventListener(evt, handler));
    };
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      await setChecklistHidden(true);
      toast.success("Checklist onboarding disembunyikan. Anda dapat menampilkannya lagi di Pengaturan.");
    } catch (err) {
      console.error("Failed to hide checklist:", err);
    }
  };

  if (loading || !isVisible || !status) return null;
  
  const isAllDone = status.setup_completion_percent === 100;

  const steps = [
    {
      id: "wallet",
      title: "Registrasi Dompet Pertama",
      description: "Tambahkan bank, e-wallet, atau uang tunai untuk melacak saldo Anda.",
      isCompleted: status.has_wallet,
      actionLabel: "Tambah Dompet",
      action: () => onNavigateTab("wallets")
    },
    {
      id: "income",
      title: "Tambah Rencana Pemasukan",
      description: "Tentukan nominal estimasi gajian atau uang masuk bulanan Anda.",
      isCompleted: status.has_income_source,
      actionLabel: "Atur Pemasukan",
      action: () => onNavigateTab("budget")
    },
    {
      id: "budget",
      title: "Atur Anggaran Kategori",
      description: "Buat alokasi batas belanja per kategori (misal: Makanan, Transportasi).",
      isCompleted: status.has_budget_category,
      actionLabel: "Atur Budget",
      action: () => onNavigateTab("budget")
    },
    {
      id: "expense",
      title: "Catat Pengeluaran Pertama",
      description: "Mulai merekam transaksi harian secara manual atau otomatis.",
      isCompleted: status.has_expense_transaction,
      actionLabel: "Catat Sekarang",
      action: onOpenRecordHub
    },
    {
      id: "correction",
      title: "Koreksi & Konfirmasi Saldo",
      description: "Sesuaikan saldo pertama Anda agar akurat dengan kondisi asli.",
      isCompleted: status.has_balance_adjustment,
      actionLabel: "Update Saldo",
      action: onOpenRecordHub
    }
  ];

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#29B9AA]">Langkah Pengenalan</span>
          <h2 className="text-lg font-bold text-[#1A2B38] mt-1">Starter Checklist</h2>
          <p className="text-xs text-[#7B6E67] font-medium mt-0.5">
            {isAllDone 
              ? "Luar biasa! Semua langkah setup awal keuangan Anda telah selesai." 
              : "Selesaikan setup awal berikut untuk mengaktifkan pemantauan Safe-To-Spend harian secara akurat."}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF9F4] text-[#7B6E67] hover:bg-[#F3EDE8] transition-colors"
          title="Sembunyikan Checklist"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2.5 bg-[#FEF9F4]/40 p-4 rounded-xl border border-black/5">
        <div className="flex items-center justify-between text-xs font-bold text-[#1A2B38]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#29B9AA] animate-pulse" />
            Progres Setup
          </span>
          <span className="text-[#29B9AA]">{status.setup_completion_percent}% Selesai</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#29B9AA] to-[#5BAEE8] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${status.setup_completion_percent}%` }}
          />
        </div>
      </div>

      {/* Checklist List (Borderless List Style) */}
      <div className="space-y-1.5 pt-2">
        {steps.map((step, idx) => (
          <div 
            key={step.id}
            onClick={() => {
              if (!step.isCompleted) {
                step.action();
              }
            }}
            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-3.5 -mx-3.5 transition-all duration-200 rounded-xl ${
              step.isCompleted 
                ? "opacity-60 cursor-default" 
                : "hover:bg-[#FEF9F4]/60 cursor-pointer"
            }`}
          >
            {/* Left side: Checkbox & Text content */}
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {/* Checkbox */}
              <div className="mt-0.5 shrink-0">
                {step.isCompleted ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#29B9AA] text-white shadow-sm shadow-[#29B9AA]/10">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-black/20 bg-white text-transparent transition-all group-hover:border-[#29B9AA] group-hover:bg-[#29B9AA]/5">
                    <Check className="h-3 w-3 text-[#29B9AA] opacity-0 transition-opacity group-hover:opacity-40" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className={`text-sm font-bold tracking-tight transition-colors ${
                  step.isCompleted ? "text-[#7B6E67]/70 line-through font-medium" : "text-[#1A2B38] group-hover:text-[#29B9AA]"
                }`}>
                  {step.title}
                </h4>
                <p className={`text-xs leading-relaxed font-medium transition-colors ${
                  step.isCompleted ? "text-[#7B6E67]/50" : "text-[#7B6E67]"
                }`}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* Right side: Action Button */}
            {!step.isCompleted && (
              <div className="shrink-0 pl-[34px] sm:pl-0 sm:ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    step.action();
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#29B9AA]/5 border border-[#29B9AA]/20 group-hover:bg-[#29B9AA] group-hover:text-white group-hover:border-transparent px-3.5 py-1.5 text-xs font-bold text-[#29B9AA] transition-all duration-200 active:scale-[0.96] shadow-sm"
                >
                  <span>{step.actionLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
