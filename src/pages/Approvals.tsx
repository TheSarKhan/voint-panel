import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  approveRequest,
  listApprovals,
  rejectRequest,
  type Approval,
} from "../api/approvals";
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

/** Sorğunun gövdəsini oxunaqlı göstərir; JSON deyilsə olduğu kimi qalır. */
function prettyBody(body: string | null): string | null {
  if (!body) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

/**
 * Təsdiq növbəsi.
 *
 * Burada göstərilən əməliyyatlar HƏLƏ BAŞ VERMƏYİB. Ekran bunu açıq deməlidir: təsdiq
 * gözləyən dəyişiklik siyahısına baxıb "artıq olub" düşünmək, bu modulun mövcud olma
 * səbəbini tam tərsinə çevirir.
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
                      ? "bg-surface-2 text-fg"
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
                    return [
                      <TR key={r.id}>
                        <TD className="font-medium text-fg">
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : r.id)}
                            className="text-left hover:underline"
                          >
                            {r.summary}
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
                              {r.decidedAt ? ` · ${formatDateTime(r.decidedAt)}` : ""}
                            </span>
                          )}
                        </TD>
                      </TR>,

                      isOpen && (
                        <TR key={`${r.id}-detail`}>
                          <TD colSpan={5} className="bg-surface-2/40">
                            <div className="space-y-3 py-1">
                              <div>
                                <span className="text-xs text-fg-faint">Sorğu</span>
                                <p className="mt-1 break-all font-mono text-xs text-fg-muted">
                                  {r.method} {r.path}
                                </p>
                              </div>
                              {prettyBody(r.body) && (
                                <div>
                                  <span className="text-xs text-fg-faint">Göndərilən məlumat</span>
                                  <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-surface p-3 font-mono text-xs text-fg-muted">
                                    {prettyBody(r.body)}
                                  </pre>
                                </div>
                              )}
                              {r.decisionNote && (
                                <p className="text-sm text-fg-muted">
                                  Qeyd: {r.decisionNote}
                                </p>
                              )}
                              {r.failureDetail && (
                                <Alert tone="err">{r.failureDetail}</Alert>
                              )}
                            </div>
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
