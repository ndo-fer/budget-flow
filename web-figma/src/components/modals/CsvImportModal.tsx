import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, ChevronRight, AlertCircle, Check } from "lucide-react";
import { parseRawCsv, autoDetectMapping, buildTransactionCandidates, buildImportPreview } from "../../services/csvImportService";
import { addBulkWalletTransactions } from "../../services/walletTransactionService";
import { getWallets } from "../../services/walletService";
import { formatCurrency } from "../../utils/format";
import { toast } from "../../utils/toast";
import type { Wallet, CsvColumnMapping, CsvImportPreview } from "../../types/models";

type Step = "upload" | "map" | "preview" | "done";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId?: string | null;
  onImportSuccess?: () => void;
}

export default function CsvImportModal({ isOpen, onClose, walletId, onImportSuccess }: CsvImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [rawCsv, setRawCsv] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [isBuildingPreview, setIsBuildingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("upload");
      setRawCsv(null);
      setPreview(null);
      setMapping({});
      setSelectedWalletId(walletId || "");
      
      getWallets().then((ws) => {
        setWallets(ws);
        if (ws.length > 0 && !walletId) {
          setSelectedWalletId(ws[0].id);
        }
      }).catch(() => {});
    }
  }, [isOpen, walletId]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = parseRawCsv(raw);
        setRawCsv(parsed);
        setMapping(autoDetectMapping(parsed.headers));
        setStep("map");
      } catch (err: any) {
        toast.error(err.message || "Gagal membaca CSV.");
      }
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleBuildPreview = async () => {
    if (!rawCsv || !mapping.date || !mapping.amount) {
      return toast.error("Kolom tanggal dan amount wajib di-mapping.");
    }
    setIsBuildingPreview(true);
    try {
      const candidates = buildTransactionCandidates(rawCsv.rows, mapping as CsvColumnMapping, selectedWalletId || undefined);
      const prev = await buildImportPreview(candidates);
      setPreview(prev);
      setStep("preview");
    } catch (e: any) {
      toast.error(e.message || "Gagal membuat preview.");
    } finally {
      setIsBuildingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    const toSave = preview.transactions.filter((t) => !t.is_duplicate);
    if (toSave.length === 0) return toast.error("Tidak ada transaksi baru untuk diimport.");

    setIsSaving(true);
    try {
      const count = await addBulkWalletTransactions(toSave as any);
      toast.success(`${count} transaksi berhasil diimport.`);
      setStep("done");
      if (onImportSuccess) onImportSuccess();
    } catch (e: any) {
      toast.error(e.message || "Gagal import.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "map", label: "Mapping" },
    { id: "preview", label: "Preview" },
    { id: "done", label: "Selesai" },
  ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-black/10 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#7B6E67] hover:bg-[#F3EDE8] hover:text-[#1A2B38]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Import Data</p>
          <h2 className="mt-2 text-2xl font-bold text-[#1A2B38]">CSV Import</h2>
          <p className="mt-1 text-xs text-[#7B6E67]">Import histori transaksi dari bank, e-wallet, atau finance app lain.</p>

          {/* Step bar */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  i < stepIdx ? "bg-[#29B9AA] text-white" :
                  i === stepIdx ? "bg-[#1A2B38] text-white" :
                  "bg-[#F3EDE8] text-[#7B6E67]"
                }`}>
                  {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={`text-[11px] font-semibold ${i === stepIdx ? "text-[#1A2B38]" : "text-[#7B6E67]"}`}>{s.label}</span>
                {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-[#7B6E67]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {wallets.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Assign ke wallet (opsional)</label>
                <select
                  className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm font-semibold text-[#1A2B38] outline-none"
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                >
                  <option value="">— Tidak assign ke wallet —</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#29B9AA]/40 bg-[#EBF7F6]/40 px-6 py-12 text-center"
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-[#29B9AA]" />
              <p className="text-sm font-semibold text-[#1A2B38]">Drop file CSV atau klik untuk pilih</p>
              <p className="text-xs text-[#7B6E67]">Comma (,) atau semicolon (;) separator — keduanya diterima</p>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="rounded-2xl bg-[#FEF9F4] p-4">
              <p className="text-xs font-semibold text-[#1A2B38]">Format yang dibutuhkan (minimal):</p>
              <pre className="mt-2 text-[10px] leading-relaxed text-[#7B6E67]">{`Tanggal, Keterangan, Nominal, Jenis
2026-05-01, "Makan siang", 35000, Debit
2026-05-02, "Top up GoPay", 100000, Kredit`}</pre>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && rawCsv && (
          <div className="space-y-4">
            <p className="text-xs text-[#7B6E67]">
              {rawCsv.rows.length} baris ditemukan. Cocokkan kolom dari file ke field yang dibutuhkan.
            </p>

            <div className="space-y-3">
              {(["date", "description", "amount", "direction", "balance", "category"] as (keyof CsvColumnMapping)[]).map((field) => {
                const labels: Record<keyof CsvColumnMapping, string> = {
                  date: "Tanggal *",
                  description: "Deskripsi / Keterangan *",
                  amount: "Nominal *",
                  direction: "Jenis (Debit/Kredit)",
                  balance: "Saldo Akhir",
                  category: "Kategori",
                };
                const required = ["date", "description", "amount"].includes(field);
                return (
                  <div key={field} className="flex items-center gap-3">
                    <div className="w-40 shrink-0">
                      <p className="text-xs font-semibold text-[#1A2B38]">{labels[field]}</p>
                    </div>
                    <select
                      className="flex-1 rounded-2xl border border-black/10 bg-[#FEF9F4] px-3 py-2 text-xs font-semibold text-[#1A2B38] outline-none"
                      value={mapping[field] || ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))}
                    >
                      <option value="">{required ? "— Pilih kolom —" : "— Tidak dipakai —"}</option>
                      {rawCsv.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Data preview */}
            <div className="overflow-x-auto rounded-2xl border border-black/5 max-h-40">
              <table className="min-w-full text-xs">
                <thead className="bg-[#FEF9F4] sticky top-0">
                  <tr>
                    {rawCsv.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-[#7B6E67]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawCsv.rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t border-black/5">
                      {rawCsv.headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-[#1A2B38]">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("upload")} className="rounded-2xl bg-[#F3EDE8] px-5 py-3 text-sm font-semibold text-[#7B6E67]">
                Kembali
              </button>
              <button
                onClick={handleBuildPreview}
                disabled={isBuildingPreview}
                className="flex-1 rounded-2xl bg-[#29B9AA] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {isBuildingPreview ? "Memproses..." : "Preview import →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[#EBF7F6] px-4 py-4 text-center">
                <p className="text-xl font-bold text-[#29B9AA]">{preview.newCount}</p>
                <p className="mt-1 text-[10px] text-[#7B6E67]">Transaksi baru</p>
              </div>
              <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4 text-center">
                <p className="text-xl font-bold text-[#FFB347]">{preview.duplicateCount}</p>
                <p className="mt-1 text-[10px] text-[#7B6E67]">Duplikat (skip)</p>
              </div>
              <div className="rounded-2xl bg-[#FEF9F4] px-4 py-4 text-center">
                <p className="text-xl font-bold text-[#7B6E67]">{preview.reviewCount}</p>
                <p className="mt-1 text-[10px] text-[#7B6E67]">Butuh review</p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-3 max-h-52 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7B6E67] mb-2 px-1">Sample transaksi</p>
              <div className="space-y-2">
                {preview.transactions.slice(0, 10).map((tx, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${tx.is_duplicate ? "bg-amber-50/70" : "bg-[#FEF9F4]"}`}>
                    <div className="flex items-center gap-2">
                      {tx.is_duplicate && <AlertCircle className="h-3 w-3 text-[#FFB347] shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A2B38] truncate">{tx.note || "—"}</p>
                        <p className="text-[9px] text-[#7B6E67]">{tx.occurred_at?.slice(0, 10)} · {tx.source}</p>
                      </div>
                    </div>
                    <p className={`font-bold shrink-0 ${tx.direction === "out" ? "text-[#FF6B58]" : "text-[#29B9AA]"}`}>
                      {tx.direction === "out" ? "-" : "+"}{formatCurrency(tx.amount || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("map")} className="rounded-2xl bg-[#F3EDE8] px-5 py-3 text-sm font-semibold text-[#7B6E67]">
                Edit mapping
              </button>
              <button
                onClick={handleImport}
                disabled={isSaving || preview.newCount === 0}
                className="flex-1 rounded-2xl bg-[#29B9AA] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {isSaving ? "Mengimport..." : `Import ${preview.newCount} transaksi`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF7F6]">
              <Check className="h-6 w-6 text-[#29B9AA]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2B38]">Import selesai!</h3>
            <p className="text-xs text-[#7B6E67] max-w-sm mx-auto">
              Transaksi sudah masuk ke histori wallet. Saldo estimasi dan grafik analytics akan otomatis terupdate.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-2xl bg-[#F3EDE8] px-6 py-3 text-sm font-semibold text-[#7B6E67]"
              >
                Tutup
              </button>
              <button
                onClick={() => { setStep("upload"); setRawCsv(null); setPreview(null); setMapping({}); }}
                className="rounded-2xl bg-[#29B9AA] px-6 py-3 text-sm font-bold text-white"
              >
                Import file lain
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
