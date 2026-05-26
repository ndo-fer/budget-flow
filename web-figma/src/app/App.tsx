import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { OnboardingProvider, useOnboarding } from "../contexts/OnboardingContext";
import AuthScreen from "../features/auth/AuthScreen";
import OnboardingOverlay from "../features/onboarding/OnboardingOverlay";
import AppShell from "../layouts/AppShell";
import DesignPreviewScreen from "../features/design-preview/DesignPreviewScreen";
import VersionSwitcher from "../components/VersionSwitcher";
import { initNativeUI } from "../services/capacitorService";
import { registerServiceWorker, scheduleHourlyCheck, tryRegisterPeriodicSync } from "../services/notificationService";

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
    const stop = scheduleHourlyCheck();
    return stop;
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEF9F4]">
        <div className="rounded-[28px] border border-black/10 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Budget Flow</p>
          <p className="mt-2 text-sm font-semibold text-[#1A2B38]">Loading your workspace...</p>
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
          </>
        )
      }
      <VersionSwitcher />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootNavigator />
        <Toaster richColors position="top-right" />
      </OnboardingProvider>
    </AuthProvider>
  );
}
