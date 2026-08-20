import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Clock,
  PieChart,
  Receipt,
} from "lucide-react";
import { getUsage, listInvoices, type BillingInvoice, type InvoiceStatus, type UsageReport } from "../api/billing";
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
} from "../components/kit";
import { currentMonth, formatDate, formatMinutes, formatMonth, formatMoney, recentMonths } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

const STATUS_LABEL: Record<InvoiceStatus, { label: string; variant: "ok" | "warn" | "err" | "muted" }> = {
  DRAFT: { label: "Qaralama", variant: "muted" },
  SENT: { label: "Göndərilib", variant: "warn" },
  PAID: { label: "Ödənilib", variant: "ok" },
  OVERDUE: { label: "Gecikib", variant: "err" },
  CANCELLED: { label: "Ləğv edilib", variant: "muted" },
};

function effectiveStatus(inv: BillingInvoice): InvoiceStatus {
  if (inv.status === "SENT" && inv.dueDate && new Date(inv.dueDate) < new Date()) return "OVERDUE";
  return inv.status;
}

export function BillingPage() {
  const tenantId = useTenantId();
  const [month, setMonth] = useState(currentMonth());
  const months = useMemo(() => recentMonths(12), []);

  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsage(null);
    getUsage(tenantId, month)
      .then(setUsage)
      .catch((e) => setError(apiErrorText(e, "İstifadə məlumatı yüklənə bilmədi.")));
  }, [tenantId, month]);

  useEffect(() => {
    listInvoices(tenantId)
      .then(setInvoices)
      .catch((e) => setError(apiErrorText(e, "Fakturalar yüklənə bilmədi.")));
  }, [tenantId]);

  const capRatio =
    usage?.plan.monthlyMinuteCap && usage.plan.capPercentUsed != null
      ? usage.plan.capPercentUsed / 100
      : null;

  return (
    <div className="space-y-8 font-sans">
      {/* ── HEADER & MONTH SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight">
            Hesablaşma və Tariflər
          </h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
            Müəssisənin aylıq istifadə statistikası, dəqiqə limiti və rəsmi fakturaları
          </p>
        </div>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 rounded-full border border-[#e5e5e5] bg-white px-4 text-xs sm:text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition-colors shadow-xs cursor-pointer"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* ── 3 METRIC CARDS ── */}
      {usage ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardGlass
            title={`${formatMonth(month)} Qaiməsi`}
            value={formatMoney(usage.invoiceAzn)}
            change={{ value: "Aylıq abunə və aşım", trend: "neutral", label: "cari xərc" }}
            icon={<Receipt className="h-5 w-5" />}
            chartData={[250, 300, 320, 350, 350, usage.invoiceAzn]}
          />

          <StatCardGlass
            title="İstifadə Olunan Dəqiqə"
            value={formatMinutes(usage.usage.minutes)}
            change={{
              value: usage.plan.includedMinutes > 0 ? `${usage.plan.includedMinutes} dəq daxildir` : "Limitsiz",
              trend: "neutral",
              label: "sərfiyyat",
            }}
            icon={<Clock className="h-5 w-5" />}
            chartData={[100, 150, 200, 280, 310, usage.usage.minutes]}
          />

          <StatCardGlass
            title="Kvota və Limit"
            value={capRatio != null ? `${(capRatio * 100).toFixed(0)}%` : "Normal"}
            change={{
              value: usage.plan.monthlyMinuteCap > 0 ? `${usage.plan.monthlyMinuteCap} dəq həddi` : "Limitsiz",
              trend: capRatio && capRatio >= 0.8 ? "down" : "up",
              label: "istifadə dərəcəsi",
            }}
            icon={<PieChart className="h-5 w-5" />}
            chartData={[10, 20, 30, 40, capRatio ? Math.round(capRatio * 100) : 40]}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="h-32 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
        </div>
      )}

      {/* ── INVOICES TABLE ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#0a0a0a] font-semibold text-sm">
          <CreditCard className="h-4 w-4" />
          <span>Fakturalar və Qaimələr</span>
        </div>

        <GlassTableContainer>
          {invoices === null ? (
            <div className="py-12 space-y-3 px-6 animate-pulse">
              <div className="h-4 w-full bg-[#f5f5f5] rounded" />
              <div className="h-4 w-3/4 bg-[#f5f5f5] rounded" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6b6b6b]">
              Hələ heç bir faktura tərtib edilməyib.
            </div>
          ) : (
            <GlassTable>
              <GlassTHead>
                <tr>
                  <GlassTH>Dövr</GlassTH>
                  <GlassTH>Məbləğ</GlassTH>
                  <GlassTH>Son Ödəniş Tarixi</GlassTH>
                  <GlassTH>Vəziyyət</GlassTH>
                </tr>
              </GlassTHead>

              <GlassTBody>
                {invoices.map((i) => {
                  const statusKey = effectiveStatus(i);
                  const st = STATUS_LABEL[statusKey] ?? { label: statusKey, variant: "muted" as const };

                  return (
                    <GlassTR key={i.id}>
                      <GlassTD>
                        <span className="font-semibold text-[#0a0a0a] text-xs sm:text-sm">
                          {formatMonth(i.period)}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="font-mono font-semibold text-[#0a0a0a] text-xs sm:text-sm">
                          {formatMoney(i.totalAmount)}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <span className="text-[#6b6b6b] text-xs">
                          {i.dueDate ? formatDate(i.dueDate) : "—"}
                        </span>
                      </GlassTD>

                      <GlassTD>
                        <StatusText variant={st.variant}>
                          {st.label}
                        </StatusText>
                      </GlassTD>
                    </GlassTR>
                  );
                })}
              </GlassTBody>
            </GlassTable>
          )}
        </GlassTableContainer>
      </div>
    </div>
  );
}
