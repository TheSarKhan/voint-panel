import { useEffect, useState } from "react";
import { getAnalytics } from "../api/analytics";
import type { AnalyticsOverview } from "../api/types";
import { StatCard } from "../components/StatCard";
import { Card, PageHeader, Spinner } from "../components/ui";
import { formatDate, formatDuration, formatPercent } from "../lib/format";
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
            <span className="text-[11px] text-fg-faint">{formatDate(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const tenantId = useTenantId();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Səsli agentinizin ümumi göstəriciləri"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ümumi zəng"
          value={String(data.totalCalls)}
          hint="Son 30 gün"
        />
        <StatCard
          label="Həll olunma faizi"
          value={formatPercent(data.resolutionRate)}
          hint="Agent tərəfindən həll edilən"
        />
        <StatCard
          label="Rezervasiya"
          value={String(data.reservationCount)}
          hint="Agent tərəfindən toplanan"
        />
        <StatCard
          label="Orta müddət"
          value={formatDuration(data.avgDurationSec)}
          hint="dəqiqə:saniyə"
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
