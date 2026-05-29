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
  Plus,
  X,
  Building2,
  Coins,
  Lock,
  Sparkles,
  Clock,
  Shield,
  PlusCircle
} from "lucide-react";
import { getWallets, createWallet, getWalletStatus } from "../../services/walletService";
import { formatCurrency } from "../../utils/format";
import { toast } from "../../utils/toast";
import type { Wallet } from "../../types/models";
import CsvImportModal from "../../components/modals/CsvImportModal";
import { ScreenshotBalanceModal, ReceiptScanModal } from "../../components/modals/OcrModals";
import ExpenseModal from "../../components/modals/ExpenseModal";
import IncomeTransactionModal from "../../components/modals/IncomeTransactionModal";
import BalanceGapModal from "../../components/modals/BalanceGapModal";
import FirstRunGuide from "../../components/FirstRunGuide";
import EmptyState from "../../components/EmptyState";


const walletTypeIcon = {
  bank: Building2,
  ewallet: Smartphone,
  cash: Coins,
  other: CreditCard,
} as const;

interface WalletsScreenProps {
  activeTab?: string;
  searchParams?: string;
  clearSearchParams?: () => void;
}

export default function WalletsScreen({ activeTab, searchParams, clearSearchParams }: WalletsScreenProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("bf_expense_draft");
    }
    return false;
  });
  const [isIncomeOpen, setIsIncomeOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("bf_income_draft");
    }
    return false;
  });
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [gapAnalysisWallet, setGapAnalysisWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    const query = searchParams || "";
    const params = new URLSearchParams(query);
    const action = params.get("action");

    if (activeTab === "csv-import" || action === "import-csv") {
      setIsCsvOpen(true);
      clearSearchParams?.();
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else if (action === "upload-receipt" || action === "upload-struk") {
      setIsReceiptOpen(true);
      clearSearchParams?.();
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else if (action === "screenshot-balance" || action === "update-saldo") {
      setIsScreenshotOpen(true);
      clearSearchParams?.();
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeTab, searchParams, clearSearchParams]);

  // New Wallet form state
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"bank" | "ewallet" | "cash" | "other">("bank");
  const [newWalletProvider, setNewWalletProvider] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const fetchWallets = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const ws = await getWallets();
      setWallets(ws.filter((w) => w.is_active));
    } catch (err) {
      console.error("Error fetching wallets:", err);
      toast.error("Gagal memuat daftar dompet.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();

    const handleTransactionAdded = () => {
      fetchWallets(true);
    };
    window.addEventListener("wallet-transaction-added", handleTransactionAdded);
    return () => {
      window.removeEventListener("wallet-transaction-added", handleTransactionAdded);
    };
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return toast.error("Nama dompet wajib diisi.");
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
      toast.success("Dompet baru berhasil ditambahkan.");
      setNewWalletName("");
      setNewWalletProvider("");
      setNewWalletBalance("");
      setShowAddWallet(false);
      fetchWallets();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat dompet.");
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
          <p className="text-sm font-semibold text-[#7B6E67]">Memuat Daftar Dompet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
      
      <FirstRunGuide
        guideKey="wallet"
        title="Kelola Dompet Keuangan Anda"
        description="Di menu Dompet ini, Anda bisa melacak uang tunai, rekening bank, maupun e-wallet. Aplikasi membagi saldo Anda menjadi Saldo Terkonfirmasi (angka terakhir yang pasti) dan Saldo Estimasi (akumulasi pengeluaran setelah konfirmasi terakhir)."
      />

      {/* Header with ingestion actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA] leading-none">Keuangan</p>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-[#1A2B38]">Daftar Dompet</h1>
          <p className="mt-1.5 text-xs text-[#7B6E67]">Kelola saldo terkonfirmasi vs estimasi dengan ingest otomatis.</p>
        </div>

        {/* Quick Actions */}
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
            onClick={() => setShowAddWallet(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-[#29B9AA] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#229A8E] transition-colors shadow-md shadow-teal-500/10"
          >
            <Plus className="h-4 w-4" />
            Tambah Dompet
          </button>
        </div>
      </div>

      {/* Main Grid: Wallets List + Add Wallet */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Wallets cards grid */}
        <div className="md:col-span-2 space-y-4">
          {wallets.length === 0 ? (
            <EmptyState
              title="Belum Ada Dompet Terdaftar"
              description="Tambahkan dompet, e-wallet, atau cash/tunai untuk mulai mengelola keuangan secara estimasi."
              icon={CreditCard}
              actionText="Tambah Dompet Pertama"
              onAction={() => setShowAddWallet(true)}
              actionIcon={Plus}
            />
          ) : (
            wallets.map((wallet) => {
              const status = { isRed: false, isYellow: false, dynamicConfidence: wallet.confidence, estimatedGap: 0, daysSinceConfirmation: 0 };
              const borderClass = status.isRed 
                ? "border-red-300 bg-red-50/10" 
                : status.isYellow 
                  ? "border-amber-300 bg-amber-50/10" 
                  : "border-black/10";
              const accentBar = status.isRed
                ? <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                : status.isYellow
                  ? <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                  : null;

              return (
                <div 
                  key={wallet.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between ${borderClass}`}
                >
                  {accentBar}

                  {/* Confidence score badge */}
                  <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/80">
                    <Shield className={`w-3 h-3 flex-shrink-0 ${status.isRed ? "text-red-500" : status.isYellow ? "text-amber-500" : "text-[#29B9AA]"}`} />
                    <span className="text-[#1A2B38]">Confidence: {Math.round(status.dynamicConfidence * 100)}%</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEF9F4] border border-black/5 text-[#29B9AA]">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1A2B38]">{wallet.name}</h3>
                        <p className="text-xs text-[#7B6E67] font-medium capitalize flex items-center gap-1">
                          {(() => {
                            const IconComp = walletTypeIcon[wallet.type as keyof typeof walletTypeIcon] || CreditCard;
                            return <IconComp className="h-3 w-3 text-[#7B6E67]" />;
                          })()}
                          {wallet.provider || wallet.type}
                        </p>
                      </div>
                    </div>

                    {/* Balance details */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-[#7B6E67]">
                          <Lock className="w-3.5 h-3.5 text-[#7B6E67] flex-shrink-0" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">Saldo Terkonfirmasi</p>
                        </div>
                        <p className="mt-1 text-lg font-bold text-[#7B6E67]">
                          Rp {wallet.confirmed_balance?.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[#29B9AA]">
                          <Sparkles className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">Saldo Estimasi</p>
                        </div>
                        <p className="mt-1 text-xl font-black text-[#1A2B38]">
                          Rp {wallet.estimated_balance?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-black/5 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7B6E67] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#7B6E67]" />
                        Last confirmed: {wallet.last_confirmed_at ? new Date(wallet.last_confirmed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long" }) : "Belum pernah"}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setGapAnalysisWallet(wallet)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-all active:scale-[0.96] ${
                            status.isRed
                              ? "bg-red-50 border-red-200 hover:bg-red-100 text-red-700 animate-pulse"
                              : status.isYellow
                                ? "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700 font-semibold"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <AlertCircle className={`h-2.5 w-2.5 ${status.isRed ? "text-red-600" : status.isYellow ? "text-amber-600" : "text-gray-500"}`} />
                          Analisis Gap
                        </button>
                        <button
                          onClick={() => {
                            setActiveWalletId(wallet.id);
                            setIsScreenshotOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-[#FEF9F4] border border-[#29B9AA]/20 hover:border-[#29B9AA]/50 hover:bg-[#EBF7F6] px-2.5 py-1 text-[10px] font-bold text-[#29B9AA] transition-all active:scale-[0.96]"
                        >
                          <RefreshCw className="h-2.5 w-2.5 text-[#29B9AA]" />
                          Koreksi Saldo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar/Add Wallet side block */}
        <div className="md:col-span-1">
          {showAddWallet ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Tambah Dompet</h3>
                <button 
                  onClick={() => setShowAddWallet(false)}
                  className="rounded-full p-1.5 hover:bg-[#FEF9F4] text-[#7B6E67]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Nama Dompet</label>
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
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Tipe Dompet</label>
                  <select
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-3 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none"
                    value={newWalletType}
                    onChange={(e: any) => setNewWalletType(e.target.value)}
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">Dompet Digital (E-Wallet)</option>
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
                  className="w-full rounded-2xl bg-[#29B9AA] py-3 text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isCreatingWallet ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Tambah Dompet
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWallet(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 bg-[#FEF9F4]/40 hover:bg-[#FEF9F4] px-6 py-12 text-center"
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

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={fetchWallets}
        defaultWalletId={activeWalletId}
      />

      {/* Income Transaction Modal */}
      <IncomeTransactionModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        onSuccess={fetchWallets}
        defaultWalletId={activeWalletId}
      />

      {/* Balance Gap Analysis Modal */}
      {gapAnalysisWallet && (
        <BalanceGapModal
          wallet={gapAnalysisWallet}
          onClose={() => setGapAnalysisWallet(null)}
          onSaved={fetchWallets}
        />
      )}

    </div>
  );
}
