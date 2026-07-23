import { delay, http, withFallback } from "./client";
import { mockAnalytics } from "./mockData";
import type { AnalyticsOverview } from "./types";

// Backend (com.starsoft.voint.analytics.dto.AnalyticsResponse) sahe adlari panelin daxili
// AnalyticsOverview tipinden ferqlidir (avgDurationSeconds vs avgDurationSec) — burada map olunur.
interface BackendAnalyticsResponse {
  totalCalls: number;
  reservationCount: number;
  resolutionRate: number;
  avgDurationSeconds: number;
  callsByDay: { date: string; count: number }[];
}

export function getAnalytics(tenantId: string): Promise<AnalyticsOverview> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendAnalyticsResponse>(
        `/tenants/${tenantId}/analytics`,
      );
      return {
        totalCalls: data.totalCalls,
        resolutionRate: data.resolutionRate,
        reservationCount: data.reservationCount,
        avgDurationSec: data.avgDurationSeconds,
        callsByDay: data.callsByDay,
      };
    },
    async () => {
      await delay();
      return mockAnalytics;
    },
  );
}
