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

  // Manage target element CSS highlighting
  useEffect(() => {
    if (!isActive || !targetElement) return;

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

    return () => {
      // Remove class
      const currentClass = targetElement.getAttribute("class") || "";
      targetElement.setAttribute("class", currentClass.replace(" bf-tour-highlighted", ""));

      // Restore style attributes
      (targetElement as HTMLElement).style.position = originalPosition;
      (targetElement as HTMLElement).style.zIndex = originalZIndex;
      (targetElement as HTMLElement).style.pointerEvents = originalPointerEvents;
    };
  }, [isActive, targetElement, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Fullscreen Dim Overlay */}
      <div 
        className="fixed inset-0 bg-[#1A2B38]/45 backdrop-blur-[2px] transition-opacity duration-200 pointer-events-auto"
        onClick={() => {
          // If observe-only step, clicking backdrop doesn't do anything to prevent accidental dismissal.
          // If click-target step, we remind the user they must click the target.
        }}
      />

      {/* Visual Glowing Highlight Box */}
      {targetRect && !elementNotFound && (
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
