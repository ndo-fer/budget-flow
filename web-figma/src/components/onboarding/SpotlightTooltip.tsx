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

  useEffect(() => {
    const calculatePosition = () => {
      if (elementNotFound || !targetRect) {
        // Center of the screen
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

      // Primary placement calculation
      if (placement === "bottom") {
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

        // Overflow checks
        if (top + tooltipHeight > viewportHeight) {
          placement = "top";
        }
      }

      if (placement === "top") {
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

        if (top < 0) {
          placement = "bottom";
          top = targetRect.bottom + gap;
        }
      }

      if (placement === "left") {
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;

        if (left < 0) {
          placement = "right";
        }
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

      // Re-run placement coordinates if changed
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

      // Boundary clamp for Horizontal alignment
      left = Math.max(12, Math.min(left, viewportWidth - tooltipWidth - 12));
      
      // Boundary clamp for Vertical alignment
      top = Math.max(12, Math.min(top, viewportHeight - tooltipHeight - 12));

      setCoords({ top, left, placement });
    };

    calculatePosition();

    // Re-calculate on window events
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);
    
    // MutationObserver to capture layout changes
    const observer = new MutationObserver(calculatePosition);
    observer.observe(document.body, { childList: true, subtree: true });

    // Measure again after a small render timeout
    const timeout = setTimeout(calculatePosition, 50);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [targetRect, elementNotFound, step, tooltipRef.current?.offsetHeight]);

  const showNextCta = step.action === "observe-only";

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10020] w-[300px] rounded-2xl border border-black/5 bg-white/95 p-5 shadow-2xl shadow-[#1A2B38]/15 backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-95"
      style={{
        top: coords.top,
        left: coords.left,
      }}
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

      {/* Action Prompt for click steps */}
      {!showNextCta && (
        <div className="mt-3.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF9F43] bg-[#FFF9F3] px-2.5 py-1.5 rounded-lg border border-[#FF9F43]/10">
          <HelpCircle className="w-3.5 h-3.5 text-[#FF9F43] shrink-0" />
          <span>Lakukan aksi di atas untuk lanjut</span>
        </div>
      )}

      {/* Footer Navigation */}
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
