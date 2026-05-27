import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";

export default function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
}>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm md:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-black/5 px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#29B9AA]">Budget Flow</p>
            <h2 className="mt-1 text-xl font-bold text-[#1A2B38]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#7B6E67]">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3EDE8] text-[#7B6E67] transition-colors hover:bg-[#E8DED6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-black/5 px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}
