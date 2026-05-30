import { useEffect, useState } from "react";
import { toast } from "../../utils/toast";
import type { IncomeSource } from "../../types/models";
import { createIncomeSource, updateIncomeSource } from "../../services/incomeService";
import ModalShell from "./ModalShell";
import Dropdown from "../Dropdown";
import { Clock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const { t, lang } = useLanguage();
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
      toast.error(lang === "id" ? "Nama source belum diisi." : "Source name is required.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error(lang === "id" ? "Nominal source belum valid." : "Invalid planned amount.");
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
        toast.success(lang === "id" ? "Income source berhasil diperbarui." : "Income source updated successfully.");
      } else {
        await createIncomeSource(payload);
        toast.success(lang === "id" ? "Income source berhasil ditambahkan." : "Income source added successfully.");
      }

      onClose();
      Promise.resolve(onSaved()).catch((err: any) => {
        toast.error(err?.message || (lang === "id" ? "Source tersimpan, tapi refresh data gagal." : "Source saved, but refresh failed."));
      });
    } catch (err: any) {
      toast.error(err.message || (lang === "id" ? "Gagal menyimpan source." : "Failed to save income source."));
    } finally {
      setIsSaving(false);
    }
  };

  const frequencyOptions = [
    { value: "monthly", label: lang === "id" ? "Bulanan (Monthly)" : "Monthly" },
    { value: "weekly", label: lang === "id" ? "Mingguan (Weekly)" : "Weekly" },
    { value: "one-time", label: lang === "id" ? "Sekali Waktu (One-time)" : "One-time" },
  ];

  return (
    <ModalShell
      open={open}
      title={source ? (lang === "id" ? "Edit Sumber Pemasukan" : "Edit Income Source") : (lang === "id" ? "Tambah Sumber Pemasukan" : "Add Income Source")}
      subtitle={lang === "id" ? "Kelola sumber pemasukan utama, sampingan, atau investasi." : "Manage primary, side-hustle, or investment income sources."}
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
            {isSaving ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Sumber" : "Save Source")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Nama Sumber" : "Source Name"}</span>
          <input
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Nominal Rencana" : "Planned Amount"}</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
          />
        </label>
        <div className="block">
          <span className="mb-2 block text-sm font-semibold text-[#1A2B38]">{lang === "id" ? "Frekuensi" : "Frequency"}</span>
          <Dropdown
            options={frequencyOptions}
            value={frequency}
            onChange={setFrequency}
            placeholder={lang === "id" ? "Pilih Frekuensi" : "Select Frequency"}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      </div>
    </ModalShell>
  );
}
