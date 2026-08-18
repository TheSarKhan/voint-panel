import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalytics } from "../api/analytics";
import { getUsage, type UsageReport } from "../api/billing";
import { getCalls } from "../api/calls";
import { getQuestions } from "../api/questions";
import type { AnalyticsOverview, CallSummary, UnansweredQuestion } from "../api/types";
import { StatCard } from "../components/StatCard";
import { Alert, Card, PageHeader, Spinner, StatusText } from "../components/ui";
import {
  formatDate,
  formatDateTime,
  formatDayShort,
  formatDuration,
  formatMinutes,
  formatMoney,
  formatPercent,
} from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import type { CallStatus } from "../api/types";

const RANGES = [
  { value: 7, label: "7 gün" },
  { value: 30, label: "30 gün" },
  { value: 90, label: "90 gün" },
] as const;

/** bucketDays > 1 (90-günlük aralıqda) hər çubuq bir həftədir - "17 iyul" əvəzinə "17 iyul həftəsi" oxunur. */
function CallsBarChart({
  data,
  bucketDays,
}: {
  data: AnalyticsOverview["callsByDay"] | undefined;
  bucketDays: number;
}) {
  const days = data ?? [];
  const max = Math.max(...days.map((d) => d.count), 1);
  return (
    <div className="flex h-48 items-end gap-1.5">
      {days.map((d) => {
        const h = Math.max((d.count / max) * 100, 4);
        return (
          <div
            key={d.date}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <span className="text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className="w-full rounded-t-sm bg-border-strong transition-colors group-hover:bg-fg-muted"
              style={{ height: `${h}%` }}
              title={
                bucketDays > 1
                  ? `${formatDate(d.date)} həftəsi: ${d.count} zəng`
                  : `${formatDate(d.date)}: ${d.count} zəng`
              }
            />
            <span className="text-[11px] text-fg-faint">
              {bucketDays > 1 ? formatDate(d.date) : formatDayShort(d.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Nəticə bölgüsü status kimi oxunur (Resolved=yaxşı, Handoff=diqqət tələb edir, Ongoing=
 * neytral/davam edir) - dataviz konvensiyasına görə status rəngləri (ok/warn/neytral),
 * ixtiyari kateqorial rənglər deyil.
 */
function OutcomeBreakdown({
  resolved,
  handoff,
  ongoing,
}: {
  resolved: number;
  handoff: number;
  ongoing: number;
}) {
  const total = resolved + handoff + ongoing;
  const rows: { label: string; value: number; barCls: string; textCls: string }[] = [
    { label: "Həll olundu", value: resolved, barCls: "bg-ok", textCls: "text-ok" },
    { label: "Operatora yönləndirildi", value: handoff, barCls: "bg-warn", textCls: "text-warn" },
    { label: "Davam edir", value: ongoing, barCls: "bg-border-strong", textCls: "text-fg-muted" },
  ];

  if (total === 0) {
    return <p className="text-sm text-fg-faint">Bu aralıqda zəng yoxdur.</p>;
  }

  return (
    <div>
      {/* Tək zolaq, 3 seqmentə bölünüb - hər seqment arasında 2px fon boşluğu (dataviz: stacked
          fills arasında ayırıcı boşluq), rəqəmlərin daha dəqiq müqayisəsi üçün donut yox, bar. */}
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-2">
        {rows
          .filter((r) => r.value > 0)
          .map((r) => (
            <div
              key={r.label}
              className={`h-full ${r.barCls}`}
              style={{ width: `${(r.value / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-fg-muted">
              <span className={`h-2 w-2 rounded-full ${r.barCls}`} />
              {r.label}
            </span>
            <span className={`font-medium ${r.textCls}`}>
              {r.value} · {formatPercent(total > 0 ? r.value / total : 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const outcomeLabel: Record<CallStatus, string> = {
  RESOLVED: "Həll olundu",
  HANDOFF: "Operatora yönləndirildi",
  ONGOING: "Davam edir",
};
const outcomeTone: Record<CallStatus, "ok" | "warn" | "neutral"> = {
  RESOLVED: "ok",
  HANDOFF: "warn",
  ONGOING: "neutral",
};

export function DashboardPage() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallSummary[] | null>(null);
  const [openQuestions, setOpenQuestions] = useState<UnansweredQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalytics(tenantId, range)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Analitika yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, range]);

  // Aralıqdan asılı deyil - bunlar həmişə "cari vəziyyət"dir (bu ayın hesabı, indiki açıq
  // suallar, son zənglər), 7/30/90 seçimi yalnız yuxarıdakı statlara/qrafikə aiddir.
  useEffect(() => {
    let cancelled = false;
    getUsage(tenantId)
      .then((res) => {
        if (!cancelled) setUsage(res);
      })
      .catch(() => undefined);
    getQuestions(tenantId, "OPEN")
      .then((res) => {
        if (!cancelled) setOpenQuestions(res);
      })
      .catch(() => undefined);
    getCalls(tenantId)
      .then((res) => {
        if (!cancelled) setRecentCalls(res.slice(0, 5));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!data) return <Spinner />;

  const capRatio =
    usage?.plan.monthlyMinuteCap && usage.plan.capPercentUsed != null
      ? usage.plan.capPercentUsed / 100
      : null;
  const blocked = capRatio != null && capRatio >= 1;
  const nearCap = capRatio != null && capRatio >= 0.8;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Səsli agentinizin ümumi göstəriciləri"
        actions={
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === r.value
                    ? "bg-accent text-accent-fg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {blocked && (
        <div className="mb-6">
          <Alert tone="err" title="Aylıq dəqiqə həddinə çatılıb">
            Agent yeni zənglərə cavab vermir. Həddi artırmaq üçün Hesablaşma bölməsinə baxın.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ümumi zəng"
          value={String(data.totalCalls)}
          hint={`Son ${range} gün`}
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Həll olunma faizi"
          value={formatPercent(data.resolutionRate)}
          hint="Agent tərəfindən həll edilən"
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Orta müddət"
          value={formatDuration(data.avgDurationSec)}
          hint="dəqiqə:saniyə"
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Cavabsız sual"
          value={openQuestions === null ? "—" : String(openQuestions.length)}
          hint="Bilik bazasında boşluq"
          onClick={() => navigate("/rag")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-6 text-sm font-medium text-fg">
            {data.bucketDays > 1 ? `Həftəlik zəng sayı (son ${range} gün)` : `Günlük zəng sayı (son ${range} gün)`}
          </h2>
          <CallsBarChart data={data.callsByDay} bucketDays={data.bucketDays} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-sm font-medium text-fg">Zəng nəticəsi</h2>
          <OutcomeBreakdown
            resolved={data.resolvedCalls}
            handoff={data.handoffCalls}
            ongoing={data.ongoingCalls}
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-medium text-fg">Bu ayın istifadəsi</h2>
          {usage ? (
            <>
              <p className="mb-4 text-xs text-fg-faint">{usage.usage.calls} zəng</p>
              <p className="text-2xl font-semibold text-fg">
                {formatMinutes(usage.usage.minutes)}
                {usage.plan.monthlyMinuteCap > 0 && (
                  <span className="text-sm font-normal text-fg-faint">
                    {" "}
                    / {formatMinutes(usage.plan.monthlyMinuteCap)}
                  </span>
                )}
              </p>
              {capRatio != null && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      blocked ? "bg-err" : nearCap ? "bg-warn" : "bg-ok"
                    }`}
                    style={{ width: `${Math.min(capRatio, 1) * 100}%` }}
                  />
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-fg-faint">Təxmini hesab</span>
                <span className="font-medium text-fg">{formatMoney(usage.invoiceAzn)}</span>
              </div>
            </>
          ) : (
            <Spinner compact />
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-fg">Son zənglər</h2>
            <button
              type="button"
              onClick={() => navigate("/calls")}
              className="text-xs text-fg-faint transition-colors hover:text-fg-muted"
            >
              Hamısı
            </button>
          </div>
          {recentCalls === null ? (
            <Spinner compact />
          ) : recentCalls.length === 0 ? (
            <p className="text-sm text-fg-faint">Hələ zəng yoxdur.</p>
          ) : (
            <ul className="space-y-3">
              {recentCalls.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/calls/${c.id}`)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-fg">{c.callerNumber}</span>
                      <span className="block text-xs text-fg-faint">{formatDateTime(c.startedAt)}</span>
                    </span>
                    <StatusText tone={outcomeTone[c.status]} className="shrink-0">
                      {outcomeLabel[c.status]}
                    </StatusText>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-fg">Açıq suallar</h2>
            <button
              type="button"
              onClick={() => navigate("/rag")}
              className="text-xs text-fg-faint transition-colors hover:text-fg-muted"
            >
              Hamısı
            </button>
          </div>
          {openQuestions === null ? (
            <Spinner compact />
          ) : openQuestions.length === 0 ? (
            <p className="text-sm text-fg-faint">Açıq sual yoxdur.</p>
          ) : (
            <ul className="space-y-3">
              {openQuestions.slice(0, 4).map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => navigate("/rag")}
                    className="block w-full text-left"
                  >
                    <span className="line-clamp-2 text-sm text-fg">{q.question}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
