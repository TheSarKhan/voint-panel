import { http } from "./client";

// Backend cost/margin sahələrini (providerCost, marginAzn, marginPercent) yalnız platforma
// heyətinə göndərir - bu, tenant hesabına daxil olan biri üçün null gəlir, buna görə bu
// tipdə heç göstərilmir (backend UsageController/TenantBillingController-də redaksiya olunur).

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export interface BillingInvoice {
  id: string;
  tenantId: string;
  period: string;
  status: InvoiceStatus;
  dueDate: string | null;
  monthlyFee: number;
  includedMinutes: number;
  overageMinutes: number;
  overagePerMinute: number;
  usageMinutes: number;
  totalAmount: number;
  lockedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface UsageReport {
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string | null;
  month: string;
  usage: {
    calls: number;
    durationSeconds: number;
    minutes: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    ttsCharacters: number;
  };
  plan: {
    monthlyFee: number;
    includedMinutes: number;
    overagePerMinute: number;
    overageMinutes: number;
    monthlyMinuteCap: number;
    capPercentUsed: number | null;
  };
  invoiceAzn: number;
}

export async function listInvoices(tenantId: string): Promise<BillingInvoice[]> {
  const { data } = await http.get<BillingInvoice[]>(`/tenants/${tenantId}/invoices`);
  return data;
}

export async function getUsage(tenantId: string, month?: string): Promise<UsageReport> {
  const { data } = await http.get<UsageReport>(`/tenants/${tenantId}/usage`, {
    params: month ? { month } : undefined,
  });
  return data;
}
