import { useEffect, useState } from "react";
import { toast } from "../../utils/toast";
import type { BudgetCategory } from "../../types/models";
import { createCategory, deleteCategory, updateCategory } from "../../services/categoryService";
import ModalShell from "./ModalShell";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const { t, lang } = useLanguage();
  const [name, setName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [color, setColor] = useState("#FF6B58");
  const [priority, setPriority] = useState("3");
  const [excludeFromDailyStreak, setExcludeFromDailyStreak] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name || "");
    setBudgetAmount(category?.budget_amount ? String(category.budget_amount) : "");
    setColor(category?.color || "#FF6B58");
    setPriority(String(category?.priority || 3));
    setExcludeFromDailyStreak(category?.exclude_from_daily_streak || false);
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !budgetAmount || Number(budgetAmount) <= 0) {
      toast.error(lang === "id" ? "Nama dan budget kategori wajib valid." : "Category name and budget amount must be valid.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        budget_amount: Number(budgetAmount),
        color,
        priority: Number(priority) || 3,
        exclude_from_daily_streak: excludeFromDailyStreak,
      };

      if (category) {
        await updateCategory(category.id, payload);
        toast.success(lang === "id" ? "Kategori berhasil diperbarui." : "Category updated successfully.");
      } else {
        await createCategory(payload.name, payload.budget_amount, payload.color, payload.priority, excludeFromDailyStreak);
        toast.success(lang === "id" ? "Kategori berhasil ditambahkan." : "Category added successfully.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || (lang === "id" ? "Kategori tersimpan, tapi refresh data gagal." : "Category saved, but refresh failed."));
      });
    } catch (err: any) {
      toast.error(err.message || (lang === "id" ? "Gagal menyimpan kategori." : "Failed to save category."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    if (!window.confirm(lang === "id" ? `Arsipkan kategori "${category.name}"?` : `Archive category "${category.name}"?`)) return;

    try {
      setIsSaving(true);
      await deleteCategory(category.id);
      toast.success(lang === "id" ? "Kategori berhasil diarsipkan." : "Category archived successfully.");
      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || (lang === "id" ? "Kategori diarsipkan, tapi refresh data gagal." : "Category archived, but refresh failed."));
      });
    } catch (err: any) {
      toast.error(err.message || (lang === "id" ? "Gagal mengarsipkan kategori." : "Failed to archive category."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={category ? (lang === "id" ? "Edit Kategori" : "Edit Category") : (lang === "id" ? "Tambah Kategori" : "Add Category")}
      subtitle={lang === "id" ? "Rapikan kategori, warna, dan budget supaya ringkasan lebih relevan." : "Adjust categories, colors, and budgets to make summaries more relevant."}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap gap-3">
          {category ? (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-[#FF6B58] disabled:opacity-60"
            >
              {lang === "id" ? "Arsipkan" : "Archive"}
            </button>
          ) : null}
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#29B9AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Kategori" : "Save Category")}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Nama" : "Name"}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Anggaran (Budget)" : "Budget"}</span>
          <input
            type="number"
            min="0"
            value={budgetAmount}
            onChange={(event) => setBudgetAmount(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Prioritas" : "Priority"}</span>
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
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Warna" : "Color"}</span>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-12 w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-2 py-2"
          />
        </label>
        <div className="flex items-start gap-3 md:col-span-2 rounded-2xl bg-[#FEF9F4] p-4 border border-black/5">
          <input
            type="checkbox"
            id="excludeFromDailyStreak"
            checked={excludeFromDailyStreak}
            onChange={(e) => setExcludeFromDailyStreak(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#29B9AA] focus:ring-[#29B9AA] cursor-pointer"
          />
          <label htmlFor="excludeFromDailyStreak" className="flex flex-col cursor-pointer select-none">
            <span className="text-sm font-semibold text-[#1A2B38]">
              {lang === "id" ? "Pengecualian Evaluasi Harian" : "Exclude from Daily Evaluation"}
            </span>
            <span className="text-xs text-[#7B6E67] mt-0.5">
              {lang === "id"
                ? "Kategori tagihan wajib/darurat diabaikan dalam streak harian agar tidak merusak pencapaian hemat (Koin) Anda."
                : "Exclude this category (like fixed bills/emergencies) from daily streak calculations so they don't break your daily savings coins."}
            </span>
          </label>
        </div>
      </div>
    </ModalShell>
  );
}
