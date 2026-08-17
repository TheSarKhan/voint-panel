import { useEffect, useState, type FormEvent } from "react";
import { updateTenantConfig } from "../api/tenants";
import {
  createTelegramLink,
  deleteTelegramChat,
  listTelegramChats,
  type TelegramChat,
} from "../api/telegram";
import type { TenantConfig } from "../api/types";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  Card,
  Field,
  inputCls,
  PageHeader,
  Spinner,
} from "../components/ui";
import { IconTrash } from "../components/icons";
import { useTenantId } from "../lib/useTenantId";
import { useTenantStore } from "../store/tenant";
import { apiErrorText } from "../lib/apiError";
import { formatDateTime } from "../lib/format";

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

      <div className="mt-6">
        <TelegramSection tenantId={tenantId} />
      </div>
    </div>
  );
}

/**
 * Hər zəng bitəndə nəticəsi bağlı Telegram söhbətlərinə gedir (bax VapiEventService ->
 * TelegramNotifier). Qoşulma link vasitəsilədir - webhook ötürücü tərəf söhbəti "backend"
 * cədvəlinə yazır, ona görə burada linkə keçəndən sonra siyahını əl ilə yeniləmək lazımdır
 * (canlı push yoxdur).
 */
function TelegramSection({ tenantId }: { tenantId: string }) {
  const [chats, setChats] = useState<TelegramChat[] | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      setChats(await listTelegramChats(tenantId));
    } catch (e) {
      setError(apiErrorText(e, "Söhbətlər yüklənmədi."));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const link = async () => {
    setLinking(true);
    setError(null);
    setDeepLink(null);
    try {
      setDeepLink(await createTelegramLink(tenantId));
    } catch (e) {
      setError(apiErrorText(e, "Link alınmadı."));
    } finally {
      setLinking(false);
    }
  };

  const remove = async (chatId: string) => {
    setRemovingId(chatId);
    setError(null);
    try {
      await deleteTelegramChat(tenantId, chatId);
      setChats((prev) => prev?.filter((c) => c.id !== chatId) ?? null);
    } catch (e) {
      setError(apiErrorText(e, "Söhbət silinmədi."));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-sm font-medium text-fg">Telegram bildirişləri</h2>
      <p className="mt-1 text-sm text-fg-muted">
        Hər zəng bitdikdə nömrə, müddət, nəticə və qısa xülasə buraya qoşulmuş Telegram
        söhbətlərinə göndərilir.
      </p>

      {chats === null ? (
        <Spinner />
      ) : chats.length === 0 ? (
        <p className="mt-4 text-sm text-fg-faint">Hələ heç bir söhbət qoşulmayıb.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/60">
          {chats.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-fg">
                {c.label ?? "Adsız söhbət"}
                <span className="ml-2 text-xs text-fg-faint">{formatDateTime(c.linkedAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => void remove(c.id)}
                disabled={removingId === c.id}
                aria-label="Söhbəti sil"
                className="rounded-md p-1.5 text-fg-faint transition-colors hover:bg-err/10 hover:text-err disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {deepLink && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
          <p className="text-sm text-fg">
            Bu linkə keçin və Telegram-da <span className="font-medium">Start</span> düyməsini
            basın (15 dəqiqə etibarlıdır):
          </p>
          <a
            href={deepLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block break-all text-sm text-accent underline"
          >
            {deepLink}
          </a>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-err">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void link()} disabled={linking} className={btnSecondary}>
          {linking ? "Link hazırlanır…" : "Yeni söhbət qoş"}
        </button>
        {deepLink && (
          <button type="button" onClick={() => void refresh()} disabled={refreshing} className={btnGhost}>
            {refreshing ? "Yoxlanılır…" : "Qoşulduqdan sonra yenilə"}
          </button>
        )}
      </div>
    </Card>
  );
}
