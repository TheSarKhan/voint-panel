import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCalls } from "../api/calls";
import type { CallStatus, CallSummary } from "../api/types";
import { StatCard } from "../components/StatCard";
import {
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Spinner,
  StatusText,
} from "../components/ui";
import { formatDateTime, formatDuration, formatPercent } from "../lib/format";
import { useFitRows } from "../lib/useFitRows";
import { useTenantId } from "../lib/useTenantId";

const statusLabels: Record<CallStatus, { label: string; tone: "ok" | "warn" | "err" | "neutral" }> = {
  RESOLVED: { label: "Həll olundu", tone: "ok" },
  HANDOFF: { label: "Operatora ötürüldü", tone: "warn" },
  ONGOING: { label: "Davam edir", tone: "neutral" },
};

/** "auto" = ekrana sığan qədər. Qalanları istifadəçi özü seçir; onda scroll gözləniləndir. */
const SIZE_OPTIONS = [
  { value: "auto", label: "Ekrana sığan qədər" },
  { value: "25", label: "25 sətir" },
  { value: "50", label: "50 sətir" },
  { value: "100", label: "100 sətir" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Bütün statuslar" },
  { value: "RESOLVED", label: "Həll olundu" },
  { value: "HANDOFF", label: "Operatora ötürüldü" },
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
  const [sizeChoice, setSizeChoice] = useState("auto");
  const bodyRef = useRef<HTMLTableSectionElement>(null);

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

  // Axtarış/status süzgəci tətbiq olunmuş siyahı - göstəricilər, səhifələmə və cədvəl
  // hamısı BUNDAN hesablanır ki, süzgəc aktivkən "Ümumi zəng" də görünəni əks etdirsin.
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

  // Ölçü yalnız siyahı gələndən sonra mənalıdır: boş cədvəldə tbody-nin yeri başqadır.
  const fitRows = useFitRows(bodyRef, filteredCalls.length > 0);
  // Ölçü hazır olana qədər 10 sətir göstərilir — sıfır sətirlə bir kadr boş cədvəl
  // göstərməkdənsə, az sətirlə başlayıb dəqiqləşdirmək daha az gözə çarpır.
  const pageSize = sizeChoice === "auto" ? (fitRows ?? 10) : Number(sizeChoice);

  const pageCount = Math.max(1, Math.ceil(filteredCalls.length / pageSize));
  // Səhifə həmişə mövcud aralıqda qalır: siyahı kiçilsə (süzgəcdən sonra) 5-ci səhifədə
  // qalmaq boş cədvəl göstərər və bu, "zənglər itdi" kimi oxunur.
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filteredCalls.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredCalls, safePage, pageSize],
  );

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!calls) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Zənglər"
        subtitle="Agentin cavablandırdığı bütün zənglər"
      />

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ümumi zəng"
            value={String(stats.total)}
            hint="Qeydə alınmış bütün zənglər"
          />
          <StatCard
            label="Həll olunma faizi"
            value={formatPercent(stats.resolutionRate)}
            hint={`${stats.handoff} zəng operatora ötürülüb`}
          />
          <StatCard
            label="Cavabsız sual"
            value={String(stats.openQuestions)}
            hint="Bilik bazasında bağlanmamış boşluq"
          />
          <StatCard
            label="Orta müddət"
            value={formatDuration(stats.avgDuration)}
            hint="dəqiqə:saniyə"
          />
        </div>
      )}

      {calls.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Nömrəyə görə axtar…"
            className="max-w-xs"
          />
          <Select
            aria-label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
            containerClassName="w-52"
          />
        </div>
      )}

      <Card>
        {calls.length === 0 ? (
          <EmptyState message="Hələ zəng qeydə alınmayıb." />
        ) : filteredCalls.length === 0 ? (
          <EmptyState message="Axtarışa uyğun zəng tapılmadı." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-faint">
                    <th className="px-5 py-3 font-medium">Nömrə</th>
                    <th className="px-5 py-3 font-medium">Dil</th>
                    <th className="px-5 py-3 font-medium">Tarix</th>
                    <th className="px-5 py-3 font-medium">Müddət</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Bilik bazası</th>
                  </tr>
                </thead>
                <tbody ref={bodyRef}>
                  {visible.map((call) => {
                    const st = statusLabels[call.status];
                    return (
                      // Bütün sətir kliklənir. Əvvəl yalnız nömrə link idi, yəni zəngi açmaq
                      // üçün məhz o yazıya dəymək lazım gəlirdi.
                      <tr
                        key={call.id}
                        onClick={() => navigate(`/calls/${call.id}`)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-surface-2/60"
                      >
                        <td className="px-5 py-3 font-medium text-fg">
                          {call.callerNumber ?? "Naməlum nömrə"}
                        </td>
                        <td className="px-5 py-3 text-fg-muted">
                          {call.languageDetected ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-fg-muted">
                          {formatDateTime(call.startedAt)}
                        </td>
                        <td className="px-5 py-3 text-fg-muted">
                          {formatDuration(call.durationSec)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusText tone={st.tone}>{st.label}</StatusText>
                        </td>
                        {/* Dizayn qaydası: nişan/badge yoxdur — vəziyyət düz rəngli mətndir. */}
                        <td className="px-5 py-3">
                          {call.openQuestionCount > 0 ? (
                            <StatusText tone="warn">
                              {call.openQuestionCount} cavabsız sual
                            </StatusText>
                          ) : (
                            <span className="text-fg-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Səhifələmə brauzerdədir: backend GET /calls düz siyahı qaytarır, yəni bütün
                zənglər onsuz da yüklənib və burada sadəcə göstərilən hissə kəsilir.
                Siyahı minlərə çatanda həll backend-ə səhifələmə əlavə etməkdir. */}
            {/* Pagination öz üst xəttini və boşluğunu özü çəkir — əlavə sarğı ikiqat
                çərçivə yaradır. Bir səhifə qalanda da göstərilir: "27 zəng" sətri
                cədvəlin altında dayanır, yəni sayğac səhifələmədən asılı deyil. */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
              <Select
                containerClassName="w-48"
                aria-label="Səhifədəki sətir sayı"
                value={sizeChoice}
                onChange={(e) => {
                  setSizeChoice(e.target.value);
                  setPage(1);
                }}
                options={SIZE_OPTIONS}
              />
              <Pagination
                page={safePage}
                pageCount={pageCount}
                onChange={setPage}
                totalLabel={`${filteredCalls.length} zəng`}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
