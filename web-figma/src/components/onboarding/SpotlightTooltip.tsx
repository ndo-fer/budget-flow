import React, { useRef, useEffect, useState } from "react";
import { TourStep } from "./tourSteps";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

interface SpotlightTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  elementNotFound: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced Features Dialog — standalone component (no hooks order issues)
// ─────────────────────────────────────────────────────────────────────────────

const ADVANCED_SLIDES = [
  {
    id: "widget",
    title: "Widget Layar Utama (Android)",
    description:
      "Catat pengeluaran instan tanpa perlu membuka aplikasi. Cukup ketuk nominal pecahan uang langsung di homescreen HP Anda, kumpulkan totalnya, lalu klik OK untuk menyimpan.",
    mockupType: "widget",
  },
  {
    id: "notification",
    title: "Sinkronisasi Notifikasi Otomatis",
    description:
      "Punya notifikasi M-Banking atau SMS transaksi masuk? Budget Flow membaca push notifikasi tersebut dan mencatat pengeluaran Anda secara otomatis di latar belakang.",
    mockupType: "notification",
  },
  {
    id: "receipt",
    title: "Pindai Struk & Import CSV",
    description:
      "Malas mencatat satu per satu? Ambil foto struk belanja untuk dipindai otomatis oleh AI OCR, atau import riwayat mutasi lewat file CSV dari Dompet → Impor.",
    mockupType: "receipt",
  },
];

function WidgetMockup() {
  return (
    <div className="relative flex w-full h-full bg-white rounded-2xl border border-black/5 shadow-inner overflow-hidden">
      {/* Left: Info Panel */}
      <div className="flex flex-col justify-center gap-2 px-3 py-3 w-[38%] shrink-0 border-r border-black/5">
        <div className="flex items-center gap-1 mb-1">
          <div className="h-3 w-3 rounded-sm bg-[#29B9AA]" />
          <span className="text-[8px] font-black text-[#29B9AA]">Budget Flow</span>
        </div>
        <div>
          <p className="text-[7px] font-black uppercase tracking-wider text-[#7B6E67]">Dana Bersih</p>
          <p className="text-[11px] font-extrabold text-[#1A2B38] leading-tight">Rp 248k</p>
        </div>
        <div>
          <p className="text-[7px] font-black uppercase tracking-wider text-[#7B6E67]">Batas Hari Ini</p>
          <p className="text-[11px] font-extrabold text-[#FF6B58] leading-tight">Rp 45k</p>
        </div>
      </div>
      {/* Right: Keypad */}
      <div className="flex flex-col flex-1 p-2 gap-1.5">
        {/* Display row */}
        <div className="flex gap-1 items-center">
          <div className="flex h-5 flex-1 items-center justify-center rounded-md bg-[#EBF7F6] text-[8px] font-bold text-[#1A2B38]">
            Rp 7.000
          </div>
          <div className="flex h-5 w-7 items-center justify-center rounded-md bg-red-50 text-[8px] font-bold text-red-500">Rst</div>
          <div className="flex h-5 w-7 items-center justify-center rounded-md bg-[#29B9AA] text-[8px] font-bold text-white shadow-sm">OK</div>
        </div>
        {/* Row 1 */}
        <div className="flex gap-1 flex-1">
          {[{ l: "+1k", c: "bg-[#F5F5F0]" }, { l: "+2k", c: "bg-[#EFF5EF]" }, { l: "+5k", c: "bg-[#FDF5E8]" }].map(({ l, c }) => (
            <div key={l} className={`flex flex-1 items-center justify-center rounded-md ${c} text-[8px] font-black text-[#1A2B38]`}>{l}</div>
          ))}
        </div>
        {/* Row 2 */}
        <div className="flex gap-1 flex-1">
          {[{ l: "+10k", c: "bg-[#EDE8F5]" }, { l: "+20k", c: "bg-[#E8F5EE]" }, { l: "+50k", c: "bg-[#E8F0F8]" }].map(({ l, c }) => (
            <div key={l} className={`flex flex-1 items-center justify-center rounded-md ${c} text-[8px] font-black text-[#1A2B38]`}>{l}</div>
          ))}
        </div>
        {/* Row 3 */}
        <div className="flex gap-1 flex-1">
          <div className="flex flex-1 items-center justify-center rounded-md bg-[#FFF0EE] text-[8px] font-black text-[#1A2B38]">+100k</div>
          <div className="flex flex-1 items-center justify-center rounded-md bg-[#F5F4F0] text-[8px] font-black text-[#1A2B38]">+200k</div>
          <div className="flex flex-1 items-center justify-center rounded-md bg-[#29B9AA] text-[8px] font-black text-white">+Cust</div>
        </div>
      </div>
    </div>
  );
}

