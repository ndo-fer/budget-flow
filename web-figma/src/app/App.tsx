import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { OnboardingProvider, useOnboarding } from "../contexts/OnboardingContext";
import AuthScreen from "../features/auth/AuthScreen";
import OnboardingOverlay from "../features/onboarding/OnboardingOverlay";
import AppShell from "../layouts/AppShell";
import DesignPreviewScreen from "../features/design-preview/DesignPreviewScreen";
import { initNativeUI } from "../services/capacitorService";
import { registerServiceWorker, scheduleHourlyCheck, tryRegisterPeriodicSync, requestNotificationPermission } from "../services/notificationService";
import { toast, navigateTo } from "../utils/toast";

import { SpotlightTourProvider } from "../components/onboarding/SpotlightTourProvider";
import SpotlightTourOverlay from "../components/onboarding/SpotlightTourOverlay";
import { LanguageProvider } from "../contexts/LanguageContext";

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { isLoading: onboardingLoading } = useOnboarding();
  const [path, setPath] = useState(() => typeof window !== "undefined" ? window.location.pathname : "/home");

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    if (!user && window.location.pathname !== "/auth") {
      window.history.replaceState({}, "", "/auth");
    }

    if (user && (window.location.pathname === "/" || window.location.pathname === "/auth")) {
      window.history.replaceState({}, "", "/home");
    }
  }, [user, isLoading]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (!user) return;
    initNativeUI();
    registerServiceWorker().then(() => tryRegisterPeriodicSync());
    // Request permission first, then start the hourly scheduler.
    // On native Capacitor, this triggers the Android system permission dialog once.
    let stop: (() => void) | null = null;
    requestNotificationPermission().then(() => {
      stop = scheduleHourlyCheck();
    });

    // Evaluate Daily Gamification
    import("../services/gamificationService").then(({ evaluateDailyGamification }) => {
      // Delay slightly to prevent UI thread blocking on initial render
      setTimeout(() => {
        evaluateDailyGamification().then((result) => {
          if (result.updated) {
            const { streakIncremented, coinsEarned, freezeUsed, state } = result;
            if (streakIncremented && state.current_streak > 0) {
              toast.success(`Streak hari ini menyala! 🔥 ${state.current_streak} hari berturut-turut.`, {
                action: {
                  label: "Lihat Streak",
                  onClick: () => navigateTo("/settings"),
                }
              });
            }
            if (coinsEarned > 0) {
              toast.success(`Hebat! Kamu berhasil hemat kemarin dan dapat +${coinsEarned} Koin! 🪙`);
            }
            if (freezeUsed) {
              toast.warning(`Streak Freeze terpakai otomatis untuk menyelamatkan streak-mu! ❄️ (Sisa: ${state.streak_freezes})`);
            }
          }
        }).catch((err) => console.error("Failed to run gamification evaluation:", err));
      }, 1500);
    });

    return () => stop?.();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Budget Flow</p>
          <p className="mt-2 text-sm font-semibold text-[#1A2B38]">Memuat ruang kerja Anda...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const isPreview = path === "/design-preview";

  return (
    <>
      {isPreview
        ? <DesignPreviewScreen onBack={() => {
            window.history.pushState({}, "", "/home");
            setPath("/home");
          }} />
        : (
          <>
            <AppShell />
            {!onboardingLoading ? <OnboardingOverlay /> : null}
            <SpotlightTourOverlay />
          </>
        )
      }
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OnboardingProvider>
          <SpotlightTourProvider>
            <RootNavigator />
            <Toaster richColors position="top-right" />
          </SpotlightTourProvider>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

