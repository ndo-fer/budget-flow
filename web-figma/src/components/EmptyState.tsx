import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  variant?: "hero" | "inline";
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  actionIcon: ActionIcon,
  variant = "hero"
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF9F4] text-[#29B9AA] mb-2.5">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-[#1A2B38] mb-1">{title}</h4>
        <p className="max-w-sm text-[10.5px] text-[#7B6E67] font-semibold leading-relaxed mb-3">{description}</p>
        
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#29B9AA]/20 bg-[#FEF9F4] hover:bg-[#EBF7F6] hover:border-[#29B9AA]/50 active:scale-[0.98] px-3 py-1.5 text-[10px] font-bold text-[#29B9AA] transition-all"
          >
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
            <span>{actionText}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-black/10 bg-[#FEF9F4]/40 hover:bg-[#FEF9F4] transition-all duration-300">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF9F4] border border-black/5 text-[#29B9AA] mb-3 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-[#1A2B38] mb-1">{title}</h3>
      <p className="max-w-md text-xs text-[#7B6E67] font-medium leading-relaxed mb-4">{description}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#29B9AA] hover:bg-[#229A8E] active:scale-[0.98] px-4.5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-teal-500/10"
        >
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
