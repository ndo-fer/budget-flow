import { useEffect, useState } from "react";
import { X, Calendar, AlignLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { getIncomeSources } from "../../services/incomeService";
import { getWallets } from "../../services/walletService";
import { recordIncomeTransaction } from "../../services/incomeService";
import { toast } from "../../utils/toast";
import type { IncomeSource, Wallet } from "../../types/models";
import { getToday } from "../../utils/date";

interface IncomeTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultWalletId?: string | null;
}

export default function IncomeTransactionModal({ isOpen, onClose, onSuccess, defaultWalletId }: IncomeTransactionModalProps) {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [amount, setAmount] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNote("");
      setDate(getToday());
      setIncomeSourceId("");
      setWalletId(defaultWalletId || "");
      
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
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      return toast.error("Nominal pemasukan tidak valid.");
    }
    if (!incomeSourceId) {
      return toast.error("Pilih sumber pemasukan.");
    }

    setIsSubmitting(true);
    try {
      await recordIncomeTransaction({
        income_source_id: incomeSourceId,
        amount: numAmount,
        date,
        note,
        wallet_id: walletId || null,
      });
      toast.success("Pemasukan berhasil direkam.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal merekam pemasukan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-[32px] border border-black/10 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#7B6E67] hover:bg-[#F3EDE8] hover:text-[#1A2B38]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Transaksi Baru</p>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">Tambah Pemasukan</h2>
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
            <div className="relative">
              <ArrowUpRight className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B6E67]" />
              <select
                required
                className="w-full appearance-none rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={incomeSourceId}
                onChange={(e) => setIncomeSourceId(e.target.value)}
              >
                <option value="" className="bg-white text-gray-800 font-medium">Pilih Sumber</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-gray-800 font-medium">{s.source_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Wallet Selection (Optional) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Dompet / Wallet (Penyimpanan)</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B6E67]" />
              <select
                className="w-full appearance-none rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                <option value="" className="bg-white text-gray-800 font-medium">— Cash / Manual (Tanpa Wallet) —</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-white text-gray-800 font-medium">{w.name} (Rp {w.estimated_balance?.toLocaleString("id-ID")})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B6E67]" />
              <input
                type="date"
                required
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
            {isSubmitting ? "Merekam..." : "Simpan Pemasukan"}
          </button>
        </form>
      </div>
    </div>
  );
}
