import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Download, Pencil, RefreshCcw } from "lucide-react";
import { toast } from "../../utils/toast";
import { getCategories } from "../../services/categoryService";
import { deleteRecurringExpense, getRecurringExpenses, syncRecurringExpensesForMonth } from "../../services/recurringService";
import { formatCurrency } from "../../utils/format";
import { getCurrentMonth } from "../../utils/date";
import RecurringExpenseModal from "../../components/modals/RecurringExpenseModal";
import { exportAllRecurringToICS, getGoogleCalendarUrl, recurringToCalendarEvent } from "../../services/calendarService";

export default function RecurringScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    try {
      const [categoryData, recurringData] = await Promise.all([getCategories(), getRecurringExpenses()]);
      setCategories(categoryData);
      setRecurringExpenses(recurringData);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat recurring expense.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalMonthlyRecurring = useMemo(
    () => recurringExpenses.filter((item) => item.frequency === "monthly").reduce((sum, item) => sum + item.amount, 0),
    [recurringExpenses],
  );

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const count = await syncRecurringExpensesForMonth(getCurrentMonth());
      toast.success(`Generated ${count} recurring expense(s) untuk bulan ini.`);
    } catch (err: any) {
      toast.error(err.message || "Gagal sync recurring expense.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm("Archive recurring expense ini?")) return;
    try {
      await deleteRecurringExpense(id);
      toast.success("Recurring expense berhasil diarsipkan.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengarsipkan recurring expense.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Recurring</p>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Jaga pengeluaran rutin tetap rapi dan tidak gampang kelupaan.</h1>
          <p className="mt-3 text-sm text-[#7B6E67]">Sinkronkan expense berulang untuk bulan ini dan edit item aktif kapan saja.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setSelectedRecurring(null);
              setShowModal(true);
            }}
            className="rounded-2xl bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white"
          >
            + Add recurring
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:bg-[#A7DDD6]"
          >
            <RefreshCcw className="h-4 w-4" />
            {isSyncing ? "Syncing..." : "Sync month"}
          </button>
          <button
            onClick={() => {
              if (recurringExpenses.length === 0) {
                toast.error("Belum ada recurring expense.");
                return;
              }
              const count = exportAllRecurringToICS(recurringExpenses);
              toast.success(`${count} event diekspor ke file .ics`);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#29B9AA] bg-white px-5 py-3 text-sm font-semibold text-[#29B9AA] shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export ke Kalender (.ics)
          </button>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs text-[#7B6E67]">Monthly recurring total</p>
          <p className="mt-1 text-2xl font-bold text-[#1A2B38]">{formatCurrency(totalMonthlyRecurring)}</p>
          <p className="mt-2 text-sm text-[#7B6E67]">Perkiraan total dari item dengan frekuensi bulanan.</p>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Recurring list</p>
          <div className="mt-4 space-y-3">
            {recurringExpenses.length === 0 ? (
              <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada recurring expense.</div>
            ) : (
              recurringExpenses.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#1A2B38]">{item.budget_categories?.name || "Unknown"}</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">
                      {item.frequency}
                      {item.frequency === "monthly" && item.day_of_month ? ` - day ${item.day_of_month}` : ""}
                    </p>
                    {item.note ? <p className="mt-1 text-xs text-[#7B6E67]">{item.note}</p> : null}
                  </div>
                  <p className="text-sm font-bold text-[#FF6B58]">{formatCurrency(item.amount)}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleCalendarUrl(recurringToCalendarEvent(item))}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Tambah ke Google Calendar"
                      className="inline-flex items-center gap-1 rounded-full bg-[#EBF7F6] px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                    >
                      <CalendarPlus className="h-3 w-3" />
                      Calendar
                    </a>
                    <button
                      onClick={() => {
                        setSelectedRecurring(item);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button onClick={() => handleArchive(item.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-[#FF6B58]">
                      Archive
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <RecurringExpenseModal open={showModal} recurring={selectedRecurring} categories={categories} onClose={() => setShowModal(false)} onSaved={loadData} />
    </>
  );
}
