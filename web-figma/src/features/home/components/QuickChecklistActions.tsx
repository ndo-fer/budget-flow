import { Zap, Receipt, Smartphone, FileSpreadsheet, ChevronRight } from "lucide-react";

interface QuickChecklistActionsProps {
  onNavigateTab: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
}

export default function QuickChecklistActions({ onNavigateTab }: QuickChecklistActionsProps) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm md:col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[#FFB347] flex-shrink-0" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Quick Actions</h3>
      </div>
      <div className="space-y-2">
        <button 
          onClick={() => onNavigateTab("wallets", { search: "?action=upload-receipt" })}
          className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <span>Upload Struk Transaksi</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
        </button>
        <button 
          onClick={() => onNavigateTab("wallets", { search: "?action=screenshot-balance" })}
          className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <span>Update Saldo dari Screenshot</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
        </button>
        <button 
          onClick={() => onNavigateTab("wallets", { search: "?action=import-csv" })}
          className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-[#FEF9F4] px-4 py-3 text-xs font-bold text-[#1A2B38] hover:bg-[#F3EDE8] transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#29B9AA] flex-shrink-0" />
            <span>Import CSV Transaksi</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#7B6E67]" />
        </button>
      </div>
    </div>
  );
}
