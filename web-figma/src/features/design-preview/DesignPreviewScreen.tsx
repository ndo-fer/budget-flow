import { useState } from "react";
import {
  ArrowLeft, LayoutDashboard, Wallet, Clock, BarChart3, Settings,
  Plus, X, Receipt, Smartphone, FileSpreadsheet, Zap, TrendingUp,
} from "lucide-react";
import { T, font } from "./tokens";
import DashboardScreen from "./DashboardScreen";
import LedgerScreen from "./LedgerScreen";
import BudgetScreenPreview from "./BudgetScreenPreview";
import WalletsScreenPreview from "./WalletsScreenPreview";
import SettingsScreenPreview from "./SettingsScreenPreview";
import { getCurrentMonth } from "../../utils/date";
import ExpenseModal from "../../components/modals/ExpenseModal";
import IncomeTransactionModal from "../../components/modals/IncomeTransactionModal";
import { ScreenshotBalanceModal, ReceiptScanModal } from "../../components/modals/OcrModals";
import CsvImportModal from "../../components/modals/CsvImportModal";

import { usePreviewData } from "./usePreviewData";

type PreviewTab = "dashboard" | "wallets" | "ledger" | "budget" | "settings";

const TABS: { id: PreviewTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget", label: "Budget", icon: BarChart3 },
  { id: "ledger", label: "Ledger", icon: Clock },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings },
];

type ModalType = "expense" | "income" | "receipt" | "balance" | "csv" | null;

