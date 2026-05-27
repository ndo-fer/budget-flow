import React, { useEffect, useState } from "react";
import { X, Sparkles, LucideIcon } from "lucide-react";
import { getUserGuidanceState, markGuideSeen } from "../services/guidanceService";
import { useSpotlightTour } from "./onboarding/SpotlightTourProvider";

interface FirstRunGuideProps {
  guideKey: "home" | "wallet" | "plan" | "history" | "income" | "recurring";
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function FirstRunGuide({
  guideKey,
  title,
  description,
  icon: Icon = Sparkles
}: FirstRunGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isActive: isTourActive } = useSpotlightTour();

  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const state = await getUserGuidanceState();
        let seen = false;
        
        if (guideKey === "home") seen = state.has_seen_home_guide;
        else if (guideKey === "wallet") seen = state.has_seen_wallet_guide;
        else if (guideKey === "plan") seen = state.has_seen_plan_guide;
        else if (guideKey === "history") seen = state.has_seen_history_guide;
        else if (guideKey === "income") seen = state.has_seen_income_guide;
        else if (guideKey === "recurring") seen = state.has_seen_recurring_guide;
        
        setIsVisible(!seen);
      } catch (err) {
        console.warn("Failed to check guide state, defaulting to invisible:", err);
      } finally {
        setLoading(false);
      }
    };
    checkVisibility();
  }, [guideKey]);

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      await markGuideSeen(guideKey);
      // Dispatch custom event to let other screens know
      window.dispatchEvent(new CustomEvent("bf-guidance-updated"));
    } catch (err) {
      console.error("Failed to dismiss guide:", err);
    }
  };

  if (loading || !isVisible || isTourActive) return null;

  return (
    <div className="relative rounded-2xl border border-[#29B9AA]/10 bg-[#EBF7F6]/50 p-4 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-[#29B9AA]/15 text-[#29B9AA] shadow-sm">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <p className="text-xs text-[#7B6E67] leading-normal font-semibold">
            <span className="font-bold text-[#1A2B38] mr-1">{title}</span>
            — {description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            onClick={handleDismiss}
            className="rounded-lg bg-[#29B9AA] hover:bg-[#229A8E] active:scale-[0.98] px-3 py-1.5 text-[10px] font-bold text-white transition-all shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
