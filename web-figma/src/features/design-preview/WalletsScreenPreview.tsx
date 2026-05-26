import { useState } from "react";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  X,
  Smartphone,
  Camera,
  Upload,
  Shield,
  Lock,
  Sparkles,
  Clock,
  RefreshCw,
  PlusCircle,
  Building2,
  Coins,
  CreditCard
} from "lucide-react";
import { T, font } from "./tokens";
import { PreviewData, getWalletStyle, rp, fmtDate } from "./usePreviewData";
import { createWallet } from "../../services/walletService";
import { toast } from "../../utils/toast";

// Modals
import CsvImportModal from "../../components/modals/CsvImportModal";
import { ScreenshotBalanceModal, ReceiptScanModal } from "../../components/modals/OcrModals";
import ExpenseModal from "../../components/modals/ExpenseModal";
import IncomeTransactionModal from "../../components/modals/IncomeTransactionModal";

const card = (extra?: object) => ({
  background: T.surface,
  borderRadius: T.r.card,
  border: `1px solid ${T.border}`,
  boxShadow: T.inset,
  ...extra,
});

const Skeleton = ({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: T.border, animation: "pulse 1.5s ease-in-out infinite" }} />
);

const walletTypeIcon = {
  bank: Building2,
  ewallet: Smartphone,
  cash: Coins,
  other: CreditCard,
} as const;

interface WalletsScreenPreviewProps {
  month: string;
  onRefresh: () => void;
  previewData: PreviewData;
}

