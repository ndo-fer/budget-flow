import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BudgetCategory, ExpenseRecord } from "../../types/models";
import { addExpense, updateExpense } from "../../services/expenseService";
import { validateAmount, validateDate } from "../../utils/validation";
import ModalShell from "./ModalShell";

export default function ExpenseModal({
  open,
  categories,
  initialDate,
  expense,
  onClose,
  onSaved,
}: {
  open: boolean;
  categories: BudgetCategory[];
  initialDate: string;
  expense?: ExpenseRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCategoryId(expense?.category_id || categories[0]?.id || "");
    setAmount(expense?.amount ? String(expense.amount) : "");
    setDate(expense?.date || initialDate);
    setNote(expense?.note || "");
  }, [categories, expense, initialDate, open]);

  const handleSubmit = async () => {
    if (!categoryId) {
      toast.error("Pilih kategori dulu.");
      return;
    }
    if (!validateAmount(amount)) {
      toast.error("Nominal belum valid.");
      return;
    }
    if (!validateDate(date)) {
      toast.error("Tanggal belum valid.");
      return;
    }

    try {
      setIsSaving(true);
      if (expense) {
        await updateExpense(expense.id, {
          categoryId,
          amount: Number(amount),
          date,
          note: note.trim(),
        });
        toast.success("Expense berhasil diperbarui.");
      } else {
        await addExpense(categoryId, Number(amount), date, note.trim());
        toast.success("Expense berhasil ditambahkan.");
      }
      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Expense tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={expense ? "Edit Expense" : "Tambah Expense"}
      subtitle="Catat pengeluaran baru atau rapikan transaksi yang sudah ada."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#29B9AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : expense ? "Simpan Perubahan" : "Simpan Expense"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Tanggal</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
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
            placeholder="50000"
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Catatan</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Misalnya: makan siang kantor"
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
      </div>
    </ModalShell>
  );
}
