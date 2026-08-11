import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalytics } from "../api/analytics";
import { getUsage, type UsageReport } from "../api/billing";
import { getQuestions } from "../api/questions";
import type { AnalyticsOverview } from "../api/types";
import { StatCard } from "../components/StatCard";
import { Alert, Card, PageHeader, Spinner } from "../components/ui";
import {
  formatDate,
  formatDayShort,
  formatDuration,
  formatPercent,
} from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

function CallsBarChart({ data }: { data: AnalyticsOverview["callsByDay"] | undefined }) {
  const days = data ?? [];
  const max = Math.max(...days.map((d) => d.count), 1);
  return (
    <div className="flex h-48 items-end gap-3">
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
              title={`${formatDate(d.date)}: ${d.count} zəng`}
            />
            <span className="text-[11px] text-fg-faint">{formatDayShort(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [openQuestions, setOpenQuestions] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalytics(tenantId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Analitika yüklənə bilmədi.");
      });
    // Kvota və cavabsız suallar ayrıca, kölgəsiz yüklənir - biri uğursuz olsa əsas
    // göstəricilər bundan asılı qalmamalıdır.
    getUsage(tenantId)
      .then((res) => {
        if (!cancelled) setUsage(res);
      })
      .catch(() => undefined);
    getQuestions(tenantId, "OPEN")
      .then((res) => {
        if (!cancelled) setOpenQuestions(res.length);
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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Səsli agentinizin ümumi göstəriciləri"
      />

      {blocked && (
        <div className="mb-6">
          <Alert tone="err" title="Aylıq dəqiqə həddinə çatılıb">
            Agent yeni zənglərə cavab vermir. Həddi artırmaq üçün Hesablaşma bölməsinə baxın.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Ümumi zəng"
          value={String(data.totalCalls)}
          hint="Son 30 gün"
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Həll olunma faizi"
          value={formatPercent(data.resolutionRate)}
          hint="Agent tərəfindən həll edilən"
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Cavabsız sual"
          value={openQuestions === null ? "—" : String(openQuestions)}
          hint="Bilik bazasında boşluq"
          onClick={() => navigate("/rag")}
        />
        <StatCard
          label="Orta müddət"
          value={formatDuration(data.avgDurationSec)}
          hint="dəqiqə:saniyə"
          onClick={() => navigate("/calls")}
        />
        <StatCard
          label="Kvota"
          value={capRatio == null ? "—" : formatPercent(Math.min(capRatio, 1))}
          hint={
            capRatio == null
              ? "Hədd təyin olunmayıb"
              : blocked
                ? "Bloklanıb"
                : capRatio >= 0.8
                  ? "Hədə yaxın"
                  : "Normal"
          }
          onClick={() => navigate("/billing")}
        />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-6 text-sm font-medium text-fg">
          Günlük zəng sayı (son 7 gün)
        </h2>
        <CallsBarChart data={data.callsByDay} />
      </Card>
    </div>
  );
}
