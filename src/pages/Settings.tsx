import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getTenant, updateTenantConfig } from "../api/tenants";
import { PendingApprovalError } from "../api/client";
import {
  createTelegramLink,
  deleteTelegramChat,
  listTelegramChats,
  type TelegramChat,
  type TelegramLinks,
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
import { LanguagePicker } from "../components/LanguagePicker";
import { useTenantId } from "../lib/useTenantId";
import { useTenantStore } from "../store/tenant";
import { apiErrorText } from "../lib/apiError";
import { formatDateTime } from "../lib/format";

export function SettingsPage() {
  const tenantId = useTenantId();
  const setTenant = useTenantStore((s) => s.setTenant);

  const [initialConfig, setInitialConfig] = useState<TenantConfig | null>(null);
  const [form, setForm] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTenant(tenantId)
      .then((freshTenant) => {
        if (cancelled) return;
        setTenant(freshTenant);
        setInitialConfig({ ...freshTenant.config });
        setForm({ ...freshTenant.config });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiErrorText(err, "Ayarları yükləmək mümkün olmadı."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId, setTenant]);

  const isDirty = useMemo(() => {
    if (!initialConfig || !form) return false;
    return (
      (form.greetingText ?? "") !== (initialConfig.greetingText ?? "") ||
      (form.workingHours ?? "") !== (initialConfig.workingHours ?? "") ||
      (form.handoffNumber ?? "") !== (initialConfig.handoffNumber ?? "") ||
      (form.language ?? "") !== (initialConfig.language ?? "") ||
      (form.sttDomain ?? "") !== (initialConfig.sttDomain ?? "") ||
      (form.sttTopic ?? "") !== (initialConfig.sttTopic ?? "") ||
      (form.sttVocabulary ?? "") !== (initialConfig.sttVocabulary ?? "")
    );
  }, [initialConfig, form]);

  if (loading || !form) return <Spinner />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty || !initialConfig) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const changedFields: Partial<TenantConfig> = {};
    if ((form.greetingText ?? "") !== (initialConfig.greetingText ?? "")) {
      changedFields.greetingText = form.greetingText;
    }
    if ((form.workingHours ?? "") !== (initialConfig.workingHours ?? "")) {
      changedFields.workingHours = form.workingHours;
    }
    if ((form.handoffNumber ?? "") !== (initialConfig.handoffNumber ?? "")) {
      changedFields.handoffNumber = form.handoffNumber;
    }
    if ((form.language ?? "") !== (initialConfig.language ?? "")) {
      changedFields.language = form.language;
    }
    if ((form.industry ?? "RENTAL") !== (initialConfig.industry ?? "RENTAL")) {
      changedFields.industry = form.industry;
    }
    if ((form.sttVocabulary ?? "") !== (initialConfig.sttVocabulary ?? "")) {
      changedFields.sttVocabulary = form.sttVocabulary;
    }
    if ((form.sttDomain ?? "") !== (initialConfig.sttDomain ?? "")) {
      changedFields.sttDomain = form.sttDomain;
    }
    if ((form.sttTopic ?? "") !== (initialConfig.sttTopic ?? "")) {
      changedFields.sttTopic = form.sttTopic;
    }

    try {
      const updated = await updateTenantConfig(tenantId, changedFields);
      setTenant(updated);
      setInitialConfig({ ...updated.config });
      setForm({ ...updated.config });
      setMessage("Ayarlar yadda saxlanıldı.");
    } catch (e) {
      if (e instanceof PendingApprovalError) {
        setMessage(
          "Dəyişikliklər qeydə alındı və təsdiq növbəsinə göndərildi. Təsdiqləndikdən sonra qüvvəyə minəcək.",
        );
      } else {
        setError(apiErrorText(e, "Ayarları yadda saxlamaq mümkün olmadı."));
      }
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className="space-y-5"
        >
          <Field label="Salamlama mətni">
            <textarea
              rows={3}
              required
              className={inputCls}
              value={form.greetingText}
              onChange={(e) => {
                setMessage(null);
                setForm({ ...form, greetingText: e.target.value });
              }}
            />
          </Field>

          <Field label="İş saatları">
            <input
              required
              className={inputCls}
              placeholder="B.e–Cümə 09:00–18:00"
              value={form.workingHours}
              onChange={(e) => {
                setMessage(null);
                setForm({ ...form, workingHours: e.target.value });
              }}
            />
          </Field>

          <Field label="Operatora yönləndirmə nömrəsi">
            <input
              required
              className={inputCls}
              placeholder="+994 xx xxx xx xx"
              value={form.handoffNumber}
              onChange={(e) => {
                setMessage(null);
                setForm({ ...form, handoffNumber: e.target.value });
              }}
            />
          </Field>

          <Field
            label="Biznes Kateqoriyası (Fəaliyyət Sahəsi)"
            help="Sistem və kataloq paneli seçilmiş biznes sahənizə uyğun xüsusi sahələr və terminologiya ilə fərdiləşdirilir."
          >
            <select
              className={inputCls}
              value={form.industry || "RENTAL"}
              onChange={(e) => {
                setMessage(null);
                setForm({ ...form, industry: e.target.value as any });
              }}
            >
              <option value="RENTAL">🚜 Ağır Tikinti Texnikası və İcarə</option>
              <option value="BEAUTY_SALON">💇‍♂️ Bərbər və Gözəllik Salonu</option>
              <option value="RESTAURANT">🍽️ Restoran, Kafe və Qida Menyusu</option>
              <option value="CLINIC">🏥 Klinika və Tibb Mərkəzi</option>
              <option value="AUTO_SERVICE">🚗 Avto-Servis və Usta Xidmətləri</option>
              <option value="RETAIL">🛍️ Pərakəndə Satış, Mağaza və Aptek</option>
              <option value="SERVICES">💼 Ümumi Xidmətlər və Konsaltinq</option>
            </select>
          </Field>

          <div>
            <LanguagePicker
              value={form.language}
              onChange={(val) => {
                setMessage(null);
                setForm({ ...form, language: val });
              }}
            />
          </div>

          <Field
            label="Səs tanıma lüğəti"
            help="Vergüllə ayırın - şirkət adınız, məhsul/xidmət adlarınız və sahənizə xas sözlər. Adi danışıq sözlərini (bəli, xeyr və s.) əlavə etməyə ehtiyac yoxdur, onları agent onsuz da tanıyır."
          >
            {/* Ümumi dilin sözləri deyil - agent zəngdə eşidəndə tanımalı olduğu, öz
                sahənizə xas sözlər. Backend bunu VapiAssistantProvisioner-də ümumi
                Azərbaycan lüğətinin üstünə əlavə edir. */}
            <input
              className={inputCls}
              placeholder="məs. CES, ekskavator, buldozer"
              value={form.sttVocabulary}
              onChange={(e) => {
                setMessage(null);
                setForm({ ...form, sttVocabulary: e.target.value });
              }}
            />
          </Field>

          {message && <p className="text-sm text-ok">{message}</p>}
          {error && <p className="text-sm text-err">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className={`${btnPrimary} ${!isDirty ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saving ? "Saxlanılır…" : "Yadda saxla"}
            </button>
            {isDirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Yadda saxlanılmamış dəyişikliklər var
              </span>
            )}
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
  const [links, setLinks] = useState<TelegramLinks | null>(null);
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
    setLinks(null);
    try {
      setLinks(await createTelegramLink(tenantId));
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

      {links && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
          <p className="text-sm text-fg">
            Hansını istəyirsiniz seçin (15 dəqiqə etibarlıdır, ikisi eyni linkdir - biri
            işləyəndə o biri artıq keçərsiz olur):
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <a href={links.deepLink} target="_blank" rel="noreferrer" className={btnSecondary}>
              Şəxsi söhbətə qoş
            </a>
            <a href={links.groupDeepLink} target="_blank" rel="noreferrer" className={btnSecondary}>
              Qrupa əlavə et
            </a>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-err">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void link()} disabled={linking} className={btnSecondary}>
          {linking ? "Link hazırlanır…" : "Yeni söhbət qoş"}
        </button>
        {links && (
          <button type="button" onClick={() => void refresh()} disabled={refreshing} className={btnGhost}>
            {refreshing ? "Yoxlanılır…" : "Qoşulduqdan sonra yenilə"}
          </button>
        )}
      </div>
    </Card>
  );
}
