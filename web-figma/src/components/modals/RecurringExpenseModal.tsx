import { useEffect, useState } from "react";
import { toast } from "../../utils/toast";
import type { BudgetCategory, RecurringExpense } from "../../types/models";
import { createRecurringExpense, updateRecurringExpense } from "../../services/recurringService";
import { getToday } from "../../utils/date";
import ModalShell from "./ModalShell";

export default function RecurringExpenseModal({
  open,
  recurring,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  recurring?: RecurringExpense | null;
  categories: BudgetCategory[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCategoryId(recurring?.category_id || categories[0]?.id || "");
    setAmount(recurring?.amount ? String(recurring.amount) : "");
    setFrequency(recurring?.frequency || "monthly");
    setDayOfMonth(String(recurring?.day_of_month || 1));
    setStartDate(recurring?.start_date || getToday());
    setEndDate(recurring?.end_date || "");
    setNote(recurring?.note || "");
  }, [categories, open, recurring]);

  const handleSubmit = async () => {
    if (!categoryId || !amount || Number(amount) <= 0) {
      toast.error("Lengkapi kategori dan nominal dulu.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        category_id: categoryId,
        amount: Number(amount),
        frequency,
        day_of_month: frequency === "monthly" ? Number(dayOfMonth) : null,
        start_date: startDate,
        end_date: endDate || null,
        note: note.trim(),
      };

      if (recurring) {
        await updateRecurringExpense(recurring.id, payload);
        toast.success("Recurring expense berhasil diperbarui.");
      } else {
        await createRecurringExpense(payload);
        toast.success("Recurring expense berhasil ditambahkan.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Recurring tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan recurring expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={recurring ? "Edit Recurring Expense" : "Tambah Recurring Expense"}
      subtitle="Atur pengeluaran rutin supaya bisa disinkronkan ke bulan berjalan."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#29B9AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Simpan Recurring"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Kategori</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Nominal</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Frekuensi</span>
          <select
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as "daily" | "weekly" | "monthly")}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          >
            <option value="monthly">monthly</option>
            <option value="weekly">weekly</option>
            <option value="daily">daily</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Tanggal Mulai</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        {frequency === "monthly" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Tanggal Tagih</span>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Tanggal Selesai</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Catatan</span>
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
      </div>
    </ModalShell>
  );
}
