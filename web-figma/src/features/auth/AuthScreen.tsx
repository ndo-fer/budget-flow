import { useState } from "react";
import { toast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import { LogIn, UserPlus, ArrowRight } from "lucide-react";
import supabase from "../../lib/supabase";

export default function AuthScreen() {
  const { signIn, signUp, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const switchMode = (nextIsSignUp: boolean) => {
    setIsSignUp(nextIsSignUp);
    setPassword("");
    setConfirmPassword("");
    setSuccessMessage("");
  };

  const handleSubmit = async () => {
    setSuccessMessage("");
    if (!email || !password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      toast.error("Konfirmasi password belum cocok.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignUp) {
        await signUp(email, password);
        setSuccessMessage(`Akun berhasil dibuat. Cek email ${email} untuk verifikasi sebelum login.`);
        toast.success("Akun berhasil dibuat.");
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        await signIn(email, password);
        toast.success("Login berhasil.");
      }
    } catch (err: any) {
      toast.error(err.message || "Autentikasi gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-[#FEF9F4] px-6 py-8 relative overflow-hidden flex items-center justify-center">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Coral Blob */}
        <div className="absolute top-10 left-10 w-56 h-56 rounded-full bg-[#FF6B58]/60 animate-float-1" />
        {/* Teal Blob */}
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-[#29B9AA]/60 animate-float-2" />
        {/* Orange Blob */}
        <div className="absolute top-1/3 right-12 w-40 h-40 rounded-full bg-[#FFB347]/60 animate-float-3" />
        {/* Blue Blob */}
        <div className="absolute bottom-1/3 left-12 w-48 h-48 rounded-full bg-[#5BAEE8]/60 animate-float-4" />
      </div>

      <div className="relative z-10 w-full mx-auto grid min-h-0 lg:min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <section className="hidden lg:flex relative overflow-hidden rounded-3xl border border-black/10 bg-white/65 backdrop-blur-2xl p-8 shadow-[0_24px_64px_rgba(41,185,170,0.15)] lg:min-h-[560px] lg:flex-col lg:justify-center lg:p-12">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#FFB347]/30" />
          <div className="absolute bottom-0 right-24 h-28 w-28 rounded-full bg-[#29B9AA]/15" />
          <p className="relative text-xs font-bold uppercase tracking-[0.28em] text-[#FF6B58]">Budget Flow</p>
          <h1 className="relative mt-4 max-w-xl text-4xl font-bold leading-tight text-[#1A2B38] lg:text-5xl">
            Atur uang harianmu tanpa bikin kepala penuh.
          </h1>
          <p className="relative mt-4 max-w-lg text-base leading-7 text-[#7B6E67]">
            Catat pengeluaran, lihat sisa budget, dan bangun kebiasaan finansial yang terasa ringan dipakai tiap hari.
          </p>
          <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Catat Transaksi Harian", "#FF6B58", "#FFF0EC"],
              ["Notifikasi Sisa Budget", "#29B9AA", "#EBF7F6"],
              ["Tinjauan Bulanan Rapi", "#5BAEE8", "#EEF7FD"],
            ].map(([label, color, bg]) => (
              <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: bg }}>
                <p className="text-sm font-semibold" style={{ color }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white/65 backdrop-blur-2xl p-6 shadow-[0_24px_64px_rgba(255,107,88,0.12)] flex flex-col justify-center w-full max-w-md mx-auto lg:max-w-none">
          {/* Logo / Branding */}
          <div className="mb-4 flex flex-col items-center justify-center">
            <img src="/logo-horizontal.png" alt="Budget Flow Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="mb-5 flex rounded-full bg-[#F3EDE8] p-1">
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${!isSignUp ? "bg-white text-[#FF6B58]" : "text-[#7B6E67]"}`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${isSignUp ? "bg-white text-[#FF6B58]" : "text-[#7B6E67]"}`}
            >
              <UserPlus className="w-4 h-4" />
              Daftar
            </button>
          </div>

          <h2 className="text-2xl font-bold text-[#1A2B38]">{isSignUp ? "Bikin akun baru" : "Masuk dan lanjutkan pencatatanmu"}</h2>
          {successMessage ? (
            <div className="mt-3 rounded-2xl border border-[#BEE8E4] bg-[#EBF7F6] px-4 py-3 text-sm leading-6 text-[#136B62]">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-5 space-y-3.5">
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
            />
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
            />
            {isSignUp ? (
              <input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#FEF9F4] px-4 py-3 text-sm text-[#1A2B38] outline-none focus:border-[#FF6B58]"
              />
            ) : null}
          </div>

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="mt-5 w-full rounded-2xl bg-[#29B9AA] px-4 py-4 text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? (
              <span>Mohon tunggu...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Buat Akun</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-sm leading-6 text-[#7B6E67]">
            {isSignUp ? "Sudah punya akun? " : "Belum punya akun? "}
            <button
              onClick={() => switchMode(!isSignUp)}
              className="font-semibold text-[#FF6B58] underline decoration-transparent transition-colors hover:decoration-current"
            >
              {isSignUp ? "Login dulu." : "Daftar dulu."}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
