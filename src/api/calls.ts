import { delay, http, withFallback } from "./client";
import { mockCalls } from "./mockData";
import type { CallDetail, CallSummary } from "./types";

export function getCalls(tenantId: string): Promise<CallSummary[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<CallSummary[]>(
        `/tenants/${tenantId}/calls`,
      );
      return data;
    },
    async () => {
      await delay();
      return mockCalls.map(({ summary: _s, transcript: _t, ...rest }) => rest);
    },
  );
}

export function getCall(tenantId: string, callId: string): Promise<CallDetail> {
  return withFallback(
    async () => {
      const { data } = await http.get<CallDetail>(
        `/tenants/${tenantId}/calls/${callId}`,
      );
      return data;
    },
    async () => {
      await delay();
      const call = mockCalls.find((c) => c.id === callId);
      if (!call) throw new Error("Zeng tapilmadi");
      return call;
    },
  );
}
