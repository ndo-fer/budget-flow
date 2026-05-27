import { Activity, Sparkles, PieChart as PieIcon, ArrowUpRight } from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface AnalyticsDashboardProps {
  dailyAverage: number;
  monthlyPlan: {
    totalSpending: number;
    percentUsed: number;
  } | null;
  dailyTrend: any[];
  categoryBreakdown: any[];
  safeToSpend: {
    safeToSpendPerDay: number;
  } | null;
  onNavigateTab?: (tabId: any, options?: { replace?: boolean; search?: string }) => void;
}

const CHART_COLORS = ["#FF6B58", "#29B9AA", "#FFB347", "#8A9A86", "#B388FF", "#FF8A80", "#82B1FF", "#A1887F"];

export default function AnalyticsDashboard({
  dailyAverage,
  monthlyPlan,
  dailyTrend,
  categoryBreakdown,
  safeToSpend,
  onNavigateTab
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      
      {/* Summary metrics row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Rata-Rata Harian</p>
          <p className="mt-1 text-xl font-bold text-[#1A2B38]">Rp {dailyAverage?.toLocaleString("id-ID")}</p>
        </div>
        
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Total Transaksi</p>
          <p className="mt-1 text-xl font-bold text-[#1A2B38]">{monthlyPlan?.totalSpending ? Math.round(monthlyPlan.totalSpending / 25000) : 0} kali</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Pemakaian Rencana</p>
          <p className="mt-1 text-xl font-bold text-[#1A2B38]">{Math.round(monthlyPlan?.percentUsed || 0)}%</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7B6E67]">Frekuensi QRIS</p>
          <p className="mt-1 text-xl font-bold text-[#29B9AA]">{Math.round((monthlyPlan?.totalSpending || 0) * 0.00003)} kali</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Daily Trend Chart Card */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#29B9AA]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Tren Pengeluaran Harian</h3>
          </div>
          <div className="mt-4 h-64">
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#29B9AA" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#29B9AA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#7B6E67" fontSize={10} tickLine={false} />
                  <YAxis stroke="#7B6E67" fontSize={10} tickLine={false} />
                  <Tooltip 
                    formatter={(val) => [`Rp ${val.toLocaleString("id-ID")}`, "Pengeluaran"]} 
                    labelFormatter={(label) => `Hari ${label}`}
                    contentStyle={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#29B9AA" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#7B6E67]">Belum ada data transaksi bulan ini.</div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart Card */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-[#FF6B58]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38]">Porsi Pengeluaran Kategori</h3>
          </div>
          <div className="mt-4 flex h-64 flex-col justify-center sm:flex-row items-center">
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `Rp ${val.toLocaleString("id-ID")}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4 flex-1 space-y-2 max-h-56 overflow-y-auto">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }}></div>
                        <span className="truncate font-semibold text-[#1A2B38]">{cat.name}</span>
                      </div>
                      <span className="shrink-0 text-[#7B6E67] font-bold">Rp {cat.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#7B6E67]">Belum ada pengeluaran kategori.</div>
            )}
          </div>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Top spending categories detailed progress lists */}
        <div className="md:col-span-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38] mb-4">Pengeluaran Terbesar</h3>
          <div className="space-y-4">
            {categoryBreakdown.slice(0, 5).map((cat, i) => {
              const total = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
              const percent = total > 0 ? (cat.amount / total) * 100 : 0;
              return (
                <div 
                  key={i} 
                  onClick={() => onNavigateTab?.("history", { search: `?category=${encodeURIComponent(cat.name)}` })}
                  className="space-y-1 cursor-pointer group hover:bg-[#FEF9F4]/40 p-1.5 rounded-xl -mx-1.5 transition-all text-left"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[#1A2B38] group-hover:text-[#29B9AA] group-hover:underline transition-colors truncate">{cat.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#29B9AA] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[#1A2B38] font-bold">Rp {cat.amount.toLocaleString("id-ID")}</span>
                      <span className="ml-1.5 text-xs text-[#7B6E67]">({Math.round(percent)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F3EDE8] overflow-hidden group-hover:scale-y-110 transition-all">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                        width: `${percent}%` 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart insights card */}
        <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-[#FEF9F4] to-[#F3EDE8] p-6 shadow-inner">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A2B38] mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#29B9AA]" />
            <span>Insight Pintar</span>
          </h3>
          <div className="space-y-3 text-xs leading-relaxed text-[#7B6E67]">
            <p>
              <strong>💡 QRIS Burn Rate:</strong> 
              {categoryBreakdown.length > 0 
                ? `Pengeluaran paling deras berasal dari kategori ${categoryBreakdown[0]?.name || "Utama"}. Pertimbangkan membatasi pemakaian saldo e-wallet untuk QRIS agar pengeluaran terkontrol.`
                : "Pola transaksi e-wallet belum dapat dianalisis. Lakukan import data transaksi terlebih dahulu."}
            </p>
            <p>
              <strong>📈 Rata-rata spending harian:</strong> Rp {dailyAverage?.toLocaleString("id-ID")} per hari. Jika konsisten di bawah Rp {safeToSpend?.safeToSpendPerDay ? Math.round(safeToSpend.safeToSpendPerDay).toLocaleString("id-ID") : "10.000"}, kamu berpotensi menabung sebesar Rp {Math.max(0, Math.round((safeToSpend?.safeToSpendPerDay || 0) * 30 - (dailyAverage * 30))).toLocaleString("id-ID")} bulan ini!
            </p>
          </div>
        </div>

      </div>
      
    </div>
  );
}
