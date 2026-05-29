/**
 * BalanceGapModal.tsx
 *
 * Rekonsiliasi saldo dompet:
 *  1. User input saldo aktual sekarang (dari buka aplikasi e-wallet / buku tabungan)
 *  2. Sistem hitung saldo estimasi berdasarkan konfirmasi terakhir + semua transaksi tercatat
 *  3. Gap = estimasi - aktual → pengeluaran yang belum tercatat
 *  4. User bisa langsung "isi gap" (catat pengeluaran) atau "konfirmasi saldo baru"
 */

import { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Plus,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";
import { getWalletTransactionsByDateRange } from "../../services/walletTransactionService";
import { adjustWalletBalance } from "../../services/walletService";
import { addWalletTransaction } from "../../services/walletTransactionService";
import { toast } from "../../utils/toast";
import type { Wallet } from "../../types/models";

interface BalanceGapModalProps {
  wallet: Wallet;
  onClose: () => void;
  onSaved: () => void;
  onFillGap?: (gapAmount: number, walletId: string) => void;
}

interface GapAnalysis {
  confirmedBalance: number;
  recordedIn: number;
  recordedOut: number;
  expectedBalance: number;
  actualBalance: number;
  gap: number;         // positive = untracked spending, negative = untracked income
  transactionCount: number;
  sinceDate: string;
}

export default function BalanceGapModal({
  wallet,
  onClose,
  onSaved,
  onFillGap,
}: BalanceGapModalProps) {
  const [actualInput, setActualInput] = useState(() => {
    return wallet.confirmed_balance ? Math.round(wallet.confirmed_balance).toString() : "";
  });
  const [step, setStep] = useState<"input" | "analysis" | "fill-gap">("input");
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gapNote, setGapNote] = useState("");

  const formatRp = (n: number) =>
    `Rp ${Math.abs(n).toLocaleString("id-ID")}`;

  const sinceDate = wallet.last_confirmed_at
    ? wallet.last_confirmed_at
    : new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const handleAnalyze = async () => {
    const raw = parseFloat(actualInput.replace(/[^0-9]/g, ""));
    if (isNaN(raw) || raw < 0) {
      toast.error("Masukkan saldo aktual yang valid.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const endDate = new Date().toISOString();
      const txns = await getWalletTransactionsByDateRange(sinceDate, endDate, wallet.id);

      const recordedIn  = txns.filter(t => t.direction === "in" && !t.is_duplicate).reduce((s, t) => s + t.amount, 0);
      const recordedOut = txns.filter(t => t.direction === "out" && !t.is_duplicate).reduce((s, t) => s + t.amount, 0);

      const expectedBalance = wallet.confirmed_balance + recordedIn - recordedOut;
      const gap = expectedBalance - raw; // positive = kita pikir ada uang ini tapi ga ada → ada pengeluaran tak tercatat

      setAnalysis({
        confirmedBalance: wallet.confirmed_balance,
        recordedIn,
        recordedOut,
        expectedBalance,
        actualBalance: raw,
        gap,
        transactionCount: txns.length,
        sinceDate,
      });
      setStep("analysis");
    } catch (err) {
      toast.error("Gagal menganalisis data transaksi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User confirms the new balance (gap becomes an adjustment)
  const handleConfirmBalance = async () => {
    if (!analysis) return;
    setIsSaving(true);
    try {
      await adjustWalletBalance(
        wallet.id,
        analysis.actualBalance,
        gapNote || "Koreksi saldo manual dari analisis gap",
        "manual",
      );
      toast.success("Saldo berhasil dikonfirmasi dan diperbarui.");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan koreksi saldo.");
    } finally {
      setIsSaving(false);
    }
  };

  // User wants to add the gap as an untracked expense
  const handleFillGap = async () => {
    if (!analysis) return;
    setIsSaving(true);
    try {
      if (analysis.gap > 0) {
        // Untracked spending
        await addWalletTransaction({
          wallet_id: wallet.id,
          amount: analysis.gap,
          direction: "out",
          source: "manual",
          note: gapNote || "Pengeluaran tak tercatat (gap rekonsiliasi)",
          category: "Unknown",
          confidence: 0.6,
        });
        toast.success(`Gap Rp ${analysis.gap.toLocaleString("id-ID")} dicatat sebagai pengeluaran tak teridentifikasi.`);
      } else {
        // Untracked income
        await addWalletTransaction({
          wallet_id: wallet.id,
          amount: Math.abs(analysis.gap),
          direction: "in",
          source: "manual",
          note: gapNote || "Pemasukan tak tercatat (gap rekonsiliasi)",
          confidence: 0.6,
        });
        toast.success(`Gap dicatat sebagai pemasukan tak teridentifikasi.`);
      }

      // Then confirm the actual balance
      await adjustWalletBalance(wallet.id, analysis.actualBalance, "Setelah isi gap rekonsiliasi", "manual");
      window.dispatchEvent(new CustomEvent("wallet-transaction-added"));
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengisi gap.");
    } finally {
      setIsSaving(false);
    }
  };

  const gapSeverity = analysis
    ? analysis.gap === 0
      ? "perfect"
      : Math.abs(analysis.gap) < 10_000
      ? "minor"
      : Math.abs(analysis.gap) < 100_000
      ? "moderate"
      : "major"
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-black/10 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
          <div>
            <div className="flex items-center gap-1.5 text-[#29B9AA]">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Analisis Gap</span>
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-[#1A2B38]">
              Rekonsiliasi · {wallet.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#7B6E67] hover:bg-[#FEF9F4]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* ── Step 1: Input ── */}
          {step === "input" && (
            <>
              {/* Current state summary */}
              <div className="rounded-2xl bg-[#FEF9F4] border border-black/5 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">
                  Kondisi Saat Ini
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#7B6E67] font-semibold">Saldo Terkonfirmasi</p>
                    <p className="text-sm font-bold text-[#1A2B38]">{formatRp(wallet.confirmed_balance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#7B6E67] font-semibold">Saldo Estimasi</p>
                    <p className="text-sm font-bold text-[#29B9AA]">{formatRp(wallet.estimated_balance)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#7B6E67] font-semibold border-t border-black/5 pt-2.5">
                  <Clock className="w-3 h-3 shrink-0" />
                  Konfirmasi terakhir:{" "}
                  {wallet.last_confirmed_at
                    ? new Date(wallet.last_confirmed_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Belum pernah"}
                </div>
              </div>

              {/* Actual balance input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#7B6E67]">
                  Saldo Aktual Sekarang (Rp)
                </label>
                <p className="text-[11px] text-[#7B6E67] mb-3 leading-relaxed">
                  Buka aplikasi {wallet.name} / buku tabungan, lalu input saldo yang tertera di sana.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#7B6E67]">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="0"
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] py-4 pl-12 pr-4 text-xl font-bold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                    value={actualInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setActualInput(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!actualInput || isAnalyzing}
                className="w-full rounded-2xl bg-gradient-to-r from-[#29B9AA] to-[#209F92] py-4 text-sm font-bold text-white shadow-lg shadow-teal-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analisis Gap Sekarang
                  </>
                )}
              </button>
            </>
          )}

          {/* ── Step 2: Gap Analysis Result ── */}
          {step === "analysis" && analysis && (
            <>
              {/* Calculation breakdown */}
              <div className="rounded-2xl border border-black/5 bg-[#FEF9F4] p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67] mb-3">
                  Rekap Perhitungan
                </p>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7B6E67] font-semibold">Saldo terkonfirmasi</span>
                  <span className="font-bold text-[#1A2B38]">{formatRp(analysis.confirmedBalance)}</span>
                </div>
                {analysis.recordedIn > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#7B6E67] font-semibold">+ Pemasukan tercatat</span>
                    <span className="font-bold text-[#29B9AA]">+{formatRp(analysis.recordedIn)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7B6E67] font-semibold">− Pengeluaran tercatat ({analysis.transactionCount} transaksi)</span>
                  <span className="font-bold text-[#FF6B58]">−{formatRp(analysis.recordedOut)}</span>
                </div>
                <div className="border-t border-black/10 pt-2 flex justify-between items-center text-sm">
                  <span className="text-[#7B6E67] font-bold">= Estimasi seharusnya</span>
                  <span className="font-extrabold text-[#1A2B38]">{formatRp(analysis.expectedBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7B6E67] font-bold">Saldo aktual kamu</span>
                  <span className="font-extrabold text-[#29B9AA]">{formatRp(analysis.actualBalance)}</span>
                </div>
              </div>

              {/* Gap result */}
              {analysis.gap === 0 ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Saldo Sempurna!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Saldo aktual kamu cocok persis dengan estimasi kami. Semua transaksi sudah tercatat dengan baik.
                    </p>
                  </div>
                </div>
              ) : analysis.gap > 0 ? (
                <div
                  className={`rounded-2xl p-4 flex items-start gap-3 border ${
                    gapSeverity === "minor"
                      ? "bg-amber-50 border-amber-200"
                      : gapSeverity === "moderate"
                      ? "bg-orange-50 border-orange-200"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      gapSeverity === "minor" ? "text-amber-600" : gapSeverity === "moderate" ? "text-orange-600" : "text-red-600"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-bold text-sm ${
                        gapSeverity === "minor" ? "text-amber-800" : gapSeverity === "moderate" ? "text-orange-800" : "text-red-800"
                      }`}
                    >
                      Gap {formatRp(analysis.gap)} — Pengeluaran Tak Tercatat
                    </p>
                    <p
                      className={`text-[11px] mt-1 leading-relaxed ${
                        gapSeverity === "minor" ? "text-amber-700" : gapSeverity === "moderate" ? "text-orange-700" : "text-red-700"
                      }`}
                    >
                      Estimasi kami lebih tinggi {formatRp(analysis.gap)} dari saldo aktual. Kemungkinan ada pengeluaran
                      yang belum kamu catat — transaksi tunai, QRIS, atau transfer yang tidak tertangkap notifikasi.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-800 text-sm">Gap {formatRp(analysis.gap)} — Pemasukan Tak Tercatat</p>
                    <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                      Saldo aktual lebih tinggi dari estimasi. Mungkin ada top-up atau transfer masuk yang belum tercatat.
                    </p>
                  </div>
                </div>
              )}

              {/* Note input */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Belanja cash di pasar, bayar parkir, dll..."
                  className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-xs font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                  value={gapNote}
                  onChange={(e) => setGapNote(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                {analysis.gap !== 0 && (
                  <button
                    onClick={handleFillGap}
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B58] to-[#E8503F] py-4 text-sm font-bold text-white shadow-lg shadow-red-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Isi Gap — Catat {analysis.gap > 0 ? "Pengeluaran" : "Pemasukan"} Tak Tercatat
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleConfirmBalance}
                  disabled={isSaving}
                  className="w-full rounded-2xl border border-[#29B9AA]/30 bg-[#EBF7F6] py-3.5 text-sm font-bold text-[#29B9AA] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {analysis.gap === 0 ? "Konfirmasi Saldo" : "Lewati Gap — Langsung Konfirmasi Saldo"}
                </button>

                <button
                  onClick={() => setStep("input")}
                  className="w-full py-2.5 text-xs font-semibold text-[#7B6E67] hover:text-[#1A2B38]"
                >
                  ← Ubah angka saldo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
