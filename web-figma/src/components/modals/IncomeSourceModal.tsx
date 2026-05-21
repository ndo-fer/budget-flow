import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { IncomeSource } from "../../types/models";
import { createIncomeSource, updateIncomeSource } from "../../services/incomeService";
import ModalShell from "./ModalShell";

export default function IncomeSourceModal({
  open,
  source,
  onClose,
  onSaved,
}: {
  open: boolean;
  source?: IncomeSource | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [sourceName, setSourceName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSourceName(source?.source_name || "");
    setAmount(source?.amount ? String(source.amount) : "");
    setFrequency(source?.frequency || "monthly");
  }, [open, source]);

  const handleSubmit = async () => {
    if (!sourceName.trim()) {
      toast.error("Nama source belum diisi.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Nominal source belum valid.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        source_name: sourceName.trim(),
        amount: Number(amount),
        frequency,
      };

      if (source) {
        await updateIncomeSource(source.id, payload);
        toast.success("Income source berhasil diperbarui.");
      } else {
        await createIncomeSource(payload);
        toast.success("Income source berhasil ditambahkan.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Source tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan source.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={source ? "Edit Income Source" : "Tambah Income Source"}
      subtitle="Kelola sumber pemasukan utama, sampingan, atau investasi."
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
            {isSaving ? "Menyimpan..." : "Simpan Source"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Nama Source</span>
          <input
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Nominal Planned</span>
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
            onChange={(event) => setFrequency(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          >
            <option value="monthly">monthly</option>
            <option value="weekly">weekly</option>
            <option value="one-time">one-time</option>
          </select>
        </label>
      </div>
    </ModalShell>
  );
}
