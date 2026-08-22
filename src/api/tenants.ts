import { delay, http, withFallback } from "./client";
import { mockTenant } from "./mockData";
import type { Tenant, TenantConfig } from "./types";

// Backend (com.starsoft.voint.tenant.dto.TenantResponse) duz (flat) obyektdir - panelin
// daxili Tenant tipi ise config-i ayri obyektde saxlayir. Burada map olunur.
interface BackendTenantResponse {
  id: string;
  name: string;
  phoneNumber: string | null;
  greetingText: string | null;
  workingHours: string | null;
  handoffNumber: string | null;
  languageConfig: string | null;
  sttDomain: string | null;
  sttTopic: string | null;
  sttVocabulary: string | null;
  createdAt: string;
}

function toTenant(t: BackendTenantResponse): Tenant {
  return {
    id: t.id,
    name: t.name,
    config: {
      greetingText: t.greetingText ?? "",
      workingHours: t.workingHours ?? "",
      handoffNumber: t.handoffNumber ?? "",
      language: t.languageConfig ?? "",
      sttDomain: t.sttDomain ?? "",
      sttTopic: t.sttTopic ?? "",
      sttVocabulary: t.sttVocabulary ?? "",
    },
  };
}

export function getTenant(tenantId: string): Promise<Tenant> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendTenantResponse>(`/tenants/${tenantId}`);
      return toTenant(data);
    },
    async () => {
      await delay();
      return mockTenant;
    },
  );
}

export function updateTenantConfig(
  tenantId: string,
  config: Partial<TenantConfig>,
): Promise<Tenant> {
  return withFallback(
    async () => {
      const payload: Record<string, unknown> = {};
      if (config.greetingText !== undefined) payload.greetingText = config.greetingText;
      if (config.workingHours !== undefined) payload.workingHours = config.workingHours;
      if (config.handoffNumber !== undefined) payload.handoffNumber = config.handoffNumber;
      if (config.language !== undefined) payload.languageConfig = config.language;
      if (config.sttDomain !== undefined) payload.sttDomain = config.sttDomain;
      if (config.sttTopic !== undefined) payload.sttTopic = config.sttTopic;
      if (config.sttVocabulary !== undefined) payload.sttVocabulary = config.sttVocabulary;

      const { data } = await http.put<BackendTenantResponse>(
        `/tenants/${tenantId}/config`,
        payload,
      );
      return toTenant(data);
    },
    async () => {
      await delay(350);
      mockTenant.config = { ...mockTenant.config, ...config };
      return mockTenant;
    },
  );
}