function NotificationMockup() {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full bg-gray-900 rounded-2xl p-4 border border-black/10 overflow-hidden">
      <div className="w-full rounded-xl bg-white/95 p-3.5 shadow-lg border border-white/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#29B9AA] text-white font-bold text-xs shrink-0">BF</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-900">Push Notifikasi</span>
              <span className="text-[9px] text-gray-400">Baru saja</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5 truncate font-medium">Dana keluar Rp 45.000 di e-Wallet Jago berhasil di-parsing.</p>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-[#29B9AA] px-1.5 py-0.5 rounded">Tercatat Otomatis</span>
        </div>
      </div>
    </div>
  );
}

function ReceiptMockup() {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full bg-white rounded-2xl p-4 border border-black/5 shadow-inner overflow-hidden">
      <div className="absolute inset-x-0 h-0.5 bg-[#29B9AA] opacity-60 shadow-md shadow-teal-400/60"
        style={{ animation: "scanSweep 2.2s ease-in-out infinite", top: "20%" }} />
      <style>{`@keyframes scanSweep { 0%,100% { top:20%; } 50% { top:80%; } }`}</style>
      <div className="w-full max-w-[180px] rounded-lg border border-dashed border-gray-300 bg-white p-3 font-mono text-[9px] text-[#7B6E67] shadow-sm">
        <p className="text-center font-bold text-[#1A2B38] border-b border-dashed border-gray-200 pb-1.5 mb-1.5 uppercase">Struk Belanja</p>
        <div className="space-y-1">
          <div className="flex justify-between"><span>1x Kopi Latte</span><span>Rp 28.000</span></div>
          <div className="flex justify-between"><span>1x Donut Gula</span><span>Rp 12.000</span></div>
          <div className="flex justify-between font-bold text-[#1A2B38] border-t border-dashed border-gray-200 pt-1.5 mt-1.5">
            <span>TOTAL</span><span>Rp 40.000</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdvancedFeaturesDialogProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function AdvancedFeaturesDialog({ onNext, onBack, onSkip }: AdvancedFeaturesDialogProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = ADVANCED_SLIDES[activeSlide];

  const handleSlideNext = () => {
    if (activeSlide < ADVANCED_SLIDES.length - 1) {
      setActiveSlide((s) => s + 1);
    } else {
      onNext();
    }
  };

  const handleSlideBack = () => {
    if (activeSlide > 0) {
      setActiveSlide((s) => s - 1);
    } else {
      onBack();
    }
  };

  return (
    <div
      className="fixed z-[10020] w-[90%] max-w-lg rounded-3xl border border-black/10 bg-white p-6 shadow-2xl shadow-[#1A2B38]/20"
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#29B9AA] bg-[#29B9AA]/10 px-2.5 py-1 rounded-md">
          Edukasi Otomatisasi
        </span>
        <button
          onClick={onSkip}
          className="rounded-full p-1.5 text-[#7B6E67] hover:bg-[#FEF9F4] hover:text-[#1A2B38] transition-colors"
          title="Selesai"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 border-b border-black/5 pb-3">
        {ADVANCED_SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveSlide(idx)}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all ${
              idx === activeSlide
                ? "bg-[#29B9AA] text-white shadow-sm"
                : "text-[#7B6E67] hover:bg-[#FEF9F4] hover:text-[#1A2B38]"
            }`}
          >
            {idx === 0 ? "Widget HP" : idx === 1 ? "Auto-Notif" : "Pindai Struk"}
          </button>
        ))}
      </div>

      {/* Mockup Area */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-black/5 bg-[#FEF9F4]/40 mb-5">
        {slide.mockupType === "widget" && <WidgetMockup />}
        {slide.mockupType === "notification" && <NotificationMockup />}
        {slide.mockupType === "receipt" && <ReceiptMockup />}
      </div>

      {/* Description */}
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-[#1A2B38]">{slide.title}</h3>
        <p className="mt-2 text-xs text-[#7B6E67] leading-relaxed">{slide.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-black/5 pt-4">
        <div className="flex gap-1.5">
          {ADVANCED_SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeSlide ? "w-6 bg-[#29B9AA]" : "w-2 bg-black/10"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSlideBack}
            className="flex items-center gap-1 rounded-xl hover:bg-[#FEF9F4] px-3.5 py-2 text-xs font-bold text-[#7B6E67] transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            onClick={handleSlideNext}
            className="flex items-center gap-1.5 rounded-xl bg-[#29B9AA] px-4 py-2 text-xs font-bold text-white hover:bg-[#229A8E] active:scale-[0.98] transition-all shadow-md shadow-teal-500/10"
          >
            <span>{activeSlide === ADVANCED_SLIDES.length - 1 ? "Selesai" : "Lanjut"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SpotlightTooltip — hooks always called in the same order
// ─────────────────────────────────────────────────────────────────────────────

export default function SpotlightTooltip({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  elementNotFound,
  onNext,
  onBack,
  onSkip,
}: SpotlightTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "bottom" });

  // Always run position calc hook — no early returns before this
  useEffect(() => {
    // Skip positioning for the advanced-features dialog (it's centered via CSS)
    if (step.id === "advanced-features") return;

    const calculatePosition = () => {
      if (elementNotFound || !targetRect) {
        setCoords({
          top: window.innerHeight / 2 - 100,
          left: Math.max(16, window.innerWidth / 2 - 150),
          placement: "center",
        });
        return;
      }

      const tooltipWidth = 300;
      const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 160;
      const gap = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let placement = step.placement || "bottom";
      let top = 0;
      let left = 0;

      if (placement === "bottom") {
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        if (top + tooltipHeight > viewportHeight) placement = "top";
      }
      if (placement === "top") {
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        if (top < 0) { placement = "bottom"; top = targetRect.bottom + gap; }
      }
      if (placement === "left") {
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        if (left < 0) placement = "right";
      }
      if (placement === "right") {
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        if (left + tooltipWidth > viewportWidth) {
          placement = "bottom";
          top = targetRect.bottom + gap;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        }
      }

      // Recalculate final coords
      if (placement === "bottom") {
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      } else if (placement === "top") {
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      } else if (placement === "left") {
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
      } else if (placement === "right") {
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
      }

      left = Math.max(12, Math.min(left, viewportWidth - tooltipWidth - 12));
      top = Math.max(12, Math.min(top, viewportHeight - tooltipHeight - 12));

      setCoords({ top, left, placement });
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);
    const observer = new MutationObserver(calculatePosition);
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = setTimeout(calculatePosition, 50);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [targetRect, elementNotFound, step, tooltipRef.current?.offsetHeight]);

  // ── Render the advanced-features dialog (separate component, own hooks) ──
  if (step.id === "advanced-features") {
    return <AdvancedFeaturesDialog onNext={onNext} onBack={onBack} onSkip={onSkip} />;
  }

  // ── Regular spotlight tooltip ──
  const showNextCta = step.action === "observe-only";

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10020] w-[300px] rounded-2xl border border-black/5 bg-white/95 p-5 shadow-2xl shadow-[#1A2B38]/15 backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-95"
      style={{ top: coords.top, left: coords.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#29B9AA] bg-[#29B9AA]/10 px-2 py-0.5 rounded-md">
          {stepIndex + 1} dari {totalSteps}
        </span>
        {step.allowSkip && (
          <button
            onClick={onSkip}
            className="rounded-full p-1 text-[#7B6E67] hover:bg-[#FEF9F4] hover:text-[#1A2B38] transition-colors"
            title="Lewati panduan"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="mt-3">
        <h3 className="text-sm font-bold text-[#1A2B38]">{step.title}</h3>
        <p className="mt-1.5 text-xs text-[#7B6E67] leading-relaxed">{step.body}</p>
      </div>

      {/* Action prompt for click steps */}
      {!showNextCta && (
        <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF9F43] bg-[#FFF9F3] px-2.5 py-1.5 rounded-lg border border-[#FF9F43]/10">
          <HelpCircle className="w-3.5 h-3.5 text-[#FF9F43] shrink-0" />
          <span>Lakukan aksi di atas untuk lanjut</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <div>
          {step.allowBack && stepIndex > 0 ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 rounded-xl hover:bg-[#FEF9F4] px-2.5 py-1.5 text-xs font-bold text-[#7B6E67] transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Kembali
            </button>
          ) : (
            <div />
          )}
        </div>
        <div className="flex gap-2">
          {showNextCta ? (
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-xl bg-[#29B9AA] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#229A8E] active:scale-[0.98] transition-all shadow-sm"
            >
              <span>{step.primaryCta || "Lanjut"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : step.allowSkip ? (
            <button
              onClick={onSkip}
              className="rounded-xl border border-black/5 hover:bg-[#FEF9F4] px-3 py-1.5 text-xs font-bold text-[#7B6E67] transition-all"
            >
              Lewati
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
