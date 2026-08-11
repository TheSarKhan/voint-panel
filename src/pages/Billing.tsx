import { useEffect, useMemo, useState } from "react";
import { getUsage, listInvoices, type BillingInvoice, type InvoiceStatus, type UsageReport } from "../api/billing";
import {
  Alert,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
  StatCard,
  StatusText,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  type StatusTone,
} from "../components/ui";
import { currentMonth, formatDate, formatMinutes, formatMonth, formatMoney, formatPercent, recentMonths } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Qaralama",
  SENT: "Göndərilib",
  PAID: "Ödənib",
  OVERDUE: "Gecikib",
  CANCELLED: "Ləğv edilib",
};

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  DRAFT: "neutral",
  SENT: "neutral",
  PAID: "ok",
  OVERDUE: "err",
  CANCELLED: "neutral",
};

/** Backend OVERDUE-nu avtomatik qoymur - SENT + keçmiş son tarix = gecikib, ekran özü hesablayır. */
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
  const capTone: StatusTone = capRatio == null ? "neutral" : capRatio >= 1 ? "err" : capRatio >= 0.8 ? "warn" : "ok";

  return (
    <div>
      <PageHeader
        title="Hesablaşma"
        subtitle="Bu müəssisənin aylıq istifadəsi və fakturaları"
        actions={
          <Select
            aria-label="Ay"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
            containerClassName="w-40"
          />
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {!usage ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={`${formatMonth(month)} qaiməsi`} value={formatMoney(usage.invoiceAzn)} />
            <StatCard
              label="İstifadə olunan dəqiqə"
              value={formatMinutes(usage.usage.minutes)}
              hint={
                usage.plan.includedMinutes > 0
                  ? `${usage.plan.includedMinutes} dəq daxildir`
                  : undefined
              }
            />
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Kvota</p>
              {usage.plan.monthlyMinuteCap > 0 && capRatio != null ? (
                <>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">
                    {formatPercent(capRatio)}
                  </p>
                  <p className="mt-1 text-xs">
                    <StatusText tone={capTone}>
                      {capRatio >= 1 ? "Bloklanıb" : capRatio >= 0.8 ? "Hədə yaxın" : "Normal"}
                    </StatusText>
                    <span className="ml-1 text-fg-faint">
                      / {usage.plan.monthlyMinuteCap} dəq həddi
                    </span>
                  </p>
                </>
              ) : (
                <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">—</p>
              )}
            </Card>
          </div>

          {capRatio != null && capRatio >= 1 && (
            <div className="mt-4">
              <Alert tone="err" title="Aylıq həddə çatılıb">
                Bu ay üçün ayrılan dəqiqə həddi dolub - agent yeni zənglərə cavab vermir. Həddi
                artırmaq üçün Voint ilə əlaqə saxlayın.
              </Alert>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-fg">Fakturalar</h2>
        <Card>
          {invoices === null ? (
            <Spinner compact />
          ) : invoices.length === 0 ? (
            <EmptyState message="Hələ faktura yoxdur." />
          ) : (
            <Table>
              <THead>
                <TH>Dövr</TH>
                <TH>Məbləğ</TH>
                <TH>Ödəniş tarixi</TH>
                <TH>Vəziyyət</TH>
              </THead>
              <TBody>
                {invoices.map((i) => (
                  <TR key={i.id}>
                    <TD className="font-medium text-fg">{formatMonth(i.period)}</TD>
                    <TD className="text-fg-muted">{formatMoney(i.totalAmount)}</TD>
                    <TD className="text-fg-muted">{i.dueDate ? formatDate(i.dueDate) : "—"}</TD>
                    <TD>
                      <StatusText tone={STATUS_TONE[effectiveStatus(i)]}>
                        {STATUS_LABEL[effectiveStatus(i)]}
                      </StatusText>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
