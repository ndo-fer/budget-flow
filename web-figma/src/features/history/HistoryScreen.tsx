import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense, getExpensesByDateRange } from "../../services/expenseService";
import { getCategories } from "../../services/categoryService";
import { formatHumanDate, getToday } from "../../utils/date";
import { formatCurrency } from "../../utils/format";
import ExpenseModal from "../../components/modals/ExpenseModal";

export default function HistoryScreen() {
  const today = getToday();
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadData = async () => {
    try {
      const fetchStart = new Date();
      fetchStart.setMonth(fetchStart.getMonth() - 6);
      const [expenseData, categoryData] = await Promise.all([
        getExpensesByDateRange(fetchStart.toISOString().slice(0, 10), today),
        getCategories(),
      ]);
      setAllExpenses(expenseData);
      setCategories(categoryData);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat expense history.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      if (selectedDate && expense.date !== selectedDate) return false;
      if (selectedCategory && expense.category_id !== selectedCategory) return false;
      if (searchQuery.trim() && !expense.note?.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      return true;
    });
  }, [allExpenses, searchQuery, selectedCategory, selectedDate]);

  const sections = useMemo(() => {
    const grouped = new Map<string, any[]>();
    filteredExpenses.forEach((expense) => {
      grouped.set(expense.date, [...(grouped.get(expense.date) || []), expense]);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({
        date,
        title: formatHumanDate(date),
        summary: items.reduce((sum, item) => sum + item.amount, 0),
        items,
      }));
  }, [filteredExpenses]);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm("Delete expense ini?")) return;
    try {
      await deleteExpense(expenseId);
      toast.success("Expense berhasil dihapus.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus expense.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5BAEE8]">History</p>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Cari pola belanja, edit transaksi, dan rapikan catatanmu.</h1>
          <p className="mt-3 text-sm text-[#7B6E67]">Filter berdasarkan tanggal, kategori, atau note supaya history tetap gampang dipahami.</p>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
            />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari note..."
              className="rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#5BAEE8]"
            />
            <button
              onClick={() => {
                setSelectedDate(today);
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="rounded-2xl bg-[#F3EDE8] px-4 py-3 text-sm font-semibold text-[#7B6E67]"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">Total result</p>
            <p className="mt-1 text-2xl font-bold text-[#1A2B38]">{filteredExpenses.length}</p>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs text-[#7B6E67]">Total amount</p>
            <p className="mt-1 text-2xl font-bold text-[#FF6B58]">{formatCurrency(filteredExpenses.reduce((sum, item) => sum + item.amount, 0))}</p>
          </div>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Expense list</p>
          <div className="mt-4 space-y-5">
            {sections.length === 0 ? (
              <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Tidak ada expense yang cocok dengan filter ini.</div>
            ) : (
              sections.map((section) => (
                <div key={section.date}>
                  <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#F3EDE8] px-4 py-3">
                    <p className="text-sm font-semibold text-[#1A2B38]">{section.title}</p>
                    <p className="text-sm font-bold text-[#FF6B58]">{formatCurrency(section.summary)}</p>
                  </div>
                  <div className="space-y-3">
                    {section.items.map((expense) => (
                      <div key={expense.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-[#1A2B38]">{expense.budget_categories?.name || "Unknown"}</p>
                          {expense.note ? <p className="mt-1 text-xs text-[#7B6E67]">{expense.note}</p> : null}
                        </div>
                        <p className="text-sm font-bold text-[#FF6B58]">{formatCurrency(expense.amount)}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button onClick={() => handleDelete(expense.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-[#FF6B58]">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ExpenseModal
        open={showEditModal}
        categories={categories}
        initialDate={selectedExpense?.date || today}
        expense={selectedExpense}
        onClose={() => setShowEditModal(false)}
        onSaved={loadData}
      />
    </>
  );
}
