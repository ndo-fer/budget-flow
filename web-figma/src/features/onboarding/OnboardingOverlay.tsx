import { useState, useEffect } from "react";
import { toast } from "../../utils/toast";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import supabase from "../../lib/supabase";
import { Check, Wallet, FolderPlus, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const SLIDES = [
  {
    badge: "Step 1",
    title: "Catat pengeluaran secepat kebiasaanmu belanja.",
    description: "Setiap transaksi kecil bisa langsung masuk tanpa bikin kamu berhenti lama di tengah hari.",
    accent: "#FF6B58",
    soft: "#FFF0EC",
  },
  {
    badge: "Step 2",
    title: "Lihat budget dengan bahasa yang lebih gampang dicerna.",
    description: "Budget Flow bantu kasih konteks, bukan cuma angka, jadi kamu tahu mana yang masih aman dan mana yang perlu dijaga.",
    accent: "#FFB347",
    soft: "#FFF6E8",
  },
  {
    badge: "Step 3",
    title: "Rapikan kategori dan rencana, lalu biarkan app bantu ritmemu.",
    description: "Setelah awalnya rapi, dashboard dan checklist akan lebih relevan buat dipakai tiap hari.",
    accent: "#5BAEE8",
    soft: "#EEF7FD",
  },
];

const AVAILABLE_CATEGORIES = [
  { name: "Makan", color: "#FF6B6B", priority: 3, defaultBudget: 300000 },
  { name: "Transport", color: "#4ECDC4", priority: 3, defaultBudget: 200000 },
  { name: "Entertainment", color: "#95E1D3", priority: 3, defaultBudget: 150000 },
  { name: "Shopping", color: "#F38181", priority: 3, defaultBudget: 200000 },
  { name: "Utilities", color: "#AA96DA", priority: 3, defaultBudget: 100000 },
  { name: "Health", color: "#FCBAD3", priority: 3, defaultBudget: 150000 },
  { name: "Education", color: "#A8D8EA", priority: 3, defaultBudget: 100000 },
  { name: "Other", color: "#C7CEEA", priority: 3, defaultBudget: 100000 },
];

const PROVIDERS: Record<string, string[]> = {
  bank: ["BCA", "Mandiri", "BNI", "BRI", "Jago", "SeaBank", "CIMB", "Lainnya"],
  ewallet: ["GoPay", "OVO", "ShopeePay", "Dana", "LinkAja", "Jenius", "Lainnya"],
  cash: ["Dompet"],
  other: ["Investasi", "Tabungan Lain", "Lainnya"],
};

export default function OnboardingOverlay() {
  const { isVisible, completeOnboarding, closeOnboarding, hasCompletedOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  const [step, setStep] = useState<"slides" | "setup">("slides");
  const [activeIndex, setActiveIndex] = useState(0);

  // Setup Form State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    AVAILABLE_CATEGORIES.map(c => c.name)
  );
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    AVAILABLE_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.name]: c.defaultBudget }), {})
  );
  
  const [walletName, setWalletName] = useState("BCA");
  const [walletType, setWalletType] = useState<"bank" | "ewallet" | "cash" | "other">("bank");
  const [walletProvider, setWalletProvider] = useState("BCA");
  const [initialBalance, setInitialBalance] = useState<string>("5000000"); // 5jt default input
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update provider automatically when wallet type changes
  useEffect(() => {
    const list = PROVIDERS[walletType] || [];
    setWalletProvider(list[0] || "Lainnya");
    if (walletType === "cash") {
      setWalletName("Dompet Tunai");
    } else if (walletType === "ewallet") {
      setWalletName("GoPay");
    } else if (walletType === "bank") {
      setWalletName("BCA");
    } else {
      setWalletName("Tabungan");
    }
  }, [walletType]);

  if (!isVisible) return null;

  const slide = SLIDES[activeIndex];
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleNextSlide = () => {
    if (isLastSlide) {
      setStep("setup");
    } else {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleCategoryToggle = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleBudgetChange = (name: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    setCategoryBudgets(prev => ({ ...prev, [name]: num }));
  };

  const handleSaveSetup = async () => {
    setIsSubmitting(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error("Pengguna tidak ditemukan. Silakan login kembali.");

      // 1. Insert selected categories
      const categoriesToInsert = AVAILABLE_CATEGORIES
        .filter(cat => selectedCategories.includes(cat.name))
        .map(cat => ({
          user_id: userId,
          name: cat.name,
          budget_amount: categoryBudgets[cat.name] || 0,
          color: cat.color,
          priority: cat.priority,
          is_active: true
        }));

      if (categoriesToInsert.length > 0) {
        const { error: catError } = await supabase
          .from("budget_categories")
          .insert(categoriesToInsert);
        if (catError) throw catError;
      }

      // 2. Insert initial wallet if name exists
      if (walletName.trim()) {
        const balanceNum = parseFloat(initialBalance) || 0;
        const { error: walletError } = await supabase
          .from("wallets")
          .insert([
            {
              user_id: userId,
              name: walletName.trim(),
              type: walletType,
              provider: walletProvider,
              confirmed_balance: balanceNum,
              estimated_balance: balanceNum,
              confidence: 1.0,
              last_confirmed_at: new Date().toISOString(),
              is_active: true,
            },
          ]);
        if (walletError) throw walletError;
      }

      toast.success("Akun kamu berhasil disiapkan!");
      await completeOnboarding();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan konfigurasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipAll = async () => {
    const confirmSkip = window.confirm(
      "Apakah kamu yakin ingin melewati setup? Kamu akan memulai dengan kategori dan wallet kosong."
    );
    if (!confirmSkip) return;

    setIsSubmitting(true);
    try {
      await completeOnboarding();
      toast.success("Setup dilewati. Selamat datang di Budget Flow!");
    } catch (err: any) {
      toast.error("Gagal menyimpan progress onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#FEF9F4]/90 p-4 backdrop-blur-sm flex items-start justify-center">
      <div className="w-full max-w-4xl rounded-[24px] sm:rounded-[36px] border border-black/10 bg-white p-5 sm:p-8 shadow-[0_24px_80px_rgba(41,185,170,0.18)] my-auto transition-all">
        
        {step === "slides" ? (
          // ── SLIDES VIEW ─────────────────────────────────────────────
          <>
            <div className="flex items-center justify-between">
              <span className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: slide.accent, backgroundColor: slide.soft }}>
                {slide.badge}
              </span>
              <button onClick={() => setStep("setup")} className="text-sm font-semibold text-[#7B6E67] hover:text-[#1A2B38] transition-colors">
                Lewati Tutorial
              </button>
            </div>

            <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-[32px] border p-5 sm:p-8 transition-all duration-300" style={{ backgroundColor: slide.soft, borderColor: slide.accent }}>
              <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full text-lg sm:text-xl font-bold text-white shadow-sm" style={{ backgroundColor: slide.accent }}>
                0{activeIndex + 1}
              </div>
              <h2 className="max-w-2xl text-2xl sm:text-4xl font-bold leading-tight text-[#1A2B38]">{slide.title}</h2>
              <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#7B6E67]">{slide.description}</p>
              
              <div className="mt-6 sm:mt-8 grid gap-3 grid-cols-2">
                <div className="rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-black/[0.03]">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#7B6E67]">Fokus</p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-[#1A2B38]">Cepat dicatat</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-black/[0.03]">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#7B6E67]">Hasil</p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-[#1A2B38]">Lebih kebayang</p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {SLIDES.map((item, index) => (
                  <div
                    key={item.badge}
                    className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-10" : "w-2 bg-black/10"}`}
                    style={index === activeIndex ? { backgroundColor: slide.accent } : undefined}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                  disabled={activeIndex === 0}
                  className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#7B6E67] hover:bg-black/[0.02] disabled:opacity-40 transition-all"
                >
                  Kembali
                </button>
                <button
                  onClick={handleNextSlide}
                  className="rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                  style={{ backgroundColor: slide.accent }}
                >
                  {isLastSlide ? "Siapkan Akun" : "Lanjut"} 
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          // ── SETUP ACCOUNT FORM VIEW ─────────────────────────────────
          <div className="max-h-[85vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#29B9AA]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#29B9AA]">Langkah Terakhir</p>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A2B38]">Mari Atur Rencana Keuanganmu</h2>
            <p className="text-sm text-[#7B6E67] mt-1">
              Sesuaikan kategori budget dan tambahkan saldo wallet awal Anda. Kami telah mengisi beberapa data rekomendasi yang bisa Anda ubah.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
              
              {/* LEFT: Categories Checklist */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FolderPlus className="w-4 h-4 text-[#7B6E67]" />
                  <h3 className="font-bold text-[#1A2B38] text-base">Kategori & Budget Bulanan</h3>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 border border-black/5 rounded-2xl p-3 bg-black/[0.01]">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.name);
                    const budgetValue = categoryBudgets[cat.name] || 0;
                    
                    return (
                      <div 
                        key={cat.name}
                        onClick={() => handleCategoryToggle(cat.name)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-white border-[#29B9AA]/30 shadow-sm" 
                            : "bg-black/[0.02] border-transparent opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked ? "bg-[#29B9AA] border-[#29B9AA] text-white" : "border-black/20 bg-white"
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm font-semibold text-[#1A2B38]">{cat.name}</span>
                          </div>
                        </div>

                        {isChecked && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-[#7B6E67]">Budget:</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7B6E67]">Rp</span>
                              <input
                                type="text"
                                value={budgetValue.toLocaleString("id-ID")}
                                onChange={(e) => handleBudgetChange(cat.name, e.target.value)}
                                className="w-28 pl-8 pr-2.5 py-1 text-xs font-bold text-right rounded-lg border border-black/10 focus:ring-1 focus:ring-[#29B9AA] focus:border-[#29B9AA] outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: First Wallet Setup */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-[#7B6E67]" />
                    <h3 className="font-bold text-[#1A2B38] text-base">Setup Wallet Pertama Kamu</h3>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-[#FEF9F4]/40 p-4 sm:p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#7B6E67] mb-1">Tipe Wallet</label>
                      <select
                        value={walletType}
                        onChange={(e) => setWalletType(e.target.value as any)}
                        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                      >
                        <option value="bank">Rekening Bank</option>
                        <option value="ewallet">E-Wallet</option>
                        <option value="cash">Tunai (Cash)</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#7B6E67] mb-1">Penyedia (Provider)</label>
                        <select
                          value={walletProvider}
                          onChange={(e) => setWalletProvider(e.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                        >
                          {(PROVIDERS[walletType] || []).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#7B6E67] mb-1">Nama Wallet</label>
                        <input
                          type="text"
                          value={walletName}
                          onChange={(e) => setWalletName(e.target.value)}
                          placeholder="e.g. BCA Utama"
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-[#1A2B38] outline-none focus:border-[#29B9AA]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#7B6E67] mb-1">Saldo Awal</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B6E67]">Rp</span>
                        <input
                          type="text"
                          value={Number(initialBalance || 0).toLocaleString("id-ID")}
                          onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9]/g, ""))}
                          className="w-full pl-9 pr-4 py-2.5 text-sm font-bold rounded-xl border border-black/10 bg-white outline-none focus:border-[#29B9AA]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-[#7B6E67] px-1">
                    <AlertCircle className="w-4 h-4 text-[#FFB347] flex-shrink-0 mt-0.5" />
                    <span>
                      Data di atas akan di-save ke database. Anda tetap bisa menambah, menghapus, atau mengedit data ini kapan saja melalui menu Settings.
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => setStep("slides")}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#7B6E67] hover:bg-black/[0.02] disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>
                    
                    <button
                      onClick={handleSkipAll}
                      disabled={isSubmitting}
                      className="flex-1 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#FF6B58] hover:bg-red-50 disabled:opacity-40 transition-all"
                    >
                      Lewati Setup
                    </button>

                    <button
                      onClick={handleSaveSetup}
                      disabled={isSubmitting || !walletName.trim() || selectedCategories.length === 0}
                      className="flex-2 rounded-2xl bg-[#29B9AA] py-3 px-6 text-sm font-bold text-white shadow-md hover:brightness-105 active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan...
                        </>
                      ) : (
                        "Simpan & Mulai Budgeting"
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {hasCompletedOnboarding ? (
          <button onClick={closeOnboarding} className="mt-4 text-sm font-semibold text-[#7B6E67] hover:text-[#1A2B38] block mx-auto transition-colors">
            Tutup Tutorial
          </button>
        ) : null}
      </div>
    </div>
  );
}
