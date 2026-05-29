import { useEffect, useState } from "react";
import { X, Calendar, AlignLeft, ArrowUpRight, CreditCard, ChevronDown } from "lucide-react";
import { getIncomeSources, recordIncomeTransaction, updateIncomeTransaction } from "../../services/incomeService";
import { getWallets } from "../../services/walletService";
import { toast } from "../../utils/toast";
import type { IncomeSource, Wallet } from "../../types/models";
import { getToday } from "../../utils/date";
import Dropdown from "../Dropdown";

interface IncomeTransactionModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
  defaultWalletId?: string | null;
  transaction?: any;
  selectedSourceId?: string | null;
}

export default function IncomeTransactionModal({ 
  isOpen, 
  open, 
  onClose, 
  onSuccess, 
  onSaved, 
  defaultWalletId,
  transaction,
  selectedSourceId
}: IncomeTransactionModalProps) {
  const isCurrentlyOpen = !!(isOpen || open);
  const handleSuccess = onSuccess || onSaved;

  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [amount, setAmount] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCurrentlyOpen) {
      if (transaction) {
        setAmount(transaction.amount ? transaction.amount.toLocaleString("id-ID") : "");
        setNote(transaction.notes || transaction.note || "");
        setDate(transaction.date || getToday());
        setIncomeSourceId(transaction.income_source_id || "");
        setWalletId(transaction.wallet_id || "");
      } else {
        setAmount("");
        setNote("");
        setDate(getToday());
        setIncomeSourceId(selectedSourceId || "");
        setWalletId(defaultWalletId || "");
      }
      
      getIncomeSources()
        .then((srcs) => {
          setSources(srcs.filter((s) => s.is_active));
        })
        .catch(() => {});

      getWallets()
        .then((ws) => {
          setWallets(ws.filter((w) => w.is_active));
        })
        .catch(() => {});
    }
  }, [isCurrentlyOpen, transaction, selectedSourceId, defaultWalletId]);

  // Load draft on mount / open
  useEffect(() => {
    if (isCurrentlyOpen && !transaction) {
      const draftJson = localStorage.getItem("bf_income_draft");
      if (draftJson) {
        try {
          const draft = JSON.parse(draftJson);
          if (draft.amount) setAmount(draft.amount);
          if (draft.incomeSourceId) setIncomeSourceId(draft.incomeSourceId);
          if (draft.walletId) setWalletId(draft.walletId);
          if (draft.date) setDate(draft.date);
          if (draft.note) setNote(draft.note);
        } catch (e) {
          console.error("Gagal memuat draft pemasukan:", e);
        }
      }
    }
  }, [isCurrentlyOpen, transaction]);

  // Save draft on changes
  useEffect(() => {
    if (isCurrentlyOpen && !transaction) {
      if (amount || incomeSourceId || walletId || note || date !== getToday()) {
        const draft = { amount, incomeSourceId, walletId, date, note };
        localStorage.setItem("bf_income_draft", JSON.stringify(draft));
      } else {
        localStorage.removeItem("bf_income_draft");
      }
    }
  }, [amount, incomeSourceId, walletId, date, note, isCurrentlyOpen, transaction]);

  const handleClose = () => {
    localStorage.removeItem("bf_income_draft");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      return toast.error("Nominal pemasukan tidak valid.");
    }
    if (!incomeSourceId || incomeSourceId === "null" || incomeSourceId === "undefined") {
      return toast.error("Pilih sumber pemasukan.");
    }

    setIsSubmitting(true);
    try {
      if (transaction) {
        await updateIncomeTransaction(transaction.id, {
          income_source_id: incomeSourceId,
          amount: numAmount,
          date,
          note,
          wallet_id: walletId || null,
        });
        toast.success("Pemasukan berhasil diperbarui.");
      } else {
        await recordIncomeTransaction({
          income_source_id: incomeSourceId,
          amount: numAmount,
          date,
          note,
          wallet_id: walletId || null,
        });
        localStorage.removeItem("bf_income_draft");
        toast.success("Pemasukan berhasil direkam.");
      }
      window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
      if (handleSuccess) handleSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan transaksi pemasukan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCurrentlyOpen) return null;

  const sourceOptions = sources.map((s) => ({
    value: s.id,
    label: s.source_name,
  }));

  const walletOptions = [
    { value: "", label: "— Cash / Manual (Tanpa Wallet) —" },
    ...wallets.map((w) => ({
      value: w.id,
      label: `${w.name} (Rp ${w.estimated_balance?.toLocaleString("id-ID")})`,
    })),
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#7B6E67] hover:bg-[#F3EDE8] hover:text-[#1A2B38]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Transaksi Baru</p>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">{transaction ? "Edit Pemasukan" : "Tambah Pemasukan"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount input */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#7B6E67]">Rp</span>
              <input
                type="text"
                required
                placeholder="0"
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] py-3.5 pl-11 pr-4 text-lg font-bold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                }}
              />
            </div>
          </div>

          {/* Income Source */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Sumber Pemasukan</label>
            <Dropdown
              options={sourceOptions}
              value={incomeSourceId}
              onChange={setIncomeSourceId}
              placeholder="Pilih Sumber"
              icon={<ArrowUpRight className="h-4 w-4" />}
            />
          </div>

          {/* Wallet Selection (Optional) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Dompet / Wallet (Penyimpanan)</label>
            <Dropdown
              options={walletOptions}
              value={walletId}
              onChange={setWalletId}
              placeholder="— Cash / Manual (Tanpa Wallet) —"
              icon={<CreditCard className="h-4 w-4" />}
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Tanggal</label>
            <div className="relative w-full">
              <div className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#FEF9F4] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] transition-colors text-left relative cursor-pointer hover:bg-[#F3EDE8]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B6E67]">
                  <Calendar className="h-4 w-4" />
                </div>
                <span>
                  {date ? new Date(date).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "Pilih Tanggal"}
                </span>
                <ChevronDown className="h-4 w-4 text-[#7B6E67]" />
              </div>
              <input
                type="date"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {}
                }}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Catatan / Note</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4.5 h-4 w-4 text-[#7B6E67]" />
              <textarea
                placeholder="Gaji pokok bulan Mei..."
                className="w-full min-h-[80px] rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#29B9AA] py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : transaction ? "Simpan Perubahan" : "Simpan Pemasukan"}
          </button>
        </form>
      </div>
    </div>
  );
}
