import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Upload, 
  Camera, 
  Smartphone, 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  Check,
  Plus
} from "lucide-react";
import { getWallets, createWallet } from "../../services/walletService";
import { formatCurrency } from "../../utils/format";
import { toast } from "sonner";
import type { Wallet } from "../../types/models";
import CsvImportModal from "../../components/modals/CsvImportModal";
import { ScreenshotBalanceModal, ReceiptScanModal } from "../../components/modals/OcrModals";

export default function WalletsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);

  // New Wallet form state
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"bank" | "ewallet" | "cash" | "other">("bank");
  const [newWalletProvider, setNewWalletProvider] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      const ws = await getWallets();
      setWallets(ws.filter((w) => w.is_active));
    } catch (err) {
      console.error("Error fetching wallets:", err);
      toast.error("Gagal memuat daftar wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return toast.error("Nama wallet wajib diisi.");
    const balance = parseFloat(newWalletBalance.replace(/[^0-9]/g, "")) || 0;

    setIsCreatingWallet(true);
    try {
      await createWallet({
        name: newWalletName,
        type: newWalletType,
        provider: newWalletProvider || undefined,
        confirmed_balance: balance,
        estimated_balance: balance,
        confidence: 1.0,
      });
      toast.success("Wallet baru berhasil ditambahkan.");
      setNewWalletName("");
      setNewWalletProvider("");
      setNewWalletBalance("");
      setShowAddWallet(false);
      fetchWallets();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat wallet.");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (score >= 0.7) return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-rose-50 text-rose-600 border-rose-100";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#29B9AA] border-t-transparent mx-auto"></div>
          <p className="text-sm font-semibold text-[#7B6E67]">Memuat Daftar Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      
      {/* Header with ingestion actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Keuangan</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1A2B38]">Daftar Wallet</h1>
          <p className="mt-1.5 text-xs text-[#7B6E67]">Kelola saldo terkonfirmasi vs estimasi dengan ingest otomatis.</p>
        </div>

        {/* Quick Ingest Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveWalletId(null);
              setIsScreenshotOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-2.5 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors"
          >
            <Smartphone className="h-4 w-4 text-[#29B9AA]" />
            Screenshot Saldo
          </button>
          
          <button
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-2.5 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors"
          >
            <Camera className="h-4 w-4 text-[#FF6B58]" />
            Scan Struk
          </button>

          <button
            onClick={() => setIsCsvOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-[#29B9AA] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#229A8E] transition-colors shadow-md shadow-teal-500/10"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Main Grid: Wallets List + Add Wallet */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Wallets cards grid */}
        <div className="md:col-span-2 space-y-4">
          {wallets.length === 0 ? (
            <div className="rounded-[32px] border border-black/10 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-[#7B6E67]">Kamu belum memiliki wallet terdaftar.</p>
              <button 
                onClick={() => setShowAddWallet(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-[#29B9AA] px-5 py-2.5 text-xs font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Tambah Wallet Pertama
              </button>
            </div>
          ) : (
            wallets.map((wallet) => (
              <div 
                key={wallet.id}
                className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                {/* Confidence score badge */}
                <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ contentVisibility: 'auto' }}>
                  <div className={`h-1.5 w-1.5 rounded-full ${wallet.confidence >= 0.9 ? "bg-emerald-500" : wallet.confidence >= 0.7 ? "bg-amber-500" : "bg-rose-500"}`}></div>
                  <span className="text-[#1A2B38]">Confidence: {Math.round(wallet.confidence * 100)}%</span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEF9F4] border border-black/5 text-[#29B9AA]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1A2B38]">{wallet.name}</h3>
                      <p className="text-xs text-[#7B6E67] font-medium capitalize">{wallet.provider || wallet.type}</p>
                    </div>
                  </div>

                  {/* Balance details */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Saldo Terkonfirmasi</p>
                      <p className="mt-1 text-lg font-bold text-[#7B6E67]">
                        Rp {wallet.confirmed_balance?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#29B9AA]">Saldo Estimasi</p>
                      <p className="mt-1 text-xl font-black text-[#1A2B38]">
                        Rp {wallet.estimated_balance?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                  <span className="text-[10px] text-[#7B6E67] font-semibold">
                    Last confirmed: {wallet.last_confirmed_at ? new Date(wallet.last_confirmed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long" }) : "Belum pernah"}
                  </span>
                  
                  <button
                    onClick={() => {
                      setActiveWalletId(wallet.id);
                      setIsScreenshotOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#29B9AA] hover:text-[#229A8E] transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Koreksi Saldo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar/Add Wallet side block */}
        <div className="md:col-span-1">
          {showAddWallet ? (
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Add Wallet</h3>
                <button 
                  onClick={() => setShowAddWallet(false)}
                  className="rounded-full p-1.5 hover:bg-[#FEF9F4] text-[#7B6E67]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Nama Wallet</label>
                  <input
                    type="text"
                    required
                    placeholder="BCA Sakuku, GoPay, dll."
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Tipe Wallet</label>
                  <select
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-3 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                    value={newWalletType}
                    onChange={(e: any) => setNewWalletType(e.target.value)}
                  >
                    <option value="bank">Bank Account</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Cash / Tunai</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Provider (Opsional)</label>
                  <input
                    type="text"
                    placeholder="BCA, Mandiri, GoPay, OVO"
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                    value={newWalletProvider}
                    onChange={(e) => setNewWalletProvider(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Saldo Awal (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                    value={newWalletBalance}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setNewWalletBalance(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingWallet}
                  className="w-full rounded-2xl bg-[#29B9AA] py-3 text-xs font-bold text-white disabled:opacity-50"
                >
                  {isCreatingWallet ? "Menyimpan..." : "Tambah Wallet"}
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWallet(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-black/10 bg-[#FEF9F4]/40 hover:bg-[#FEF9F4] px-6 py-12 text-center"
            >
              <Plus className="h-6 w-6 text-[#29B9AA]" />
              <span className="text-xs font-bold text-[#1A2B38]">Registrasi Wallet Baru</span>
              <span className="text-[10px] text-[#7B6E67]">Tambahkan bank atau e-wallet baru yang kamu miliki</span>
            </button>
          )}
        </div>

      </div>

      {/* Import CSV Modal */}
      <CsvImportModal
        isOpen={isCsvOpen}
        onClose={() => setIsCsvOpen(false)}
        walletId={activeWalletId}
        onImportSuccess={fetchWallets}
      />

      {/* Screenshot Balance Modal */}
      {isScreenshotOpen && (
        <ScreenshotBalanceModal
          walletId={activeWalletId || undefined}
          onClose={() => setIsScreenshotOpen(false)}
          onSaved={fetchWallets}
        />
      )}

      {/* Receipt Scan Modal */}
      {isReceiptOpen && (
        <ReceiptScanModal
          onClose={() => setIsReceiptOpen(false)}
          onSaved={fetchWallets}
        />
      )}

    </div>
  );
}
