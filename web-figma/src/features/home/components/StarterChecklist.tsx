import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, EyeOff, ChevronRight, Check } from "lucide-react";
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
  
  // Check if all P0 setup items are completed
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
      action: () => onNavigateTab("budget") // Relocated features: income source is in Rencana/budget screen
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
    <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#1A2B38]">
          <span>Progres Setup</span>
          <span className="text-[#29B9AA]">{status.setup_completion_percent}% Selesai</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#29B9AA] to-[#5BAEE8] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${status.setup_completion_percent}%` }}
          />
        </div>
      </div>

      {/* Checklist List */}
      <div className="grid gap-3.5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
        {steps.map((step, idx) => (
          <div 
            key={step.id}
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
              step.isCompleted 
                ? "bg-[#FEF9F4]/40 border-black/5 opacity-75" 
                : "bg-white border-black/10 hover:border-[#29B9AA]/30"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {step.isCompleted ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              ) : (
                <Circle className="h-5 w-5 text-black/20" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className={`text-xs font-bold ${step.isCompleted ? "text-[#7B6E67] line-through font-semibold" : "text-[#1A2B38]"}`}>
                {idx + 1}. {step.title}
              </h4>
              <p className="text-[10.5px] leading-relaxed font-semibold text-[#7B6E67]">
                {step.description}
              </p>
            </div>

            {!step.isCompleted && (
              <button
                onClick={step.action}
                className="shrink-0 flex items-center gap-1 rounded-xl bg-[#FEF9F4] border border-[#29B9AA]/20 hover:border-[#29B9AA]/50 hover:bg-[#EBF7F6] px-3 py-1.5 text-[10px] font-bold text-[#29B9AA] transition-all active:scale-[0.96]"
              >
                <span>{step.actionLabel}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
