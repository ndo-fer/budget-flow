import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import supabase from "../lib/supabase";
import { useAuth } from "./AuthContext";

const ONBOARDING_COMPLETED_KEY = "has_completed_onboarding";
const CHECKLIST_HIDDEN_KEY = "hide_onboarding_checklist";
const localKey = (userId: string, key: string) => `budget-flow:${userId}:${key}`;

type OnboardingContextValue = {
  isLoading: boolean;
  isSaving: boolean;
  isVisible: boolean;
  isChecklistHidden: boolean;
  error: string;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  hideChecklist: () => Promise<void>;
  showChecklist: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const getUserMetadata = (user: any) => user?.user_metadata || {};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isChecklistHidden, setIsChecklistHidden] = useState(false);
  const [error, setError] = useState("");

  const readLocalFlag = (key: string) => {
    if (!user?.id || typeof window === "undefined") return false;
    return window.localStorage.getItem(localKey(user.id, key)) === "true";
  };

  const writeLocalFlags = (updates: Record<string, boolean>) => {
    if (!user?.id || typeof window === "undefined") return;
    Object.entries(updates).forEach(([key, value]) => {
      window.localStorage.setItem(localKey(user.id, key), String(value));
    });
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsVisible(false);
      setIsChecklistHidden(false);
      setError("");
      setIsLoading(false);
      return;
    }

    const metadata = getUserMetadata(user);
    const hasCompletedOnboarding = Boolean(metadata[ONBOARDING_COMPLETED_KEY]) || readLocalFlag(ONBOARDING_COMPLETED_KEY);
    const checklistHidden = Boolean(metadata[CHECKLIST_HIDDEN_KEY]) || readLocalFlag(CHECKLIST_HIDDEN_KEY);

    setIsVisible(!hasCompletedOnboarding);
    setIsChecklistHidden(checklistHidden);
    setError("");
    setIsLoading(false);
  }, [authLoading, user]);

  const persistMetadata = async (updates: Record<string, boolean>) => {
    if (!user) throw new Error("User session not found");

    try {
      const nextMetadata = { ...getUserMetadata(user), ...updates };
      const { data, error: updateError } = await Promise.race([
        supabase.auth.updateUser({ data: nextMetadata }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Timeout saving onboarding settings.")), 8000);
        }),
      ]);
      if (updateError) throw updateError;
      return data?.user;
    } catch (err: any) {
      setError(err.message || "Failed to update onboarding settings.");
      throw err;
    }
  };

  const updateMetadata = async (updates: Record<string, boolean>) => {
    writeLocalFlags(updates);
    setError("");
    setIsSaving(true);
    persistMetadata(updates)
      .catch(() => {
        // Keep UI responsive; local fallback already applied.
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const completeOnboarding = async () => {
    setIsVisible(false);
    writeLocalFlags({ [ONBOARDING_COMPLETED_KEY]: true });
    setIsSaving(true);
    persistMetadata({ [ONBOARDING_COMPLETED_KEY]: true })
      .catch(() => {
        // Keep UI responsive; local fallback already applied.
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const openOnboarding = () => {
    setError("");
    setIsVisible(true);
  };

  const closeOnboarding = () => {
    setError("");
    setIsVisible(false);
  };

  const hideChecklist = async () => {
    setIsChecklistHidden(true);
    await updateMetadata({ [CHECKLIST_HIDDEN_KEY]: true });
  };

  const showChecklist = async () => {
    setIsChecklistHidden(false);
    await updateMetadata({ [CHECKLIST_HIDDEN_KEY]: false });
  };

  return (
    <OnboardingContext.Provider
      value={{
        isLoading,
        isSaving,
        isVisible,
        isChecklistHidden,
        error,
        hasCompletedOnboarding:
          Boolean(getUserMetadata(user)[ONBOARDING_COMPLETED_KEY]) || readLocalFlag(ONBOARDING_COMPLETED_KEY),
        completeOnboarding,
        openOnboarding,
        closeOnboarding,
        hideChecklist,
        showChecklist,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
};
