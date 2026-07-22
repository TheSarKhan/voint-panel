import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCalls } from "../api/calls";
import type { CallStatus, CallSummary } from "../api/types";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../components/ui";
import { formatDateTime, formatDuration } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

const statusLabels: Record<CallStatus, { label: string; tone: "ok" | "warn" | "err" | "neutral" }> = {
  COMPLETED: { label: "Tamamlandı", tone: "ok" },
  MISSED: { label: "Cavabsız", tone: "err" },
  HANDED_OFF: { label: "Operatora ötürüldü", tone: "warn" },
  IN_PROGRESS: { label: "Davam edir", tone: "neutral" },
};

export function CallsPage() {
  const tenantId = useTenantId();
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCalls(tenantId)
      .then((res) => {
        if (!cancelled) setCalls(res);
      })
      .catch(() => {
        if (!cancelled) setError("Zənglər yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!calls) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Zənglər"
        subtitle="Agentin cavablandırdığı bütün zənglər"
      />

      <Card>
        {calls.length === 0 ? (
          <EmptyState message="Hələ zəng qeydə alınmayıb." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-faint">
                  <th className="px-5 py-3 font-medium">Nömrə</th>
                  <th className="px-5 py-3 font-medium">Mövzu</th>
                  <th className="px-5 py-3 font-medium">Tarix</th>
                  <th className="px-5 py-3 font-medium">Müddət</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const st = statusLabels[call.status];
                  return (
                    <tr
                      key={call.id}
                      className="border-b border-border/60 last:border-0 hover:bg-surface-2/60"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/calls/${call.id}`}
                          className="font-medium text-fg hover:underline"
                        >
                          {call.callerName ?? call.callerNumber}
                        </Link>
                        {call.callerName && (
                          <p className="text-xs text-fg-faint">{call.callerNumber}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-fg-muted">{call.topic}</td>
                      <td className="px-5 py-3 text-fg-muted">
                        {formatDateTime(call.startedAt)}
                      </td>
                      <td className="px-5 py-3 text-fg-muted">
                        {formatDuration(call.durationSec)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
