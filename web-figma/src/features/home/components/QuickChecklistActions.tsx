import { Zap, Receipt, Smartphone, FileSpreadsheet, ChevronRight } from "lucide-react";

interface QuickChecklistActionsProps {
  onNavigateTab: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
}

export default function QuickChecklistActions({ onNavigateTab }: QuickChecklistActionsProps) {
  const actions = [
    {
      id: "struk",
      title: "Upload Struk Transaksi",
      description: "Catat pengeluaran lewat foto/scan struk belanjaan",
      icon: Receipt,
      colorClass: "text-[#29B9AA] bg-[#29B9AA]/10 border-[#29B9AA]/20",
      hoverBorder: "hover:border-[#29B9AA]/30 hover:bg-[#29B9AA]/5",
      action: () => onNavigateTab("wallets", { search: "?action=upload-receipt" })
    },
    {
      id: "screenshot",
      title: "Update Saldo Screenshot",
      description: "Koreksi nominal saldo e-wallet via gambar layar",
      icon: Smartphone,
      colorClass: "text-[#FFB347] bg-[#FFB347]/10 border-[#FFB347]/20",
      hoverBorder: "hover:border-[#FFB347]/30 hover:bg-[#FFB347]/5",
      action: () => onNavigateTab("wallets", { search: "?action=screenshot-balance" })
    },
    {
      id: "csv",
      title: "Import CSV Transaksi",
      description: "Unggah berkas riwayat transaksi bank sekaligus",
      icon: FileSpreadsheet,
      colorClass: "text-[#5BAEE8] bg-[#5BAEE8]/10 border-[#5BAEE8]/20",
      hoverBorder: "hover:border-[#5BAEE8]/30 hover:bg-[#5BAEE8]/5",
      action: () => onNavigateTab("wallets", { search: "?action=import-csv" })
    }
  ];

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:col-span-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-[#FFB347]/10 text-[#FFB347]">
              <Zap className="w-4 h-4 fill-[#FFB347]" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A2B38]">Aksi Cepat</h3>
              <p className="text-[10px] text-[#7B6E67] font-semibold mt-0.5">Aksi cepat kelola catatan</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {actions.map((act) => {
            const IconComponent = act.icon;
            return (
              <button 
                key={act.id}
                onClick={act.action}
                className={`group flex w-full items-center gap-3.5 rounded-2xl border border-black/5 bg-[#FEF9F4] p-3.5 text-left transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md ${act.hoverBorder}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${act.colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1A2B38] group-hover:text-[#29B9AA] transition-colors leading-tight">{act.title}</h4>
                  <p className="mt-1 text-[10px] leading-relaxed font-semibold text-[#7B6E67] line-clamp-2">{act.description}</p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 border border-black/5 text-[#7B6E67] transition-all duration-300 group-hover:bg-[#29B9AA] group-hover:text-white group-hover:border-[#29B9AA]">
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
