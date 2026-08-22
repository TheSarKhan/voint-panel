import { delay, http, withFallback } from "./client";

export type CampaignType =
  | "SALES_OUTBOUND"
  | "APPOINTMENT_REMINDER"
  | "PAYMENT_REMINDER"
  | "FEEDBACK_SURVEY"
  | "WINBACK";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type ContactStatus =
  | "PENDING"
  | "QUEUED"
  | "DIALING"
  | "ANSWERED"
  | "BUSY"
  | "NO_ANSWER"
  | "FAILED"
  | "DO_NOT_CALL";

export type CallOutcome =
  | "INTERESTED"
  | "CALLBACK_REQUESTED"
  | "NOT_INTERESTED"
  | "CONVERTED"
  | "UNREACHABLE";

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  agentPrompt: string | null;
  greetingText: string | null;
  callingHoursStart: string;
  callingHoursEnd: string;
  maxRetries: number;
  retryIntervalMinutes: number;
  concurrencyLimit: number;
  totalContacts: number;
  contactedCount: number;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  name: string;
  campaignType: CampaignType;
  agentPrompt?: string;
  greetingText?: string;
  callingHoursStart?: string;
  callingHoursEnd?: string;
  maxRetries?: number;
  retryIntervalMinutes?: number;
  concurrencyLimit?: number;
}

export interface OutboundContact {
  id: string;
  campaignId: string;
  tenantId: string;
  phoneNumber: string;
  customerName: string | null;
  customData: string | null;
  status: ContactStatus;
  callOutcome: CallOutcome | null;
  retryCount: number;
  nextAttemptAt: string | null;
  lastAttemptAt: string | null;
  callId: string | null;
  summary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundContactInput {
  phoneNumber: string;
  customerName?: string;
  customData?: string;
}

// Mock initial data for fallback
let mockCampaigns: Campaign[] = [
  {
    id: "camp-01",
    tenantId: "11111111-1111-1111-1111-111111111111",
    name: "Yaz Endirimi və Yeni Texnikalar",
    campaignType: "SALES_OUTBOUND",
    status: "RUNNING",
    agentPrompt: "Müştəriyə yeni gələn JCB ekskavatorları və 15% yaz endirimi haqqında məlumat ver.",
    greetingText: "Salam! Sizə CES şirkətindən zəng edirik. Yeni texnikalarımız və yaz endirimlərimiz var.",
    callingHoursStart: "10:00",
    callingHoursEnd: "18:00",
    maxRetries: 2,
    retryIntervalMinutes: 60,
    concurrencyLimit: 2,
    totalContacts: 45,
    contactedCount: 32,
    successfulCount: 19,
    failedCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function listCampaigns(tenantId: string): Promise<Campaign[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<Campaign[]>(`/tenants/${tenantId}/campaigns`);
      return data;
    },
    async () => {
      await delay(200);
      return mockCampaigns;
    }
  );
}

export async function getCampaign(tenantId: string, id: string): Promise<Campaign> {
  return withFallback(
    async () => {
      const { data } = await http.get<Campaign>(`/tenants/${tenantId}/campaigns/${id}`);
      return data;
    },
    async () => {
      await delay(200);
      const c = mockCampaigns.find((x) => x.id === id);
      if (!c) throw new Error("Campaign not found");
      return c;
    }
  );
}

export async function createCampaign(
  tenantId: string,
  input: CampaignInput
): Promise<Campaign> {
  return withFallback(
    async () => {
      const { data } = await http.post<Campaign>(`/tenants/${tenantId}/campaigns`, input);
      return data;
    },
    async () => {
      await delay(300);
      const created: Campaign = {
        id: `camp-${Date.now()}`,
        tenantId,
        name: input.name,
        campaignType: input.campaignType,
        status: "DRAFT",
        agentPrompt: input.agentPrompt || null,
        greetingText: input.greetingText || null,
        callingHoursStart: input.callingHoursStart || "10:00",
        callingHoursEnd: input.callingHoursEnd || "18:00",
        maxRetries: input.maxRetries || 2,
        retryIntervalMinutes: input.retryIntervalMinutes || 60,
        concurrencyLimit: input.concurrencyLimit || 1,
        totalContacts: 0,
        contactedCount: 0,
        successfulCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCampaigns = [created, ...mockCampaigns];
      return created;
    }
  );
}

export async function updateCampaign(
  tenantId: string,
  id: string,
  input: Partial<CampaignInput> & { status?: CampaignStatus }
): Promise<Campaign> {
  return withFallback(
    async () => {
      const { data } = await http.put<Campaign>(`/tenants/${tenantId}/campaigns/${id}`, input);
      return data;
    },
    async () => {
      await delay(200);
      mockCampaigns = mockCampaigns.map((c) =>
        c.id === id ? { ...c, ...input, updatedAt: new Date().toISOString() } : c
      );
      return mockCampaigns.find((c) => c.id === id)!;
    }
  );
}

export async function deleteCampaign(tenantId: string, id: string): Promise<void> {
  return withFallback(
    async () => {
      await http.delete(`/tenants/${tenantId}/campaigns/${id}`);
    },
    async () => {
      await delay(200);
      mockCampaigns = mockCampaigns.filter((c) => c.id !== id);
    }
  );
}

export async function startCampaign(tenantId: string, id: string): Promise<Campaign> {
  return withFallback(
    async () => {
      const { data } = await http.post<Campaign>(`/tenants/${tenantId}/campaigns/${id}/start`);
      return data;
    },
    async () => {
      return updateCampaign(tenantId, id, { status: "RUNNING" });
    }
  );
}

export async function pauseCampaign(tenantId: string, id: string): Promise<Campaign> {
  return withFallback(
    async () => {
      const { data } = await http.post<Campaign>(`/tenants/${tenantId}/campaigns/${id}/pause`);
      return data;
    },
    async () => {
      return updateCampaign(tenantId, id, { status: "PAUSED" });
    }
  );
}

export async function addContacts(
  tenantId: string,
  campaignId: string,
  contacts: OutboundContactInput[]
): Promise<OutboundContact[]> {
  return withFallback(
    async () => {
      const { data } = await http.post<OutboundContact[]>(
        `/tenants/${tenantId}/campaigns/${campaignId}/contacts`,
        contacts
      );
      return data;
    },
    async () => {
      await delay(300);
      return [];
    }
  );
}

export async function importContactsFile(
  tenantId: string,
  campaignId: string,
  file: File
): Promise<OutboundContact[]> {
  return withFallback(
    async () => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await http.post<OutboundContact[]>(
        `/tenants/${tenantId}/campaigns/${campaignId}/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data;
    },
    async () => {
      await delay(500);
      return [];
    }
  );
}

export async function getContacts(
  tenantId: string,
  campaignId: string,
  page = 0,
  size = 50
): Promise<{ content: OutboundContact[]; totalElements: number }> {
  return withFallback(
    async () => {
      const { data } = await http.get<{ content: OutboundContact[]; totalElements: number }>(
        `/tenants/${tenantId}/campaigns/${campaignId}/contacts?page=${page}&size=${size}`
      );
      return data;
    },
    async () => {
      await delay(200);
      return { content: [], totalElements: 0 };
    }
  );
}
