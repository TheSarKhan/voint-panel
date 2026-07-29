import { useEffect, useState, type FormEvent } from "react";
import type { AxiosError } from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { resolveTenantBySubdomain, type PublicTenant } from "../api/publicTenant";
import { tenantSubdomainFromHost } from "../lib/tenantHost";
import { useAuthStore } from "../store/auth";
import { btnPrimary, Field, inputCls } from "../components/ui";
import { Wordmark } from "../components/Logo";

/**
 * Girişin niyə alınmadığını deyir.
 *
 * Əvvəl hər HTTP xətası "Məlumatları yoxlayın" olurdu — yəni doğru şifrə yazan adama
 * şifrənin səhv olduğu deyilirdi. Səbəb server tərəfdədirsə, istifadəçinin yoxlayacağı
 * heç nə yoxdur və onu öz məlumatlarını şübhə altına salmağa göndərmək vaxt itkisidir.
 */
function loginErrorText(err: unknown): string {
  if (err instanceof Error && !("response" in err)) {
    return err.message;
  }
  const response = (err as AxiosError<{ detail?: string }>)?.response;
  const status = response?.status;

  if (status === 401) {
    return "E-poçt və ya şifrə yanlışdır.";
  }
  // 403-ü "hesabınız bloklanıb" kimi oxumaq olmaz: serverin öz səbəbi varsa onu deyirik,
  // yoxdursa (məsələn CORS rədd edəndə cavab mətn olur, JSON deyil) uydurmuruq.
  if (status === 403) {
    return (
      response?.data?.detail ??
      "Giriş bu ünvandan qəbul edilmədi. Problem davam edərsə bizə bildirin."
    );
  }
  if (status && status >= 500) {
    return "Server cavab vermir. Məlumatlarınız düzgündür — bir azdan yenidən yoxlayın.";
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

  // Bu unvan hansi muessiseye aiddir. ces.voint.az -> CES.
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
      // Bu unvan konkret bir muessiseye aiddirsa, basqa muessisenin hesabi ile
      // buraya girmek olmaz: ces.voint.az-da klinikanin melumatlari gorunmemelidir.
      // Backend onsuz da tenant-i JWT-den goturur, amma istifadeci hansi panelde
      // oldugunu unvandan oxuyur — ikisi ust-uste dusmese, panel yalan danisir.
      if (tenant && res.user.tenantId !== tenant.id) {
        setError(
          `Bu hesab "${tenant.name}" panelinə aid deyil. Öz panelinizin ünvanından daxil olun.`,
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
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mb-2.5">
            <Wordmark size="2.9rem" />
          </h1>
          <p className="text-sm text-fg-muted">
            {tenant ? tenant.name : "Biznes Paneli"}
          </p>
          <p className="mt-1 text-xs text-fg-faint">AI səsli agentinizi idarə edin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          <Field label="E-poçt">
            <input
              type="email"
              required
              autoComplete="email"
              className={inputCls}
              placeholder="admin@ces.az"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Şifrə">
            <input
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && (
            <p className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full justify-center`}>
            {loading ? "Yoxlanılır…" : "Daxil ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
