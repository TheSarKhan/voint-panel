import { useEffect, useState, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { login } from "../api/auth";
import { resolveTenantBySubdomain, type PublicTenant } from "../api/publicTenant";
import { tenantSubdomainFromHost } from "../lib/tenantHost";
import { useAuthStore } from "../store/auth";
import { Wordmark } from "../components/Logo";
import {
  GlassButton,
  GlassInput,
  GlobalSilkCanvas,
  SpotlightCard,
} from "../components/kit";

function loginErrorText(err: unknown): string {
  if (err instanceof Error && !("response" in err)) {
    return err.message;
  }
  const response = (err as AxiosError<{ detail?: string }>)?.response;
  const status = response?.status;

  if (status === 401) {
    return "E-poçt və ya şifrə yanlışdır.";
  }
  if (status === 403) {
    return (
      response?.data?.detail ??
      "Giriş bu ünvandan qəbul edilmədi. Problem davam edərsə bizə bildirin."
    );
  }
  if (status && status >= 500) {
    return "Server cavab vermir. Məlumatlarınız düzgündür, bir azdan yenidən yoxlayın.";
  }
  return "Giriş alınmadı. Bir azdan yenidən cəhd edin.";
}

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tenant resolution (e.g. ces.voint.az -> CES Texnika)
  const [tenant, setTenant] = useState<PublicTenant | null>(null);

  useEffect(() => {
    const sub = tenantSubdomainFromHost();
    if (!sub) return;
    let cancelled = false;
    resolveTenantBySubdomain(sub).then((t) => {
      if (!cancelled) setTenant(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);

      if (tenant && res.user.tenantId !== tenant.id) {
        setError(
          `Bu hesab "${tenant.name}" panelinə aid deyil. Öz müəssisənizin ünvanından daxil olun.`
        );
        return;
      }

      setSession(res.token, res.user, res.refreshToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(loginErrorText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-[#0a0a0a] selection:bg-[#39ff14] selection:text-black font-sans flex flex-col justify-between overflow-hidden">
      {/* ── 3D THREE.JS WEBGL SILK CANVAS (HERO MOUSE TRACKING) ── */}
      <GlobalSilkCanvas />

      {/* ── TOP HEADER / BRAND NAVIGATION ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 outline-none">
          <Wordmark size="2.4rem" />
        </Link>

        <div className="flex items-center gap-3 text-xs text-[#6b6b6b]">
          <span className="hidden sm:inline">Kömək lazımdır?</span>
          <a
            href="mailto:support@voint.az"
            className="rounded-full border border-[#e5e5e5] bg-white/90 px-4 py-1.5 text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors font-medium"
          >
            Dəstək
          </a>
        </div>
      </header>

      {/* ── MAIN GRAND LOGIN CONTAINER ── */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT SIDE: Grand 3D Spotlight Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none">
            <SpotlightCard className="p-8 sm:p-10 bg-white/95 border-[#e5e5e5] shadow-xl">
              {/* Header inside Card */}
              <div className="mb-8">
                <h1 className="hero-animate-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#0a0a0a]">
                  Müəssisə Paneli
                </h1>
                <p className="hero-animate-2 text-xs sm:text-sm text-[#6b6b6b] mt-1.5 leading-relaxed">
                  {tenant
                    ? `${tenant.name} səsli süni intellekt və zəng idarəetmə sisteminə daxil olun`
                    : "Biznesinizin səsli süni intellekt və zəng analitikası sisteminə daxil olun"}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="hero-animate-3 space-y-4">
                <GlassInput
                  label="E-poçt ünvanı"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@sirketiniz.az"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                />

                <div>
                  <GlassInput
                    label="Şifrə"
                    isPassword
                    required
                    autoComplete="current-password"
                    placeholder="Şifrənizi daxil edin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                  />

                  <div className="mt-2 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
                    >
                      Şifrəni unutmusunuz?
                    </Link>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium leading-relaxed"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="pt-2">
                  <GlassButton
                    type="submit"
                    variant="primary-cta"
                    size="lg"
                    isLoading={loading}
                    className="w-full justify-center"
                  >
                    {loading ? "Yoxlanılır…" : "Daxil ol"}
                  </GlassButton>
                </div>
              </form>

              {/* Security Guarantee */}
              <div className="hero-animate-4 mt-6 pt-5 border-t border-[#e5e5e5] flex items-center justify-between text-xs text-[#6b6b6b]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>256-bit TLS Şifrələmə</span>
                </span>
                <span className="font-mono text-[#0a0a0a]">Voint v2.0</span>
              </div>
            </SpotlightCard>
          </div>

          {/* RIGHT SIDE: Grand SaaS Showcase with the 3 Clean Feature Cards */}
          <div className="lg:col-span-6 hidden lg:flex flex-col space-y-6 pl-4">
            <div className="hero-animate-1">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#0a0a0a] leading-[1.2]">
                Biznesinizin zənglərini <br />
                <span className="font-bold">24/7 AI idarə etsin.</span>
              </h2>
              <p className="mt-3 text-sm text-[#6b6b6b] leading-relaxed max-w-lg">
                Müştəriləri saniyələr içində qarşılayan, sualları dəqiqliklə cavablayan və nəticəni dərhal sistemə işləyən səsli operator infrastrukturu.
              </p>
            </div>

            {/* 3 Clean Feature Cards */}
            <div className="hero-animate-2 space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-white/80 border border-[#e5e5e5] backdrop-blur-md shadow-xs hover:border-[#0a0a0a]/30 transition-colors">
                <h4 className="text-sm font-semibold text-[#0a0a0a]">Gemini 2.5 Flash Səs Mühərriki</h4>
                <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed">
                  290ms ilk kəlmə cavab sürəti (TTFT) və təbii dialoq axını
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-[#e5e5e5] backdrop-blur-md shadow-xs hover:border-[#0a0a0a]/30 transition-colors">
                <h4 className="text-sm font-semibold text-[#0a0a0a]">Avtomatik Rezervasiya & CRM</h4>
                <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed">
                  Sifariş və görüş qeydiyyatı, dərhal SMS bildirişi və zəng analitikası
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-[#e5e5e5] backdrop-blur-md shadow-xs hover:border-[#0a0a0a]/30 transition-colors">
                <h4 className="text-sm font-semibold text-[#0a0a0a]">İnsana Qüsursuz Yönləndirmə (Transfer)</h4>
                <p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed">
                  Mürəkkəb hallarda zəng canlı menecerə problemsiz ötürülür
                </p>
              </div>
            </div>

            {/* Bottom Proof Metrics */}
            <div className="hero-animate-3 pt-2 flex items-center gap-8 text-xs text-[#6b6b6b]">
              <div>
                <span className="text-xl font-bold text-[#0a0a0a] font-mono block">96.8%</span>
                <span>AI Dəqiqlik</span>
              </div>
              <div className="h-6 w-px bg-[#e5e5e5]" />
              <div>
                <span className="text-xl font-bold text-[#0a0a0a] font-mono block">1,400+</span>
                <span>Aylıq Zəng</span>
              </div>
              <div className="h-6 w-px bg-[#e5e5e5]" />
              <div>
                <span className="text-xl font-bold text-emerald-600 font-mono block">~68%</span>
                <span>Xalis Qənaət</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6b6b6b]">
        <span>© {new Date().getFullYear()} Voint Voice Ecosystem. Bütün hüquqlar qorunur.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#0a0a0a] transition-colors">Məxfilik Siyasəti</a>
          <a href="#" className="hover:text-[#0a0a0a] transition-colors">Xidmət Şərtləri</a>
        </div>
      </footer>
    </div>
  );
}
