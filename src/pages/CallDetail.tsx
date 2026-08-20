import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  Globe,
  Bot,
  FileText,
} from "lucide-react";
import { getCall } from "../api/calls";
import type { CallDetail, UnansweredQuestion } from "../api/types";
import { UnansweredQuestions } from "../components/UnansweredQuestions";
import {
  GlassButton,
  GlassCard,
  StatusText,
} from "../components/kit";
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

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!call) {
    return (
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-[#f5f5f5] rounded-md" />
        <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── BACK BUTTON ── */}
      <Link
        to="/calls"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Bütün zənglərə qayıt</span>
      </Link>

      {/* ── HEADER CARD ── */}
      <GlassCard className="p-6 sm:p-8 bg-white/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight font-mono">
                {call.callerNumber}
              </h1>
              <StatusText variant={call.resolved ? "ok" : "warn"}>
                {call.resolved ? "Həll olundu" : "Operatora yönləndirildi"}
              </StatusText>
            </div>

            <p className="text-xs text-[#6b6b6b] mt-1.5 flex items-center gap-4">
              <span>{formatDateTime(call.startedAt)}</span>
              <span>Müddət: {formatDuration(call.durationSec)}</span>
              {call.languageDetected && <span>Dil: {call.languageDetected}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {call.callerNumber && (
              <GlassButton
                variant="secondary"
                size="sm"
                leftIcon={<User className="h-3.5 w-3.5" />}
                onClick={() => navigate(`/customers?phone=${encodeURIComponent(call.callerNumber)}`)}
              >
                Müştəri Kartı
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── UNANSWERED QUESTIONS SECTION ── */}
      <UnansweredQuestions
        tenantId={tenantId}
        questions={call.unansweredQuestions}
        onChanged={applyQuestion}
      />

      {/* ── TWO-COLUMN DETAILS: AI SUMMARY + TRANSCRIPT ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left 4 cols: AI Summary */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-6 bg-white/95 space-y-4">
            <div className="flex items-center gap-2 text-[#0a0a0a] font-semibold text-sm border-b border-[#e5e5e5] pb-3">
              <Bot className="h-4 w-4" />
              <span>AI Nəticə Xülasəsi</span>
            </div>

            {call.summary ? (
              <p className="text-xs sm:text-sm leading-relaxed text-[#0a0a0a]">
                {call.summary}
              </p>
            ) : (
              <p className="text-xs text-[#6b6b6b]">
                Bu zəng üçün AI xülasə hələ formalaşmayıb.
              </p>
            )}

            <div className="space-y-2 border-t border-[#e5e5e5] pt-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e5e5e5]/60">
                <span className="text-[#6b6b6b] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Dil
                </span>
                <span className="font-medium text-[#0a0a0a]">{call.languageDetected ?? "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6b6b6b] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Danışıq vaxtı
                </span>
                <span className="font-mono text-[#0a0a0a]">{formatDuration(call.durationSec)}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right 8 cols: Transcript */}
        <div className="lg:col-span-8">
          <GlassCard className="p-6 bg-white/95 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <div className="flex items-center gap-2 text-[#0a0a0a] font-semibold text-sm">
                <FileText className="h-4 w-4" />
                <span>Dialoq Transkripsiyası</span>
              </div>

              {call.cleanedTranscript && (
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors cursor-pointer"
                >
                  {showRaw ? "Təmizlənmiş versiya" : "Xam transkript"}
                </button>
              )}
            </div>

            {call.cleanedTranscript && !showRaw ? (
              <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#0a0a0a] bg-[#fafafa] p-4 rounded-2xl border border-[#e5e5e5]">
                {call.cleanedTranscript}
              </p>
            ) : call.transcript ? (
              <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#0a0a0a] bg-[#fafafa] p-4 rounded-2xl border border-[#e5e5e5]">
                {call.transcript}
              </p>
            ) : (
              <p className="text-xs text-[#6b6b6b] py-6 text-center">
                Bu zəng üçün transkript mətni mövcud deyil.
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
