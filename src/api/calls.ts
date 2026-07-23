import { delay, http, withFallback } from "./client";
import { mockCalls } from "./mockData";
import type { CallDetail, CallStatus, CallSummary } from "./types";

// Backend (com.starsoft.voint.call.dto.CallResponse) sahe adlari panelin daxili
// tiplerinden ferqlidir (durationSeconds vs durationSec) — burada map olunur.
// callerName/topic backend-de tamamile yoxdur (Call entity-sinde bele sahe yoxdur),
// buna gore panel onlari uydurmur — sadece callerNumber ve languageDetected gosterilir.
interface BackendCallResponse {
  id: string;
  tenantId: string;
  callerNumber: string;
  languageDetected: string | null;
  status: CallStatus;
  durationSeconds: number | null;
  startedAt: string;
  endedAt: string | null;
}

interface BackendCallDetailResponse extends BackendCallResponse {
  fullTranscript: string | null;
  aiSummary: string | null;
}

function toSummary(c: BackendCallResponse): CallSummary {
  return {
    id: c.id,
    callerNumber: c.callerNumber,
    languageDetected: c.languageDetected ?? undefined,
    startedAt: c.startedAt,
    durationSec: c.durationSeconds ?? 0,
    status: c.status,
    resolved: c.status === "RESOLVED",
  };
}

export function getCalls(tenantId: string): Promise<CallSummary[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendCallResponse[]>(
        `/tenants/${tenantId}/calls`,
      );
      return data.map(toSummary);
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
      const { data } = await http.get<BackendCallDetailResponse>(
        `/tenants/${tenantId}/calls/${callId}`,
      );
      return {
        ...toSummary(data),
        summary: data.aiSummary,
        transcript: data.fullTranscript,
      };
    },
    async () => {
      await delay();
      const call = mockCalls.find((c) => c.id === callId);
      if (!call) throw new Error("Zeng tapilmadi");
      return call;
    },
  );
}
