import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  approveRequest,
  listApprovals,
  rejectRequest,
  type Approval,
} from "../api/approvals";
import { parseLanguages, SUPPORTED_LANGUAGES } from "../components/LanguagePicker";
import { useAuthStore } from "../store/auth";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Spinner,
  StatusText,
  Table,
  TableContainer,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../components/ui";
import { IconChevronDown, IconChevronRight } from "../components/icons";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const STATUS_LABEL: Record<Approval["status"], string> = {
  PENDING: "gözləyir",
  APPROVED: "təsdiqlənib",
  REJECTED: "rədd edilib",
  FAILED: "icra olunmadı",
};

const STATUS_TONE = {
  PENDING: "warn",
  APPROVED: "ok",
  REJECTED: "neutral",
  FAILED: "err",
} as const;

const TABS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Gözləyənlər" },
  { value: "", label: "Hamısı" },
];

/** Sorğunun gövdəsini oxunaqlı JSON edir */
function prettyBody(body: string | null): string | null {
  if (!body) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

/** Təsdiq sorğusunun təsvirini anlaşıqlı Azərbaycan dilinə çevirir və sırf nəyin dəyişdirildiyini göstərir */
function getHumanSummary(r: Approval): { title: string; subtitle?: string } {
  let parsed: any = null;
  try {
    if (r.body) parsed = JSON.parse(r.body);
  } catch {}

  const resource = r.resource?.toUpperCase();
  const action = r.action?.toUpperCase();
  const method = r.method?.toUpperCase();

  if (resource === "SETTINGS" || r.path.includes("/config")) {
    const changed: string[] = [];
    if (parsed) {
      if (parsed.greetingText !== undefined) changed.push("Salamlama mətni");
      if (parsed.workingHours !== undefined) changed.push("İş saatları");
      if (parsed.handoffNumber !== undefined) changed.push("Operator nömrəsi");
      if (parsed.languageConfig !== undefined || parsed.language !== undefined) changed.push("Dil konfiqurasiyası");
      if (parsed.sttVocabulary !== undefined) changed.push("Səs lüğəti");
      if (parsed.sttDomain !== undefined) changed.push("Sahə");
      if (parsed.sttTopic !== undefined) changed.push("Mövzu");
    }

    if (changed.length > 0) {
      return {
        title: `Ayarlar dəyişikliyi: ${changed.join(", ")}`,
        subtitle: "Sırf yuxarıda göstərilən parametrlərin yenilənməsi üçün təsdiq gözləyir",
      };
    }

    return {
      title: "Şirkət və agent ayarlarının yenilənməsi",
      subtitle: "Müəssisənin konfiqurasiya parametrləri",
    };
  }

  if (resource === "RAG") {
    if (action === "DELETE" || method === "DELETE") {
      const count = Array.isArray(parsed?.ids) ? parsed.ids.length : 1;
      return {
        title: `Bilik bazasından ${count} ədəd sənədin silinməsi`,
        subtitle: "Seçilmiş sənəd(lər) AI agentin bilik bazasından birdəfəlik silinəcək",
      };
    }
    if (parsed?.active !== undefined) {
      const count = Array.isArray(parsed?.ids) ? parsed.ids.length : 1;
      return {
        title: parsed.active
          ? `Bilik bazasında ${count} ədəd sənədin aktivləşdirilməsi`
          : `Bilik bazasında ${count} ədəd sənədin deaktiv edilməsi`,
        subtitle: parsed.active
          ? "Sənədlər yenidən zənglərdə cavablandırma üçün istifadə olunacaq"
          : "Sənədlər silinmir, lakin zənglərdə istifadəsi dayandırılır",
      };
    }
    if (action === "CREATE") {
      return {
        title: "Bilik bazasına yeni sənəd əlavəsi",
        subtitle: parsed?.category ? `Kateqoriya: ${parsed.category}` : undefined,
      };
    }
    if (action === "UPDATE") {
      return {
        title: "Bilik bazası sənədinin redaktəsi",
        subtitle: parsed?.category ? `Kateqoriya: ${parsed.category}` : undefined,
      };
    }
  }

  if (resource === "ROLES") {
    if (action === "DELETE" || method === "DELETE") {
      return { title: "Rolun silinməsi", subtitle: "İşçi rolu silinəcək" };
    }
    if (action === "CREATE") {
      return {
        title: `Yeni rolun yaradılması: "${parsed?.name || "Adsız rol"}"`,
        subtitle: parsed?.description || undefined,
      };
    }
    return {
      title: `Rolun redaktəsi: "${parsed?.name || "Mövcud rol"}"`,
      subtitle: parsed?.description || "İcazələr və təsvir yenilənir",
    };
  }

  if (resource === "DEPARTMENTS") {
    if (action === "DELETE" || method === "DELETE") {
      return { title: "Departamentin silinməsi", subtitle: "Departament ləğv ediləcək" };
    }
    return {
      title: `Departamentin ${action === "CREATE" ? "yaradılması" : "yenilənməsi"}: "${parsed?.name || ""}"`,
      subtitle: parsed?.description || undefined,
    };
  }

  if (resource === "USERS") {
    if (action === "DELETE" || method === "DELETE") {
      return { title: "İşçi hesabının silinməsi" };
    }
    return {
      title: `İşçi hesabının ${action === "CREATE" ? "əlavə edilməsi" : "redaktəsi"}: ${parsed?.email || ""}`,
      subtitle: parsed?.fullName ? `Ad: ${parsed.fullName}` : undefined,
    };
  }

  return { title: r.summary || `${r.resource} · ${r.action}` };
}

/** Təsdiq ediləcək dəyişikliklərin ətraflı vizual görüntüsü */
function ApprovalDetailCard({ approval }: { approval: Approval }) {
  const [showTechnical, setShowTechnical] = useState(false);

  let parsed: any = null;
  try {
    if (approval.body) parsed = JSON.parse(approval.body);
  } catch {}

  const resource = approval.resource?.toUpperCase();

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4 text-xs text-fg">
      {/* 1. Şirkət və Agent Ayarları - Sırf dəyişdirilən sahələr */}
      {(resource === "SETTINGS" || approval.path.includes("/config")) && parsed && (
        <div className="space-y-3">
          <div className="border-b border-border/80 pb-2 flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider text-fg-muted">
              Dəyişdirilən Parametrlər
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Yalnız tələb olunan yeniləmələr göstərilir
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {parsed.greetingText !== undefined && (
              <div className="col-span-full rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="block font-semibold text-emerald-800 dark:text-emerald-300">
                  Yeni Salamlama mətni:
                </span>
                <p className="mt-1 text-sm text-fg leading-relaxed">
                  "{parsed.greetingText || "—"}"
                </p>
              </div>
            )}

            {parsed.workingHours !== undefined && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="block font-semibold text-emerald-800 dark:text-emerald-300">
                  Yeni İş saatları:
                </span>
                <p className="mt-1 text-sm font-medium text-fg">{parsed.workingHours || "—"}</p>
              </div>
            )}

            {parsed.handoffNumber !== undefined && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="block font-semibold text-emerald-800 dark:text-emerald-300">
                  Yeni Operator yönləndirmə nömrəsi:
                </span>
                <p className="mt-1 font-mono text-sm font-medium text-fg">
                  {parsed.handoffNumber || "—"}
                </p>
              </div>
            )}

            {(parsed.languageConfig !== undefined || parsed.language !== undefined) && (
              <div className="col-span-full rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="block font-semibold text-emerald-800 dark:text-emerald-300">
                  Yeni Dil konfiqurasiyası:
                </span>
                {(() => {
                  const raw = parsed.languageConfig ?? parsed.language;
                  const langs = parseLanguages(raw);
                  const defInfo = SUPPORTED_LANGUAGES.find((l) => l.code === langs.def);
                  const suppList = langs.supported.map((code) => {
                    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
                    return found ? `${found.flag} ${found.nativeName}` : code;
                  });

                  return (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-fg-muted">Əsas dil: </span>
                        <span className="font-semibold text-fg">
                          {defInfo ? `${defInfo.flag} ${defInfo.nativeName}` : langs.def}
                        </span>
                      </div>
                      <div>
                        <span className="text-fg-muted">Dəstəklənən dillər: </span>
                        <span className="font-semibold text-fg">{suppList.join(", ")}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {parsed.sttVocabulary !== undefined && (
              <div className="col-span-full rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                <span className="block font-semibold text-emerald-800 dark:text-emerald-300">
                  Yeni Səs tanıma lüğəti:
                </span>
                <p className="mt-1 text-xs text-fg leading-relaxed">
                  {parsed.sttVocabulary || "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Bilik Bazası (RAG) */}
      {resource === "RAG" && parsed && (
        <div className="space-y-3">
          <div className="border-b border-border/80 pb-2">
            <span className="font-semibold uppercase tracking-wider text-fg-muted">
              Bilik Bazası Əməliyyatının Təfərrüatları
            </span>
          </div>

          {Array.isArray(parsed.ids) && (
            <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
              <span className="block font-medium text-fg-muted">Təsir Edən Sənəd Sayı:</span>
              <p className="mt-1 text-sm font-semibold text-fg">
                {parsed.ids.length} ədəd sənəd
              </p>
              {parsed.active !== undefined && (
                <p className="mt-1 text-xs text-fg-muted">
                  Tələb olunan status:{" "}
                  <span className="font-semibold text-fg">
                    {parsed.active ? "Aktivləşdirilsin" : "Deaktiv edilsin"}
                  </span>
                </p>
              )}
            </div>
          )}

          {parsed.category && (
            <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
              <span className="block font-medium text-fg-muted">Kateqoriya:</span>
              <p className="mt-1 text-sm font-medium text-fg">{parsed.category}</p>
            </div>
          )}

          {parsed.content && (
            <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
              <span className="block font-medium text-fg-muted">Sənədin Məzmunu:</span>
              <p className="mt-1 text-sm text-fg leading-relaxed whitespace-pre-wrap">
                {parsed.content}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Rollar və Departamentlər */}
      {(resource === "ROLES" || resource === "DEPARTMENTS") && parsed && (
        <div className="space-y-3">
          <div className="border-b border-border/80 pb-2">
            <span className="font-semibold uppercase tracking-wider text-fg-muted">
              Struktur Təfərrüatları
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {parsed.name && (
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <span className="block font-medium text-fg-muted">Adı:</span>
                <p className="mt-1 text-sm font-medium text-fg">{parsed.name}</p>
              </div>
            )}
            {parsed.description !== undefined && (
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <span className="block font-medium text-fg-muted">Təsvir:</span>
                <p className="mt-1 text-sm text-fg">{parsed.description || "—"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. İşçilər (USERS) */}
      {resource === "USERS" && parsed && (
        <div className="space-y-3">
          <div className="border-b border-border/80 pb-2">
            <span className="font-semibold uppercase tracking-wider text-fg-muted">
              İşçi Məlumatları
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {parsed.email && (
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <span className="block font-medium text-fg-muted">E-poçt:</span>
                <p className="mt-1 text-sm font-medium text-fg">{parsed.email}</p>
              </div>
            )}
            {parsed.fullName !== undefined && (
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <span className="block font-medium text-fg-muted">Ad, Soyad:</span>
                <p className="mt-1 text-sm text-fg">{parsed.fullName || "—"}</p>
              </div>
            )}
            {parsed.status && (
              <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
                <span className="block font-medium text-fg-muted">Vəziyyət:</span>
                <p className="mt-1 text-sm font-medium text-fg">
                  {parsed.status === "ACTIVE" ? "Aktiv" : "Bloklanıb"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Əgər yuxarıdakı kateqoriyalara düşməyibsə və sadəcə JSON varsa */}
      {resource !== "SETTINGS" &&
        resource !== "RAG" &&
        resource !== "ROLES" &&
        resource !== "DEPARTMENTS" &&
        resource !== "USERS" &&
        prettyBody(approval.body) && (
          <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
            <span className="block font-medium text-fg-muted">Dəyişiklik Məlumatı:</span>
            <pre className="mt-2 overflow-x-auto font-mono text-xs text-fg-muted whitespace-pre-wrap">
              {prettyBody(approval.body)}
            </pre>
          </div>
        )}

      {approval.decisionNote && (
        <div className="rounded-md border border-border/60 bg-surface-2/30 p-3">
          <span className="block font-medium text-fg-muted">Qərar qeydi:</span>
          <p className="mt-1 text-sm text-fg">{approval.decisionNote}</p>
        </div>
      )}

      {approval.failureDetail && <Alert tone="err">{approval.failureDetail}</Alert>}

      {/* Texniki HTTP detalları (Toggle) */}
      <div className="pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg transition-colors"
        >
          {showTechnical ? (
            <IconChevronDown width={13} height={13} />
          ) : (
            <IconChevronRight width={13} height={13} />
          )}
          Texniki detallar ({approval.method} {approval.path})
        </button>

        {showTechnical && (
          <div className="mt-2 space-y-2 rounded-md border border-border bg-surface-2 p-3 font-mono text-xs">
            <div>
              <span className="text-fg-faint">Endpoint: </span>
              <span className="text-fg-muted">
                {approval.method} {approval.path}
              </span>
            </div>
            {prettyBody(approval.body) && (
              <div>
                <span className="text-fg-faint">Raw JSON Payload:</span>
                <pre className="mt-1 overflow-x-auto rounded border border-border bg-surface p-2 text-fg-muted">
                  {prettyBody(approval.body)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Təsdiq növbəsi.
 *
 * Burada göstərilən əməliyyatlar HƏLƏ BAŞ VERMƏYİB. Ekran bunu açıq deyir.
 */
export function ApprovalsPage() {
  const tenantId = useAuthStore((s) => s.user?.tenantId);
  const myEmail = useAuthStore((s) => s.user?.email);

  const [tab, setTab] = useState("PENDING");
  const [rows, setRows] = useState<Approval[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setRows(await listApprovals(tenantId, tab || undefined));
      setError(null);
    } catch (e) {
      setError(errorText(e, "Siyahı yüklənmədi."));
    }
  }, [tenantId, tab]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const decide = async (row: Approval, approve: boolean) => {
    if (!tenantId) return;
    const note = approve
      ? undefined
      : (prompt("Rədd səbəbi (istəyə bağlı):") ?? undefined);
    setBusyId(row.id);
    setError(null);
    try {
      const result = approve
        ? await approveRequest(tenantId, row.id, note)
        : await rejectRequest(tenantId, row.id, note);
      if (result.status === "FAILED") {
        setError(result.failureDetail ?? "Əməliyyat icra olunmadı.");
      }
      await load();
    } catch (e) {
      setError(errorText(e, "Əməliyyat alınmadı."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Təsdiqlər"
        subtitle="Dəyişdirmə və silmə əməliyyatları burada gözləyir. Təsdiqlənənə qədər heç biri baş verməyib."
      />

      {error && <Alert tone="err">{error}</Alert>}

      <Card>
        <CardHeader
          title="Sorğular"
          actions={
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    tab === t.value
                      ? "bg-surface-2 text-fg font-medium"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />
        <CardBody className="p-0">
          {!rows ? (
            <div className="p-5">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title={tab === "PENDING" ? "Gözləyən sorğu yoxdur" : "Sorğu yoxdur"}
                message={
                  tab === "PENDING"
                    ? "Dəyişdirmə və ya silmə istənildikdə burada görünəcək."
                    : "Hələ heç bir əməliyyat təsdiqə göndərilməyib."
                }
              />
            </div>
          ) : (
            <TableContainer>
              <Table>
                <THead>
                  <TH>Əməliyyat</TH>
                  <TH>Kim istəyib</TH>
                  <TH>Nə vaxt</TH>
                  <TH>Vəziyyət</TH>
                  <TH className="text-right">Qərar</TH>
                </THead>
                <TBody>
                  {rows.flatMap((r) => {
                    const isOpen = open === r.id;
                    const mine = myEmail?.toLowerCase() === r.requestedByEmail.toLowerCase();
                    const summary = getHumanSummary(r);

                    return [
                      <TR
                        key={r.id}
                        className={`transition-colors ${isOpen ? "bg-surface-2/30" : ""}`}
                      >
                        <TD className="font-medium text-fg">
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : r.id)}
                            className="group flex flex-col items-start text-left"
                          >
                            <span className="font-semibold text-fg group-hover:underline flex items-center gap-1.5">
                              {isOpen ? (
                                <IconChevronDown width={14} height={14} className="text-fg-muted" />
                              ) : (
                                <IconChevronRight width={14} height={14} className="text-fg-muted" />
                              )}
                              {summary.title}
                            </span>
                            {summary.subtitle && (
                              <span className="mt-0.5 pl-5 text-xs text-fg-muted">
                                {summary.subtitle}
                              </span>
                            )}
                          </button>
                        </TD>
                        <TD className="text-fg-muted">
                          {r.requestedByEmail}
                          {mine && <span className="ml-2 text-xs text-fg-faint">(sən)</span>}
                        </TD>
                        <TD className="text-fg-muted">{formatDateTime(r.createdAt)}</TD>
                        <TD>
                          <StatusText tone={STATUS_TONE[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </StatusText>
                        </TD>
                        <TD className="text-right">
                          {r.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => decide(r, false)}
                              >
                                Rədd et
                              </Button>
                              <Button
                                size="sm"
                                loading={busyId === r.id}
                                onClick={() => decide(r, true)}
                              >
                                Təsdiqlə
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-fg-faint">
                              {r.decidedByEmail ?? "—"}
                              {r.decidedAt ? `, ${formatDateTime(r.decidedAt)}` : ""}
                            </span>
                          )}
                        </TD>
                      </TR>,

                      isOpen && (
                        <TR key={`${r.id}-detail`} className="bg-surface-2/40">
                          <TD colSpan={5} className="p-4">
                            <ApprovalDetailCard approval={r} />
                          </TD>
                        </TR>
                      ),
                    ];
                  })}
                </TBody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
