import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  actionIcon: ActionIcon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-[32px] border border-dashed border-black/10 bg-[#FEF9F4]/40 hover:bg-[#FEF9F4] transition-all duration-300">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF9F4] border border-black/5 text-[#29B9AA] mb-4 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-[#1A2B38] mb-1.5">{title}</h3>
      <p className="max-w-md text-xs text-[#7B6E67] font-medium leading-relaxed mb-6">{description}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#29B9AA] hover:bg-[#229A8E] active:scale-[0.98] px-5 py-3 text-xs font-bold text-white transition-all shadow-md shadow-teal-500/10"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionText}
        </button>
      )}
    </div>
  );
}
