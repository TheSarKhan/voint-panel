import { delay, http, withFallback } from "./client";
import { mockAnalytics } from "./mockData";
import type { AnalyticsOverview } from "./types";

// Backend (com.starsoft.voint.analytics.dto.AnalyticsResponse) sahe adlari panelin daxili
// AnalyticsOverview tipinden ferqlidir (avgDurationSeconds vs avgDurationSec) — burada map olunur.
interface BackendAnalyticsResponse {
  totalCalls: number;
  resolvedCalls: number;
  handoffCalls: number;
  ongoingCalls: number;
  reservationCount: number;
  resolutionRate: number;
  avgDurationSeconds: number;
  callsByDay: { date: string; count: number }[];
  bucketDays: number;
}

/** days: 7 | 30 | 90 - göndərilməsə backend defolt 30 istifadə edir. */
export function getAnalytics(tenantId: string, days?: number): Promise<AnalyticsOverview> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendAnalyticsResponse>(
        `/tenants/${tenantId}/analytics`,
        { params: days ? { days } : undefined },
      );
      return {
        totalCalls: data.totalCalls,
        resolvedCalls: data.resolvedCalls,
        handoffCalls: data.handoffCalls,
        ongoingCalls: data.ongoingCalls,
        resolutionRate: data.resolutionRate,
        reservationCount: data.reservationCount,
        avgDurationSec: data.avgDurationSeconds,
        callsByDay: data.callsByDay,
        bucketDays: data.bucketDays,
      };
    },
    async () => {
      await delay();
      return mockAnalytics;
    },
  );
}
