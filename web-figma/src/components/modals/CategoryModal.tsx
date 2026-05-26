import { useEffect, useState } from "react";
import { toast } from "../../utils/toast";
import type { BudgetCategory } from "../../types/models";
import { createCategory, deleteCategory, updateCategory } from "../../services/categoryService";
import ModalShell from "./ModalShell";

export default function CategoryModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: BudgetCategory | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [color, setColor] = useState("#FF6B58");
  const [priority, setPriority] = useState("3");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name || "");
    setBudgetAmount(category?.budget_amount ? String(category.budget_amount) : "");
    setColor(category?.color || "#FF6B58");
    setPriority(String(category?.priority || 3));
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !budgetAmount || Number(budgetAmount) <= 0) {
      toast.error("Nama dan budget kategori wajib valid.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        budget_amount: Number(budgetAmount),
        color,
        priority: Number(priority) || 3,
      };

      if (category) {
        await updateCategory(category.id, payload);
        toast.success("Kategori berhasil diperbarui.");
      } else {
        await createCategory(payload.name, payload.budget_amount, payload.color, payload.priority);
        toast.success("Kategori berhasil ditambahkan.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Kategori tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan kategori.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    if (!window.confirm(`Archive kategori "${category.name}"?`)) return;

    try {
      setIsSaving(true);
      await deleteCategory(category.id);
      toast.success("Kategori berhasil diarsipkan.");
      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Kategori diarsipkan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengarsipkan kategori.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={category ? "Edit Category" : "Tambah Category"}
      subtitle="Rapikan kategori, warna, dan budget supaya ringkasan lebih relevan."
      onClose={onClose}
      footer={
        <div className="flex flex-wrap gap-3">
          {category ? (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-[#FF6B58] disabled:opacity-60"
            >
              Archive
            </button>
          ) : null}
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#29B9AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Simpan Kategori"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Nama</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Budget</span>
          <input
            type="number"
            min="0"
            value={budgetAmount}
            onChange={(event) => setBudgetAmount(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Prioritas</span>
          <input
            type="number"
            min="1"
            max="5"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Warna</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-12 w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-2 py-2"
          />
        </label>
      </div>
    </ModalShell>
  );
}
