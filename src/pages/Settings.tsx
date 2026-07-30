import { useEffect, useState, type FormEvent } from "react";
import { updateTenantConfig } from "../api/tenants";
import type { TenantConfig } from "../api/types";
import {
  btnPrimary,
  Card,
  Field,
  inputCls,
  PageHeader,
  Spinner,
} from "../components/ui";
import { useTenantId } from "../lib/useTenantId";
import { useTenantStore } from "../store/tenant";
import { apiErrorText } from "../lib/apiError";

export function SettingsPage() {
  const tenantId = useTenantId();
  const tenant = useTenantStore((s) => s.tenant);
  const loadTenant = useTenantStore((s) => s.loadTenant);
  const setTenant = useTenantStore((s) => s.setTenant);

  const [form, setForm] = useState<TenantConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) {
      void loadTenant(tenantId);
    } else if (!form) {
      setForm({ ...tenant.config });
    }
  }, [tenant, form, tenantId, loadTenant]);

  if (!form) return <Spinner />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateTenantConfig(tenantId, form);
      setTenant(updated);
      setMessage("Ayarlar yadda saxlanıldı.");
    } catch (e) {
      setError(apiErrorText(e, "Ayarları yadda saxlamaq mümkün olmadı."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        subtitle="Səsli agentinizin davranış parametrləri"
      />

      {/* Karta en limiti qoyulmur — voint-admin-deki Ayarlar ekrani ile eyni: butun
          daxili sehifeler soldan baslayir ve tam eni tutur. */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Salamlama mətni">
            <textarea
              rows={3}
              required
              className={inputCls}
              value={form.greetingText}
              onChange={(e) =>
                setForm({ ...form, greetingText: e.target.value })
              }
            />
          </Field>

          <Field label="İş saatları">
            <input
              required
              className={inputCls}
              placeholder="B.e–Cümə 09:00–18:00"
              value={form.workingHours}
              onChange={(e) =>
                setForm({ ...form, workingHours: e.target.value })
              }
            />
          </Field>

          <Field label="Operatora yönləndirmə nömrəsi">
            <input
              required
              className={inputCls}
              placeholder="+994 xx xxx xx xx"
              value={form.handoffNumber}
              onChange={(e) =>
                setForm({ ...form, handoffNumber: e.target.value })
              }
            />
          </Field>

          <Field label="Dil konfiqurasiyası">
            {/* Backend serbest metn sutunudur (bezen sade kod - "az", bezen JSON blok -
                {"default":"az","supported":["az","ru","en"]}) - buna gore sabit seçim
                siyahisi evezine serbest metn saxlayiriq ki, movcud qiymeti yanlislikla
                daraltmayaq/xarab etmeyek. */}
            <input
              className={inputCls}
              placeholder='az, ya da {"default":"az","supported":["az","ru","en"]}'
              value={form.language}
              onChange={(e) =>
                setForm({ ...form, language: e.target.value })
              }
            />
          </Field>

          {message && <p className="text-sm text-ok">{message}</p>}
          {error && <p className="text-sm text-err">{error}</p>}

          <div className="pt-1">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? "Saxlanılır…" : "Yadda saxla"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
