import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronRight, EyeOff, Eye, Sparkles } from "lucide-react";
import type { BudgetCategory, ExpenseRecord, TabId } from "../../types/models";
import { getExpensesByDate, hasAnyExpenses } from "../../services/expenseService";
import { getCurrentPlan } from "../../services/planService";
import { getCategoryCount, getCategories } from "../../services/categoryService";
import { checkBudgetStatus, checkDailyBudget, getAllCategoriesBudgetStatus } from "../../services/alertService";
import { getIncomeSummary } from "../../services/incomeService";
import { getCurrentMonth, getToday } from "../../utils/date";
import { formatCompactCurrency, formatCurrency } from "../../utils/format";
import { useOnboarding } from "../../contexts/OnboardingContext";
import ExpenseModal from "../../components/modals/ExpenseModal";
import MonthlyPlanModal from "../../components/modals/MonthlyPlanModal";

const ChecklistItem = ({
  label,
  hint,
  done,
  actionLabel,
  onClick,
}: {
  label: string;
  hint: string;
  done: boolean;
  actionLabel: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-[#FEF9F4]"
  >
    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-[#EBF7F6] text-[#29B9AA]" : "bg-[#FFF6E8] text-[#FFB347]"}`}>
      {done ? "OK" : "GO"}
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-[#1A2B38]">{label}</p>
      <p className="mt-1 text-xs text-[#7B6E67]">{hint}</p>
    </div>
    <span className={`text-xs font-bold ${done ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>{actionLabel}</span>
  </button>
);

export default function HomeScreen({
  onNavigateTab,
  openExpenseComposerTick,
}: {
  onNavigateTab: (tab: TabId) => void;
  openExpenseComposerTick?: number;
}) {
  const { isChecklistHidden, hideChecklist, showChecklist } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [monthlyStatus, setMonthlyStatus] = useState<any>(null);
  const [categoryAlerts, setCategoryAlerts] = useState<any[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<any>(null);
  const [starterTasks, setStarterTasks] = useState({ hasPlan: false, hasCategories: false, hasExpense: false });
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const today = getToday();
  const month = getCurrentMonth();

  const loadData = async () => {
    const unwrap = <T,>(result: PromiseSettledResult<T>, fallback: T) =>
      result.status === "fulfilled" ? result.value : fallback;

    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
          getExpensesByDate(today),
          getCurrentPlan(month),
          getCategoryCount(),
          getCategories(),
          hasAnyExpenses(),
          checkDailyBudget(today),
          checkBudgetStatus(month),
          getAllCategoriesBudgetStatus(month),
          getIncomeSummary(month),
        ]);

      const [
        todayExpenses,
        currentPlan,
        categoryCount,
        categoryList,
        expenseHistory,
        nextDailyStatus,
        nextMonthlyStatus,
        nextCategoryStatuses,
        nextIncomeSummary,
      ] = results;

      setExpenses(unwrap(todayExpenses, [] as ExpenseRecord[]));
      setPlan(unwrap(currentPlan, null));
      setCategories(unwrap(categoryList, [] as BudgetCategory[]));
      setDailyStatus(unwrap(nextDailyStatus, null));
      setMonthlyStatus(unwrap(nextMonthlyStatus, null));
      setCategoryAlerts(unwrap(nextCategoryStatuses, [] as any[]).filter((item) => item.alertLevel !== "safe"));
      setIncomeSummary(unwrap(nextIncomeSummary, null));
      setStarterTasks({
        hasPlan: Boolean(unwrap(currentPlan, null)),
        hasCategories: unwrap(categoryCount, 0) > 0,
        hasExpense: unwrap(expenseHistory, false),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!openExpenseComposerTick) return;
    setShowExpenseModal(true);
  }, [openExpenseComposerTick]);

  const todaySpending = expenses.reduce((sum, item) => sum + item.amount, 0);
  const checklistItems = [
    {
      label: "Set monthly plan",
      hint: "Biar budget harian dan alert langsung terasa nyambung.",
      done: starterTasks.hasPlan,
      actionLabel: starterTasks.hasPlan ? "Done" : "Open",
      onClick: () => setShowPlanModal(true),
    },
    {
      label: "Rapikan kategori",
      hint: "Supaya transaksi dan ringkasanmu lebih relevan.",
      done: starterTasks.hasCategories,
      actionLabel: starterTasks.hasCategories ? "Review" : "Open",
      onClick: () => onNavigateTab("settings"),
    },
    {
      label: "Tambah expense pertama",
      hint: "Sekali catat, dashboard langsung mulai hidup.",
      done: starterTasks.hasExpense,
      actionLabel: starterTasks.hasExpense ? "Done" : "Add",
      onClick: () => setShowExpenseModal(true),
    },
  ];
  const allChecklistDone = checklistItems.every((item) => item.done);
  const shouldShowChecklist = !isChecklistHidden && !allChecklistDone;

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Today</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-[#1A2B38] md:text-4xl">
                Budget terasa lebih ringan kalau kelihatan arahnya.
              </h1>
              <p className="mt-3 text-sm text-[#7B6E67]">{today}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FEF9F4] px-5 py-4">
                <p className="text-xs text-[#7B6E67]">Hari ini keluar</p>
                <p className="mt-1 text-2xl font-bold text-[#1A2B38]">{formatCurrency(todaySpending)}</p>
                <p className="mt-1 text-xs text-[#7B6E67]">{expenses.length} transaksi</p>
              </div>
              <div className="rounded-2xl bg-[#EBF7F6] px-5 py-4">
                <p className="text-xs text-[#7B6E67]">Sisa budget harian</p>
                <p className="mt-1 text-2xl font-bold text-[#1A2B38]">
                  {formatCurrency(dailyStatus?.remaining ?? 0)}
                </p>
                <p className="mt-1 text-xs text-[#7B6E67]">Target {formatCurrency(dailyStatus?.dailyBudget ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {shouldShowChecklist ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#FFB347]">Mulai di sini</p>
                <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">Biar awalnya tidak kagok</h2>
                <p className="mt-2 text-sm text-[#7B6E67]">Tiga langkah ini cukup buat bikin app langsung terasa kepakai.</p>
              </div>
              <button onClick={() => hideChecklist().catch((err) => toast.error(err.message))} className="rounded-full bg-[#F3EDE8] px-4 py-2 text-xs font-semibold text-[#7B6E67]">
                <EyeOff className="mr-1 inline h-3 w-3" />
                Hide
              </button>
            </div>
            {checklistItems.map((item) => (
              <ChecklistItem key={item.label} {...item} />
            ))}
          </div>
        ) : isChecklistHidden && !allChecklistDone ? (
          <div className="rounded-[32px] border border-dashed border-[#29B9AA]/35 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Starter checklist</p>
                <h2 className="mt-2 text-xl font-bold text-[#1A2B38]">Checklist sengaja disembunyikan, tapi belum selesai semua.</h2>
                <p className="mt-2 text-sm text-[#7B6E67]">Kalau mau lanjut setting awal, tampilkan lagi tanpa mengubah lebar section ini.</p>
              </div>
              <button
                onClick={() => showChecklist().catch((err) => toast.error(err.message))}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <Eye className="h-4 w-4" />
                Tampilkan starter checklist lagi
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Ringkasan bulan ini</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">{formatCurrency(incomeSummary?.totalIncome ?? 0)}</h2>
                </div>
                <button onClick={() => onNavigateTab("income")} className="rounded-full bg-[#EBF7F6] px-4 py-2 text-xs font-semibold text-[#29B9AA]">
                  Lihat income <ChevronRight className="inline h-3 w-3" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <p className="text-xs text-[#7B6E67]">Pengeluaran</p>
                  <p className="mt-1 text-lg font-bold text-[#FF6B58]">{formatCompactCurrency(incomeSummary?.totalExpenses ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <p className="text-xs text-[#7B6E67]">Tabungan</p>
                  <p className="mt-1 text-lg font-bold text-[#1A2B38]">{formatCompactCurrency(incomeSummary?.savings ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <p className="text-xs text-[#7B6E67]">Savings rate</p>
                  <p className="mt-1 text-lg font-bold text-[#29B9AA]">{Math.round(incomeSummary?.savingsRate ?? 0)}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Aktivitas hari ini</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1A2B38]">Today's expenses</h2>
                </div>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="rounded-full bg-[#FF6B58] px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  Add
                </button>
              </div>
              <div className="p-5">
                {expenses.length === 0 ? (
                  <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center">
                    <p className="text-lg font-bold text-[#1A2B38]">Belum ada pengeluaran hari ini</p>
                    <p className="mt-2 text-sm text-[#7B6E67]">Tambah satu transaksi kecil dulu supaya dashboard mulai hidup.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <button
                        key={expense.id}
                        onClick={() => onNavigateTab("history")}
                        className="flex w-full items-center gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4 text-left"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${expense.budget_categories?.color || "#5BAEE8"}22` }}>
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: expense.budget_categories?.color || "#5BAEE8" }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1A2B38]">{expense.budget_categories?.name || "Unknown"}</p>
                          {expense.note ? <p className="mt-1 text-xs text-[#7B6E67]">{expense.note}</p> : null}
                        </div>
                        <p className="text-sm font-bold text-[#FF6B58]">{formatCompactCurrency(expense.amount)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Budget mood</p>
              <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">
                {dailyStatus?.remaining >= 0 ? "Aman" : "Watch it"}
              </h2>
              <p className="mt-2 text-sm text-[#7B6E67]">
                {dailyStatus?.remaining >= 0 ? "Masih ada ruang buat hari ini." : "Pengeluaranmu sudah lewat target harian."}
              </p>
              {dailyStatus?.dailyBudget && todaySpending > dailyStatus.dailyBudget * 2 ? (
                <div className="mt-3 rounded-2xl bg-[#FEF9F4] px-4 py-3 text-xs text-[#7B6E67]">
                  <Sparkles className="mr-2 inline h-3.5 w-3.5 text-[#29B9AA]" />
                  Ada transaksi besar hari ini. Untuk biaya bulanan seperti kos atau tagihan, cek juga kartu monthly plan supaya konteksnya lebih pas.
                </div>
              ) : null}
              <div className="mt-4 h-2 rounded-full bg-[#F3EDE8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.max(dailyStatus?.percentUsed || 0, 0), 100)}%`,
                    backgroundColor: dailyStatus?.isOverBudget ? "#FF6B58" : "#29B9AA",
                  }}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Monthly plan</p>
              <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">{plan ? formatCurrency(plan.income) : "Belum di-set"}</h2>
              <p className="mt-2 text-sm text-[#7B6E67]">Plan ini adalah patokan income bulanan. Dari sini app menghitung ringkasan bulan, target harian, alert, dan analytics.</p>
              <button onClick={() => setShowPlanModal(true)} className="mt-4 rounded-full bg-[#29B9AA] px-4 py-2 text-xs font-semibold text-white">
                {plan ? "Ubah plan" : "Set plan"}
              </button>
            </div>

            {monthlyStatus ? (
              <div className={`rounded-[32px] border p-5 shadow-sm ${monthlyStatus.isOverBudget ? "border-red-200 bg-red-50" : "border-black/10 bg-white"}`}>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7B6E67]">Monthly alert</p>
                <h2 className={`mt-2 text-xl font-bold ${monthlyStatus.isOverBudget ? "text-[#FF6B58]" : "text-[#1A2B38]"}`}>
                  {monthlyStatus.isOverBudget ? "Budget bulanan terlewati" : "Budget bulanan masih aman"}
                </h2>
                <p className="mt-2 text-sm text-[#7B6E67]">
                  Spending {formatCurrency(monthlyStatus.totalSpending || 0)} dari income {formatCurrency(monthlyStatus.income || 0)}.
                </p>
              </div>
            ) : null}

            {categoryAlerts.length > 0 ? (
              <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Perlu dilihat</p>
                <div className="mt-3 space-y-3">
                  {categoryAlerts.map((alert) => (
                    <div key={alert.categoryName} className="rounded-2xl bg-white/80 px-4 py-3">
                      <p className="text-sm font-semibold text-[#1A2B38]">{alert.categoryName}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">
                        {formatCurrency(alert.spending || 0)} dari budget {formatCurrency(alert.budget || 0)}.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ExpenseModal open={showExpenseModal} categories={categories} initialDate={today} onClose={() => setShowExpenseModal(false)} onSaved={loadData} />
      <MonthlyPlanModal open={showPlanModal} month={month} onClose={() => setShowPlanModal(false)} onSaved={loadData} />
    </>
  );
}
