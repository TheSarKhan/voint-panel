import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneIncoming,
  TrendingUp,
  Clock,
  HelpCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { getCalls } from "../api/calls";
import type { CallStatus, CallSummary } from "../api/types";
import {
  StatCardGlass,
  StatusText,
  GlassTableContainer,
  GlassTable,
  GlassTHead,
  GlassTH,
  GlassTBody,
  GlassTR,
  GlassTD,
  GlassButton,
} from "../components/kit";
import { formatDateTime, formatDuration, formatPercent } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

const statusMap: Record<CallStatus, { label: string; variant: "ok" | "warn" | "muted" }> = {
  RESOLVED: { label: "Həll olundu", variant: "ok" },
  HANDOFF: { label: "Operatora yönləndirildi", variant: "warn" },
  ONGOING: { label: "Davam edir", variant: "muted" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Bütün statuslar" },
  { value: "RESOLVED", label: "Həll olundu" },
  { value: "HANDOFF", label: "Operatora yönləndirildi" },
  { value: "ONGOING", label: "Davam edir" },
];

export function CallsPage() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  const filteredCalls = useMemo(() => {
    let list = calls ?? [];
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => (c.callerNumber ?? "").toLowerCase().includes(q));
    return list;
  }, [calls, query, statusFilter]);

  const stats = useMemo(() => {
    if (filteredCalls.length === 0) return null;
    const resolved = filteredCalls.filter((c) => c.status === "RESOLVED").length;
    const handoff = filteredCalls.filter((c) => c.status === "HANDOFF").length;
    const openQuestions = filteredCalls.reduce((sum, c) => sum + c.openQuestionCount, 0);
    const totalDuration = filteredCalls.reduce((sum, c) => sum + c.durationSec, 0);
    return {
      total: filteredCalls.length,
      resolutionRate: resolved / filteredCalls.length,
      handoff,
      openQuestions,
      avgDuration: Math.round(totalDuration / filteredCalls.length),
    };
  }, [filteredCalls]);

  const pageCount = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filteredCalls.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredCalls, safePage, pageSize]
  );

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!calls) {
    return (
      <div className="py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#f5f5f5] rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* ── HEADER ── */}
      <div className="border-b border-[#e5e5e5] pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight">
          Zənglər Tarixçəsi
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
          Səsli süni intellekt köməkçisinin qəbul etdiyi bütün zənglər və audio qeydlər
        </p>
      </div>

      {/* ── METRIC STATS ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardGlass
            title="Ümumi zənglər"
            value={String(stats.total)}
            change={{ value: "Siyahıdakı zənglər", trend: "up", label: "qeydə alındı" }}
            icon={<PhoneIncoming className="h-5 w-5" />}
            chartData={[10, 15, 20, 25, 30, 35, stats.total]}
          />

          <StatCardGlass
            title="Həll olunma faizi"
            value={formatPercent(stats.resolutionRate)}
            change={{ value: `${stats.handoff} insana yönləndi`, trend: "up", label: "dəqiqlik" }}
            icon={<TrendingUp className="h-5 w-5" />}
            chartData={[75, 80, 85, 90, 92, 95, Math.round(stats.resolutionRate * 100)]}
          />

          <StatCardGlass
            title="Orta müddət"
            value={formatDuration(stats.avgDuration)}
            change={{ value: "dəqiqə:saniyə", trend: "neutral", label: "orta vaxt" }}
            icon={<Clock className="h-5 w-5" />}
            chartData={[30, 45, 60, 50, 65, 55, stats.avgDuration]}
          />

          <StatCardGlass
            title="Cavabsız suallar"
            value={String(stats.openQuestions)}
            change={{ value: "Bilik bazası", trend: stats.openQuestions > 0 ? "down" : "neutral", label: "tamamlanmalı" }}
            icon={<HelpCircle className="h-5 w-5" />}
            chartData={[1, 2, 0, 1, 0, stats.openQuestions]}
          />
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Nömrəyə görə axtar..."
            className="h-10 w-full rounded-full border border-[#e5e5e5] bg-white pl-10 pr-4 text-xs sm:text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-full border border-[#e5e5e5] bg-white px-4 text-xs sm:text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition-colors shadow-xs cursor-pointer"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CALLS TABLE (GLASS CONTAINER) ── */}
      <GlassTableContainer>
        {filteredCalls.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#6b6b6b]">
            Axtarışa uyğun heç bir zəng tapılmadı.
          </div>
        ) : (
          <>
            <GlassTable>
              <GlassTHead>
                <tr>
                  <GlassTH>Nömrə</GlassTH>
                  <GlassTH>Dil</GlassTH>
                  <GlassTH>Tarix</GlassTH>
                  <GlassTH>Müddət</GlassTH>
                  <GlassTH>Status</GlassTH>
                  <GlassTH>Bilik Bazası</GlassTH>
                  <GlassTH className="text-right">Əməliyyat</GlassTH>
                </tr>
              </GlassTHead>

              <GlassTBody>
                {visible.map((call) => {
                  const st = statusMap[call.status] ?? { label: call.status, variant: "muted" as const };

                  return (
                    <GlassTR
                      key={call.id}
                      clickable
                      onClick={() => navigate(`/calls/${call.id}`)}
                    >
                      <GlassTD>
                        <span className="font-mono font-semibold text-[#0a0a0a] text-xs sm:text-sm">
                          {call.callerNumber ?? "Naməlum nömrə"}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="text-[#6b6b6b] text-xs">
                          {call.languageDetected ?? "—"}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="text-[#0a0a0a] text-xs">
                          {formatDateTime(call.startedAt)}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="font-mono text-xs text-[#0a0a0a]">
                          {formatDuration(call.durationSec)}
                        </span>
                      </GlassTD>

                      {/* Plain Status Text — NO badges, NO dots */}
                      <GlassTD>
                        <StatusText variant={st.variant}>
                          {st.label}
                        </StatusText>
                      </GlassTD>

                      <GlassTD>
                        {call.openQuestionCount > 0 ? (
                          <StatusText variant="warn">
                            {call.openQuestionCount} cavabsız sual
                          </StatusText>
                        ) : (
                          <span className="text-[#6b6b6b] text-xs">—</span>
                        )}
                      </GlassTD>

                      <GlassTD className="text-right">
                        <GlassButton
                          size="xs"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/calls/${call.id}`);
                          }}
                          rightIcon={<ArrowRight className="h-3 w-3" />}
                        >
                          Baxış
                        </GlassButton>
                      </GlassTD>
                    </GlassTR>
                  );
                })}
              </GlassTBody>
            </GlassTable>

            {/* Pagination footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e5e5] px-6 py-4 bg-[#fafafa]">
              <span className="text-xs text-[#6b6b6b] font-mono">
                Cəmi {filteredCalls.length} zəng
              </span>

              <div className="flex items-center gap-2">
                <GlassButton
                  size="xs"
                  variant="secondary"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Əvvəlki
                </GlassButton>

                <span className="text-xs font-mono text-[#0a0a0a] px-2">
                  {safePage} / {pageCount}
                </span>

                <GlassButton
                  size="xs"
                  variant="secondary"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Növbəti
                </GlassButton>
              </div>
            </div>
          </>
        )}
      </GlassTableContainer>
    </div>
  );
}
