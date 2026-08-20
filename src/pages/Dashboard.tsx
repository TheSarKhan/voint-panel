import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneIncoming,
  Clock,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getAnalytics } from "../api/analytics";
import { getUsage, type UsageReport } from "../api/billing";
import { getCalls } from "../api/calls";
import { getQuestions } from "../api/questions";
import type { AnalyticsOverview, CallSummary, UnansweredQuestion } from "../api/types";
import {
  GlassCard,
  StatCardGlass,
  StatusText,
  GlassButton,
  TactileSegmentedControl,
} from "../components/kit";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMinutes,
  formatMoney,
  formatPercent,
} from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

function CallsBarChart({
  data,
}: {
  data: AnalyticsOverview["callsByDay"] | undefined;
  bucketDays?: number;
}) {
  const days = data ?? [];
  const max = Math.max(...days.map((d) => d.count), 1);

  // Pick ~6 evenly spaced indices to show date labels cleanly without overflow
  const labelInterval = Math.max(1, Math.floor(days.length / 6));

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end gap-1 sm:gap-1.5 pt-6 pb-2">
        {days.map((d) => {
          const h = d.count === 0 ? 3 : Math.max((d.count / max) * 100, 8);
          const isHighest = d.count === max && max > 0;

          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center h-full justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 whitespace-nowrap px-2 py-1 rounded-md bg-[#0a0a0a] text-white text-[11px] font-mono shadow-md">
                {formatDate(d.date)}: {d.count} zəng
              </div>

              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isHighest
                    ? "bg-[#0a0a0a]"
                    : d.count > 0
                    ? "bg-[#0a0a0a]/70 hover:bg-[#0a0a0a]"
                    : "bg-[#e5e5e5] hover:bg-[#d4d4d4]"
                }`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Responsive Clean Date Labels — Spaced Evenly */}
      <div className="flex justify-between items-center text-[11px] text-[#6b6b6b] font-mono border-t border-[#e5e5e5] pt-2 px-1">
        {days
          .filter((_, i) => i === 0 || i === days.length - 1 || i % labelInterval === 0)
          .map((d) => (
            <span key={d.date}>
              {formatDate(d.date).slice(0, 5)}
            </span>
          ))}
      </div>
    </div>
  );
}

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
  const rows = [
    { label: "Həll olundu", value: resolved, statusVariant: "ok" as const, barCls: "bg-[#0a0a0a]" },
    { label: "Operatora yönləndirildi", value: handoff, statusVariant: "warn" as const, barCls: "bg-amber-500" },
    { label: "Davam edir", value: ongoing, statusVariant: "muted" as const, barCls: "bg-[#d4d4d4]" },
  ];

  if (total === 0) {
    return <p className="text-xs text-[#6b6b6b] py-4">Bu aralıqda zəng yoxdur.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Stacked Bar */}
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-[#f5f5f5] p-0.5 border border-[#e5e5e5]">
        {rows
          .filter((r) => r.value > 0)
          .map((r) => (
            <div
              key={r.label}
              className={`h-full rounded-full ${r.barCls}`}
              style={{ width: `${(r.value / total) * 100}%` }}
            />
          ))}
      </div>

      {/* Metric Breakdown Rows */}
      <div className="space-y-3 pt-1">
        {rows.map((r) => {
          const pct = total > 0 ? (r.value / total) * 100 : 0;
          return (
            <div key={r.label} className="flex items-center justify-between text-xs">
              <span className="text-[#6b6b6b] font-medium">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0a0a0a] font-mono">{r.value}</span>
                <StatusText variant={r.statusVariant}>
                  ({pct.toFixed(0)}%)
                </StatusText>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallSummary[] | null>(null);
  const [openQuestions, setOpenQuestions] = useState<UnansweredQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rangeDays = Number(range) as 7 | 30 | 90;

  useEffect(() => {
    let cancelled = false;
    getAnalytics(tenantId, rangeDays)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Analitika yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, rangeDays]);

  useEffect(() => {
    let cancelled = false;
    getUsage(tenantId)
      .then((res) => {
        if (!cancelled && res) setUsage(res);
      })
      .catch(() => undefined);

    getQuestions(tenantId, "OPEN")
      .then((res) => {
        if (!cancelled && res) setOpenQuestions(res);
      })
      .catch(() => undefined);

    getCalls(tenantId)
      .then((res) => {
        if (!cancelled && res) setRecentCalls(res.slice(0, 5));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#f5f5f5] rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
        </div>
      </div>
    );
  }

  const capRatio =
    usage?.plan.monthlyMinuteCap && usage.plan.capPercentUsed != null
      ? usage.plan.capPercentUsed / 100
      : null;
  const blocked = capRatio != null && capRatio >= 1;

  // Generate sparkline datasets from callsByDay
  const chartPoints = (data.callsByDay ?? []).map((d) => d.count);
  const sparklineData = chartPoints.length > 0 ? chartPoints : [0, 4, 8, 12, 16, 20, 24];

  return (
    <div className="space-y-8 font-sans">
      {/* ── HEADER & RANGE SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
            Səsli agentinizin zəng fəallığı və cari göstəriciləri
          </p>
        </div>

        <TactileSegmentedControl
          options={[
            { value: "7", label: "7 gün" },
            { value: "30", label: "30 gün" },
            { value: "90", label: "90 gün" },
          ]}
          value={range}
          onChange={(val) => setRange(val as any)}
          size="sm"
        />
      </div>

      {blocked && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
          <span>
            Aylıq dəqiqə limitinizə çatmısınız. Agent yeni zənglərə cavab verməyi dayandırıb. Zəhmət olmasa Hesablaşma bölməsindən paketinizi yeniləyin.
          </span>
        </div>
      )}

      {/* ── TOP 4 METRIC CARDS (UI-KIT STATCARDGLASS WITH SPARKLINES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardGlass
          title="Ümumi zənglər"
          value={String(data.totalCalls)}
          change={{ value: `Son ${range} gün`, trend: "up", label: "fəallıq" }}
          icon={<PhoneIncoming className="h-5 w-5" />}
          chartData={sparklineData}
        />

        <StatCardGlass
          title="Həll olunma faizi"
          value={formatPercent(data.resolutionRate)}
          change={{ value: "Agent həll etdi", trend: "up", label: "dəqiqlik" }}
          icon={<TrendingUp className="h-5 w-5" />}
          chartData={[70, 75, 80, 85, 90, 95, 100]}
        />

        <StatCardGlass
          title="Orta zəng müddəti"
          value={formatDuration(data.avgDurationSec)}
          change={{ value: "dəqiqə:saniyə", trend: "neutral", label: "orta vaxt" }}
          icon={<Clock className="h-5 w-5" />}
          chartData={[30, 45, 60, 50, 65, 55, 70]}
        />

        <StatCardGlass
          title="Cavabsız suallar"
          value={openQuestions === null ? "0" : String(openQuestions.length)}
          change={{ value: "Bilik bazası", trend: openQuestions && openQuestions.length > 0 ? "down" : "neutral", label: "tamamlanmalı" }}
          icon={<HelpCircle className="h-5 w-5" />}
          chartData={[2, 1, 3, 2, 1, 0, openQuestions?.length ?? 0]}
        />
      </div>

      {/* ── MAIN CHARTS: CALLS BAR CHART + OUTCOME BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <GlassCard className="p-6 bg-white/95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0a0a0a]">
                  {data.bucketDays > 1 ? `Həftəlik zəng sayı (son ${range} gün)` : `Günlük zəng sayı (son ${range} gün)`}
                </h3>
                <p className="text-xs text-[#6b6b6b] mt-0.5">
                  Daxil olan zənglərin vaxt üzrə paylanması
                </p>
              </div>
              <span className="text-xs font-mono text-[#6b6b6b]">
                Cəmi: {data.totalCalls} zəng
              </span>
            </div>

            <CallsBarChart data={data.callsByDay} bucketDays={data.bucketDays} />
          </GlassCard>
        </div>

        <div className="lg:col-span-4">
          <GlassCard className="p-6 bg-white/95">
            <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1">
              Zəng nəticəsi
            </h3>
            <p className="text-xs text-[#6b6b6b] mb-4">
              AI və insan operatoru arasında paylanma
            </p>

            <OutcomeBreakdown
              resolved={data.resolvedCalls}
              handoff={data.handoffCalls}
              ongoing={data.ongoingCalls}
            />
          </GlassCard>
        </div>
      </div>

      {/* ── BOTTOM 3 BENTO CARDS: USAGE, RECENT CALLS, UNANSWERED QUESTIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Monthly Usage Card */}
        <GlassCard className="p-6 bg-white/95 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#0a0a0a]">
                Bu ayın istifadəsi
              </h3>
              <span className="text-xs font-mono text-[#6b6b6b]">
                {usage ? `${usage.usage.calls} zəng` : "—"}
              </span>
            </div>

            {usage ? (
              <div className="space-y-3 mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-[#0a0a0a]">
                    {formatMinutes(usage.usage.minutes)}
                  </span>
                  {usage.plan.monthlyMinuteCap > 0 && (
                    <span className="text-xs text-[#6b6b6b] font-mono">
                      / {formatMinutes(usage.plan.monthlyMinuteCap)}
                    </span>
                  )}
                </div>

                {/* Clean Full-Width Progress Track without strange tiny green dot */}
                {capRatio != null && (
                  <div className="w-full bg-[#f0f0f0] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        blocked
                          ? "bg-red-600"
                          : capRatio >= 0.8
                          ? "bg-amber-500"
                          : "bg-[#0a0a0a]"
                      }`}
                      style={{
                        width: `${Math.max(capRatio > 0 ? 3 : 0, Math.min(capRatio * 100, 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 space-y-2 animate-pulse">
                <div className="h-6 w-32 bg-[#f5f5f5] rounded-md" />
                <div className="h-2 w-full bg-[#f5f5f5] rounded-full" />
              </div>
            )}
          </div>

          {usage && (
            <div className="mt-6 pt-4 border-t border-[#e5e5e5] flex items-center justify-between text-xs">
              <span className="text-[#6b6b6b]">Təxmini hesab:</span>
              <span className="font-semibold text-[#0a0a0a] font-mono text-sm">
                {formatMoney(usage.invoiceAzn)}
              </span>
            </div>
          )}
        </GlassCard>

        {/* 2. Recent Calls Card */}
        <GlassCard className="p-6 bg-white/95 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0a0a0a]">
                Son zənglər
              </h3>
              <GlassButton
                variant="ghost"
                size="xs"
                onClick={() => navigate("/calls")}
                rightIcon={<ArrowRight className="h-3 w-3" />}
              >
                Hamısı
              </GlassButton>
            </div>

            {recentCalls === null ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-4 w-full bg-[#f5f5f5] rounded" />
                <div className="h-4 w-3/4 bg-[#f5f5f5] rounded" />
              </div>
            ) : recentCalls.length === 0 ? (
              <p className="text-xs text-[#6b6b6b] py-6 text-center">Hələ zəng qeydə alınmayıb.</p>
            ) : (
              <div className="space-y-2.5">
                {recentCalls.map((c) => {
                  const statusTone =
                    c.status === "RESOLVED"
                      ? ("ok" as const)
                      : c.status === "HANDOFF"
                      ? ("warn" as const)
                      : ("muted" as const);

                  const statusText =
                    c.status === "RESOLVED"
                      ? "Uğurlu"
                      : c.status === "HANDOFF"
                      ? "Yönləndirildi"
                      : "Davam edir";

                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/calls/${c.id}`)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fafafa] transition-colors cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#0a0a0a] font-mono block">
                          {c.callerNumber}
                        </span>
                        <span className="text-[11px] text-[#6b6b6b]">
                          {formatDateTime(c.startedAt)}
                        </span>
                      </div>

                      <StatusText variant={statusTone}>
                        {statusText}
                      </StatusText>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* 3. Open Questions Card */}
        <GlassCard className="p-6 bg-white/95 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0a0a0a]">
                Açıq suallar
              </h3>
              <GlassButton
                variant="ghost"
                size="xs"
                onClick={() => navigate("/rag")}
                rightIcon={<ArrowRight className="h-3 w-3" />}
              >
                Hamısı
              </GlassButton>
            </div>

            {openQuestions === null ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-4 w-full bg-[#f5f5f5] rounded" />
                <div className="h-4 w-3/4 bg-[#f5f5f5] rounded" />
              </div>
            ) : openQuestions.length === 0 ? (
              <p className="text-xs text-[#6b6b6b] py-6 text-center">Bütün suallar cavablandırılıb.</p>
            ) : (
              <div className="space-y-2.5">
                {openQuestions.slice(0, 4).map((q) => (
                  <div
                    key={q.id}
                    onClick={() => navigate("/rag")}
                    className="p-2.5 rounded-xl border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all cursor-pointer text-xs bg-white"
                  >
                    <p className="text-[#0a0a0a] font-medium line-clamp-2">
                      {q.question}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
