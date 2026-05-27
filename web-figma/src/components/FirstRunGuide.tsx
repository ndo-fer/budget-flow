import React, { useEffect, useState } from "react";
import { X, Sparkles, LucideIcon } from "lucide-react";
import { getUserGuidanceState, markGuideSeen } from "../services/guidanceService";

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

  if (loading || !isVisible) return null;

  return (
    <div className="relative rounded-[32px] border border-[#29B9AA]/20 bg-gradient-to-br from-[#FEF9F4] to-[#EBF7F6] p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background accents */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#29B9AA]/5 blur-xl"></div>
      
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#29B9AA]/15 text-[#29B9AA] shadow-sm">
          <Icon className="h-5.5 w-5.5" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-sm font-bold text-[#1A2B38]">{title}</h3>
            <button
              onClick={handleDismiss}
              className="rounded-full p-1 text-[#7B6E67] hover:bg-black/5 hover:text-[#1A2B38] transition-colors"
              aria-label="Dismiss guide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-xs text-[#7B6E67] leading-relaxed font-medium max-w-2xl">{description}</p>
          
          <div className="pt-2">
            <button
              onClick={handleDismiss}
              className="rounded-xl bg-[#29B9AA] hover:bg-[#229A8E] active:scale-[0.98] px-4 py-2 text-[10px] font-bold text-white transition-all shadow-sm shadow-teal-500/5"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
