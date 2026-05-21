import { useState } from "react";
import { toast } from "sonner";
import { useOnboarding } from "../../contexts/OnboardingContext";

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

export default function OnboardingOverlay() {
  const { isVisible, completeOnboarding, closeOnboarding, hasCompletedOnboarding, isSaving } = useOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isVisible) return null;

  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const handleFinish = async () => {
    try {
      await completeOnboarding();
      toast.success("Onboarding selesai. Kamu siap pakai app.");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan progress onboarding.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#FEF9F4]/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[36px] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(41,185,170,0.18)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: slide.accent, backgroundColor: slide.soft }}>
            {slide.badge}
          </span>
          <button onClick={handleFinish} className="text-sm font-semibold text-[#7B6E67]">
            Lewati
          </button>
        </div>

        <div className="mt-8 rounded-[32px] border p-8" style={{ backgroundColor: slide.soft, borderColor: slide.accent }}>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: slide.accent }}>
            0{activeIndex + 1}
          </div>
          <h2 className="max-w-2xl text-4xl font-bold leading-tight text-[#1A2B38]">{slide.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#7B6E67]">{slide.description}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7B6E67]">Fokus</p>
              <p className="mt-2 text-sm font-semibold text-[#1A2B38]">Cepat dicatat</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7B6E67]">Hasil</p>
              <p className="mt-2 text-sm font-semibold text-[#1A2B38]">Lebih kebayang</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
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
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-[#7B6E67] disabled:opacity-40"
            >
              Kembali
            </button>
            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="rounded-2xl bg-[#29B9AA] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "Menyimpan..." : "Mulai Pakai App"}
              </button>
            ) : (
              <button
                onClick={() => setActiveIndex((current) => Math.min(current + 1, SLIDES.length - 1))}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: slide.accent }}
              >
                Lanjut
              </button>
            )}
          </div>
        </div>

        {hasCompletedOnboarding ? (
          <button onClick={closeOnboarding} className="mt-4 text-sm font-semibold text-[#7B6E67]">
            Tutup tutorial
          </button>
        ) : null}
      </div>
    </div>
  );
}
