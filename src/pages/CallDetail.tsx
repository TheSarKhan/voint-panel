import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCall } from "../api/calls";
import type { CallDetail, UnansweredQuestion } from "../api/types";
import { IconArrowLeft, IconUser } from "../components/icons";
import { UnansweredQuestions } from "../components/UnansweredQuestions";
import { Button, Card, PageHeader, Spinner, StatusText } from "../components/ui";
import { formatDateTime, formatDuration } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

export function CallDetailPage() {
  const { callId } = useParams<{ callId: string }>();
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

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

  // Sual baglananda butun sehifeni yeniden yuklemek lazim deyil - deyisen yalniz bir setirdir.
  const applyQuestion = (updated: UnansweredQuestion) =>
    setCall((prev) =>
      prev
        ? {
            ...prev,
            unansweredQuestions: prev.unansweredQuestions.map((q) =>
              q.id === updated.id ? updated : q,
            ),
          }
        : prev,
    );

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
        title={call.callerNumber}
        subtitle={`${formatDateTime(call.startedAt)}, ${formatDuration(call.durationSec)}${call.languageDetected ? `, ${call.languageDetected}` : ""}`}
        actions={
          <div className="flex items-center gap-4">
            <StatusText tone={call.resolved ? "ok" : "warn"}>
              {call.resolved ? "Həll olundu" : "Həll olunmadı"}
            </StatusText>
            {call.callerNumber && (
              <Button
                variant="ghost"
                size="sm"
                icon={IconUser}
                onClick={() => navigate(`/customers?phone=${encodeURIComponent(call.callerNumber)}`)}
              >
                Müştəri kartına bax
              </Button>
            )}
          </div>
        }
      />

      <UnansweredQuestions
        tenantId={tenantId}
        questions={call.unansweredQuestions}
        onChanged={applyQuestion}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* AI xülasə */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-fg">AI Xülasə</h2>
          {call.summary ? (
            <p className="text-sm leading-relaxed text-fg-muted">{call.summary}</p>
          ) : (
            <p className="text-sm text-fg-faint">
              Bu zəng üçün AI xülasə hələ mövcud deyil.
            </p>
          )}
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-faint">Dil</span>
              <span className="text-fg-muted">{call.languageDetected ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-faint">Müddət</span>
              <span className="text-fg-muted">{formatDuration(call.durationSec)}</span>
            </div>
          </div>
        </Card>

        {/* Transkript */}
        <Card className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-fg">Transkript</h2>
            {call.cleanedTranscript && (
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="text-xs text-fg-faint underline decoration-dotted transition-colors hover:text-fg-muted"
              >
                {showRaw ? "Təmizlənmiş versiyaya keç" : "Xam (orijinal) transkriptə bax"}
              </button>
            )}
          </div>
          {call.cleanedTranscript && !showRaw ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {call.cleanedTranscript}
            </p>
          ) : call.transcript ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {call.transcript}
            </p>
          ) : (
            <p className="text-sm text-fg-faint">
              Bu zəng üçün transkript mövcud deyil.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
