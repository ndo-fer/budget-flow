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
import { useLanguage } from "../../contexts/LanguageContext";

// ── OCR Progress Bar ──────────────────────────────────────────

function OcrProgress({ progress, status }: { progress: number; status: string }) {
  const { lang } = useLanguage();
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-[#7B6E67]">
        <span>{status || (lang === "id" ? "Memproses..." : "Processing...")}</span>
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
  const { t, lang } = useLanguage();
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
      toast.error((lang === "id" ? "Gagal membaca screenshot: " : "Failed to read screenshot: ") + e.message);
    } finally {
      setIsProcessing(false);
    }
  }, [wallets, lang]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  const handleSave = async () => {
    const balance = parseRawCurrencyInput(editedBalance);
    if (isNaN(balance) || balance < 0) return toast.error(lang === "id" ? "Nominal tidak valid." : "Invalid balance amount.");
    if (!selectedWalletId) return toast.error(lang === "id" ? "Pilih wallet terlebih dahulu." : "Please select a wallet first.");

    setIsSaving(true);
    try {
      const description = activeMode === "manual" 
        ? (lang === "id" ? "Koreksi saldo manual" : "Manual balance correction") 
        : (lang === "id" ? "Update dari screenshot" : "Update from screenshot");
      const source = activeMode === "manual" ? "manual" : "screenshot";
      await adjustWalletBalance(selectedWalletId, balance, description, source);
      toast.success(
        activeMode === "manual" 
          ? (lang === "id" ? "Saldo berhasil dikoreksi." : "Balance corrected successfully.") 
          : (lang === "id" ? "Saldo berhasil diperbarui dari screenshot." : "Balance updated successfully from screenshot.")
      );
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || (lang === "id" ? "Gagal menyimpan." : "Failed to save."));
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
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#29B9AA] mb-0.5">
              {activeMode === "screenshot" ? (
                <>
                  <Upload className="w-4 h-4 animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">
                    {lang === "id" ? "Sinkronisasi Otomatis" : "Automated Sync"}
                  </span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">
                    {lang === "id" ? "Koreksi Manual" : "Manual Correction"}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#1A2B38]">
              {activeMode === "screenshot" 
                ? (lang === "id" ? "Update dari Screenshot" : "Update from Screenshot") 
                : (lang === "id" ? "Koreksi Saldo Manual" : "Manual Balance Correction")}
            </h2>
            <p className="mt-1 text-xs text-[#7B6E67]">
              {activeMode === "screenshot" 
                ? (lang === "id" ? "Upload screenshot saldo dari aplikasi finansialmu." : "Upload a balance screenshot from your financial app.") 
                : (lang === "id" ? "Masukkan nominal saldo terbaru wallet Anda secara langsung." : "Enter the latest wallet balance directly.")}
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
            {lang === "id" ? "Input Manual" : "Manual Input"}
          </button>
        </div>

        {/* Wallet selector */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">
            {lang === "id" ? "Wallet yang akan di-update" : "Wallet to update"}
          </label>
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
              <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">
                {lang === "id" ? "Saldo Baru Wallet (Rp)" : "New Wallet Balance (Rp)"}
              </label>
              <input
                type="number"
                placeholder={lang === "id" ? "Masukkan nominal saldo terbaru" : "Enter the latest balance amount"}
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3.5 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                value={editedBalance}
                onChange={(e) => setEditedBalance(e.target.value)}
              />
              <p className="mt-1.5 text-[10px] text-[#7B6E67]">
                {lang === "id" 
                  ? "Saldo wallet akan diperbarui ke nominal ini secara instan. Selisih saldo akan otomatis dihitung dan disesuaikan." 
                  : "The wallet balance will be updated instantly. The difference will be automatically adjusted."}
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-5 w-full rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] py-3.5 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              {isSaving ? (
                (lang === "id" ? "Menyimpan..." : "Saving...")
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {lang === "id" ? "Simpan Saldo Terkoreksi" : "Save Corrected Balance"}
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
                <p className="text-sm font-semibold text-[#1A2B38]">
                  {lang === "id" ? "Drop screenshot di sini atau klik untuk pilih" : "Drop screenshot here or click to upload"}
                </p>
                <p className="text-xs text-[#7B6E67]">
                  {lang === "id" ? "JPG, PNG, WebP — screenshot langsung dari aplikasi" : "JPG, PNG, WebP — screenshot directly from your app"}
                </p>
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
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7B6E67]">
                      {lang === "id" ? "Hasil OCR" : "OCR Result"}
                    </p>
                    <div className="mt-3 space-y-3">
                      {ocrResult.walletCandidate && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#7B6E67]">{lang === "id" ? "Wallet terdeteksi" : "Wallet detected"}</p>
                          <p className="text-sm font-semibold text-[#1A2B38]">{ocrResult.walletCandidate}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#7B6E67]">{lang === "id" ? "Saldo yang ditemukan" : "Found balance"}</p>
                        <p className="text-sm font-semibold text-[#1A2B38]">
                          {ocrResult.balanceCandidate ? formatCurrency(ocrResult.balanceCandidate) : (lang === "id" ? "Tidak terdeteksi" : "Not detected")}
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
                    <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">
                      {lang === "id" ? "Konfirmasi nominal saldo (Rp)" : "Confirm balance amount (Rp)"}
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                      value={editedBalance}
                      onChange={(e) => setEditedBalance(e.target.value)}
                    />
                    <p className="mt-1.5 text-[10px] text-[#7B6E67]">
                      {lang === "id" 
                        ? "Review dulu sebelum simpan. Selisih akan dicatat sebagai untracked gap." 
                        : "Review before saving. Difference will be logged as an untracked gap."}
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
                  (lang === "id" ? "Menyimpan..." : "Saving...")
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {lang === "id" ? "Simpan sebagai saldo terkonfirmasi" : "Save as confirmed balance"}
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
  const { t, lang } = useLanguage();
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
      const errMsg = e?.message || e?.toString() || (lang === "id" ? "Koneksi terputus atau file lokal Tesseract belum lengkap." : "Connection lost or local Tesseract files are incomplete.");
      toast.error((lang === "id" ? "Gagal membaca struk: " : "Failed to read receipt: ") + errMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [lang]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleSave = async () => {
    const amount = parseRawCurrencyInput(editedAmount);
    if (isNaN(amount) || amount <= 0) return toast.error(lang === "id" ? "Nominal tidak valid." : "Invalid amount.");

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
      toast.success(lang === "id" ? "Transaksi dari struk berhasil disimpan." : "Transaction from receipt saved successfully.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || (lang === "id" ? "Gagal menyimpan." : "Failed to save."));
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
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B58] mb-0.5">
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] leading-none">Receipt OCR Scan</span>
            </div>
            <h2 className="text-xl font-bold text-[#1A2B38]">
              {lang === "id" ? "Scan Struk" : "Scan Receipt"}
            </h2>
            <p className="mt-1 text-xs text-[#7B6E67]">
              {lang === "id" ? "Foto struk → otomatis jadi transaksi." : "Snap a receipt photo → automatically recorded."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#F3EDE8] hover:bg-[#EADFD8] p-2 text-[#7B6E67]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wallet selector */}
        {wallets.length > 0 && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#7B6E67]">
              {lang === "id" ? "Bayar dari wallet" : "Pay from wallet"}
            </label>
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
            <p className="text-sm font-semibold text-[#1A2B38]">
              {lang === "id" ? "Foto struk atau pilih dari galeri" : "Take a receipt photo or choose from gallery"}
            </p>
            <p className="text-xs text-[#7B6E67]">
              {lang === "id" ? "App akan mengekstrak total, merchant, dan tanggal." : "The app will extract the total amount, merchant, and date."}
            </p>
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
                  <p className="text-xs font-bold uppercase tracking-widest text-[#7B6E67]">
                    {lang === "id" ? "Hasil Scan" : "Scan Result"}
                  </p>
                  {ocrResult.paymentMethod && (
                    <p className="mt-2 text-xs text-[#7B6E67]">
                      {lang === "id" ? "Metode: " : "Method: "}
                      <span className="font-semibold text-[#1A2B38]">{ocrResult.paymentMethod}</span>
                    </p>
                  )}
                  {ocrResult.transactionDate && (
                    <p className="text-xs text-[#7B6E67]">
                      {lang === "id" ? "Tanggal: " : "Date: "}
                      <span className="font-semibold text-[#1A2B38]">{ocrResult.transactionDate}</span>
                    </p>
                  )}
                  <p className="text-xs text-[#7B6E67]">Confidence: <span className="font-semibold text-[#29B9AA]">{Math.round(ocrResult.confidence * 100)}%</span></p>
                  {ocrResult.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[#7B6E67]">
                        {lang === "id" ? `Item (${ocrResult.items.length}):` : `Items (${ocrResult.items.length}):`}
                      </p>
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
                    placeholder={lang === "id" ? "Nama merchant" : "Merchant name"}
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
              (lang === "id" ? "Menyimpan..." : "Saving...")
            ) : (
              <>
                <Check className="w-4 h-4" />
                {lang === "id" ? "Simpan transaksi" : "Save transaction"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
