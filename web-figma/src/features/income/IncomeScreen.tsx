import { useEffect, useState } from "react";
import { 
  Pencil, 
  Plus,
  PlusCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Layers,
  List,
  Clock,
  Repeat2,
  Trash2
} from "lucide-react";
import { toast } from "../../utils/toast";
import { getIncomeBySource, getIncomeSources, getIncomeSummary, getIncomeTransactions, deleteIncomeTransaction } from "../../services/incomeService";
import { formatMonthLabel, getCurrentMonth, shiftMonth } from "../../utils/date";
import { formatCurrency } from "../../utils/format";
import IncomeSourceModal from "../../components/modals/IncomeSourceModal";
import IncomeTransactionModal from "../../components/modals/IncomeTransactionModal";

export default function IncomeScreen() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [sources, setSources] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [prefillSourceId, setPrefillSourceId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sourceData, transactionData, summaryData, breakdownData] = await Promise.all([
        getIncomeSources(),
        getIncomeTransactions(month),
        getIncomeSummary(month),
        getIncomeBySource(month),
      ]);
      setSources(sourceData);
      setTransactions(transactionData);
      setSummary(summaryData);
      setBreakdown(breakdownData);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data income.");
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Delete income transaction ini?")) return;
    try {
      await deleteIncomeTransaction(id);
      toast.success("Income transaction berhasil dihapus.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus income transaction.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-8">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Income tracking</p>
          <h1 className="mt-3 text-3xl font-bold text-[#1A2B38]">Pantau pemasukanmu biar tabungan terasa lebih kebayang.</h1>
          <p className="mt-3 text-sm text-[#7B6E67]">Sumber income, transaksi masuk, dan savings bulan ini semua bisa dilihat dari satu tempat.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setSelectedTransaction(null);
              setPrefillSourceId(null);
              setShowTransactionModal(true);
            }}
            disabled={sources.length === 0}
            className="rounded-2xl bg-[#5BAEE8] hover:bg-[#4CA1DB] transition-colors px-5 py-3 text-sm font-semibold text-white disabled:bg-[#D8E9F6] disabled:text-[#6F8A9A] flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Income
          </button>
          <button
            onClick={() => {
              setSelectedSource(null);
              setShowSourceModal(true);
            }}
            className="rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] transition-colors px-5 py-3 text-sm font-semibold text-white flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            Source
          </button>
          {sources.length === 0 ? <p className="self-center text-xs text-[#7B6E67]">Tambah source dulu supaya tombol income bisa dipakai.</p> : null}
          <div className="ml-auto flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
            <button 
              onClick={() => setMonth((current) => shiftMonth(current, -1))} 
              className="rounded-full bg-[#F3EDE8] p-1.5 hover:bg-[#EADFD8] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-[#7B6E67]" />
            </button>
            <span className="text-sm font-bold text-[#1A2B38]">{formatMonthLabel(month)}</span>
            <button 
              onClick={() => setMonth((current) => shiftMonth(current, 1))} 
              className="rounded-full bg-[#F3EDE8] p-1.5 hover:bg-[#EADFD8] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
            </button>
          </div>
        </div>

        {summary ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#7B6E67]">
                <TrendingUp className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                <p className="text-xs">Total income</p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-[#1A2B38]">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#7B6E67]">
                <TrendingDown className="w-3.5 h-3.5 text-[#FF6B58] flex-shrink-0" />
                <p className="text-xs">Total expenses</p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-[#FF6B58]">{formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#7B6E67]">
                <PiggyBank className="w-3.5 h-3.5 text-[#5BAEE8] flex-shrink-0" />
                <p className="text-xs">Savings</p>
              </div>
              <p className={`mt-1.5 text-2xl font-bold ${summary.savings >= 0 ? "text-[#29B9AA]" : "text-[#FF6B58]"}`}>{formatCurrency(summary.savings)}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[#7B6E67]">
                  <Layers className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-[0.28em]">Income by source</p>
                </div>
                <h2 className="mt-1 text-xl font-bold text-[#1A2B38]">Per sumber</h2>
              </div>
            </div>
            <div className="space-y-3">
              {breakdown.length === 0 ? (
                <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada source atau transaksi income untuk bulan ini.</div>
              ) : (
                breakdown.map((item) => (
                  <div key={item.sourceId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A2B38]">{item.sourceName}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{item.frequency} - {item.transactionCount} transaction(s)</p>
                    </div>
                    <p className="text-sm font-bold text-[#29B9AA]">{formatCurrency(item.actualAmount)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSource(sources.find((source) => source.id === item.sourceId) || null);
                          setShowSourceModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrefillSourceId(item.sourceId);
                          setSelectedTransaction(null);
                          setShowTransactionModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-[#29B9AA] px-3 py-2 text-xs font-semibold text-white shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Record
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-[#7B6E67]">
                <Wallet className="w-3.5 h-3.5 text-[#29B9AA] flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-[0.28em]">Income sources</p>
              </div>
              <h2 className="mt-1 text-xl font-bold text-[#1A2B38]">Source list</h2>
            </div>
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada income source.</div>
              ) : (
                sources.map((source) => (
                  <div key={source.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A2B38]">{source.source_name}</p>
                      <p className="mt-1 text-xs text-[#7B6E67]">{source.frequency}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A2B38]">{formatCurrency(source.amount)}</p>
                    <button
                      onClick={() => {
                        setSelectedSource(source);
                        setShowSourceModal(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#7B6E67] mb-4">
            <List className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <p className="text-xs font-bold uppercase tracking-[0.28em]">Recent transactions</p>
          </div>
          <div className="mt-4 space-y-3">
            {transactions.length === 0 ? (
              <div className="rounded-2xl bg-[#FEF9F4] px-5 py-8 text-center text-sm text-[#7B6E67]">Belum ada income transaction untuk bulan ini.</div>
            ) : (
              transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#FEF9F4] px-4 py-4">
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-[#1A2B38]">{transaction.income_sources?.source_name || "Income"}</p>
                    <p className="mt-1 text-xs text-[#7B6E67]">{transaction.date}</p>
                    {transaction.notes ? <p className="mt-1 text-xs text-[#7B6E67]">{transaction.notes}</p> : null}
                  </div>
                  <p className="text-sm font-bold text-[#29B9AA]">{formatCurrency(transaction.amount)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowTransactionModal(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#29B9AA] shadow-sm"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTransaction(transaction.id)} 
                      className="inline-flex items-center gap-1 rounded-full bg-red-50 hover:bg-red-100 transition-colors px-3 py-2 text-xs font-semibold text-[#FF6B58]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <IncomeSourceModal open={showSourceModal} source={selectedSource} onClose={() => setShowSourceModal(false)} onSaved={loadData} />
      <IncomeTransactionModal
        open={showTransactionModal}
        transaction={selectedTransaction}
        selectedSourceId={prefillSourceId}
        initialMonth={month}
        incomeSources={sources}
        onClose={() => setShowTransactionModal(false)}
        onSaved={loadData}
      />
    </>
  );
}
