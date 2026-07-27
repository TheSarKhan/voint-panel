import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { resolveTenantBySubdomain, type PublicTenant } from "../api/publicTenant";
import { tenantSubdomainFromHost } from "../lib/tenantHost";
import { useAuthStore } from "../store/auth";
import { btnPrimary, Field, inputCls } from "../components/ui";
import { Wordmark } from "../components/Logo";

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
      const message =
        err instanceof Error && !("response" in err)
          ? err.message
          : "Giriş alınmadı. Məlumatları yoxlayın.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="mb-2.5">
            <Wordmark size="2.25rem" />
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

          <p className="pt-1 text-center text-xs text-fg-faint">
            Demo giriş: admin@ces.az / voint123
          </p>
        </form>
      </div>
    </div>
  );
}
