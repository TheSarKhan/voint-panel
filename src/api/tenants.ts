import { delay, http, withFallback } from "./client";
import { mockTenant } from "./mockData";
import type { Tenant, TenantConfig } from "./types";

export function getTenant(tenantId: string): Promise<Tenant> {
  return withFallback(
    async () => {
      const { data } = await http.get<Tenant>(`/tenants/${tenantId}`);
      return data;
    },
    async () => {
      await delay();
      return mockTenant;
    },
  );
}

export function updateTenantConfig(
  tenantId: string,
  config: TenantConfig,
): Promise<Tenant> {
  return withFallback(
    async () => {
      const { data } = await http.put<Tenant>(
        `/tenants/${tenantId}/config`,
        config,
      );
      return data;
    },
    async () => {
      await delay(350);
      mockTenant.config = { ...config };
      return mockTenant;
    },
  );
}
