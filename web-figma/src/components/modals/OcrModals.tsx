import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, Camera, Check, Edit3, RefreshCw } from "lucide-react";
import { parseBalanceScreenshot, parseReceiptImage } from "../../services/ocrService";
import { adjustWalletBalance } from "../../services/walletService";
import { addWalletTransaction } from "../../services/walletTransactionService";
import { getWallets } from "../../services/walletService";
import { formatCurrency, parseRawCurrencyInput } from "../../utils/format";
import { toast } from "../../utils/toast";
import type { Wallet, BalanceOcrResult, ReceiptOcrResult } from "../../types/models";
import { toLocalDateString } from "../../utils/date";

// ── OCR Progress Bar ──────────────────────────────────────────

function OcrProgress({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-[#7B6E67]">
        <span>{status || "Memproses..."}</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-[#F3EDE8]">
        <div
          className="h-full rounded-full bg-[#29B9AA] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Screenshot Balance Update Modal ──────────────────────────

export function ScreenshotBalanceModal({
  walletId,
  onClose,
  onSaved,
}: {
  walletId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState(walletId || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<BalanceOcrResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedBalance, setEditedBalance] = useState("");
  const [activeMode, setActiveMode] = useState<"screenshot" | "manual">("screenshot");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getWallets().then(setWallets).catch(() => {});

    // Prevent default drag/drop behaviors globally to avoid browser navigation
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets]);

  // Prefill current wallet balance when switching to manual mode or changing wallet
  useEffect(() => {
    if (activeMode === "manual" && selectedWalletId) {
      const wallet = wallets.find((w) => w.id === selectedWalletId);
      if (wallet) {
        setEditedBalance(wallet.estimated_balance.toString());
      }
    }
  }, [activeMode, selectedWalletId, wallets]);

  const handleFile = useCallback(async (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setOcrResult(null);
    setProgress(0);
    setIsProcessing(true);

    try {
      const result = await parseBalanceScreenshot(file, (p, s) => {
        setProgress(p);
        setProgressStatus(s);
      });
      setOcrResult(result);
      setEditedBalance(result.balanceCandidate?.toString() || "");

      // Auto-select wallet if detected
      if (result.walletCandidate) {
        const match = wallets.find((w) =>
          w.name.toLowerCase().includes(result.walletCandidate!.toLowerCase()) ||
          w.provider?.toLowerCase().includes(result.walletCandidate!.toLowerCase()),
        );
        if (match) setSelectedWalletId(match.id);
      }
    } catch (e: any) {
      toast.error("Gagal membaca screenshot: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  }, [wallets]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  const handleSave = async () => {
    const balance = parseRawCurrencyInput(editedBalance);
    if (isNaN(balance) || balance < 0) return toast.error("Nominal tidak valid.");
    if (!selectedWalletId) return toast.error("Pilih wallet terlebih dahulu.");

    setIsSaving(true);
    try {
      const description = activeMode === "manual" ? "Koreksi saldo manual" : "Update dari screenshot";
      const source = activeMode === "manual" ? "manual" : "screenshot";
      await adjustWalletBalance(selectedWalletId, balance, description, source);
      toast.success(activeMode === "manual" ? "Saldo berhasil dikoreksi." : "Saldo berhasil diperbarui dari screenshot.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-t-[32px] bg-white p-6 shadow-xl sm:rounded-[32px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#29B9AA] mb-0.5">
              {activeMode === "screenshot" ? (
                <>
                  <Upload className="w-4 h-4 animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">Automated Sync</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">Manual Correction</span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#1A2B38]">
              {activeMode === "screenshot" ? "Update dari Screenshot" : "Koreksi Saldo Manual"}
            </h2>
            <p className="mt-1 text-xs text-[#7B6E67]">
              {activeMode === "screenshot" 
                ? "Upload screenshot saldo dari aplikasi finansialmu." 
                : "Masukkan nominal saldo terbaru wallet Anda secara langsung."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#F3EDE8] hover:bg-[#EADFD8] p-2 text-[#7B6E67]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mb-5 flex rounded-2xl bg-[#F3EDE8] p-1 shadow-inner">
          <button
            onClick={() => setActiveMode("screenshot")}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all active:scale-[0.98] ${
              activeMode === "screenshot" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            Upload Screenshot
          </button>
          <button
            onClick={() => setActiveMode("manual")}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all active:scale-[0.98] ${
              activeMode === "manual" ? "bg-white text-[#1A2B38] shadow-sm" : "text-[#7B6E67] hover:text-[#1A2B38]"
            }`}
          >
            Input Manual
          </button>
        </div>

        {/* Wallet selector */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Wallet yang akan di-update</label>
          <select
            className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm font-semibold text-[#1A2B38] outline-none"
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name} — {formatCurrency(w.estimated_balance)}</option>
            ))}
          </select>
        </div>

        {activeMode === "manual" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Saldo Baru Wallet (Rp)</label>
              <input
                type="number"
                placeholder="Masukkan nominal saldo terbaru"
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3.5 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                value={editedBalance}
                onChange={(e) => setEditedBalance(e.target.value)}
              />
              <p className="mt-1.5 text-[10px] text-[#7B6E67]">
                Saldo wallet akan diperbarui ke nominal ini secara instan. Selisih saldo akan otomatis dihitung dan disesuaikan.
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-5 w-full rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] py-3.5 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              {isSaving ? (
                "Menyimpan..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Saldo Terkoreksi
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            {!imageUrl ? (
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#29B9AA]/40 bg-[#EBF7F6]/50 px-6 py-12 text-center"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-[#29B9AA]" />
                <p className="text-sm font-semibold text-[#1A2B38]">Drop screenshot di sini atau klik untuk pilih</p>
                <p className="text-xs text-[#7B6E67]">JPG, PNG, WebP — screenshot langsung dari aplikasi</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={imageUrl} alt="screenshot" className="max-h-48 w-full object-contain bg-[#F3EDE8]" />
                  <button
                    onClick={() => { setImageUrl(null); setImageFile(null); setOcrResult(null); }}
                    className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5"
                  >
                    <X className="h-3 w-3 text-[#7B6E67]" />
                  </button>
                </div>

                {isProcessing && (
                  <OcrProgress progress={progress} status={progressStatus} />
                )}

                {ocrResult && !isProcessing && (
                  <div className="rounded-2xl bg-[#EBF7F6] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7B6E67]">Hasil OCR</p>
                    <div className="mt-3 space-y-3">
                      {ocrResult.walletCandidate && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#7B6E67]">Wallet terdeteksi</p>
                          <p className="text-sm font-semibold text-[#1A2B38]">{ocrResult.walletCandidate}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#7B6E67]">Saldo yang ditemukan</p>
                        <p className="text-sm font-semibold text-[#1A2B38]">
                          {ocrResult.balanceCandidate ? formatCurrency(ocrResult.balanceCandidate) : "Tidak terdeteksi"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#7B6E67]">Confidence</p>
                        <p className="text-sm font-semibold text-[#29B9AA]">{Math.round(ocrResult.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {ocrResult && !isProcessing && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Konfirmasi nominal saldo (Rp)</label>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                      value={editedBalance}
                      onChange={(e) => setEditedBalance(e.target.value)}
                    />
                    <p className="mt-1.5 text-[10px] text-[#7B6E67]">
                      Review dulu sebelum simpan. Selisih akan dicatat sebagai untracked gap.
                    </p>
                  </div>
                )}
              </div>
            )}

            {ocrResult && !isProcessing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-5 w-full rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan sebagai saldo terkonfirmasi
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Receipt Scan Modal ────────────────────────────────────────

export function ReceiptScanModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedMerchant, setEditedMerchant] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getWallets().then((ws) => {
      setWallets(ws);
      if (ws.length > 0) setSelectedWalletId(ws[0].id);
    }).catch(() => {});

    // Prevent default drag/drop behaviors globally to avoid browser navigation
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setImageUrl(URL.createObjectURL(file));
    setOcrResult(null);
    setProgress(0);
    setIsProcessing(true);

    try {
      const result = await parseReceiptImage(file, (p, s) => {
        setProgress(p);
        setProgressStatus(s);
      });
      setOcrResult(result);
      setEditedAmount(result.totalAmount?.toString() || "");
      setEditedMerchant(result.merchant || "");
    } catch (e: any) {
      const errMsg = e?.message || e?.toString() || "Koneksi terputus atau file lokal Tesseract belum lengkap.";
      toast.error("Gagal membaca struk: " + errMsg);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleSave = async () => {
    const amount = parseRawCurrencyInput(editedAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Nominal tidak valid.");

    setIsSaving(true);
    try {
      await addWalletTransaction({
        wallet_id: selectedWalletId || undefined,
        amount,
        direction: "out",
        type: "expense",
        merchant: editedMerchant || ocrResult?.merchant,
        source: "receipt",
        raw_text: ocrResult?.rawText,
        occurred_at: (() => {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
          const dateStr = ocrResult?.transactionDate || toLocalDateString(now.toISOString());
          return new Date(`${dateStr}T${timeStr}`).toISOString();
        })(),
      });
      toast.success("Transaksi dari struk berhasil disimpan.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-t-[32px] bg-white p-6 shadow-xl sm:rounded-[32px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B58] mb-0.5">
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">Receipt OCR Scan</span>
            </div>
            <h2 className="text-xl font-bold text-[#1A2B38]">Scan Struk</h2>
            <p className="mt-1 text-xs text-[#7B6E67]">Foto struk → otomatis jadi transaksi.</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#F3EDE8] hover:bg-[#EADFD8] p-2 text-[#7B6E67]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wallet selector */}
        {wallets.length > 0 && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Bayar dari wallet</label>
            <select
              className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm font-semibold text-[#1A2B38] outline-none"
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {!imageUrl ? (
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#FF6B58]/40 bg-[#FEF9F4] px-6 py-12 text-center"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-8 w-8 text-[#FF6B58]" />
            <p className="text-sm font-semibold text-[#1A2B38]">Foto struk atau pilih dari galeri</p>
            <p className="text-xs text-[#7B6E67]">App akan mengekstrak total, merchant, dan tanggal.</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl">
              <img src={imageUrl} alt="receipt" className="max-h-48 w-full object-contain bg-[#F3EDE8]" />
              <button
                onClick={() => { setImageUrl(null); setOcrResult(null); }}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5"
              >
                <X className="h-3 w-3 text-[#7B6E67]" />
              </button>
            </div>

            {isProcessing && <OcrProgress progress={progress} status={progressStatus} />}

            {ocrResult && !isProcessing && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-[#FEF9F4] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#7B6E67]">Hasil Scan</p>
                  {ocrResult.paymentMethod && (
                    <p className="mt-2 text-xs text-[#7B6E67]">Metode: <span className="font-semibold text-[#1A2B38]">{ocrResult.paymentMethod}</span></p>
                  )}
                  {ocrResult.transactionDate && (
                    <p className="text-xs text-[#7B6E67]">Tanggal: <span className="font-semibold text-[#1A2B38]">{ocrResult.transactionDate}</span></p>
                  )}
                  <p className="text-xs text-[#7B6E67]">Confidence: <span className="font-semibold text-[#29B9AA]">{Math.round(ocrResult.confidence * 100)}%</span></p>
                  {ocrResult.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[#7B6E67]">Item ({ocrResult.items.length}):</p>
                      <div className="mt-1 space-y-1">
                        {ocrResult.items.slice(0, 4).map((item, i) => (
                          <p key={i} className="text-xs text-[#1A2B38]">{item.name}{item.price ? ` — ${formatCurrency(item.price)}` : ""}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Merchant</label>
                  <input
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-sm text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                    value={editedMerchant}
                    onChange={(e) => setEditedMerchant(e.target.value)}
                    placeholder="Nama merchant"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">Total (Rp)</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-2.5 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {ocrResult && !isProcessing && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-5 w-full rounded-2xl bg-[#FF6B58] hover:bg-[#E8503F] py-3 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              "Menyimpan..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Simpan transaksi
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