export default function WalletsScreenPreview({ month, onRefresh, previewData }: WalletsScreenPreviewProps) {
  const { wallets, incomeTransactions, summary, totalBalance, loading } = previewData;

  // Modals state
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  // Add Wallet form state
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"bank" | "ewallet" | "cash" | "other">("bank");
  const [newWalletProvider, setNewWalletProvider] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

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
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat wallet.");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header Ingestion Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", ...card(), padding: "16px 20px" }}>
        <div>
          <p style={font(10, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Ingest Cepat V2</p>
          <p style={font(12, 500, T.textSecondary, { marginTop: 4 })}>Otomasi input menggunakan OCR & impor file</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setActiveWalletId(null);
              setIsScreenshotOpen(true);
            }}
            style={{
              padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Smartphone size={14} color={T.teal} />
            <span style={font(12, 700, T.textPrimary)}>Screenshot Saldo</span>
          </button>

          <button
            onClick={() => setIsReceiptOpen(true)}
            style={{
              padding: "10px 16px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Camera size={14} color={T.crimson} />
            <span style={font(12, 700, T.textPrimary)}>Scan Struk</span>
          </button>

          <button
            onClick={() => setIsCsvOpen(true)}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "none", background: T.iris,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Upload size={14} color="#fff" />
            <span style={font(12, 700, "#fff")}>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Total Hero */}
      <div style={{ ...card(), padding: "24px", background: "linear-gradient(135deg,#010d1e 0%,#00215e 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(28,108,255,0.12)", filter: "blur(50px)" }} />
        <p style={font(11, 700, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 8 })}>Total Aset</p>
        {loading ? <Skeleton w="50%" h={40} r={8} /> : (
          <p style={font(34, 700, T.textPrimary, { letterSpacing: "-0.5px", marginBottom: 6 })}>{rp(totalBalance)}</p>
        )}
        <p style={font(12, 500, T.textSecondary)}>{wallets.length} dompet terhubung</p>

        {/* Summary Chips */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, padding: "10px 14px", borderRadius: T.r.sm, background: `${T.teal}12`, border: `1px solid ${T.teal}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <TrendingUp size={10} color={T.teal} />
              <span style={font(9, 800, T.teal, { letterSpacing: "0.1em", textTransform: "uppercase" as any })}>Masuk</span>
            </div>
            <p style={font(14, 700, T.textPrimary)}>{loading ? "—" : rp(summary.totalIncome)}</p>
          </div>
          <div style={{ flex: 1, padding: "10px 14px", borderRadius: T.r.sm, background: `${T.crimson}12`, border: `1px solid ${T.crimson}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <TrendingDown size={10} color={T.crimson} />
              <span style={font(9, 800, T.crimson, { letterSpacing: "0.1em", textTransform: "uppercase" as any })}>Keluar</span>
            </div>
            <p style={font(14, 700, T.textPrimary)}>{loading ? "—" : rp(summary.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Wallets List + Sidebar Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }} className="md:grid-cols-3">
        {/* Wallet list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, gridColumn: "span 2" }}>
          <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any })}>Dompet Saya</p>
          {loading
            ? [1, 2].map(i => <div key={i} style={{ ...card(), padding: "18px 20px" }}><Skeleton w="50%" h={14} /></div>)
            : wallets.length === 0
              ? (
                <div style={{ ...card(), padding: 32, textAlign: "center" as any }}>
                  <p style={font(13, 500, T.textMuted)}>Belum ada dompet ditambahkan</p>
                  <button
                    onClick={() => setShowAddWallet(true)}
                    style={{ border: "none", background: T.iris, color: "#fff", padding: "8px 16px", borderRadius: 12, marginTop: 12, cursor: "pointer", ...font(12, 700, "#fff") }}
                  >
                    Tambah Dompet
                  </button>
                </div>
              )
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {wallets.map((w, i) => {
                    const { g, glow } = getWalletStyle(i);
                    const TypeIcon = walletTypeIcon[w.type as keyof typeof walletTypeIcon] || CreditCard;
                    return (
                      <div key={w.id} style={{ ...card(), padding: "0", overflow: "hidden", position: "relative" }}>
                        {/* Confidence score badge */}
                        <div style={{
                          position: "absolute", right: 16, top: 16, display: "flex", alignItems: "center", gap: 4,
                          borderRadius: 8, border: `1px solid ${T.border}`, padding: "3px 8px", background: "rgba(0,8,20,0.6)"
                        }}>
                          <Shield size={10} color={T.teal} />
                          <span style={font(9, 700, T.textPrimary)}>Confidence: {Math.round(w.confidence * 100)}%</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "stretch" }}>
                          <div style={{ width: 6, alignSelf: "stretch", background: g, flexShrink: 0 }} />
                          <div style={{ flex: 1, padding: "18px 18px 18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* Top info */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: T.r.icon, background: g, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${glow}`, flexShrink: 0 }}>
                                <WalletIcon size={18} color="#fff" />
                              </div>
                              <div>
                                <p style={font(14, 700, T.textPrimary)}>{w.name}</p>
                                <p style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, ...font(11, 500, T.textSecondary) }}>
                                  <TypeIcon size={11} color={T.textSecondary} />
                                  <span>{w.provider || w.type}</span>
                                </p>
                              </div>
                            </div>

                            {/* Balance details */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: T.surface2, borderRadius: 12, padding: 12, border: `1px solid ${T.border}30` }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                  <Lock size={10} color={T.textMuted} />
                                  <span style={font(8, 700, T.textLabel, { textTransform: "uppercase" })}>Terkonfirmasi</span>
                                </div>
                                <p style={font(13, 700, T.textSecondary)}>{rp(w.confirmed_balance)}</p>
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                  <Sparkles size={10} color={T.teal} />
                                  <span style={font(8, 700, T.teal, { textTransform: "uppercase" })}>Estimasi</span>
                                </div>
                                <p style={font(14, 800, T.textPrimary)}>{rp(w.estimated_balance)}</p>
                              </div>
                            </div>

                            {/* Action links */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}30`, paddingTop: 10 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, ...font(9, 600, T.textMuted) }}>
                                <Clock size={10} />
                                <span>Update: {w.last_confirmed_at ? new Date(w.last_confirmed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Belum"}</span>
                              </span>

                              <button
                                onClick={() => {
                                  setActiveWalletId(w.id);
                                  setIsScreenshotOpen(true);
                                }}
                                style={{
                                  border: `1px solid ${T.teal}40`, background: `${T.teal}12`, borderRadius: 8,
                                  padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                }}
                              >
                                <RefreshCw size={9} color={T.teal} />
                                <span style={font(9, 800, T.teal)}>Koreksi</span>
                              </button>
                            </div>

                            {/* Transaction Quick entries */}
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => {
                                  setActiveWalletId(w.id);
                                  setIsExpenseOpen(true);
                                }}
                                style={{
                                  flex: 1, padding: "6px 0", border: `1px solid ${T.crimson}30`, background: `${T.crimson}12`,
                                  borderRadius: 8, cursor: "pointer", ...font(10, 700, T.crimson)
                                }}
                              >
                                + Expense
                              </button>
                              <button
                                onClick={() => {
                                  setActiveWalletId(w.id);
                                  setIsIncomeOpen(true);
                                }}
                                style={{
                                  flex: 1, padding: "6px 0", border: `1px solid ${T.teal}30`, background: `${T.teal}12`,
                                  borderRadius: 8, cursor: "pointer", ...font(10, 700, T.teal)
                                }}
                              >
                                + Income
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
        </div>

        {/* Sidebar Add Wallet Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any })}>Kelola</p>
          {showAddWallet ? (
            <div style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={font(12, 800, T.textPrimary, { letterSpacing: "0.05em", textTransform: "uppercase" })}>Registrasi Dompet</p>
                <button onClick={() => setShowAddWallet(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textSecondary }}>
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Nama Wallet</label>
                  <input
                    type="text"
                    required
                    placeholder="BCA, Mandiri, Cash, Gopay..."
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    style={{
                      width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "8px 12px", color: T.textPrimary, outline: "none", ...font(12, 600, T.textPrimary)
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Tipe Wallet</label>
                  <select
                    value={newWalletType}
                    onChange={(e: any) => setNewWalletType(e.target.value)}
                    style={{
                      width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "8px 12px", color: T.textPrimary, outline: "none", ...font(12, 600, T.textPrimary)
                    }}
                  >
                    <option value="bank">Bank Account</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Cash / Tunai</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Provider (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: BCA, OVO, ShopeePay"
                    value={newWalletProvider}
                    onChange={(e) => setNewWalletProvider(e.target.value)}
                    style={{
                      width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "8px 12px", color: T.textPrimary, outline: "none", ...font(12, 600, T.textPrimary)
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Saldo Awal (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={newWalletBalance}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setNewWalletBalance(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                    }}
                    style={{
                      width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "8px 12px", color: T.textPrimary, outline: "none", ...font(12, 600, T.textPrimary)
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingWallet}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none", background: T.iris,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isCreatingWallet ? 0.6 : 1
                  }}
                >
                  <PlusCircle size={14} color="#fff" />
                  <span style={font(12, 700, "#fff")}>{isCreatingWallet ? "Menyimpan..." : "Tambah Wallet"}</span>
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWallet(true)}
              style={{
                width: "100%", background: "transparent", border: `2px dashed ${T.border}`,
                borderRadius: T.r.card, padding: "32px 16px", cursor: "pointer", display: "flex",
                flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center"
              }}
            >
              <Plus size={20} color={T.teal} />
              <span style={font(12, 700, T.textPrimary)}>Registrasi Wallet Baru</span>
              <span style={font(10, 500, T.textMuted)}>Tambahkan akun bank atau e-wallet baru yang kamu miliki</span>
            </button>
          )}
        </div>
      </div>

      {/* Income transactions */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={font(11, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any })}>Pemasukan Bulan Ini</p>
          <span style={font(14, 700, T.teal)}>{loading ? "—" : `+${rp(summary.totalIncome)}`}</span>
        </div>
        {loading
          ? <div style={{ ...card(), padding: "14px 20px" }}><Skeleton w="60%" h={14} /></div>
          : incomeTransactions.length === 0
            ? <div style={{ ...card(), padding: 24, textAlign: "center" as any }}><p style={font(13, 500, T.textMuted)}>Belum ada pemasukan bulan ini</p></div>
            : (
              <div style={{ ...card(), overflow: "hidden" }}>
                {incomeTransactions.map((tx, i) => (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < incomeTransactions.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: T.r.icon, background: `${T.teal}18`, border: `1px solid ${T.teal}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TrendingUp size={16} color={T.teal} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={font(13, 600, T.textPrimary, { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any, marginBottom: 2 })}>
                        {tx.income_sources?.source_name || tx.note || "Pemasukan"}
                      </p>
                      <p style={font(11, 500, T.textSecondary)}>{fmtDate(tx.occurred_at)}</p>
                    </div>
                    <p style={font(14, 700, T.teal)}>+{rp(tx.amount)}</p>
                  </div>
                ))}
              </div>
            )}
      </div>

      {/* Modals wiring */}
      <CsvImportModal
        isOpen={isCsvOpen}
        onClose={() => setIsCsvOpen(false)}
        walletId={activeWalletId}
        onImportSuccess={onRefresh}
      />

      {isScreenshotOpen && (
        <ScreenshotBalanceModal
          walletId={activeWalletId || undefined}
          onClose={() => setIsScreenshotOpen(false)}
          onSaved={onRefresh}
        />
      )}

      {isReceiptOpen && (
        <ReceiptScanModal
          onClose={() => setIsReceiptOpen(false)}
          onSaved={onRefresh}
        />
      )}

      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={onRefresh}
        defaultWalletId={activeWalletId}
      />

      <IncomeTransactionModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        onSuccess={onRefresh}
        defaultWalletId={activeWalletId}
      />

    </div>
  );
}
