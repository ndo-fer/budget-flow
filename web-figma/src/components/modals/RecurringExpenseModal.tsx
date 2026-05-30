import { useEffect, useState } from "react";
import { toast } from "../../utils/toast";
import type { BudgetCategory, RecurringExpense } from "../../types/models";
import { createRecurringExpense, updateRecurringExpense } from "../../services/recurringService";
import { getToday } from "../../utils/date";
import ModalShell from "./ModalShell";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const { t, lang } = useLanguage();
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
    setAmount(recurring?.amount ? Math.round(recurring.amount).toLocaleString("id-ID") : "");
    setFrequency(recurring?.frequency || "monthly");
    setDayOfMonth(String(recurring?.day_of_month || 1));
    setStartDate(recurring?.start_date || getToday());
    setEndDate(recurring?.end_date || "");
    setNote(recurring?.note || "");
  }, [categories, open, recurring]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (!categoryId || isNaN(numAmount) || numAmount <= 0) {
      toast.error(lang === "id" ? "Lengkapi kategori dan nominal dulu." : "Please complete the category and amount.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        category_id: categoryId,
        amount: numAmount,
        frequency,
        day_of_month: frequency === "monthly" ? Number(dayOfMonth) : null,
        start_date: startDate,
        end_date: endDate || null,
        note: note.trim(),
      };

      if (recurring) {
        await updateRecurringExpense(recurring.id, payload);
        toast.success(lang === "id" ? "Recurring expense berhasil diperbarui." : "Recurring expense updated successfully.");
      } else {
        await createRecurringExpense(payload);
        toast.success(lang === "id" ? "Recurring expense berhasil ditambahkan." : "Recurring expense added successfully.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || (lang === "id" ? "Tagihan tersimpan, tapi refresh data gagal." : "Recurring saved, but refresh failed."));
      });
    } catch (err: any) {
      toast.error(err.message || (lang === "id" ? "Gagal menyimpan tagihan rutin." : "Failed to save recurring expense."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={recurring ? (lang === "id" ? "Edit Tagihan Rutin" : "Edit Recurring Expense") : (lang === "id" ? "Tambah Tagihan Rutin" : "Add Recurring Expense")}
      subtitle={lang === "id" ? "Atur pengeluaran rutin supaya bisa disinkronkan ke bulan berjalan." : "Configure recurring expenses to be synced to the current active month."}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#29B9AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Tagihan" : "Save Recurring")}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Kategori" : "Category"}</span>
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
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Nominal" : "Amount"}</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^0-9]/g, "");
              setAmount(raw ? parseInt(raw).toLocaleString("id-ID") : "");
            }}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Frekuensi" : "Frequency"}</span>
          <select
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as "daily" | "weekly" | "monthly")}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          >
            <option value="monthly">{lang === "id" ? "Bulanan" : "Monthly"}</option>
            <option value="weekly">{lang === "id" ? "Mingguan" : "Weekly"}</option>
            <option value="daily">{lang === "id" ? "Harian" : "Daily"}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Tanggal Mulai" : "Start Date"}</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        {frequency === "monthly" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Tanggal Tagih" : "Billing Date"}</span>
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
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Tanggal Selesai" : "End Date"}</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Catatan" : "Note"}</span>
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
