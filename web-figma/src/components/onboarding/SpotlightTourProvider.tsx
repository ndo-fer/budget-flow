import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TourStep, TOUR_STEPS } from "./tourSteps";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboarding } from "../../contexts/OnboardingContext";
import {
  getUserGuidanceState,
  markSpotlightTourCompleted as apiMarkCompleted,
  markSpotlightTourSkipped as apiMarkSkipped,
  saveSpotlightTourStep as apiSaveStep,
  resetSpotlightTour as apiResetTour
} from "../../services/guidanceService";

interface SpotlightTourContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  resetTour: () => Promise<void>;
  isLoading: boolean;
}

const SpotlightTourContext = createContext<SpotlightTourContextType | undefined>(undefined);

// Custom hook to trace path changes in SPA
function usePathname() {
  const [pathname, setPathname] = useState(() => 
    typeof window !== "undefined" ? window.location.pathname : "/home"
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setPathname(window.location.pathname);
      window.dispatchEvent(new CustomEvent("bf-pathname-changed"));
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setPathname(window.location.pathname);
      window.dispatchEvent(new CustomEvent("bf-pathname-changed"));
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("bf-pathname-changed", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("bf-pathname-changed", handlePopState);
    };
  }, []);

  return pathname;
}

export function SpotlightTourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentStep = isActive ? TOUR_STEPS[currentStepIndex] : null;

  // Initialize state from DB / LocalStorage
  useEffect(() => {
    if (!user) {
      setIsActive(false);
      setIsLoading(false);
      return;
    }

    const initTour = async () => {
      setIsLoading(true);
      try {
        const state = await getUserGuidanceState();
        
        // Only start spotlight tour if they finished the initial sliding onboarding
        if (hasCompletedOnboarding) {
          const completed = state.has_completed_spotlight_tour ?? false;
          const skipped = state.has_skipped_spotlight_tour ?? false;

          if (!completed && !skipped) {
            const savedStep = state.spotlight_tour_step;
            const savedIndex = savedStep ? TOUR_STEPS.findIndex((s) => s.id === savedStep) : 0;
            setCurrentStepIndex(savedIndex >= 0 ? savedIndex : 0);
            setIsActive(true);
          }
        }
      } catch (err) {
        console.warn("Failed to initialize spotlight tour state:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initTour();
  }, [user, hasCompletedOnboarding]);

  // Defensive routing and auto modal dismiss
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Route correction
    if (currentStep.route && pathname !== currentStep.route) {
      window.history.pushState({}, "", currentStep.route);
      window.dispatchEvent(new CustomEvent("bf-pathname-changed"));
    }

    // Modal closing trigger when changing steps
    if (["welcome-home", "open-history", "tour-complete", "advanced-features"].includes(currentStep.id)) {
      window.dispatchEvent(new CustomEvent("bf-close-modals"));
    }
  }, [isActive, currentStepIndex]);

  // Listen to expected Route changes (e.g. user clicked nav tab)
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (currentStep.expectedRoute && pathname === currentStep.expectedRoute) {
      nextStep();
    }
  }, [pathname, isActive, currentStep]);

  // Listen to expected Custom Events
  useEffect(() => {
    if (!isActive || !currentStep || !currentStep.expectedEvent) return;

    const handleExpectedEvent = () => {
      nextStep();
    };

    window.addEventListener(currentStep.expectedEvent, handleExpectedEvent);
    return () => {
      if (currentStep.expectedEvent) {
        window.removeEventListener(currentStep.expectedEvent, handleExpectedEvent);
      }
    };
  }, [isActive, currentStepIndex]);

  const startTour = useCallback(() => {
    window.dispatchEvent(new CustomEvent("bf-close-modals"));
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      try {
        await apiSaveStep(TOUR_STEPS[nextIndex].id);
      } catch (err) {
        console.warn("Failed to save step index:", err);
      }
    } else {
      // Completed the final step
      setIsActive(false);
      try {
        await apiMarkCompleted();
      } catch (err) {
        console.warn("Failed to save completed state:", err);
      }
    }
  }, [currentStepIndex]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const skipTour = useCallback(async () => {
    const stepId = TOUR_STEPS[currentStepIndex]?.id;
    setIsActive(false);
    try {
      await apiMarkSkipped(stepId);
    } catch (err) {
      console.warn("Failed to skip spotlight tour:", err);
    }
  }, [currentStepIndex]);

  const resetTour = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiResetTour();
      setCurrentStepIndex(0);
      setIsActive(true);
    } catch (err) {
      console.warn("Failed to reset tour:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SpotlightTourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        startTour,
        nextStep,
        previousStep,
        skipTour,
        resetTour,
        isLoading,
      }}
    >
      {children}
    </SpotlightTourContext.Provider>
  );
}

export function useSpotlightTour() {
  const context = useContext(SpotlightTourContext);
  if (context === undefined) {
    throw new Error("useSpotlightTour must be used within a SpotlightTourProvider");
  }
  return context;
}