export default function DesignPreviewScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<PreviewTab>("dashboard");
  const [fab, setFab] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const previewData = usePreviewData(month);
  const refresh = previewData.refresh;

  const openModal = (type: ModalType) => {
    setFab(false);
    setActiveModal(type);
  };

  const closeModal = () => setActiveModal(null);
  const closeAndRefresh = () => { setActiveModal(null); refresh(); };

  const QUICK_ACTIONS = [
    { id: "expense", label: "Catat Expense", icon: Plus, color: T.crimson, onClick: () => openModal("expense") },
    { id: "income", label: "Catat Income", icon: TrendingUp, color: T.teal, onClick: () => openModal("income") },
    { id: "receipt", label: "Upload Struk", icon: Receipt, color: T.sunbeam, onClick: () => openModal("receipt") },
    { id: "balance", label: "Koreksi Saldo", icon: Smartphone, color: T.amethyst, onClick: () => openModal("balance") },
    { id: "csv", label: "Import CSV", icon: FileSpreadsheet, color: T.iris, onClick: () => openModal("csv") },
  ];

  // Bottom nav: first 2 tabs, center FAB, last 2 tabs — settings goes to sidebar only
  const BOTTOM_LEFT = TABS.slice(0, 2);
  const BOTTOM_RIGHT = TABS.slice(2, 4);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(0,8,20,0.85)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "13px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: T.r.btn, border: `1px solid ${T.border}`,
          background: T.surface, cursor: "pointer", color: T.textPrimary,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={font(9, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 2 })}>Budget Flow · Dark Hybrid</p>
          <p style={font(13, 700, T.textPrimary)}>Sistem V2 — Live Data</p>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: T.r.chip, background: T.teal + "20", border: `1px solid ${T.teal}40` }}>
          <span style={font(9, 800, T.teal, { letterSpacing: "0.1em", textTransform: "uppercase" as any })}>Live</span>
        </span>
      </div>

      {/* Desktop layout */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* Desktop sidebar */}
        <aside style={{
          display: "none",
          width: 240,
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          flexDirection: "column",
          position: "sticky",
          top: 61,
          height: "calc(100vh - 61px)",
          flexShrink: 0,
        }} className="lg-sidebar">
          {/* Logo area */}
          <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.iris}, #0d4bbf)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="#fff" fill="#fff" />
              </div>
              <div>
                <p style={font(9, 800, T.textLabel, { letterSpacing: "0.2em", textTransform: "uppercase" as any, marginBottom: 1 })}>Budget Flow</p>
                <p style={font(12, 700, T.textPrimary)}>Dark Hybrid V2</p>
              </div>
            </div>
          </div>
          {/* Add expense btn */}
          <div style={{ padding: "12px 12px 4px" }}>
            <button
              onClick={() => openModal("expense")}
              style={{ width: "100%", padding: "11px", borderRadius: T.r.sm, background: `linear-gradient(135deg, ${T.crimson}, #cc3322)`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${T.crimson}30` }}
            >
              <Plus size={14} color="#fff" />
              <span style={font(13, 700, "#fff")}>Tambah Expense</span>
            </button>
          </div>
          {/* Nav */}
          <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)} style={{
                  width: "100%", padding: "11px 16px", borderRadius: T.r.sm, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any,
                  background: active ? T.iris + "20" : "transparent",
                  boxShadow: active ? `inset 0 0 0 1px ${T.iris}40` : "none",
                  transition: "all 0.15s",
                }}>
                  <Icon size={16} color={active ? T.iris : T.textSecondary} />
                  <span style={font(13, 600, active ? T.iris : T.textSecondary)}>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick actions sidebar section */}
          <div style={{ padding: "12px", borderTop: `1px solid ${T.border}` }}>
            <p style={font(9, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" as any, marginBottom: 8 })}>Aksi Cepat</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_ACTIONS.map(({ id, label, icon: Icon, color, onClick }) => (
                <button
                  key={id}
                  onClick={onClick}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: T.r.sm,
                    border: `1px solid ${color}30`, background: `${color}12`,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" as any,
                  }}
                >
                  <Icon size={13} color={color} />
                  <span style={font(12, 600, color)}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", paddingBottom: 80 }}>
          {tab === "dashboard" && <DashboardScreen month={month} onRefresh={refresh} previewData={previewData} key={`dash-${month}`} />}
          {tab === "wallets" && <WalletsScreenPreview month={month} onRefresh={refresh} previewData={previewData} key={`wallets-${month}`} />}
          {tab === "budget" && <BudgetScreenPreview month={month} onMonthChange={setMonth} onRefresh={refresh} key={`budget-${month}`} />}
          {tab === "ledger" && <LedgerScreen month={month} onMonthChange={setMonth} onRefresh={refresh} previewData={previewData} key={`ledger-${month}`} />}
          {tab === "settings" && <SettingsScreenPreview onRefresh={refresh} />}
        </main>
      </div>

      {/* FAB overlay */}
      {fab && (
        <div onClick={() => setFab(false)} style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      )}

      {/* Quick action bubbles */}
      {fab && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, color, onClick }) => (
            <button key={id} onClick={onClick} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
              borderRadius: T.r.btn, background: T.surface2, border: `1px solid ${T.border}`,
              cursor: "pointer", boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
              animation: "fadeSlideUp 0.2s ease",
              minWidth: 200,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: color + "20", border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={color} />
              </div>
              <span style={font(13, 600, T.textPrimary)}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "rgba(1,13,30,0.95)", backdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.border}`,
        padding: "8px 0 12px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      }}>
        {BOTTOM_LEFT.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <Icon size={18} color={active ? T.iris : T.textMuted} />
              <span style={font(9, 700, active ? T.iris : T.textMuted, { letterSpacing: "0.05em" })}>{label}</span>
            </button>
          );
        })}

        {/* Center FAB */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <button
            onClick={() => setFab(!fab)}
            style={{
              position: "absolute", bottom: 4, width: 50, height: 50, borderRadius: "50%",
              background: fab ? T.surface2 : `linear-gradient(135deg, ${T.crimson}, #cc2211)`,
              border: `3px solid ${T.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: fab ? "none" : `0 4px 20px ${T.crimson}50`,
              transition: "all 0.2s",
            }}>
            {fab ? <X size={20} color={T.textPrimary} /> : <Zap size={20} color="#fff" fill="#fff" />}
          </button>
          <span style={{ ...font(9, 700, T.crimson, { letterSpacing: "0.05em", marginTop: 28 }) }}>Aksi</span>
        </div>

        {BOTTOM_RIGHT.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <Icon size={18} color={active ? T.iris : T.textMuted} />
              <span style={font(9, 700, active ? T.iris : T.textMuted, { letterSpacing: "0.05em" })}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Modals ── */}
      <ExpenseModal
        isOpen={activeModal === "expense"}
        onClose={closeModal}
        onSuccess={closeAndRefresh}
      />

      <IncomeTransactionModal
        isOpen={activeModal === "income"}
        onClose={closeModal}
        onSuccess={closeAndRefresh}
      />

      {activeModal === "receipt" && (
        <ReceiptScanModal
          onClose={closeModal}
          onSaved={closeAndRefresh}
        />
      )}

      {activeModal === "balance" && (
        <ScreenshotBalanceModal
          onClose={closeModal}
          onSaved={closeAndRefresh}
        />
      )}

      <CsvImportModal
        isOpen={activeModal === "csv"}
        onClose={closeModal}
        onImportSuccess={closeAndRefresh}
      />

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 1024px) {
          .lg-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
