import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createPlan, getCurrentPlan } from "../../services/planService";
import { getDaysInMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";
import ModalShell from "./ModalShell";

export default function MonthlyPlanModal({
  open,
  month,
  onClose,
  onSaved,
}: {
  open: boolean;
  month: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [income, setIncome] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    getCurrentPlan(month)
      .then((plan) => setIncome(plan?.income ? String(plan.income) : ""))
      .catch(() => setIncome(""));
  }, [month, open]);

  const dailyBudget = income ? Math.round(Number(income) / (getDaysInMonth(month) || 30)) : 0;

  const handleSubmit = async () => {
    if (!income || Number(income) <= 0) {
      toast.error("Isi income bulanan yang valid dulu.");
      return;
    }

    try {
      setIsSaving(true);
      await createPlan(month, Number(income));
      toast.success("Monthly plan berhasil disimpan.");
      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Plan tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan monthly plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title="Monthly Plan"
      subtitle="Income bulanan ini akan dipakai untuk budget harian, alert, dan analytics."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#FF6B58] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Simpan Plan"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#FEF9F4] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B6E67]">Bulan</p>
          <p className="mt-1 text-lg font-bold text-[#1A2B38]">{month}</p>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Income Bulanan</span>
          <input
            type="number"
            min="0"
            value={income}
            onChange={(event) => setIncome(event.target.value)}
            placeholder="7500000"
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
          />
        </label>
        <div className="rounded-2xl bg-[#EBF7F6] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#29B9AA]">Daily Budget</p>
          <p className="mt-1 text-2xl font-bold text-[#1A2B38]">{formatCurrency(dailyBudget)}</p>
          <p className="mt-1 text-sm text-[#7B6E67]">Rata-rata dari {getDaysInMonth(month) || 30} hari di bulan ini.</p>
        </div>
      </div>
    </ModalShell>
  );
}
