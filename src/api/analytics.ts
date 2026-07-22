import { delay, http, withFallback } from "./client";
import { mockAnalytics } from "./mockData";
import type { AnalyticsOverview } from "./types";

export function getAnalytics(tenantId: string): Promise<AnalyticsOverview> {
  return withFallback(
    async () => {
      const { data } = await http.get<AnalyticsOverview>(
        `/tenants/${tenantId}/analytics`,
      );
      return data;
    },
    async () => {
      await delay();
      return mockAnalytics;
    },
  );
}
