import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCall } from "../api/calls";
import type { CallDetail } from "../api/types";
import { IconArrowLeft } from "../components/icons";
import { Badge, Card, PageHeader, Spinner } from "../components/ui";
import { formatDateTime, formatDuration } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

export function CallDetailPage() {
  const { callId } = useParams<{ callId: string }>();
  const tenantId = useTenantId();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callId) return;
    let cancelled = false;
    getCall(tenantId, callId)
      .then((res) => {
        if (!cancelled) setCall(res);
      })
      .catch(() => {
        if (!cancelled) setError("Zəng tapılmadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, callId]);

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!call) return <Spinner />;

  return (
    <div>
      <Link
        to="/calls"
        className="mb-4 inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <IconArrowLeft width={14} height={14} />
        Zənglərə qayıt
      </Link>

      <PageHeader
        title={call.callerName ?? call.callerNumber}
        subtitle={`${call.callerNumber} · ${formatDateTime(call.startedAt)} · ${formatDuration(call.durationSec)}`}
        actions={
          <Badge tone={call.resolved ? "ok" : "warn"}>
            {call.resolved ? "Həll olundu" : "Həll olunmadı"}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* AI xülasə */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-fg">AI Xülasə</h2>
          <p className="text-sm leading-relaxed text-fg-muted">{call.summary}</p>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-faint">Mövzu</span>
              <span className="text-fg-muted">{call.topic}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-faint">Müddət</span>
              <span className="text-fg-muted">{formatDuration(call.durationSec)}</span>
            </div>
          </div>
        </Card>

        {/* Transkript */}
        <Card className="p-6 lg:col-span-3">
          <h2 className="mb-4 text-sm font-medium text-fg">Transkript</h2>
          {call.transcript.length === 0 ? (
            <p className="text-sm text-fg-faint">
              Bu zəng üçün transkript mövcud deyil.
            </p>
          ) : (
            <div className="space-y-4">
              {call.transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex ${line.speaker === "agent" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                      line.speaker === "agent"
                        ? "bg-surface-2 text-fg-muted"
                        : "bg-accent/10 text-fg"
                    }`}
                  >
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-faint">
                      {line.speaker === "agent" ? "Agent" : "Müştəri"} · {line.ts}
                    </p>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
