import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { getCategories } from "../../services/categoryService";
import supabase from "../../lib/supabase";
import { getCurrentUserId } from "../../services/queryUtils";
import { formatCurrency } from "../../utils/format";
import CategoryModal from "../../components/modals/CategoryModal";

const APP_VERSION = "1.0.0";

const escapeCsvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function SettingsScreen({
  onOpenTutorial,
}: {
  onOpenTutorial: () => void;
}) {
  const { user, signOut } = useAuth();
  const { showChecklist } = useOnboarding();
  const [categories, setCategories] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const categorySummary = useMemo(() => {
    const totalBudget = categories.reduce((sum, category) => sum + (category.budget_amount || 0), 0);
    const topCategory = categories.reduce((highest, current) => {
      if (!highest || (current.priority || 0) > (highest.priority || 0)) return current;
      return highest;
    }, null);
    return { count: categories.length, totalBudget, topCategory };
  }, [categories]);

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("daily_expenses")
        .select(`
          *,
          budget_categories (name, color)
        `)
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

  const handleChangePassword = async () => {
    const password = window.prompt("Masukkan password baru (minimal 6 karakter)");
    if (!password) return;
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diganti.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengganti password.");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Logout dari akun ini?")) return;
    try {
      await signOut();
      toast.success("Berhasil logout.");
    } catch (err: any) {
      toast.error(err.message || "Gagal logout.");
    }
  };

  const handleOpenTutorial = async () => {
    try {
      onOpenTutorial();
      await showChecklist();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuka tutorial.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Settings</p>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Biar app ini terasa makin pas dengan ritmemu.</h1>
          <p className="mt-3 text-sm text-[#7B6E67]">
            {categorySummary.count} kategori aktif dengan total budget {formatCurrency(categorySummary.totalBudget)}.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Account</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <p className="text-sm font-semibold text-[#1A2B38]">{user?.email || "Unknown user"}</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Budget Flow account</p>
                </div>
                <button onClick={handleChangePassword} className="flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">Change Password</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">Web implementation memakai prompt sederhana untuk sekarang.</p>
                  </div>
                  <span className="text-xs font-bold text-[#29B9AA]">Open</span>
                </button>
                <button onClick={handleLogout} className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-4 py-4 text-left">
                  <div>
                    <p className="text-sm font-semibold text-[#FF6B58]">Logout</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">Keluar dari akun ini kapan saja.</p>
                  </div>
                  <span className="text-xs font-bold text-[#FF6B58]">Now</span>
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Preferences</p>
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B38]">Notifications</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">Untuk web baru ini masih berupa toggle lokal, belum tersambung ke web push.</p>
                  </div>
                  <input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />
                </label>
                <button onClick={handleOpenTutorial} className="flex w-full items-center justify-between rounded-2xl bg-[#29B9AA] px-4 py-4 text-left text-white shadow-sm">
                  <div>
                    <p className="text-sm font-semibold">Lihat Tutorial Lagi</p>
                    <p className="mt-1 text-xs text-white/80">Buka onboarding lagi dan munculkan starter checklist.</p>
                  </div>
                  <span className="text-xs font-bold text-white">Open</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Categories</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1A2B38]">Kelola kategori</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowCategoryModal(true);
                  }}
                  className="rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada kategori aktif.</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <div>
                          <p className="text-sm font-semibold text-[#1A2B38]">{category.name}</p>
                          <p className="mt-1 text-xs text-[#7B6E67]">
                            {formatCurrency(category.budget_amount)} • Priority {category.priority || 3}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#29B9AA] shadow-sm">Edit</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Data</p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left disabled:opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1A2B38]">Export Expenses (CSV)</p>
                  <p className="mt-1 text-xs text-[#7B6E67]">Unduh salinan transaksi untuk dibagikan atau dicek lagi.</p>
                </div>
                <span className="text-xs font-bold text-[#29B9AA]">{isExporting ? "Working..." : "Export"}</span>
              </button>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">About</p>
              <div className="mt-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                <p className="text-sm font-semibold text-[#1A2B38]">App Version</p>
                <p className="mt-1 text-xs text-[#7B6E67]">{APP_VERSION}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryModal open={showCategoryModal} category={selectedCategory} onClose={() => setShowCategoryModal(false)} onSaved={loadCategories} />
    </>
  );
}
