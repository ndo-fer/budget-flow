import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { IncomeSource, IncomeTransaction } from "../../types/models";
import { recordIncomeTransaction, updateIncomeTransaction } from "../../services/incomeService";
import ModalShell from "./ModalShell";

export default function IncomeTransactionModal({
  open,
  transaction,
  selectedSourceId,
  initialMonth,
  incomeSources,
  onClose,
  onSaved,
}: {
  open: boolean;
  transaction?: IncomeTransaction | null;
  selectedSourceId?: string | null;
  initialMonth: string;
  incomeSources: IncomeSource[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(`${initialMonth}-01`);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIncomeSourceId(transaction?.income_source_id || selectedSourceId || incomeSources[0]?.id || "");
    setAmount(transaction?.amount ? String(transaction.amount) : "");
    setDate(transaction?.date || `${initialMonth}-01`);
    setNotes(transaction?.notes || "");
  }, [incomeSources, initialMonth, open, selectedSourceId, transaction]);

  const handleSubmit = async () => {
    if (!incomeSourceId) {
      toast.error("Pilih income source dulu.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Nominal transaksi belum valid.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        income_source_id: incomeSourceId,
        amount: Number(amount),
        date,
        notes: notes.trim(),
      };

      if (transaction) {
        await updateIncomeTransaction(transaction.id, payload);
        toast.success("Income transaction berhasil diperbarui.");
      } else {
        await recordIncomeTransaction(payload);
        toast.success("Income transaction berhasil ditambahkan.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || "Transaksi income tersimpan, tapi refresh data gagal.");
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan transaksi income.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={transaction ? "Edit Income Transaction" : "Tambah Income Transaction"}
      subtitle="Catat pemasukan aktual dari source yang sudah kamu buat."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-[#5BAEE8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Income Source</span>
          <select
            value={incomeSourceId}
            onChange={(event) => setIncomeSourceId(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
          >
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.source_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Tanggal</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Nominal</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">Catatan</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
          />
        </label>
      </div>
    </ModalShell>
  );
}
