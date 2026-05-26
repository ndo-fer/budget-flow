import { useEffect, useState } from "react";
import { X, Calendar, AlignLeft, Tag, CreditCard, ArrowDownLeft, Check } from "lucide-react";
import { getCategories } from "../../services/categoryService";
import { getWallets } from "../../services/walletService";
import { addExpense } from "../../services/expenseService";
import { toast } from "../../utils/toast";
import type { BudgetCategory, Wallet } from "../../types/models";
import { getToday } from "../../utils/date";

const suggestCategoryFromNote = (noteText: string, categoryList: BudgetCategory[]): string | null => {
  const text = noteText.toLowerCase();
  
  const rules = [
    { keywords: ["makan", "minum", "kopi", "coffee", "nasi", "bakso", "mie", "cafe", "restoran", "dinner", "lunch", "starbucks", "indomaret", "alfamart", "snack", "warung", "burger", "pizza", "sushi", "teh", "susu", "kuliner", "jajan"], categoryKeywords: ["makan", "kuliner", "food", "dining", "cafe"] },
    { keywords: ["gojek", "grab", "maxim", "bensin", "parkir", "tol", "mrt", "lrt", "bus", "tiket", "ojek", "shell", "pertamina", "transport", "krl", "ojol", "kai", "penerbangan", "travel", "mobil", "motor"], categoryKeywords: ["trans", "travel", "kendaraan", "motor", "mobil"] },
    { keywords: ["baju", "sepatu", "tokopedia", "shopee", "mall", "kaos", "celana", "belanja", "lazada", "kebutuhan", "supermarket", "minimarket", "sabun", "odol", "shampoo", "sembako"], categoryKeywords: ["belanja", "shop", "kebutuhan", "bulanan", "grocer"] },
    { keywords: ["nonton", "bioskop", "netflix", "spotify", "game", "steam", "topup game", "wisata", "liburan", "karaoke", "konser", "tiket nonton", "hobi", "playstation", "nintendo"], categoryKeywords: ["hiburan", "entertain", "rekreasi", "hobby", "hobi", "fun"] },
    { keywords: ["listrik", "air", "pdam", "wifi", "indihome", "pulsa", "kuota", "internet", "asuransi", "bpjs", "kos", "kontrakan", "bill", "tagihan", "pln"], categoryKeywords: ["tagihan", "bill", "utilit", "rutin"] },
    { keywords: ["obat", "apotek", "dokter", "sakit", "klinik", "rs", "vitamin", "sakit", "puskesmas", "lab"], categoryKeywords: ["sehat", "health", "medis", "obat"] },
    { keywords: ["buku", "kursus", "sekolah", "kuliah", "spp", "seminar", "udemy", "sertifikasi", "tutorial"], categoryKeywords: ["didik", "educat", "belajar", "buku"] }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      const matched = categoryList.find(c => 
        rule.categoryKeywords.some(ckw => c.name.toLowerCase().includes(ckw))
      );
      if (matched) return matched.id.toString();
    }
  }

  return null;
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultWalletId?: string | null;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess, defaultWalletId }: ExpenseModalProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNote("");
      setDate(getToday());
      setCategoryId("");
      setWalletId(defaultWalletId || "");
      
      getCategories()
        .then((cats) => {
          setCategories(cats.filter((c) => c.is_active));
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
      return toast.error("Nominal pengeluaran tidak valid.");
    }
    if (!categoryId) {
      return toast.error("Pilih kategori pengeluaran.");
    }

    setIsSubmitting(true);
    try {
      await addExpense(
        categoryId,
        numAmount,
        date,
        note,
        walletId || null,
      );
      toast.success("Pengeluaran berhasil ditambahkan.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan pengeluaran.");
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
          <div className="flex items-center gap-1.5 text-[#FF6B58] mb-1">
            <ArrowDownLeft className="w-4 h-4 text-[#FF6B58] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] leading-none">Transaksi Baru</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">Tambah Expense</h2>
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
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] py-3.5 pl-11 pr-4 text-lg font-bold text-[#1A2B38] outline-none focus:border-[#FF6B58]"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Kategori</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B6E67]" />
              <select
                required
                className="w-full appearance-none rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" className="bg-white text-gray-800 font-medium">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-gray-800 font-medium">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Wallet Selection (Optional) */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Dompet / Wallet (Opsional)</label>
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
                placeholder="Makan siang nasi goreng..."
                className="w-full min-h-[80px] rounded-2xl border border-black/10 bg-[#FEF9F4] py-3 pl-11 pr-4 text-sm font-semibold text-[#1A2B38] outline-none"
                value={note}
                onChange={(e) => {
                  const val = e.target.value;
                  setNote(val);
                  if (!categoryId && val) {
                    const suggestedId = suggestCategoryFromNote(val, categories);
                    if (suggestedId) {
                      setCategoryId(suggestedId);
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B58] to-[#E8503F] py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/10 hover:shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              "Menyimpan..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Simpan Pengeluaran
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
