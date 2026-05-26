import { useEffect, useMemo, useState } from "react";
import {
  User,
  Lock,
  Trash2,
  Download,
  Calendar,
  Layers,
  Pencil,
  PlusCircle,
  Sparkles,
  Shield,
  X,
  LogOut,
  Info,
  BookOpen,
  RefreshCw
} from "lucide-react";
import { T, font } from "./tokens";
import { useAuth } from "../../contexts/AuthContext";
import { getCategories } from "../../services/categoryService";
import supabase from "../../lib/supabase";
import { getCurrentUserId } from "../../services/queryUtils";
import { getRecurringExpenses } from "../../services/recurringService";
import { exportAllRecurringToICS } from "../../services/calendarService";
import { toast } from "../../utils/toast";
import CategoryModal from "../../components/modals/CategoryModal";

const card = (extra?: object) => ({
  background: T.surface,
  borderRadius: T.r.card,
  border: `1px solid ${T.border}`,
  boxShadow: T.inset,
  ...extra,
});

const APP_VERSION = "2.0.0";

const escapeCsvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

interface SettingsScreenPreviewProps {
  onRefresh: () => void;
}

export default function SettingsScreenPreview({ onRefresh }: SettingsScreenPreviewProps) {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Logout/Delete modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kategori.");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const categorySummary = useMemo(() => {
    const totalBudget = categories.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
    return { count: categories.length, totalBudget };
  }, [categories]);

  const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

  // Handlers
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("daily_expenses")
        .select(`*, budget_categories (name, color)`)
        .eq("user_id", userId)
        .order("date", { ascending: false });
      if (error) throw error;

      let csv = "\uFEFFTransaction ID,Date,Month,Category,Amount IDR,Note\n";
      (data || []).forEach((expense) => {
        csv += [
          escapeCsvCell(expense.id),
          escapeCsvCell(expense.date),
          escapeCsvCell(expense.date.slice(0, 7)),
          escapeCsvCell(expense.budget_categories?.name || "Unknown"),
          escapeCsvCell(expense.amount),
          escapeCsvCell(expense.note || ""),
        ].join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget_flow_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV export berhasil diunduh.");
    } catch (err: any) {
      toast.error(err.message || "Gagal export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCalendar = async () => {
    setIsExportingCalendar(true);
    try {
      const recurring = await getRecurringExpenses();
      if (recurring.length === 0) {
        toast.error("Belum ada recurring expense untuk diekspor.");
        return;
      }
      const count = exportAllRecurringToICS(recurring);
      toast.success(`${count} recurring expense berhasil diekspor ke kalender (.ics)`);
    } catch (err: any) {
      toast.error(err.message || "Gagal ekspor kalender.");
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error("Password baru wajib diisi.");
    if (newPassword.length < 6) return toast.error("Password minimal 6 karakter.");
    if (newPassword !== confirmNewPassword) return toast.error("Konfirmasi password tidak cocok.");

    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password berhasil diganti.");
      setShowPasswordModal(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengganti password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Berhasil logout.");
    } catch (err: any) {
      toast.error(err.message || "Gagal logout.");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;
      toast.success("Akun dan data Anda berhasil dihapus.");
      await signOut();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus akun.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const inputStyle = {
    width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "10px 14px", color: T.textPrimary, outline: "none",
    ...font(12, 600, T.textPrimary)
  };

  return (
    <div style={{ padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ ...card(), padding: "24px" }}>
        <p style={font(10, 800, T.teal, { letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 })}>Settings</p>
        <h1 style={font(22, 700, T.textPrimary, { marginBottom: 6 })}>Konfigurasi Sistem V2</h1>
        <p style={{ display: "flex", alignItems: "center", gap: 6, ...font(12, 500, T.textSecondary) }}>
          <Sparkles size={12} color={T.sunbeam} />
          <span>{categorySummary.count} kategori aktif · Total budget {rp(categorySummary.totalBudget)}</span>
        </p>
      </div>

      {/* Account Section */}
      <div style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={font(9, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Akun</p>

        <div style={{ background: T.surface2, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.iris}20`, border: `1px solid ${T.iris}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={16} color={T.iris} />
          </div>
          <div>
            <p style={font(13, 700, T.textPrimary)}>{user?.email || "Unknown"}</p>
            <p style={font(10, 500, T.textSecondary)}>Budget Flow account</p>
          </div>
        </div>

        <button
          onClick={() => { setNewPassword(""); setConfirmNewPassword(""); setShowPasswordModal(true); }}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any }}
        >
          <Lock size={16} color={T.textSecondary} />
          <div style={{ flex: 1 }}>
            <p style={font(12, 700, T.textPrimary)}>Ganti Password</p>
            <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>Ubah password untuk keamanan tambahan</p>
          </div>
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.crimson}30`, background: `${T.crimson}10`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any }}
        >
          <LogOut size={16} color={T.crimson} />
          <div style={{ flex: 1 }}>
            <p style={font(12, 700, T.crimson)}>Logout</p>
            <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>Keluar dari akun ini</p>
          </div>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.crimson}20`, background: `${T.crimson}08`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any }}
        >
          <Trash2 size={16} color={T.crimson} />
          <div style={{ flex: 1 }}>
            <p style={font(12, 700, T.crimson)}>Hapus Akun</p>
            <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>Hapus permanen seluruh data dan akun</p>
          </div>
        </button>
      </div>

      {/* Categories Section */}
      <div style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={13} color={T.textSecondary} />
              <p style={font(9, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Kategori Budget</p>
            </div>
            <p style={font(14, 700, T.textPrimary, { marginTop: 4 })}>Kelola Kategori</p>
          </div>
          <button
            onClick={() => { setSelectedCategory(null); setShowCategoryModal(true); }}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: T.iris, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <PlusCircle size={12} color="#fff" />
            <span style={font(11, 700, "#fff")}>Tambah</span>
          </button>
        </div>

        {categories.length === 0 ? (
          <div style={{ background: T.surface2, borderRadius: 12, padding: 24, textAlign: "center" as any }}>
            <p style={font(12, 500, T.textMuted)}>Belum ada kategori aktif.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setShowCategoryModal(true); }}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                  background: T.surface2, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={font(12, 700, T.textPrimary)}>{cat.name}</p>
                  <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>{rp(cat.budget_amount)} · Priority {cat.priority || 3}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>
                  <Pencil size={10} color={T.teal} />
                  <span style={font(10, 700, T.teal)}>Edit</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Data Section */}
      <div style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={font(9, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase" })}>Data & Ekspor</p>

        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
            cursor: isExporting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any,
            opacity: isExporting ? 0.6 : 1
          }}
        >
          <Download size={16} color={T.teal} />
          <div style={{ flex: 1 }}>
            <p style={font(12, 700, T.textPrimary)}>Export Expenses (CSV)</p>
            <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>Unduh salinan transaksi dalam format CSV</p>
          </div>
          <span style={font(10, 700, T.teal)}>{isExporting ? "..." : "Export"}</span>
        </button>

        <button
          onClick={handleExportCalendar}
          disabled={isExportingCalendar}
          style={{
            width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface2,
            cursor: isExportingCalendar ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" as any,
            opacity: isExportingCalendar ? 0.6 : 1
          }}
        >
          <Calendar size={16} color={T.sunbeam} />
          <div style={{ flex: 1 }}>
            <p style={font(12, 700, T.textPrimary)}>Export Recurring ke Kalender</p>
            <p style={font(10, 500, T.textSecondary, { marginTop: 2 })}>Download .ics untuk Google Calendar / Apple Calendar</p>
          </div>
          <span style={font(10, 700, T.sunbeam)}>{isExportingCalendar ? "..." : ".ics"}</span>
        </button>
      </div>

      {/* About */}
      <div style={{ ...card(), padding: 20 }}>
        <p style={font(9, 800, T.textLabel, { letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 })}>Tentang</p>
        <div style={{ background: T.surface2, borderRadius: 12, padding: 14 }}>
          <p style={font(12, 700, T.textPrimary)}>Budget Flow — Dark Hybrid V2</p>
          <p style={font(10, 500, T.textSecondary, { marginTop: 4 })}>Versi {APP_VERSION}</p>
        </div>
      </div>

      {/* ── Modals ── */}
      <CategoryModal
        open={showCategoryModal}
        category={selectedCategory}
        onClose={() => { setShowCategoryModal(false); setSelectedCategory(null); }}
        onSaved={() => { loadCategories(); onRefresh(); }}
      />

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 440, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r.card, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <p style={font(9, 800, T.teal, { letterSpacing: "0.2em", textTransform: "uppercase" })}>Keamanan</p>
                <p style={font(16, 700, T.textPrimary, { marginTop: 2 })}>Ganti Password</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.textSecondary }}><X size={16} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Password Baru</label>
                <input type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, ...font(9, 700, T.textLabel, { textTransform: "uppercase" }) }}>Konfirmasi</label>
                <input type="password" placeholder="Ulangi password baru" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", ...font(12, 700, T.textSecondary) }}>Batal</button>
              <button onClick={handleChangePassword} disabled={isChangingPassword} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: T.iris, cursor: "pointer", opacity: isChangingPassword ? 0.6 : 1, ...font(12, 700, "#fff") }}>{isChangingPassword ? "..." : "Ganti Password"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {showLogoutModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 400, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r.card, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <p style={font(16, 700, T.textPrimary, { marginBottom: 12 })}>Keluar dari Akun?</p>
            <p style={font(12, 500, T.textSecondary, { lineHeight: 1.5, marginBottom: 20 })}>Anda harus masuk kembali untuk mengakses data pencatatan transaksi Anda.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", ...font(12, 700, T.textSecondary) }}>Batal</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: T.crimson, cursor: "pointer", ...font(12, 700, "#fff") }}>Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 400, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r.card, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <p style={font(16, 700, T.crimson, { marginBottom: 12 })}>Hapus Akun Permanen?</p>
            <p style={font(12, 500, T.textSecondary, { lineHeight: 1.5, marginBottom: 20 })}>Seluruh kategori, wallet, transaksi, dan data lainnya akan dihapus secara permanen dari database dan tidak dapat dipulihkan.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeletingAccount} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", ...font(12, 700, T.textSecondary) }}>Batal</button>
              <button onClick={handleDeleteAccount} disabled={isDeletingAccount} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: T.crimson, cursor: "pointer", opacity: isDeletingAccount ? 0.6 : 1, ...font(12, 700, "#fff") }}>{isDeletingAccount ? "Menghapus..." : "Hapus Permanen"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
