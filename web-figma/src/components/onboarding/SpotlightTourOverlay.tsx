import React, { useEffect } from "react";
import { useSpotlightTour } from "./SpotlightTourProvider";
import { useSpotlightTarget } from "./useSpotlightTarget";
import SpotlightTooltip from "./SpotlightTooltip";
import { TOUR_STEPS } from "./tourSteps";

export default function SpotlightTourOverlay() {
  const {
    isActive,
    currentStepIndex,
    currentStep,
    nextStep,
    previousStep,
    skipTour,
  } = useSpotlightTour();

  // Measure the active target element
  const targetId = currentStep?.targetId || null;
  const fallbackId = currentStep?.fallbackTargetId || null;
  const { rect: targetRect, element: targetElement, notFound: elementNotFound } = useSpotlightTarget(
    targetId,
    fallbackId,
    currentStepIndex // Re-measure when step changes
  );

  // Manage target element and its ancestors' CSS highlighting & z-index lifting
  useEffect(() => {
    if (!isActive || !targetElement || currentStep.id === "advanced-features") return;

    // Apply active class to the current target
    const prevClass = targetElement.getAttribute("class") || "";
    targetElement.setAttribute("class", `${prevClass} bf-tour-highlighted`);

    // Add inline relative/z-index styles to ensure stacking works
    const originalPosition = (targetElement as HTMLElement).style.position;
    const originalZIndex = (targetElement as HTMLElement).style.zIndex;
    const originalPointerEvents = (targetElement as HTMLElement).style.pointerEvents;

    (targetElement as HTMLElement).style.position = "relative";
    (targetElement as HTMLElement).style.zIndex = "10010";
    (targetElement as HTMLElement).style.pointerEvents = "auto";

    // Lift z-index of all parent containers to escape stacking contexts
    const liftedAncestors: { element: HTMLElement; originalZIndex: string; originalPosition: string }[] = [];
    let parent = targetElement.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const position = style.position;
      const zIndex = style.zIndex;

      // If the element has relative/absolute/fixed positioning or z-index, it creates a stacking context.
      // We force its z-index up to be above the overlay (9999) but below the target (10010).
      if (position !== "static" || zIndex !== "auto") {
        liftedAncestors.push({
          element: parent,
          originalZIndex: parent.style.zIndex,
          originalPosition: parent.style.position,
        });
        parent.style.zIndex = "10001";
        if (position === "static") {
          parent.style.position = "relative";
        }
      }
      parent = parent.parentElement;
    }

    return () => {
      // Remove class
      const currentClass = targetElement.getAttribute("class") || "";
      targetElement.setAttribute("class", currentClass.replace(" bf-tour-highlighted", ""));

      // Restore target style attributes
      (targetElement as HTMLElement).style.position = originalPosition;
      (targetElement as HTMLElement).style.zIndex = originalZIndex;
      (targetElement as HTMLElement).style.pointerEvents = originalPointerEvents;

      // Restore ancestors' z-index and position
      liftedAncestors.forEach(({ element, originalZIndex: origZ, originalPosition: origPos }) => {
        element.style.zIndex = origZ;
        element.style.position = origPos;
      });
    };
  }, [isActive, targetElement, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  return (
    <div className="relative select-none">
      {/* Fullscreen Dim Overlay */}
      <div 
        className={`fixed inset-0 z-[9999] backdrop-blur-[2px] transition-opacity duration-200 pointer-events-auto ${
          currentStep.id === "advanced-features"
            ? "bg-[#0D1B26]/70"
            : "bg-[#1A2B38]/45"
        }`}
        onClick={() => {}}
      />

      {/* Visual Glowing Highlight Box */}
      {targetRect && !elementNotFound && currentStep.id !== "advanced-features" && (
        <div
          className="fixed z-[10005] pointer-events-none border-2 border-[#29B9AA] rounded-2xl transition-all duration-200 shadow-[0_0_15px_rgba(41,185,170,0.35)] bg-white/5"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Tooltip Card */}
      <SpotlightTooltip
        step={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={TOUR_STEPS.length}
        targetRect={targetRect}
        elementNotFound={elementNotFound}
        onNext={nextStep}
        onBack={previousStep}
        onSkip={skipTour}
      />
    </div>
  );
}
